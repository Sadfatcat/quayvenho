import { invariant } from '@domain/common/invariant';
import { GameSession } from '@domain/game';
import type { Command, DomainEvent } from '@domain/models';

export type DomainEventListener = (events: DomainEvent[]) => void;

/**
 * One GameSession shared across every gameplay scene (Prep/Counter/Summary/Shop).
 * GameSession mutates its state in place (DECISIONS 2026-09-28), so scenes must read
 * `sessionBridge.current.state` fresh and react to onEvents() rather than diff old/new state.
 */
class SessionBridge {
  private session: GameSession | null = null;
  private paused = false;
  private readonly listeners = new Set<DomainEventListener>();

  start(session: GameSession): void {
    this.session = session;
  }

  get hasSession(): boolean {
    return this.session !== null;
  }

  get current(): GameSession {
    invariant(this.session, 'no active GameSession');
    return this.session;
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  get isPaused(): boolean {
    return this.paused;
  }

  /** Returns an unsubscribe function. */
  onEvents(listener: DomainEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Dispatch first, then tick, in the same frame — keeps "delivery wins over patience" (PLAN §5.5). */
  dispatch(command: Command): DomainEvent[] {
    const events = this.current.dispatch(command);
    this.notify(events);
    return events;
  }

  tick(deltaMs: number): DomainEvent[] {
    if (this.paused || !this.session) return [];
    const events = this.session.tick(deltaMs);
    this.notify(events);
    return events;
  }

  private notify(events: DomainEvent[]): void {
    if (events.length === 0) return;
    for (const listener of this.listeners) listener(events);
  }
}

export const sessionBridge = new SessionBridge();
