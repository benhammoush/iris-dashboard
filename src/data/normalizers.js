export function assetsFrom(data) {
  const items = Array.isArray(data) ? data : data?.assets || data?.tokens || [];
  return items.map((asset) => {
    if (!Array.isArray(asset)) return {
      ...asset,
       symbol: asset.symbol || asset.ticker,
       name: asset.name || asset.symbol || asset.ticker,
       image_uri: asset.image_uri || asset.imageUrl || asset.image,
       mint: asset.mint || asset.mintAddress || asset.mint_address || asset.address || asset.asset_identifier || asset.identifier,
      price_usd: asset.price_usd ?? asset.price ?? asset.usd_price,
       total_supply: asset.total_supply ?? asset.totalSupply ?? asset.supply,
       normalized_supply: asset.normalized_supply ?? asset.supply,
      market_cap_usd: asset.market_cap_usd ?? asset.marketCap ?? asset.market_cap,
       change_24h: asset.change_24h ?? asset.change24h ?? asset.changes?.['24h'] ?? asset.change?.day ?? null,
       change_7d: asset.change_7d ?? asset.change7d ?? asset.changes?.['7d'] ?? asset.change?.week ?? null,
       change_30d: asset.change_30d ?? asset.change30d ?? asset.changes?.['30d'] ?? asset.change?.month ?? null,
       asset_identifier: asset.asset_identifier || asset.identifier,
    };
    return {
      symbol: asset[0], price_usd: asset[1], image_uri: asset[2], total_supply: asset[3],
       market_cap_usd: asset[4], change_24h: asset[6], change_7d: asset[8],
       change_30d: asset[10], mint: asset[11], decimals: asset[12], name: asset[0],
    };
  });
}

export function walletsFrom(data) {
  const wallets = Array.isArray(data) ? data : data?.wallets || data?.featured || [];
  return wallets.map((wallet) => {
    if (typeof wallet === 'string') return { address: wallet, label: wallet };
    return {
      ...wallet,
       address: wallet.address || wallet.wallet_address || wallet.owner,
      label: wallet.label || wallet.name || wallet.address,
      description: wallet.description || wallet.summary || '',
    };
  });
}

export function walletFrom(data) {
  const wallet = data?.wallet || data;
  if (!wallet || typeof wallet !== 'object') return null;
  return {
    ...wallet,
     address: wallet.address || wallet.wallet_address || wallet.owner,
    label: wallet.label || wallet.name || wallet.address,
    description: wallet.description || wallet.summary || '',
    totalValue: wallet.totalValue ?? wallet.portfolioTotal ?? wallet.total_value_usd ?? wallet.value_usd,
    assets: (wallet.assets || wallet.holdings || wallet.token_balances || wallet.tokenBalances || []).map((asset) => ({
      ...asset,
       symbol: asset.symbol || asset.ticker || asset.asset,
       mint: asset.mint || asset.mintAddress || asset.mint_address || asset.address || asset.asset_identifier || asset.identifier,
      imageUrl: asset.imageUrl || asset.image_uri || asset.image,
      rawBalance: asset.rawBalance ?? asset.raw_balance ?? asset.balance,
      balance: asset.balance ?? asset.rawBalance ?? asset.raw_balance,
      displayBalance: asset.displayBalance ?? asset.display_balance ?? asset.balance,
      price: asset.price ?? asset.price_usd ?? asset.usd_price,
      value: asset.value ?? asset.value_usd ?? asset.valueUsd,
    })),
    transactions: (wallet.decoded_activity || wallet.decodedActivity || wallet.activity || wallet.transactions || wallet.events || []).slice(0, 25).map((transaction) => ({
      ...transaction,
       timestamp: transaction.timestamp || transaction.occurredAt || transaction.date || transaction.time || transaction.block_time || transaction.blockTime,
       id: transaction.id || transaction.signature || transaction.txId || transaction.txid || transaction.tx_id || transaction.transactionId || transaction.transaction_id || transaction.hash,
       type: transaction.type || transaction.action || transaction.activity_type || transaction.category || transaction.direction || transaction.instruction?.type || transaction.parsed?.type,
       symbol: transaction.symbol || transaction.assetSymbol || transaction.asset_symbol || transaction.asset?.symbol || transaction.token?.symbol || transaction.token_symbol,
       mint: transaction.mint || transaction.mintAddress || transaction.mint_address || transaction.asset?.mint || transaction.token?.mint,
      amount: transaction.displayAmount ?? transaction.amountDisplay ?? transaction.display_amount ?? transaction.amount ?? transaction.quantity,
       value: transaction.value ?? transaction.value_usd ?? transaction.valueUsd ?? transaction.usd_value,
       transfers: transaction.transfers || transaction.tokenTransfers || transaction.token_transfers || [],
    })),
  };
}

export function swapsFrom(data) {
  const swaps = Array.isArray(data) ? data : data?.swaps || data?.trades || [];
  return swaps.map((swap) => {
    if (Array.isArray(swap)) {
      const type = swap[4];
      const input = tokenFrom(swap[3]?.[0]);
      const output = tokenFrom(swap[3]?.[1]);
      return swapFromParts({ date: swap[0], transaction: swap[1], maker: swap[2], type, input, output });
    }
    return swapFromParts({
       date: swap.date || swap.timestamp || swap.sync_at || swap.block_time || swap.blockTime,
       transaction: swap.transaction || swap.signature || swap.id || swap.txId || swap.tx_id || swap.txid || swap.transaction_id,
       maker: swap.maker || swap.sender || swap.wallet || swap.address || swap.owner,
       type: swap.type || swap.side || swap.direction || 'SWAP',
       input: tokenFrom(swap.input || swap.asset_in || swap.token_in || swap.tokenIn || swap.from || swap.sold),
       output: tokenFrom(swap.output || swap.asset_out || swap.token_out || swap.tokenOut || swap.to || swap.bought),
    });
  });
}

function tokenFrom(token) {
  if (Array.isArray(token)) return { symbol: token[0], image_uri: token[1], amount: token[3] };
  return {
    ...(token || {}),
     symbol: token?.symbol || token?.ticker || token?.asset,
     mint: token?.mint || token?.mintAddress || token?.mint_address || token?.address || token?.asset_identifier || token?.identifier,
    image_uri: token?.image_uri || token?.imageUrl || token?.image,
    amount: token?.amount ?? token?.amount_display ?? token?.quantity ?? token?.value,
  };
}

function swapFromParts({ date, transaction, maker, type, input, output }) {
  const normalizedType = String(type || '').toUpperCase();
  const isBuy = normalizedType === 'BUY';
  const hasDirection = normalizedType === 'BUY' || normalizedType === 'SELL';
  const asset = hasDirection ? (isBuy ? output : input) : null;
  const value = hasDirection ? (isBuy ? input : output) : null;
  return {
    date,
    transaction,
    maker,
    type: normalizedType,
    asset,
    amount: asset?.amount,
    value,
    categoryAmount: value?.amount,
  };
}

export function marketHistoryFrom(data, assets) {
  const history = data?.market_cap_history || data?.marketCapHistory || data?.history || data?.market_history || [];
  if (history.length && history[0]?.points) {
    const valuesByDate = {};
    history.forEach((entry) => {
      const asset = assets.find((item) => item.symbol === entry.symbol);
      const supply = asset?.normalized_supply ?? asset?.total_supply;
      (entry.points || []).forEach((point) => {
        const date = point.date || point.timestamp || point.sync_at;
        if (!date || supply === undefined) return;
        const marketCap = Number(point.marketCap);
        valuesByDate[date] = (valuesByDate[date] || 0) + (Number.isFinite(marketCap) ? marketCap : point.price * supply);
      });
    });
    return Object.entries(valuesByDate).map(([date, value]) => [date, value]);
  }
  if (history.length) return history.map((point) => [point.date || point.timestamp || point.sync_at, point.value ?? point.market_cap_usd ?? point.market_cap]);
  if (!Array.isArray(data)) return [];

  const valuesByDate = {};
  data.forEach((entry) => {
    const supply = assets.find((asset) => asset.symbol === entry[0])?.total_supply;
    (entry[1] || []).forEach((point) => {
      const date = new Date(point.sync_at).toLocaleDateString('en-US');
      valuesByDate[date] = (valuesByDate[date] || 0) + point.avg_price_usd * supply;
    });
  });
  return Object.entries(valuesByDate).map(([date, value]) => [date, value]);
}

export function assetHistoryFrom(asset) {
  const history = asset?.price_history || asset?.history || asset?.priceHistory || [];
  return history.map((point) => [point.date || point.timestamp || point.sync_at, point.price_usd ?? point.price ?? point.avg_price_usd]);
}
