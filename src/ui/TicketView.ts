import Phaser from 'phaser';
import { STRINGS } from '@data/strings';
import { formatClock } from '@domain/clock';
import type { CabinClass, Extra, SeatId } from '@domain/models';
import { Panel } from './Panel';
import { TEXT_STYLES } from './textStyles';
import { COLORS, FONT_FAMILY, toCssColor } from './theme';

export interface TicketViewOptions {
  width: number;
  brandName: string;
  passengerName: string;
  routeName: string;
  flightId: string;
  departAt: number;
  cabin: CabinClass;
  seat: SeatId | null;
  baggageKg: number;
  extras: readonly Extra[];
}

const HEIGHT = 440;
const ROW_START_Y = -HEIGHT / 2 + 180;
const ROW_GAP = 38;

/** Bước D và vé đã in: boarding pass, không đánh dấu đúng/sai (PLAN §10.6). */
export class TicketView extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, options: TicketViewOptions) {
    super(scene, x, y);
    const panel = new Panel(scene, 0, 0, { width: options.width, height: HEIGHT, strokeColor: COLORS.text });
    const heading = scene.add.text(0, -HEIGHT / 2 + 36, STRINGS.counter.ticket.heading, TEXT_STYLES.heading).setOrigin(0.5);
    const brand = scene.add
      .text(0, -HEIGHT / 2 + 76, options.brandName, { fontFamily: FONT_FAMILY, fontSize: '22px', color: toCssColor(COLORS.textMuted) })
      .setOrigin(0.5);
    const name = scene.add
      .text(0, -HEIGHT / 2 + 116, options.passengerName, { fontFamily: FONT_FAMILY, fontSize: '28px', fontStyle: 'bold', color: toCssColor(COLORS.text) })
      .setOrigin(0.5);

    const rows: [string, string][] = [
      [STRINGS.counter.ticket.route, options.routeName],
      [STRINGS.counter.ticket.flight, `${options.flightId} · ${formatClock(options.departAt)}`],
      [STRINGS.counter.ticket.cabin, STRINGS.counter.cabin[options.cabin]],
      [STRINGS.counter.ticket.seat, options.seat ?? STRINGS.counter.ticket.none],
      [STRINGS.counter.ticket.baggage, options.baggageKg > 0 ? `${options.baggageKg} ${STRINGS.counter.baggageUnit}` : STRINGS.counter.ticket.none],
      [
        STRINGS.counter.ticket.extras,
        options.extras.length ? options.extras.map((extra) => STRINGS.counter.extras[extra]).join(', ') : STRINGS.counter.ticket.none,
      ],
    ];
    const rowTexts = rows.flatMap(([label, value], index) => {
      const rowY = ROW_START_Y + index * ROW_GAP;
      return [
        scene.add.text(-options.width / 2 + 30, rowY, label, { fontFamily: FONT_FAMILY, fontSize: '20px', color: toCssColor(COLORS.textMuted) }).setOrigin(0, 0.5),
        scene.add.text(options.width / 2 - 30, rowY, value, { fontFamily: FONT_FAMILY, fontSize: '20px', color: toCssColor(COLORS.text) }).setOrigin(1, 0.5),
      ];
    });

    this.add([panel, heading, brand, name, ...rowTexts]);
    scene.add.existing(this);
  }
}
