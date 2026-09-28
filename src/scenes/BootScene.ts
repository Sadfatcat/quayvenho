import { STRINGS } from '@data/strings';
import { GameSession } from '@domain/game';
import { BaseScene } from './BaseScene';
import { sessionBridge } from './sessionBridge';

/**
 * Stage 3 (grey box): skip Onboarding/Kho entirely, buy a small fixed lot and open the counter
 * directly (ROADMAP Giai đoạn 3 mục tiêu). Replaced by the real Title/Onboarding/Prep flow in
 * Giai đoạn 4.
 */
const BOOTSTRAP_SEED = 42;
const BOOTSTRAP_ECO_QTY = 3;

export class BootScene extends BaseScene {
  constructor() {
    super('Boot');
  }

  protected onCreate(): void {
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('playground')) {
      this.scene.start('Playground');
      return;
    }
    this.bootstrapFixedSession();
    this.scene.start('Counter');
  }

  private bootstrapFixedSession(): void {
    const session = GameSession.newGame(BOOTSTRAP_SEED);
    sessionBridge.start(session);
    session.dispatch({ type: 'PROFILE_SET', playerName: STRINGS.dev.bootstrapPlayerName, brandName: STRINGS.dev.bootstrapBrandName });
    for (const routeId of session.state.unlockedRoutes) {
      const firstFlight = session.state.today.flights.find((flight) => flight.routeId === routeId);
      if (firstFlight) session.dispatch({ type: 'PREP_SET_QTY', flightId: firstFlight.id, cabin: 'ECONOMY', qty: BOOTSTRAP_ECO_QTY });
    }
    session.dispatch({ type: 'PREP_CONFIRM_PURCHASE' });
    session.dispatch({ type: 'OPEN_COUNTER' });
  }
}
