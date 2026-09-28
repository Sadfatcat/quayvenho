import Phaser from 'phaser';
import type { CabinClass, Flight, OwnedSeat, SeatId } from '@domain/models';
import { seatColumn, seatRow, seatsOfCabin } from '@domain/seatMap';
import { COLORS } from './theme';

export interface SeatMapViewOptions {
  cabin: CabinClass;
  flight: Flight;
  seats: readonly OwnedSeat[];
  selectedSeat: SeatId | null;
  onSelect: (seat: SeatId) => void;
}

const SEAT_SIZE: Record<CabinClass, number> = { ECONOMY: 48, BUSINESS: 60 };
const SEAT_GAP = 12;
const AISLE_GAP = 34;

type SeatVisualState = 'AVAILABLE' | 'SOLD' | 'SELECTED' | 'OTHER';
type SeatColumnKey = 'A' | 'B' | 'C' | 'D';

const classify = (
  seatId: SeatId,
  flightId: string,
  cabin: CabinClass,
  seats: readonly OwnedSeat[],
  takenByOthers: readonly SeatId[],
  selectedSeat: SeatId | null,
): SeatVisualState => {
  if (selectedSeat === seatId) return 'SELECTED';
  if (takenByOthers.includes(seatId)) return 'OTHER';
  const owned = seats.find((seat) => seat.flightId === flightId && seat.cabin === cabin && seat.seat === seatId);
  if (owned?.state === 'AVAILABLE') return 'AVAILABLE';
  if (owned?.state === 'SOLD') return 'SOLD';
  return 'OTHER';
};

const columnX = (cabin: CabinClass): Record<SeatColumnKey, number> => {
  const size = SEAT_SIZE[cabin];
  const step = size + SEAT_GAP;
  return { A: 0, B: step, C: 2 * step + AISLE_GAP, D: 3 * step + AISLE_GAP };
};

/** Bước B: seatsOfCabin đã sinh sẵn theo hàng/cột, chỉ ghế AVAILABLE của mình mới bấm được (PLAN §3.1, §10.6). */
export class SeatMapView extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, options: SeatMapViewOptions) {
    super(scene, x, y);
    const seatSize = SEAT_SIZE[options.cabin];
    const cols = columnX(options.cabin);
    const seatIds = seatsOfCabin(options.cabin);
    const rows = [...new Set(seatIds.map(seatRow))].sort((a, b) => a - b);

    for (const seatId of seatIds) {
      const rowIndex = rows.indexOf(seatRow(seatId));
      const col = seatColumn(seatId);
      const seatX = cols[col] + seatSize / 2;
      const seatY = rowIndex * (seatSize + SEAT_GAP) + seatSize / 2;
      const state = classify(seatId, options.flight.id, options.cabin, options.seats, options.flight.takenByOthers, options.selectedSeat);

      const rect = scene.add.rectangle(seatX, seatY, seatSize, seatSize, this.colorFor(state)).setStrokeStyle(2, COLORS.text, 0.15);
      if (state === 'SOLD') rect.setAlpha(0.5);
      if (state === 'AVAILABLE') {
        rect.setInteractive({ useHandCursor: true });
        rect.on('pointerup', () => options.onSelect(seatId));
      }
      this.add(rect);
      if (state === 'SOLD') {
        this.add(scene.add.text(seatX, seatY, '✓', { fontFamily: 'sans-serif', fontSize: '22px', color: '#ffffff' }).setOrigin(0.5));
      }
    }

    scene.add.existing(this);
  }

  static widthFor(cabin: CabinClass): number {
    const cols = columnX(cabin);
    return cols.D + SEAT_SIZE[cabin];
  }

  private colorFor(state: SeatVisualState): number {
    return state === 'AVAILABLE' || state === 'SOLD' ? COLORS.primary : state === 'SELECTED' ? COLORS.accent : COLORS.seatOther;
  }
}
