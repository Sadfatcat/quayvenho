import { GAME_HEIGHT } from '../config';

/** PLAN §10.1: no interactive element inside these margins of the design canvas. */
export const SAFE_AREA_TOP = 60;
export const SAFE_AREA_BOTTOM = 50;
export const CONTENT_TOP = SAFE_AREA_TOP;
export const CONTENT_BOTTOM = GAME_HEIGHT - SAFE_AREA_BOTTOM;

export const MIN_TOUCH_SIZE = 88;

/** PLAN §10.4/§11.1: pointer moves under this many px still count as a tap, not a drag. */
export const DRAG_TAP_THRESHOLD_PX = 10;
