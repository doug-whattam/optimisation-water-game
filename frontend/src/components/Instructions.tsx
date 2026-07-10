import { useState } from 'react'

export default function Instructions() {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="p-4 border-b border-gray-700">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-sm font-semibold text-gray-400 uppercase tracking-wide"
      >
        <span>📋 How to Play</span>
        <span className="text-xs">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="mt-3 space-y-2 text-xs text-gray-300 leading-relaxed">
          <p>
            <strong className="text-water-light">Goal:</strong> Supply water to all four
            customer tanks (Residential, Hospital, Industrial, Commercial) at the
            <strong> lowest cost</strong> with the <strong>best hydraulic performance</strong> (all tanks full).
          </p>
          <ol className="list-decimal list-inside space-y-1 text-gray-400">
            <li>Pick a pipe or connector from the palette.</li>
            <li>Click cells to lay pipework from the reservoir (top-left, cell A1) out to each tank.</li>
            <li>Click a placed piece to rotate it; right-click to remove.</li>
            <li>Green dots = connected ports. Red dots = misaligned.</li>
            <li>Watch your budget — different land costs more to build on.</li>
            <li>Hit <strong className="text-cyan-400">Open Reservoir Valve</strong> to run the simulation.</li>
          </ol>
          <p className="text-gray-400">
            The valve closes when the first tank reaches its 5m target. Any tank below 5m
            scores a <strong className="text-red-400">penalty</strong>. Lower cost + lower penalty = better!
          </p>
        </div>
      )}
    </div>
  )
}
