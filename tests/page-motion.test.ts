import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import { BankMarquee, DiagramSequence, FeatureStrip, Reveal } from "../src/components/page-motion";

const dom = new JSDOM("<!doctype html><html><body></body></html>");
Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true });
const { render, cleanup, act, fireEvent } = require("@testing-library/react") as typeof import("@testing-library/react");
afterEach(() => { cleanup(); mock.restoreAll(); document.body.replaceChildren(); Reflect.deleteProperty(window, "IntersectionObserver"); Reflect.deleteProperty(document, "visibilityState"); });

function media(reduced: boolean, desktop = true) {
  const queries: Array<{ query: string; matches: boolean; listeners: Set<() => void> }> = [];
  Object.defineProperty(window, "matchMedia", { configurable: true, value: (query: string) => {
    const item = { query, matches: query.includes("min-width") ? desktop && !reduced : reduced, listeners: new Set<() => void>() };
    queries.push(item);
    return Object.assign(item, { addEventListener: (_: string, fn: () => void) => item.listeners.add(fn), removeEventListener: (_: string, fn: () => void) => item.listeners.delete(fn) });
  } });
  return (nextReduced: boolean, nextDesktop = true) => act(() => {
    reduced = nextReduced; desktop = nextDesktop;
    for (const item of queries) { item.matches = item.query.includes("min-width") ? desktop && !reduced : reduced; item.listeners.forEach(fn => fn()); }
  });
}
function visibility(value: "visible" | "hidden") {
  act(() => { Object.defineProperty(document, "visibilityState", { configurable: true, value }); document.dispatchEvent(new dom.window.Event("visibilitychange")); });
}
function playback(container: HTMLElement) { return (container.querySelector(".feature-track") as HTMLElement).style.animationPlayState; }
function observer() {
  let callback: IntersectionObserverCallback;
  const calls = { observed: 0, unobserved: 0, disconnected: 0 };
  class Observer {
    constructor(cb: IntersectionObserverCallback) { callback = cb; }
    observe() { calls.observed++; }
    unobserve() { calls.unobserved++; }
    disconnect() { calls.disconnected++; }
  }
  Object.defineProperty(window, "IntersectionObserver", { configurable: true, value: Observer });
  return { calls, enter: (intersecting = true) => act(() => callback([{ isIntersecting: intersecting } as IntersectionObserverEntry], {} as IntersectionObserver)) };
}

test("feature strip has four static features, no duplicate list or controls, even without JavaScript", () => {
  const html = renderToStaticMarkup(createElement(FeatureStrip));
  const doc = new JSDOM(html).window.document;
  assert.equal(doc.querySelectorAll("ul").length, 1);
  assert.equal(doc.querySelectorAll("li").length, 4);
  assert.equal(doc.querySelectorAll("button,[aria-hidden=true]").length, 0);
  assert.match(html, /data-motion="false"/);
  assert.match(html, /animation-play-state:paused/);
  assert.doesNotMatch(html, /reveal-arrived/);
});

test("desktop marquee runs continuously without controls, hover, focus or visibility pauses", () => {
  media(false);
  const ui = render(createElement(FeatureStrip));
  assert.equal(playback(ui.container), "running", "does not require an intersection observer");
  assert.equal(ui.queryByRole("button"), null);
  assert.equal(ui.getAllByRole("list").length, 1);
  assert.equal(ui.getAllByRole("listitem").length, 4);
  assert.equal(ui.container.querySelectorAll(".feature-copy li").length, 4);
  const strip = ui.getByRole("region", { name: "Enquiry at a glance" });
  fireEvent.pointerEnter(strip, { pointerType: "mouse" });
  assert.equal(playback(ui.container), "running");
  const form = document.createElement("form"); form.id = "apply";
  const input = document.createElement("input"); form.append(input); document.body.append(form);
  act(() => input.focus()); assert.equal(playback(ui.container), "running");
  visibility("hidden"); assert.equal(playback(ui.container), "running");
  visibility("visible"); assert.equal(playback(ui.container), "running");
});

test("marquee responds to mobile and reduced-motion changes without adding controls", () => {
  const setMedia = media(false);
  const ui = render(createElement(FeatureStrip));
  for (const [reduced, desktop] of [[true, true], [false, false], [false, true]]) {
    setMedia(reduced, desktop);
    const enabled = desktop && !reduced;
    assert.equal(playback(ui.container), enabled ? "running" : "paused");
    assert.equal(!!ui.container.querySelector(".feature-copy"), enabled);
    assert.equal(ui.queryByRole("button"), null);
    assert.equal(ui.getAllByRole("listitem").length, 4);
  }
});

test("mobile, reduced motion and missing media APIs keep the feature strip static", () => {
  for (const [reduced, desktop] of [[true, true], [false, false]]) {
    media(reduced, desktop);
    const ui = render(createElement(FeatureStrip));
    assert.equal(ui.queryByRole("button"), null);
    assert.equal(ui.getAllByRole("listitem").length, 4);
    assert.equal(playback(ui.container), "paused");
    cleanup();
  }
  Reflect.deleteProperty(window, "matchMedia");
  const ui = render(createElement(FeatureStrip));
  assert.equal(ui.queryByRole("button"), null);
  assert.equal(playback(ui.container), "paused");
});

test("bank marquee renders a static original without JavaScript and hides its moving duplicate from screen readers", () => {
  const children = createElement("img", { src: "/banks/sbi.png", alt: "State Bank of India" });
  const html = renderToStaticMarkup(createElement(BankMarquee, { children }));
  assert.equal(new JSDOM(html).window.document.querySelectorAll("img").length, 1);
  assert.match(html, /data-motion="false"/);
  const setMedia = media(false);
  const ui = render(createElement(BankMarquee, { children }));
  assert.equal(ui.getAllByRole("img").length, 1);
  assert.equal(ui.container.querySelectorAll("img").length, 2);
  assert.equal(ui.container.querySelector(".bank-copy")?.getAttribute("aria-hidden"), "true");
  assert.equal(ui.queryByRole("button"), null);
  for (const [reduced, desktop] of [[true, true], [false, false], [false, true]]) {
    setMedia(reduced, desktop);
    const enabled = desktop && !reduced;
    assert.equal(ui.container.querySelector(".bank-marquee")?.getAttribute("data-motion"), String(enabled));
    assert.equal(!!ui.container.querySelector(".bank-copy"), enabled);
    assert.equal(ui.getAllByRole("img").length, 1);
  }
});

test("diagram entrances run once and remain settled after reduced-motion changes", () => {
  const setMedia = media(false);
  const ui = render(createElement(DiagramSequence, { children: "Diagrams" }));
  const grid = ui.getByText("Diagrams");
  assert.ok(grid.classList.contains("diagram-sequence"));
  ui.rerender(createElement(DiagramSequence, { children: "Diagrams" }));
  setMedia(true); assert.equal(grid.classList.contains("diagram-sequence"), false);
  setMedia(false); assert.equal(grid.classList.contains("diagram-sequence"), false, "do not replay a completed/cancelled entrance");
});

test("below-fold reveals animate once on entry, cap stagger and disconnect on unmount", () => {
  media(false);
  const io = observer();
  const ui = render(createElement(Reveal, { children: "A section", delay: 400 }));
  const section = ui.getByText("A section");
  assert.equal(section.style.animationDelay, "160ms");
  assert.equal(section.className, "", "content remains visible before an intersection arrives");
  io.enter(false);
  assert.equal(section.className, "");
  io.enter();
  assert.equal(section.className, "reveal-arrived");
  io.enter();
  assert.equal(io.calls.unobserved, 1);
  ui.unmount();
  assert.equal(io.calls.disconnected, 1);
});

test("above-fold content is not animated or observed", () => {
  media(false);
  const io = observer();
  mock.method(HTMLElement.prototype, "getBoundingClientRect", () => ({ top: 40, bottom: 100 }) as DOMRect);
  const ui = render(createElement(Reveal, { children: "Already visible" }));
  assert.equal(io.calls.observed, 0);
  assert.equal(ui.getByText("Already visible").className, "");
});

test("reduced motion and unavailable browser APIs leave content visible", () => {
  media(true);
  const io = observer();
  const ui = render(createElement(Reveal, { children: "Reduced motion" }));
  assert.equal(io.calls.observed, 0);
  assert.equal(ui.getByText("Reduced motion").className, "");
  cleanup();
  media(false);
  Reflect.deleteProperty(window, "IntersectionObserver");
  const fallback = render(createElement(Reveal, { children: "No observer" }));
  assert.equal(fallback.getByText("No observer").className, "");
  cleanup();
  Reflect.deleteProperty(window, "matchMedia");
  assert.equal(render(createElement(Reveal, { children: "No media API" })).getByText("No media API").className, "");
});
