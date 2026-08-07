import { beforeEach, describe as suite, expect, test, vi } from 'vitest';
import { drainQueue } from '@hintora/sdk/queue';
import type { Hintora } from '@hintora/sdk/types';

const hintora: Hintora = {
  ask: vi.fn(),
  run: vi.fn(),
  stop: vi.fn(),
  destroy: vi.fn(),
};

beforeEach(() => vi.clearAllMocks());

suite('drainQueue', () => {
  test('replays calls the host made before the script loaded', () => {
    drainQueue([['run', 'export my contacts'], ['stop'], ['ask']], hintora);
    expect(hintora.run).toHaveBeenCalledWith('export my contacts');
    expect(hintora.stop).toHaveBeenCalledTimes(1);
    expect(hintora.ask).toHaveBeenCalledTimes(1);
  });

  test('ignores an absent or non-array queue', () => {
    drainQueue(undefined, hintora);
    drainQueue({ run: 'export' }, hintora);
    expect(hintora.run).not.toHaveBeenCalled();
  });

  test('drops entries it does not recognise instead of throwing', () => {
    drainQueue([['fly'], 'ask', null, ['run'], ['run', 42], ['ask']], hintora);
    expect(hintora.run).not.toHaveBeenCalled();
    expect(hintora.ask).toHaveBeenCalledTimes(1);
  });
});
