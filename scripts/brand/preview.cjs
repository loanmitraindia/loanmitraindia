const fs = require('node:fs/promises');
const sharp = require('sharp');
const path = require('node:path');
async function main() {
  const root = path.resolve(__dirname, '../..');
  const out = path.join(root, 'artifacts/brand-review');
  await fs.mkdir(out, { recursive: true });
  const logo = await fs.readFile(path.join(root, 'public/brand/loanmitra-india.svg'));
  const icon = await fs.readFile(path.join(root, 'public/brand/lm-monogram.svg'));
  const canvas = `<svg width="900" height="460" xmlns="http://www.w3.org/2000/svg"><rect width="900" height="460" fill="#FAF9F6"/><rect y="275" width="900" height="185" fill="#202124"/><g font-family="Arial,sans-serif" font-size="13" fill="#4F606C"><text x="28" y="25">WEBSITE LOGO · 200px / 165px</text><text x="28" y="135">FAVICON · 16px / 32px / 48px</text><text x="650" y="25">APPLE ICON · 180px</text></g></svg>`;
  const layers = [
    { input: await sharp(logo).resize({ width: 200 }).png().toBuffer(), left: 28, top: 42 },
    { input: await sharp(logo).resize({ width: 165 }).png().toBuffer(), left: 290, top: 47 },
    { input: await fs.readFile(path.join(root, 'src/app/apple-icon.png')), left: 650, top: 42 },
  ];
  for (const [index, size] of [16, 32, 48].entries()) {
    const input = await sharp(icon, { density: 384 }).resize(size, size).png().toBuffer();
    layers.push({ input, left: 28 + index * 100, top: 163 }, { input, left: 28 + index * 100, top: 325 });
  }
  await sharp(Buffer.from(canvas)).composite(layers).png().toFile(path.join(out, 'asset-sizes.png'));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
