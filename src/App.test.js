import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

beforeEach(() => {
  global.fetch = vi.fn((url) => {
    const data = url.includes('/v2/assets') ? { data: [{ mint: 'So11111111111111111111111111111111111111112', symbol: 'SOL', name: 'Solana', price_usd: 1, total_supply: 1, decimals: 9, market_cap_usd: 1 }] } : { data: [] };
    return Promise.resolve({ ok: true, json: () => Promise.resolve(data) });
  });
});

test('renders the Worker-backed portfolio shell', async () => {
  const { unmount } = render(<BrowserRouter><App /></BrowserRouter>);
  expect(await screen.findByPlaceholderText(/search assets or paste a wallet address/i)).toBeInTheDocument();
  await waitFor(() => expect(screen.getByText(/no market history available/i)).toBeInTheDocument());
  unmount();
});

test('asset table navigation uses the router', async () => {
  render(<BrowserRouter><App /></BrowserRouter>);
  await screen.findByText('SOL');
  await act(async () => { await userEvent.click(screen.getByText('SOL')); });
  expect(await screen.findByRole('heading', { name: /Solana SOL/ })).toBeInTheDocument();
});
