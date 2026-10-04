import { assetsFrom, swapsFrom, walletFrom } from './normalizers';

test('normalizes canonical Worker object swaps for the table', () => {
  const [swap] = swapsFrom({ swaps: [{
    timestamp: '2026-10-02T12:00:00Z',
    signature: 'solana-signature',
    maker: 'WalletCaseSensitive123',
    side: 'BUY',
    asset_in: { symbol: 'SOL', mint: 'So11111111111111111111111111111111111111112', amount: 125 },
    asset_out: { symbol: 'BONK', mint_address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xPmg6E1Bf5t2S8', image_uri: '/bonk.png', amount: 50 },
  }] });

  expect(swap).toEqual(expect.objectContaining({
    date: '2026-10-02T12:00:00Z', transaction: 'solana-signature', maker: 'WalletCaseSensitive123', type: 'BUY',
    asset: expect.objectContaining({ symbol: 'BONK', mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xPmg6E1Bf5t2S8', amount: 50 }),
    value: expect.objectContaining({ symbol: 'SOL', amount: 125 }),
    categoryAmount: 125,
  }));
});

test('normalizes Solana mint aliases without changing case', () => {
  const [asset] = assetsFrom({ assets: [{ mint_address: 'MintCaseSensitiveABC', symbol: 'TEST' }] });
  const wallet = walletFrom({ owner: 'WalletCaseSensitiveABC', decoded_activity: [{ signature: 'SignatureABC', instruction: { type: 'swap' }, token: { mint: 'MintCaseSensitiveABC', symbol: 'TEST' } }] });

  expect(asset.mint).toBe('MintCaseSensitiveABC');
  expect(wallet.address).toBe('WalletCaseSensitiveABC');
  expect(wallet.transactions[0]).toMatchObject({ id: 'SignatureABC', type: 'swap', mint: 'MintCaseSensitiveABC' });
});
