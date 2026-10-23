import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import Home from "../src/app/page";
import Privacy from "../src/app/privacy/page";

test("landing page presents one calculator and enquiry form before supporting content", () => {
  const doc = new JSDOM(renderToStaticMarkup(createElement(Home))).window.document;
  assert.equal(doc.querySelectorAll("h1").length, 1);
  assert.equal(doc.querySelector("h1")?.textContent, "Apply for a personal loan, hybrid flexi loan or overdraft.");
  assert.equal(doc.querySelectorAll("#emi-calculator").length, 1);
  assert.equal(doc.querySelectorAll("#apply form").length, 1);
  assert.deepEqual([...doc.querySelectorAll(".tools-grid > *")].map(node => node.className), ["emi-card", "enquiry-form", "callback-steps"]);
  assert.equal(doc.querySelectorAll(".financial-grid,.possibilities-section,.process-section,.faq-mark,.calculator-hero,.enquiry-grid").length, 0);
  assert.equal(doc.querySelectorAll(".callback-steps li").length, 3);
  assert.equal(doc.querySelectorAll(".bank-section img").length, 6);
  assert.equal(doc.querySelectorAll(".faq-content details").length, 7);
  for (const link of doc.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')) {
    assert.ok(doc.getElementById(link.getAttribute("href")!.slice(1)), `Missing anchor ${link.getAttribute("href")}`);
  }
  const form = doc.querySelector("#apply")!;
  assert.equal(form.querySelector("h2")?.textContent, "Tell us what you need");
  assert.equal(form.querySelector('button[type="submit"]')?.textContent?.trim(), "Submit enquiry");
  assert.match(doc.querySelector(".emi-handoff-note")?.textContent || "", /Nothing is submitted yet/);
  assert.doesNotMatch(doc.querySelector(".faq-content")?.textContent || "", /Google Sheets|Gmail/);
  assert.match(doc.querySelector(".bank-section .bank-caption")?.textContent || "", /do not indicate lending partnerships/);
  assert.equal(doc.querySelectorAll(".lender-list li").length, 3);
  assert.match(doc.querySelector(".lender-list")!.textContent!, /Aditya Birla Capital/);
});

test("privacy notice distinguishes local calculator use from submitting an enquiry", () => {
  const doc = new JSDOM(renderToStaticMarkup(createElement(Privacy))).window.document;
  assert.match(doc.body.textContent || "", /calculations run in your browser without sending/);
  assert.match(doc.body.textContent || "", /Form details are sent only when you submit the form with contact consent/);
  assert.match(doc.body.textContent || "", /Google Sheet/);
  assert.match(doc.body.textContent || "", /tap Send in WhatsApp/);
});
