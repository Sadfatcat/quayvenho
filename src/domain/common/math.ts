export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const sum = (values: readonly number[]): number =>
  values.reduce((total, value) => total + value, 0);

export const roundToTenth = (value: number): number => Math.round(value * 10) / 10;
