import type { UpgradeDef } from '@domain/models';

export const UPGRADES: readonly UpgradeDef[] = [
  { id: 'COMFY_CHAIRS', cost: 3000, minDay: null, minTravelViet: null, effect: { patienceMult: 1.2 } },
  { id: 'FAN', cost: 2250, minDay: null, minTravelViet: null, effect: { patienceMult: 1.1 } },
  { id: 'FAST_PRINTER', cost: 3750, minDay: null, minTravelViet: null, effect: { printMs: 1500 } },
  { id: 'AIRLINE_RELATIONS', cost: 6000, minDay: 3, minTravelViet: null, effect: { seatBias: true } },
  { id: 'REFUND_POLICY', cost: 5250, minDay: 4, minTravelViet: null, effect: { refundRate: 0.3 } },
  { id: 'BIGGER_COUNTER', cost: 4500, minDay: null, minTravelViet: null, effect: { queueMax: 6 } },
  { id: 'LOYALTY_BOARD', cost: 6750, minDay: null, minTravelViet: 4.3, effect: { tipMult: 1.15 } },
];
