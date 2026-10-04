import { render, screen } from '@testing-library/react';
import DataStatus from './DataStatus';

test('explains snapshot fallback while preserving the live blockchain data scope', () => {
  render(<DataStatus meta={{ source: 'live', price_snapshot_as_of: '2026-10-01T00:00:00Z' }} />);

  expect(screen.getByText(/price and chart data use a fixed market snapshot/i)).toBeInTheDocument();
  expect(screen.getByText(/fixed market snapshot as of 2026-10-01T00:00:00Z/i)).toBeInTheDocument();
  expect(screen.getByText(/blockchain slots, balances, and activity remain live/i)).toBeInTheDocument();
});

test('identifies live DEX pricing and CoinGecko history for supported assets', () => {
  render(<DataStatus meta={{ marketDataSource: 'mixed', marketDataAsOf: '2026-10-03T12:00:00Z' }} />);

  expect(screen.getByText(/supported solana assets use live dex prices and coingecko chart history/i)).toBeInTheDocument();
  expect(screen.getByText(/unsupported assets remain clearly snapshot-backed/i)).toBeInTheDocument();
});

test('identifies CoinGecko-only market data when DEX pricing is rate-limited', () => {
  render(<DataStatus meta={{ marketDataSource: 'coingecko' }} />);

  expect(screen.getByText(/supported solana assets use coingecko chart history/i)).toBeInTheDocument();
});

test('shows the last completed and next scheduled API refresh', () => {
  render(<DataStatus meta={{
    snapshotCreatedAt: '2026-10-04T12:00:00.000Z',
    nextScheduledRefreshAt: '2099-10-04T12:15:00.000Z',
    refreshIntervalMinutes: 15,
  }} />);

  expect(screen.getByText(/last completed api refresh: 04\/10\/2026 12:00 utc/i)).toBeInTheDocument();
  expect(screen.getByText(/next scheduled api refresh: 04\/10\/2099 12:15 utc/i)).toBeInTheDocument();
});
