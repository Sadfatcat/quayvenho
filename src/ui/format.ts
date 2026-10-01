const THOUSANDS_SEPARATOR = '.';
const MONEY_SUFFIX = 'k';

/** Tiền trong game tính bằng "k" (nghìn đồng), số nguyên: 1100 → "1.100k", -250 → "−250k". */
export const formatMoney = (amount: number): string => {
  const rounded = Math.round(amount);
  const digits = String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, THOUSANDS_SEPARATOR);
  return `${rounded < 0 ? '−' : ''}${digits}${MONEY_SUFFIX}`;
};
