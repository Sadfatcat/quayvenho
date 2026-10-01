import type Phaser from 'phaser';
import { COLORS, FONT_FAMILY, HEADING_FONT_FAMILY, toCssColor } from './theme';

type TextStyle = Phaser.Types.GameObjects.Text.TextStyle;

const base: TextStyle = { fontFamily: FONT_FAMILY, color: toCssColor(COLORS.text) };

export const TEXT_STYLES = {
  title: { ...base, fontFamily: HEADING_FONT_FAMILY, fontSize: '56px', fontStyle: '800' },
  heading: { ...base, fontFamily: HEADING_FONT_FAMILY, fontSize: '36px', fontStyle: 'bold' },
  body: { ...base, fontSize: '28px' },
  label: { ...base, fontSize: '24px', color: toCssColor(COLORS.textMuted) },
  button: { ...base, fontSize: '30px', fontStyle: 'bold', color: toCssColor(COLORS.cloud) },
} satisfies Record<string, TextStyle>;
