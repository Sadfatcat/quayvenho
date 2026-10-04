import Phaser from 'phaser';
import { PRICE_CAP_PCT, PRICE_MAX_PCT, PRICE_MIN_PCT, PRICE_STEP_PCT } from '@data/pricing';
import { ROUTES } from '@data/routes';
import { STRINGS } from '@data/strings';
import type { Route } from '@domain/models';
import { fareOf, routeOnDay } from '@domain/economy';
import { isHolidayEvent, isOverCap, priceDemandFactor } from '@domain/pricing';
import { Button } from '@ui/Button';
import { formatMoney } from '@ui/format';
import { ScrollList } from '@ui/ScrollList';
import { Slider } from '@ui/Slider';
import { buttonRow } from '@ui/layout';
import { TEXT_STYLES } from '@ui/textStyles';
import { COLORS, FONT_FAMILY, toCssColor } from '@ui/theme';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { BaseScene } from './BaseScene';
import { addManagementChrome, MANAGEMENT_CONTENT_TOP, requestOpenCounter, type ManagementChrome } from './managementChrome';
import { sessionBridge } from './sessionBridge';

const LIST_WIDTH = 660;
const LIST_X = (GAME_WIDTH - LIST_WIDTH) / 2;
const ROW_HEIGHT = 270;
const ROW_PADDING = 24;
const SLIDER_WIDTH = LIST_WIDTH - 2 * ROW_PADDING - 60;
const SLIDER_X = ROW_PADDING + 30;
const SLIDER_Y = 130;
const LIST_TOP = MANAGEMENT_CONTENT_TOP + 50;
const FOOTER_Y = GAME_HEIGHT - 80;
const LIST_BOTTOM_MARGIN = 190;
const NOTE_Y = MANAGEMENT_CONTENT_TOP + 20;
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

/** Mục "Giá vé": chỉnh giá vé từng tuyến trước khi mở cửa. Trần +30%: vượt thì khách giảm một nửa và vé bị huỷ. */
export class PriceScene extends BaseScene {
  private chrome!: ManagementChrome;
  private routeList!: ScrollList<Route>;

  constructor() {
    super('Price');
    this.backgroundTheme = 'prep';
    this.musicTrack = 'calm';
  }

  protected onCreate(): void {
    const state = sessionBridge.current.state;
    this.chrome = addManagementChrome(this, 'PRICES', false);
    this.chrome.refresh(state);

    if (state.phase !== 'PREP') {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, STRINGS.management.lockedAfterSummary, { fontFamily: FONT_FAMILY, fontSize: '26px', color: toCssColor(COLORS.textMuted), align: 'center', wordWrap: { width: GAME_WIDTH - 120 } }).setOrigin(0.5);
      return;
    }
    this.add.text(GAME_WIDTH / 2, NOTE_Y, STRINGS.priceBoard.title, { fontFamily: FONT_FAMILY, fontSize: '24px', fontStyle: 'bold', color: toCssColor(COLORS.text) }).setOrigin(0.5);

    const unlocked = ROUTES.filter((route) => state.unlockedRoutes.includes(route.id));
    this.routeList = new ScrollList<Route>(this, {
      x: LIST_X,
      y: LIST_TOP,
      width: LIST_WIDTH,
      height: GAME_HEIGHT - LIST_TOP - LIST_BOTTOM_MARGIN,
      itemHeight: ROW_HEIGHT,
      items: unlocked,
      renderItem: (route) => this.renderRow(this, route),
    });
    const row = buttonRow(GAME_WIDTH, 2);
    new Button(this, row.centers[0] ?? 0, FOOTER_Y, { width: row.width, height: 88, label: STRINGS.priceBoard.reset, variant: 'ghost', onTap: () => this.resetAll(unlocked) });
    new Button(this, row.centers[1] ?? 0, FOOTER_Y, { width: row.width, height: 88, label: STRINGS.prep.openCounter, variant: 'success', onTap: () => requestOpenCounter(this) });
  }

  private resetAll(routes: readonly Route[]): void {
    for (const route of routes) sessionBridge.dispatch({ type: 'SET_ROUTE_PRICE', routeId: route.id, pct: 0 });
    this.routeList.setItems([...routes]);
  }

  private renderRow(scene: Phaser.Scene, route: Route): Phaser.GameObjects.Container {
    const state = sessionBridge.current.state;
    const holiday = isHolidayEvent(state.today.event);
    const listed = routeOnDay(route, state.day);
    const hot = state.today.event.type === 'RUSH' && state.today.event.hotRoutes.includes(route.id);
    const currentPct = state.today.priceAdjustPct[route.id] ?? 0;
    const row = scene.add.container(0, 0);

    const name = scene.add.text(ROW_PADDING, 8, `${route.name}${hot ? `  ${STRINGS.priceBoard.hot}` : ''}`, { ...TEXT_STYLES.body, fontStyle: 'bold' });
    const base = scene.add.text(
      ROW_PADDING,
      48,
      STRINGS.priceBoard.basePrices.replace('{eco}', formatMoney(listed.price.ECONOMY)).replace('{biz}', formatMoney(listed.price.BUSINESS)),
      { fontFamily: FONT_FAMILY, fontSize: '20px', color: toCssColor(COLORS.textMuted) },
    );
    const selling = scene.add.text(ROW_PADDING, SLIDER_Y + 40, '', { fontFamily: FONT_FAMILY, fontSize: '24px', fontStyle: 'bold', color: toCssColor(COLORS.text) });
    const crowd = scene.add.text(ROW_PADDING, SLIDER_Y + 74, '', { fontFamily: FONT_FAMILY, fontSize: '20px', color: toCssColor(COLORS.textMuted) });
    const warning = scene.add.text(ROW_PADDING, SLIDER_Y + 100, '', { fontFamily: FONT_FAMILY, fontSize: '18px', color: toCssColor(COLORS.danger), wordWrap: { width: LIST_WIDTH - 2 * ROW_PADDING } });

    const refresh = (pct: number): void => {
      selling.setText(
        STRINGS.priceBoard.selling
          .replace('{eco}', formatMoney(fareOf(listed, 'ECONOMY', pct)))
          .replace('{biz}', formatMoney(fareOf(listed, 'BUSINESS', pct)))
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
      },
    });
    const capX = SLIDER_X + sliderValueFromPct(PRICE_CAP_PCT) * SLIDER_WIDTH;
    const capMarker = scene.add.rectangle(capX, SLIDER_Y, 6, 44, COLORS.danger);
    const capLabel = scene.add.text(capX, SLIDER_Y - 40, STRINGS.priceBoard.capLabel, { fontFamily: FONT_FAMILY, fontSize: '16px', fontStyle: 'bold', color: toCssColor(COLORS.danger) }).setOrigin(0.5);

    row.add([name, base, capMarker, capLabel, slider, selling, crowd, warning]);
    return row;
  }
}
