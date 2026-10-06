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

    await expect(workerApi.assets()).rejects.toMatchObject({ code: 'HTTP_ERROR', status: 503 });
  });

  test('uses emergency fixtures only when explicitly enabled', async () => {
    vi.stubEnv('VITE_ENABLE_FIXTURES', 'true');
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 503, json: () => Promise.resolve({}) })));
    const { workerApi } = await import('./worker');

    await expect(workerApi.assets()).resolves.toMatchObject({ data: expect.any(Array), meta: { source: 'fixture', stale: true } });
  });

  test('uses v3 asset, candle, DefiLlama, global swaps, recent transactions, and canonical wallet transaction routes', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ data: {} }) })));
    const { workerApi } = await import('./worker');

    await workerApi.asset('MintCaseSensitive123');
    await workerApi.assetHistory('MintCaseSensitive123', '1d');
    await workerApi.assetCandles('MintCaseSensitive123', '4h');
    await workerApi.assetCandles('MintCaseSensitive123', '4h', undefined, 1760000000);
    await workerApi.swaps();
    await workerApi.defillama();
    await workerApi.recentTransactions();
    await workerApi.wallet('WalletCaseSensitive123');
    await workerApi.walletTransactions('WalletCaseSensitive123', { cursor: 'next-page' });

    expect(fetch).toHaveBeenNthCalledWith(1, expect.stringContaining('/v3/assets/mint/MintCaseSensitive123'), expect.any(Object));
    expect(fetch).toHaveBeenNthCalledWith(1, expect.stringContaining('?includeHistory=false'), expect.any(Object));
    expect(fetch).toHaveBeenNthCalledWith(2, expect.stringContaining('/v3/assets/mint/MintCaseSensitive123/history?range=1d'), expect.any(Object));
    expect(fetch).toHaveBeenNthCalledWith(3, expect.stringContaining('/v3/assets/mint/MintCaseSensitive123/candles?range=4h'), expect.any(Object));
    expect(fetch).toHaveBeenNthCalledWith(4, expect.stringContaining('before=1760000000'), expect.any(Object));
    expect(fetch).toHaveBeenNthCalledWith(5, expect.stringContaining('/v3/swaps'), expect.any(Object));
    expect(fetch).toHaveBeenNthCalledWith(6, expect.stringContaining('/v3/defillama'), expect.any(Object));
    expect(fetch).toHaveBeenNthCalledWith(7, expect.stringContaining('/v3/transactions/recent?limit=15'), expect.any(Object));
    expect(fetch).toHaveBeenNthCalledWith(8, expect.stringContaining('/v3/wallets/WalletCaseSensitive123'), expect.any(Object));
    expect(fetch).toHaveBeenNthCalledWith(9, expect.stringContaining('/v3/wallets/WalletCaseSensitive123/transactions?'), expect.any(Object));
    expect(fetch).toHaveBeenNthCalledWith(9, expect.stringContaining('cursor=next-page'), expect.any(Object));
  });
});
