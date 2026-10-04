import { GameSession } from '@domain/game';
import { perfectDecide, playShift } from '@domain/__integration__/bots';
import { sessionBridge } from '@scenes/sessionBridge';

declare global {
  interface Window {
    __sessionBridge?: typeof sessionBridge;
    __game?: Phaser.Game;
    /** DEV: tạo ván mới đang ở Quầy, bước Hành lý (đã chọn chuyến + ghế) để thử nhanh cân hành lý. */
    __debugBaggageStep?: () => void;
    /** DEV: mở thẳng một màn với ván mẫu (Prep | Counter | Summary | Shop) để xem giao diện. */
    __debugScene?: (scene: 'Prep' | 'Counter' | 'Summary' | 'Shop') => void;
  }
}

const DEBUG_SEED = 4242;
const TUTORIAL_FLAG_IDS = ['prepDay1', 'counterDay1', 'baggageDay2', 'priceDay2', 'rushFirst', 'weatherFirst'];
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

const startSceneWithSession = (target: 'Prep' | 'Counter' | 'Summary' | 'Shop'): void => {
  const game = window.__game;
  if (!game) return;
  const session = GameSession.newGame(DEBUG_SEED);
  session.dispatch({ type: 'PROFILE_SET', playerName: 'Dev', brandName: 'Quầy Dev' });
  session.dispatch({ type: 'FLAG_SET', flag: 'tutorialDone_1' });
  for (const id of TUTORIAL_FLAG_IDS) session.dispatch({ type: 'FLAG_SET', flag: `tut_${id}` });
  const flight = session.state.today.flights.find((candidate) => candidate.routeId === 'HAN-DAD');
  if (flight && target !== 'Prep') {
    session.dispatch({ type: 'PREP_SET_QTY', flightId: flight.id, cabin: 'ECONOMY', qty: 3 });
    session.dispatch({ type: 'PREP_CONFIRM_PURCHASE' });
    session.dispatch({ type: 'OPEN_COUNTER' });
  }
  if (target === 'Counter') for (let tick = 0; tick < MAX_WAIT_TICKS && session.state.today.counter.state !== 'BUILDING'; tick++) session.tick(TICK_MS);
  if (target === 'Summary' || target === 'Shop') {
    playShift(session, perfectDecide);
    if (target === 'Shop') session.dispatch({ type: 'GO_TO_SHOP' });
  }
  sessionBridge.start(session);
  for (const scene of game.scene.getScenes(true)) game.scene.stop(scene.scene.key);
  game.scene.start(target);
};

/** DEV-only inspection hook (PLAN §6.1 dev/debug.ts); never reachable in production builds. */
export const installDebugHooks = (): void => {
  window.__sessionBridge = sessionBridge;
  window.__debugBaggageStep = startBaggageStepSession;
  window.__debugScene = startSceneWithSession;
};
