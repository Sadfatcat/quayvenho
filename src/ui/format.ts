const THOUSANDS_SEPARATOR = '.';
const DECIMAL_SEPARATOR = ',';
const THOUSAND_SUFFIX = 'k';
const MILLION_SUFFIX = 'tr';
/** Từ mức này (1.000k = 1 triệu) trở lên số tiền được đổi sang đơn vị "tr". */
const MILLION_FROM_K = 1000;
const HUNDREDTHS_PER_MILLION = 100;
const K_PER_HUNDREDTH_MILLION = MILLION_FROM_K / HUNDREDTHS_PER_MILLION;

const groupThousands = (value: number): string => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, THOUSANDS_SEPARATOR);

const formatMillions = (absoluteK: number): string => {
  const hundredths = Math.round(absoluteK / K_PER_HUNDREDTH_MILLION);
  const whole = Math.floor(hundredths / HUNDREDTHS_PER_MILLION);
  const fraction = hundredths % HUNDREDTHS_PER_MILLION;
  const fractionText = fraction === 0 ? '' : `${DECIMAL_SEPARATOR}${String(fraction).padStart(2, '0').replace(/0$/, '')}`;
  return `${groupThousands(whole)}${fractionText}${MILLION_SUFFIX}`;
};

/**
 * Tiền trong game tính bằng "k" (nghìn đồng), số nguyên. Dưới 1.000k giữ "k": 730 → "730k", −250 → "−250k".
 * Từ 1.000k đổi sang triệu, tối đa 2 chữ số thập phân: 1000 → "1tr", 1408 → "1,41tr", 73425 → "73,43tr".
 */
export const formatMoney = (amount: number): string => {
  const rounded = Math.round(amount);
  const absolute = Math.abs(rounded);
  const sign = rounded < 0 ? '−' : '';
  if (absolute >= MILLION_FROM_K) return `${sign}${formatMillions(absolute)}`;
  return `${sign}${groupThousands(absolute)}${THOUSAND_SUFFIX}`;
};
