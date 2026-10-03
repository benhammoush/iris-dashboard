import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

beforeEach(() => {
  global.fetch = vi.fn((url) => {
    const data = url.includes('/v1/assets') ? { data: [{ symbol: 'STX', name: 'Stacks', price_usd: 1, total_supply: 1, decimals: 0, market_cap_usd: 1 }] } : { data: [] };
    return Promise.resolve({ ok: true, json: () => Promise.resolve(data) });
  });
});

test('renders the Worker-backed portfolio shell', async () => {
  const { unmount } = render(<BrowserRouter><App /></BrowserRouter>);
  expect(await screen.findByPlaceholderText(/search assets or tracked wallets/i)).toBeInTheDocument();
  await waitFor(() => expect(screen.getByText(/no market history available/i)).toBeInTheDocument());
  unmount();
});

test('asset table navigation uses the router', async () => {
  render(<BrowserRouter><App /></BrowserRouter>);
  await screen.findByText('STX');
  await act(async () => { await userEvent.click(screen.getByText('STX')); });
  expect(await screen.findByText(/Stacks \| STX/)).toBeInTheDocument();
});
