import type { UpgradeDef } from '@domain/models';

export const UPGRADES: readonly UpgradeDef[] = [
  { id: 'COMFY_CHAIRS', name: 'Ghế chờ êm', cost: 200, minDay: null, minTravelViet: null, effect: { patienceMult: 1.2 } },
  { id: 'FAN', name: 'Quạt mát', cost: 150, minDay: null, minTravelViet: null, effect: { patienceMult: 1.1 } },
  { id: 'FAST_PRINTER', name: 'Máy in nhanh', cost: 250, minDay: null, minTravelViet: null, effect: { printMs: 1500 } },
  { id: 'SEARCH_FILTER', name: 'Ô lọc chuyến', cost: 180, minDay: null, minTravelViet: null, effect: { searchFilter: true } },
  { id: 'AIRLINE_RELATIONS', name: 'Quan hệ hãng bay', cost: 400, minDay: 3, minTravelViet: null, effect: { seatBias: true } },
  { id: 'REFUND_POLICY', name: 'Chính sách hoàn ghế', cost: 350, minDay: 4, minTravelViet: null, effect: { refundRate: 0.3 } },
  { id: 'BIGGER_COUNTER', name: 'Quầy rộng', cost: 300, minDay: null, minTravelViet: null, effect: { queueMax: 6 } },
  { id: 'LOYALTY_BOARD', name: 'Bảng khách quen', cost: 450, minDay: null, minTravelViet: 4.3, effect: { tipMult: 1.15 } },
];
