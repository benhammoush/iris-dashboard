export function assetsFrom(data) {
  const items = Array.isArray(data) ? data : data?.assets || [];
  return items.filter((asset) => asset && !Array.isArray(asset)).map((asset) => ({
    ...asset,
    mint: asset.mint,
    symbol: asset.symbol,
    name: asset.name || asset.symbol,
    imageUrl: asset.iconUrl,
    priceUsd: asset.priceUsd ?? null,
    marketCapUsd: asset.marketCapUsd ?? null,
    change24hPct: asset.change24hPct ?? null,
    activity: asset.activity || {},
    quality: asset.quality || {},
    verification: asset.verification || {},
  }));
}

export function walletFrom(data) {
  const wallet = data?.wallet || data;
  if (!wallet || typeof wallet !== 'object') return null;
  return {
    ...wallet,
    address: wallet.address,
    label: wallet.label || wallet.address,
    description: wallet.description || '',
    totalValue: wallet.valuation?.pricedSubtotalUsd ?? null,
    valuation: wallet.valuation || {},
    truncated: Boolean(wallet.holdingsTruncated),
    assets: (Array.isArray(wallet.balances) ? wallet.balances : []).map((asset) => ({
      ...asset,
      symbol: asset.symbol,
      mint: asset.mint,
      imageUrl: asset.iconUrl,
      rawBalance: asset.rawBalance,
      balance: asset.balance,
      displayBalance: asset.displayBalance,
      price: asset.priceUsd,
      value: asset.valueUsd,
    })),
    transactions: (wallet.transactions || wallet.events || []).map(transactionFrom),
  };
}

export function transactionsFrom(data) {
  const page = data?.transactions || data?.events || (Array.isArray(data) ? data : []);
  return page.map(transactionFrom);
}

export function swapsFrom(data) {
  const events = Array.isArray(data) ? data : data?.swaps || data?.events || [];
  return events.map((event) => ({
    id: event.id || event.signature,
    timestamp: event.timestamp,
    type: event.type || event.side || 'Swap',
    maker: event.maker || event.wallet,
  }));
}

export function recentTransactionsFrom(data) {
  const transactions = Array.isArray(data?.transactions) ? data.transactions : [];
  return transactions.flatMap((transaction) => {
    if (!transaction || typeof transaction.signature !== 'string' || !transaction.signature) return [];
    return [{
      signature: transaction.signature,
      slot: Number.isInteger(transaction.slot) && transaction.slot >= 0 ? transaction.slot : null,
      blockTime: typeof transaction.blockTime === 'string' && Number.isFinite(Date.parse(transaction.blockTime)) ? transaction.blockTime : null,
      status: transaction.status === 'confirmed' ? 'confirmed' : null,
      action: typeof transaction.action === 'string' && transaction.action ? transaction.action : null,
    }];
  });
}

function transactionFrom(transaction) {
  return {
    ...transaction,
    timestamp: transaction.timestamp,
    id: transaction.id,
    type: transaction.type || 'Activity',
    source: transaction.source,
    status: transaction.status,
    description: transaction.description,
    transfers: transfersFrom(transaction.transfers),
  };
}

function transfersFrom(transfers) {
  if (Array.isArray(transfers)) return transfers.map((transfer) => ({
    ...transfer,
    kind: transfer.kind || (transfer.mint ? 'token' : transfer.symbol === 'SOL' ? 'native' : 'token'),
  }));
  if (!transfers || typeof transfers !== 'object') return [];
  const native = Array.isArray(transfers.native) ? transfers.native.map((transfer) => ({ ...transfer, symbol: 'SOL', kind: 'native' })) : [];
  const tokens = Array.isArray(transfers.tokens) ? transfers.tokens.map((transfer) => ({ ...transfer, kind: 'token' })) : [];
  return [...native, ...tokens];
}

export function assetHistoryFrom(asset) {
  const history = Array.isArray(asset) ? asset : asset?.history || asset?.points || asset?.priceHistory;
  if (!Array.isArray(history)) return [];
  return history.map((point) => [point.date || point.timestamp, point.priceUsd ?? point.price]).filter(([date, price]) => date && Number.isFinite(Number(price)));
}

export function assetCandlesFrom(data) {
  const candles = Array.isArray(data?.candles) ? data.candles : [];
  return candles.flatMap((candle) => {
    const timestamp = typeof candle?.timestamp === 'string' && Number.isFinite(Date.parse(candle.timestamp)) ? candle.timestamp : null;
    const values = ['openUsd', 'highUsd', 'lowUsd', 'closeUsd', 'volumeUsd'].map((field) => Number(candle?.[field]));
    const [openUsd, highUsd, lowUsd, closeUsd, volumeUsd] = values;
    return timestamp && values.every(Number.isFinite) && highUsd >= openUsd && highUsd >= closeUsd && lowUsd <= openUsd && lowUsd <= closeUsd
      ? [{ timestamp, openUsd, highUsd, lowUsd, closeUsd, volumeUsd }]
      : [];
  });
}

export function assetOnchainFrom(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const mintState = data.mintState && typeof data.mintState === 'object' ? data.mintState : {};
  const metadata = data.metadata && typeof data.metadata === 'object' ? data.metadata : {};
  return {
    mint: typeof data.mint === 'string' ? data.mint : null,
    interface: typeof data.interface === 'string' ? data.interface : null,
    tokenProgram: typeof data.tokenProgram === 'string' ? data.tokenProgram : null,
    metadata: { description: typeof metadata.description === 'string' ? metadata.description : null },
    mintState: { supplyAtomic: typeof mintState.supplyAtomic === 'string' ? mintState.supplyAtomic : null, supply: typeof mintState.supply === 'string' ? mintState.supply : null, mintAuthority: typeof mintState.mintAuthority === 'string' ? mintState.mintAuthority : null, freezeAuthority: typeof mintState.freezeAuthority === 'string' ? mintState.freezeAuthority : null, isMutable: typeof mintState.isMutable === 'boolean' ? mintState.isMutable : null, extensions: Array.isArray(mintState.extensions) ? mintState.extensions.filter((extension) => typeof extension === 'string') : [] }
  };
}

export function assetHoldersFrom(data) {
  const holders = Array.isArray(data?.holders) ? data.holders : [];
  return { holders: holders.flatMap((holder) => typeof holder?.owner === 'string' && typeof holder?.amount === 'string' ? [{ tokenAccount: typeof holder.tokenAccount === 'string' ? holder.tokenAccount : null, owner: holder.owner, amount: holder.amount, frozen: typeof holder.frozen === 'boolean' ? holder.frozen : null }] : []), total: Number.isInteger(data?.total) ? data.total : null };
}

export function assetDistributionFrom(data) {
  const accounts = Array.isArray(data?.accounts) ? data.accounts : [];
  return accounts.flatMap((account) => Number.isInteger(account?.rank) && typeof account?.tokenAccount === 'string' && typeof account?.amount === 'string' ? [{ rank: account.rank, tokenAccount: account.tokenAccount, owner: typeof account.owner === 'string' ? account.owner : null, amount: account.amount, supplyPercent: typeof account.supplyPercent === 'string' ? account.supplyPercent : null, frozen: typeof account.frozen === 'boolean' ? account.frozen : null }] : []);
}

export function assetTransactionsFrom(data) {
  const transactions = Array.isArray(data?.transactions) ? data.transactions : [];
  return transactions.flatMap((transaction) => typeof transaction?.signature === 'string' ? [{ signature: transaction.signature, timestamp: typeof transaction.timestamp === 'string' ? transaction.timestamp : null, status: transaction.status === 'success' || transaction.status === 'failed' ? transaction.status : null, action: typeof transaction.action === 'string' ? transaction.action : null, protocol: typeof transaction.protocol === 'string' ? transaction.protocol : null, summary: typeof transaction.summary === 'string' ? transaction.summary : null }] : []);
}

export function networkFrom(data) {
  return data && typeof data === 'object' && !Array.isArray(data) ? data : null;
}

export function defillamaFrom(data) {
  const dashboard = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  const numberOrNull = (value) => Number.isFinite(Number(value)) ? Number(value) : null;
  const itemsFrom = (items, fields) => (Array.isArray(items) ? items : []).filter((item) => item && typeof item === 'object' && !Array.isArray(item)).map((item) => {
    const slug = typeof item.slug === 'string' && item.slug.trim() ? item.slug.trim() : null;
    return {
      name: typeof item.name === 'string' && item.name.trim() ? item.name.trim() : slug || 'Unknown',
      slug,
      logo: typeof item.logo === 'string' && item.logo.trim() ? item.logo.trim() : null,
      ...Object.fromEntries(fields.map((field) => [field, numberOrNull(item[field])])),
      ...(fields.includes('category') ? { category: typeof item.category === 'string' && item.category.trim() ? item.category.trim() : null } : {}),
    };
  });
  const dexes = dashboard.dexes && typeof dashboard.dexes === 'object' && !Array.isArray(dashboard.dexes) ? dashboard.dexes : {};
  const protocols = dashboard.protocols && typeof dashboard.protocols === 'object' && !Array.isArray(dashboard.protocols) ? dashboard.protocols : {};
  return {
    dexes: {
      total24hUsd: numberOrNull(dexes.total24hUsd),
      total7dUsd: numberOrNull(dexes.total7dUsd),
      items: itemsFrom(dexes.items, ['total24hUsd', 'total7dUsd', 'change1dPct']),
    },
    protocols: {
      total: numberOrNull(protocols.total),
      items: itemsFrom(protocols.items, ['category', 'solanaTvlUsd', 'change1dPct', 'change7dPct']),
    },
  };
}
