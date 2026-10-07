import { describe, expect, it } from 'vitest';
import { STRINGS } from './strings';
import type { DayEvent } from '@domain/models';
import { TUTORIAL_STEPS, type TutorialScene } from './tutorial';

const NO_EVENT: DayEvent = { type: 'NONE' };
const RUSH_EVENT: DayEvent = { type: 'RUSH', holidayId: 'TET', hotRoutes: ['HAN-DAD'] };

const idsOn = (scene: TutorialScene, day: number, event: DayEvent): string[] =>
  TUTORIAL_STEPS.filter((step) => step.scene === scene && step.appliesOn({ day, event })).map((step) => step.id);

describe('TUTORIAL_STEPS', () => {
  it('shows only the day-1 steps on day 1 without events', () => {
    expect(idsOn('Prep', 1, NO_EVENT)).toEqual(['prepDay1', 'tabsDay1']);
    expect(idsOn('Counter', 1, NO_EVENT)).toEqual(['counterDay1', 'refuseDay1']);
  });

  it('adds each counter mechanic from its day onward (baggage 2, seat 3, business 4, extras 5, passport 6)', () => {
    expect(idsOn('Counter', 2, NO_EVENT)).toContain('baggageDay2');
    expect(idsOn('Counter', 2, NO_EVENT)).not.toContain('seatPrefDay3');
    expect(idsOn('Counter', 3, NO_EVENT)).toContain('seatPrefDay3');
    expect(idsOn('Counter', 4, NO_EVENT)).toContain('businessDay4');
    expect(idsOn('Counter', 5, NO_EVENT)).toContain('timeAndExtrasDay5');
    expect(idsOn('Counter', 5, NO_EVENT)).not.toContain('passportDay6');
    expect(idsOn('Counter', 6, NO_EVENT)).toContain('passportDay6');
  });

  it('explains every button: refuse from day 1, pause/close-early from day 2, passport button on day 6, plus shop, staff and summary screens', () => {
    expect(idsOn('Counter', 1, NO_EVENT)).toContain('refuseDay1');
    expect(idsOn('Counter', 1, NO_EVENT)).not.toContain('pauseDay2');
    expect(idsOn('Counter', 2, NO_EVENT)).toContain('pauseDay2');
    expect(idsOn('Shop', 1, NO_EVENT)).toEqual(['shopFirst']);
    expect(idsOn('Staff', 1, NO_EVENT)).toEqual(['staffFirst']);
    expect(idsOn('Summary', 1, NO_EVENT)).toEqual(['summaryDay1']);
  });

  it('has a Béo message for every step', () => {
    for (const step of TUTORIAL_STEPS) expect((STRINGS.tutorial as Record<string, string>)[step.id]).toBeTruthy();
  });

  it('shows the RUSH step only when the day event is RUSH', () => {
    expect(idsOn('Prep', 7, RUSH_EVENT)).toContain('rushFirst');
    expect(idsOn('Prep', 7, NO_EVENT)).not.toContain('rushFirst');
  });
});
