import { STRINGS } from '@data/strings';
import type { Order } from '@domain/models';
import { getRoute } from '@domain/routes';

/** Lấy mẫu câu mở đầu theo mã khách để mỗi khách luôn nói cùng một câu (không dùng random). */
const openingIndexOf = (customerId: string, count: number): number =>
  [...customerId].reduce((hash, char) => (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0, 7) % count;

const joinNatural = (parts: readonly string[]): string => {
  const speech = STRINGS.counter.speech;
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} ${speech.and} ${parts[parts.length - 1]}`;
};

/**
 * Yêu cầu của khách thành một câu nói tự nhiên: luôn nói đi đâu và hạng vé gì; giờ bay, chỗ ngồi, hành lý
 * và dịch vụ thêm chỉ được nhắc khi khách thật sự cần (không nhắc "không yêu cầu").
 */
export const orderSpeech = (order: Order): string => {
  const speech = STRINGS.counter.speech;
  const opening = speech.openings[openingIndexOf(order.customerId, speech.openings.length)] ?? speech.openings[0] ?? '';
  const sentence = opening.replace('{dest}', getRoute(order.routeId).name).replace('{cabin}', speech.cabin[order.cabin]);
  const wishes: string[] = [];
  if (order.timePref !== 'ANY') wishes.push(speech.time[order.timePref]);
  if (order.seatPref !== 'ANY') wishes.push(speech.seat[order.seatPref]);
  if (order.baggageKg > 0) wishes.push(speech.baggage.replace('{kg}', String(order.baggageKg)));
  if (order.extras.length > 0) wishes.push(`${speech.extrasPrefix} ${joinNatural(order.extras.map((extra) => speech.extras[extra]))}`);
  return wishes.length === 0 ? `${sentence}.` : `${sentence}, ${joinNatural(wishes)}.`;
};
