function DataStatus({ meta, error, showPriceNotice = true, onRetry, refreshing = false }) {
  if (!meta && !error) return null;
  const source = meta?.source || meta?.provenance?.source;
  const freshness = meta?.freshness || (meta?.stale ? 'stale' : null);
  const asOf = meta?.asOf || meta?.marketDataAsOf || meta?.freshness?.asOf;
  return (
    <div className="iris-data-status" role="status">
      {showPriceNotice && <p><strong>Sources:</strong> Jupiter current metrics, CoinGecko 7-day history, and reviewed-pool swaps.</p>}
      {(source || freshness || asOf || error) && <p className={showPriceNotice ? 'iris-data-status-detail' : ''}>{[source, freshness, asOf && `as of ${asOf}`].filter(Boolean).join(' · ')}{error ? ` ${error.message}` : ''}{error?.requestId ? ` (request ${error.requestId})` : ''}{onRetry && <button className="iris-retry" onClick={onRetry} disabled={refreshing}>{refreshing ? 'Refreshing...' : 'Retry'}</button>}</p>}
    </div>
  );
}

export default DataStatus;
