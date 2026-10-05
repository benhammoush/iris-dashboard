import { render, screen } from '@testing-library/react';
import DataStatus from './DataStatus';

test('labels the v3 market providers explicitly', () => {
  render(<DataStatus meta={{ source: 'worker', freshness: 'fresh', asOf: '2026-10-03T12:00:00Z' }} />);
  expect(screen.getByText(/jupiter current metrics, coingecko 7-day history, and reviewed-pool swaps/i)).toBeInTheDocument();
  expect(screen.getByText(/worker.*fresh.*as of 2026-10-03/i)).toBeInTheDocument();
});

test('shows diagnostics only when provenance or an error requires them', () => {
  const { rerender } = render(<DataStatus meta={{}} />);
  expect(screen.queryByText(/as of/i)).not.toBeInTheDocument();
  rerender(<DataStatus error={{ message: 'Unavailable', requestId: 'req-1' }} />);
  expect(screen.getByText(/unavailable.*request req-1/i)).toBeInTheDocument();
});
