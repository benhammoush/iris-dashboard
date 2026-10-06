import { CandlestickSeries, ColorType, createChart, HistogramSeries, type Time } from 'lightweight-charts'
import { useEffect, useRef } from 'react'
import { useTheme } from '../ThemeProvider'

export interface CandleChartPoint {
  timestamp: string
  openUsd: number
  highUsd: number
  lowUsd: number
  closeUsd: number
  volumeUsd: number
}

interface Props {
  candles: CandleChartPoint[]
  height?: number
  valueFormatter?: (value: number) => string
}

function asChartCandles(candles: CandleChartPoint[]) {
  return candles.flatMap((candle) => {
    const timestamp = new Date(candle.timestamp).getTime()
    return Number.isFinite(timestamp) && [candle.openUsd, candle.highUsd, candle.lowUsd, candle.closeUsd, candle.volumeUsd].every(Number.isFinite)
      ? [{ time: Math.floor(timestamp / 1000) as Time, open: candle.openUsd, high: candle.highUsd, low: candle.lowUsd, close: candle.closeUsd, value: candle.volumeUsd }]
      : []
  })
}

export default function CandlestickChart({ candles, height = 360, valueFormatter }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { mode } = useTheme()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    const style = getComputedStyle(document.documentElement)
    const color = (name: string) => style.getPropertyValue(name).trim()
    const chart = createChart(container, {
      autoSize: true,
      height,
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: color('--iris-muted') },
      grid: { vertLines: { color: color('--iris-border') }, horzLines: { color: color('--iris-border') } },
      rightPriceScale: { borderColor: color('--iris-border'), scaleMargins: { top: 0.08, bottom: 0.26 } },
      timeScale: { borderColor: color('--iris-border'), timeVisible: true },
      handleScroll: { vertTouchDrag: false },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    })
    const series = chart.addSeries(CandlestickSeries, {
      upColor: color('--iris-green'),
      downColor: color('--iris-red'),
      borderVisible: false,
      wickUpColor: color('--iris-green'),
      wickDownColor: color('--iris-red'),
      priceFormat: valueFormatter ? { type: 'custom', formatter: valueFormatter } : undefined,
    })
    const volume = chart.addSeries(HistogramSeries, { priceScaleId: 'volume', priceFormat: { type: 'volume' } })
    chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.78, bottom: 0 } })
    const data = asChartCandles(candles)
    series.setData(data.map(({ value, ...candle }) => candle))
    volume.setData(data.map(({ time, value, open, close }) => ({ time, value, color: close >= open ? `${color('--iris-green')}88` : `${color('--iris-red')}88` })))
    chart.timeScale().fitContent()

    return () => chart.remove()
  }, [candles, height, mode, valueFormatter])

  return <div ref={containerRef} style={{ height, width: '100%' }} aria-label="Historical candlestick chart with USD trading volume" />
}
