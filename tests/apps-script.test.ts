import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

const source = readFileSync("apps-script/Code.gs", "utf8");
const lead = { id: "d7334c43-1435-4e59-9f5b-74a0f47bde20", submittedAt: "2026-10-22T10:00:00.000Z", fullName: "Test Applicant", phone: "9876543210", email: "test@example.com", city: "Pune", pincode: "411001", employer: "Example Company", salary: 18000, loanAmount: 300000, salaryBank: "Example Bank", consent: true, consentVersion: "2026-10-22-v2" };

function harness() {
  const rows: string[][] = [];
  let locked = false;
  let heldExternally = false;
  let releases = 0;
  let throwOnWrite = false;
  let onWrite: (() => void) | undefined;
  const props: Record<string, string> = { WEBHOOK_SECRET: "a".repeat(48), SPREADSHEET_ID: "test-sheet", SHEET_NAME: "Leads" };
  const context = {
    PropertiesService: { getScriptProperties: () => ({ getProperty: (key: string) => props[key] }) },
    ContentService: { MimeType: { JSON: "json" }, createTextOutput: (text: string) => ({ setMimeType: () => text }) },
    LockService: { getScriptLock: () => ({ tryLock: () => { if (locked || heldExternally) return false; locked = true; return true; }, releaseLock: () => { assert.ok(locked); locked = false; releases++; } }) },
    SpreadsheetApp: {
      flush: () => { assert.ok(locked); },
      openById: () => {
        assert.ok(locked, "sheet access must be inside the lock");
        return { getSheetByName: () => ({
          getLastRow: () => rows.length,
          getRange: (start: number) => {
            const range = {
              setNumberFormat: () => range,
              setValues: (values: string[][]) => { assert.ok(locked); if (throwOnWrite) throw new Error("secret error"); if (onWrite) { const fn = onWrite; onWrite = undefined; fn(); } rows[start - 1] = Array.from(values[0]); },
              getValues: () => [rows[start - 1]],
              createTextFinder: (id: string) => { const finder = { matchEntireCell: () => finder, useRegularExpression: () => finder, findNext: () => rows.slice(start - 1).some((row) => row[0] === id) }; return finder; },
            };
            return range;
          },
        }) };
      },
    },
  };
  const post = runInNewContext(source + "\ndoPost;", context) as (e: unknown) => string;
  const send = (data: unknown = lead, secret = props.WEBHOOK_SECRET) => JSON.parse(post({ postData: { contents: JSON.stringify({ secret, lead: data }) } }));
  return { rows, send, post, props, releases: () => releases, hold: (value: boolean) => { heldExternally = value; }, failWrite: () => { throwOnWrite = true; }, onWrite: (fn: () => void) => { onWrite = fn; } };
}
test("receiver creates headers, writes one row and deduplicates references", () => {
  const h = harness();
  assert.equal(h.send().ok, true); assert.equal(h.rows.length, 2); assert.equal(h.rows[0].length, 13);
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
  for (const col of [2, 3, 5, 7, 10]) assert.ok(h.rows[1][col].startsWith("'"));
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
