import { assetHistoryFrom, assetsFrom, recentTransactionsFrom, transactionsFrom, walletFrom } from './normalizers';

test('normalizes canonical v3 assets and atomic transaction events', () => {
  const [asset] = assetsFrom({ assets: [{ mint: 'MintCaseSensitiveABC', symbol: 'TEST', iconUrl: '/test.png', priceUsd: 2, quality: { organicScore: 84 } }] });
  const [event] = transactionsFrom({ events: [{ id: 'solana-event', timestamp: '2026-10-02T12:00:00Z', type: 'Swap', source: 'Helius', status: 'Confirmed', description: 'Swap event', transfers: { native: [{ amount: '1000000', decimals: 9 }], tokens: [{ mint: 'MintCaseSensitiveABC', symbol: 'TEST', amount: '2500000', decimals: 6 }] } }] });
  expect(asset).toMatchObject({ mint: 'MintCaseSensitiveABC', imageUrl: '/test.png', priceUsd: 2, quality: { organicScore: 84 } });
  expect(event).toMatchObject({ id: 'solana-event', timestamp: '2026-10-02T12:00:00Z', type: 'Swap', source: 'Helius', status: 'Confirmed', transfers: [{ symbol: 'SOL', amount: '1000000', decimals: 9, kind: 'native' }, { mint: 'MintCaseSensitiveABC', symbol: 'TEST', amount: '2500000', decimals: 6, kind: 'token' }] });
  const [flatEvent] = transactionsFrom({ events: [{ id: 'flat-event', transfers: [{ mint: 'MintCaseSensitiveABC', amount: '1', decimals: 6 }] }] });
  expect(flatEvent.transfers).toEqual([{ mint: 'MintCaseSensitiveABC', amount: '1', decimals: 6, kind: 'token' }]);
});

test('keeps nullable Worker market fields and ignores unavailable history', () => {
  const [asset] = assetsFrom([{ mint: 'MintCaseSensitiveABC', symbol: 'TEST', priceUsd: null, marketCapUsd: null }]);

  expect(asset.priceUsd).toBeNull();
  expect(asset.marketCapUsd).toBeNull();
  expect(assetHistoryFrom({ history: null })).toEqual([]);
  expect(assetHistoryFrom({ history: [{ timestamp: '2026-10-01T00:00:00Z', priceUsd: 2 }] })).toEqual([['2026-10-01T00:00:00Z', 2]]);
});

test('keeps canonical wallet identifiers and holdings truncation', () => {
  const [asset] = assetsFrom({ assets: [{ mint: 'MintCaseSensitiveABC', symbol: 'TEST' }] });
  const wallet = walletFrom({ address: 'WalletCaseSensitiveABC', holdingsTruncated: true, balances: [], events: [{ id: 'SignatureABC', type: 'swap' }] });

  expect(asset.mint).toBe('MintCaseSensitiveABC');
  expect(wallet.address).toBe('WalletCaseSensitiveABC');
  expect(wallet.truncated).toBe(true);
  expect(wallet.transactions[0]).toMatchObject({ id: 'SignatureABC', type: 'swap' });
});

test('recent transaction samples retain only provider-proven signature fields', () => {
  expect(recentTransactionsFrom({ transactions: [{ signature: 'signature', slot: 12, blockTime: '2026-10-06T00:00:00.000Z', status: 'confirmed', action: 'add_liquidity' }, { signature: '', slot: 13 }] })).toEqual([{ signature: 'signature', slot: 12, blockTime: '2026-10-06T00:00:00.000Z', status: 'confirmed', action: 'add_liquidity' }]);
});
