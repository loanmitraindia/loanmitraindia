// Authoring utility; uses Sharp already installed by Next.js. No browser dependency.
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
const root = path.resolve(__dirname, '../..');

async function main() {
  const svg = await fs.readFile(path.join(root, 'public/brand/lm-monogram.svg'));
  const sizes = [16, 32, 48];
  const images = await Promise.all(sizes.map(size => sharp(svg, { density: 384 }).resize(size, size).png().toBuffer()));
  const header = Buffer.alloc(6 + 16 * sizes.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  images.forEach((image, index) => {
    const position = 6 + index * 16;
    header[position] = header[position + 1] = sizes[index];
    header.writeUInt16LE(1, position + 4);
    header.writeUInt16LE(32, position + 6);
    header.writeUInt32LE(image.length, position + 8);
    header.writeUInt32LE(offset, position + 12);
    offset += image.length;
  });
  await fs.writeFile(path.join(root, 'src/app/favicon.ico'), Buffer.concat([header, ...images]));
  // Opaque background for Apple home-screen use; the SVG retains transparent corners.
  await sharp(svg, { density: 384 }).resize(180, 180).flatten({ background: '#132C44' }).png().toFile(path.join(root, 'src/app/apple-icon.png'));
  console.log('Generated ICO (16/32/48) and Apple icon (180).');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
