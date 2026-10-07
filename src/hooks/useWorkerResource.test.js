import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useWorkerResource } from './useWorkerResource';

let hidden = false;

beforeEach(() => {
  vi.useFakeTimers();
  hidden = false;
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
});

afterEach(() => {
  vi.useRealTimers();
});

test('pauses polling while hidden and refreshes once when visible', async () => {
  const load = vi.fn().mockResolvedValue({ data: { value: 1 }, meta: null });
  const { unmount } = renderHook(() => useWorkerResource(load, [], 60_000));

  await act(async () => {});
  expect(load).toHaveBeenCalledTimes(1);

  await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
  expect(load).toHaveBeenCalledTimes(2);

  hidden = true;
  await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
  await act(async () => { await vi.advanceTimersByTimeAsync(120_000); });
  expect(load).toHaveBeenCalledTimes(2);

  hidden = false;
  await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
  expect(load).toHaveBeenCalledTimes(3);

  unmount();
  await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
  expect(load).toHaveBeenCalledTimes(3);
});
