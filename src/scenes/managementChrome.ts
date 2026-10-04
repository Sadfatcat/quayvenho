import type Phaser from 'phaser';
import { STRINGS } from '@data/strings';
import { isTravelVietOpen, travelVietScore } from '@domain/demand';
import type { DomainEvent, GameState } from '@domain/models';
import { Button } from '@ui/Button';
import { MANAGEMENT_TAB_SCENE, ManagementTabs, type ManagementTab } from '@ui/ManagementTabs';
import { TopBar } from '@ui/TopBar';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { DialogOverlay } from './overlays/DialogOverlay';
import { SettingsOverlay } from './overlays/SettingsOverlay';
import { sessionBridge } from './sessionBridge';

export const TOP_BAR_Y = 90;
export const TABS_Y = 190;
export const TABS_HEIGHT = 64;
/** Mép trên vùng nội dung của mọi mục quản lý, ngay dưới thanh mục. */
export const MANAGEMENT_CONTENT_TOP = TABS_Y + TABS_HEIGHT / 2 + 24;
const ACTION_BUTTON = { y: GAME_HEIGHT - 80, width: 420, height: 96 };

export interface ManagementChrome {
  topBar: TopBar;
  actionButton: Button | null;
  /** Cập nhật tiền, ngày, TravelViet theo trạng thái hiện tại. */
  refresh: (state: GameState) => void;
}

const dayLabelOf = (state: GameState): string => `${STRINGS.prep.dayLabel} ${state.day}`;

/** Sau tổng kết (phase SHOP) chưa có chuyến của ngày mới, nên mua vé và chỉnh giá tạm khoá. */
const disabledTabsFor = (state: GameState): ReadonlySet<ManagementTab> =>
  state.phase === 'PREP' ? new Set() : new Set<ManagementTab>(['TICKETS', 'PRICES']);

/** Khung chung của 4 mục quản lý: thanh trên cùng, thanh mục và (tuỳ chọn) nút hành động chính ở đáy. */
export const addManagementChrome = (scene: Phaser.Scene, active: ManagementTab, withActionButton: boolean): ManagementChrome => {
  const state = sessionBridge.current.state;
  const topBar = new TopBar(scene, 0, TOP_BAR_Y, {
    width: GAME_WIDTH,
    leftLabel: dayLabelOf(state),
    money: state.money,
    travelViet: isTravelVietOpen(state.day) ? travelVietScore(state.starHistory) : null,
    icon: STRINGS.common.settingsIcon,
    onIconTap: () => new SettingsOverlay(scene, { onExitToTitle: () => scene.scene.start('Title') }),
  });
  new ManagementTabs(scene, GAME_WIDTH / 2, TABS_Y, {
    width: GAME_WIDTH - 40,
    height: TABS_HEIGHT,
    labels: STRINGS.management.tabs,
    active,
    disabled: disabledTabsFor(state),
    onSelect: (tab) => scene.scene.start(MANAGEMENT_TAB_SCENE[tab]),
  });

  const inPrep = state.phase === 'PREP';
  const actionButton = withActionButton
    ? new Button(scene, GAME_WIDTH / 2, ACTION_BUTTON.y, {
        width: ACTION_BUTTON.width,
        height: ACTION_BUTTON.height,
        label: inPrep ? STRINGS.prep.openCounter : STRINGS.shop.nextDay,
        variant: inPrep ? 'success' : 'primary',
        onTap: () => (inPrep ? requestOpenCounter(scene) : requestNextDay(scene, actionButton)),
      })
    : null;

  return {
    topBar,
    actionButton,
    refresh: (latest) => {
      topBar.setLeftLabel(dayLabelOf(latest));
      topBar.setMoney(latest.money);
      topBar.setTravelViet(isTravelVietOpen(latest.day) ? travelVietScore(latest.starHistory) : null);
    },
  };
};

const wasRejected = (events: readonly DomainEvent[]): boolean => events.some((event) => event.type === 'COMMAND_REJECTED');

const showCannotOpen = (scene: Phaser.Scene): void => {
  new DialogOverlay(scene, {
    title: STRINGS.prep.cannotOpenTitle,
    message: STRINGS.prep.cannotOpenMessage,
    buttons: [{ label: STRINGS.priceBoard.done, variant: 'primary', onTap: () => {} }],
  });
};

/** Chỉ sang Quầy khi domain thực sự mở cửa; bị từ chối (vd. còn ghế chờ vượt tiền) thì ở lại và báo lý do. */
const startCounter = (scene: Phaser.Scene): void => {
  if (wasRejected(sessionBridge.dispatch({ type: 'OPEN_COUNTER' }))) {
    showCannotOpen(scene);
    return;
  }
  scene.scene.start('Counter');
};

/** Mở cửa: hỏi lại nếu còn ghế chưa xác nhận nhập hoặc kho trống. */
export const requestOpenCounter = (scene: Phaser.Scene): void => {
  const state = sessionBridge.current.state;
  const pendingCount = Object.values(state.today.pendingPurchase).reduce((a, b) => a + b, 0);
  if (pendingCount > 0) {
    new DialogOverlay(scene, {
      title: STRINGS.prep.pendingTitle,
      message: `${STRINGS.prep.pendingMessagePrefix}${pendingCount}${STRINGS.prep.pendingMessageSuffix}`,
      buttons: [
        { label: STRINGS.prep.pendingCancel, variant: 'ghost', onTap: () => {} },
        {
          label: STRINGS.prep.pendingDiscardAndOpen,
          variant: 'danger',
          onTap: () => {
            sessionBridge.dispatch({ type: 'PREP_CLEAR_PENDING' });
            startCounter(scene);
          },
        },
        {
          label: STRINGS.prep.pendingConfirmAndOpen,
          variant: 'primary',
          onTap: () => {
            if (wasRejected(sessionBridge.dispatch({ type: 'PREP_CONFIRM_PURCHASE' }))) {
              showCannotOpen(scene);
              return;
            }
            startCounter(scene);
          },
        },
      ],
    });
    return;
  }
  if (!state.today.seats.some((seat) => seat.state === 'AVAILABLE')) {
    new DialogOverlay(scene, {
      title: STRINGS.prep.emptyStockTitle,
      message: STRINGS.prep.emptyStockMessage,
      buttons: [
        { label: STRINGS.prep.emptyStockCancel, variant: 'ghost', onTap: () => {} },
        { label: STRINGS.prep.emptyStockConfirm, variant: 'danger', onTap: () => startCounter(scene) },
      ],
    });
    return;
  }
  startCounter(scene);
};

export const requestNextDay = (scene: Phaser.Scene, button: Button | null): void => {
  button?.lock();
  const events = sessionBridge.dispatch({ type: 'NEXT_DAY' });
  if (events.some((event) => event.type === 'COMMAND_REJECTED')) {
    button?.unlock();
    return;
  }
  scene.scene.start('Prep');
};
