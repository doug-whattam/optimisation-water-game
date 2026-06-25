import type { PlacedAsset } from '@/types'
import { AssetType } from '@/types'
import { useGameStore } from '@/store/gameStore'

const PIPE_RADIUS = 0.06
const PIPE_OPACITY = 0.4
const PIPE_COLOR = '#B0C4DE'
const WATER_COLOR = '#2196F3'

interface Props {
  asset: PlacedAsset
}

export default function PlacedAssetModel({ asset }: Props) {
  const playerState = useGameStore((s) => s.playerState)
  const showWater = playerState === 'simulating' || playerState === 'results'

  const rotationY = -(asset.rotation_degrees * Math.PI) / 180

  return (
    <group rotation={[0, rotationY, 0]}>
      {renderAssetGeometry(asset.asset_type, showWater)}
    </group>
  )
}

function renderAssetGeometry(type: AssetType, showWater: boolean) {
  const halfCell = 0.475

  switch (type) {
    case AssetType.Pipe:
    case AssetType.Straight:
      return (
        <group>
          {/* Pipe from north to south (along Z axis) */}
          <mesh position={[0, PIPE_RADIUS + 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[PIPE_RADIUS, PIPE_RADIUS, halfCell * 2, 12]} />
            <meshPhongMaterial color={PIPE_COLOR} transparent opacity={PIPE_OPACITY} />
          </mesh>
          {showWater && (
            <mesh position={[0, PIPE_RADIUS + 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[PIPE_RADIUS * 0.7, PIPE_RADIUS * 0.7, halfCell * 2, 8]} />
              <meshPhongMaterial color={WATER_COLOR} transparent opacity={0.7} />
            </mesh>
          )}
        </group>
      )

    case AssetType.Elbow:
      return (
        <group>
          {/* North segment (half pipe going up in Z-) */}
          <mesh position={[0, PIPE_RADIUS + 0.02, -halfCell / 2]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[PIPE_RADIUS, PIPE_RADIUS, halfCell, 12]} />
            <meshPhongMaterial color={PIPE_COLOR} transparent opacity={PIPE_OPACITY} />
          </mesh>
          {/* East segment (half pipe going right in X+) */}
          <mesh position={[halfCell / 2, PIPE_RADIUS + 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[PIPE_RADIUS, PIPE_RADIUS, halfCell, 12]} />
            <meshPhongMaterial color={PIPE_COLOR} transparent opacity={PIPE_OPACITY} />
          </mesh>
          {/* Joint sphere */}
          <mesh position={[0, PIPE_RADIUS + 0.02, 0]}>
            <sphereGeometry args={[PIPE_RADIUS * 1.2, 12, 12]} />
            <meshPhongMaterial color={PIPE_COLOR} transparent opacity={PIPE_OPACITY} />
          </mesh>
          {showWater && (
            <>
              <mesh position={[0, PIPE_RADIUS + 0.02, -halfCell / 2]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[PIPE_RADIUS * 0.7, PIPE_RADIUS * 0.7, halfCell, 8]} />
                <meshPhongMaterial color={WATER_COLOR} transparent opacity={0.7} />
              </mesh>
              <mesh position={[halfCell / 2, PIPE_RADIUS + 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[PIPE_RADIUS * 0.7, PIPE_RADIUS * 0.7, halfCell, 8]} />
                <meshPhongMaterial color={WATER_COLOR} transparent opacity={0.7} />
              </mesh>
            </>
          )}
        </group>
      )

    case AssetType.Tee:
      return (
        <group>
          {/* North-South pipe */}
          <mesh position={[0, PIPE_RADIUS + 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[PIPE_RADIUS, PIPE_RADIUS, halfCell * 2, 12]} />
            <meshPhongMaterial color={PIPE_COLOR} transparent opacity={PIPE_OPACITY} />
          </mesh>
          {/* East branch */}
          <mesh position={[halfCell / 2, PIPE_RADIUS + 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[PIPE_RADIUS, PIPE_RADIUS, halfCell, 12]} />
            <meshPhongMaterial color={PIPE_COLOR} transparent opacity={PIPE_OPACITY} />
          </mesh>
          {/* Joint */}
          <mesh position={[0, PIPE_RADIUS + 0.02, 0]}>
            <sphereGeometry args={[PIPE_RADIUS * 1.3, 12, 12]} />
            <meshPhongMaterial color={PIPE_COLOR} transparent opacity={PIPE_OPACITY} />
          </mesh>
          {showWater && (
            <>
              <mesh position={[0, PIPE_RADIUS + 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[PIPE_RADIUS * 0.7, PIPE_RADIUS * 0.7, halfCell * 2, 8]} />
                <meshPhongMaterial color={WATER_COLOR} transparent opacity={0.7} />
              </mesh>
              <mesh position={[halfCell / 2, PIPE_RADIUS + 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[PIPE_RADIUS * 0.7, PIPE_RADIUS * 0.7, halfCell, 8]} />
                <meshPhongMaterial color={WATER_COLOR} transparent opacity={0.7} />
              </mesh>
            </>
          )}
        </group>
      )

    case AssetType.Cross:
      return (
        <group>
          {/* North-South pipe */}
          <mesh position={[0, PIPE_RADIUS + 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[PIPE_RADIUS, PIPE_RADIUS, halfCell * 2, 12]} />
            <meshPhongMaterial color={PIPE_COLOR} transparent opacity={PIPE_OPACITY} />
          </mesh>
          {/* East-West pipe */}
          <mesh position={[0, PIPE_RADIUS + 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[PIPE_RADIUS, PIPE_RADIUS, halfCell * 2, 12]} />
            <meshPhongMaterial color={PIPE_COLOR} transparent opacity={PIPE_OPACITY} />
          </mesh>
          {/* Joint */}
          <mesh position={[0, PIPE_RADIUS + 0.02, 0]}>
            <sphereGeometry args={[PIPE_RADIUS * 1.4, 12, 12]} />
            <meshPhongMaterial color={PIPE_COLOR} transparent opacity={PIPE_OPACITY} />
          </mesh>
          {showWater && (
            <>
              <mesh position={[0, PIPE_RADIUS + 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[PIPE_RADIUS * 0.7, PIPE_RADIUS * 0.7, halfCell * 2, 8]} />
                <meshPhongMaterial color={WATER_COLOR} transparent opacity={0.7} />
              </mesh>
              <mesh position={[0, PIPE_RADIUS + 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[PIPE_RADIUS * 0.7, PIPE_RADIUS * 0.7, halfCell * 2, 8]} />
                <meshPhongMaterial color={WATER_COLOR} transparent opacity={0.7} />
              </mesh>
            </>
          )}
        </group>
      )

    default:
      return null
  }
}
