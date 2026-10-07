import type Phaser from 'phaser';
import type { SpeechSegment } from './orderRequest';
import { COLORS, FONT_FAMILY, toCssColor } from './theme';

export interface HighlightedTextOptions {
  x: number;
  y: number;
  maxWidth: number;
  fontSize: number;
  lineSpacing: number;
  /** Độ trong suốt của đoạn không phải yêu cầu (làm mờ để mắt chỉ dừng ở phần đậm). */
  fillerAlpha: number;
}

const WORD_SPLIT = /(\s+)/;

/**
 * Vẽ một câu gồm nhiều đoạn: đoạn `key` in đậm, đậm màu; đoạn còn lại thường, màu nhạt và mờ.
 * Phaser Text không trộn kiểu chữ trong một khối nên mỗi từ là một Text, tự xuống dòng khi chạm `maxWidth`.
 */
export const addHighlightedSpeech = (scene: Phaser.Scene, parent: Phaser.GameObjects.Container, segments: readonly SpeechSegment[], options: HighlightedTextOptions): void => {
  const { x, y, maxWidth, fontSize, lineSpacing, fillerAlpha } = options;
  let cursorX = 0;
  let cursorY = 0;
  let lineHeight = 0;
  for (const segment of segments) {
    const style = {
      fontFamily: FONT_FAMILY,
      fontSize: `${fontSize}px`,
      fontStyle: segment.key ? 'bold' : 'normal',
      color: toCssColor(segment.key ? COLORS.primaryDark : COLORS.textMuted),
    };
    for (const piece of segment.text.split(WORD_SPLIT)) {
      if (piece === '') continue;
      const isSpace = /^\s+$/.test(piece);
      const word = scene.add.text(0, 0, isSpace ? ' ' : piece, style).setOrigin(0, 0);
      if (!isSpace && cursorX > 0 && cursorX + word.width > maxWidth) {
        cursorX = 0;
        cursorY += lineHeight + lineSpacing;
      }
      if (isSpace && cursorX === 0) {
        word.destroy();
        continue;
      }
      word.setPosition(x + cursorX, y + cursorY);
      word.setAlpha(segment.key ? 1 : fillerAlpha);
      parent.add(word);
      cursorX += word.width;
      lineHeight = Math.max(lineHeight, word.height);
    }
  }
};
