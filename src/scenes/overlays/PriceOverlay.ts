import Phaser from 'phaser';
import { PRICE_CAP_PCT, PRICE_MAX_PCT, PRICE_MIN_PCT, PRICE_STEP_PCT } from '@data/pricing';
import { ROUTES } from '@data/routes';
import { STRINGS } from '@data/strings';
import type { Route } from '@domain/models';
import { fareOf } from '@domain/economy';
import { isHolidayEvent, isOverCap, priceDemandFactor } from '@domain/pricing';
import { BaseOverlay } from '@ui/BaseOverlay';
import { Button } from '@ui/Button';
import { formatMoney } from '@ui/format';
import { Panel } from '@ui/Panel';
import { ScrollList } from '@ui/ScrollList';
import { Slider } from '@ui/Slider';
import { TEXT_STYLES } from '@ui/textStyles';
import { COLORS, FONT_FAMILY, toCssColor } from '@ui/theme';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { sessionBridge } from '../sessionBridge';

const PANEL_WIDTH = 660;
const PANEL_HEIGHT = 980;
const ROW_HEIGHT = 270;
const ROW_PADDING = 24;
const SLIDER_WIDTH = PANEL_WIDTH - 2 * ROW_PADDING - 60;
const SLIDER_X = ROW_PADDING + 30;
const SLIDER_Y = 130;
const LIST_TOP = 110;
const LIST_HEIGHT = PANEL_HEIGHT - LIST_TOP - 140;
const FOOTER_BUTTON_Y = PANEL_HEIGHT / 2 - 70;
const FOOTER_BUTTON_WIDTH = 280;
const CROWD_BAR_STEPS = 5;
const SPAN_PCT = PRICE_MAX_PCT - PRICE_MIN_PCT;

const pctFromSliderValue = (value: number): number => Math.round((PRICE_MIN_PCT + value * SPAN_PCT) / PRICE_STEP_PCT) * PRICE_STEP_PCT;
const sliderValueFromPct = (pct: number): number => (pct - PRICE_MIN_PCT) / SPAN_PCT;
const formatPct = (pct: number): string => `${pct > 0 ? '+' : ''}${pct}%`;

const crowdBar = (factor: number): string => {
  const filled = Math.max(1, Math.min(CROWD_BAR_STEPS, Math.round(factor * CROWD_BAR_STEPS * 0.8)));
  return `${'▮'.repeat(filled)}${'▯'.repeat(CROWD_BAR_STEPS - filled)} ~${Math.round(factor * 100)}%`;
};

const zoneColor = (pct: number): number => (isOverCap(pct) ? COLORS.danger : pct < 0 ? COLORS.success : COLORS.warning);

/** Bảng chỉnh giá vé theo từng tuyến (người chơi đặt trước khi mở cửa). Trần +30%: vượt thì khách giảm một nửa và vé bị huỷ. */
export class PriceOverlay extends BaseOverlay {
  private readonly routeList: ScrollList<Route>;
  private readonly onChanged: () => void;

  constructor(scene: Phaser.Scene, onChanged: () => void) {
    super(scene, { closeOnBackdropTap: false });
    this.onChanged = onChanged;
    const panel = new Panel(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2, { width: PANEL_WIDTH, height: PANEL_HEIGHT });
    const title = scene.add.text(0, -PANEL_HEIGHT / 2 + 60, STRINGS.priceBoard.title, TEXT_STYLES.heading).setOrigin(0.5);
    const unlocked = ROUTES.filter((route) => sessionBridge.current.state.unlockedRoutes.includes(route.id));

    this.routeList = new ScrollList<Route>(scene, {
      x: -PANEL_WIDTH / 2,
      y: -PANEL_HEIGHT / 2 + LIST_TOP,
      width: PANEL_WIDTH,
      height: LIST_HEIGHT,
      itemHeight: ROW_HEIGHT,
      items: unlocked,
      renderItem: (route) => this.renderRow(scene, route),
    });
    const resetButton = new Button(scene, -FOOTER_BUTTON_WIDTH / 2 - 10, FOOTER_BUTTON_Y, {
      width: FOOTER_BUTTON_WIDTH,
      label: STRINGS.priceBoard.reset,
      variant: 'ghost',
      onTap: () => this.resetAll(unlocked),
    });
    const doneButton = new Button(scene, FOOTER_BUTTON_WIDTH / 2 + 10, FOOTER_BUTTON_Y, {
      width: FOOTER_BUTTON_WIDTH,
      label: STRINGS.priceBoard.done,
      variant: 'success',
      onTap: () => this.close(),
    });
    panel.add([title, this.routeList, resetButton, doneButton]);
    this.add(panel);
  }

  private resetAll(routes: readonly Route[]): void {
    for (const route of routes) sessionBridge.dispatch({ type: 'SET_ROUTE_PRICE', routeId: route.id, pct: 0 });
    this.routeList.setItems([...routes]);
    this.onChanged();
  }

  private renderRow(scene: Phaser.Scene, route: Route): Phaser.GameObjects.Container {
    const state = sessionBridge.current.state;
    const holiday = isHolidayEvent(state.today.event);
    const hot = state.today.event.type === 'RUSH' && state.today.event.hotRoutes.includes(route.id);
    const currentPct = state.today.priceAdjustPct[route.id] ?? 0;
    const row = scene.add.container(0, 0);

    const name = scene.add.text(ROW_PADDING, 8, `${route.name}${hot ? `  ${STRINGS.priceBoard.hot}` : ''}`, { ...TEXT_STYLES.body, fontStyle: 'bold' });
    const base = scene.add.text(
      ROW_PADDING,
      48,
      STRINGS.priceBoard.basePrices.replace('{eco}', formatMoney(route.price.ECONOMY)).replace('{biz}', formatMoney(route.price.BUSINESS)),
      { fontFamily: FONT_FAMILY, fontSize: '20px', color: toCssColor(COLORS.textMuted) },
    );
    const selling = scene.add.text(ROW_PADDING, SLIDER_Y + 40, '', { fontFamily: FONT_FAMILY, fontSize: '24px', fontStyle: 'bold', color: toCssColor(COLORS.text) });
    const crowd = scene.add.text(ROW_PADDING, SLIDER_Y + 74, '', { fontFamily: FONT_FAMILY, fontSize: '20px', color: toCssColor(COLORS.textMuted) });
    const warning = scene.add.text(ROW_PADDING, SLIDER_Y + 100, '', { fontFamily: FONT_FAMILY, fontSize: '18px', color: toCssColor(COLORS.danger), wordWrap: { width: PANEL_WIDTH - 2 * ROW_PADDING } });

    const refresh = (pct: number): void => {
      selling.setText(
        STRINGS.priceBoard.selling
          .replace('{eco}', formatMoney(fareOf(route, 'ECONOMY', pct)))
          .replace('{biz}', formatMoney(fareOf(route, 'BUSINESS', pct)))
          .replace('{pct}', formatPct(pct)),
      );
      selling.setColor(toCssColor(zoneColor(pct)));
      crowd.setText(`${STRINGS.priceBoard.crowd}: ${crowdBar(priceDemandFactor(pct, holiday))}`);
      warning.setText(isOverCap(pct) ? STRINGS.priceBoard.overCapWarning : '');
    };
    refresh(currentPct);

    const slider = new Slider(scene, SLIDER_X, SLIDER_Y, {
      width: SLIDER_WIDTH,
      initialValue: sliderValueFromPct(currentPct),
      onChange: (value) => refresh(pctFromSliderValue(value)),
      onCommit: (value) => {
        sessionBridge.dispatch({ type: 'SET_ROUTE_PRICE', routeId: route.id, pct: pctFromSliderValue(value) });
        this.onChanged();
      },
    });
    const capX = SLIDER_X + sliderValueFromPct(PRICE_CAP_PCT) * SLIDER_WIDTH;
    const capMarker = scene.add.rectangle(capX, SLIDER_Y, 6, 44, COLORS.danger);
    const capLabel = scene.add.text(capX, SLIDER_Y - 40, STRINGS.priceBoard.capLabel, { fontFamily: FONT_FAMILY, fontSize: '16px', fontStyle: 'bold', color: toCssColor(COLORS.danger) }).setOrigin(0.5);

    row.add([name, base, capMarker, capLabel, slider, selling, crowd, warning]);
    return row;
  }
}
