import { swapsFrom } from './normalizers';

test('normalizes canonical Worker object swaps for the table', () => {
  const [swap] = swapsFrom({ swaps: [{
    timestamp: '2026-10-02T12:00:00Z',
    tx_id: '0xabc',
    maker: 'SP123',
    side: 'BUY',
    asset_in: { symbol: 'STX', amount: 125 },
    asset_out: { symbol: 'ALEX', image_uri: '/alex.png', amount: 50 },
  }] });

  expect(swap).toEqual(expect.objectContaining({
    date: '2026-10-02T12:00:00Z', transaction: '0xabc', maker: 'SP123', type: 'BUY',
    asset: expect.objectContaining({ symbol: 'ALEX', amount: 50 }),
    value: expect.objectContaining({ symbol: 'STX', amount: 125 }),
    categoryAmount: 125,
  }));
});
