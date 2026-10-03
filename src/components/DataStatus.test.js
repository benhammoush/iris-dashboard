import { render, screen } from '@testing-library/react';
import DataStatus from './DataStatus';

test('explains the fixed price snapshot and preserves live blockchain data scope', () => {
  render(<DataStatus meta={{ source: 'live', price_snapshot_as_of: '2026-10-01T00:00:00Z' }} />);

  expect(screen.getByText(/live alex price data is currently unavailable/i)).toBeInTheDocument();
  expect(screen.getByText(/fixed market snapshot as of 2026-10-01T00:00:00Z/i)).toBeInTheDocument();
  expect(screen.getByText(/blockchain fees, blocks, balances, and activity remain live/i)).toBeInTheDocument();
});
