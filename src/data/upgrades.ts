import type { UpgradeDef } from '@domain/models';

export const UPGRADES: readonly UpgradeDef[] = [
  { id: 'COMFY_CHAIRS', cost: 4500, minDay: null, minTravelViet: null, effect: { patienceMult: 1.2 } },
  { id: 'FAN', cost: 3375, minDay: null, minTravelViet: null, effect: { patienceMult: 1.1 } },
  { id: 'FAST_PRINTER', cost: 5625, minDay: null, minTravelViet: null, effect: { printMs: 800 } },
  { id: 'AIRLINE_RELATIONS', cost: 9000, minDay: 3, minTravelViet: null, effect: { seatBias: true } },
  { id: 'REFUND_POLICY', cost: 7875, minDay: 4, minTravelViet: null, effect: { refundRate: 0.4 } },
  { id: 'WAITING_LOUNGE', cost: 6750, minDay: null, minTravelViet: null, effect: { queuePatienceRateMult: 0.85 } },
  { id: 'LOYALTY_BOARD', cost: 10125, minDay: null, minTravelViet: 4.3, effect: { tipMult: 1.15 } },
];
