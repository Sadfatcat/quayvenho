import Phaser from 'phaser';
import { STRINGS } from '@data/strings';
import { formatClock } from '@domain/clock';
import type { CabinClass, Flight, OwnedSeat } from '@domain/models';
import { routeOfFlight } from '@domain/schedule';
import { Button } from './Button';
import { Panel } from './Panel';
import { ScrollList } from './ScrollList';
import { COLORS, FONT_FAMILY, toCssColor } from './theme';

export interface FlightListOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  flights: readonly Flight[];
  seats: readonly OwnedSeat[];
  onSelect: (flightId: string, cabin: CabinClass) => void;
  /** PLAN §10.6: khi không có khách, Bước A vẫn xem trước được nhưng không bấm chọn. */
  readOnly?: boolean;
}

const ROW_HEIGHT = 110;
const ROW_INSET = 8;
const CARD_INNER_PADDING = 16;
const CABIN_BUTTON_WIDTH = 140;
const CABIN_BUTTON_HEIGHT = 60;

const availableCount = (seats: readonly OwnedSeat[], flightId: string, cabin: CabinClass): number =>
  seats.filter((seat) => seat.flightId === flightId && seat.cabin === cabin && seat.state === 'AVAILABLE').length;

/** Bước A: mọi chuyến của mọi tuyến đã mở, dòng xám nếu hết ghế hoặc bị huỷ do thời tiết (PLAN §10.6). */
export class FlightList extends ScrollList<Flight> {
  constructor(scene: Phaser.Scene, options: FlightListOptions) {
    super(scene, {
      x: options.x,
      y: options.y,
      width: options.width,
      height: options.height,
      itemHeight: ROW_HEIGHT,
      items: options.flights,
      renderItem: (flight) => FlightList.renderRow(scene, flight, options),
    });
  }

  private static renderRow(scene: Phaser.Scene, flight: Flight, options: FlightListOptions): Phaser.GameObjects.Container {
    const route = routeOfFlight(flight);
    const eco = availableCount(options.seats, flight.id, 'ECONOMY');
    const biz = availableCount(options.seats, flight.id, 'BUSINESS');
    const cancelled = flight.status !== 'SCHEDULED';
    const dimmed = cancelled || (eco === 0 && biz === 0);
    const panelWidth = options.width - ROW_INSET * 2;

    const row = scene.add.container(0, 0);
    const panel = new Panel(scene, panelWidth / 2 + ROW_INSET, ROW_HEIGHT / 2 - 6, {
      width: panelWidth,
      height: ROW_HEIGHT - 12,
      strokeColor: dimmed ? COLORS.disabled : route.color,
    });
    const title = scene.add
      .text(ROW_INSET + 20, 14, route.name, {
        fontFamily: FONT_FAMILY,
        fontSize: '26px',
        fontStyle: 'bold',
        color: toCssColor(dimmed ? COLORS.textMuted : COLORS.text),
      })
      .setOrigin(0, 0);
    const meta = scene.add
      .text(ROW_INSET + 20, 50, `${flight.id} · ${formatClock(flight.departAt)}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '22px',
        color: toCssColor(COLORS.textMuted),
      })
      .setOrigin(0, 0);
    row.add([panel, title, meta]);

    if (cancelled) {
      row.add(
        scene.add
          .text(panelWidth + ROW_INSET - 20, ROW_HEIGHT / 2 - 6, STRINGS.counter.weatherCancelledLabel, {
            fontFamily: FONT_FAMILY,
            fontSize: '22px',
            color: toCssColor(COLORS.danger),
          })
          .setOrigin(1, 0.5),
      );
      return row;
    }

    const ecoButton = new Button(scene, panelWidth + ROW_INSET - CARD_INNER_PADDING - CABIN_BUTTON_WIDTH * 1.5 - 10, ROW_HEIGHT / 2 - 6, {
      width: CABIN_BUTTON_WIDTH,
      height: CABIN_BUTTON_HEIGHT,
      label: `${STRINGS.counter.ecoShort} ${eco}`,
      variant: 'primary',
      onTap: () => options.onSelect(flight.id, 'ECONOMY'),
    });
    ecoButton.setEnabled(!options.readOnly && eco > 0);
    const bizButton = new Button(scene, panelWidth + ROW_INSET - CARD_INNER_PADDING - CABIN_BUTTON_WIDTH / 2, ROW_HEIGHT / 2 - 6, {
      width: CABIN_BUTTON_WIDTH,
      height: CABIN_BUTTON_HEIGHT,
      label: `${STRINGS.counter.bizShort} ${biz}`,
      variant: 'success',
      onTap: () => options.onSelect(flight.id, 'BUSINESS'),
    });
    bizButton.setEnabled(!options.readOnly && biz > 0);
    row.add([ecoButton, bizButton]);
    return row;
  }
}
