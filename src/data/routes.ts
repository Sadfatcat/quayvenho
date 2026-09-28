import type { Route } from '@domain/models';

export const ROUTES: readonly Route[] = [
  { id: 'HAN-SGN', name: 'TP. Hồ Chí Minh', cost: { ECONOMY: 70, BUSINESS: 180 }, price: { ECONOMY: 100, BUSINESS: 260 }, weight: 3, unlock: null, color: 0xf2994a, icon: 'sgn' },
  { id: 'HAN-DAD', name: 'Đà Nẵng', cost: { ECONOMY: 50, BUSINESS: 130 }, price: { ECONOMY: 75, BUSINESS: 190 }, weight: 3, unlock: null, color: 0x56ccf2, icon: 'dad' },
  { id: 'HAN-CXR', name: 'Nha Trang', cost: { ECONOMY: 60, BUSINESS: 150 }, price: { ECONOMY: 90, BUSINESS: 220 }, weight: 2, unlock: { cost: 250, minTravelViet: null }, color: 0x6fcf97, icon: 'cxr' },
  { id: 'HAN-PQC', name: 'Phú Quốc', cost: { ECONOMY: 85, BUSINESS: 210 }, price: { ECONOMY: 125, BUSINESS: 300 }, weight: 2, unlock: { cost: 350, minTravelViet: null }, color: 0x2d9cdb, icon: 'pqc' },
  { id: 'HAN-DLI', name: 'Đà Lạt', cost: { ECONOMY: 65, BUSINESS: 160 }, price: { ECONOMY: 95, BUSINESS: 235 }, weight: 2, unlock: { cost: 350, minTravelViet: null }, color: 0xbb6bd9, icon: 'dli' },
  { id: 'HAN-BKK', name: 'Bangkok', cost: { ECONOMY: 120, BUSINESS: 300 }, price: { ECONOMY: 175, BUSINESS: 430 }, weight: 2, unlock: { cost: 800, minTravelViet: 3.8 }, color: 0xeb5757, icon: 'bkk' },
  { id: 'HAN-ICN', name: 'Seoul', cost: { ECONOMY: 160, BUSINESS: 400 }, price: { ECONOMY: 235, BUSINESS: 580 }, weight: 2, unlock: { cost: 1200, minTravelViet: 4.0 }, color: 0xf2c94c, icon: 'icn' },
  { id: 'HAN-NRT', name: 'Tokyo', cost: { ECONOMY: 190, BUSINESS: 470 }, price: { ECONOMY: 280, BUSINESS: 690 }, weight: 1, unlock: { cost: 1600, minTravelViet: 4.2 }, color: 0xff8fab, icon: 'nrt' },
  { id: 'HAN-CDG', name: 'Paris', cost: { ECONOMY: 320, BUSINESS: 800 }, price: { ECONOMY: 470, BUSINESS: 1180 }, weight: 1, unlock: { cost: 2500, minTravelViet: 4.5 }, color: 0x9b51e0, icon: 'cdg' },
];
