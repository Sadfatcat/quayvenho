// Cắt tờ ảnh tổng hợp (con dấu, vé, dụng cụ) thành từng PNG trong suốt theo vị trí trên tờ ảnh.
import { mkdirSync } from 'node:fs';
import { readPng, writePng, crop } from './pngtool.mjs';
import { removeWhiteBackground } from './processTriple.mjs';

const ALPHA_VISIBLE = 40;
const MIN_OBJECT_HEIGHT_PX = 60;
const MERGE_RADIUS_PX = 3;

const labelComponents = (img) => {
  const { width, height, px } = img;
  const visible = new Uint8Array(width * height);
  for (let p = 0; p < width * height; p++) visible[p] = px[p * 4 + 3] > ALPHA_VISIBLE ? 1 : 0;
  const seen = new Uint8Array(width * height);
  const boxes = [];
  for (let start = 0; start < width * height; start++) {
    if (!visible[start] || seen[start]) continue;
    let minX = width, maxX = 0, minY = height, maxY = 0, area = 0;
    const stack = [start];
    seen[start] = 1;
    while (stack.length) {
      const p = stack.pop();
      const x = p % width, y = (p - x) / width;
      area++;
      if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
      for (let dy = -MERGE_RADIUS_PX; dy <= MERGE_RADIUS_PX; dy++) {
        for (let dx = -MERGE_RADIUS_PX; dx <= MERGE_RADIUS_PX; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const q = ny * width + nx;
          if (visible[q] && !seen[q]) { seen[q] = 1; stack.push(q); }
        }
      }
    }
    boxes.push({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, area });
  }
  return boxes.filter((b) => b.h >= MIN_OBJECT_HEIGHT_PX);
};

const NAMES_BY_INDEX = {
  0: 'stamp_sgn', 1: 'stamp_dad', 2: 'stamp_cxr', 11: 'stamp_pqc', 12: 'stamp_dli', 13: 'stamp_bkk', 18: 'stamp_icn', 19: 'stamp_nrt', 20: 'stamp_cdg',
  23: 'mark_sgn', 24: 'mark_dad', 25: 'mark_cxr', 28: 'mark_pqc', 29: 'mark_dli', 30: 'mark_bkk', 34: 'mark_icn', 35: 'mark_nrt', 33: 'mark_cdg',
  6: 'time_2130', 7: 'time_2230', 8: 'time_2330', 9: 'time_0030', 10: 'time_0130',
  17: 'stack_eco', 16: 'stack_biz',
  3: 'service_meal', 4: 'service_wheelchair', 5: 'service_insurance',
  15: 'upgrade_comfy_chairs', 14: 'upgrade_fan', 21: 'upgrade_fast_printer', 22: 'upgrade_search_filter',
  26: 'upgrade_airline_relations', 27: 'upgrade_refund_policy', 31: 'upgrade_bigger_counter', 32: 'upgrade_loyalty_board',
};
const PADDING_PX = 2;

const [, , input, outDir, mode] = process.argv;
const img = removeWhiteBackground(readPng(input));
const boxes = labelComponents(img);
if (mode === 'list') {
  console.log(img.width, img.height);
  boxes.forEach((b, i) => console.log(i, b.x, b.y, b.w, b.h));
} else {
  mkdirSync(outDir, { recursive: true });
  boxes.forEach((b, index) => {
    const name = NAMES_BY_INDEX[index];
    if (!name) return;
    const x = Math.max(0, b.x - PADDING_PX), y = Math.max(0, b.y - PADDING_PX);
    const w = Math.min(img.width - x, b.w + PADDING_PX * 2), h = Math.min(img.height - y, b.h + PADDING_PX * 2);
    writePng(`${outDir}/${name}.png`, crop(img, x, y, w, h));
  });
}
