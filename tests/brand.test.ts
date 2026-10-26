import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import sharp from "sharp";
import { JSDOM } from "jsdom";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Home from "../src/app/page";

test("brand SVGs are self-contained outlines and the root favicon matches the reusable mark", () => {
  for (const name of ["loanmitra-india", "lm-monogram"]) {
    const source = readFileSync(`public/brand/${name}.svg`, "utf8");
    const doc = new JSDOM(source, { contentType: "image/svg+xml" }).window.document;
    assert.equal(doc.querySelector("parsererror"), null);
    assert.ok(doc.documentElement.getAttribute("viewBox"));
    assert.ok(doc.querySelectorAll("path").length);
    assert.match(doc.querySelector("title")!.textContent!, /LoanMitra India/);
    assert.equal(doc.querySelectorAll("text,image,script,foreignObject,style,[href]").length, 0);
  }
  assert.equal(readFileSync("src/app/icon.svg", "utf8"), readFileSync("public/brand/lm-monogram.svg", "utf8"));
});

test("favicon embeds three valid sizes and Apple icon is opaque 180px", async () => {
  const ico = readFileSync("src/app/favicon.ico");
  assert.equal(ico.readUInt16LE(0), 0);
  assert.equal(ico.readUInt16LE(2), 1);
  assert.equal(ico.readUInt16LE(4), 3);
  for (const [index, size] of [16, 32, 48].entries()) {
    const at = 6 + index * 16;
    assert.equal(ico[at], size); assert.equal(ico[at + 1], size);
    const bytes = ico.readUInt32LE(at + 8), offset = ico.readUInt32LE(at + 12);
    assert.ok(offset + bytes <= ico.length);
    const metadata = await sharp(ico.subarray(offset, offset + bytes)).metadata();
    assert.equal(metadata.width, size); assert.equal(metadata.height, size);
  }
  const apple = sharp("src/app/apple-icon.png");
  const metadata = await apple.metadata();
  assert.equal(metadata.width, 180); assert.equal(metadata.height, 180);
  assert.equal((await apple.stats()).isOpaque, true);
});

test("header wordmark retains one accessible homepage link and intrinsic dimensions", () => {
  const doc = new JSDOM(renderToStaticMarkup(createElement(Home))).window.document;
  const link = doc.querySelector('.brand[aria-label="LoanMitra India home"]')!;
  assert.equal(link.getAttribute("href"), "/");
  const img = link.querySelector("img")!;
  assert.equal(img.getAttribute("src"), "/brand/loanmitra-india.svg");
  assert.equal(img.getAttribute("alt"), "");
  assert.equal(img.getAttribute("width"), "350");
  assert.equal(img.getAttribute("height"), "96");
  assert.equal(doc.querySelectorAll(".brand-icon,.brand-india").length, 0);
});
