import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

beforeEach(() => {
  global.fetch = vi.fn((url) => {
    const data = url.includes('/v2/assets/mint/JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN') ? { data: { mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', symbol: 'JUP', name: 'Jupiter', price: 1, priceHistory: null } } : url.includes('/v2/assets') ? { data: [{ mint: 'So11111111111111111111111111111111111111112', symbol: 'SOL', name: 'Solana', price: 1, totalSupply: 1, decimals: 9, marketCap: 1 }, { mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', symbol: 'JUP', name: 'Jupiter', price: 1, totalSupply: 1, decimals: 6, marketCap: 1 }] } : { data: [] };
    return Promise.resolve({ ok: true, json: () => Promise.resolve(data) });
  });
});

test('renders the Worker-backed portfolio shell', async () => {
  const { unmount } = render(<BrowserRouter><App /></BrowserRouter>);
  expect(await screen.findByPlaceholderText(/search assets or paste a wallet address/i)).toBeInTheDocument();
  await waitFor(() => expect(screen.getByText(/no price history available/i)).toBeInTheDocument());
  unmount();
});

test('clicking an asset row selects its price-history chart', async () => {
  render(<BrowserRouter><App /></BrowserRouter>);
  await screen.findByText('JUP');
  await act(async () => { await userEvent.click(screen.getByText('JUP')); });
  expect(await screen.findByRole('heading', { name: 'JUP / USD' })).toBeInTheDocument();
});
