/** Bảng màu "đất nung – gỗ óc chó" theo docs/STYLE.md (PLAN §15 D3). Tên khoá giữ nguyên để mọi nơi dùng lại. */
export const COLORS = {
  sky: 0xfdf6ec, cloud: 0xfffdf9, primary: 0x6c4f3d, primaryDark: 0x4a3525,
  accent: 0xc86d51, success: 0x6e8b74, danger: 0xb5503a, warning: 0x9a6a1f,
  text: 0x4a3525, textMuted: 0x6a4d38, disabled: 0xd9c8b0, seatOther: 0xe6d2b5,
  panel: 0xf5e8d3, kraft: 0xe6d2b5, teal: 0x5b8a8c, tealDark: 0x3b5e60, accentDark: 0x8f4631, successDark: 0x4d6654, moneyGreen: 0x2a7a3b, moneyGreenDark: 0x1d5a2a, dangerDark: 0x7e3524, warningTint: 0xfbeccb, infoTint: 0xe1eeed,
} as const;

export const toCssColor = (color: number) => `#${color.toString(16).padStart(6, '0')}`;

/** Chữ nội dung/nhãn (Nunito Sans) và tiêu đề (Be Vietnam Pro), tự host ở public/assets/fonts (PLAN §10.1, §15 D2). */
export const FONT_FAMILY = '"Nunito Sans", "Segoe UI", sans-serif';
export const HEADING_FONT_FAMILY = '"Be Vietnam Pro", "Nunito Sans", "Segoe UI", sans-serif';

/** Các cỡ chữ cần đợi tải xong trước khi vào game (PreloadScene). */
export const FONT_LOAD_SPECS = ['700 28px "Be Vietnam Pro"', '800 28px "Be Vietnam Pro"', '500 20px "Nunito Sans"', '700 20px "Nunito Sans"'] as const;

export const RADIUS = { sm: 8, md: 16, lg: 24 } as const;
export const SPACING = { xs: 8, sm: 12, md: 16, lg: 24, xl: 32 } as const;

/** Độ nổi kiểu "đùn gỗ" (STYLE §4): đáy đặc, không bóng mờ. */
export const EXTRUSION = { button: 5, card: 4, pressedOffset: 3 } as const;
