import { render, screen } from '@testing-library/react';
import DataStatus from './DataStatus';

test('explains snapshot fallback while preserving the live blockchain data scope', () => {
  render(<DataStatus meta={{ source: 'live', price_snapshot_as_of: '2026-10-01T00:00:00Z' }} />);

  expect(screen.getByText(/price and chart data use a fixed market snapshot/i)).toBeInTheDocument();
  expect(screen.getByText(/fixed market snapshot as of 2026-10-01T00:00:00Z/i)).toBeInTheDocument();
  expect(screen.getByText(/blockchain fees, blocks, balances, and activity remain live/i)).toBeInTheDocument();
});

test('identifies live DEX pricing and CoinGecko history for supported assets', () => {
  render(<DataStatus meta={{ marketDataSource: 'mixed', marketDataAsOf: '2026-10-03T12:00:00Z' }} />);

  expect(screen.getByText(/supported stacks assets use live dex prices and coingecko chart history/i)).toBeInTheDocument();
  expect(screen.getByText(/unsupported assets remain clearly snapshot-backed/i)).toBeInTheDocument();
});
