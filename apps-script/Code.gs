/** Paste into Google Sheets > Extensions > Apps Script.
 * Script Properties: SPREADSHEET_ID, SHEET_NAME, WEBHOOK_SECRET (32+ characters).
 * Deploy as a Web app: Execute as Me; access Anyone. Keep the spreadsheet private.
 */
var LEGACY_HEADERS = ["Reference", "Submitted (UTC)", "Name", "Phone", "Email", "City", "PIN code", "Employer", "Monthly salary", "Requested loan", "Salary bank", "Contact consent", "Consent version"];
var PRODUCT_HEADERS = LEGACY_HEADERS.concat(["Product interest"]);
var IST_HEADERS = LEGACY_HEADERS.slice(0, 2).concat(["Submitted (IST)"], LEGACY_HEADERS.slice(2));
var LEAD_HEADERS = IST_HEADERS.concat(["Product interest"]);
var PRODUCT_LABELS = { personal_loan: "Personal loan", hybrid_flexi: "Hybrid flexi loan", overdraft: "Overdraft facility", not_sure: "Not sure—please guide me" };

function productLabel(lead) {
  // Older clients only offered personal loans. Unknown values are never defaulted.
  var key = lead.productInterest === undefined ? "personal_loan" : lead.productInterest;
  return typeof key === "string" && Object.prototype.hasOwnProperty.call(PRODUCT_LABELS, key) ? PRODUCT_LABELS[key] : null;
}

function submittedDate(value) {
  if (Object.prototype.toString.call(value) === "[object Date]") return Number.isFinite(value.getTime()) ? value : null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) return null;
  var date = new Date(value);
  // Reject calendar overflow (e.g. 30 February) rather than silently normalising it.
  var normalised = value.indexOf(".") === -1 ? value.replace("Z", ".000Z") : value;
  return Number.isFinite(date.getTime()) && date.toISOString() === normalised ? date : null;
}

function formatSubmittedIst(value) {
  var date = submittedDate(value);
  return date ? Utilities.formatDate(date, "Asia/Kolkata", "dd MMM yyyy, hh:mm:ss a") + " IST" : "";
}

function ensureColumns(sheet, count) {
  var existing = sheet.getMaxColumns();
  if (existing < count) sheet.insertColumnsAfter(existing, count - existing);
}

function sheetLayout(sheet, allowPending) {
  var count = Math.min(LEAD_HEADERS.length, sheet.getMaxColumns());
  var range = sheet.getRange(1, 1, 1, count);
  var headers = range.getValues()[0], formulas = range.getFormulas()[0];
  var choices = [
    { headers: LEAD_HEADERS, ist: true, product: true },
    { headers: IST_HEADERS, ist: true, product: false },
    { headers: PRODUCT_HEADERS, ist: false, product: true },
    { headers: LEGACY_HEADERS, ist: false, product: false }
  ];
  for (var i = 0; i < choices.length; i++) {
    var choice = choices[i];
    var pending = allowPending && choice.ist && headers[2] === "" && !formulas[2];
    if (choice.headers.every(function (header, col) { return !formulas[col] && (header === headers[col] || (pending && col === 2)); })) {
      choice.pendingIstHeader = !!pending;
      return choice;
    }
  }
  return null;
}

/** Deploy this receiver first, then run from the Apps Script editor as the owner.
 * Retries fill only blank IST cells; existing data/formulas are preserved.
 */
function migrateIndianTimeColumn() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error("busy: retry migration later");
  try {
    var props = PropertiesService.getScriptProperties();
    var id = props.getProperty("SPREADSHEET_ID"), tab = props.getProperty("SHEET_NAME");
    if (!id || !tab) throw new Error("not_configured");
    var sheet = SpreadsheetApp.openById(id).getSheetByName(tab);
    if (!sheet) throw new Error("missing_sheet");
    var lastRow = sheet.getLastRow();
    var report = { status: "already_migrated", filledRows: 0, invalidTimestampRows: [] };
    if (lastRow === 0) {
      ensureColumns(sheet, LEAD_HEADERS.length);
      sheet.getRange(1, 1, 1, LEAD_HEADERS.length).setValues([LEAD_HEADERS]);
      report.status = "migrated";
    } else {
      var layout = sheetLayout(sheet, true);
      if (!layout) throw new Error("header_mismatch");
      if (!layout.ist) {
        sheet.insertColumnsAfter(2, 1);
        report.status = "migrated";
      }
      if (!layout.ist || layout.pendingIstHeader) {
        sheet.getRange(1, 3, 1, 1).setNumberFormat("@").setValues([["Submitted (IST)"]]);
        report.status = "migrated";
      }
      if (!layout.product) {
        ensureColumns(sheet, LEAD_HEADERS.length);
        var tail = sheet.getRange(1, 15, lastRow, 1);
        var tailValues = tail.getValues(), tailFormulas = tail.getFormulas();
        // Preserve operator notes or formulas after the known schema by shifting them.
        if (tailValues.some(function (row, i) { return row[0] !== "" || tailFormulas[i][0] !== ""; })) sheet.insertColumnsAfter(14, 1);
        sheet.getRange(1, 15, 1, 1).setNumberFormat("@").setValues([["Product interest"]]);
        report.status = "migrated";
      }
      if (lastRow > 1) {
        var dates = sheet.getRange(2, 2, lastRow - 1, 2).getValues();
        var istFormulas = sheet.getRange(2, 3, lastRow - 1, 1).getFormulas();
        var batch = [], start = 0;
        function flushBatch() {
          if (!batch.length) return;
          sheet.getRange(start, 3, batch.length, 1).setNumberFormat("@").setValues(batch);
          report.filledRows += batch.length;
          batch = [];
        }
        dates.forEach(function (row, i) {
          var formatted = formatSubmittedIst(row[0]);
          if (!formatted) report.invalidTimestampRows.push(i + 2);
          if (formatted && row[1] === "" && !istFormulas[i][0]) {
            if (!batch.length) start = i + 2;
            batch.push([formatted]);
          } else flushBatch();
        });
        flushBatch();
      }
    }
    SpreadsheetApp.flush();
    if (report.filledRows) report.status = "migrated";
    console.log(JSON.stringify(report)); // Counts and sheet row numbers only; no applicant data.
    return report;
  } finally { lock.releaseLock(); }
}

// Retained for operators following older setup instructions; now upgrades both columns.
function migrateProductInterestColumn() { return migrateIndianTimeColumn(); }

function jsonReply(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}

function validLead(lead) {
  if (!lead || typeof lead !== "object" || Array.isArray(lead)) return false;
  if (!productLabel(lead)) return false;
  var bounds = { fullName: [2, 100], email: [3, 254], city: [2, 100], employer: [2, 150], salaryBank: [2, 100], consentVersion: [1, 80] };
  for (var name in bounds) {
    if (typeof lead[name] !== "string" || lead[name].trim().length < bounds[name][0] || lead[name].length > bounds[name][1]) return false;
  }
  return typeof lead.id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lead.id)
    && typeof lead.submittedAt === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(lead.submittedAt) && submittedDate(lead.submittedAt) !== null
    && typeof lead.phone === "string" && /^[6-9]\d{9}$/.test(lead.phone)
    && typeof lead.pincode === "string" && /^[1-9]\d{5}$/.test(lead.pincode)
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)
    && typeof lead.salary === "number" && Number.isFinite(lead.salary) && lead.salary >= 18000 && lead.salary <= 100000000
    && typeof lead.loanAmount === "number" && Number.isFinite(lead.loanAmount) && lead.loanAmount > 0 && lead.loanAmount <= 100000000
    && lead.consent === true;
}

function safeCell(value) {
  var text = String(value).replace(/[\r\n\t]+/g, " ");
  // Force potentially executable content to literal text, including leading whitespace.
  return /^[\s\u0000-\u001f]*[=+@\-]/.test(text) ? "'" + text : text;
}

function doPost(e) {
  var lock;
  var locked = false;
  try {
    if (!e || !e.postData || typeof e.postData.contents !== "string" || e.postData.contents.length > 20000) return jsonReply({ ok: false, error: "invalid_request" });
    var payload = JSON.parse(e.postData.contents);
    var props = PropertiesService.getScriptProperties();
    var secret = props.getProperty("WEBHOOK_SECRET");
    if (!secret || secret.length < 32 || !payload || typeof payload.secret !== "string" || payload.secret !== secret) return jsonReply({ ok: false, error: "unauthorized" });
    if (!validLead(payload.lead)) return jsonReply({ ok: false, error: "invalid_lead" });
    var spreadsheetId = props.getProperty("SPREADSHEET_ID");
    var tabName = props.getProperty("SHEET_NAME");
    if (!spreadsheetId || !tabName) return jsonReply({ ok: false, error: "not_configured" });

    lock = LockService.getScriptLock();
    locked = lock.tryLock(5000);
    if (!locked) return jsonReply({ ok: false, error: "busy" });
    var sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(tabName);
    if (!sheet) return jsonReply({ ok: false, error: "missing_sheet" });
    var lead = payload.lead;
    var lastRow = sheet.getLastRow();
    var layout;
    if (lastRow === 0) {
      ensureColumns(sheet, LEAD_HEADERS.length);
      sheet.getRange(1, 1, 1, LEAD_HEADERS.length).setValues([LEAD_HEADERS]);
      lastRow = 1;
      layout = { ist: true, product: true };
    } else {
      layout = sheetLayout(sheet, false);
      if (!layout) return jsonReply({ ok: false, error: "header_mismatch" });
    }
    if (lastRow > 1 && sheet.getRange(2, 1, lastRow - 1, 1).createTextFinder(lead.id).matchEntireCell(true).useRegularExpression(false).findNext()) {
      return jsonReply({ ok: true, reference: lead.id, duplicate: true });
    }
    var row = [lead.id, lead.submittedAt, lead.fullName, "+91" + lead.phone, lead.email, lead.city, lead.pincode, lead.employer,
      "INR " + lead.salary.toLocaleString("en-IN"), "INR " + lead.loanAmount.toLocaleString("en-IN"), lead.salaryBank, "Yes", lead.consentVersion];
    if (layout.ist) row.splice(2, 0, formatSubmittedIst(lead.submittedAt));
    if (layout.product) row.push(productLabel(lead));
    row = row.map(safeCell);
    sheet.getRange(lastRow + 1, 1, 1, row.length).setNumberFormat("@").setValues([row]);
    SpreadsheetApp.flush();
    return jsonReply({ ok: true, reference: lead.id });
  } catch (_error) {
    // Never expose secrets, applicant data or Google exception details.
    return jsonReply({ ok: false, error: "request_failed" });
  } finally {
    if (lock && locked) lock.releaseLock();
  }
}

function doGet() {
  return jsonReply({ ok: false, error: "post_required" });
}
