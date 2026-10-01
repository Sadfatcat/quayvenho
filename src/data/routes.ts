import type { Route } from '@domain/models';
import { applyCustomRoutes, PERSONAL } from './personal';

const BASE_ROUTES: readonly Route[] = [
  { id: 'HAN-SGN', name: 'TP. Hồ Chí Minh', cost: { ECONOMY: 1050, BUSINESS: 2700 }, price: { ECONOMY: 1500, BUSINESS: 3900 }, weight: 3, unlock: null, color: 0xf2994a, icon: 'sgn' },
  { id: 'HAN-DAD', name: 'Đà Nẵng', cost: { ECONOMY: 730, BUSINESS: 1850 }, price: { ECONOMY: 1100, BUSINESS: 2700 }, weight: 3, unlock: null, color: 0x56ccf2, icon: 'dad' },
  { id: 'HAN-CXR', name: 'Nha Trang', cost: { ECONOMY: 870, BUSINESS: 2450 }, price: { ECONOMY: 1300, BUSINESS: 3600 }, weight: 2, unlock: { cost: 3750, minTravelViet: null }, color: 0x6fcf97, icon: 'cxr' },
  { id: 'HAN-PQC', name: 'Phú Quốc', cost: { ECONOMY: 1290, BUSINESS: 3010 }, price: { ECONOMY: 1900, BUSINESS: 4300 }, weight: 2, unlock: { cost: 5250, minTravelViet: null }, color: 0x2d9cdb, icon: 'pqc' },
  { id: 'HAN-DLI', name: 'Đà Lạt', cost: { ECONOMY: 820, BUSINESS: 2040 }, price: { ECONOMY: 1200, BUSINESS: 3000 }, weight: 2, unlock: { cost: 5250, minTravelViet: null }, color: 0xbb6bd9, icon: 'dli' },
  { id: 'HAN-BKK', name: 'Bangkok', cost: { ECONOMY: 1650, BUSINESS: 3840 }, price: { ECONOMY: 2400, BUSINESS: 5500 }, weight: 2, unlock: { cost: 12000, minTravelViet: 3.8 }, color: 0xeb5757, icon: 'bkk' },
  { id: 'HAN-ICN', name: 'Seoul', cost: { ECONOMY: 3810, BUSINESS: 13790 }, price: { ECONOMY: 5600, BUSINESS: 20000 }, weight: 2, unlock: { cost: 18000, minTravelViet: 4.0 }, color: 0xf2c94c, icon: 'icn' },
  { id: 'HAN-NRT', name: 'Tokyo', cost: { ECONOMY: 4410, BUSINESS: 16350 }, price: { ECONOMY: 6500, BUSINESS: 24000 }, weight: 1, unlock: { cost: 24000, minTravelViet: 4.2 }, color: 0xff8fab, icon: 'nrt' },
  { id: 'HAN-CDG', name: 'Paris', cost: { ECONOMY: 8170, BUSINESS: 47460 }, price: { ECONOMY: 12000, BUSINESS: 70000 }, weight: 1, unlock: { cost: 37500, minTravelViet: 4.5 }, color: 0x9b51e0, icon: 'cdg' },
];

export const ROUTES: readonly Route[] = applyCustomRoutes(BASE_ROUTES, PERSONAL);
