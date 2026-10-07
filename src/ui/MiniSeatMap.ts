import Phaser from 'phaser';
import { STRINGS } from '@data/strings';
import type { CabinClass, OwnedSeat, SeatId } from '@domain/models';
import { seatColumn, seatRow, seatsOfCabin, seatZone } from '@domain/seatMap';
import { audio } from '@platform/audio';
import { Panel } from './Panel';
import { COLORS, FONT_FAMILY, toCssColor } from './theme';

export interface MiniSeatMapOptions {
  width: number;
  height: number;
  cabin: CabinClass | null;
  flightId: string | null;
  /** Toàn bộ bản ghi ghế trong ngày: ghế đã bán cho khách khác bị khoá, mọi ghế còn lại đều chọn được. */
  seats: readonly OwnedSeat[];
  selectedSeat: SeatId | null;
  hasStock: boolean;
  onSelect: (seat: SeatId) => void;
}

const TITLE_HEIGHT = 36;
const HEADER_HEIGHT = 24;
const ROW_GAP = 4;
const MAX_ROW_HEIGHT = 36;
const BOTTOM_PADDING = 12;
const SEAT_WIDTH = 36;
const AISLE_WIDTH = 22;
const SIDE_LABEL_WIDTH = 54;
const ZONE_LABEL_LEFT = 8;
const COLUMN_ORDER = ['A', 'B', 'C', 'D'] as const;
type Column = (typeof COLUMN_ORDER)[number];

const ZONE_LABEL: Record<'FRONT' | 'MIDDLE' | 'BACK', string> = {
  FRONT: STRINGS.counter.desk.zoneFront,
  MIDDLE: STRINGS.counter.desk.zoneMiddle,
  BACK: STRINGS.counter.desk.zoneBack,
};

/**
 * Sơ đồ ghế thu nhỏ, không cuộn: 2 cột ghế cách nhau bằng lối đi (A B | C D), hiện đủ mọi hàng.
 * Nhãn ĐẦU/GIỮA/CUỐI bên trái cho khách đòi ghế theo vị trí; vạch xanh ở hai mép là cửa sổ (cột A và D).
 */
export class MiniSeatMap extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, options: MiniSeatMapOptions) {
    super(scene, x, y);
    const { width, height } = options;
    const panel = new Panel(scene, width / 2, height / 2, { width, height, fill: COLORS.cloud });
    const title = scene.add
      .text(width / 2, TITLE_HEIGHT / 2 + 2, STRINGS.counter.desk.seatPanel, { fontFamily: FONT_FAMILY, fontSize: '22px', fontStyle: 'bold', color: toCssColor(COLORS.text) })
      .setOrigin(0.5);
    this.add([panel, title]);
    scene.add.existing(this);

    if (!options.cabin || !options.flightId) {
      this.addHint(scene, width, height, STRINGS.counter.desk.seatHintNoFlight);
      return;
    }
    if (!options.hasStock) {
      this.addHint(scene, width, height, STRINGS.counter.desk.seatHintNoStock);
      return;
    }
    this.drawGrid(scene, options, options.flightId, options.cabin);
  }

  private drawGrid(scene: Phaser.Scene, options: MiniSeatMapOptions, flightId: string, cabin: CabinClass): void {
    const { width, height } = options;
    const blocked = new Set(
      options.seats.filter((seat) => seat.flightId === flightId && seat.cabin === cabin && seat.state !== 'AVAILABLE' && seat.state !== 'HELD').map((seat) => seat.seat),
    );
    const seatIds = seatsOfCabin(cabin);
    const rows = [...new Set(seatIds.map(seatRow))];
    const gridWidth = SEAT_WIDTH * 4 + AISLE_WIDTH;
    const gridLeft = SIDE_LABEL_WIDTH + (width - SIDE_LABEL_WIDTH - gridWidth) / 2;
    const rowHeight = Math.min(MAX_ROW_HEIGHT, (height - TITLE_HEIGHT - HEADER_HEIGHT - BOTTOM_PADDING) / rows.length - ROW_GAP);
    const gridTop = TITLE_HEIGHT + HEADER_HEIGHT;

    const columnX = (column: Column): number => {
      const index = COLUMN_ORDER.indexOf(column);
      return gridLeft + index * SEAT_WIDTH + (index >= 2 ? AISLE_WIDTH : 0) + SEAT_WIDTH / 2;
    };
    for (const column of COLUMN_ORDER) {
      this.add(scene.add.text(columnX(column), TITLE_HEIGHT + HEADER_HEIGHT / 2, column, { fontFamily: FONT_FAMILY, fontSize: '20px', fontStyle: 'bold', color: toCssColor(COLORS.text) }).setOrigin(0.5));
    }

    const edges = scene.add.graphics();
    edges.fillStyle(COLORS.teal, 1);
    const windowHeight = rows.length * (rowHeight + ROW_GAP);
    edges.fillRoundedRect(gridLeft - 8, gridTop - 2, 5, windowHeight, 2);
    edges.fillRoundedRect(gridLeft + gridWidth + 3, gridTop - 2, 5, windowHeight, 2);
    this.add(edges);

    let lastZone: string | null = null;
    rows.forEach((row, rowIndex) => {
      const rowY = gridTop + rowIndex * (rowHeight + ROW_GAP) + rowHeight / 2;
      const rowSeats = seatIds.filter((seat) => seatRow(seat) === row);
      const firstSeat = rowSeats[0];
      const zone = firstSeat ? seatZone(firstSeat) : null;
      if (zone && zone !== lastZone) {
        lastZone = zone;
        this.add(
          scene.add.text(ZONE_LABEL_LEFT, rowY, ZONE_LABEL[zone], { fontFamily: FONT_FAMILY, fontSize: '16px', fontStyle: 'bold', color: toCssColor(COLORS.accentDark) }).setOrigin(0, 0.5),
        );
      }
      for (const seat of rowSeats) this.drawSeat(scene, options, seat, columnX(seatColumn(seat) as Column), rowY, rowHeight, blocked.has(seat));
    });
  }

  private drawSeat(scene: Phaser.Scene, options: MiniSeatMapOptions, seat: SeatId, x: number, y: number, rowHeight: number, isBlocked: boolean): void {
    const isSelected = options.selectedSeat === seat;
    const fill = isBlocked ? COLORS.seatOther : isSelected ? COLORS.accent : COLORS.primary;
    const tile = scene.add.rectangle(x, y, SEAT_WIDTH - 4, rowHeight, fill).setStrokeStyle(2, COLORS.primaryDark, isBlocked ? 0.3 : 1);
    this.add(tile);
    if (isBlocked) {
      this.add(scene.add.text(x, y, '✕', { fontFamily: FONT_FAMILY, fontSize: '20px', color: toCssColor(COLORS.textMuted) }).setOrigin(0.5));
      return;
    }
    if (isSelected) this.add(scene.add.text(x, y, '✓', { fontFamily: FONT_FAMILY, fontSize: '20px', fontStyle: 'bold', color: toCssColor(COLORS.cloud) }).setOrigin(0.5));
    // Vùng chạm rộng hơn ô nhìn thấy một chút để dễ bấm trên điện thoại.
    const hit = scene.add.zone(x, y, SEAT_WIDTH, rowHeight + ROW_GAP + 4).setInteractive({ useHandCursor: true });
    hit.on('pointerup', () => {
      audio.playSfx('seat');
      options.onSelect(seat);
    });
    this.add(hit);
  }

  private addHint(scene: Phaser.Scene, width: number, height: number, text: string): void {
    this.add(
      scene.add
        .text(width / 2, height / 2 + TITLE_HEIGHT / 2, text, { fontFamily: FONT_FAMILY, fontSize: '20px', color: toCssColor(COLORS.textMuted), align: 'center', wordWrap: { width: width - 40 } })
        .setOrigin(0.5),
    );
  }
}
