import Phaser from 'phaser';
import { Panel } from './Panel';
import { COLORS, FONT_FAMILY, HEADING_FONT_FAMILY, toCssColor } from './theme';

export interface SpeechBubbleOptions {
  width: number;
  text: string;
  /** Tên người nói: hiện ở "tab" nhỏ chồng lên góc trên trái của khung chat. */
  speaker?: string;
  /** Đuôi bong bóng chỉ xuống (tới nhân vật phía dưới) tại độ lệch x so với tâm khung. */
  tailX?: number;
  fontSize?: number;
}

const MIN_HEIGHT = 70;
const PADDING = 40;
const TAIL_HALF_WIDTH = 22;
const TAIL_HEIGHT = 34;
const TAIL_LINE = 4;
const SPEAKER_TAB_HEIGHT = 44;
const SPEAKER_TAB_PADDING = 26;
const SPEAKER_TAB_OFFSET = { x: 24, y: -SPEAKER_TAB_HEIGHT / 2 - 4 };
const TAB_RADIUS = 22;

/**
 * Khung chat dùng cho yêu cầu của khách (Quầy), thoại của Béo (Onboarding, Tutorial).
 * Có đuôi trỏ về nhân vật và tab tên người nói.
 */
export class SpeechBubble extends Phaser.GameObjects.Container {
  private readonly widthValue: number;
  private readonly textObj: Phaser.GameObjects.Text;
  private readonly options: SpeechBubbleOptions;
  private decor: Phaser.GameObjects.Container | null = null;
  private panel: Panel | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, options: SpeechBubbleOptions) {
    super(scene, x, y);
    this.options = options;
    this.widthValue = options.width;
    this.textObj = scene.add
      .text(0, 0, options.text, {
        fontFamily: FONT_FAMILY,
        fontSize: `${options.fontSize ?? 26}px`,
        color: toCssColor(COLORS.text),
        align: 'center',
        wordWrap: { width: options.width - PADDING },
      })
      .setOrigin(0.5);
    this.add(this.textObj);
    this.rebuildFrame();
    scene.add.existing(this);
  }

  setText(text: string): void {
    this.textObj.setText(text);
    this.rebuildFrame();
  }

  /** Chiều cao hiện tại của khung (không kể đuôi), để căn các phần tử xung quanh. */
  get frameHeight(): number {
    return this.heightFor(this.textObj);
  }

  private rebuildFrame(): void {
    this.panel?.destroy();
    this.decor?.destroy();
    const height = this.heightFor(this.textObj);
    this.panel = new Panel(this.scene, 0, 0, { width: this.widthValue, height, strokeColor: COLORS.text });
    this.decor = this.scene.add.container(0, 0);
    if (this.options.tailX !== undefined) this.decor.add(this.drawTail(this.options.tailX, height));
    if (this.options.speaker) this.decor.add(this.drawSpeakerTab(this.options.speaker, height));
    this.addAt(this.panel, 0);
    this.addAt(this.decor, 1);
  }

  private drawTail(tailX: number, height: number): Phaser.GameObjects.Graphics {
    const g = this.scene.add.graphics();
    const top = height / 2;
    g.fillStyle(COLORS.cloud, 1);
    g.fillTriangle(tailX - TAIL_HALF_WIDTH, top - 2, tailX + TAIL_HALF_WIDTH, top - 2, tailX - TAIL_HALF_WIDTH * 0.2, top + TAIL_HEIGHT);
    g.lineStyle(TAIL_LINE, COLORS.text, 1);
    g.beginPath();
    g.moveTo(tailX - TAIL_HALF_WIDTH, top);
    g.lineTo(tailX - TAIL_HALF_WIDTH * 0.2, top + TAIL_HEIGHT);
    g.lineTo(tailX + TAIL_HALF_WIDTH, top);
    g.strokePath();
    // Che đường viền của khung ở chân đuôi để đuôi liền với bong bóng.
    g.fillStyle(COLORS.cloud, 1);
    g.fillRect(tailX - TAIL_HALF_WIDTH + TAIL_LINE / 2, top - TAIL_LINE, TAIL_HALF_WIDTH * 2 - TAIL_LINE, TAIL_LINE + 2);
    return g;
  }

  private drawSpeakerTab(speaker: string, height: number): Phaser.GameObjects.Container {
    const label = this.scene.add
      .text(0, 0, speaker, { fontFamily: HEADING_FONT_FAMILY, fontSize: '22px', fontStyle: 'bold', color: toCssColor(COLORS.cloud) })
      .setOrigin(0.5);
    const tabWidth = label.width + SPEAKER_TAB_PADDING * 2;
    const g = this.scene.add.graphics();
    g.fillStyle(COLORS.primaryDark, 1);
    g.fillRoundedRect(-tabWidth / 2, -SPEAKER_TAB_HEIGHT / 2 + 3, tabWidth, SPEAKER_TAB_HEIGHT, TAB_RADIUS);
    g.fillStyle(COLORS.primary, 1);
    g.fillRoundedRect(-tabWidth / 2, -SPEAKER_TAB_HEIGHT / 2, tabWidth, SPEAKER_TAB_HEIGHT, TAB_RADIUS);
    const tab = this.scene.add.container(-this.widthValue / 2 + SPEAKER_TAB_OFFSET.x + tabWidth / 2, -height / 2 + SPEAKER_TAB_OFFSET.y, [g, label]);
    return tab;
  }

  private heightFor(textObj: Phaser.GameObjects.Text): number {
    return Math.max(MIN_HEIGHT, textObj.height + PADDING);
  }
}
