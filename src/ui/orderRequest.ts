import { STRINGS } from '@data/strings';
import type { Order } from '@domain/models';
import { getRoute } from '@domain/routes';

/** Một đoạn trong lời khách nói; `key` = đoạn là yêu cầu thật sự (đi đâu, hạng gì, giờ, ghế, hành lý, dịch vụ), còn lại chỉ là lời đưa đẩy. */
export interface SpeechSegment {
  text: string;
  key: boolean;
}

/** Lấy mẫu câu mở đầu theo mã khách để mỗi khách luôn nói cùng một câu (không dùng random). */
const openingIndexOf = (customerId: string, count: number): number =>
  [...customerId].reduce((hash, char) => (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0, 7) % count;

const filler = (text: string): SpeechSegment => ({ text, key: false });
const keyed = (text: string): SpeechSegment => ({ text, key: true });

/** Nối các nhóm bằng dấu phẩy, riêng nhóm cuối nối bằng chữ "và". */
const joinGroups = (groups: readonly (readonly SpeechSegment[])[]): SpeechSegment[] =>
  groups.flatMap((group, index) => {
    if (index === 0) return [...group];
    const separator = index === groups.length - 1 ? ` ${STRINGS.counter.speech.and} ` : ', ';
    return [filler(separator), ...group];
  });

/** Mẫu câu mở đầu có {cabin} và {dest}: hai chỗ này là yêu cầu, phần còn lại là lời đưa đẩy. */
const openingSegments = (template: string, destination: string, cabin: string): SpeechSegment[] =>
  template
    .split(/(\{dest\}|\{cabin\})/)
    .filter((piece) => piece !== '')
    .map((piece) => (piece === '{dest}' ? keyed(destination) : piece === '{cabin}' ? keyed(cabin) : filler(piece)));

/**
 * Yêu cầu của khách thành một câu nói tự nhiên, chia đoạn để giao diện tô đậm yêu cầu và làm mờ lời đưa đẩy:
 * luôn nói đi đâu và hạng vé gì; giờ bay, chỗ ngồi, hành lý và dịch vụ thêm chỉ được nhắc khi khách thật sự cần.
 */
export const orderSpeechSegments = (order: Order): SpeechSegment[] => {
  const speech = STRINGS.counter.speech;
  const template = speech.openings[openingIndexOf(order.customerId, speech.openings.length)] ?? speech.openings[0] ?? '';
  const opening = openingSegments(template, getRoute(order.routeId).name, speech.cabin[order.cabin]);
  const wishes: SpeechSegment[][] = [];
  if (order.timePref !== 'ANY') wishes.push([keyed(speech.time[order.timePref])]);
  if (order.seatPref !== 'ANY') wishes.push([keyed(speech.seat[order.seatPref])]);
  if (order.baggageKg > 0) wishes.push([keyed(speech.baggage.replace('{kg}', String(order.baggageKg)))]);
  if (order.extras.length > 0) {
    const extras = joinGroups(order.extras.map((extra) => [keyed(speech.extras[extra])]));
    wishes.push([filler(`${speech.extrasPrefix} `), ...extras]);
  }
  return [...opening, ...(wishes.length === 0 ? [] : [filler(', '), ...joinGroups(wishes)]), filler('.')];
};

/** Cả câu dưới dạng một chuỗi (dùng cho test và nơi không cần định dạng). */
export const orderSpeech = (order: Order): string => orderSpeechSegments(order).map((segment) => segment.text).join('');
