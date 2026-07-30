import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { useGameStore } from '@/store/gameStore'
import type { ParetoPoint } from '@/types'

interface Hover {
  point: ParetoPoint
  x: number
  y: number
}

/**
 * Cost versus hydraulic penalty, with the non-dominated frontier drawn through it.
 *
 * Two fixes from the previous implementation:
 *
 *  - The tooltip was a `div` appended to `document.body` on every redraw. The
 *    cleanup function that would have removed it was returned from a plain
 *    helper rather than from the effect, so it was silently discarded and each
 *    redraw leaked another node. The tooltip is now React state positioned
 *    relative to the chart, which removes the leak and the stray z-index.
 *  - The chart was a fixed 280px. It now measures its container, so it fills the
 *    rail at any width.
 */
export default function ParetoChart() {
  const paretoDesigns = useGameStore((s) => s.paretoDesigns)
  const paretoFrontier = useGameStore((s) => s.paretoFrontier)
  const username = useGameStore((s) => s.username)

  const wrapRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [width, setWidth] = useState(288)
  const [hover, setHover] = useState<Hover | null>(null)

  // Track the container width so the plot fills the rail.
  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.max(200, entry.contentRect.width))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const height = 216
    const margin = { top: 12, right: 12, bottom: 34, left: 46 }
    const innerW = Math.max(10, width - margin.left - margin.right)
    const innerH = height - margin.top - margin.bottom

    svg.attr('width', width).attr('height', height)
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    if (paretoDesigns.length === 0) {
      g.append('text')
        .attr('x', innerW / 2)
        .attr('y', innerH / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#64748b')
        .attr('font-size', '11px')
        .text('No plans submitted yet')
      return
    }

    const maxCost = d3.max(paretoDesigns, (d) => d.total_cost) ?? 1
    const maxPenalty = d3.max(paretoDesigns, (d) => d.hydraulic_penalty) ?? 1

    const x = d3.scaleLinear().domain([0, maxCost * 1.08]).nice().range([0, innerW])
    const y = d3.scaleLinear().domain([0, Math.max(maxPenalty * 1.12, 1)]).nice().range([innerH, 0])

    // Gridlines first, so data sits on top.
    g.append('g')
      .attr('stroke', '#1d2a48')
      .attr('stroke-dasharray', '2,3')
      .call((sel) => {
        y.ticks(5).forEach((t) => {
          sel
            .append('line')
            .attr('x1', 0)
            .attr('x2', innerW)
            .attr('y1', y(t))
            .attr('y2', y(t))
        })
        x.ticks(4).forEach((t) => {
          sel.append('line').attr('y1', 0).attr('y2', innerH).attr('x1', x(t)).attr('x2', x(t))
        })
      })

    const axisColor = '#334155'
    const labelColor = '#64748b'

    const xAxis = g
      .append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(4).tickFormat(d3.format('~s')).tickSizeOuter(0))
    xAxis.selectAll('text').attr('fill', labelColor).attr('font-size', '9px')
    xAxis.selectAll('line,path').attr('stroke', axisColor)

    const yAxis = g.append('g').call(d3.axisLeft(y).ticks(5).tickSizeOuter(0))
    yAxis.selectAll('text').attr('fill', labelColor).attr('font-size', '9px')
    yAxis.selectAll('line,path').attr('stroke', axisColor)

    g.append('text')
      .attr('x', innerW / 2)
      .attr('y', innerH + 28)
      .attr('text-anchor', 'middle')
      .attr('fill', labelColor)
      .attr('font-size', '9.5px')
      .text('Total cost (credits)')

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerH / 2)
      .attr('y', -34)
      .attr('text-anchor', 'middle')
      .attr('fill', labelColor)
      .attr('font-size', '9.5px')
      .text('Hydraulic penalty (m)')

    // Frontier: sort by cost so the path reads left to right.
    if (paretoFrontier.length > 1) {
      const sorted = [...paretoFrontier].sort((a, b) => a.total_cost - b.total_cost)
      const line = d3
        .line<{ total_cost: number; hydraulic_penalty: number }>()
        .x((d) => x(d.total_cost))
        .y((d) => y(d.hydraulic_penalty))
        .curve(d3.curveStepAfter)

      g.append('path')
        .datum(sorted)
        .attr('fill', 'none')
        .attr('stroke', '#fcd34d')
        .attr('stroke-width', 1.6)
        .attr('stroke-dasharray', '5,4')
        .attr('opacity', 0.8)
        .attr('d', line)
    }

    // Ideal corner marker: the unreachable optimum both objectives point at.
    g.append('circle').attr('cx', 0).attr('cy', innerH).attr('r', 3).attr('fill', '#34d399').attr('opacity', 0.5)

    const points = g
      .selectAll('circle.pt')
      .data(paretoDesigns)
      .join('circle')
      .attr('class', 'pt')
      .attr('cx', (d) => x(d.total_cost))
      .attr('cy', (d) => y(d.hydraulic_penalty))
      .attr('r', (d) => (d.is_pareto_optimal ? 5 : 3.5))
      .attr('fill', (d) =>
        d.player_username === username ? '#38bdf8' : d.is_pareto_optimal ? '#fcd34d' : '#475569',
      )
      .attr('stroke', (d) => (d.player_username === username ? '#e0f2fe' : 'none'))
      .attr('stroke-width', 1.2)
      .attr('cursor', 'pointer')

    points
      .on('pointerenter', function (_event, d) {
        d3.select(this).attr('r', d.is_pareto_optimal ? 7 : 5.5)
        setHover({
          point: d,
          x: margin.left + x(d.total_cost),
          y: margin.top + y(d.hydraulic_penalty),
        })
      })
      .on('pointerleave', function (_event, d) {
        d3.select(this).attr('r', d.is_pareto_optimal ? 5 : 3.5)
        setHover(null)
      })
  }, [paretoDesigns, paretoFrontier, username, width])

  return (
    <div className="panel-section">
      <div className="mb-2.5 flex items-baseline justify-between">
        <h3 className="section-title">Pareto front</h3>
        <span className="text-[11px] text-slate-500">
          {paretoDesigns.length} {paretoDesigns.length === 1 ? 'plan' : 'plans'}
        </span>
      </div>

      <div ref={wrapRef} className="relative rounded-lg border border-ink-700 bg-ink-950/70 p-1">
        <svg ref={svgRef} role="img" aria-label="Cost versus hydraulic penalty scatter plot" />

        {hover && (
          <div
            className="pointer-events-none absolute z-10 w-max max-w-[200px] -translate-x-1/2 -translate-y-full
              rounded-lg border border-water/40 bg-ink-900/97 px-2.5 py-1.5 shadow-panel"
            style={{ left: hover.x, top: hover.y - 8 }}
          >
            <div className="text-xs font-semibold text-slate-100">
              {hover.point.player_username}
              <span className="ml-1 font-normal text-slate-500">#{hover.point.plan_number}</span>
            </div>
            <div className="stat mt-0.5 text-[11px] text-slate-400">
              {hover.point.total_cost.toLocaleString()} cr ·{' '}
              {hover.point.hydraulic_penalty.toFixed(2)} m
            </div>
            {hover.point.is_pareto_optimal && (
              <div className="mt-0.5 text-[10px] font-medium text-gold">Non-dominated</div>
            )}
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500">
        <Key color="bg-water" label="You" />
        <Key color="bg-gold" label="Non-dominated" />
        <Key color="bg-slate-600" label="Dominated" />
        <span className="text-slate-600">Lower-left is better</span>
      </div>
    </div>
  )
}

function Key({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${color}`} aria-hidden />
      {label}
    </span>
  )
}
