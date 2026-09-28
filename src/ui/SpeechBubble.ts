import Phaser from 'phaser';
import { Panel } from './Panel';
import { COLORS, FONT_FAMILY, toCssColor } from './theme';

export interface SpeechBubbleOptions {
  width: number;
  text: string;
}

const MIN_HEIGHT = 70;
const PADDING = 40;

/** Reused for a customer's order summary and, later, Béo's tutorial lines. */
export class SpeechBubble extends Phaser.GameObjects.Container {
  private readonly widthValue: number;
  private readonly textObj: Phaser.GameObjects.Text;
  private panel: Panel;

  constructor(scene: Phaser.Scene, x: number, y: number, options: SpeechBubbleOptions) {
    super(scene, x, y);
    this.widthValue = options.width;
    this.textObj = scene.add
      .text(0, 0, options.text, {
        fontFamily: FONT_FAMILY,
        fontSize: '26px',
        color: toCssColor(COLORS.text),
        align: 'center',
        wordWrap: { width: options.width - PADDING },
      })
      .setOrigin(0.5);
    this.panel = new Panel(scene, 0, 0, { width: options.width, height: this.heightFor(this.textObj), strokeColor: COLORS.text });
    this.add([this.panel, this.textObj]);
    scene.add.existing(this);
  }

  setText(text: string): void {
    this.textObj.setText(text);
    this.panel.destroy();
    this.panel = new Panel(this.scene, 0, 0, { width: this.widthValue, height: this.heightFor(this.textObj), strokeColor: COLORS.text });
    this.addAt(this.panel, 0);
  }

  private heightFor(textObj: Phaser.GameObjects.Text): number {
    return Math.max(MIN_HEIGHT, textObj.height + PADDING);
  }
}
