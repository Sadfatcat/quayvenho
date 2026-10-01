import type { UpgradeDef } from '@domain/models';

export const UPGRADES: readonly UpgradeDef[] = [
  { id: 'COMFY_CHAIRS', cost: 200, minDay: null, minTravelViet: null, effect: { patienceMult: 1.2 } },
  { id: 'FAN', cost: 150, minDay: null, minTravelViet: null, effect: { patienceMult: 1.1 } },
  { id: 'FAST_PRINTER', cost: 250, minDay: null, minTravelViet: null, effect: { printMs: 1500 } },
  { id: 'SEARCH_FILTER', cost: 180, minDay: null, minTravelViet: null, effect: { searchFilter: true } },
  { id: 'AIRLINE_RELATIONS', cost: 400, minDay: 3, minTravelViet: null, effect: { seatBias: true } },
  { id: 'REFUND_POLICY', cost: 350, minDay: 4, minTravelViet: null, effect: { refundRate: 0.3 } },
  { id: 'BIGGER_COUNTER', cost: 300, minDay: null, minTravelViet: null, effect: { queueMax: 6 } },
  { id: 'LOYALTY_BOARD', cost: 450, minDay: null, minTravelViet: 4.3, effect: { tipMult: 1.15 } },
];
