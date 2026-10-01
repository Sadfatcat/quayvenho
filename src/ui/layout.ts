import { GAME_HEIGHT } from '../config';

/** PLAN §10.1: no interactive element inside these margins of the design canvas. */
export const SAFE_AREA_TOP = 60;
export const SAFE_AREA_BOTTOM = 50;
export const CONTENT_TOP = SAFE_AREA_TOP;
export const CONTENT_BOTTOM = GAME_HEIGHT - SAFE_AREA_BOTTOM;

export const MIN_TOUCH_SIZE = 88;

/** PLAN §10.4/§11.1: pointer moves under this many px still count as a tap, not a drag. */
export const DRAG_TAP_THRESHOLD_PX = 10;

/** Lề ngang an toàn của màn (px thiết kế) và khoảng cách giữa các nút trên một hàng. */
export const SCREEN_MARGIN = 24;
export const BUTTON_GAP = 16;

/** Chia đều `count` nút trên một hàng trong bề ngang `totalWidth`: trả về chiều rộng mỗi nút và toạ độ x tâm từng nút. */
export const buttonRow = (totalWidth: number, count: number): { width: number; centers: number[] } => {
  const usable = totalWidth - 2 * SCREEN_MARGIN - (count - 1) * BUTTON_GAP;
  const width = Math.floor(usable / count);
  const centers = Array.from({ length: count }, (_, index) => SCREEN_MARGIN + width / 2 + index * (width + BUTTON_GAP));
  return { width, centers };
};
