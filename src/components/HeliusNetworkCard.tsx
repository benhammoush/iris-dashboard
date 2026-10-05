import type { ReactNode } from 'react'

type Group = Record<string, any> & { state?: string; asOf?: string | null }
type Network = { fetchedAt?: string | null; [key: string]: any }

const number = (value: unknown, digits = 0) => value === null || value === undefined || !Number.isFinite(Number(value)) ? '—' : Number(value).toLocaleString('en-US', { maximumFractionDigits: digits })
const percent = (value: unknown) => value === null || value === undefined || !Number.isFinite(Number(value)) ? '—' : `${Number(value).toFixed(2)}%`
const sol = (lamports: unknown) => lamports === null || lamports === undefined || !Number.isFinite(Number(lamports)) ? '—' : `${(Number(lamports) / 1_000_000_000).toFixed(6)} SOL`
const status = (group: Group) => group.state === 'stale' ? 'Stale' : group.state === 'unavailable' ? 'Unavailable' : 'Finalized'

function Field({ label, value }: { label: string; value: string }) {
  return <div className="iris-helius-field"><span>{label}</span><strong>{value}</strong></div>
}

function GroupDetails({ title, group, children }: { title: string; group: Group; children: ReactNode }) {
  return <details className="iris-helius-group">
    <summary><span>{title}</span><em className={`iris-helius-state iris-helius-state--${group.state || 'unavailable'}`}>{status(group)}</em></summary>
    {group.state === 'unavailable' ? <p>Network data is unavailable in this snapshot.</p> : <div className="iris-helius-fields">{children}</div>}
  </details>
}

export default function HeliusNetworkCard({ network, loading, error }: { network: Network | null; loading: boolean; error: unknown }) {
  if (loading && !network) return <section className="iris-helius-card" aria-label="Helius Solana network"><div className="iris-helius-topline"><HeliusMark /><div><p>Helius</p><h2>Solana network</h2></div></div><p className="iris-helius-loading">Loading network snapshot...</p></section>
  const value = network || {}
  const chain = value.chain || { state: 'unavailable' }
  const performance = value.performance || { state: 'unavailable' }
  const production = value.production || { state: 'unavailable' }
  const fees = value.fees || { state: 'unavailable' }
  const validators = value.validators || { state: 'unavailable' }
  const economics = value.economics || { state: 'unavailable' }
  const reliability = value.reliability || { state: 'unavailable' }
  return <section className="iris-helius-card" aria-label="Helius Solana network">
    <div className="iris-helius-topline"><HeliusMark /><div><p>Helius</p><h2>Solana network</h2></div><span>{chain.state === 'fresh' ? 'LIVE SNAPSHOT' : 'SNAPSHOT'}</span></div>
    {Boolean(error) && !network && <p className="iris-helius-loading">Network snapshot unavailable.</p>}
    <div className="iris-helius-summary">
      <Field label="Finalized slot" value={number(chain.finalizedSlot)} />
      <Field label="5m weighted TPS" value={number(performance.tps, 2)} />
      <Field label="Epoch progress" value={percent(chain.epochProgressPct)} />
      <Field label="Block production" value={percent(production.productionPct)} />
    </div>
    <div className="iris-helius-groups">
      <GroupDetails title="Chain & epoch" group={chain}><Field label="Processed slot" value={number(chain.processedSlot)} /><Field label="Confirmed slot" value={number(chain.confirmedSlot)} /><Field label="Block height" value={number(chain.blockHeight)} /><Field label="Epoch" value={number(chain.epoch)} /><Field label="Progress" value={`${number(chain.slotIndex)} / ${number(chain.slotsInEpoch)}`} /></GroupDetails>
      <GroupDetails title="Performance" group={performance}><Field label="Weighted TPS" value={number(performance.tps, 2)} /><Field label="Non-vote TPS" value={number(performance.nonVoteTps, 2)} /><Field label="Sample window" value={`${number(performance.samplePeriodSecs)} sec`} /><Field label="Transactions" value={number(performance.transactions)} /></GroupDetails>
      <GroupDetails title="Block production" group={production}><Field label="Produced" value={number(production.blocksProduced)} /><Field label="Assigned" value={number(production.assignedLeaderSlots)} /><Field label="Missed" value={number(production.missedLeaderSlots)} /><Field label="Production rate" value={percent(production.productionPct)} /></GroupDetails>
      <GroupDetails title="Fees & reliability" group={fees.state === 'unavailable' ? fees : reliability.state === 'unavailable' ? reliability : fees}><Field label="Average paid fee" value={sol(fees.averageFeeLamports)} /><Field label="Median priority fee" value={`${number(fees.medianPriorityFeeMicroLamports)} micro-lamports`} /><Field label="Failed transactions" value={`${number(reliability.failedTransactions)} / ${number(reliability.transactionCount)}`} /><Field label="Failure rate" value={percent(reliability.failurePct)} /></GroupDetails>
      <GroupDetails title="Validators" group={validators}><Field label="Current vote accounts" value={number(validators.currentVoteAccounts)} /><Field label="Delinquent vote accounts" value={number(validators.delinquentVoteAccounts)} /></GroupDetails>
      <GroupDetails title="Supply & inflation" group={economics}><Field label="Total supply" value={`${number(economics.totalSol, 2)} SOL`} /><Field label="Circulating supply" value={`${number(economics.circulatingSol, 2)} SOL`} /><Field label="Total inflation" value={percent(economics.inflationTotalPct)} /><Field label="Validator inflation" value={percent(economics.inflationValidatorPct)} /></GroupDetails>
    </div>
  </section>
}

function HeliusMark() {
  return <span className="iris-helius-mark" aria-hidden="true"><i /><i /><i /></span>
}
