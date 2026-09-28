export const COLORS = {
  sky: 0xbfe3f5, cloud: 0xffffff, primary: 0x4a90d9, primaryDark: 0x2f6fb3,
  accent: 0xffb86b, success: 0x7bc47f, danger: 0xf28b82, warning: 0xffd86b,
  text: 0x2f3b52, textMuted: 0x7a869a, disabled: 0xc9d3de, seatOther: 0xd9dee5,
} as const;

export const toCssColor = (color: number) => `#${color.toString(16).padStart(6, '0')}`;

/** Placeholder until Nunito/Baloo 2 are hosted locally (PLAN §10.1, §15 D2). */
export const FONT_FAMILY = 'Nunito, "Segoe UI", sans-serif';

export const RADIUS = { sm: 8, md: 16, lg: 24 } as const;
export const SPACING = { xs: 8, sm: 12, md: 16, lg: 24, xl: 32 } as const;
