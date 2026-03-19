// Generate a simple 256x256 ICO file for Kairozun
// This creates a minimal BMP-based ICO with a gradient "K" icon
const fs = require('fs');
const path = require('path');

const SIZE = 64;
const pixels = Buffer.alloc(SIZE * SIZE * 4);

// Draw a gradient background + "K" shape
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const idx = (y * SIZE + x) * 4;
    // Gradient background: deep purple to indigo
    const t = (x + y) / (SIZE * 2);
    const r = Math.round(30 + t * 70);  // 30->100
    const g = Math.round(20 + t * 40);  // 20->60
    const b = Math.round(80 + t * 120); // 80->200

    // Round corners
    const cx = x - SIZE / 2, cy = y - SIZE / 2;
    const cornerRadius = 12;
    let inRect = true;
    // Check corners
    for (const [ccx, ccy] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
      const cornerX = ccx * (SIZE/2 - cornerRadius);
      const cornerY = ccy * (SIZE/2 - cornerRadius);
      if (ccx * (cx - cornerX) > 0 && ccy * (cy - cornerY) > 0) {
        const d = Math.sqrt((cx - cornerX)**2 + (cy - cornerY)**2);
        if (d > cornerRadius) inRect = false;
      }
    }

    if (!inRect) {
      pixels[idx] = 0; pixels[idx+1] = 0; pixels[idx+2] = 0; pixels[idx+3] = 0;
      continue;
    }

    pixels[idx] = b;     // Blue (BMP = BGRA)
    pixels[idx + 1] = g; // Green
    pixels[idx + 2] = r; // Red
    pixels[idx + 3] = 255;

    // Draw "K" letter — simple pixel art
    const nx = x / SIZE, ny = y / SIZE;
    const inK = (
      (nx > 0.25 && nx < 0.38 && ny > 0.2 && ny < 0.8) || // left bar
      (Math.abs(nx - 0.38 - (0.5 - ny) * 0.5) < 0.07 && ny > 0.2 && ny < 0.5) || // upper diagonal
      (Math.abs(nx - 0.38 - (ny - 0.5) * 0.5) < 0.07 && ny >= 0.5 && ny < 0.8)    // lower diagonal
    );

    if (inK) {
      pixels[idx] = 255;   // B
      pixels[idx+1] = 255; // G
      pixels[idx+2] = 255; // R
      pixels[idx+3] = 255; // A
    }
  }
}

// Build ICO file
// ICO = ICONDIR + ICONDIRENTRY + BMP DIB header + pixel data
const headerSize = 6; // ICONDIR
const entrySize = 16; // ICONDIRENTRY
const dibHeaderSize = 40; // BITMAPINFOHEADER
const pixelDataSize = SIZE * SIZE * 4;
const maskSize = SIZE * Math.ceil(SIZE / 32) * 4; // AND mask
const imageSize = dibHeaderSize + pixelDataSize + maskSize;
const totalSize = headerSize + entrySize + imageSize;

const ico = Buffer.alloc(totalSize);

// ICONDIR
ico.writeUInt16LE(0, 0);        // Reserved
ico.writeUInt16LE(1, 2);        // Type = ICO
ico.writeUInt16LE(1, 4);        // Count = 1

// ICONDIRENTRY
ico.writeUInt8(SIZE, 6);        // Width
ico.writeUInt8(SIZE, 7);        // Height
ico.writeUInt8(0, 8);           // Color palette
ico.writeUInt8(0, 9);           // Reserved
ico.writeUInt16LE(1, 10);       // Color planes
ico.writeUInt16LE(32, 12);      // Bits per pixel
ico.writeUInt32LE(imageSize, 14); // Image size
ico.writeUInt32LE(headerSize + entrySize, 18); // Offset

// BITMAPINFOHEADER
const bmpOff = headerSize + entrySize;
ico.writeUInt32LE(dibHeaderSize, bmpOff);
ico.writeInt32LE(SIZE, bmpOff + 4);     // Width
ico.writeInt32LE(SIZE * 2, bmpOff + 8); // Height * 2 (XOR + AND)
ico.writeUInt16LE(1, bmpOff + 12);      // Planes
ico.writeUInt16LE(32, bmpOff + 14);     // Bits per pixel
ico.writeUInt32LE(0, bmpOff + 16);      // Compression (none)
ico.writeUInt32LE(pixelDataSize + maskSize, bmpOff + 20);
ico.writeInt32LE(0, bmpOff + 24);
ico.writeInt32LE(0, bmpOff + 28);
ico.writeUInt32LE(0, bmpOff + 32);
ico.writeUInt32LE(0, bmpOff + 36);

// Pixel data (bottom-up)
const pixOff = bmpOff + dibHeaderSize;
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const srcIdx = ((SIZE - 1 - y) * SIZE + x) * 4;
    const dstIdx = pixOff + (y * SIZE + x) * 4;
    ico[dstIdx] = pixels[srcIdx];
    ico[dstIdx + 1] = pixels[srcIdx + 1];
    ico[dstIdx + 2] = pixels[srcIdx + 2];
    ico[dstIdx + 3] = pixels[srcIdx + 3];
  }
}

// AND mask (all zeros = fully opaque based on alpha)
// Already zero from Buffer.alloc

const outPath = path.join(__dirname, 'assets', 'icon.ico');
fs.writeFileSync(outPath, ico);
console.log('Icon generated:', outPath);
