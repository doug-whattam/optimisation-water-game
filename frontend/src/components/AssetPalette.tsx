import { useGameStore } from '@/store/gameStore'
import {
  ASSET_COSTS,
  ASSET_LABELS,
  ASSET_PORTS,
  ASSET_SHORTCUTS,
  AssetType,
  Direction,
} from '@/types'

const ASSETS = Object.values(AssetType)

/**
 * Asset picker.
 *
 * The icons are generated from ASSET_PORTS rather than drawn by hand, so they
 * always agree with the connectivity rules, and they rotate with the pending
 * rotation — which means the palette shows the same orientation the player is
 * about to place. The previous version used box-drawing characters (│ ╗ ╠ ╬)
 * that neither matched the 3D geometry nor reflected rotation.
 *
 * `compact` lays the pieces out as a single row of tiles for the phone dock,
 * where vertical space is what the board needs.
 */
export default function AssetPalette({ compact = false }: { compact?: boolean }) {
  const selectedAssetType = useGameStore((s) => s.selectedAssetType)
  const selectAssetType = useGameStore((s) => s.selectAssetType)
  const pendingRotation = useGameStore((s) => s.pendingRotation)
  const rotatePending = useGameStore((s) => s.rotatePending)
  const eraseMode = useGameStore((s) => s.eraseMode)
  const setEraseMode = useGameStore((s) => s.setEraseMode)
  const playerState = useGameStore((s) => s.playerState)

  const disabled = playerState !== 'designing'

  const tools = (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => setEraseMode(!eraseMode)}
        disabled={disabled}
        aria-pressed={eraseMode}
        className={`btn-ghost flex items-center gap-1.5 ${
          eraseMode ? '!border-bad/60 !bg-bad/15 !text-bad' : ''
        }`}
        title="Erase tool: tap or drag over pieces to remove them"
      >
        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M8 17h9" />
          <path d="M3.5 12.5l7-7a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8L10 16H7l-3.5-3.5z" />
        </svg>
        Erase
      </button>
      <button
        onClick={rotatePending}
        disabled={disabled || !selectedAssetType}
        className="btn-ghost flex items-center gap-1.5"
        title="Rotate the piece you are about to place (R)"
      >
        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
          <path d="M16 10a6 6 0 1 1-1.8-4.2" />
          <path d="M16 3v3.2h-3.2" />
        </svg>
        {pendingRotation}°
        <span className="kbd ml-0.5">R</span>
      </button>
    </div>
  )

  if (compact) {
    return (
      <div className="px-3 py-2.5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="section-title">Assets</h3>
          {tools}
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {ASSETS.map((type) => {
            const isSelected = selectedAssetType === type
            return (
              <button
                key={type}
                onClick={() => selectAssetType(isSelected ? null : type)}
                disabled={disabled}
                aria-pressed={isSelected}
                aria-label={`${ASSET_LABELS[type]}, ${ASSET_COSTS[type].toLocaleString()} credits`}
                className={`flex flex-col items-center gap-1 rounded-lg border px-1 py-1.5 transition-all ${
                  disabled
                    ? 'cursor-not-allowed border-transparent opacity-40'
                    : isSelected
                      ? 'border-water/60 bg-water/12 shadow-glow'
                      : 'border-ink-700 bg-ink-900/50 active:bg-ink-800'
                }`}
              >
                <PortIcon type={type} rotation={isSelected ? pendingRotation : 0} active={isSelected} />
                <span
                  className={`w-full truncate text-center text-[11px] font-medium leading-tight ${
                    isSelected ? 'text-water-light' : 'text-slate-200'
                  }`}
                >
                  {ASSET_LABELS[type].replace(' Connector', '')}
                </span>
                <span className="stat text-[10px] leading-none text-slate-500">
                  {(ASSET_COSTS[type] / 1000).toFixed(1)}k
                </span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="panel-section">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="section-title">Assets</h3>
        {tools}
      </div>

      <div className="space-y-1.5">
        {ASSETS.map((type) => {
          const isSelected = selectedAssetType === type
          return (
            <button
              key={type}
              onClick={() => selectAssetType(isSelected ? null : type)}
              disabled={disabled}
              aria-pressed={isSelected}
              className={`group flex w-full items-center gap-3 rounded-lg border px-2.5 py-2 text-left transition-all ${
                disabled
                  ? 'cursor-not-allowed border-transparent opacity-40'
                  : isSelected
                    ? 'border-water/60 bg-water/12 shadow-glow'
                    : 'border-ink-700 bg-ink-900/50 hover:border-ink-600 hover:bg-ink-800'
              }`}
            >
              <PortIcon
                type={type}
                rotation={isSelected ? pendingRotation : 0}
                active={isSelected}
              />

              <span className="min-w-0 flex-1">
                <span
                  className={`block truncate text-sm font-medium ${
                    isSelected ? 'text-water-light' : 'text-slate-200'
                  }`}
                >
                  {ASSET_LABELS[type]}
                </span>
                <span className="stat block text-[11px] text-slate-500">
                  {ASSET_COSTS[type].toLocaleString()} cr
                </span>
              </span>

              <span className="kbd">{ASSET_SHORTCUTS[type]}</span>
            </button>
          )
        })}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
        Drag across tiles to lay a run. Right-drag (or the Erase tool) removes. Click a placed
        piece to rotate it.
      </p>
    </div>
  )
}

/** Direction unit vectors in icon space (y grows downward in SVG). */
const DIR_VEC: Record<Direction, [number, number]> = {
  [Direction.North]: [0, -1],
  [Direction.East]: [1, 0],
  [Direction.South]: [0, 1],
  [Direction.West]: [-1, 0],
}

const CLOCKWISE: Direction[] = [Direction.North, Direction.East, Direction.South, Direction.West]

function rotateDir(dir: Direction, degrees: number): Direction {
  const steps = ((degrees / 90) % 4 + 4) % 4
  return CLOCKWISE[(CLOCKWISE.indexOf(dir) + steps) % 4]
}

/**
 * Schematic of an asset's connection faces, derived from ASSET_PORTS.
 * An elbow is drawn as a curve to match the 3D bend rather than a hard corner.
 */
function PortIcon({
  type,
  rotation,
  active,
}: {
  type: AssetType
  rotation: number
  active: boolean
}) {
  const size = 30
  const c = size / 2
  const reach = 11
  const ports = ASSET_PORTS[type].map((d) => rotateDir(d, rotation))
  const stroke = active ? '#7dd3fc' : '#94a3b8'

  const isElbow = type === AssetType.Elbow
  const [a, b] = ports

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0 rounded-md bg-ink-950/70 ring-1 ring-inset ring-ink-700"
      aria-hidden
    >
      {isElbow ? (
        // Quarter arc between the two open faces, bowed through the centre.
        <path
          d={`M ${c + DIR_VEC[a][0] * reach} ${c + DIR_VEC[a][1] * reach}
              Q ${c} ${c} ${c + DIR_VEC[b][0] * reach} ${c + DIR_VEC[b][1] * reach}`}
          fill="none"
          stroke={stroke}
          strokeWidth="3"
          strokeLinecap="round"
        />
      ) : (
        ports.map((dir) => {
          const [dx, dy] = DIR_VEC[dir]
          return (
            <line
              key={dir}
              x1={c}
              y1={c}
              x2={c + dx * reach}
              y2={c + dy * reach}
              stroke={stroke}
              strokeWidth="3"
              strokeLinecap="round"
            />
          )
        })
      )}

      {/* Face pips mark where a neighbour must present a matching port */}
      {ports.map((dir) => {
        const [dx, dy] = DIR_VEC[dir]
        return (
          <circle
            key={`p-${dir}`}
            cx={c + dx * reach}
            cy={c + dy * reach}
            r="1.9"
            fill={active ? '#e0f2fe' : '#cbd5e1'}
          />
        )
      })}
    </svg>
  )
}
