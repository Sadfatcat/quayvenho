const MAX_SEED = 0x7fffffff;

/** Seed cho ván mới (ảnh hưởng gameplay nên không dùng Math.random trong scene). Domain nhận seed qua tham số. */
export const createGameSeed = (): number => {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return (buffer[0] ?? 1) % MAX_SEED || 1;
};
