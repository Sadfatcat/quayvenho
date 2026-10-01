// Sinh icon PWA (PNG) không cần thư viện ảnh: nền nâu gỗ + tấm vé kem có khía tròn. Chạy: node scripts/generateIcons.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const BACKGROUND = [0x6c, 0x4f, 0x3d];
const TICKET = [0xfd, 0xf6, 0xec];
const STRIPE = [0xc8, 0x6d, 0x51];
const OUT_DIR = 'public/icons';

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buffer) => {
  let c = 0xffffffff;
  for (const byte of buffer) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const body = Buffer.concat([Buffer.from(type), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
};

/** `scale` = tỉ lệ phần vé so với icon (maskable cần nhỏ hơn để nằm trong vùng an toàn). */
const renderIcon = (size, scale) => {
  const half = (size * scale) / 2;
  const ticketHalfHeight = half * 0.62;
  const cx = size / 2;
  const cy = size / 2;
  const radius = half * 0.18;
  const notch = half * 0.2;
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const dx = Math.abs(x - cx);
      const dy = Math.abs(y - cy);
      const cornerDx = Math.max(0, dx - (half - radius));
      const cornerDy = Math.max(0, dy - (ticketHalfHeight - radius));
      const insideTicket = dx <= half && dy <= ticketHalfHeight && cornerDx ** 2 + cornerDy ** 2 <= radius ** 2;
      const inNotch = Math.hypot(dx - half, dy) < notch;
      const onStripe = insideTicket && !inNotch && Math.abs(x - (cx + half * 0.35)) < half * 0.025 && dy < ticketHalfHeight * 0.8;
      const color = onStripe ? STRIPE : insideTicket && !inNotch ? TICKET : BACKGROUND;
      const offset = y * (size * 4 + 1) + 1 + x * 4;
      raw[offset] = color[0];
      raw[offset + 1] = color[1];
      raw[offset + 2] = color[2];
      raw[offset + 3] = 255;
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
};

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(`${OUT_DIR}/icon-192.png`, renderIcon(192, 0.8));
writeFileSync(`${OUT_DIR}/icon-512.png`, renderIcon(512, 0.8));
writeFileSync(`${OUT_DIR}/icon-maskable-512.png`, renderIcon(512, 0.56));
writeFileSync(`${OUT_DIR}/apple-touch-icon.png`, renderIcon(180, 0.8));
