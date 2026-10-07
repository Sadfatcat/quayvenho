// Xử lý ảnh "1 nhân vật × 3 biểu cảm xếp ngang trên nền trắng": tách nền, tách 3 mặt, thu nhỏ về cùng kích thước.
import { crop } from './pngtool.mjs';

const BG_STRICT = 246;
const BG_SOFT = 222;
const MIN_GAP_PX = 24;
const ALPHA_VISIBLE = 40;

/** Tách nền trắng: flood-fill từ viền qua các điểm gần trắng, viền mềm theo độ sáng để không để lại quầng trắng. */
export const removeWhiteBackground = (img) => {
  const { width, height, px } = img;
  const out = Buffer.from(px);
  const isBg = new Uint8Array(width * height);
  const stack = [];
  const brightness = (p) => Math.min(px[p * 4], px[p * 4 + 1], px[p * 4 + 2]);
  const push = (x, y) => {
    const p = y * width + x;
    if (!isBg[p] && brightness(p) >= BG_SOFT) { isBg[p] = 1; stack.push(p); }
  };
  for (let x = 0; x < width; x++) { push(x, 0); push(x, height - 1); }
  for (let y = 0; y < height; y++) { push(0, y); push(width - 1, y); }
  while (stack.length) {
    const p = stack.pop();
    const x = p % width, y = (p - x) / width;
    if (x > 0) push(x - 1, y);
    if (x < width - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < height - 1) push(x, y + 1);
  }
  for (let p = 0; p < width * height; p++) {
    if (!isBg[p]) continue;
    const b = brightness(p);
    // Nền thật (rất sáng) → trong suốt hẳn; vùng chuyển tiếp → alpha theo độ tối.
    out[p * 4 + 3] = b >= BG_STRICT ? 0 : Math.round(((BG_STRICT - b) / (BG_STRICT - BG_SOFT)) * 255);
  }
  return { width, height, px: out };
};

const columnOccupancy = (img) => {
  const occ = new Uint8Array(img.width);
  for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) if (img.px[(y * img.width + x) * 4 + 3] > ALPHA_VISIBLE) occ[x] = 1;
  return occ;
};

/** Hai khoảng trống rộng nhất giữa các cột có nét vẽ → 3 dải. */
const splitIntoThreeBands = (occ, minGap = MIN_GAP_PX) => {
  const first = occ.indexOf(1);
  const last = occ.lastIndexOf(1);
  const gaps = [];
  let start = -1;
  for (let x = first; x <= last; x++) {
    if (!occ[x]) { if (start < 0) start = x; } else if (start >= 0) { gaps.push({ start, end: x - 1 }); start = -1; }
  }
  const widest = gaps.filter((g) => g.end - g.start + 1 >= minGap).sort((a, b) => b.end - b.start - (a.end - a.start)).slice(0, 2).sort((a, b) => a.start - b.start);
  if (widest.length < 2) throw new Error('không tách được 3 mặt (thiếu khoảng trống giữa các mặt)');
  const [g1, g2] = widest;
  return [[first, g1.start - 1], [g1.end + 1, g2.start - 1], [g2.end + 1, last]];
};

const rowBounds = (img, x0, x1) => {
  let top = img.height, bottom = 0;
  for (let y = 0; y < img.height; y++) for (let x = x0; x <= x1; x++) if (img.px[(y * img.width + x) * 4 + 3] > ALPHA_VISIBLE) { if (y < top) top = y; if (y > bottom) bottom = y; break; }
  return [top, bottom];
};

/** Thu nhỏ bằng trung bình theo diện tích (premultiplied alpha) để cạnh mịn. */
export const downscale = (img, factor) => {
  const w = Math.max(1, Math.round(img.width * factor));
  const h = Math.max(1, Math.round(img.height * factor));
  const px = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sx0 = Math.floor(x / factor), sx1 = Math.min(img.width, Math.ceil((x + 1) / factor));
      const sy0 = Math.floor(y / factor), sy1 = Math.min(img.height, Math.ceil((y + 1) / factor));
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let sy = sy0; sy < sy1; sy++) for (let sx = sx0; sx < sx1; sx++) {
        const o = (sy * img.width + sx) * 4;
        const al = img.px[o + 3] / 255;
        r += img.px[o] * al; g += img.px[o + 1] * al; b += img.px[o + 2] * al; a += al; n++;
      }
      const o = (y * w + x) * 4;
      if (a > 0) { px[o] = Math.round(r / a); px[o + 1] = Math.round(g / a); px[o + 2] = Math.round(b / a); }
      px[o + 3] = Math.round((a / n) * 255);
    }
  }
  return { width: w, height: h, px };
};

/** Trả về 3 ảnh (happy, neutral, angry) cùng kích thước, đã thu nhỏ về chiều cao `targetHeight`. `minGap`: khoảng trống tối thiểu giữa 2 mặt (ảnh các mặt sát nhau cần số nhỏ hơn). */
export const processTriple = (img, targetHeight, minGap = MIN_GAP_PX) => {
  const cut = removeWhiteBackground(img);
  const bands = splitIntoThreeBands(columnOccupancy(cut), minGap);
  const bounds = bands.map(([x0, x1]) => rowBounds(cut, x0, x1));
  const top = Math.min(...bounds.map(([t]) => t));
  const bottom = Math.max(...bounds.map(([, b]) => b));
  const width = Math.max(...bands.map(([x0, x1]) => x1 - x0 + 1));
  const height = bottom - top + 1;
  const factor = targetHeight / height;
  return bands.map(([x0, x1]) => {
    const centerX = Math.round((x0 + x1) / 2);
    const left = Math.max(0, Math.min(cut.width - width, centerX - Math.floor(width / 2)));
    const frame = crop(cut, left, top, width, height);
    // Xoá phần dải bên cạnh lọt vào khung (khung rộng bằng dải rộng nhất).
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const sx = left + x;
      if (sx < x0 || sx > x1) frame.px[(y * width + x) * 4 + 3] = 0;
    }
    return downscale(frame, factor);
  });
};

/** Tất cả các dải nét vẽ tách nhau bởi khoảng trống ≥ MIN_GAP_PX (trái → phải), dùng cho ảnh có số biến thể không cố định. */
export const findBands = (cut, minGap = MIN_GAP_PX) => {
  const occ = columnOccupancy(cut);
  const bands = [];
  let start = -1;
  let gap = 0;
  for (let x = 0; x <= cut.width; x++) {
    const filled = x < cut.width && occ[x] === 1;
    if (filled) {
      if (start < 0) start = x;
      gap = 0;
    } else if (start >= 0) {
      gap++;
      if (gap >= minGap || x === cut.width) {
        bands.push([start, x - gap]);
        start = -1;
        gap = 0;
      }
    }
  }
  return bands;
};

/** Lấy dải thứ `pick` trong ảnh (đã tách nền), cắt sát và thu nhỏ về chiều cao `targetHeight`. */
export const extractBand = (img, pick, targetHeight, minGap = MIN_GAP_PX) => {
  const cut = removeWhiteBackground(img);
  const bands = findBands(cut, minGap);
  const band = bands[pick];
  if (!band) throw new Error(`ảnh chỉ có ${bands.length} dải, cần dải ${pick}`);
  const [x0, x1] = band;
  const [top, bottom] = rowBounds(cut, x0, x1);
  const frame = crop(cut, x0, top, x1 - x0 + 1, bottom - top + 1);
  return downscale(frame, targetHeight / frame.height);
};
