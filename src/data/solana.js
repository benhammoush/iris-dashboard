export function solanaExplorerUrl(kind, value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const path = kind === 'tx' ? 'tx' : kind === 'address' ? 'address' : null;
  return path ? `https://explorer.solana.com/${path}/${encodeURIComponent(value)}` : null;
}
