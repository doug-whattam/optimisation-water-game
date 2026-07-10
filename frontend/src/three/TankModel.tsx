import { Text } from '@react-three/drei'
import { Direction } from '@/types'

interface Props {
  name: string
  fillFraction: number
  showConnection: boolean
  connectionSide: 'left' | 'right'
  /** The direction from which pipework connects to this demand cell (e.g. 'south' means a pipe enters from below) */
  connectingDirection: Direction | null
}

export default function TankModel({ name, fillFraction, showConnection, connectionSide, connectingDirection }: Props) {
  const tankHeight = 1.0
  const tankRadius = 0.3
  const waterHeight = Math.max(fillFraction * tankHeight, 0.01)

  return (
    <group>
      {/* Water fill — rendered FIRST so it appears behind the transparent shell */}
      {fillFraction > 0 && (
        <mesh position={[0, waterHeight / 2, 0]} renderOrder={0}>
          <cylinderGeometry args={[tankRadius * 0.91, tankRadius * 0.91, waterHeight, 16, 1, false]} />
          <meshPhongMaterial color="#1565C0" opacity={0.95} transparent={false} />
        </mesh>
      )}

      {/* Transparent tank shell — depthWrite off so water inside is visible */}
      <mesh position={[0, tankHeight / 2, 0]} renderOrder={1}>
        <cylinderGeometry args={[tankRadius, tankRadius, tankHeight, 16, 1, true]} />
        <meshPhongMaterial
          color="#B0BEC5"
          transparent
          opacity={0.15}
          depthWrite={false}
          side={2}
        />
      </mesh>

      {/* Connection pipework — routes from tank to the cell border where pipe connects */}
      {showConnection && connectingDirection && (
        <TankConnectionPipe
          connectionSide={connectionSide}
          connectingDirection={connectingDirection}
          tankRadius={tankRadius}
        />
      )}

      {/* Label */}
      <Text
        position={[0, tankHeight + 0.2, 0]}
        fontSize={0.12}
        color="#ffffff"
        anchorX="center"
        anchorY="bottom"
      >
        {name}
      </Text>

      {/* Percentage label */}
      <Text
        position={[0, -0.2, 0]}
        fontSize={0.1}
        color="#4FC3F7"
        anchorX="center"
        anchorY="top"
      >
        {`${Math.round(fillFraction * 100)}%`}
      </Text>
    </group>
  )
}

function TankConnectionPipe({
  connectionSide,
  connectingDirection,
  tankRadius,
}: {
  connectionSide: 'left' | 'right'
  connectingDirection: Direction
  tankRadius: number
}) {
  // The tank is offset 0.7 from its demand cell center.
  // We need to route a pipe from the tank to the cell edge where the connecting pipe enters.
  //
  // Strategy:
  // 1. Horizontal pipe from tank edge toward the cell (along X)
  // 2. Elbow at the cell center
  // 3. Pipe from cell center to the cell border in the connecting direction (along Z or X)
  //
  // The cell center is at xDir * 0.7 from our position (since we're at the tank).
  // The cell border in the connecting direction is 0.475 further from cell center.

  const xDir = connectionSide === 'right' ? 1 : -1
  const cellCenterX = xDir * 0.7 // distance to cell center from tank
  const horizPipeLen = cellCenterX - xDir * tankRadius // from tank edge to cell center (unsigned)
  const horizPipeLenAbs = Math.abs(horizPipeLen)

  // Cell border offset from cell center (0.475 = half of 0.95 cell)
  const borderOffset = 0.475

  // Determine the Z offset for the connecting direction
  // North = -Z, South = +Z, East = +X, West = -X
  let endOffsetX = 0
  let endOffsetZ = 0
  let needsSecondSegment = true

  switch (connectingDirection) {
    case Direction.North:
      endOffsetZ = -borderOffset
      break
    case Direction.South:
      endOffsetZ = borderOffset
      break
    case Direction.East:
      endOffsetX = borderOffset
      needsSecondSegment = false // pipe already goes along X
      break
    case Direction.West:
      endOffsetX = -borderOffset
      needsSecondSegment = false
      break
  }

  const pipeY = 0.08

  // For East/West connections from left-side tanks:
  // The horizontal pipe from tank already goes toward the cell.
  // We just need to extend it to the cell's East or West edge.
  if (!needsSecondSegment) {
    // Straight pipe all the way from tank edge to the far cell edge
    const totalLen = Math.abs(cellCenterX) - tankRadius + Math.abs(endOffsetX)
    const pipeCenter = xDir * (tankRadius + totalLen / 2)
    return (
      <group position={[0, pipeY, 0]}>
        <mesh position={[pipeCenter, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.035, 0.035, totalLen, 8]} />
          <meshPhongMaterial color="#90A4AE" transparent opacity={0.6} />
        </mesh>
      </group>
    )
  }

  // For North/South connections: L-shaped pipe
  // Segment 1: horizontal from tank to cell center
  // Segment 2: vertical (Z-axis) from cell center to cell border
  return (
    <group position={[0, pipeY, 0]}>
      {/* Segment 1: Horizontal pipe from tank edge to cell center */}
      <mesh
        position={[xDir * (tankRadius + horizPipeLenAbs / 2), 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.035, 0.035, horizPipeLenAbs, 8]} />
        <meshPhongMaterial color="#90A4AE" transparent opacity={0.6} />
      </mesh>

      {/* Elbow at cell center */}
      <mesh position={[cellCenterX, 0, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshPhongMaterial color="#78909C" />
      </mesh>

      {/* Segment 2: Pipe from cell center to cell border (along Z) */}
      <mesh
        position={[cellCenterX, 0, endOffsetZ / 2]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.035, 0.035, Math.abs(endOffsetZ), 8]} />
        <meshPhongMaterial color="#90A4AE" transparent opacity={0.6} />
      </mesh>
    </group>
  )
}
