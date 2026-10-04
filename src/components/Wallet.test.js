import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import Wallet from './Wallet';
import { workerApi } from '../api/worker';

vi.mock('../api/worker', () => ({ workerApi: { wallet: vi.fn() } }));
vi.mock('./Navbar', () => ({ default: () => <nav aria-label="Main navigation" /> }));

const walletFixture = {
  address: 'SP2CURATED',
  label: 'Curated Wallet',
  description: 'Public portfolio data from the Worker.',
  totalValue: 1234.56,
  assets: [{
    symbol: 'STX',
    imageUrl: '/stx.png',
    rawBalance: '42500000',
    balance: 42.5,
    displayBalance: '42.5 STX',
    price: 2.5,
    value: 106.25,
  }],
  transactions: Array.from({ length: 26 }, (_, index) => ({
    timestamp: '2026-10-02T12:00:00Z',
    tx_id: `0xtx-${index + 1}`,
    type: index === 0 ? 'Sent' : 'Received',
    asset: { symbol: 'STX' },
    amount: index + 1.25,
    value_usd: index + 3.5,
  })),
};

function renderWallet() {
  return render(<MemoryRouter initialEntries={['/wallet/SP2CURATED']}><Routes><Route path="/wallet/:address" element={<Wallet />} /></Routes></MemoryRouter>);
}

beforeEach(() => {
  workerApi.wallet.mockResolvedValue({ data: walletFixture, meta: { source: 'live' } });
});

test('renders a populated Worker wallet portfolio summary', async () => {
  const { container } = renderWallet();

  expect(await screen.findByText('Curated Wallet')).toBeInTheDocument();
  expect(screen.getByText('$1,234.56')).toBeInTheDocument();
  expect(screen.getByText(/public on-chain data only/i)).toBeInTheDocument();
  expect(screen.getByText('42.5 STX')).toBeInTheDocument();
  expect(screen.getByText('$106.25')).toBeInTheDocument();
  expect(container.querySelector('img[src="/stx.png"]')).toBeInTheDocument();
});

test('renders normalized Worker transactions and limits recent activity to 25 rows', async () => {
  renderWallet();

  expect(await screen.findByText('0xtx-1')).toBeInTheDocument();
  expect(screen.getByText('Sent')).toBeInTheDocument();
  expect(screen.getByText('$3.5')).toBeInTheDocument();
  expect(screen.queryByText('0xtx-26')).not.toBeInTheDocument();
});
