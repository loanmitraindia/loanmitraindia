/** Paste into Google Sheets > Extensions > Apps Script.
 * Script Properties: SPREADSHEET_ID, SHEET_NAME, WEBHOOK_SECRET (32+ characters).
 * Deploy as a Web app: Execute as Me; access Anyone. Keep the spreadsheet private.
 */
var LEAD_HEADERS = ["Reference", "Submitted (UTC)", "Name", "Phone", "Email", "City", "PIN code", "Employer", "Monthly salary", "Requested loan", "Salary bank", "Contact consent", "Consent version"];

function jsonReply(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}

function validLead(lead) {
  if (!lead || typeof lead !== "object" || Array.isArray(lead)) return false;
  var bounds = { fullName: [2, 100], email: [3, 254], city: [2, 100], employer: [2, 150], salaryBank: [2, 100], consentVersion: [1, 80] };
  for (var name in bounds) {
    if (typeof lead[name] !== "string" || lead[name].trim().length < bounds[name][0] || lead[name].length > bounds[name][1]) return false;
  }
  return typeof lead.id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lead.id)
    && typeof lead.submittedAt === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(lead.submittedAt) && Number.isFinite(Date.parse(lead.submittedAt))
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
    if (lastRow === 0) {
      sheet.getRange(1, 1, 1, LEAD_HEADERS.length).setValues([LEAD_HEADERS]);
      lastRow = 1;
    } else {
      var headers = sheet.getRange(1, 1, 1, LEAD_HEADERS.length).getValues()[0];
      if (headers.some(function (header, i) { return header !== LEAD_HEADERS[i]; })) return jsonReply({ ok: false, error: "header_mismatch" });
    }
    if (lastRow > 1 && sheet.getRange(2, 1, lastRow - 1, 1).createTextFinder(lead.id).matchEntireCell(true).useRegularExpression(false).findNext()) {
      return jsonReply({ ok: true, reference: lead.id, duplicate: true });
    }
    var row = [lead.id, lead.submittedAt, lead.fullName, "+91" + lead.phone, lead.email, lead.city, lead.pincode, lead.employer,
      "INR " + lead.salary.toLocaleString("en-IN"), "INR " + lead.loanAmount.toLocaleString("en-IN"), lead.salaryBank, "Yes", lead.consentVersion].map(safeCell);
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
