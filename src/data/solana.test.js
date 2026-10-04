import { expect, test } from 'vitest';
import { solanaExplorerUrl } from './solana';

test('builds encoded Solana Explorer URLs only for supported resource kinds', () => {
  expect(solanaExplorerUrl('address', 'Mint/with space')).toBe('https://explorer.solana.com/address/Mint%2Fwith%20space');
  expect(solanaExplorerUrl('tx', 'SignatureABC')).toBe('https://explorer.solana.com/tx/SignatureABC');
  expect(solanaExplorerUrl('unknown', 'value')).toBeNull();
});
