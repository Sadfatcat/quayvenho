import { describe, expect, it } from 'vitest';
import { watchTabLock } from './tabLock';

const flush = () => new Promise((resolve) => setTimeout(resolve, 100));

describe('watchTabLock', () => {
  it('tab đầu tiên không bị coi là tab thứ hai', async () => {
    const onSecondTab = () => {
      throw new Error('không nên gọi');
    };
    const tab = watchTabLock(onSecondTab);

    await flush();

    tab.release();
  });

  it('tab mở sau bị phát hiện là tab thứ hai', async () => {
    let secondTabDetected = false;
    const first = watchTabLock(() => {});
    await flush();

    const second = watchTabLock(() => {
      secondTabDetected = true;
    });
    await flush();

    expect(secondTabDetected).toBe(true);

    first.release();
    second.release();
  });

  it('release() ngừng nhận thông báo', async () => {
    let calls = 0;
    const first = watchTabLock(() => {});
    await flush();
    first.release();

    const second = watchTabLock(() => {
      calls += 1;
    });
    await flush();

    expect(calls).toBe(0);
    second.release();
  });
});
