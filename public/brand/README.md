# LoanMitra India brand assets

- `loanmitra-india.svg`: complete transparent wordmark, including the LM badge. Header display: 200px wide, 165px on small phones. Preserve its 350:96 aspect ratio.
- `lm-monogram.svg`: square LM mark with transparent outer corners. Use when the full name would be too small, especially browser tabs.
- Root Next.js assets: `src/app/icon.svg` is the same monogram; `src/app/favicon.ico` contains 16, 32 and 48px images; `src/app/apple-icon.png` is an opaque 180px home-screen icon.

Colours: navy `#132C44`, ivory `#FAF9F6`, burnt saffron `#B65320`. The compact mark has only navy and ivory. Do not stretch, rotate, animate or add shadows to the assets. Use the full wordmark on light backgrounds; the navy badge remains identifiable against light and dark browser chrome.

The LoanMitra and INDIA lettering uses Manrope at weight 750, converted to paths. The simplified LM uses purpose-drawn block paths for small-size clarity. There are no runtime fonts, scripts, external images or raster images inside the SVGs.

## Source and regeneration

Downloaded 26 October 2026 from the official Google Fonts repository:

- Font: https://github.com/google/fonts/blob/main/ofl/manrope/Manrope%5Bwght%5D.ttf
- Licence: https://github.com/google/fonts/blob/main/ofl/manrope/OFL.txt

An unmodified source font and its full SIL Open Font License are retained in `scripts/brand/Manrope.ttf` and `scripts/brand/OFL.txt`. Font project copyright: The Manrope Project Authors. The licence applies to the font; generated artwork is not font software.

Source font SHA-256: `3AE11C49DB0455A3CC33E37D380F20FDB8C7F8B41DC07625C177E3D87A9D6AE6`.

From the repository root, with Python installed:

```powershell
python -m pip install --target .brand-tools fonttools==4.67.0
python scripts/brand/generate.py
node scripts/brand/rasterize.cjs
node scripts/brand/preview.cjs
```

`.brand-tools` is ignored. FontTools is an authoring utility only; Sharp is already installed by Next.js. No website runtime dependencies were added. `generate.py` is the source of truth for paths, colours and spacing; it also keeps the public monogram and root icon identical. `rasterize.cjs` derives ICO/PNG assets from that SVG. `preview.cjs` renders actual-size examples on light and dark backgrounds under `artifacts/brand-review/`.

Next.js discovers the root icon files and emits their metadata links for every page. All URLs are root-relative and work on localhost, Vercel and a future custom domain. A browser may cache an older favicon: use a fresh tab or hard reload when reviewing a deployment. Domain connection and DNS changes are separate from these assets.
