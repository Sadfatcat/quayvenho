import type { Order, Route, RouteId } from '@domain/models';

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

/** Thay tên hiển thị và gắn kỷ niệm cho tuyến có sẵn; `enabled = false` thì trả đúng danh sách gốc. */
export const applyCustomRoutes = (routes: readonly Route[], config: PersonalConfig): readonly Route[] => {
  if (!config.enabled) return routes;
  return routes.map((route) => {
    const custom = config.customRoutes.find((candidate) => candidate.replaceRouteId === route.id);
    return custom ? { ...route, name: custom.name, flavorText: custom.flavorText } : route;
  });
};
