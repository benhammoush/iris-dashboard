function snapshotAsOf(meta) {
  return meta?.marketDataAsOf || meta?.price_snapshot_as_of || meta?.priceSnapshotAsOf || meta?.price_data?.as_of || meta?.priceData?.asOf;
}

function DataStatus({ meta, error, showPriceNotice = true }) {
  if (!meta && !error) return null;
  const source = meta?.source === 'fixture' ? 'Fixture data' : meta?.stale ? 'Stale Worker data' : 'Fresh Worker data';
  const asOf = snapshotAsOf(meta);
  const liveMarket = meta?.marketDataSource === 'mixed' || meta?.marketDataSource === 'coingecko';
  return (
    <div className="iris-data-status" role="status">
      {showPriceNotice && <p><strong>Market data:</strong> {liveMarket ? `Supported Stacks assets use ${meta?.marketDataSource === 'mixed' ? 'live DEX prices and ' : ''}CoinGecko chart history${asOf ? ` refreshed ${asOf}` : ''}; unsupported assets remain clearly snapshot-backed.` : `Price and chart data use a fixed market snapshot${asOf ? ` as of ${asOf}` : ''}. Blockchain fees, blocks, balances, and activity remain live.`}</p>}
      <p className={showPriceNotice ? 'iris-data-status-detail' : ''}>{source}{meta?.as_of ? ` as of ${meta.as_of}` : ''}{error ? `: ${error.message}` : ''}</p>
    </div>
  );
}

export default DataStatus;
