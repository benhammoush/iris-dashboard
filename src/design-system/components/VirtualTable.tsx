import { useVirtualizer } from '@tanstack/react-virtual'
import { type ReactNode, useMemo, useRef, useState } from 'react'

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
}

export default function VirtualTable<T>({ columns, data, emptyLabel, filterPlaceholder, onRowClick, rowHeight = 42 }: Props<T>) {
  const [filter, setFilter] = useState('')
  const [sort, setSort] = useState<{ id: string; direction: 'asc' | 'desc' } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const rows = useMemo(() => {
    const query = filter.trim().toLowerCase()
    const filtered = query ? data.filter((row) => columns.some((column) => String(column.value(row)).toLowerCase().includes(query))) : [...data]
    if (!sort) return filtered
    const column = columns.find(({ id }) => id === sort.id)
    if (!column) return filtered
    return filtered.sort((left, right) => String(column.value(left)).localeCompare(String(column.value(right)), undefined, { numeric: true }) * (sort.direction === 'asc' ? 1 : -1))
  }, [columns, data, filter, sort])
  const virtualizer = useVirtualizer({ count: rows.length, getScrollElement: () => scrollRef.current, estimateSize: () => rowHeight, overscan: 12 })
  const virtualRows = virtualizer.getVirtualItems()
  const renderedRows = virtualRows.length ? virtualRows : rows.map((_, index) => ({ index, key: index, start: index * rowHeight }))

  function toggleSort(id: string) {
    setSort((current) => current?.id === id ? { id, direction: current.direction === 'asc' ? 'desc' : 'asc' } : { id, direction: 'asc' })
  }

  return <section className="iris-table-card">
    <div className="iris-table-toolbar"><input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder={filterPlaceholder} aria-label={filterPlaceholder} /><span>{filter ? `${rows.length} / ${data.length}` : data.length} rows</span></div>
    {!rows.length ? <p className="iris-empty">{filter ? 'No rows match this search.' : emptyLabel}</p> : <>
      <div className="iris-table-head" role="row">
        {columns.map((column) => <button key={column.id} style={{ width: column.width }} className={`iris-table-cell iris-table-cell--${column.align || 'left'}`} onClick={() => toggleSort(column.id)}>{column.label} {sort?.id === column.id ? (sort.direction === 'asc' ? '▲' : '▼') : '⇅'}</button>)}
      </div>
      <div ref={scrollRef} className="iris-table-scroll" style={{ height: Math.min(Math.max(rows.length * rowHeight, rowHeight), 360) }}>
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative', minWidth: columns.reduce((width, column) => width + column.width, 0) }}>
          {renderedRows.map((virtualRow) => {
            const row = rows[virtualRow.index]
            return <div key={virtualRow.key} className={`iris-table-row${onRowClick ? ' iris-table-row--clickable' : ''}`} style={{ height: rowHeight, transform: `translateY(${virtualRow.start}px)` }} onClick={() => onRowClick?.(row)} role={onRowClick ? 'button' : 'row'}>
              {columns.map((column) => <div key={column.id} style={{ width: column.width }} className={`iris-table-cell iris-table-cell--${column.align || 'left'}`}>{column.cell(row)}</div>)}
            </div>
          })}
        </div>
      </div>
    </>}
  </section>
}
