import { describe, expect, it } from 'vitest';
import { watchTabLock } from './tabLock';

const flush = () => new Promise((resolve) => setTimeout(resolve, 400));

describe('watchTabLock', () => {
  it('tab đầu tiên không bị coi là tab thứ hai', async () => {
    const first = watchTabLock({
      onSecondTabDetected: () => {
        throw new Error('không nên gọi');
      },
      onTakenOver: () => {
        throw new Error('không nên gọi');
      },
    });

    await flush();

    first.release();
  });

  it('tab mở sau bị phát hiện là tab thứ hai', async () => {
    let secondTabDetected = false;
    const first = watchTabLock({ onSecondTabDetected: () => {}, onTakenOver: () => {} });
    await flush();

    const second = watchTabLock({
      onSecondTabDetected: () => {
        secondTabDetected = true;
      },
      onTakenOver: () => {},
    });
    await flush();

    expect(secondTabDetected).toBe(true);

    first.release();
    second.release();
  });

  it('requestTakeover khiến tab cũ nhận onTakenOver', async () => {
    let takenOver = false;
    const first = watchTabLock({ onSecondTabDetected: () => {}, onTakenOver: () => { takenOver = true; } });
    await flush();

    const second = watchTabLock({ onSecondTabDetected: () => {}, onTakenOver: () => {} });
    await flush();

    second.requestTakeover();
    await flush();

    expect(takenOver).toBe(true);

    first.release();
    second.release();
  });
});
