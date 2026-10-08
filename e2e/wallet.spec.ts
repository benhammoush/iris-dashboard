import { expect, test } from './support/test';
import { walletAddress } from './support/workerMock';

test('renders a wallet, retains unpriced holdings, and appends cursor pages', async ({ page, api }) => {
  await page.goto(`/wallet/${walletAddress}`);
  await expect(page.getByRole('heading', { name: 'Treasury Wallet' })).toBeVisible();
  await expect(page.getByText('$1,234.56', { exact: true })).toBeVisible();
  await expect(page.getByText('Unpriced', { exact: true })).toBeVisible();
  await expect(page.getByText('42500000000 atomic units (decimals: 9)')).toBeVisible();
  await expect(page.getByText(/displayed holdings are incomplete/i)).toBeVisible();

  await page.getByRole('button', { name: 'Load more' }).click();
  await expect(page.getByText('1000000000 atomic units (decimals: 9)')).toBeVisible();
  await expect.poll(() => api.requests.some((url) => url.pathname.endsWith('/transactions') && url.searchParams.get('cursor') === 'next-page')).toBe(true);
});

test('retries an unavailable initial wallet activity request', async ({ page, api }) => {
  let failed = false;
  api.setHandler((url) => {
    if (url.pathname === `/v3/wallets/${walletAddress}/transactions` && !url.searchParams.has('cursor') && !failed) {
      failed = true;
      return { error: { code: 'UPSTREAM_UNAVAILABLE', message: 'Helius unavailable' } };
    }
    return undefined;
  });

  await page.goto(`/wallet/${walletAddress}`);
  await expect(page.getByText('Helius transaction history is unavailable.')).toBeVisible();
  await page.getByRole('button', { name: 'Retry activity' }).click();
  await expect(page.getByText('42500000000 atomic units (decimals: 9)')).toBeVisible();
});
