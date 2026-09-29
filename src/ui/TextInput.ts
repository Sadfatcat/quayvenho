import Phaser from 'phaser';
import { COLORS, FONT_FAMILY, RADIUS, toCssColor } from './theme';

export interface TextInputOptions {
  x: number;
  y: number;
  width: number;
  maxLength: number;
  placeholder?: string;
  initialValue?: string;
  onChange?: (value: string) => void;
}

const HEIGHT = 88;

/**
 * Ô nhập chữ dựng bằng `Phaser.GameObjects.DOMElement` (input HTML thật) —
 * cách duy nhất để có bàn phím ảo hoạt động đúng trên iOS/Android trong Phaser.
 * Cần bật `dom: { createContainer: true }` ở config game (xem `main.ts`).
 */
export class TextInput {
  private readonly dom: Phaser.GameObjects.DOMElement;
  readonly node: HTMLInputElement;

  constructor(scene: Phaser.Scene, options: TextInputOptions) {
    this.dom = scene.add.dom(options.x, options.y, 'input') as Phaser.GameObjects.DOMElement;
    this.node = this.dom.node as HTMLInputElement;
    this.node.type = 'text';
    this.node.maxLength = options.maxLength;
    this.node.placeholder = options.placeholder ?? '';
    this.node.value = options.initialValue ?? '';
    Object.assign(this.node.style, {
      width: `${options.width}px`,
      height: `${HEIGHT}px`,
      fontSize: '30px',
      fontFamily: FONT_FAMILY,
      textAlign: 'center',
      color: toCssColor(COLORS.text),
      border: `2px solid ${toCssColor(COLORS.textMuted)}`,
      borderRadius: `${RADIUS.sm}px`,
      padding: '0 16px',
      boxSizing: 'border-box',
    });
    if (options.onChange) {
      const handler = options.onChange;
      this.node.addEventListener('input', () => handler(this.value));
    }
  }

  get value(): string {
    return this.node.value.trim();
  }

  focus(): void {
    this.node.focus();
  }

  destroy(): void {
    this.dom.destroy();
  }
}
