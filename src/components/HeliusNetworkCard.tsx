type Network = { fetchedAt?: string | null; [key: string]: any }

const number = (value: unknown, digits = 0) => value === null || value === undefined || !Number.isFinite(Number(value)) ? '—' : Number(value).toLocaleString('en-US', { maximumFractionDigits: digits })
const supply = (value: unknown) => value === null || value === undefined || !Number.isFinite(Number(value)) ? '—' : `${Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 })} SOL`

function Field({ label, value }: { label: string; value: string }) {
  return <div className="iris-helius-field"><span>{label}</span><strong>{value}</strong></div>
}

export default function HeliusNetworkCard({ network, loading, error }: { network: Network | null; loading: boolean; error: unknown }) {
  if (loading && !network) return <section className="iris-helius-card" aria-label="Helius Solana network"><CardHeader live={false} /><p className="iris-helius-loading">Loading network snapshot...</p></section>
  const value = network || {}
  const chain = value.chain || { state: 'unavailable' }
  const fees = value.fees || { state: 'unavailable' }
  const economics = value.economics || { state: 'unavailable' }
  return <section className="iris-helius-card" aria-label="Helius Solana network">
    <CardHeader live={chain.state === 'fresh'} />
    {Boolean(error) && !network && <p className="iris-helius-loading">Network snapshot unavailable.</p>}
    <div className="iris-helius-summary">
      <Field label="Processed slot" value={number(chain.processedSlot)} />
      <Field label="Confirmed slot" value={number(chain.confirmedSlot)} />
      <Field label="Block height" value={number(chain.blockHeight)} />
      <Field label="Epoch" value={number(chain.epoch)} />
      <Field label="Median priority fee" value={`${number(fees.medianPriorityFeeMicroLamports)} micro-lamports`} />
      <Field label="Total supply" value={supply(economics.totalSol)} />
      <Field label="Circulating supply" value={supply(economics.circulatingSol)} />
      <Field label="Non-circulating supply" value={supply(economics.nonCirculatingSol)} />
    </div>
  </section>
}

function CardHeader({ live }: { live: boolean }) {
  return <div className="iris-helius-topline"><span className="iris-helius-mark" aria-hidden="true">H</span><div><p>Helius</p><h2>Network status</h2></div><span>{live ? 'LIVE' : 'SNAPSHOT'}</span></div>
}
