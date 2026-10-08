import type { Page } from '@playwright/test';

export const sol = {
  mint: 'So11111111111111111111111111111111111111112',
  symbol: 'SOL',
  name: 'Solana',
  priceUsd: 150.25,
  marketCapUsd: 75_000_000_000,
  change24hPct: 2.5,
  activity: { volume24hUsd: 1_250_000_000 },
  verification: { isVerified: true },
};

export async function installWorkerMock(page: Page, onCandleRequest?: (url: URL) => void) {
  await page.route('https://iris.test/**', async (route) => {
    const url = new URL(route.request().url());
    const { pathname } = url;
    let data: unknown = {};

    if (pathname === '/v3/assets') data = { assets: [sol] };
    else if (pathname === '/v3/catalogs') data = { topTraded: [sol], trending: [], recent: [] };
    else if (pathname === '/v3/transactions/recent') data = { network: null, transactions: [] };
    else if (pathname === '/v3/defillama') data = {};
    else if (pathname === `/v3/assets/mint/${sol.mint}`) data = { asset: sol };
    else if (pathname.endsWith('/candles')) {
      onCandleRequest?.(url);
      data = { candles: [{ timestamp: '2026-10-08T10:00:00.000Z', openUsd: 149, highUsd: 152, lowUsd: 148, closeUsd: 150.25, volumeUsd: 250_000 }] };
    } else if (pathname.endsWith('/transactions')) {
      data = { transactions: [{ signature: '5N6n8Xq2w4cP1V3s9Yk7mR2tB6dF8gH1jK4L5M6N7P8Q', timestamp: '2026-10-08T10:00:00.000Z', action: 'TRANSFER', transfers: [{ amount: '12.5', from: null, to: '7Yk4L5M6N7P8Q9R2tB6dF8gH1jK4L5M6N7P8Q9R2tB6d' }] }] };
    } else if (pathname.endsWith('/distribution')) {
      data = { accounts: [{ rank: 1, tokenAccount: '8qbHbw2BbbTHBW1sBXgze1XNp82btd5Jpi1LjYp5Vh7e', owner: '7Yk4L5M6N7P8Q9R2tB6dF8gH1jK4L5M6N7P8Q9R2tB6d', amount: '5000000', supplyPercent: '1.25', frozen: false }] };
    }

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ data, meta: { source: 'test', requestId: 'e2e-request' } }),
    });
  });
}
