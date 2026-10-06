import { apiGet } from './client';
import { fixtures } from '../data/fixtures';

const fixturesEnabled = import.meta.env.VITE_ENABLE_FIXTURES === 'true';

async function withFixture(path, fixture, options) {
  try {
    return await apiGet(path, options);
  } catch (error) {
    if (!fixturesEnabled) throw error;
    return {
      data: fixture,
      error,
      meta: { source: 'fixture', stale: true, requestId: error.requestId },
    };
  }
}

export const workerApi = {
  assets: (options) => withFixture('/v3/assets', fixtures.assets, options),
  catalogs: (options) => withFixture('/v3/catalogs', { topTraded: fixtures.assets, trending: [], recent: [] }, options),
  asset: (mint, options) => withFixture(`/v3/assets/mint/${encodeURIComponent(mint)}?includeHistory=false`, fixtures.assets.find((asset) => asset.mint === mint) || null, options),
  assetHistory: (mint, range = '7d', options) => withFixture(`/v3/assets/mint/${encodeURIComponent(mint)}/history?range=${range}`, [], options),
  assetCandles: (mint, range = '7d', options) => withFixture(`/v3/assets/mint/${encodeURIComponent(mint)}/candles?range=${range}`, { candles: [] }, options),
  swaps: (options) => withFixture('/v3/swaps', fixtures.swaps, options),
  network: (options) => withFixture('/v3/network', null, options),
  defillama: (options) => apiGet('/v3/defillama', options),
  recentTransactions: (options = {}) => {
    const { limit = 15, ...requestOptions } = options;
    return apiGet(`/v3/transactions/recent?limit=${limit}`, requestOptions);
  },
  wallet: (address, options) => apiGet(`/v3/wallets/${encodeURIComponent(address)}`, options),
  walletTransactions: (address, options = {}) => {
    const { cursor, limit = 25, ...requestOptions } = options;
    const query = new URLSearchParams({ limit: String(limit) });
    if (cursor) query.set('cursor', cursor);
    return apiGet(`/v3/wallets/${encodeURIComponent(address)}/transactions?${query}`, requestOptions);
  },
};
