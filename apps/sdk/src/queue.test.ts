import { beforeEach, describe as suite, expect, test, vi } from 'vitest';
import { drainQueue } from '@signpost/sdk/queue';
import type { Signpost } from '@signpost/sdk/types';

const signpost: Signpost = {
  ask: vi.fn(),
  run: vi.fn(),
  stop: vi.fn(),
  destroy: vi.fn(),
};

beforeEach(() => vi.clearAllMocks());

suite('drainQueue', () => {
  test('replays calls the host made before the script loaded', () => {
    drainQueue([['run', 'export my contacts'], ['stop'], ['ask']], signpost);
    expect(signpost.run).toHaveBeenCalledWith('export my contacts');
    expect(signpost.stop).toHaveBeenCalledTimes(1);
    expect(signpost.ask).toHaveBeenCalledTimes(1);
  });

  test('ignores an absent or non-array queue', () => {
    drainQueue(undefined, signpost);
    drainQueue({ run: 'export' }, signpost);
    expect(signpost.run).not.toHaveBeenCalled();
  });

  test('drops entries it does not recognise instead of throwing', () => {
    drainQueue([['fly'], 'ask', null, ['run'], ['run', 42], ['ask']], signpost);
    expect(signpost.run).not.toHaveBeenCalled();
    expect(signpost.ask).toHaveBeenCalledTimes(1);
  });
});
