import { HOMETOWNS, PASSPORT_AGE_RANGE, PASSPORT_REFERENCE_YEAR } from '@data/customers';
import type { Order } from '@domain/models';

export interface PassportProfile {
  /** dd/mm/yyyy */
  birthDate: string;
  hometown: string;
}

const MAX_BIRTH_DAY = 28;
const MONTHS_PER_YEAR = 12;

const hashOf = (text: string): number => [...text].reduce((hash, char) => (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0, 7);
const pad2 = (value: number): string => String(value).padStart(2, '0');

/** Chỉ tên gọi (chữ cuối của họ tên): ngoài quầy khách chỉ hiện một chữ, đầy đủ nằm ở hộ chiếu. */
export const shortNameOf = (fullName: string): string => fullName.trim().split(/\s+/).pop() ?? fullName;

/** Ngày sinh và quê quán chỉ để trang trí: suy ra từ mã khách nên cùng một khách luôn ra cùng một hộ chiếu, không đụng đến save hay random của game. */
export const passportProfileOf = (order: Pick<Order, 'customerId'>): PassportProfile => {
  const hash = hashOf(order.customerId);
  const ageSpan = PASSPORT_AGE_RANGE.max - PASSPORT_AGE_RANGE.min + 1;
  const age = PASSPORT_AGE_RANGE.min + (hash % ageSpan);
  const month = 1 + (Math.floor(hash / ageSpan) % MONTHS_PER_YEAR);
  const day = 1 + (Math.floor(hash / (ageSpan * MONTHS_PER_YEAR)) % MAX_BIRTH_DAY);
  const hometown = HOMETOWNS[Math.floor(hash / 7) % HOMETOWNS.length] ?? HOMETOWNS[0] ?? '';
  return { birthDate: `${pad2(day)}/${pad2(month)}/${PASSPORT_REFERENCE_YEAR - age}`, hometown };
};
