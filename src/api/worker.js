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
  market: (options) => withFixture('/v1/market', fixtures.market, options),
  assets: (options) => withFixture('/v1/assets', fixtures.assets, options),
  asset: (symbol, options) =>
    withFixture(
      `/v1/assets/${encodeURIComponent(symbol)}`,
      fixtures.assets.find((asset) => asset.symbol === symbol) || null,
      options,
    ),
  swaps: (options) => withFixture('/v1/swaps', fixtures.swaps, options),
  wallets: (options) => withFixture('/v1/wallets', fixtures.wallets, options),
  wallet: (address, options) => apiGet(`/v1/wallets/${encodeURIComponent(address)}`, options),
};
