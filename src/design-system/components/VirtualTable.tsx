import { useVirtualizer } from '@tanstack/react-virtual'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'

export interface VirtualTableColumn<T> {
  id: string
  label: string
  width: number
  value: (row: T) => string | number
  cell: (row: T) => ReactNode
  align?: 'left' | 'right'
}

interface Props<T> {
  columns: VirtualTableColumn<T>[]
  data: T[]
  emptyLabel: string
  filterPlaceholder: string
  onRowClick?: (row: T) => void
  rowHeight?: number
  pageSize?: number
}

export default function VirtualTable<T>({ columns, data, emptyLabel, filterPlaceholder, onRowClick, rowHeight = 42, pageSize }: Props<T>) {
  const [filter, setFilter] = useState('')
  const [sort, setSort] = useState<{ id: string; direction: 'asc' | 'desc' } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(1)
  const rows = useMemo(() => {
    const query = filter.trim().toLowerCase()
    const filtered = query ? data.filter((row) => columns.some((column) => String(column.value(row)).toLowerCase().includes(query))) : [...data]
    if (!sort) return filtered
    const column = columns.find(({ id }) => id === sort.id)
    if (!column) return filtered
    return filtered.sort((left, right) => String(column.value(left)).localeCompare(String(column.value(right)), undefined, { numeric: true }) * (sort.direction === 'asc' ? 1 : -1))
  }, [columns, data, filter, sort])
  const totalPages = pageSize ? Math.max(1, Math.ceil(rows.length / pageSize)) : 1
  const currentPage = Math.min(page, totalPages)
  const displayedRows = pageSize ? rows.slice((currentPage - 1) * pageSize, currentPage * pageSize) : rows
  useEffect(() => { setPage(1) }, [filter, sort])
  useEffect(() => { if (page > totalPages) setPage(totalPages) }, [page, totalPages])
  const virtualizer = useVirtualizer({ count: displayedRows.length, getScrollElement: () => scrollRef.current, estimateSize: () => rowHeight, overscan: 12 })
  const virtualRows = virtualizer.getVirtualItems()
  const renderedRows = virtualRows.length ? virtualRows : displayedRows.map((_, index) => ({ index, key: index, start: index * rowHeight }))

  function toggleSort(id: string) {
    setSort((current) => current?.id === id ? { id, direction: current.direction === 'asc' ? 'desc' : 'asc' } : { id, direction: 'asc' })
  }

  return <section className="iris-table-card">
    <div className="iris-table-toolbar"><input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder={filterPlaceholder} aria-label={filterPlaceholder} /><span>{filter ? `${rows.length} / ${data.length}` : data.length} rows</span></div>
    {!rows.length ? <p className="iris-empty">{filter ? 'No rows match this search.' : emptyLabel}</p> : <>
      <div className="iris-table-head" role="row">
        {columns.map((column) => <button key={column.id} style={{ width: column.width }} className={`iris-table-cell iris-table-cell--${column.align || 'left'}`} onClick={() => toggleSort(column.id)}>{column.label} {sort?.id === column.id ? (sort.direction === 'asc' ? '▲' : '▼') : '⇅'}</button>)}
      </div>
      <div ref={scrollRef} className="iris-table-scroll" style={{ height: Math.min(Math.max(displayedRows.length * rowHeight, rowHeight), 360) }}>
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative', minWidth: columns.reduce((width, column) => width + column.width, 0) }}>
          {renderedRows.map((virtualRow) => {
            const row = displayedRows[virtualRow.index]
            return <div key={virtualRow.key} className={`iris-table-row${onRowClick ? ' iris-table-row--clickable' : ''}`} style={{ height: rowHeight, transform: `translateY(${virtualRow.start}px)` }} onClick={() => onRowClick?.(row)} onKeyDown={(event) => { if (onRowClick && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onRowClick(row) } }} role={onRowClick ? 'button' : 'row'} tabIndex={onRowClick ? 0 : undefined}>
              {columns.map((column) => <div key={column.id} style={{ width: column.width }} className={`iris-table-cell iris-table-cell--${column.align || 'left'}`}>{column.cell(row)}</div>)}
            </div>
          })}
        </div>
      </div>
      {pageSize && totalPages > 1 && <div className="iris-pagination"><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button><span>Page {currentPage} of {totalPages}</span><button disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>Next</button></div>}
    </>}
  </section>
}
