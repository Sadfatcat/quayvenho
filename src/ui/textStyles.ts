import type Phaser from 'phaser';
import { COLORS, FONT_FAMILY, toCssColor } from './theme';

type TextStyle = Phaser.Types.GameObjects.Text.TextStyle;

const base: TextStyle = { fontFamily: FONT_FAMILY, color: toCssColor(COLORS.text) };

export const TEXT_STYLES = {
  title: { ...base, fontSize: '56px', fontStyle: 'bold' },
  heading: { ...base, fontSize: '36px', fontStyle: 'bold' },
  body: { ...base, fontSize: '28px' },
  label: { ...base, fontSize: '24px', color: toCssColor(COLORS.textMuted) },
  button: { ...base, fontSize: '30px', fontStyle: 'bold', color: toCssColor(COLORS.cloud) },
} satisfies Record<string, TextStyle>;
