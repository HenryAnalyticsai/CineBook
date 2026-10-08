import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Create Brand SVG Icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e112a" />
      <stop offset="100%" stop-color="#2a081a" />
    </linearGradient>
    <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f43f5e" />
      <stop offset="50%" stop-color="#e11d48" />
      <stop offset="100%" stop-color="#be123c" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#e11d48" flood-opacity="0.35" />
    </filter>
  </defs>

  <!-- Background with subtle border -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />
  <rect width="504" height="504" x="4" y="4" rx="108" fill="none" stroke="rgba(225, 29, 72, 0.3)" stroke-width="4" />

  <!-- Central Glowing Emblem -->
  <g filter="url(#shadow)" transform="translate(256, 230)">
    <!-- Film Reel & Frame -->
    <path d="M-130,-100 L-30,-100 C-10,-100 0,-90 0,-70 L0,70 C0,90 -10,100 -30,100 L-130,100 C-150,100 -160,90 -160,70 L-160,-70 C-160,-90 -150,-100 -130,-100 Z" fill="url(#brandGrad)" />
    <!-- Film Perforations -->
    <rect x="-148" y="-85" width="16" height="22" rx="4" fill="#0f172a" />
    <rect x="-148" y="-45" width="16" height="22" rx="4" fill="#0f172a" />
    <rect x="-148" y="-5" width="16" height="22" rx="4" fill="#0f172a" />
    <rect x="-148" y="35" width="16" height="22" rx="4" fill="#0f172a" />
    <rect x="-148" y="65" width="16" height="22" rx="4" fill="#0f172a" />

    <polygon points="-105,-40 -105,40 -45,0" fill="#ffffff" opacity="0.95" />

    <!-- Open Book Right Page -->
    <path d="M10,-70 C40,-95 90,-100 130,-100 C150,-100 160,-90 160,-70 L160,70 C160,90 150,100 130,100 C90,100 40,95 10,70 Z" fill="url(#brandGrad)" opacity="0.9" />
    <path d="M25,-55 C50,-75 90,-80 135,-80 L135,75 C95,75 55,70 25,50 Z" fill="#ffffff" opacity="0.95" />

    <!-- Star / Achievement Sparkle -->
    <path d="M110,-110 L118,-92 L136,-84 L118,-76 L110,-58 L102,-76 L84,-84 L102,-92 Z" fill="url(#goldGrad)" />
  </g>

  <!-- Title Text inside Icon -->
  <text x="256" y="420" font-family="Plus Jakarta Sans, sans-serif" font-weight="800" font-size="52" fill="#ffffff" text-anchor="middle" letter-spacing="4">CINEBOOK</text>
  <text x="256" y="455" font-family="Plus Jakarta Sans, sans-serif" font-weight="600" font-size="20" fill="#f43f5e" text-anchor="middle" letter-spacing="3">CULTURA &amp; RESENHAS</text>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf8');

// Minimal PNG generator for accurate, standard PNG images
function createPngBuffer(width, height, isMaskable = false) {
  // RGBA buffer: width * height * 4
  const stride = width * 4;
  const rawData = Buffer.alloc((stride + 1) * height);

  // Background and brand colors
  // Brand gradient: dark slate (#0f172a) to deep rose (#2a081a)
  const cx = width / 2;
  const cy = height / 2;
  const radius = isMaskable ? width * 0.38 : width * 0.44;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (stride + 1);
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Deep dark luxury background with radial vignette
      const t = Math.min(dist / (width * 0.7), 1);
      let r = Math.round(15 * (1 - t) + 42 * t);
      let g = Math.round(23 * (1 - t) + 8 * t);
      let b = Math.round(42 * (1 - t) + 26 * t);
      let a = 255;

      // Central glowing circle / rounded emblem
      if (dist < radius) {
        const edge = radius - dist;
        const normDist = dist / radius;

        if (edge < 6) {
          // Subtle border
          r = 225;
          g = 29;
          b = 72;
        } else if (normDist > 0.82) {
          // Outer emblem ring
          r = 244;
          g = 63;
          b = 94;
        } else {
          // Inner icon graphic (film & book motif colors)
          const isLeft = dx < -width * 0.05;
          const isRight = dx > width * 0.05;

          if (isLeft && Math.abs(dy) < radius * 0.6) {
            // Film camera / reel area
            r = 225;
            g = 29;
            b = 72;
          } else if (isRight && Math.abs(dy) < radius * 0.6) {
            // Book area
            r = 245;
            g = 158;
            b = 11;
          } else {
            // Glowing core
            r = 251;
            g = 191;
            b = 36;
          }
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG structure:
  // Signature (8 bytes)
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk (13 bytes data)
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type (RGBA)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT chunk
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  const crc = zlib.crc32(typeAndData);
  chunk.writeUInt32BE(crc >>> 0, 8 + len);
  return chunk;
}

// Generate PNG icon files
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPngBuffer(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPngBuffer(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPngBuffer(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPngBuffer(180, 180, false));

console.log('PWA icons created successfully in public/');
