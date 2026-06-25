import { useState } from 'react'
import { LAND_TYPE_COLORS } from '@/types'
import TerrainProps from './TerrainProps'

interface Props {
  landType: string
  onClick: (e: any) => void
  onContextMenu: (e: any) => void
  isHighlighted: boolean
}

export default function TerrainTile({ landType, onClick, onContextMenu, isHighlighted }: Props) {
  const [hovered, setHovered] = useState(false)
  const baseColor = LAND_TYPE_COLORS[landType] || '#444444'
  const color = hovered && isHighlighted ? '#ffffff' : baseColor
  const opacity = hovered && isHighlighted ? 0.8 : 1.0

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
        onClick={onClick}
        onContextMenu={onContextMenu}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <planeGeometry args={[0.95, 0.95]} />
        <meshLambertMaterial
          color={color}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>
      {/* Highlight border when hovered and can place */}
      {hovered && isHighlighted && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
          <ringGeometry args={[0.42, 0.47, 4]} />
          <meshBasicMaterial color="#4FC3F7" transparent opacity={0.8} />
        </mesh>
      )}
      {/* 3D terrain decorations */}
      <TerrainProps landType={landType} />
    </group>
  )
}
