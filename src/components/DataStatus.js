function DataStatus({ meta, error }) {
  if (!meta && !error) return null;
  return (
    <div className="iris-data-status" role="status">
      <p>{error ? `Data unavailable: ${error.message}` : 'Data from Jupiter, Birdeye, and DefiLlama'}</p>
    </div>
  );
}

export default DataStatus;
