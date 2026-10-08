import { expect, test } from '@playwright/test';
import { installWorkerMock, sol } from './support/workerMock';

test('renders asset intelligence and requests the selected candle timeframe', async ({ page }) => {
  const candleTimeframes: string[] = [];
  await installWorkerMock(page, (url) => candleTimeframes.push(url.searchParams.get('timeframe') || ''));

  await page.goto(`/asset/${sol.mint}`);

  await expect(page.getByRole('heading', { name: /Solana SOL/ })).toBeVisible();
  await expect(page.getByText('$150.25', { exact: true })).toBeVisible();
  await expect(page.getByText('$75B', { exact: true })).toBeVisible();
  await expect(page.getByText('12.5', { exact: true })).toBeVisible();

  await page.getByRole('tab', { name: 'Largest accounts' }).click();
  await expect(page.getByText('5000000')).toBeVisible();

  await page.getByRole('button', { name: '30m' }).click();
  await expect.poll(() => candleTimeframes).toContain('30m');
});
