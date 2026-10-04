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
  market: (options) => withFixture('/v2/market', fixtures.market, options),
  assets: (options) => withFixture('/v2/assets', fixtures.assets, options),
  asset: (mint, options) => withFixture(`/v2/assets/mint/${encodeURIComponent(mint)}`, fixtures.assets.find((asset) => asset.mint === mint) || null, options),
  swaps: (options) => withFixture('/v2/swaps', fixtures.swaps, options),
  wallets: (options) => withFixture('/v2/wallets', fixtures.wallets, options),
  wallet: (address, options) => apiGet(`/v2/wallets/${encodeURIComponent(address)}`, options),
};
