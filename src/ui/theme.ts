export const COLORS = {
  sky: 0xbfe3f5, cloud: 0xffffff, primary: 0x4a90d9, primaryDark: 0x2f6fb3,
  accent: 0xffb86b, success: 0x7bc47f, danger: 0xf28b82, warning: 0xffd86b,
  text: 0x2f3b52, textMuted: 0x7a869a, disabled: 0xc9d3de, seatOther: 0xd9dee5,
} as const;

export const toCssColor = (color: number) => `#${color.toString(16).padStart(6, '0')}`;
