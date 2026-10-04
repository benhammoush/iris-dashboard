import { afterEach, describe, expect, test, vi } from 'vitest';

describe('worker fixture behavior', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  test('surfaces Worker HTTP errors when fixtures are not enabled', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 503, json: () => Promise.resolve({ error: { message: 'Unavailable' } }) })));
    const { workerApi } = await import('./worker');

    await expect(workerApi.market()).rejects.toMatchObject({ code: 'HTTP_ERROR', status: 503 });
  });

  test('uses emergency fixtures only when explicitly enabled', async () => {
    vi.stubEnv('VITE_ENABLE_FIXTURES', 'true');
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 503, json: () => Promise.resolve({}) })));
    const { workerApi } = await import('./worker');

    await expect(workerApi.assets()).resolves.toMatchObject({ data: expect.any(Array), meta: { source: 'fixture', stale: true } });
  });

  test('uses mint-addressed v2 Worker routes', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ data: {} }) })));
    const { workerApi } = await import('./worker');

    await workerApi.asset('MintCaseSensitive123');
    await workerApi.wallet('WalletCaseSensitive123');

    expect(fetch).toHaveBeenNthCalledWith(1, expect.stringContaining('/v2/assets/mint/MintCaseSensitive123'), expect.any(Object));
    expect(fetch).toHaveBeenNthCalledWith(2, expect.stringContaining('/v2/wallets/WalletCaseSensitive123'), expect.any(Object));
  });
});
