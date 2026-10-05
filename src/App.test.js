import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

beforeEach(() => {
  window.history.pushState({}, '', '/');
  global.fetch = vi.fn((url) => {
    const data = url.includes('/history') ? { data: { history: [] } } : url.includes('/v3/swaps') ? { data: { swaps: [{ signature: 'pool-swap-1', timestamp: '2026-10-03T12:00:00Z', type: 'Swap', maker: 'ReviewedPoolWallet' }] } } : url.includes('/v3/assets/mint/JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN') ? { data: { mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', symbol: 'JUP', name: 'Jupiter', priceUsd: 1 } } : url.includes('/v3/assets/mint/') ? { data: { mint: 'So11111111111111111111111111111111111111112', symbol: 'SOL', name: 'Solana', priceUsd: 1, activity: { volume24hUsd: 25 } } } : url.includes('/v3/assets') ? { data: [{ mint: 'So11111111111111111111111111111111111111112', symbol: 'SOL', name: 'Solana', priceUsd: 1 }, { mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', symbol: 'JUP', name: 'Jupiter', priceUsd: 1 }] } : { data: [] };
    return Promise.resolve({ ok: true, json: () => Promise.resolve(data) });
  });
});

test('renders the Worker-backed portfolio shell', async () => {
  const { unmount } = render(<BrowserRouter><App /></BrowserRouter>);
  expect(await screen.findByPlaceholderText(/search assets or paste a wallet address/i)).toBeInTheDocument();
  await waitFor(() => expect(screen.getByText(/no coingecko history is available/i)).toBeInTheDocument());
  expect(screen.getByText(/global reviewed-pool activity/i)).toBeInTheDocument();
  expect(screen.getByText('Jupiter activity')).toBeInTheDocument();
  expect(fetch.mock.calls.some(([url]) => String(url).includes('/v3/wallets'))).toBe(false);
  unmount();
});

test('uses Home-only navigation and exposes the expanded market metrics', async () => {
  render(<BrowserRouter><App /></BrowserRouter>);
  await screen.findByText('SOL');
  expect(screen.getAllByRole('link', { name: 'Home' }).length).toBeGreaterThan(0);
  expect(screen.queryByRole('link', { name: 'Market' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /FDV/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Volume 24H/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Organic score/i })).toBeInTheDocument();
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
  expect(screen.queryByText('Liquidity')).not.toBeInTheDocument();
});

test('preview updates the selected chart URL without changing primary asset-detail navigation', async () => {
  render(<BrowserRouter><App /></BrowserRouter>);
  await screen.findByRole('button', { name: 'Preview JUP' });
  await userEvent.click(screen.getByRole('button', { name: 'Preview JUP' }));
  expect(window.location.pathname).toBe('/');
  expect(window.location.search).toContain('mint=JUPyiwrY');
});
