import Phaser from 'phaser';
import { STRINGS } from '@data/strings';
import type { CabinClass, Extra, SeatId } from '@domain/models';
import { formatMoney } from './format';
import { Panel } from './Panel';
import { COLORS, FONT_FAMILY, HEADING_FONT_FAMILY, toCssColor } from './theme';
import { EXTRA_FEES } from '@data/balance';

export interface DeskTicketOptions {
  width: number;
  height: number;
  cabin: CabinClass;
  passengerName: string;
  /** Chữ con dấu đã đóng (null = ô còn trống). */
  destinationStamp: string | null;
  timeStamp: string | null;
  flightMissing: boolean;
  seat: SeatId | null;
  baggageKg: number;
  extras: readonly Extra[];
  /** Con dấu vừa đóng ở lần vẽ này (để chạy hiệu ứng "đóng dấu"). */
  freshStamp: 'destination' | 'time' | null;
}

const EXTRA_ICON: Record<Extra, string> = { VEG_MEAL: '🥗', WHEELCHAIR: '♿', INSURANCE: '🛡️' };
const PADDING = 20;
const HEADER_HEIGHT = 44;
const SLOT_HEIGHT = 68;
const SLOT_GAP = 14;
const STAMP_ANGLE_DEG = -5;
const STAMP_POP_MS = 160;
const STAMP_START_SCALE = 1.5;

/** Vé trên bàn: hai ô con dấu (điểm đến, giờ bay), ghế, hành lý và vé dịch vụ đã kẹp vào. */
export class DeskTicket extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, options: DeskTicketOptions) {
    super(scene, x, y);
    const { width, height } = options;
    const business = options.cabin === 'BUSINESS';
    const panel = new Panel(scene, 0, 0, { width, height, fill: COLORS.panel, strokeColor: COLORS.primary });
    const band = scene.add.graphics();
    band.fillStyle(business ? COLORS.accent : COLORS.teal, 1);
    band.fillRoundedRect(-width / 2 + 2, -height / 2 + 2, width - 4, HEADER_HEIGHT, { tl: 22, tr: 22, bl: 0, br: 0 });
    const heading = scene.add
      .text(-width / 2 + PADDING, -height / 2 + HEADER_HEIGHT / 2 + 2, business ? STRINGS.counter.desk.businessTicket.toUpperCase() : STRINGS.counter.desk.economyTicket.toUpperCase(), {
        fontFamily: HEADING_FONT_FAMILY,
        fontSize: '22px',
        fontStyle: 'bold',
        color: toCssColor(COLORS.cloud),
      })
      .setOrigin(0, 0.5);
    const passenger = scene.add
      .text(width / 2 - PADDING, -height / 2 + HEADER_HEIGHT / 2 + 2, options.passengerName, { fontFamily: FONT_FAMILY, fontSize: '18px', color: toCssColor(COLORS.cloud) })
      .setOrigin(1, 0.5);
    this.add([panel, band, heading, passenger]);

    const slotWidth = (width - PADDING * 2 - SLOT_GAP) / 2;
    const slotTop = -height / 2 + HEADER_HEIGHT + 14;
    this.addSlot(scene, -width / 2 + PADDING, slotTop, slotWidth, STRINGS.counter.desk.slotDestination, options.destinationStamp, COLORS.accentDark, options.freshStamp === 'destination');
    this.addSlot(scene, -width / 2 + PADDING + slotWidth + SLOT_GAP, slotTop, slotWidth, STRINGS.counter.desk.slotTime, options.timeStamp, COLORS.tealDark, options.freshStamp === 'time');

    const infoY = slotTop + SLOT_HEIGHT + 24;
    const seatText = options.seat ?? '—';
    const baggage = options.baggageKg > 0 ? `${options.baggageKg} ${STRINGS.counter.baggageUnit}` : '—';
    const extras = options.extras.length ? options.extras.map((extra) => `${EXTRA_ICON[extra]} +${formatMoney(EXTRA_FEES[extra])}`).join('  ') : '';
    this.add([
      scene.add.text(-width / 2 + PADDING, infoY, `${STRINGS.counter.ticket.seat}: ${seatText}`, { fontFamily: FONT_FAMILY, fontSize: '22px', fontStyle: 'bold', color: toCssColor(COLORS.text) }).setOrigin(0, 0.5),
      scene.add.text(0, infoY, `🧳 ${baggage}`, { fontFamily: FONT_FAMILY, fontSize: '22px', color: toCssColor(COLORS.text) }).setOrigin(0.5, 0.5),
      scene.add.text(width / 2 - PADDING, infoY, extras, { fontFamily: FONT_FAMILY, fontSize: '18px', color: toCssColor(COLORS.text) }).setOrigin(1, 0.5),
    ]);
    if (options.flightMissing) {
      this.add(scene.add.text(0, height / 2 - 22, STRINGS.counter.desk.flightMissing, { fontFamily: FONT_FAMILY, fontSize: '18px', fontStyle: 'bold', color: toCssColor(COLORS.danger) }).setOrigin(0.5));
    }
    this.setSize(width, height);
    scene.add.existing(this);
  }

  private addSlot(scene: Phaser.Scene, left: number, top: number, width: number, caption: string, stamped: string | null, inkColor: number, fresh: boolean): void {
    const frame = scene.add.graphics();
    frame.lineStyle(3, COLORS.textMuted, stamped ? 0.25 : 0.9);
    frame.strokeRoundedRect(left, top + 16, width, SLOT_HEIGHT - 16, 10);
    this.add(frame);
    this.add(scene.add.text(left + 8, top + 7, caption, { fontFamily: FONT_FAMILY, fontSize: '14px', color: toCssColor(COLORS.textMuted) }).setOrigin(0, 0.5));
    if (!stamped) return;
    const centerX = left + width / 2;
    const centerY = top + 16 + (SLOT_HEIGHT - 16) / 2;
    const ink = scene.add
      .text(0, 0, stamped, {
        fontFamily: HEADING_FONT_FAMILY,
        fontSize: '24px',
        fontStyle: 'bold',
        color: toCssColor(inkColor),
        align: 'center',
        wordWrap: { width: width - 16 },
      })
      .setOrigin(0.5);
    const ring = scene.add.graphics();
    ring.lineStyle(4, inkColor, 0.85);
    ring.strokeRoundedRect(-width / 2 + 4, -(SLOT_HEIGHT - 24) / 2, width - 8, SLOT_HEIGHT - 24, 8);
    const holder = scene.add.container(centerX, centerY, [ink, ring]).setAngle(STAMP_ANGLE_DEG);
    this.add(holder);
    if (fresh) {
      holder.setAlpha(0).setScale(STAMP_START_SCALE);
      scene.tweens.add({ targets: holder, alpha: 1, scale: 1, duration: STAMP_POP_MS, ease: 'Back.easeOut' });
    }
  }
}
