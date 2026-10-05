import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import Wallet from './Wallet';
import { workerApi } from '../api/worker';

vi.mock('../api/worker', () => ({ workerApi: { wallet: vi.fn(), walletTransactions: vi.fn() } }));
vi.mock('./Navbar', () => ({ default: () => <nav aria-label="Main navigation" /> }));

const walletFixture = {
  address: 'WalletCaseSensitive123',
  label: 'Curated Wallet',
  description: 'Public portfolio data from the Worker.',
  valuation: { pricedSubtotalUsd: 1234.56, holdingCount: 2, pricedHoldingCount: 1, unpricedHoldingCount: 1, complete: false },
  holdingsTruncated: true,
  balances: [{
    mint: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    iconUrl: '/sol.png',
    rawBalance: '42500000',
    balance: 42.5,
    displayBalance: '42.5 SOL',
    priceUsd: 2.5,
    valueUsd: 106.25,
  }],
};

const transactions = Array.from({ length: 25 }, (_, index) => ({
    id: `solana-tx-${index + 1}`,
    timestamp: '2026-10-02T12:00:00Z',
    type: index === 0 ? 'Sent' : 'Received',
    source: 'Helius',
    status: 'Confirmed',
    description: 'Token transfer',
    transfers: { native: [{ amount: '42500000', decimals: 9 }], tokens: [{ symbol: 'JUP', mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', amount: '2000000', decimals: 6 }] },
  }));

function renderWallet() {
  return render(<MemoryRouter initialEntries={['/wallet/WalletCaseSensitive123']}><Routes><Route path="/wallet/:address" element={<Wallet />} /></Routes></MemoryRouter>);
}

beforeEach(() => {
  workerApi.wallet.mockResolvedValue({ data: walletFixture, meta: { source: 'live' } });
  workerApi.walletTransactions.mockResolvedValue({ data: { events: transactions, nextCursor: 'next-page' }, meta: { source: 'live' } });
});

test('renders a populated Worker wallet portfolio summary', async () => {
  const { container } = renderWallet();

  expect(await screen.findByText('Curated Wallet')).toBeInTheDocument();
  expect(screen.getByText('$1,234.56')).toBeInTheDocument();
  expect(screen.getByText(/valuations can be partial/i)).toBeInTheDocument();
  expect(screen.getByText('1 / 2')).toBeInTheDocument();
  expect(screen.getByText(/1 holdings are unpriced/i)).toBeInTheDocument();
  expect(screen.getByText(/returned balances.*incomplete/i)).toBeInTheDocument();
  expect(screen.getByText('42.5 SOL')).toBeInTheDocument();
  expect(screen.getByText('$106.25')).toBeInTheDocument();
  expect(container.querySelector('img[src="/sol.png"]')).toBeInTheDocument();
});

test('renders multi-transfer activity without unreliable flattened value columns and loads cursor pages', async () => {
  renderWallet();

  expect(await screen.findByText('solana-tx-1')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'solana-tx-1' })).toHaveAttribute('rel', 'noopener noreferrer');
  expect(screen.getAllByText(/Helius - Confirmed - Token transfer/).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/Native SOL: 42500000 atomic units \(decimals: 9\)/).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/JUP \(JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN\): 2000000 atomic units \(decimals: 6\)/).length).toBeGreaterThan(0);
  expect(screen.queryByText('Value')).not.toBeInTheDocument();
  workerApi.walletTransactions.mockResolvedValueOnce({ data: { events: [{ id: 'solana-tx-26', type: 'Swap', source: 'Helius', status: 'Confirmed', description: 'Swap event', transfers: [{ symbol: 'JUP', mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', amount: '2', decimals: 6 }] }] } });
  await userEvent.click(screen.getByRole('button', { name: 'Load more' }));
  expect(await screen.findByText('solana-tx-26')).toBeInTheDocument();
});
