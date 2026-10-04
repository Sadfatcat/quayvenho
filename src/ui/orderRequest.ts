import { STRINGS } from '@data/strings';
import type { Order } from '@domain/models';
import { getRoute } from '@domain/routes';

export interface RequestLine {
  label: string;
  value: string;
  /** Dòng khách đòi hỏi thật sự (khác "không yêu cầu"): được tô nổi bật trong khung yêu cầu. */
  demanding: boolean;
}

/** Yêu cầu của khách thành các dòng rõ ràng: đi đâu, hạng nào, giờ nào, ngồi đâu, hành lý, dịch vụ thêm. */
export const orderRequestLines = (order: Order): RequestLine[] => {
  const text = STRINGS.counter.request;
  const extras = order.extras.map((extra) => text.extras[extra]).join(', ');
  return [
    { label: text.labels.destination, value: getRoute(order.routeId).name, demanding: true },
    { label: text.labels.cabin, value: STRINGS.counter.cabin[order.cabin], demanding: true },
    { label: text.labels.time, value: text.time[order.timePref], demanding: order.timePref !== 'ANY' },
    { label: text.labels.seat, value: text.seat[order.seatPref], demanding: order.seatPref !== 'ANY' },
    { label: text.labels.baggage, value: order.baggageKg > 0 ? text.baggage.replace('{kg}', String(order.baggageKg)) : text.noBaggage, demanding: order.baggageKg > 0 },
    { label: text.labels.extras, value: extras || text.noExtras, demanding: order.extras.length > 0 },
  ];
};
