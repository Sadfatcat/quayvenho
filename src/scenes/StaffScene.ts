import Phaser from 'phaser';
import { MARKETING, STAFF_CAP, STAFF_KINDS } from '@data/staff';
import { STRINGS } from '@data/strings';
import { shopContext } from '@domain/dayCycle';
import type { StaffKind, StaffKindDef, StaffMember } from '@domain/models';
import { checkHire, checkTeachMarketing, isAbsentOn, marketingTeachCost, wageOf, type HireError } from '@domain/staff';
import { Button } from '@ui/Button';
import { Card } from '@ui/Card';
import { formatMoney } from '@ui/format';
import { Panel } from '@ui/Panel';
import { ScrollList } from '@ui/ScrollList';
import { kindName, memberDetail } from '@ui/staffText';
import { COLORS, FONT_FAMILY, HEADING_FONT_FAMILY, toCssColor } from '@ui/theme';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { BaseScene } from './BaseScene';
import { addManagementChrome, MANAGEMENT_CONTENT_TOP, type ManagementChrome } from './managementChrome';
import { DialogOverlay } from './overlays/DialogOverlay';
import { sessionBridge } from './sessionBridge';

const T = STRINGS.staff;
const SIDE_MARGIN = 24;
const SCOPE_Y = MANAGEMENT_CONTENT_TOP + 20;
const SLOTS_TITLE_Y = SCOPE_Y + 44;
const SLOT = { top: SLOTS_TITLE_Y + 22, height: 150, gap: 12 };
const MARKETING_STRIP = { top: SLOT.top + SLOT.height + 14, height: 92 };
const LIST_Y = MARKETING_STRIP.top + MARKETING_STRIP.height + 16;
const LIST_BOTTOM_MARGIN = 170;
const CARD_HEIGHT = 190;
const CARD_GAP = 14;
const AVATAR_RADIUS = 30;
const FIRE_BUTTON = { width: 130, height: 48 };
const KIND_COLORS: Record<StaffKind, number> = { INTERN: COLORS.textMuted, JUNIOR: COLORS.teal, MIDDLE: COLORS.accent, SENIOR: COLORS.primary, MARKETING: COLORS.moneyGreen };

const hireStatusText = (reason: HireError, def: StaffKindDef): string => {
  switch (reason) {
    case 'NOT_ENOUGH_MONEY':
      return T.statusNotEnoughMoney;
    case 'DAY_TOO_EARLY':
      return `${T.statusDayTooEarly} ${def.minDay}`;
    case 'STAFF_FULL':
      return T.statusFull;
    case 'ALREADY_HIRED':
      return T.statusAlreadyHired;
    default:
      return '';
  }
};

const bonusText = (member: StaffMember): string => `${T.bonusLabel}: +${member.bonusPct}%`;

/** Mục "Nhân viên": 2 chỗ ở quầy (mỗi bậc một việc riêng), nhân viên marketing riêng và danh sách thuê. */
export class StaffScene extends BaseScene {
  private chrome!: ManagementChrome;
  private dynamicLayer!: Phaser.GameObjects.Container;
  private list!: ScrollList<StaffKindDef>;
  private unsubscribeEvents: (() => void) | null = null;

  constructor() {
    super('Staff');
    this.backgroundTheme = 'shop';
    this.musicTrack = 'calm';
  }

  protected onCreate(): void {
    this.chrome = addManagementChrome(this, 'STAFF', true);
    this.add
      .text(GAME_WIDTH / 2, SCOPE_Y, T.scope, { fontFamily: FONT_FAMILY, fontSize: '19px', color: toCssColor(COLORS.textMuted), align: 'center', wordWrap: { width: GAME_WIDTH - 80 } })
      .setOrigin(0.5);
    this.add.text(SIDE_MARGIN, SLOTS_TITLE_Y, T.slotsTitle, { fontFamily: FONT_FAMILY, fontSize: '22px', fontStyle: 'bold', color: toCssColor(COLORS.text) }).setOrigin(0, 0.5);
    this.dynamicLayer = this.add.container(0, 0);
    this.list = new ScrollList<StaffKindDef>(this, {
      x: 20,
      y: LIST_Y,
      width: GAME_WIDTH - 40,
      height: GAME_HEIGHT - LIST_Y - LIST_BOTTOM_MARGIN,
      itemHeight: CARD_HEIGHT + CARD_GAP,
      items: [...STAFF_KINDS],
      renderItem: (def) => this.renderHireCard(def),
    });
    this.unsubscribeEvents = sessionBridge.onEvents(() => this.renderAll());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unsubscribeEvents?.());
    this.renderAll();
  }

  private renderAll(): void {
    const state = sessionBridge.current.state;
    this.chrome.refresh(state);
    this.dynamicLayer.removeAll(true);
    this.renderSlots();
    this.renderMarketingStrip();
    this.list.setItems([...STAFF_KINDS]);
  }

  private counterStaff(): StaffMember[] {
    return sessionBridge.current.state.staff.filter((member) => member.kind !== 'MARKETING');
  }

  private renderSlots(): void {
    const state = sessionBridge.current.state;
    const staff = this.counterStaff();
    const slotWidth = (GAME_WIDTH - 2 * SIDE_MARGIN - SLOT.gap) / STAFF_CAP;
    for (let index = 0; index < STAFF_CAP; index++) {
      const left = SIDE_MARGIN + index * (slotWidth + SLOT.gap);
      const member = staff[index];
      const panel = new Panel(this, left + slotWidth / 2, SLOT.top + SLOT.height / 2, { width: slotWidth, height: SLOT.height, fill: member ? COLORS.cloud : COLORS.kraft, strokeColor: member ? COLORS.primary : COLORS.textMuted });
      this.dynamicLayer.add(panel);
      if (!member) {
        this.dynamicLayer.add(this.add.text(left + slotWidth / 2, SLOT.top + SLOT.height / 2, T.emptySlot, { fontFamily: FONT_FAMILY, fontSize: '22px', color: toCssColor(COLORS.textMuted) }).setOrigin(0.5));
        continue;
      }
      this.addMemberContent(member, left, SLOT.top, slotWidth, state.day, state.wageRaise);
    }
  }

  private addMemberContent(member: StaffMember, left: number, top: number, width: number, day: number, wageRaise: number): void {
    const centerY = top + 52;
    const avatar = this.add.graphics();
    avatar.fillStyle(KIND_COLORS[member.kind], 1);
    avatar.fillCircle(left + 16 + AVATAR_RADIUS, centerY, AVATAR_RADIUS);
    const initial = this.add.text(left + 16 + AVATAR_RADIUS, centerY, member.name.charAt(0), { fontFamily: HEADING_FONT_FAMILY, fontSize: '30px', fontStyle: 'bold', color: toCssColor(COLORS.cloud) }).setOrigin(0.5);
    const textLeft = left + 16 + AVATAR_RADIUS * 2 + 12;
    const textWidth = width - (textLeft - left) - 10;
    const name = this.add.text(textLeft, top + 18, `${member.name} · ${kindName(member.kind)}`, { fontFamily: FONT_FAMILY, fontSize: '19px', fontStyle: 'bold', color: toCssColor(COLORS.text), wordWrap: { width: textWidth } }).setOrigin(0, 0);
    const detail = member.kind === 'INTERN' ? T.learning : memberDetail(member);
    const absent = isAbsentOn(member, day);
    const status = absent ? `${T.absence[member.absenceReason ?? ''] ?? ''}` : detail;
    const detailText = this.add.text(textLeft, top + 48, status, { fontFamily: FONT_FAMILY, fontSize: '16px', color: toCssColor(absent ? COLORS.danger : COLORS.textMuted), wordWrap: { width: textWidth } }).setOrigin(0, 0);
    const wage = this.add.text(left + 16, top + SLOT.height - 36, `${T.wagePerDay}: ${formatMoney(wageOf(member, wageRaise))}`, { fontFamily: FONT_FAMILY, fontSize: '18px', fontStyle: 'bold', color: toCssColor(COLORS.moneyGreen) }).setOrigin(0, 0.5);
    const fire = new Button(this, left + width - FIRE_BUTTON.width / 2 - 12, top + SLOT.height - 36, { width: FIRE_BUTTON.width, height: FIRE_BUTTON.height, label: T.fire, variant: 'ghost', onTap: () => this.confirmFire(member) });
    this.dynamicLayer.add([avatar, initial, name, detailText, wage, fire]);
  }

  private renderMarketingStrip(): void {
    const state = sessionBridge.current.state;
    const member = state.staff.find((candidate) => candidate.kind === 'MARKETING');
    if (!member) return;
    const width = GAME_WIDTH - 2 * SIDE_MARGIN;
    const centerY = MARKETING_STRIP.top + MARKETING_STRIP.height / 2;
    this.dynamicLayer.add(new Panel(this, GAME_WIDTH / 2, centerY, { width, height: MARKETING_STRIP.height, fill: COLORS.cloud, strokeColor: COLORS.moneyGreen }));
    const absent = isAbsentOn(member, state.day);
    const title = `${member.name} · ${kindName(member.kind)}${absent ? ` — ${T.absence[member.absenceReason ?? ''] ?? ''}` : ''}`;
    const nextCost = member.bonusPct >= MARKETING.maxBonusPct ? null : marketingTeachCost(member.bonusPct);
    const teach = checkTeachMarketing(state.staff, state.money);
    this.dynamicLayer.add([
      this.add.text(SIDE_MARGIN + 16, MARKETING_STRIP.top + 20, title, { fontFamily: FONT_FAMILY, fontSize: '19px', fontStyle: 'bold', color: toCssColor(absent ? COLORS.danger : COLORS.text) }).setOrigin(0, 0.5),
      this.add.text(SIDE_MARGIN + 16, MARKETING_STRIP.top + 52, `${bonusText(member)} · ${T.wagePerDay}: ${formatMoney(wageOf(member, state.wageRaise))}`, { fontFamily: FONT_FAMILY, fontSize: '17px', fontStyle: 'bold', color: toCssColor(COLORS.moneyGreen) }).setOrigin(0, 0.5),
    ]);
    const teachButton = new Button(this, GAME_WIDTH - SIDE_MARGIN - 240, centerY, {
      width: 230,
      height: 56,
      label: nextCost === null ? T.teachMax : `${T.teach} (−${formatMoney(nextCost)})`,
      variant: 'primary',
      onTap: () => sessionBridge.dispatch({ type: 'TEACH_MARKETING' }),
    });
    teachButton.setEnabled(teach.ok);
    const fire = new Button(this, GAME_WIDTH - SIDE_MARGIN - 62, centerY, { width: 110, height: 56, label: T.fire, variant: 'ghost', onTap: () => this.confirmFire(member) });
    this.dynamicLayer.add([teachButton, fire]);
  }

  private renderHireCard(def: StaffKindDef): Phaser.GameObjects.Container {
    const state = sessionBridge.current.state;
    const text = T.kinds[def.kind] ?? { name: def.kind, description: '' };
    const result = checkHire(def.kind, state.staff, shopContext(state));
    return new Card(this, 0, 0, {
      width: GAME_WIDTH - 40,
      height: CARD_HEIGHT,
      title: text.name,
      description: `${text.description}\n${T.wagePerDay}: ${formatMoney(def.baseWage)}`,
      priceLabel: `${T.hireCost}: ${def.hireCost === 0 ? T.free : formatMoney(def.hireCost)}`,
      statusLabel: result.ok ? '' : hireStatusText(result.reason, def),
      buttonLabel: T.hire,
      buttonEnabled: result.ok,
      onBuy: () => this.confirmHire(def, text.name),
    });
  }

  private confirmHire(def: StaffKindDef, name: string): void {
    new DialogOverlay(this, {
      title: T.confirmTitle,
      message: name,
      buttons: [
        { label: STRINGS.shop.confirmCancel, variant: 'ghost', onTap: () => {} },
        { label: T.hire, variant: 'primary', onTap: () => sessionBridge.dispatch({ type: 'HIRE_STAFF', kind: def.kind }) },
      ],
    });
  }

  private confirmFire(member: StaffMember): void {
    new DialogOverlay(this, {
      title: T.fireConfirmTitle,
      message: T.fireConfirmMessage.replace('{name}', member.name),
      buttons: [
        { label: STRINGS.shop.confirmCancel, variant: 'ghost', onTap: () => {} },
        { label: T.fire, variant: 'danger', onTap: () => sessionBridge.dispatch({ type: 'FIRE_STAFF', staffId: member.id }) },
      ],
    });
  }
}
