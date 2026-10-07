// Cắt nền và thu nhỏ ảnh nâng cấp "Khu chờ thoải mái": node tools/buildLoungeImage.mjs
import { crop, readPng, writePng } from './pngtool.mjs';
import { downscale, removeWhiteBackground } from './processTriple.mjs';

const SOURCE = 'DESIGN/stitch_chibi_game_ui_design/ảnh/cozy airport waiting lounge.png';
const OUTPUT = 'public/assets/items/upgrade_waiting_lounge.png';
const ALPHA_VISIBLE = 40;
const TARGET_WIDTH = 240;

const cut = removeWhiteBackground(readPng(SOURCE));
let minX = cut.width, maxX = 0, minY = cut.height, maxY = 0;
for (let y = 0; y < cut.height; y++) for (let x = 0; x < cut.width; x++) {
  if (cut.px[(y * cut.width + x) * 4 + 3] <= ALPHA_VISIBLE) continue;
  if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
}
const framed = crop(cut, minX, minY, maxX - minX + 1, maxY - minY + 1);
writePng(OUTPUT, downscale(framed, TARGET_WIDTH / framed.width));
console.log(`${OUTPUT}: ${framed.width}x${framed.height} -> ${TARGET_WIDTH}px wide`);
