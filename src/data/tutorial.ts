import type { DayEvent } from '@domain/models';

export type TutorialScene = 'Prep' | 'Counter';

export interface TutorialStepDef {
  id: string;
  scene: TutorialScene;
  /** Điều kiện xuất hiện; cờ `tut_<id>` quyết định đã xem hay chưa (PLAN §10.11). */
  appliesOn: (context: { day: number; event: DayEvent }) => boolean;
}

export const TUTORIAL_FLAG_PREFIX = 'tut_';

/** Bảng mốc hướng dẫn PLAN §10.11. Nội dung chữ nằm ở `STRINGS.tutorial[id]`. */
export const TUTORIAL_STEPS: readonly TutorialStepDef[] = [
  { id: 'prepDay1', scene: 'Prep', appliesOn: ({ day }) => day === 1 },
  { id: 'counterDay1', scene: 'Counter', appliesOn: ({ day }) => day === 1 },
  { id: 'baggageDay2', scene: 'Counter', appliesOn: ({ day }) => day >= 2 },
  { id: 'seatPrefDay3', scene: 'Counter', appliesOn: ({ day }) => day >= 3 },
  { id: 'businessDay4', scene: 'Counter', appliesOn: ({ day }) => day >= 4 },
  { id: 'timeAndExtrasDay5', scene: 'Counter', appliesOn: ({ day }) => day >= 5 },
  { id: 'passportDay6', scene: 'Counter', appliesOn: ({ day }) => day >= 6 },
  { id: 'priceDay2', scene: 'Prep', appliesOn: ({ day }) => day >= 2 },
  { id: 'rushFirst', scene: 'Prep', appliesOn: ({ event }) => event.type === 'RUSH' },
  { id: 'weatherFirst', scene: 'Prep', appliesOn: ({ event }) => event.type === 'WEATHER' },
];
