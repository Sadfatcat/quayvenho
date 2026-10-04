// Gom sprite nhân vật từ sheet asset thành 1 atlas Phaser: node tools/buildAtlas.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { crop, readPng, writePng } from './pngtool.mjs';

const SHEET = 'DESIGN/stitch_chibi_game_ui_design/ảnh/ChatGPT Image 11_04_03 4 thg 10, 2026.png';
const OUT_DIR = 'public/assets/atlas';
const ALPHA_MIN = 40;
const MERGE_RADIUS = 3;
const PAD = 2;
const ATLAS_WIDTH = 640;

const sheet = readPng(SHEET);

/** Làm sạch viền: điểm nửa trong suốt có màu lạ (đỏ/vàng) lấy màu trung bình các điểm đặc xung quanh. */
const defringe = (img) => {
  const { width, height, px } = img;
  const out = Buffer.from(px);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4;
      const a = px[o + 3];
      if (a === 0 || a >= 250) continue;
      let r = 0, g = 0, b = 0, n = 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const yy = y + dy, xx = x + dx;
        if (yy < 0 || xx < 0 || yy >= height || xx >= width) continue;
        const p = (yy * width + xx) * 4;
        if (px[p + 3] >= 250) { r += px[p]; g += px[p + 1]; b += px[p + 2]; n++; }
      }
      if (n > 0) { out[o] = Math.round(r / n); out[o + 1] = Math.round(g / n); out[o + 2] = Math.round(b / n); }
    }
  }
  return { ...img, px: out };
};

/** Chỉ giữ thành phần liên thông lớn nhất (bỏ chú thích tên file/phần sprite láng giềng lọt vào khung) rồi cắt sát. */
const isolate = (img) => {
  const { width, height, px } = img;
  const solid = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) solid[i] = px[i * 4 + 3] > ALPHA_MIN ? 1 : 0;
  const near = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (!solid[y * width + x]) continue;
    for (let dy = -MERGE_RADIUS; dy <= MERGE_RADIUS; dy++) for (let dx = -MERGE_RADIUS; dx <= MERGE_RADIUS; dx++) {
      const yy = y + dy, xx = x + dx;
      if (yy >= 0 && xx >= 0 && yy < height && xx < width) near[yy * width + xx] = 1;
    }
  }
  const label = new Int32Array(width * height);
  let best = { id: 0, area: 0 };
  let next = 1;
  for (let s = 0; s < width * height; s++) {
    if (!near[s] || label[s]) continue;
    const stack = [s];
    label[s] = next;
    let area = 0;
    while (stack.length) {
      const p = stack.pop();
      if (solid[p]) area++;
      const x = p % width, y = (p - x) / width;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= width || yy >= height) continue;
        const q = yy * width + xx;
        if (near[q] && !label[q]) { label[q] = next; stack.push(q); }
      }
    }
    if (area > best.area) best = { id: next, area };
    next++;
  }
  let minX = width, minY = height, maxX = 0, maxY = 0;
  const out = Buffer.from(px);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const p = y * width + x;
    if (label[p] !== best.id || !solid[p]) { if (label[p] !== best.id) out[p * 4 + 3] = 0; continue; }
    if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  return crop({ width, height, px: out }, minX, minY, maxX - minX + 1, maxY - minY + 1);
};

const COL_X = [21, 106, 192, 288, 367, 448, 539, 619, 700];
const ROW_Y = [310, 450, 589, 730, 870, 1010];
const CUSTOMER_IDS = ['c01', 'c02', 'c03', 'c04', 'c05', 'c06', 'c07', 'c08', 'c09', 'c10', 'c11', 'c12', 'c13', 'c14', 'c15', 'c16', 'vip1', 'vip2'];
const MOODS = ['happy', 'neutral', 'angry'];
const FACE_W = 76;
const FACE_H = 95;

const windows = [];
CUSTOMER_IDS.forEach((id, index) => {
  const row = Math.floor(index / 3);
  const group = index % 3;
  MOODS.forEach((mood, moodIndex) => {
    windows.push({ name: `cus_${id}_${mood}`, x: (COL_X[group * 3 + moodIndex] ?? 0) - 3, y: (ROW_Y[row] ?? 0) - 1, w: FACE_W, h: FACE_H });
  });
});
windows.push(
  { name: 'beo_greeting', x: 672, y: 50, w: 124, h: 146 },
  { name: 'beo_excited', x: 800, y: 50, w: 132, h: 146 },
  { name: 'beo_sly', x: 953, y: 50, w: 96, h: 146 },
  { name: 'beo_worried', x: 1070, y: 50, w: 104, h: 146 },
  { name: 'beo_pointing', x: 1188, y: 50, w: 112, h: 146 },
  { name: 'beo_bust', x: 795, y: 240, w: 130, h: 148 },
  { name: 'logo_lockup', x: 10, y: 46, w: 196, h: 176 },
);

const sprites = windows.map((window) => {
  const cut = defringe(crop(sheet, window.x, window.y, window.w, window.h));
  return { name: window.name, img: isolate(cut) };
});

// Xếp kệ (shelf packing) vào atlas.
let x = PAD, y = PAD, rowHeight = 0;
const placed = [];
for (const sprite of sprites.sort((a, b) => b.img.height - a.img.height)) {
  if (x + sprite.img.width + PAD > ATLAS_WIDTH) { x = PAD; y += rowHeight + PAD; rowHeight = 0; }
  placed.push({ ...sprite, x, y });
  x += sprite.img.width + PAD;
  rowHeight = Math.max(rowHeight, sprite.img.height);
}
const atlasHeight = y + rowHeight + PAD;
const atlas = { width: ATLAS_WIDTH, height: atlasHeight, px: Buffer.alloc(ATLAS_WIDTH * atlasHeight * 4) };
const frames = {};
for (const sprite of placed) {
  for (let row = 0; row < sprite.img.height; row++) sprite.img.px.copy(atlas.px, ((sprite.y + row) * ATLAS_WIDTH + sprite.x) * 4, row * sprite.img.width * 4, (row + 1) * sprite.img.width * 4);
  const { width: w, height: h } = sprite.img;
  frames[sprite.name] = { frame: { x: sprite.x, y: sprite.y, w, h }, rotated: false, trimmed: false, sourceSize: { w, h }, spriteSourceSize: { x: 0, y: 0, w, h } };
}
mkdirSync(OUT_DIR, { recursive: true });
writePng(`${OUT_DIR}/characters.png`, atlas);
writeFileSync(`${OUT_DIR}/characters.json`, JSON.stringify({ frames, meta: { image: 'characters.png', size: { w: ATLAS_WIDTH, h: atlasHeight }, scale: '1' } }));
console.log(`atlas ${ATLAS_WIDTH}x${atlasHeight}, ${placed.length} frames`);
