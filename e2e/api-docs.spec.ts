import { expect, test } from './support/test';

test('loads the mocked OpenAPI document and returns to Iris', async ({ page }) => {
  await page.route('https://openapi.test/openapi.yaml', (route) => route.fulfill({
    contentType: 'application/yaml',
    body: 'openapi: 3.0.3\ninfo:\n  title: Iris Test API\n  version: 1.0.0\npaths:\n  /health:\n    get:\n      responses:\n        "200":\n          description: healthy\n',
  }));
  await page.goto('/api-docs');
  await expect(page.getByRole('heading', { name: 'Interactive API documentation' })).toBeVisible();
  await expect(page.getByText('Iris Test API')).toBeVisible();
  await page.getByRole('link', { name: 'Back to Iris' }).click();
  await expect(page.getByRole('heading', { name: 'Market overview' })).toBeVisible();
});
