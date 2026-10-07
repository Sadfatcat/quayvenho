import { GameSession } from '@domain/game';
import { perfectDecide, playDay, playShift } from '@domain/__integration__/bots';
import { sessionBridge } from '@scenes/sessionBridge';

declare global {
  interface Window {
    __sessionBridge?: typeof sessionBridge;
    __game?: Phaser.Game;
    /** DEV: tạo ván mới đang ở Quầy, bước Hành lý (đã chọn chuyến + ghế) để thử nhanh cân hành lý. */
    __debugBaggageStep?: () => void;
    /** DEV: mở thẳng một màn với ván mẫu (Prep | Price | Staff | Counter | Summary | Shop) để xem giao diện. */
    __debugScene?: (scene: DebugScene) => void;
    /** DEV: mở ván mẫu đã chơi tới ngày `day` (bot chơi hoàn hảo) với đúng `money` (đơn vị k), vào màn `scene` (mặc định Prep). Cũng chạy qua URL ?debugDay=25&debugMoney=10000&debugScene=Prep. */
    __debugDay?: (day: number, money: number, scene?: DebugScene) => void;
  }
}

type DebugScene = 'Prep' | 'Price' | 'Staff' | 'Counter' | 'Summary' | 'Shop';
const PREP_PHASE_SCENES: ReadonlySet<DebugScene> = new Set(['Prep', 'Price', 'Staff']);

const DEBUG_SEED = 4242;
const TUTORIAL_FLAG_IDS = ['prepDay1', 'tabsDay1', 'counterDay1', 'refuseDay1', 'pauseDay2', 'baggageDay2', 'priceDay2', 'rushFirst', 'weatherFirst', 'shopFirst', 'staffFirst', 'summaryDay1'];
const MAX_WAIT_TICKS = 5000;
const TICK_MS = 100;

const startBaggageStepSession = (): void => {
  const game = window.__game;
  if (!game) return;
  const session = GameSession.newGame(DEBUG_SEED);
  session.dispatch({ type: 'PROFILE_SET', playerName: 'Dev', brandName: 'Quầy Dev' });
  session.dispatch({ type: 'FLAG_SET', flag: 'tutorialDone_1' });
  for (const id of TUTORIAL_FLAG_IDS) session.dispatch({ type: 'FLAG_SET', flag: `tut_${id}` });
  const flight = session.state.today.flights.find((candidate) => candidate.routeId === 'HAN-DAD');
  if (!flight) return;
  session.dispatch({ type: 'PREP_SET_QTY', flightId: flight.id, cabin: 'ECONOMY', qty: 2 });
  session.dispatch({ type: 'PREP_CONFIRM_PURCHASE' });
  session.dispatch({ type: 'OPEN_COUNTER' });
  for (let tick = 0; tick < MAX_WAIT_TICKS && session.state.today.counter.state !== 'BUILDING'; tick++) session.tick(TICK_MS);
  const seat = session.state.today.seats.find((candidate) => candidate.state === 'AVAILABLE');
  if (seat) {
    session.dispatch({ type: 'BUILD_SELECT_FLIGHT', flightId: seat.flightId, cabin: 'ECONOMY' });
    session.dispatch({ type: 'BUILD_SELECT_SEAT', seat: seat.seat });
    session.dispatch({ type: 'BUILD_GOTO_STEP', step: 'EXTRAS' });
  }
  sessionBridge.start(session);
  for (const scene of game.scene.getScenes(true)) game.scene.stop(scene.scene.key);
  game.scene.start('Counter');
};

const startSceneWithSession = (target: DebugScene): void => {
  const game = window.__game;
  if (!game) return;
  const session = GameSession.newGame(DEBUG_SEED);
  session.dispatch({ type: 'PROFILE_SET', playerName: 'Dev', brandName: 'Quầy Dev' });
  session.dispatch({ type: 'FLAG_SET', flag: 'tutorialDone_1' });
  for (const id of TUTORIAL_FLAG_IDS) session.dispatch({ type: 'FLAG_SET', flag: `tut_${id}` });
  const flight = session.state.today.flights.find((candidate) => candidate.routeId === 'HAN-DAD');
  if (flight && !PREP_PHASE_SCENES.has(target)) {
    session.dispatch({ type: 'PREP_SET_QTY', flightId: flight.id, cabin: 'ECONOMY', qty: 3 });
    session.dispatch({ type: 'PREP_CONFIRM_PURCHASE' });
    session.dispatch({ type: 'OPEN_COUNTER' });
  }
  if (target === 'Counter') for (let tick = 0; tick < MAX_WAIT_TICKS && session.state.today.counter.state !== 'BUILDING'; tick++) session.tick(TICK_MS);
  if (target === 'Summary' || target === 'Shop') {
    playShift(session, perfectDecide);
    if (target === 'Shop') for (const type of ['GO_TO_SHOP', 'NEXT_DAY'] as const) session.dispatch({ type });
  }
  sessionBridge.start(session);
  for (const scene of game.scene.getScenes(true)) game.scene.stop(scene.scene.key);
  game.scene.start(target);
};

const DEBUG_URL_POLL_MS = 200;
const DEBUG_URL_TIMEOUT_MS = 30000;
const DEBUG_SCENES: readonly DebugScene[] = ['Prep', 'Price', 'Staff', 'Counter', 'Summary', 'Shop'];

const startAtDay = (day: number, money: number, target: DebugScene = 'Prep'): void => {
  const game = window.__game;
  if (!game) return;
  const session = GameSession.newGame(DEBUG_SEED);
  session.dispatch({ type: 'PROFILE_SET', playerName: 'Dev', brandName: 'Quầy Dev' });
  session.dispatch({ type: 'FLAG_SET', flag: 'tutorialDone_1' });
  for (const id of TUTORIAL_FLAG_IDS) session.dispatch({ type: 'FLAG_SET', flag: `tut_${id}` });
  while (session.state.day < day) playDay(session);
  Object.assign(session.state, { money });
  sessionBridge.start(session);
  for (const scene of game.scene.getScenes(true)) game.scene.stop(scene.scene.key);
  game.scene.start(target);
};

/** Mở thẳng ván mẫu theo URL (?debugDay=25&debugMoney=10000&debugScene=Prep) ngay khi game tải xong. */
const startFromUrlWhenReady = (): void => {
  const params = new URLSearchParams(window.location.search);
  const day = Number(params.get('debugDay'));
  if (!Number.isInteger(day) || day < 1) return;
  const money = Number(params.get('debugMoney') ?? 10000);
  const requested = params.get('debugScene') as DebugScene | null;
  const target = requested && DEBUG_SCENES.includes(requested) ? requested : 'Prep';
  const startedAt = Date.now();
  const timer = window.setInterval(() => {
    const ready = window.__game?.scene.isActive('Title');
    if (!ready && Date.now() - startedAt < DEBUG_URL_TIMEOUT_MS) return;
    window.clearInterval(timer);
    if (ready) startAtDay(day, Number.isFinite(money) ? money : 10000, target);
  }, DEBUG_URL_POLL_MS);
};

/** DEV-only inspection hook (PLAN §6.1 dev/debug.ts); never reachable in production builds. */
export const installDebugHooks = (): void => {
  window.__sessionBridge = sessionBridge;
  window.__debugBaggageStep = startBaggageStepSession;
  window.__debugScene = startSceneWithSession;
  window.__debugDay = startAtDay;
  startFromUrlWhenReady();
};
