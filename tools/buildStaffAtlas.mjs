// Gom ảnh nhân viên (mỗi file = 1 nhân viên × 3 biểu cảm) thành atlas riêng: node tools/buildStaffAtlas.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { readPng, writePng } from './pngtool.mjs';
import { processTriple } from './processTriple.mjs';

const SOURCE_DIR = 'DESIGN/stitch_chibi_game_ui_design/ảnh';
const OUT_DIR = 'public/assets/atlas';
const FRAME_HEIGHT = 192;
const ATLAS_WIDTH = 1024;
const PAD = 2;
/** Thứ tự 3 mặt trong ảnh nguồn (trái → phải): tập trung, vui, mệt. */
const MOODS = ['focused', 'happy', 'tired'];
/** `minGap`: ảnh có các mặt sát nhau; `erase`: vùng bị nét vẽ của mặt này lấn sang mặt kế bên (tô trắng trước khi tách). */
const STAFF_FILES = [
  { kind: 'intern', file: 'staff_intern.png.png', minGap: 8, erase: { x0: 500, x1: 530, y0: 655, y1: 682 } },
  { kind: 'junior', file: 'staff_junior.png.png', minGap: 6 },
  { kind: 'middle', file: 'staff_middle.png.png', minGap: 6 },
  { kind: 'senior', file: 'staff_senior.png.png' },
  { kind: 'marketing', file: 'staff_marketing.png.png' },
];

const paintWhite = (img, { x0, x1, y0, y1 }) => {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) img.px.fill(255, (y * img.width + x) * 4, (y * img.width + x) * 4 + 4);
};

const sprites = STAFF_FILES.flatMap(({ kind, file, minGap, erase }) => {
  const source = readPng(`${SOURCE_DIR}/${file}`);
  if (erase) paintWhite(source, erase);
  return processTriple(source, FRAME_HEIGHT, minGap).map((img, index) => ({ name: `staff_${kind}_${MOODS[index]}`, img }));
});

let x = PAD, y = PAD, rowHeight = 0;
const placed = [];
for (const sprite of sprites) {
  if (x + sprite.img.width + PAD > ATLAS_WIDTH) { x = PAD; y += rowHeight + PAD; rowHeight = 0; }
  placed.push({ ...sprite, x, y });
  x += sprite.img.width + PAD;
  rowHeight = Math.max(rowHeight, sprite.img.height);
}
const atlasHeight = y + rowHeight + PAD;
const atlas = { width: ATLAS_WIDTH, height: atlasHeight, px: Buffer.alloc(ATLAS_WIDTH * atlasHeight * 4) };
const frames = {};
for (const sprite of placed) {
  const { width: w, height: h } = sprite.img;
  for (let row = 0; row < h; row++) sprite.img.px.copy(atlas.px, ((sprite.y + row) * ATLAS_WIDTH + sprite.x) * 4, row * w * 4, (row + 1) * w * 4);
  frames[sprite.name] = { frame: { x: sprite.x, y: sprite.y, w, h }, rotated: false, trimmed: false, sourceSize: { w, h }, spriteSourceSize: { x: 0, y: 0, w, h } };
}
mkdirSync(OUT_DIR, { recursive: true });
writePng(`${OUT_DIR}/staff.png`, atlas);
writeFileSync(`${OUT_DIR}/staff.json`, JSON.stringify({ frames, meta: { image: 'staff.png', size: { w: ATLAS_WIDTH, h: atlasHeight }, scale: '1' } }));
console.log(`staff: ${ATLAS_WIDTH}x${atlasHeight}, ${placed.length} frames`);
