# Verification — 26 October 2026

## Marquee spacing correction

- Both moving lists used space-between within a 1240px group but only a small trailing padding between copies, creating a visibly tighter seam. Changed moving groups to space-around with symmetric item margins and no asymmetric group padding. Adjacent half-spaces now combine into the same gap as internal items. Group widths, 40-second speed and reverse bank direction remain unchanged; mobile/reduced-motion grids retain zero item margins.
- Browser geometry at 1024, 1440 and 1920px confirms every bank gap, including the join, is approximately 46.67px; every feature gap is approximately 106.95px (subpixel rounding under 0.02px). Both copies remain 1240px wide. No horizontal overflow; at 360px both marquees are static with zero item margins. Screenshot and measurements: `artifacts/marquee-spacing/`.
- All 9 motion tests, standalone TypeScript and production build passed. The sandbox build hit a generated-directory EPERM; the approved rerun succeeded. Preview tab/server stopped and viewport reset. No API or form changes.

## Banner typography and motion follow-up

- Audience title increased to 30px desktop, 26px tablet (640–1000px), and 22px mobile. Replaced the whole-panel entrance with separate title, NBFC, bank and note entrances, staggered at 0/100/200/300ms and complete within 700ms. Each runs once with 8px movement; all rules remain inside the no-reduced-motion media query. No nested entrance transforms or continuously moving text.
- All 53 tests, standalone TypeScript and production build pass. Browser measurements at 1440, 768 and 360px confirm the intended font sizes, settled full opacity, one animation iteration and no horizontal overflow. Desktop/mobile screenshots inspected; updated evidence in `artifacts/lender-banner/updated-*`. No physical phone or OS reduced-motion toggle check was performed. Preview tab/server stopped and viewport reset.

## Static lender banner (current revision)

- Replaced the green audience bar with a server-rendered sage banner containing the selected five NBFC and four bank names, semantic group headings/lists and the lender/location qualification. Desktop groups are side by side; below 640px they stack. Names are plain text with no keyboard stops. Main headline, tools, lower lender section, marquees and complete dropdown choices are preserved.
- Added one 350ms CSS entrance from 6px offset and 85% opacity, exclusively under `prefers-reduced-motion: no-preference`. No client component, dependency, looping motion or hidden initial content. Removed the global 30px important eyebrow override and obsolete bar styles; calculator eyebrow now measures its intended 10px.
- Final automated suite: **53 passed**, including exact featured-name/grouping, qualification, server-rendered content and retained dropdown coverage. Standalone TypeScript, production build and diff whitespace checks passed after source edits. This banner change makes no backend, schema, environment or Apps Script modifications.
- Production browser checks at **360, 390, 768, 1024 and 1440px** found no horizontal overflow. Verified stacked groups at phone widths and parallel groups above the breakpoint; title sizes are 18px/22px. Inspected mobile and desktop screenshots, and confirmed the banner introduces no interactive controls. The EMI navigation anchor and amount handoff still copy ₹3,00,000 and focus the form amount field. No captured console warnings/errors.
- Inspected the delivered CSS animation rule to confirm its reduced-motion media gate and single iteration. An OS preference toggle, physical-phone check and live delivery test were not performed. Existing interaction/delivery regression tests remain mocked. Screenshots and measurements: `artifacts/lender-banner/` (five viewport images and `layout-checks.json`). Temporary preview tab, viewport override and server cleaned up.

## Optional lender preference (previous revision)

- Added a separate optional Preferred bank / NBFC selector, defaulting to No preference—please guide me. Salary-account bank choices remain unchanged. Bank/NBFC optgroups include all eight client-requested names; Utkarsh Small Finance Bank is under Banks. Lender names and official sources are documented in LENDER-SOURCES.md.
- Added validated `preferredLender`, with omitted legacy values defaulting to no preference. Email, Apps Script payloads and encoded WhatsApp drafts carry the readable choice. Updated the privacy collection disclosure and consent version; no new dependencies, environment variables or response shapes.
- Sheets now have 16 columns: IST remains C, Product interest O and Preferred bank / NBFC P. The locked `migratePreferredLenderColumn` entry point upgrades recognised 13/14/15-column layouts, preserves existing rows and trailing notes/formulas, leaves historical preferences blank and safely resumes interrupted migration. Older migration entry points upgrade to the same layout.
- Final automated suite: **52 passed**. Coverage includes all allowed lender values across delivery channels, invalid values, omitted legacy fields, separate salary-bank values, grouping/defaults, retention on failure and amount handoff, historical sheet preservation, repeat migration, interrupted migration and lock contention. Standalone TypeScript and production build passed after source edits. The sandbox build initially hit Windows EPERM while creating a generated directory; rerunning with approved access completed successfully.
- Production browser preview checked at **1440px and 360px**: no horizontal overflow; lender selection survives calculator amount handoff independently of salary bank; mobile select text is 16px, longest bank name fits, helper text wraps, keyboard Tab reaches consent. No captured browser warnings/errors. Screenshots: `artifacts/lender-preference/desktop.png` and `mobile-360.png`. Temporary viewport/tab/server cleaned up.
- Live Gmail, Sheets and WhatsApp delivery were not exercised; automated delivery tests use mocks. Physical-phone testing and other viewport sizes were not repeated for this field addition. No live enquiry was submitted.
- **Activation pending:** the live Apps Script deployment and Google sheet have not been changed. Follow README: deploy the updated receiver, run `migratePreferredLenderColumn`, then publish the website. Existing deployment URL and secrets stay unchanged.

## Indian-time submission column (previous revision)

- Added `Submitted (IST)` as column C, derived from the existing UTC instant with `Utilities.formatDate` and the explicit `Asia/Kolkata` timezone. Example: `24 Oct 2026, 03:30:00 PM IST`. UTC, website, API payloads, email/WhatsApp timestamps and environment settings are unchanged.
- New sheets use 15 columns; Product interest is column O. The receiver remains compatible with the original 13-column and product-enabled 14-column layouts during deployment. Values are written according to the recognised layout and deduplication still uses the reference in column A.
- Added `migrateIndianTimeColumn`, sharing the writer lock. It shifts existing cells/formulas intact, retains or adds Product interest and fills only blank IST cells from valid UTC timestamps. Existing IST values/formulas are preserved. The execution log reports counts and invalid/missing timestamp row numbers only. Repeated runs and retry after interrupted IST-column insertion are covered. `migrateProductInterestColumn` now calls the complete migration.
- Final `npm test`: **48 passed**, including 12 Apps Script tests. Conversion cases cover ordinary dates, midnight, month/year rollover and leap day; migration cases cover both legacy layouts, narrow sheets, trailing notes/formulas, invalid timestamps, repeated runs, concurrent writes and resumed migration. Standalone TypeScript and `git diff --check` passed. The website was not changed, so a new production build or visual review was not needed for this script-only update.
- Google services are mocked in tests (the formatter contract uses `Asia/Kolkata`; expected conversions are checked independently with Intl). The live Apps Script deployment/sheet has not been modified or verified. README now specifies **deploy updated receiver first, then run migration**, keeping the existing URL and properties.

## Full offering and adjustable interest rate (previous revision)

- Kept the calculator/form workspace and motion. Updated the prominent audience line and heading for personal loans, hybrid flexi loans and overdraft enquiries, with lender-specific eligibility qualifications. Added a separate static NBFC section using current verified names; the salary-account bank marquee retains its non-partnership caption. Sources and text-only asset decision: `LENDER-SOURCES.md`.
- Added editable annual interest (1–36%, default 9.9%, up to two typed decimals), a 0.1-step native slider, validation and dynamic disclaimers. The calculation uses the precise typed rate; native slider thumbs use their 0.1 grid. Calculator remains personal-loan-only; rate, tenure and EMI are not submitted.
- Added required product interest in the UI and a backward-compatible API enum default for older requests. Product labels travel through Gmail, Sheets and WhatsApp. Updated privacy notice and consent version. No new environment variables or dependencies.
- Added a locked, idempotent Apps Script migration for column N. Tests cover original row preservation, repeated migration, header/data/formula conflicts, lock contention, all product values, legacy input, authentication and duplicate references.
- Final `npm test`: **44 passed**. Final `npm run build`, standalone `npm run typecheck`, CSS parsing and `git diff --check` passed. Provider delivery and navigation tests use mocks; no actual enquiries were sent.
- Production preview checked at exact CSS viewport widths **360, 390, 768, 1024 and 1440px**. No horizontal overflow. Desktop calculator/form tops aligned, form width 490px; smaller widths stack calculator → form → steps. Audience text measured 14px mobile/16px desktop, rate input 17px text and 44px high. Product select measured over 44px high.
- Browser interactions verified decimal rate entry (12.25% → ₹10,000 for the default amount/tenure), invalid rate 36.01 disabling the handoff, keyboard slider increment, preserved product/name on amount handoff, focused amount visible on mobile, tab progression to salary bank, inline form errors and an expanded product FAQ. No browser warnings or errors were captured. No valid live form submission was performed.
- Both desktop marquee groups measured 1240px against a 1240px window; bank direction remained reverse. Mobile rendered static strips. Reduced-motion preference changes and missing APIs remain covered by automated tests, not a new browser emulation check. Physical-phone, native 200% zoom, live service delivery and confirmation/toast visual checks remain unverified.
- Screenshots and viewport measurements: `artifacts/offering-review/desktop-1440.png`, `mobile-360.png`, `overview.png`, `layout-checks.json`. The mobile screenshot intentionally includes validation errors and synthetic preview values.
- **Activation pending:** no authenticated Apps Script editor/deployment connection was available. Run `migrateProductInterestColumn` and update the existing Apps Script deployment **before publishing this website version**, following README. Google's live sheet/script and the hosted website were not changed.

## Shared calculator and callback workspace (previous revision)

- Replaced the two uneven hero/enquiry rows with a full-width compact introduction and a top-aligned calculator/form grid. Desktop form width is 490px with a 28px column gap; callback steps sit 20px beneath the calculator. At 1,000px and below, the single component instances stack calculator → form → steps. Removed obsolete hero/enquiry layout rules instead of retaining competing overrides.
- Removed the rendered decorative diagram grid, lifestyle cards and large standalone process section. Rewrote the hero, navigation, calculator guidance, enquiry heading/button, confirmation, six FAQs, metadata and privacy notice around estimating EMI and requesting a callback. Preserved consent, fee qualifications and non-partnership wording.
- Retained both marquees. Each bank-logo group now measures 1,240px, covering the full-width desktop window and preserving the reverse loop. Mobile views use static logo/feature layouts.
- Final automated suite: **39 passed**. TypeScript, production build and `git diff --check` passed after source edits. CSS parsing confirms the quoted font import is intact. New page/privacy tests verify a single calculator/form, content order, six FAQs, removed sections, valid anchors and local-calculation disclosures.
- **Browser access succeeded for this revision.** Live geometry checks found no horizontal overflow at effective CSS viewport widths 360, 390, 767/769, 1,024, 1,440 and 1,920px. Desktop cards share a top edge; the form remains 490px wide. Mobile/tablet form and steps follow the calculator in order. Visually inspected the desktop overview, lower tool area, bank strip and 360px mobile introduction/form.
- Live interaction checks: invalid amount shows an error and disables handoff; keyboard ArrowRight adjusts tenure; explicit handoff copies ₹4,00,000 and focuses the requested-amount field; empty-form validation produces errors without overflow; expanded EMI FAQ stays readable. No console errors/warnings were captured. No live enquiry was submitted.
- Saved screenshots in `artifacts/layout-review/`: `desktop-overview.png`, `desktop-1440.png`, `mobile-360.png`. The mobile capture includes a synthetic ₹4,00,000 / 37-month calculator example. These are local browser previews, not a real-phone test.
- The browser's effective scale remained 1.1, so viewport overrides were calibrated against measured CSS widths. Explicit native 100%/200% zoom checks, an exact 768px viewport, long server-error/confirmation visual states and a physical-phone test remain unverified. Error/confirmation behaviour remains covered by automated tests. Temporary viewport overrides were reset, the temporary tab closed and the preview server stopped.
- No dependencies, environment settings, validation schema, API payloads or backend delivery changes.

## Calculator-led hero (previous revision)

- Added the prominent EMI calculator beside compact hero copy, with ivory controls, a navy result panel and a principal/interest chart. Moved the existing form into the next section beside the diagrams and bank marquee. Mobile source order is introduction → calculator → form → diagrams → banks.
- Fixed illustrative rate: 9.9% p.a.; updated hero, FAQ and metadata consistently. Amount range ₹50,000–₹40,00,000 and tenure 12–60 months. The ₹3,00,000 / 36-month example yields ₹9,666 EMI, ₹47,979 interest and ₹3,47,979 total repayment. Calculations retain precision before display rounding.
- Added validated editable fields and native sliders, placeholders for invalid estimates, inline errors, a 450ms-debounced result announcement, accessible text equivalents for the chart, fee/range qualifications and server-rendered default values with a no-JavaScript explanation.
- Explicit handoff copies only the selected amount, preserves other form fields and focuses/scrolls to the loan-amount field so it remains visible on a tall mobile form. It respects reduced motion, supports repeated same-amount handoffs, locks during submission and links to existing confirmation after receipt. No calculator values other than loan amount enter the API.
- Final `npm test`: **37 passed**. Coverage includes formula accuracy, boundaries, parsing, invalid inputs, slider/field updates, default SSR, repeated handoffs, retained field values, submission locking and confirmation preservation, plus all existing delivery/toast/motion tests. Services and navigation were mocked; no leads sent.
- Final production build, TypeScript and `git diff --check` passed. CSS parses and the Google Fonts URL remains intact. Built HTML has one calculator, one enquiry form, the intended content order, no broken internal anchors and no remaining 9.99% copy.
- Browser preview initially timed out; subsequent access to its error page was blocked by Browser Use URL policy. No bypass was attempted. Screenshots, keyboard appearance and overflow checks at 360, 390, 768 and 1440px, plus real-phone testing, remain **unverified**. Both temporary preview servers were stopped.
- No new dependencies, environment variables, lead-schema fields or backend interfaces. Existing Gmail, Sheets, WhatsApp and toast behaviour is preserved. Earlier entries describe previous revisions.

## Reverse bank-logo marquee (previous revision)

- Added a continuous 40-second left-to-right desktop bank-logo loop, opposite to the feature strip, with soft edge fades. Heading and non-partnership caption remain stationary. There are no pause controls or hover/focus pause triggers.
- Shared the existing desktop/reduced-motion media hook. Mobile, reduced-motion and server-rendered views retain the original six-logo grid. The duplicate logo group is hidden from assistive technology.
- Final suite: **31 tests passed**. TypeScript, production build and CSS parsing passed. Fixed a pre-existing test timing race by waiting for the WhatsApp navigation-error toast effect before asserting; application submission behaviour was unchanged.
- Browser visual checks for the logo loop seam and responsive overflow remain unverified. No backend, environment or dependency changes.

## Continuous feature marquee (previous revision)

- Removed the Pause/Play button, its reserved layout space and all hover, focus, viewport and tab-visibility pause logic. Desktop retains the continuous 40-second loop, edge fades and screen-reader-hidden duplicate list.
- Mobile, reduced-motion and no-JavaScript views remain static; viewport and reduced-motion changes are still respected during the visit.
- Updated marquee regression tests: **30 tests passed** across the full suite. TypeScript and production build passed after source edits. Browser seam and mobile visual checks were not performed.
- No form, backend or environment changes. Earlier entries below record superseded behaviour.

## Subtle motion update (previous revision)

- Added a 40-second desktop feature marquee with edge fades, saffron separators and a 44px Pause/Play control. Movement starts only after client enhancement; server-rendered, mobile and reduced-motion versions remain static. The repeated feature group is hidden from assistive technology.
- Automatic pause conditions combine hover, strip focus, enquiry-form focus, offscreen state and a hidden tab. Manual pause remains independent and persists through automatic condition changes. Clicking Play while focus remains inside the strip resumes movement only after that automatic pause condition clears.
- Three small SVG accent groups enter once with 3–4px movement and 120ms stagger, finishing within 960ms. Financial/use-case cards have separate entrance and hover wrappers; precise-pointer hover lifts them 2px. CTA arrows move 3px without moving labels. Bank logos, rates, eligibility and fields remain stationary.
- Reduced-motion changes during a visit stop movement. Existing 400ms one-time scroll reveals remain, with visible content when JavaScript or observer APIs are unavailable. No animation library was added.
- Final `npm test`: **30 passed**, including manual-pause persistence, automatic pause/resume conditions, viewport/reduced-motion changes, duplicate-text accessibility, diagram playback and existing form/delivery/toast behaviour. External services and navigation are mocked; no real leads were sent.
- Production build and TypeScript checks passed after final source edits and safe PostCSS formatting. `git diff --check` passed. The Google Fonts import remains a single quoted line.
- Built HTML inspection confirmed four original features, static initial motion state, six separate hover wrappers, three diagram accent groups and stationary bank tiles.
- Browser checks for the marquee seam, keyboard appearance, responsive overflow and layout at 360, 390, 768 and 1440px remain **unverified**, as does a real-phone HTTPS check. Existing browser URL-policy restrictions were not bypassed. No development server or public preview was started for this update.
- Form validation, toasts, submission handling, WhatsApp navigation, backend interfaces, dependencies and environment values were preserved. Entries below describe earlier revisions.

## Professional diagram, placement and feedback refinement

- Replaced the character and lifestyle artwork with six original schematic SVGs: salary document, enquiry, phone/message, home floor plan, learning screen and occasion/calendar. Rendered and visually inspected an artwork contact sheet.
- Desktop retains the form's existing width beside a compact hero, three diagram cards and a three-column/two-row salary-bank grid. Mobile source order is hero/eligibility → form → diagrams → bank examples. Removed the separate large bank section and the looping marquee/Pause control.
- Static features and below-fold section headings/cards reveal once with a 400ms opacity/12px transition and up to 160ms stagger. Already-visible content, reduced motion and missing browser APIs stay static. Server-rendered content is never hidden pending JavaScript.
- Added Sonner 2.0.8 with one shared, dismissible notification region. Generic failure and thrown-navigation messages reuse a per-form toast ID; retries clear stale feedback. Inline field errors and persistent delivery details remain. Full/partial success still navigates to WhatsApp immediately, without a success-toast delay.
- Final `npm test`: **26 passed**. Coverage includes existing delivery and validation, error-toast reuse and dismissal, no applicant information in toast messages, unavailable service/timeouts/network failures, persistent field values, WhatsApp fallback, static feature rendering, one-time observer behaviour, bounded stagger, above-fold exclusion and reduced-motion/browser-API fallbacks. Services/navigation/toast calls are mocked; no real leads were sent.
- `npm run typecheck`, `git diff --check` and the production build passed after all source edits, including CSS formatting. CSS was edited/stringified through PostCSS, preserving the single-line quoted Google Fonts URL.
- Built HTML inspection: expected mobile source order, six local lazy-loaded logos, four feature items, zero feature controls, one notification region, and no broken section anchors.
- Development check: HTTP 200 from `http://127.0.0.1:3000`, diagram-grid markup present and no CSS parsing error. Sandbox networking prevented reaching the initial temporary server; the check passed with the server outside the sandbox. Both temporary servers were stopped after verification.
- Browser keyboard/overflow/toast placement checks at 360, 390, 768 and 1440px and a real-phone test remain **unverified**. Existing browser URL-policy restrictions were not bypassed. The artwork and DOM checks do not replace browser screenshots.
- No API, backend delivery, validation schema or environment changes. Earlier verification entries below describe previous revisions, including the now-removed marquee.

## CSS import repair

- The final formatting pass after the visual-update build split semicolons inside the quoted Google Fonts URL into new lines. This introduced a CSS parsing error after that build; the earlier build result did not validate that final formatting change.
- Restored the font import to a single line, preserving the remaining stylesheet. The unsafe formatter was not rerun.
- Reran `npm run build` and `npm run typecheck` after the stylesheet repair: both passed. The build ran outside the sandbox because generated-file writes require it in this environment.
- Requested the running development page at `http://localhost:3000` outside the sandbox: HTTP 200, expected landing-page content present, and no CSS parsing error in the response. This confirms server-side development compilation; a browser-tab reload was not performed.

## Landing-page visual update

- Implemented the desktop hero/form layout, original SVG artwork, salary-bank examples, three illustrated use-case cards, process steps and expanded FAQ layout. Mobile CSS places eligibility and the form before the decorative illustration.
- `npm test`: **24 tests passed**. Includes the previous 20 delivery/form checks plus static pre-hydration rendering, persistent marquee pause/replay, switching to mobile/reduced motion, and reveal fallbacks. No real lead was submitted or external message sent.
- `npm run typecheck`: passed. Production build passed with Next.js 16.4.2 outside the sandbox; the sandboxed build was blocked by an EPERM while creating generated route directories.
- Prerendered HTML: one H1, all internal section anchors resolve, six bank images resolve to local files, four features are present without JavaScript, and the form is not hidden by animation.
- All six logo files decode; SVG checks found no scripts, event handlers, foreign objects or external resource references. Combined bank assets are approximately 46 KB. Source URLs and reuse context are in `public/banks/SOURCES.md`.
- Artwork and logo contact sheets were visually inspected. Replaced the initial white/reverse Axis, ICICI and Bank of Baroda assets with official colour versions suitable for the light background. The custom illustrations were rendered and inspected independently of the webpage.
- Measured contrast: navy/ivory 13.56:1; body text/peach FAQ 5.44:1; saffron/ivory 4.70:1; green/sage form header 6.14:1; body text/peach card 5.31:1.
- Viewport screenshots, browser keyboard/overflow checks at 360, 390, 768 and 1440px, and a physical-phone HTTPS test remain **unverified**. Browser access in this workspace was previously blocked by URL security policy. Asset inspection and DOM tests do not substitute for those checks. No new public preview was deployed.
- Manual acceptance: on an HTTPS preview, check those four widths, keyboard focus and consent links, Pause/Play, OS reduced-motion preference, FAQ expansion, field-error placement, and the WhatsApp manual fallback/Send step. Use test details and expect real email/Sheet side effects if live delivery settings are enabled.
- Backend, schema, secrets and environment values were not changed by the visual update.

## Earlier integration verification

- `npm test`: 20 tests passed. SMTP, HTTP, Google Apps Script services and WhatsApp navigation are mocked; no external messages sent.
- `npm run typecheck`: passed.
- `npm run build`: passed with Next.js 16.4.2 after the Gmail / Apps Script / WhatsApp-link migration, using the approved build outside the sandbox.
- React DOM checks: full and partial receipt open the WhatsApp link once; blocked handoff retains a manual link; total delivery failure retains form values and does not navigate; invalid salary prevents submission; unsafe navigation URLs are rejected.
- Apps Script checks: authentication, schema validation, header creation, reference deduplication, simulated concurrent lock contention, lock release on failure, literal storage of formula-like values, and safe error replies.
- Backend checks: Gmail TLS and app-password configuration, independent delivery, webhook JSON acknowledgements, malformed responses, timeouts, safe result redirects, WhatsApp encoding, configuration validation and existing input/rate controls.
- Local development HTTP check from the initial build: 200 from `/`; not repeated for this migration.
- Primary palette contrast checks: navy/white 14.27:1; slate/warm white 6.19:1; saffron/warm white 4.70:1; muted text/white 4.87:1; green/white 6.69:1.
- Browser visual and interaction verification: incomplete. The browser URL security policy blocked access after an initial sandbox connection failure. No screenshots or mobile rendering claims are supplied.
- Real Gmail SMTP and Google Sheets delivery: not verified; the account credentials and deployed Apps Script must be configured and tested by the owner. WhatsApp delivery is controlled by the visitor tapping Send and is not observable by the website.

No preview server was started for this migration. Run `npm run dev` to preview locally. Existing populated environment values were preserved; missing new setting names were appended to `.env.local`.
