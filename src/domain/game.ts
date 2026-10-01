import { PERSONAL, type PersonalConfig } from '@data/personal';
import { invariant } from './common/invariant';
import { advanceTime, applyCommand, createNewGame, type Session } from './dayCycle';
import type { Command, DomainEvent, GameState } from './models';

/** The only entry point scenes use. Never saved mid-shift, so a loaded state is never OPEN/CLOSING. */
export class GameSession {
  private readonly session: Session;

  constructor(state: GameState, personal: PersonalConfig = PERSONAL) {
    invariant(state.phase !== 'OPEN' && state.phase !== 'CLOSING', 'cannot resume mid-shift');
    this.session = { state, runtime: null, personal };
  }

  static newGame(seed: number): GameSession {
    return new GameSession(createNewGame(seed));
  }

  get state(): Readonly<GameState> {
    return this.session.state;
  }

  dispatch(command: Command): DomainEvent[] {
    return applyCommand(this.session, command);
  }

  tick(deltaMs: number): DomainEvent[] {
    return advanceTime(this.session, deltaMs);
  }
}
