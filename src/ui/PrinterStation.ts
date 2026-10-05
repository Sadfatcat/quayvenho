import Phaser from 'phaser';
import { STRINGS } from '@data/strings';
import { hasItemImage, printerImageKey } from './itemImages';
import { Panel } from './Panel';
import { COLORS, FONT_FAMILY, HEADING_FONT_FAMILY, toCssColor } from './theme';

export type PrinterMode = 'NEED_TICKET' | 'FILL_TICKET' | 'READY_TO_PRINT' | 'PRINTING' | 'TICKET_READY';

export interface PrinterStationOptions {
  width: number;
  height: number;
  /** Đã mua nâng cấp máy in nhanh: đổi sang ảnh máy in xịn. */
  upgraded: boolean;
  mode: PrinterMode;
  /** Bấm vào máy khi đang ở READY_TO_PRINT (thay cho kéo vé vào). */
  onTap: () => void;
}

const IMAGE_AREA_RATIO = 0.64;
const IMAGE_FILL_RATIO = 0.92;
const BAR_HEIGHT = 12;
const BAR_MARGIN = 20;
const CAPTION_FONT_PX = 16;
const GLOW_WIDTH = 5;
const PULSE_MS = 600;
const SHAKE_PX = 3;
const SHAKE_MS = 70;
const FALLBACK_LABEL_FONT_PX = 26;

const CAPTION_BY_MODE: Record<PrinterMode, string> = {
  NEED_TICKET: STRINGS.counter.desk.printerNeedTicketHint,
  FILL_TICKET: STRINGS.counter.desk.printerFillHint,
  READY_TO_PRINT: STRINGS.counter.desk.printerDropHint,
  PRINTING: STRINGS.counter.desk.printerBusyHint,
  TICKET_READY: STRINGS.counter.desk.printerReadyHint,
};

/**
 * Máy in vé ở góc dưới quầy: kéo vé nháp vào máy (hoặc bấm máy) để in; khi đang in máy rung và có thanh tiến độ.
 * Ảnh máy in dởm/xịn theo nâng cấp; thiếu ảnh thì vẽ tạm bằng hình. Toạ độ (x, y) là góc trên trái.
 */
export class PrinterStation extends Phaser.GameObjects.Container {
  private readonly barFill: Phaser.GameObjects.Rectangle;
  private readonly barWidth: number;
  private readonly slot: { x: number; y: number };

  constructor(scene: Phaser.Scene, x: number, y: number, options: PrinterStationOptions) {
    super(scene, x, y);
    const { width, height, mode } = options;
    const active = mode === 'READY_TO_PRINT';
    const panel = new Panel(scene, width / 2, height / 2, { width, height, fill: COLORS.kraft, strokeColor: active ? COLORS.success : COLORS.primary });
    this.add(panel);

    const imageAreaHeight = height * IMAGE_AREA_RATIO;
    const imageCenter = { x: width / 2, y: imageAreaHeight / 2 + 8 };
    this.slot = imageCenter;
    const image = this.buildPrinterImage(scene, options.upgraded, imageCenter, width, imageAreaHeight);
    this.add(image);

    this.barWidth = width - BAR_MARGIN * 2;
    const barY = imageAreaHeight + 18;
    this.add(scene.add.rectangle(BAR_MARGIN, barY, this.barWidth, BAR_HEIGHT, COLORS.disabled).setOrigin(0, 0.5));
    this.barFill = scene.add.rectangle(BAR_MARGIN, barY, 1, BAR_HEIGHT, COLORS.primary).setOrigin(0, 0.5);
    this.barFill.setVisible(mode === 'PRINTING');
    this.add(this.barFill);
    this.add(
      scene.add
        .text(width / 2, barY + 24, CAPTION_BY_MODE[mode], { fontFamily: FONT_FAMILY, fontSize: `${CAPTION_FONT_PX}px`, fontStyle: 'bold', color: toCssColor(active ? COLORS.successDark : COLORS.text), align: 'center', wordWrap: { width: width - 16 } })
        .setOrigin(0.5),
    );

    if (active) this.addGlow(scene, width, height);
    if (mode === 'PRINTING') this.addShake(scene, image);
    const hit = scene.add.zone(width / 2, height / 2, width, height).setInteractive({ useHandCursor: active });
    hit.on('pointerup', () => {
      if (active) options.onTap();
    });
    this.add(hit);
    this.setSize(width, height);
    scene.add.existing(this);
  }

  /** Điểm (toạ độ thế giới) vé chui vào/ra khỏi máy. */
  get slotWorldPoint(): { x: number; y: number } {
    return { x: this.x + this.slot.x, y: this.y + this.slot.y };
  }

  setProgress(ratio: number): void {
    this.barFill.width = Math.max(1, this.barWidth * Phaser.Math.Clamp(ratio, 0, 1));
  }

  private buildPrinterImage(scene: Phaser.Scene, upgraded: boolean, center: { x: number; y: number }, width: number, areaHeight: number): Phaser.GameObjects.GameObject {
    const key = printerImageKey(upgraded);
    if (hasItemImage(scene, key)) {
      const image = scene.add.image(center.x, center.y, key);
      image.setScale(Math.min((width * IMAGE_FILL_RATIO) / image.width, (areaHeight * IMAGE_FILL_RATIO) / image.height));
      return image;
    }
    const body = scene.add.graphics();
    body.fillStyle(upgraded ? COLORS.teal : COLORS.disabled, 1);
    body.fillRoundedRect(center.x - width * 0.36, center.y - areaHeight * 0.36, width * 0.72, areaHeight * 0.72, 16);
    body.lineStyle(4, COLORS.primaryDark, 1);
    body.strokeRoundedRect(center.x - width * 0.36, center.y - areaHeight * 0.36, width * 0.72, areaHeight * 0.72, 16);
    const label = scene.add.text(center.x, center.y, STRINGS.counter.desk.printerFallbackLabel, { fontFamily: HEADING_FONT_FAMILY, fontSize: `${FALLBACK_LABEL_FONT_PX}px`, fontStyle: 'bold', color: toCssColor(COLORS.text) }).setOrigin(0.5);
    return scene.add.container(0, 0, [body, label]);
  }

  private addGlow(scene: Phaser.Scene, width: number, height: number): void {
    const glow = scene.add.graphics();
    glow.lineStyle(GLOW_WIDTH, COLORS.success, 1);
    glow.strokeRoundedRect(2, 2, width - 4, height - 4, 20);
    this.add(glow);
    const pulse = scene.tweens.add({ targets: glow, alpha: 0.25, duration: PULSE_MS, yoyo: true, repeat: -1 });
    glow.once(Phaser.GameObjects.Events.DESTROY, () => pulse.stop());
  }

  private addShake(scene: Phaser.Scene, target: Phaser.GameObjects.GameObject): void {
    const shakeable = target as Phaser.GameObjects.GameObject & { x: number };
    const shake = scene.tweens.add({ targets: shakeable, x: shakeable.x + SHAKE_PX, duration: SHAKE_MS, yoyo: true, repeat: -1 });
    target.once(Phaser.GameObjects.Events.DESTROY, () => shake.stop());
  }
}
