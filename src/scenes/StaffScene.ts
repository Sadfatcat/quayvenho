import Phaser from 'phaser';
import { STAFF } from '@data/staff';
import { STRINGS } from '@data/strings';
import type { StaffDef } from '@domain/models';
import { checkHire, type HireError } from '@domain/staff';
import { shopContext } from '@domain/dayCycle';
import { Card } from '@ui/Card';
import { formatMoney } from '@ui/format';
import { ScrollList } from '@ui/ScrollList';
import { COLORS, FONT_FAMILY, toCssColor } from '@ui/theme';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { BaseScene } from './BaseScene';
import { addManagementChrome, MANAGEMENT_CONTENT_TOP, type ManagementChrome } from './managementChrome';
import { DialogOverlay } from './overlays/DialogOverlay';
import { sessionBridge } from './sessionBridge';

const SCOPE_Y = MANAGEMENT_CONTENT_TOP + 30;
const LIST_Y = SCOPE_Y + 70;
const LIST_BOTTOM_MARGIN = 170;
const CARD_HEIGHT = 220;
const CARD_GAP = 16;

const hireStatusText = (reason: HireError, minDay: number): string => {
  switch (reason) {
    case 'NOT_ENOUGH_MONEY':
      return STRINGS.staff.statusNotEnoughMoney;
    case 'DAY_TOO_EARLY':
      return `${STRINGS.staff.statusDayTooEarly} ${minDay}`;
    default:
      return '';
  }
};

/** Mục "Nhân viên": thuê người tự phục vụ khách đơn giản, trả lương mỗi ngày lúc tổng kết. */
export class StaffScene extends BaseScene {
  private chrome!: ManagementChrome;
  private list!: ScrollList<StaffDef>;
  private unsubscribeEvents: (() => void) | null = null;

  constructor() {
    super('Staff');
    this.backgroundTheme = 'shop';
    this.musicTrack = 'calm';
  }

  protected onCreate(): void {
    this.chrome = addManagementChrome(this, 'STAFF', true);
    this.add
      .text(GAME_WIDTH / 2, SCOPE_Y, STRINGS.staff.scope, { fontFamily: FONT_FAMILY, fontSize: '20px', color: toCssColor(COLORS.textMuted), align: 'center', wordWrap: { width: GAME_WIDTH - 80 } })
      .setOrigin(0.5);
    this.list = new ScrollList<StaffDef>(this, {
      x: 20,
      y: LIST_Y,
      width: GAME_WIDTH - 40,
      height: GAME_HEIGHT - LIST_Y - LIST_BOTTOM_MARGIN,
      itemHeight: CARD_HEIGHT + CARD_GAP,
      items: [...STAFF],
      renderItem: (def) => this.renderMember(def),
    });
    this.unsubscribeEvents = sessionBridge.onEvents(() => this.renderAll());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unsubscribeEvents?.());
    this.renderAll();
  }

  private renderAll(): void {
    this.chrome.refresh(sessionBridge.current.state);
    this.list.setItems([...STAFF]);
  }

  private renderMember(def: StaffDef): Phaser.GameObjects.Container {
    const state = sessionBridge.current.state;
    const text = STRINGS.staff.members[def.id] ?? { name: def.id, description: '' };
    const hired = state.staff.includes(def.id);
    const result = checkHire(def.id, state.staff, shopContext(state));
    return new Card(this, 0, 0, {
      width: GAME_WIDTH - 40,
      height: CARD_HEIGHT,
      title: text.name,
      description: `${text.description}\n${STRINGS.staff.wagePerDay}: ${formatMoney(def.wagePerDay)}`,
      priceLabel: `${STRINGS.staff.hireCost}: ${formatMoney(def.hireCost)}`,
      statusLabel: hired ? STRINGS.staff.hired : result.ok ? '' : hireStatusText(result.reason, def.minDay),
      buttonLabel: STRINGS.staff.hire,
      buttonEnabled: result.ok,
      onBuy: () => this.confirmHire(def, text.name),
    });
  }

  private confirmHire(def: StaffDef, name: string): void {
    new DialogOverlay(this, {
      title: STRINGS.staff.confirmTitle,
      message: name,
      buttons: [
        { label: STRINGS.shop.confirmCancel, variant: 'ghost', onTap: () => {} },
        { label: STRINGS.staff.hire, variant: 'primary', onTap: () => sessionBridge.dispatch({ type: 'HIRE_STAFF', staffId: def.id }) },
      ],
    });
  }
}
