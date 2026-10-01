import type { Order, RouteId } from '@domain/models';

/**
 * Nội dung cá nhân hoá (PLAN §16). Chủ dự án tự điền; `enabled = false` thì game chạy đúng như không có tính năng này.
 * Không điền sẵn nội dung cá nhân nào ở đây.
 */
export interface SpecialCustomer {
  id: string;
  /** Tên trên hộ chiếu. */
  displayName: string;
  spriteId: string;
  day: number;
  /** Khách thứ mấy trong ngày (0-based); lớn hơn số khách của ngày thì thành khách cuối cùng. */
  atCustomerIndex: number;
  order: Partial<Order>;
  lines: { arrive: string; success: string; fail: string };
  /** Nhân tip, áp dụng cả khi khách ECONOMY (vd 3). */
  tipMultiplier: number;
  /** Key audio riêng (chưa dùng). */
  music?: string;
}

export interface ScriptedMoment {
  id: string;
  day: number;
  at: 'PREP' | 'OPEN' | 'SUMMARY';
  /** Béo nói. */
  lines: string[];
}

export interface CustomRoute {
  /** Thay tên hiển thị/mô tả của tuyến có sẵn. */
  replaceRouteId: RouteId;
  name: string;
  /** Kỷ niệm, hiện khi chạm vào tuyến. */
  flavorText: string;
}

export interface PersonalConfig {
  enabled: boolean;
  specialCustomers: SpecialCustomer[];
  scriptedMoments: ScriptedMoment[];
  customRoutes: CustomRoute[];
}

export const PERSONAL: PersonalConfig = {
  enabled: false,
  specialCustomers: [],
  scriptedMoments: [],
  customRoutes: [],
};
