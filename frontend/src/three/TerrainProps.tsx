/**
 * 3D terrain props for each land type - low-poly decorations.
 */

interface Props {
  landType: string
}

export default function TerrainProps({ landType }: Props) {
  switch (landType) {
    case 'forest':
      return <ForestProps />
    case 'urban':
      return <UrbanProps />
    case 'suburban':
      return <SuburbanProps />
    case 'rural':
      return <RuralProps />
    case 'railway':
      return <RailwayProps />
    case 'river':
      return <RiverProps />
    case 'cultural_heritage':
      return <HeritageProps />
    default:
      return null
  }
}

function ForestProps() {
  // Multiple low-poly trees
  const trees = [
    { x: -0.2, z: -0.2, scale: 0.8 },
    { x: 0.15, z: 0.1, scale: 1.0 },
    { x: -0.1, z: 0.25, scale: 0.6 },
  ]
  return (
    <group>
      {trees.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]} scale={t.scale}>
          {/* Trunk */}
          <mesh position={[0, 0.1, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.03, 0.2, 6]} />
            <meshLambertMaterial color="#5D4037" />
          </mesh>
          {/* Canopy - cone */}
          <mesh position={[0, 0.28, 0]} castShadow>
            <coneGeometry args={[0.1, 0.25, 6]} />
            <meshLambertMaterial color="#2E7D32" />
          </mesh>
          <mesh position={[0, 0.4, 0]} castShadow>
            <coneGeometry args={[0.07, 0.18, 6]} />
            <meshLambertMaterial color="#388E3C" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function UrbanProps() {
  // Low-poly buildings
  return (
    <group>
      <mesh position={[-0.15, 0.2, -0.1]} castShadow>
        <boxGeometry args={[0.2, 0.4, 0.15]} />
        <meshLambertMaterial color="#616161" />
      </mesh>
      <mesh position={[0.1, 0.15, 0.15]} castShadow>
        <boxGeometry args={[0.15, 0.3, 0.2]} />
        <meshLambertMaterial color="#78909C" />
      </mesh>
      <mesh position={[0.15, 0.08, -0.2]} castShadow>
        <boxGeometry args={[0.12, 0.16, 0.12]} />
        <meshLambertMaterial color="#90A4AE" />
      </mesh>
    </group>
  )
}

function SuburbanProps() {
  // Small houses
  return (
    <group>
      <mesh position={[-0.15, 0.06, 0.1]} castShadow>
        <boxGeometry args={[0.15, 0.12, 0.12]} />
        <meshLambertMaterial color="#FFCC80" />
      </mesh>
      {/* Roof */}
      <mesh position={[-0.15, 0.14, 0.1]} rotation={[0, 0, 0]} castShadow>
        <coneGeometry args={[0.1, 0.08, 4]} />
        <meshLambertMaterial color="#D32F2F" />
      </mesh>
      <mesh position={[0.15, 0.05, -0.15]} castShadow>
        <boxGeometry args={[0.12, 0.1, 0.1]} />
        <meshLambertMaterial color="#FFE0B2" />
      </mesh>
      <mesh position={[0.15, 0.12, -0.15]} castShadow>
        <coneGeometry args={[0.08, 0.06, 4]} />
        <meshLambertMaterial color="#C62828" />
      </mesh>
    </group>
  )
}

function RuralProps() {
  // Small farmhouse + fence
  return (
    <group>
      <mesh position={[0, 0.05, 0]} castShadow>
        <boxGeometry args={[0.12, 0.1, 0.1]} />
        <meshLambertMaterial color="#A1887F" />
      </mesh>
      <mesh position={[0, 0.12, 0]} castShadow>
        <coneGeometry args={[0.08, 0.06, 4]} />
        <meshLambertMaterial color="#795548" />
      </mesh>
      {/* Fence posts */}
      {[-0.3, -0.15, 0.15, 0.3].map((x, i) => (
        <mesh key={i} position={[x, 0.03, 0.35]} castShadow>
          <boxGeometry args={[0.01, 0.06, 0.01]} />
          <meshLambertMaterial color="#5D4037" />
        </mesh>
      ))}
    </group>
  )
}

function RailwayProps() {
  // Railway tracks
  return (
    <group>
      {/* Rails */}
      <mesh position={[0, 0.01, -0.1]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.9, 0.01, 0.03]} />
        <meshLambertMaterial color="#4E342E" />
      </mesh>
      <mesh position={[0, 0.01, 0.1]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.9, 0.01, 0.03]} />
        <meshLambertMaterial color="#4E342E" />
      </mesh>
      {/* Sleepers */}
      {[-0.35, -0.2, -0.05, 0.1, 0.25].map((x, i) => (
        <mesh key={i} position={[x, 0.005, 0]}>
          <boxGeometry args={[0.06, 0.01, 0.3]} />
          <meshLambertMaterial color="#3E2723" />
        </mesh>
      ))}
    </group>
  )
}

function RiverProps() {
  // Animated-looking water surface (flat blue with wave-like bumps)
  return (
    <group>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.9, 0.9]} />
        <meshPhongMaterial color="#1565C0" transparent opacity={0.7} shininess={80} />
      </mesh>
      {/* Some wave highlights */}
      <mesh position={[-0.1, 0.015, 0.1]} rotation={[-Math.PI / 2, 0, 0.2]}>
        <planeGeometry args={[0.15, 0.03]} />
        <meshBasicMaterial color="#42A5F5" transparent opacity={0.5} />
      </mesh>
      <mesh position={[0.2, 0.015, -0.15]} rotation={[-Math.PI / 2, 0, -0.1]}>
        <planeGeometry args={[0.12, 0.025]} />
        <meshBasicMaterial color="#42A5F5" transparent opacity={0.5} />
      </mesh>
    </group>
  )
}

function HeritageProps() {
  // Heritage pillars/monument
  return (
    <group>
      {/* Base platform */}
      <mesh position={[0, 0.02, 0]} castShadow>
        <boxGeometry args={[0.3, 0.04, 0.3]} />
        <meshLambertMaterial color="#BDB76B" />
      </mesh>
      {/* Pillar */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 0.22, 8]} />
        <meshLambertMaterial color="#DAA520" />
      </mesh>
      {/* Capital */}
      <mesh position={[0, 0.27, 0]} castShadow>
        <boxGeometry args={[0.1, 0.03, 0.1]} />
        <meshLambertMaterial color="#DAA520" />
      </mesh>
    </group>
  )
}
