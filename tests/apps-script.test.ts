import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { PREFERRED_LENDERS } from "../src/lib/lenders";

const source = readFileSync("apps-script/Code.gs", "utf8");
const lead = { id: "d7334c43-1435-4e59-9f5b-74a0f47bde20", submittedAt: "2026-10-22T10:00:00.000Z", fullName: "Test Applicant", phone: "9876543210", email: "test@example.com", city: "Pune", pincode: "411001", employer: "Example Company", salary: 18000, loanAmount: 300000, salaryBank: "Example Bank", consent: true, consentVersion: "2026-10-22-v2" };
type MigrationReport = { status: string; filledRows: number; invalidTimestampRows: number[] };

function harness() {
  const rows: string[][] = [];
  const formulas: string[][] = [];
  let locked = false;
  let heldExternally = false;
  let releases = 0;
  let throwOnWrite = false;
  let onWrite: (() => void) | undefined;
  let onInsert: (() => void) | undefined;
  let maxColumns = 26;
  const logs: string[] = [];
  const props: Record<string, string> = { WEBHOOK_SECRET: "a".repeat(48), SPREADSHEET_ID: "test-sheet", SHEET_NAME: "Leads" };
  const context = {
    console: { log: (value: string) => logs.push(value) },
    Utilities: { formatDate: (date: Date, timezone: string, pattern: string) => {
      assert.equal(timezone, "Asia/Kolkata");
      assert.equal(pattern, "dd MMM yyyy, hh:mm:ss a");
      // Emulate Google's timezone formatter using an independent platform implementation.
      const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: timezone, day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }).formatToParts(date).map(part => [part.type, part.value]));
      return `${parts.day} ${parts.month} ${parts.year}, ${parts.hour}:${parts.minute}:${parts.second} ${parts.dayPeriod}`;
    } },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (key: string) => props[key] }) },
    ContentService: { MimeType: { JSON: "json" }, createTextOutput: (text: string) => ({ setMimeType: () => text }) },
    LockService: { getScriptLock: () => ({ tryLock: () => { if (locked || heldExternally) return false; locked = true; return true; }, releaseLock: () => { assert.ok(locked); locked = false; releases++; } }) },
    SpreadsheetApp: {
      flush: () => { assert.ok(locked); },
      openById: () => {
        assert.ok(locked, "sheet access must be inside the lock");
        return { getSheetByName: () => ({
          getLastRow: () => rows.length,
          getMaxColumns: () => maxColumns,
          insertColumnsAfter: (after: number, count: number) => {
            assert.ok(locked);
            for (const table of [rows, formulas]) table.forEach(row => { while (row.length < after) row.push(""); row.splice(after, 0, ...Array(count).fill("")); });
            maxColumns += count;
            if (onInsert) { const fn = onInsert; onInsert = undefined; fn(); }
          },
          getRange: (start: number, column = 1, count = 1, width = 1) => {
            const range = {
              setNumberFormat: () => range,
              setValues: (values: string[][]) => { assert.ok(locked); if (throwOnWrite) throw new Error("secret error"); if (onWrite) { const fn = onWrite; onWrite = undefined; fn(); } values.forEach((row, i) => { rows[start - 1 + i] ??= []; row.forEach((value, j) => { rows[start - 1 + i][column - 1 + j] = value; }); }); },
              getValues: () => Array.from({ length: count }, (_, i) => Array.from({ length: width }, (_, j) => rows[start - 1 + i]?.[column - 1 + j] ?? "")),
              getFormulas: () => Array.from({ length: count }, (_, i) => Array.from({ length: width }, (_, j) => formulas[start - 1 + i]?.[column - 1 + j] ?? "")),
              createTextFinder: (id: string) => { const finder = { matchEntireCell: () => finder, useRegularExpression: () => finder, findNext: () => rows.slice(start - 1).some((row) => row[0] === id) }; return finder; },
            };
            return range;
          },
        }) };
      },
    },
  };
  const api = runInNewContext(source + "\n({ post: doPost, migrate: migrateIndianTimeColumn, legacyMigrate: migrateProductInterestColumn, format: formatSubmittedIst });", context);
  const post = api.post as (e: unknown) => string;
  const send = (data: unknown = lead, secret = props.WEBHOOK_SECRET) => JSON.parse(post({ postData: { contents: JSON.stringify({ secret, lead: data }) } }));
  return { rows, formulas, logs, migrate: api.migrate as () => MigrationReport, legacyMigrate: api.legacyMigrate as () => MigrationReport, format: api.format as (value: unknown) => string, send, post, props, releases: () => releases, hold: (value: boolean) => { heldExternally = value; }, failWrite: () => { throwOnWrite = true; }, onWrite: (fn: () => void) => { onWrite = fn; }, onInsert: (fn: () => void) => { onInsert = fn; }, narrow: (count: number) => { maxColumns = count; } };
}
test("receiver creates headers, writes one row and deduplicates references", () => {
  const h = harness();
  assert.equal(h.send().ok, true); assert.equal(h.rows.length, 2); assert.equal(h.rows[0].length, 16);
  assert.equal(h.rows[0][2], "Submitted (IST)");
  assert.equal(h.rows[1][1], lead.submittedAt);
  assert.equal(h.rows[1][2], "22 Oct 2026, 03:30:00 PM IST");
  assert.equal(h.rows[1][3], lead.fullName);
  assert.equal(h.send().duplicate, true); assert.equal(h.rows.length, 2); assert.equal(h.releases(), 2);
});
test("receiver authenticates and validates before touching the sheet", () => {
  const h = harness();
  assert.equal(h.send(lead, "wrong").error, "unauthorized");
  for (const patch of [{ salary: 17999 }, { consent: false }, { id: "bad" }, { phone: "123" }, { submittedAt: "yesterday" }, { loanAmount: "1000" }]) assert.equal(h.send({ ...lead, ...patch }).error, "invalid_lead");
  assert.equal(h.rows.length, 0); assert.equal(h.releases(), 0);
});
test("formula-like values are stored as literal text", () => {
  const h = harness();
  assert.equal(h.send({ ...lead, fullName: '=HYPERLINK("https://example.com")', employer: "  +SUM(1,2)", city: "@command", salaryBank: "-formula" }).ok, true);
  for (const col of [3, 4, 6, 8, 11]) assert.ok(h.rows[1][col].startsWith("'"));
});
test("lock contention prevents interleaved writes; retry deduplicates", () => {
  const h = harness();
  h.onWrite(() => { assert.equal(h.send().error, "busy"); });
  assert.equal(h.send().ok, true);
  assert.equal(h.send().duplicate, true);
  assert.equal(h.rows.length, 2);
  h.hold(true); assert.equal(h.send().error, "busy"); h.hold(false);
  assert.equal(h.send({ ...lead, id: "d7334c43-1435-4e59-9f5b-74a0f47bde21" }).ok, true);
  assert.equal(h.rows.length, 3);
});
test("receiver rejects malformed input, mismatched headers and hides failures", () => {
  const h = harness();
  assert.equal(JSON.parse(h.post({ postData: { contents: "{" } })).ok, false);
  assert.equal(JSON.parse(h.post({ postData: { contents: "a".repeat(20001) } })).error, "invalid_request");
  h.rows.push(["wrong headers"]); assert.equal(h.send().error, "header_mismatch");
  const broken = harness(); broken.failWrite();
  assert.equal(broken.send().error, "request_failed"); assert.equal(broken.releases(), 1);
});

test("product choices are recorded, legacy payloads default, unknown choices fail", () => {
  for (const [productInterest, label] of Object.entries({ personal_loan: "Personal loan", hybrid_flexi: "Hybrid flexi loan", overdraft: "Overdraft facility", not_sure: "Not sure—please guide me" })) {
    const h = harness();
    assert.equal(h.send({ ...lead, productInterest }).ok, true);
    assert.equal(h.rows[1][14], label);
  }
  const h = harness(); h.send(); assert.equal(h.rows[1][14], "Personal loan");
  for (const productInterest of ["", "unknown", "constructor", null, 1]) assert.equal(h.send({ ...lead, productInterest }).error, "invalid_lead");
});

function oldSheet(product: boolean) {
  const h = harness(); h.send({ ...lead, productInterest: "overdraft" });
  h.rows.forEach(row => { row.pop(); row.splice(2, 1); if (!product) row.pop(); });
  return h;
}

test("all lender preferences stay separate from salary bank; omitted values remain compatible", () => {
  const scriptChoices = runInNewContext(source + "\nPREFERRED_LENDERS;");
  assert.deepEqual(Array.from(scriptChoices), [...PREFERRED_LENDERS]);
  for (const preferredLender of PREFERRED_LENDERS) {
    const h = harness();
    assert.equal(h.send({ ...lead, preferredLender }).ok, true);
    assert.equal(h.rows[1][15], preferredLender || "No preference—please guide me");
    assert.equal(h.rows[1][11], lead.salaryBank);
  }
  const h = harness(); h.send();
  assert.equal(h.rows[1][15], "No preference—please guide me");
  for (const preferredLender of ["Unknown", "=SUM(1,2)", null, 1]) assert.equal(h.send({ ...lead, preferredLender }).error, "invalid_lead");
});

test("15-column migration preserves history and notes, resumes after interruption, and records new preferences", () => {
  const h = harness(); h.send({ ...lead, productInterest: "overdraft" });
  h.rows.forEach(row => row.pop());
  assert.equal(h.send({ ...lead, id: "d7334c43-1435-4e59-9f5b-74a0f47bde21", preferredLender: "Piramal Finance" }).ok, true);
  assert.equal(h.rows[2].length, 15);
  const original = h.rows.map(row => [...row]);
  h.rows[0][15] = "Notes"; h.rows[1][15] = "Keep this";
  h.onInsert(() => { assert.equal(h.send().error, "busy"); throw new Error("interrupted"); });
  assert.throws(() => h.migrate(), /interrupted/);
  h.migrate();
  assert.deepEqual(h.rows.map(row => row.slice(0, 15)), original);
  assert.equal(h.rows[0][15], "Preferred bank / NBFC");
  assert.equal(h.rows[1][15], "");
  assert.equal(h.rows[1][16], "Keep this");
  const before = JSON.stringify(h.rows);
  assert.equal(h.migrate().status, "already_migrated");
  assert.equal(JSON.stringify(h.rows), before);
  assert.equal(h.send().duplicate, true);
  assert.equal(h.send({ ...lead, id: "d7334c43-1435-4e59-9f5b-74a0f47bde22", preferredLender: "L&T Finance" }).ok, true);
  assert.equal(h.rows[3][15], "L&T Finance");
});

test("IST conversion handles ordinary dates, midnight, month and year rollover", () => {
  const h = harness();
  const examples = [
    ["2026-10-24T10:00:00.000Z", "24 Oct 2026, 03:30:00 PM IST"],
    ["2026-10-24T18:29:59.000Z", "24 Oct 2026, 11:59:59 PM IST"],
    ["2026-10-24T18:30:00.000Z", "25 Oct 2026, 12:00:00 AM IST"],
    ["2026-10-31T20:00:00.000Z", "01 Nov 2026, 01:30:00 AM IST"],
    ["2026-12-31T20:00:00.000Z", "01 Jan 2027, 01:30:00 AM IST"],
    ["2028-02-29T20:00:00.000Z", "01 Mar 2028, 01:30:00 AM IST"],
  ];
  for (const [utc, expected] of examples) {
    assert.equal(h.format(utc), expected);
    const receiver = harness();
    assert.equal(receiver.send({ ...lead, submittedAt: utc }).ok, true);
    assert.equal(receiver.rows[1][2], expected);
  }
  assert.equal(h.format(new Date(examples[0][0])), examples[0][1]);
  for (const value of ["", "bad", "2026-02-30T10:00:00.000Z", "2026-13-01T00:00:00.000Z", null, 0, new Date(NaN)]) assert.equal(h.format(value), "");
  assert.equal(h.send({ ...lead, submittedAt: "2026-02-30T10:00:00.000Z" }).error, "invalid_lead");
});

test("both older layouts remain writable before migration without misaligning fields", () => {
  for (const product of [false, true]) {
    const h = oldSheet(product);
    assert.equal(h.send().duplicate, true);
    assert.equal(h.send({ ...lead, id: "d7334c43-1435-4e59-9f5b-74a0f47bde21", productInterest: "hybrid_flexi" }).ok, true);
    assert.equal(h.rows[0].length, product ? 14 : 13);
    assert.deepEqual(h.rows[2].slice(1, 13), h.rows[1].slice(1, 13));
    assert.equal(h.rows[2][2], lead.fullName);
    if (product) assert.equal(h.rows[2][13], "Hybrid flexi loan");
    else assert.equal(h.rows[2].length, 13);
  }
});

test("migration preserves all old cells, backfills IST and is idempotent for either old layout", () => {
  for (const product of [false, true]) {
    const h = oldSheet(product);
    const original = h.rows.map(row => [...row]);
    h.narrow(product ? 14 : 13);
    const report = h.migrate();
    assert.equal(report.status, "migrated"); assert.equal(report.filledRows, 1);
    assert.equal(h.rows[0][2], "Submitted (IST)"); assert.equal(h.rows[0][14], "Product interest");
    const restored = h.rows.map(row => { const copy = [...row]; copy.splice(2, 1); return copy.slice(0, original[0].length); });
    assert.deepEqual(restored, original);
    assert.equal(h.rows[1][2], "22 Oct 2026, 03:30:00 PM IST");
    if (!product) assert.ok(!h.rows[1][14], "no invented historical product");
    const migrated = JSON.stringify(h.rows);
    assert.equal(h.migrate().status, "already_migrated"); assert.equal(JSON.stringify(h.rows), migrated);
    assert.equal(h.legacyMigrate().status, "already_migrated");
    assert.equal(h.send().duplicate, true);
    assert.equal(h.send({ ...lead, id: "d7334c43-1435-4e59-9f5b-74a0f47bde21", productInterest: "hybrid_flexi" }).ok, true);
    assert.equal(h.rows[2][2], "22 Oct 2026, 03:30:00 PM IST");
    assert.equal(h.rows[2][14], "Hybrid flexi loan");
  }
});

test("migration shifts trailing operator data and formulas without overwriting them", () => {
  const h = oldSheet(false);
  h.rows[0][13] = "Notes"; h.rows[1][13] = "Keep this";
  h.rows[1][14] = ""; h.formulas[1] = []; h.formulas[1][14] = '=IF(TRUE,"","")';
  h.migrate();
  assert.equal(h.rows[0][16], "Notes"); assert.equal(h.rows[1][16], "Keep this");
  assert.equal(h.formulas[1][17], '=IF(TRUE,"","")');
  const before = JSON.stringify({ rows: h.rows, formulas: h.formulas });
  h.migrate(); assert.equal(JSON.stringify({ rows: h.rows, formulas: h.formulas }), before);
});

test("backfill reports invalid rows and preserves existing IST cells and formulas", () => {
  const h = harness(); h.send();
  h.rows[1][2] = "Existing reviewed IST";
  for (const timestamp of ["", "not a timestamp", "2026-02-30T10:00:00.000Z", "2026-12-31T20:00:00.000Z", lead.submittedAt]) h.rows.push(["old-reference", timestamp, ""]);
  h.formulas[6] = []; h.formulas[6][2] = '=IF(TRUE,"","")';
  const report = h.migrate();
  assert.deepEqual(Array.from(report.invalidTimestampRows), [3, 4, 5]);
  assert.equal(report.filledRows, 1);
  assert.equal(h.rows[1][2], "Existing reviewed IST");
  assert.equal(h.rows[5][2], "01 Jan 2027, 01:30:00 AM IST");
  assert.equal(h.rows[6][2], ""); assert.equal(h.formulas[6][2], '=IF(TRUE,"","")');
  assert.equal(h.migrate().filledRows, 0);
  assert.deepEqual(JSON.parse(h.logs[0]).invalidTimestampRows, [3, 4, 5]);
  assert.ok(!h.logs.join("").includes(lead.fullName));
});

test("migration rejects wrong/formula headers, shares the writer lock and recovers after insertion failure", () => {
  const bad = harness(); bad.rows.push(["wrong"]);
  assert.throws(() => bad.migrate(), /header_mismatch/);
  const formula = oldSheet(true); formula.formulas[0] = ['="Reference"'];
  assert.throws(() => formula.migrate(), /header_mismatch/);
  const h = oldSheet(true);
  h.hold(true); assert.throws(() => h.migrate(), /busy/); h.hold(false);
  h.onInsert(() => { assert.equal(h.send().error, "busy"); throw new Error("interrupted after insert"); });
  assert.throws(() => h.migrate(), /interrupted/);
  assert.equal(h.rows[0][2], "");
  assert.equal(h.send().error, "header_mismatch");
  assert.equal(h.migrate().filledRows, 1);
  assert.equal(h.rows[0].length, 16, "retry must not insert a second IST column");
  const empty = harness(); empty.narrow(10); empty.onWrite(() => assert.equal(empty.send().error, "busy"));
  assert.equal(empty.migrate().status, "migrated"); assert.equal(empty.rows.length, 1);
  assert.equal(empty.send().ok, true);
});
