import { STRINGS } from '@data/strings';
import type { Order } from '@domain/models';
import { getRoute } from '@domain/routes';

/** Câu nói tự nhiên của khách: "Cho mình vé đi Đà Nẵng, hạng thương gia, mang theo 20kg hành lý, ngồi cạnh cửa sổ." */
export const formatOrderRequest = (order: Order): string => {
  const text = STRINGS.counter.request;
  const parts = [text.intro.replace('{route}', getRoute(order.routeId).name)];
  if (order.cabin === 'BUSINESS') parts.push(text.business);
  if (order.baggageKg > 0) parts.push(text.baggage.replace('{kg}', String(order.baggageKg)));
  parts.push(text.seat[order.seatPref], text.time[order.timePref]);
  if (order.extras.length > 0) {
    parts.push(text.extrasIntro.replace('{list}', order.extras.map((extra) => text.extras[extra]).join(', ')));
  }
  parts.push(text.end);
  return parts.join('');
};
