// Generate multi-size ICO file for Kairozun
// Creates BMP-based ICO with 16, 32, 48, 256 px sizes
const fs = require('fs');
const path = require('path');

const SIZES = [16, 32, 48, 256];

function renderIcon(SIZE) {
  const pixels = Buffer.alloc(SIZE * SIZE * 4);
  const cornerRadius = Math.max(2, Math.round(SIZE * 0.1));

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const idx = (y * SIZE + x) * 4;
      // Gradient background: deep purple to indigo
      const t = (x + y) / (SIZE * 2);
      const r = Math.round(60 + t * 60);
      const g = Math.round(20 + t * 30);
      const b = Math.round(120 + t * 100);

      // Round corners
      const cx = x - SIZE / 2, cy = y - SIZE / 2;
      let inRect = true;
      for (const [ccx, ccy] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
        const cornerX = ccx * (SIZE / 2 - cornerRadius);
        const cornerY = ccy * (SIZE / 2 - cornerRadius);
        if (ccx * (cx - cornerX) > 0 && ccy * (cy - cornerY) > 0) {
          const d = Math.sqrt((cx - cornerX) ** 2 + (cy - cornerY) ** 2);
          if (d > cornerRadius) inRect = false;
        }
      }

      if (!inRect) {
        pixels[idx] = 0; pixels[idx+1] = 0; pixels[idx+2] = 0; pixels[idx+3] = 0;
        continue;
      }

      pixels[idx] = b;       // Blue (BGRA)
      pixels[idx + 1] = g;
      pixels[idx + 2] = r;
      pixels[idx + 3] = 255;

      // Draw "K" letter
      const nx = x / SIZE, ny = y / SIZE;
      const thick = SIZE <= 32 ? 0.09 : 0.07;
      const barW = SIZE <= 32 ? 0.16 : 0.13;
      const inK = (
        (nx > 0.25 && nx < 0.25 + barW && ny > 0.2 && ny < 0.8) ||
        (Math.abs(nx - (0.25 + barW) - (0.5 - ny) * 0.52) < thick && ny > 0.2 && ny < 0.5) ||
        (Math.abs(nx - (0.25 + barW) - (ny - 0.5) * 0.52) < thick && ny >= 0.5 && ny < 0.8)
      );

      if (inK) {
        pixels[idx] = 255;
        pixels[idx+1] = 255;
        pixels[idx+2] = 255;
        pixels[idx+3] = 255;
      }
    }
  }
  return pixels;
}

function buildBmpImage(pixels, SIZE) {
  const dibHeaderSize = 40;
  const pixelDataSize = SIZE * SIZE * 4;
  const maskRowBytes = Math.ceil(SIZE / 32) * 4;
  const maskSize = SIZE * maskRowBytes;
  const imageSize = dibHeaderSize + pixelDataSize + maskSize;

  const buf = Buffer.alloc(imageSize);

  // BITMAPINFOHEADER
  buf.writeUInt32LE(dibHeaderSize, 0);
  buf.writeInt32LE(SIZE, 4);
  buf.writeInt32LE(SIZE * 2, 8);
  buf.writeUInt16LE(1, 12);
  buf.writeUInt16LE(32, 14);
  buf.writeUInt32LE(0, 16);
  buf.writeUInt32LE(pixelDataSize + maskSize, 20);

  // Pixel data (bottom-up)
  const pixOff = dibHeaderSize;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const srcIdx = ((SIZE - 1 - y) * SIZE + x) * 4;
      const dstIdx = pixOff + (y * SIZE + x) * 4;
      buf[dstIdx] = pixels[srcIdx];
      buf[dstIdx + 1] = pixels[srcIdx + 1];
      buf[dstIdx + 2] = pixels[srcIdx + 2];
      buf[dstIdx + 3] = pixels[srcIdx + 3];
    }
  }

  // AND mask — build from alpha channel (0 = opaque, 1 = transparent)
  const maskOff = pixOff + pixelDataSize;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const srcIdx = ((SIZE - 1 - y) * SIZE + x) * 4;
      const alpha = pixels[srcIdx + 3];
      if (alpha < 128) {
        const byteIdx = maskOff + y * maskRowBytes + Math.floor(x / 8);
        buf[byteIdx] |= (0x80 >> (x % 8));
      }
    }
  }

  return buf;
}

// Build multi-size ICO
const images = SIZES.map(size => {
  const pixels = renderIcon(size);
  return { size, data: buildBmpImage(pixels, size) };
});

const headerSize = 6;
const entrySize = 16;
const totalEntries = images.length;
let dataOffset = headerSize + entrySize * totalEntries;

const parts = [Buffer.alloc(headerSize)];
// ICONDIR
parts[0].writeUInt16LE(0, 0);
parts[0].writeUInt16LE(1, 2);
parts[0].writeUInt16LE(totalEntries, 4);

const entries = [];
for (const img of images) {
  const entry = Buffer.alloc(entrySize);
  entry.writeUInt8(img.size === 256 ? 0 : img.size, 0);
  entry.writeUInt8(img.size === 256 ? 0 : img.size, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(img.data.length, 8);
  entry.writeUInt32LE(dataOffset, 12);
  dataOffset += img.data.length;
  entries.push(entry);
}

const ico = Buffer.concat([parts[0], ...entries, ...images.map(i => i.data)]);
const outPath = path.join(__dirname, 'assets', 'icon.ico');
fs.writeFileSync(outPath, ico);
console.log(`Icon generated: ${outPath} (${ico.length} bytes, ${SIZES.length} sizes: ${SIZES.join(', ')}px)`);
