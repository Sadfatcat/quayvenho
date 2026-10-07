import Phaser from 'phaser';
import { COLORS, FONT_FAMILY, RADIUS, toCssColor } from './theme';

export type InfoTone = 'info' | 'warning';

export interface InfoBoxOptions {
  width: number;
  text?: string;
  tone?: InfoTone;
  fontSize?: number;
  /** Đệm dọc trong khung (mặc định 10); ô nằm ở chỗ chật như thanh trên cùng dùng số nhỏ hơn. */
  paddingY?: number;
}

const TONE_STYLE: Record<InfoTone, { fill: number; stroke: number }> = {
  info: { fill: COLORS.infoTint, stroke: COLORS.teal },
  warning: { fill: COLORS.warningTint, stroke: COLORS.warning },
};
const DEFAULT_FONT_PX = 22;
const PADDING_X = 18;
const DEFAULT_PADDING_Y = 10;
const STROKE_WIDTH = 3;

/**
 * Ô thông tin: luôn có khung, nền màu và chữ đậm màu tối để dễ đọc (CLAUDE.md "ô hiện thông tin").
 * Đặt tâm ngang ở `x`, mép trên ở `top`; cao theo nội dung, chữ rỗng thì ẩn.
 */
export class InfoBox extends Phaser.GameObjects.Container {
  private readonly background: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;
  private readonly boxWidth: number;
  private readonly tone: InfoTone;
  private readonly paddingY: number;
  private boxHeight = 0;

  constructor(scene: Phaser.Scene, x: number, top: number, options: InfoBoxOptions) {
    super(scene, x, top);
    this.boxWidth = options.width;
    this.tone = options.tone ?? 'info';
    this.paddingY = options.paddingY ?? DEFAULT_PADDING_Y;
    this.background = scene.add.graphics();
    this.label = scene.add
      .text(0, this.paddingY, '', {
        fontFamily: FONT_FAMILY,
        fontSize: `${options.fontSize ?? DEFAULT_FONT_PX}px`,
        fontStyle: 'bold',
        color: toCssColor(COLORS.text),
        align: 'center',
        wordWrap: { width: options.width - 2 * PADDING_X },
      })
      .setOrigin(0.5, 0);
    this.add([this.background, this.label]);
    scene.add.existing(this);
    this.setText(options.text ?? '');
  }

  get contentHeight(): number {
    return this.boxHeight;
  }

  setText(text: string): this {
    this.label.setText(text);
    this.setVisible(text !== '');
    this.boxHeight = text === '' ? 0 : Math.ceil(this.label.height) + 2 * this.paddingY;
    const { fill, stroke } = TONE_STYLE[this.tone];
    this.background.clear();
    this.background.fillStyle(fill, 1);
    this.background.fillRoundedRect(-this.boxWidth / 2, 0, this.boxWidth, this.boxHeight, RADIUS.sm);
    this.background.lineStyle(STROKE_WIDTH, stroke, 1);
    this.background.strokeRoundedRect(-this.boxWidth / 2, 0, this.boxWidth, this.boxHeight, RADIUS.sm);
    return this;
  }
}
