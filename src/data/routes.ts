import type { Route } from '@domain/models';
import { SEAT_MARGIN_BY_ROUTE } from './balance';
import { invariant } from '@domain/common/invariant';
import { applyCustomRoutes, PERSONAL } from './personal';

type RouteDef = Omit<Route, 'cost'>;

const BASE_ROUTES: readonly RouteDef[] = [
  { id: 'HAN-SGN', name: 'TP. Hồ Chí Minh', price: { ECONOMY: 1500, BUSINESS: 3900 }, weight: 3, unlock: null, color: 0xf2994a, icon: 'sgn' },
  { id: 'HAN-DAD', name: 'Đà Nẵng', price: { ECONOMY: 1100, BUSINESS: 2700 }, weight: 3, unlock: null, color: 0x56ccf2, icon: 'dad' },
  { id: 'HAN-CXR', name: 'Nha Trang', price: { ECONOMY: 1300, BUSINESS: 3600 }, weight: 2, unlock: { cost: 3750, minTravelViet: null }, color: 0x6fcf97, icon: 'cxr' },
  { id: 'HAN-PQC', name: 'Phú Quốc', price: { ECONOMY: 1900, BUSINESS: 4300 }, weight: 2, unlock: { cost: 5250, minTravelViet: null }, color: 0x2d9cdb, icon: 'pqc' },
  { id: 'HAN-DLI', name: 'Đà Lạt', price: { ECONOMY: 1200, BUSINESS: 3000 }, weight: 2, unlock: { cost: 5250, minTravelViet: null }, color: 0xbb6bd9, icon: 'dli' },
  { id: 'HAN-BKK', name: 'Bangkok', price: { ECONOMY: 2400, BUSINESS: 5500 }, weight: 2, unlock: { cost: 12000, minTravelViet: 3.5 }, color: 0xeb5757, icon: 'bkk' },
  { id: 'HAN-ICN', name: 'Seoul', price: { ECONOMY: 5600, BUSINESS: 20000 }, weight: 2, unlock: { cost: 18000, minTravelViet: 3.7 }, color: 0xf2c94c, icon: 'icn' },
  { id: 'HAN-NRT', name: 'Tokyo', price: { ECONOMY: 6500, BUSINESS: 24000 }, weight: 1, unlock: { cost: 24000, minTravelViet: 3.9 }, color: 0xff8fab, icon: 'nrt' },
  { id: 'HAN-CDG', name: 'Paris', price: { ECONOMY: 10000, BUSINESS: 32000 }, weight: 1, unlock: { cost: 37500, minTravelViet: 4.1 }, color: 0x9b51e0, icon: 'cdg' },
];

/** Giá vốn ghế = giá bán × (1 − biên lợi nhuận của tuyến), làm tròn 10 xu (docs/CAN_BANG_KINH_TE.md). */
const withSeatCostFromMargin = (routes: readonly RouteDef[]): readonly Route[] =>
  routes.map((route) => {
    const margin = SEAT_MARGIN_BY_ROUTE[route.id];
    invariant(margin !== undefined, `missing seat margin for ${route.id}`);
    const costOf = (fare: number): number => Math.round((fare * (1 - margin)) / 10) * 10;
    return { ...route, cost: { ECONOMY: costOf(route.price.ECONOMY), BUSINESS: costOf(route.price.BUSINESS) } };
  });

export const ROUTES: readonly Route[] = applyCustomRoutes(withSeatCostFromMargin(BASE_ROUTES), PERSONAL);
