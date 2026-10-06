type PageKind = 'home' | 'asset' | 'wallet'

export default function LoadingSkeleton({ page }: { page: PageKind }) {
  return <main className={`iris-skeleton-page iris-skeleton-page--${page}`} aria-label="Loading content" aria-busy="true">
    <div className="iris-skeleton iris-skeleton-title" />
    <div className="iris-skeleton iris-skeleton-subtitle" />
    {page !== 'home' && <div className="iris-skeleton-metrics">{Array.from({ length: 4 }, (_, index) => <div className="iris-skeleton iris-skeleton-metric" key={index} />)}</div>}
    <div className="iris-skeleton iris-skeleton-panel" />
    <div className="iris-skeleton iris-skeleton-panel iris-skeleton-panel--short" />
  </main>
}
