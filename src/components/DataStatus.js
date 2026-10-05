import { useEffect, useState } from 'react';

function snapshotAsOf(meta) {
  return meta?.marketDataAsOf || meta?.price_snapshot_as_of || meta?.priceSnapshotAsOf || meta?.price_data?.as_of || meta?.priceData?.asOf;
}

function formatUtc(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.toLocaleDateString('en-GB', { timeZone: 'UTC' })} ${date.toLocaleTimeString('en-GB', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' })} UTC`;
}

function nextScheduledRefresh(meta, now) {
  const scheduledAt = Date.parse(meta?.nextScheduledRefreshAt);
  const intervalMs = Number(meta?.refreshIntervalMinutes) * 60_000;
  if (!Number.isFinite(scheduledAt) || !Number.isFinite(intervalMs) || intervalMs <= 0) return null;
  if (scheduledAt > now) return new Date(scheduledAt).toISOString();
  return new Date(scheduledAt + (Math.floor((now - scheduledAt) / intervalMs) + 1) * intervalMs).toISOString();
}

function DataStatus({ meta, error, showPriceNotice = true, onRetry, refreshing = false }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(interval);
  }, []);

  if (!meta && !error) return null;
  const source = meta?.source === 'fixture' || meta?.snapshotState === 'fixture' ? 'Fixture data' : meta?.stale || meta?.snapshotState === 'stale' ? 'Stale Worker data' : 'Fresh Worker data';
  const asOf = snapshotAsOf(meta);
  const liveMarket = ['jupiter', 'mixed', 'coingecko'].includes(meta?.marketDataSource);
  const lastRefresh = formatUtc(meta?.snapshotCreatedAt);
  const nextRefresh = formatUtc(nextScheduledRefresh(meta, now));
  return (
    <div className="iris-data-status" role="status">
      {showPriceNotice && <p><strong>Market data:</strong> {liveMarket ? `Supported Solana assets use ${meta?.marketDataSource === 'jupiter' ? 'Jupiter prices and CoinGecko price history' : meta?.marketDataSource === 'mixed' ? 'live DEX prices and CoinGecko chart history' : 'CoinGecko chart history'}${asOf ? ` refreshed ${asOf}` : ''}; unavailable provider values remain blank.` : `Price and chart data use a fixed market snapshot${asOf ? ` as of ${asOf}` : ''}. Blockchain slots, balances, and activity remain live.`}</p>}
      <p className={showPriceNotice ? 'iris-data-status-detail' : ''}>{source}{meta?.as_of ? ` as of ${meta.as_of}` : ''}{error ? `: ${error.message}` : ''}{error?.requestId ? ` (request ${error.requestId})` : ''}{onRetry && <button className="iris-retry" onClick={onRetry} disabled={refreshing}>{refreshing ? 'Refreshing...' : 'Retry'}</button>}</p>
      {(lastRefresh || nextRefresh) && <p className="iris-data-status-detail">{lastRefresh && `Last completed API refresh: ${lastRefresh}.`}{lastRefresh && nextRefresh && ' '}{nextRefresh && `Next scheduled API refresh: ${nextRefresh}.`}</p>}
    </div>
  );
}

export default DataStatus;
