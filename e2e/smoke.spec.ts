import { expect, test } from '@playwright/test';

const sol = {
  mint: 'So11111111111111111111111111111111111111112',
  symbol: 'SOL',
  name: 'Solana',
  priceUsd: 150.25,
  marketCapUsd: 75_000_000_000,
  change24hPct: 2.5,
  activity: { volume24hUsd: 1_250_000_000 },
  verification: { isVerified: true },
};

test('opens the dashboard and navigates to a catalog asset', async ({ page }) => {
  await page.route('https://iris.test/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    let data: unknown = {};

    if (pathname === '/v3/assets') data = { assets: [sol] };
    else if (pathname === '/v3/catalogs') data = { topTraded: [sol], trending: [], recent: [] };
    else if (pathname === '/v3/transactions/recent') data = { network: null, transactions: [] };
    else if (pathname === '/v3/defillama') data = {};
    else if (pathname === `/v3/assets/mint/${sol.mint}`) data = { asset: sol };
    else if (pathname.includes('/candles')) data = { candles: [] };
    else if (pathname.includes('/transactions') || pathname.includes('/distribution')) data = { transactions: [], accounts: [] };

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ data, meta: { source: 'test', requestId: 'e2e-request' } }),
    });
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Market overview' })).toBeVisible();
  await expect(page.getByRole('button', { name: /SOL/i }).first()).toBeVisible();

  await page.getByRole('button', { name: /SOL/i }).first().click();
  await expect(page).toHaveURL(`/asset/${sol.mint}`);
  await expect(page.getByRole('heading', { name: /Solana SOL/ })).toBeVisible();
});
