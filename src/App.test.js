import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

const catalogFixture = {
  topTraded: [{ mint: 'So11111111111111111111111111111111111111112', symbol: 'SOL', name: 'Solana', priceUsd: 1, activity: { volume24hUsd: 250000 } }],
  trending: [{ mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', symbol: 'JUP', name: 'Jupiter', priceUsd: 1, change24hPct: 3.5, activity: { volume24hUsd: 12345 }, verification: { isVerified: false } }],
  recent: [{ mint: 'NewPool111111111111111111111111111111111111', symbol: 'NEW', name: 'New pool', priceUsd: 0.1, change24hPct: -1.25, activity: { volume24hUsd: 10000 } }],
};

beforeEach(() => {
  window.history.pushState({}, '', '/');
  global.fetch = vi.fn((url) => {
    const data = url.includes('/history') ? { data: { history: [] } } : url.includes('/v3/swaps') ? { data: { swaps: [{ signature: 'pool-swap-1', timestamp: '2026-10-03T12:00:00Z', type: 'Swap', maker: 'ReviewedPoolWallet' }] } } : url.includes('/v3/catalogs') ? { data: catalogFixture } : url.includes('/v3/assets/mint/JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN') ? { data: { mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', symbol: 'JUP', name: 'Jupiter', priceUsd: 1 } } : url.includes('/v3/assets/mint/') ? { data: { mint: 'So11111111111111111111111111111111111111112', symbol: 'SOL', name: 'Solana', priceUsd: 1, change24hPct: 3.5, marketCapUsd: 100, liquidityUsd: 50, activity: { volume24hUsd: 25 } } } : url.includes('/v3/assets') ? { data: [{ mint: 'So11111111111111111111111111111111111111112', symbol: 'SOL', name: 'Solana', priceUsd: 1 }, { mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', symbol: 'JUP', name: 'Jupiter', priceUsd: 1 }] } : { data: [] };
    return Promise.resolve({ ok: true, json: () => Promise.resolve(data) });
  });
});

test('renders the Worker-backed portfolio shell', async () => {
  const { unmount } = render(<BrowserRouter><App /></BrowserRouter>);
  expect(await screen.findByPlaceholderText(/search assets or paste a wallet address/i)).toBeInTheDocument();
  await waitFor(() => expect(screen.getByText(/no price history is available/i)).toBeInTheDocument());
  expect(screen.getByText(/global reviewed-pool activity/i)).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Jupiter DEX' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Top Volume' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Trending' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'New tokens' })).toBeInTheDocument();
  expect(screen.getByText('Volume $12,345')).toBeInTheDocument();
  expect(screen.getByText('Unverified')).toBeInTheDocument();
  expect(screen.queryByText('Tracked assets')).not.toBeInTheDocument();
  expect(screen.queryByText('Assets priced')).not.toBeInTheDocument();
  expect(screen.queryByText('Highest 24H volume')).not.toBeInTheDocument();
  expect(screen.getByText(/no price history is available for the 1D range/i)).toBeInTheDocument();
  expect(screen.getByText('24H volume')).toBeInTheDocument();
  expect(fetch.mock.calls.some(([url]) => String(url).includes('/v3/wallets'))).toBe(false);
  unmount();
});

test('Jupiter discovery rows use the styled list structure and open canonical asset detail', async () => {
  const { container } = render(<BrowserRouter><App /></BrowserRouter>);
  await screen.findByText('JUP');
  expect(container.querySelector('.iris-jupiter-mark')).toBeInTheDocument();
  expect(container.querySelectorAll('.iris-catalog-list')).toHaveLength(3);
  expect(screen.queryByText('Jupiter 24H activity')).not.toBeInTheDocument();
  await userEvent.click(screen.getByText('JUP'));
  expect(window.location.pathname).toContain('/asset/JUPyiwrY');
});

test('uses Home-only navigation and shows four compact market metrics', async () => {
  const { container } = render(<BrowserRouter><App /></BrowserRouter>);
  await screen.findByRole('heading', { name: 'SOL / USD' });
  expect(screen.getAllByRole('link', { name: 'Home' }).length).toBeGreaterThan(0);
  expect(screen.queryByRole('link', { name: 'Market' })).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Jupiter DEX' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Top Volume' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Trending' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'New tokens' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /FDV/i })).not.toBeInTheDocument();
  expect(screen.getByText('SOL price')).toBeInTheDocument();
  expect(screen.getAllByText('+3.50%').length).toBeGreaterThan(0);
  expect(container.querySelectorAll('.iris-metric-card')).toHaveLength(4);
  expect(screen.queryByRole('button', { name: /Chart/i })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Preview/i })).not.toBeInTheDocument();
  expect(screen.getByText('Data from Jupiter and CoinGecko')).toBeInTheDocument();
});

test('asset table click and keyboard navigation open asset detail', async () => {
  render(<BrowserRouter><App /></BrowserRouter>);
  await screen.findByText('JUP');
  await act(async () => { await userEvent.click(screen.getByText('JUP')); });
  expect(window.location.pathname).toContain('/asset/JUPyiwrY');
});

test('asset table rows support keyboard navigation', async () => {
  render(<BrowserRouter><App /></BrowserRouter>);
  await screen.findByText('JUP');
  const row = screen.getAllByRole('button').find((button) => button.textContent?.includes('JUP'));
  expect(row).toBeTruthy();
  await userEvent.type(row, '{enter}');
  expect(window.location.pathname).toContain('/asset/JUPyiwrY');
});

test('chart range and selected mint persist in the URL', async () => {
  render(<BrowserRouter><App /></BrowserRouter>);
  await screen.findByRole('heading', { name: 'SOL / USD' });
  await userEvent.click(screen.getByRole('button', { name: '7D' }));
  expect(window.location.search).toContain('mint=So111');
  expect(window.location.search).toContain('range=7d');
  expect(screen.queryByText(/wallet lookup/i)).not.toBeInTheDocument();
});
