import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';

export type BackgroundTheme = 'title' | 'story' | 'prep' | 'counter' | 'summary' | 'shop';

const BACKGROUND_DEPTH = -1000;
const GRADIENT_STEPS = 48;

const lerpChannel = (from: number, to: number, t: number): number => Math.round(from + (to - from) * t);
const lerpColor = (from: number, to: number, t: number): number =>
  (lerpChannel((from >> 16) & 0xff, (to >> 16) & 0xff, t) << 16) | (lerpChannel((from >> 8) & 0xff, (to >> 8) & 0xff, t) << 8) | lerpChannel(from & 0xff, to & 0xff, t);

const verticalGradient = (g: Phaser.GameObjects.Graphics, top: number, bottom: number, y0 = 0, y1 = GAME_HEIGHT): void => {
  const step = (y1 - y0) / GRADIENT_STEPS;
  for (let index = 0; index < GRADIENT_STEPS; index++) {
    g.fillStyle(lerpColor(top, bottom, index / (GRADIENT_STEPS - 1)), 1);
    g.fillRect(0, y0 + index * step, GAME_WIDTH, Math.ceil(step) + 1);
  }
};

const OUTLINE = 0x4a3525;
const KRAFT = 0xe6d2b5;
const BISCUIT = 0xf5e8d3;
const WALNUT = 0x6c4f3d;
const AMBER = 0xe3a94f;
const TERRACOTTA = 0xc86d51;
/** Kệ trang trí nằm trên thanh tiêu đề (y < 54) để không đè chữ. */
const SHELF_Y = 46;

const paperPlane = (g: Phaser.GameObjects.Graphics, x: number, y: number, size: number): void => {
  g.fillStyle(0xfffdf9, 0.9);
  g.lineStyle(3, OUTLINE, 0.35);
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x + size, y - size * 0.35);
  g.lineTo(x + size * 0.35, y + size * 0.25);
  g.closePath();
  g.fillPath();
  g.strokePath();
};

const drawAirportDusk = (g: Phaser.GameObjects.Graphics, withFloor: boolean): void => {
  verticalGradient(g, 0xf3c79b, 0xfdf6ec);
  // Cửa sổ vòm lớn nhìn ra sân bay.
  g.fillStyle(0xfdf6ec, 0.45);
  g.fillRoundedRect(70, 80, 580, 760, { tl: 290, tr: 290, bl: 24, br: 24 });
  g.lineStyle(10, KRAFT, 0.9);
  g.strokeRoundedRect(70, 80, 580, 760, { tl: 290, tr: 290, bl: 24, br: 24 });
  g.lineStyle(6, KRAFT, 0.8);
  g.lineBetween(360, 80, 360, 840);
  g.lineBetween(70, 520, 650, 520);
  // Đèn đường băng và nhà ga phía xa.
  g.fillStyle(KRAFT, 1);
  g.fillRect(0, 960, GAME_WIDTH, GAME_HEIGHT - 960);
  g.fillStyle(0xd9bfa0, 1);
  g.fillRect(0, 960, 110, 80);
  g.fillRect(150, 930, 90, 110);
  g.fillRect(480, 945, 120, 95);
  g.fillRect(620, 970, 100, 70);
  for (let index = 0; index < 14; index++) {
    g.fillStyle(AMBER, 0.95);
    g.fillCircle(40 + index * 48, 1060 + (index % 2) * 6, 7);
  }
  if (withFloor) {
    g.fillStyle(BISCUIT, 1);
    g.fillRect(0, 1120, GAME_WIDTH, GAME_HEIGHT - 1120);
    g.fillStyle(KRAFT, 1);
    g.fillRect(0, 1116, GAME_WIDTH, 8);
  }
  paperPlane(g, 130, 210, 56);
  paperPlane(g, 540, 300, 44);
  paperPlane(g, 610, 150, 34);
};

const drawStockroom = (g: Phaser.GameObjects.Graphics): void => {
  verticalGradient(g, BISCUIT, 0xfdf6ec);
  // Kệ trên cao với hộp kraft.
  g.fillStyle(0xd9bfa0, 1);
  g.fillRect(0, SHELF_Y, GAME_WIDTH, 12);
  const boxes = [60, 170, 300, 430, 560];
  boxes.forEach((x, index) => {
    const w = 70 + (index % 3) * 20;
    const h = 30 + (index % 2) * 12;
    g.fillStyle(KRAFT, 1);
    g.fillRect(x, SHELF_Y - h, w, h);
    g.fillStyle(0xd9bfa0, 1);
    g.fillRect(x + w / 2 - 4, SHELF_Y - h, 8, h);
  });
  // Sàn và hộp ở dưới.
  g.fillStyle(KRAFT, 1);
  g.fillRect(0, 1130, GAME_WIDTH, GAME_HEIGHT - 1130);
  [40, 180, 560].forEach((x, index) => {
    g.fillStyle(0xd9bfa0, 1);
    g.fillRect(x, 1090, 110 + index * 10, 60);
    g.fillStyle(WALNUT, 0.35);
    g.fillRect(x + 50, 1090, 8, 60);
  });
};

const drawCounterRoom = (g: Phaser.GameObjects.Graphics): void => {
  verticalGradient(g, 0xf7dcc0, 0xfdf6ec, 0, 640);
  // Đèn lồng treo.
  [190, 410].forEach((x) => {
    g.lineStyle(3, OUTLINE, 0.4);
    g.lineBetween(x, 0, x, 52);
    g.fillStyle(TERRACOTTA, 0.9);
    g.fillEllipse(x, 78, 52, 62);
    g.fillStyle(AMBER, 0.9);
    g.fillRect(x - 12, 46, 24, 8);
  });
  // Mặt quầy gỗ: viền trên + thớ ván.
  g.fillStyle(0xd9bfa0, 1);
  g.fillRect(0, 640, GAME_WIDTH, GAME_HEIGHT - 640);
  g.fillStyle(0x9b7653, 1);
  g.fillRect(0, 636, GAME_WIDTH, 18);
  g.fillStyle(0xf0dfc4, 1);
  g.fillRect(0, 654, GAME_WIDTH, 10);
  for (let y = 700; y < GAME_HEIGHT; y += 78) {
    g.lineStyle(3, 0xb8946b, 0.55);
    g.lineBetween(0, y, GAME_WIDTH, y);
  }
};

const drawSummaryRoom = (g: Phaser.GameObjects.Graphics): void => {
  verticalGradient(g, 0xf0cfae, 0xfdf6ec);
  // Cửa cuốn đã hạ ở phía trên.
  g.fillStyle(KRAFT, 0.7);
  g.fillRect(0, 0, GAME_WIDTH, 150);
  for (let y = 10; y < 150; y += 22) {
    g.lineStyle(3, 0xb8946b, 0.5);
    g.lineBetween(0, y, GAME_WIDTH, y);
  }
  // Ánh đèn bàn.
  g.fillStyle(0xfff3d6, 0.5);
  g.fillTriangle(560, 190, 700, 190, 760, 520);
  g.fillTriangle(560, 190, 700, 190, 520, 520);
  g.fillStyle(WALNUT, 0.55);
  g.fillRect(612, 150, 14, 46);
  g.fillEllipse(619, 190, 92, 26);
  // Bàn gỗ với tách trà và bánh quy.
  g.fillStyle(0xc7a57f, 1);
  g.fillRect(0, 1130, GAME_WIDTH, GAME_HEIGHT - 1130);
  g.fillStyle(0x9b7653, 1);
  g.fillRect(0, 1126, GAME_WIDTH, 12);
  g.fillStyle(0xfffdf9, 1);
  g.fillRoundedRect(60, 1070, 70, 58, { tl: 6, tr: 6, bl: 28, br: 28 });
  g.lineStyle(5, 0xfffdf9, 1);
  g.strokeCircle(140, 1094, 14);
  g.fillStyle(0xd9a273, 1);
  g.fillCircle(210, 1112, 18);
  g.fillCircle(246, 1118, 14);
};

const drawWorkshop = (g: Phaser.GameObjects.Graphics): void => {
  verticalGradient(g, 0xfdf6ec, BISCUIT);
  // Bảng đục lỗ (pegboard).
  g.fillStyle(WALNUT, 0.12);
  for (let y = 24; y < GAME_HEIGHT; y += 44) for (let x = 24; x < GAME_WIDTH; x += 44) g.fillCircle(x, y, 4);
  // Kệ gỗ với chậu cây nhỏ.
  [SHELF_Y, 1180].forEach((y) => {
    g.fillStyle(0x9b7653, 0.9);
    g.fillRect(0, y, GAME_WIDTH, 14);
  });
  [60, 190, 560].forEach((x, index) => {
    g.fillStyle(TERRACOTTA, 0.85);
    g.fillRoundedRect(x, SHELF_Y - 30, 54, 30, 8);
    g.fillStyle(0x6e8b74, 0.9);
    g.fillEllipse(x + 27, SHELF_Y - 38, 44, 36 + index * 4);
  });
};

const DRAWERS: Record<BackgroundTheme, (g: Phaser.GameObjects.Graphics) => void> = {
  title: (g) => drawAirportDusk(g, false),
  story: (g) => drawAirportDusk(g, true),
  prep: drawStockroom,
  counter: drawCounterRoom,
  summary: drawSummaryRoom,
  shop: drawWorkshop,
};

/** Nền trang trí theo từng màn (thay nền kem trơn). Vẽ bằng Graphics một lần, nằm dưới mọi thứ khác. */
export const addSceneBackground = (scene: Phaser.Scene, theme: BackgroundTheme): Phaser.GameObjects.Graphics => {
  const g = scene.add.graphics().setDepth(BACKGROUND_DEPTH).setScrollFactor(0);
  DRAWERS[theme](g);
  return g;
};
