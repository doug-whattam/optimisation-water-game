import { useEffect, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'
import * as d3 from 'd3'

export default function ParetoChart() {
  const paretoDesigns = useGameStore((s) => s.paretoDesigns)
  const paretoFrontier = useGameStore((s) => s.paretoFrontier)
  const username = useGameStore((s) => s.username)
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return
    drawChart()
  }, [paretoDesigns, paretoFrontier])

  function drawChart() {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = 280
    const height = 220
    const margin = { top: 20, right: 20, bottom: 40, left: 50 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    if (paretoDesigns.length === 0) {
      g.append('text')
        .attr('x', innerW / 2)
        .attr('y', innerH / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#666')
        .attr('font-size', '12px')
        .text('No designs submitted yet')
      return
    }

    // Scales
    const xExtent = d3.extent(paretoDesigns, (d) => d.total_cost) as [number, number]
    const yExtent = d3.extent(paretoDesigns, (d) => d.hydraulic_penalty) as [number, number]

    const x = d3.scaleLinear().domain([0, xExtent[1] * 1.1]).range([0, innerW])
    const y = d3.scaleLinear().domain([0, Math.max(yExtent[1] * 1.1, 1)]).range([innerH, 0])

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format('~s')))
      .selectAll('text')
      .attr('fill', '#888')
      .attr('font-size', '9px')

    g.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .selectAll('text')
      .attr('fill', '#888')
      .attr('font-size', '9px')

    // Axis labels
    g.append('text')
      .attr('x', innerW / 2)
      .attr('y', innerH + 30)
      .attr('text-anchor', 'middle')
      .attr('fill', '#888')
      .attr('font-size', '10px')
      .text('Total Cost (credits)')

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -innerH / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#888')
      .attr('font-size', '10px')
      .text('Hydraulic Penalty (m)')

    // Pareto frontier line
    if (paretoFrontier.length > 1) {
      const line = d3.line<{ total_cost: number; hydraulic_penalty: number }>()
        .x((d) => x(d.total_cost))
        .y((d) => y(d.hydraulic_penalty))

      g.append('path')
        .datum(paretoFrontier)
        .attr('fill', 'none')
        .attr('stroke', '#4FC3F7')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,4')
        .attr('d', line)
    }

    // Data points
    const tooltip = d3.select('body').append('div')
      .attr('class', 'pareto-tooltip')
      .style('position', 'absolute')
      .style('background', '#1a1a2e')
      .style('border', '1px solid #4FC3F7')
      .style('border-radius', '6px')
      .style('padding', '8px 12px')
      .style('font-size', '11px')
      .style('color', '#eee')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', '1000')

    g.selectAll('circle')
      .data(paretoDesigns)
      .join('circle')
      .attr('cx', (d) => x(d.total_cost))
      .attr('cy', (d) => y(d.hydraulic_penalty))
      .attr('r', (d) => (d.is_pareto_optimal ? 6 : 4))
      .attr('fill', (d) =>
        d.player_username === username ? '#4FC3F7' : d.is_pareto_optimal ? '#FFD700' : '#888'
      )
      .attr('stroke', (d) => (d.is_pareto_optimal ? '#FFD700' : 'none'))
      .attr('stroke-width', 1.5)
      .attr('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        tooltip
          .style('opacity', 1)
          .html(
            `<strong>${d.player_username}</strong> — Plan #${d.plan_number}<br/>` +
            `Cost: ${d.total_cost.toLocaleString()}<br/>` +
            `Penalty: ${d.hydraulic_penalty.toFixed(2)}m` +
            (d.is_pareto_optimal ? '<br/><em style="color:#FFD700">⭐ Pareto Optimal</em>' : '')
          )
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 40}px`)
      })
      .on('mouseout', () => {
        tooltip.style('opacity', 0)
      })

    return () => {
      tooltip.remove()
    }
  }

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Pareto Curve</h3>
      <div className="bg-[#1a1a2e] rounded-lg p-2">
        <svg ref={svgRef} />
      </div>
      <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-water-light rounded-full inline-block" /> You</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-400 rounded-full inline-block" /> Optimal</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-gray-500 rounded-full inline-block" /> Others</span>
      </div>
    </div>
  )
}
