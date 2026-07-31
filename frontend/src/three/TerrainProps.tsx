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
    case 'residential_demand':
      return <ResidentialDemandProps />
    case 'hospital_demand':
      return <HospitalDemandProps />
    case 'industrial_demand':
      return <IndustrialDemandProps />
    case 'commercial_demand':
      return <CommercialDemandProps />
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
            <meshStandardMaterial roughness={0.8} metalness={0} color="#5D4037" />
          </mesh>
          {/* Canopy - cone */}
          <mesh position={[0, 0.28, 0]} castShadow>
            <coneGeometry args={[0.1, 0.25, 6]} />
            <meshStandardMaterial roughness={0.8} metalness={0} color="#2E7D32" />
          </mesh>
          <mesh position={[0, 0.4, 0]} castShadow>
            <coneGeometry args={[0.07, 0.18, 6]} />
            <meshStandardMaterial roughness={0.8} metalness={0} color="#388E3C" />
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
        <meshStandardMaterial roughness={0.8} metalness={0} color="#616161" />
      </mesh>
      <mesh position={[0.1, 0.15, 0.15]} castShadow>
        <boxGeometry args={[0.15, 0.3, 0.2]} />
        <meshStandardMaterial roughness={0.8} metalness={0} color="#78909C" />
      </mesh>
      <mesh position={[0.15, 0.08, -0.2]} castShadow>
        <boxGeometry args={[0.12, 0.16, 0.12]} />
        <meshStandardMaterial roughness={0.8} metalness={0} color="#90A4AE" />
      </mesh>
    </group>
  )
}

function SuburbanProps() {
  // Houses with gardens and bushes
  return (
    <group>
      {/* House 1 */}
      <mesh position={[-0.2, 0.06, 0.1]} castShadow>
        <boxGeometry args={[0.16, 0.12, 0.14]} />
        <meshStandardMaterial roughness={0.8} metalness={0} color="#FFCC80" />
      </mesh>
      <mesh position={[-0.2, 0.14, 0.1]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.12, 0.08, 4]} />
        <meshStandardMaterial roughness={0.8} metalness={0} color="#D32F2F" />
      </mesh>
      {/* Door */}
      <mesh position={[-0.2, 0.03, 0.17]}>
        <boxGeometry args={[0.03, 0.06, 0.005]} />
        <meshStandardMaterial roughness={0.8} metalness={0} color="#5D4037" />
      </mesh>
      {/* House 2 */}
      <mesh position={[0.18, 0.05, -0.15]} castShadow>
        <boxGeometry args={[0.13, 0.1, 0.12]} />
        <meshStandardMaterial roughness={0.8} metalness={0} color="#FFE0B2" />
      </mesh>
      <mesh position={[0.18, 0.12, -0.15]} rotation={[0, 0, 0]} castShadow>
        <coneGeometry args={[0.09, 0.06, 4]} />
        <meshStandardMaterial roughness={0.8} metalness={0} color="#C62828" />
      </mesh>
      {/* Bushes (green spheres) */}
      <mesh position={[-0.05, 0.025, -0.3]} castShadow>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial roughness={0.8} metalness={0} color="#4CAF50" />
      </mesh>
      <mesh position={[0.05, 0.02, 0.3]} castShadow>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshStandardMaterial roughness={0.8} metalness={0} color="#388E3C" />
      </mesh>
      <mesh position={[0.3, 0.025, 0.2]} castShadow>
        <sphereGeometry args={[0.035, 6, 6]} />
        <meshStandardMaterial roughness={0.8} metalness={0} color="#43A047" />
      </mesh>
      {/* Small garden path */}
      <mesh position={[-0.2, 0.005, 0.25]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.04, 0.12]} />
        <meshStandardMaterial roughness={0.8} metalness={0} color="#9E9E9E" />
      </mesh>
    </group>
  )
}

function RuralProps() {
  // Farm fields with animals
  return (
    <group>
      {/* Farmhouse */}
      <mesh position={[-0.2, 0.05, -0.2]} castShadow>
        <boxGeometry args={[0.14, 0.1, 0.1]} />
        <meshStandardMaterial roughness={0.8} metalness={0} color="#A1887F" />
      </mesh>
      <mesh position={[-0.2, 0.12, -0.2]} castShadow>
        <coneGeometry args={[0.09, 0.06, 4]} />
        <meshStandardMaterial roughness={0.8} metalness={0} color="#795548" />
      </mesh>
      {/* Field rows (crops) */}
      {[-0.05, 0.08, 0.21].map((z, i) => (
        <mesh key={`row-${i}`} position={[0.1, 0.01, z]}>
          <boxGeometry args={[0.3, 0.02, 0.06]} />
          <meshStandardMaterial roughness={0.8} metalness={0} color="#558B2F" />
        </mesh>
      ))}
      {/* Sheep (small white blobs) */}
      <mesh position={[0.25, 0.03, -0.15]} castShadow>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshStandardMaterial roughness={0.8} metalness={0} color="#FAFAFA" />
      </mesh>
      <mesh position={[0.3, 0.03, -0.08]} castShadow>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshStandardMaterial roughness={0.8} metalness={0} color="#FAFAFA" />
      </mesh>
      {/* Cow (brown blob) */}
      <mesh position={[-0.3, 0.03, 0.2]} castShadow>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshStandardMaterial roughness={0.8} metalness={0} color="#6D4C41" />
      </mesh>
      {/* Fence posts */}
      {[-0.35, -0.2, -0.05, 0.1, 0.25, 0.4].map((x, i) => (
        <mesh key={i} position={[x, 0.025, 0.38]} castShadow>
          <boxGeometry args={[0.01, 0.05, 0.01]} />
          <meshStandardMaterial roughness={0.8} metalness={0} color="#5D4037" />
        </mesh>
      ))}
      {/* Fence rail */}
      <mesh position={[0, 0.04, 0.38]}>
        <boxGeometry args={[0.8, 0.01, 0.01]} />
        <meshStandardMaterial roughness={0.8} metalness={0} color="#5D4037" />
      </mesh>
    </group>
  )
}

/**
 * Trackside furniture only.
 *
 * The rails and sleepers used to be drawn here, per tile, which could only cover
 * the straight run across row 1. The train now runs a closed circuit that leaves
 * the board at both ends, so the track is built as one continuous piece in
 * AnimatedTrain and drawing it here as well would double it up.
 */
function RailwayProps() {
  return (
    <group>
      {/* Signal post, set back on the south side clear of the sleepers */}
      <mesh position={[0.3, 0.075, 0.34]} castShadow>
        <cylinderGeometry args={[0.008, 0.008, 0.15, 6]} />
        <meshStandardMaterial roughness={0.6} metalness={0.4} color="#455A64" />
      </mesh>
      <mesh position={[0.3, 0.16, 0.34]} castShadow>
        <boxGeometry args={[0.012, 0.05, 0.028]} />
        <meshStandardMaterial roughness={0.7} metalness={0.2} color="#263238" />
      </mesh>
      <mesh position={[0.286, 0.172, 0.34]}>
        <sphereGeometry args={[0.008, 8, 6]} />
        <meshBasicMaterial color="#66BB6A" />
      </mesh>
      <mesh position={[0.286, 0.15, 0.34]}>
        <sphereGeometry args={[0.008, 8, 6]} />
        <meshBasicMaterial color="#5D4037" />
      </mesh>

      {/* Ballast spill either side of the corridor */}
      <mesh position={[-0.28, 0.004, -0.3]} rotation={[-Math.PI / 2, 0, 0.3]}>
        <planeGeometry args={[0.22, 0.1]} />
        <meshStandardMaterial roughness={1} metalness={0} color="#6b5340" />
      </mesh>
    </group>
  )
}

function RiverProps() {
  // Static river bed only — the animated flowing water is rendered at GridScene level
  return (
    <group>
      {/* Riverbed base (slightly darker underneath) */}
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.9, 0.9]} />
        <meshStandardMaterial roughness={0.8} metalness={0} color="#0D47A1" transparent opacity={0.3} />
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
        <meshStandardMaterial roughness={0.8} metalness={0} color="#BDB76B" />
      </mesh>
      {/* Pillar */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 0.22, 8]} />
        <meshStandardMaterial roughness={0.8} metalness={0} color="#DAA520" />
      </mesh>
      {/* Capital */}
      <mesh position={[0, 0.27, 0]} castShadow>
        <boxGeometry args={[0.1, 0.03, 0.1]} />
        <meshStandardMaterial roughness={0.8} metalness={0} color="#DAA520" />
      </mesh>
    </group>
  )
}


function ResidentialDemandProps() {
  // Small houses and a little park
  return (
    <group>
      {/* House 1 */}
      <mesh position={[0.1, 0.05, -0.15]} castShadow>
        <boxGeometry args={[0.14, 0.1, 0.12]} />
        <meshStandardMaterial roughness={0.8} metalness={0} color="#FFCC80" />
      </mesh>
      <mesh position={[0.1, 0.12, -0.15]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.1, 0.07, 4]} />
        <meshStandardMaterial roughness={0.8} metalness={0} color="#D32F2F" />
      </mesh>
      {/* House 2 */}
      <mesh position={[0.2, 0.04, 0.15]} castShadow>
        <boxGeometry args={[0.11, 0.08, 0.1]} />
        <meshStandardMaterial roughness={0.8} metalness={0} color="#FFE0B2" />
      </mesh>
      <mesh position={[0.2, 0.1, 0.15]} rotation={[0, 0, 0]} castShadow>
        <coneGeometry args={[0.08, 0.06, 4]} />
        <meshStandardMaterial roughness={0.8} metalness={0} color="#C62828" />
      </mesh>
      {/* Small park - green area with a tree */}
      <mesh position={[-0.15, 0.005, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.12, 8]} />
        <meshStandardMaterial roughness={0.8} metalness={0} color="#4CAF50" />
      </mesh>
      {/* Park tree */}
      <mesh position={[-0.15, 0.06, 0.1]} castShadow>
        <cylinderGeometry args={[0.015, 0.02, 0.1, 6]} />
        <meshStandardMaterial roughness={0.8} metalness={0} color="#5D4037" />
      </mesh>
      <mesh position={[-0.15, 0.14, 0.1]} castShadow>
        <sphereGeometry args={[0.06, 6, 6]} />
        <meshStandardMaterial roughness={0.8} metalness={0} color="#388E3C" />
      </mesh>
      {/* Park bench */}
      <mesh position={[-0.05, 0.02, 0.15]}>
        <boxGeometry args={[0.06, 0.015, 0.02]} />
        <meshStandardMaterial roughness={0.8} metalness={0} color="#795548" />
      </mesh>
    </group>
  )
}

function HospitalDemandProps() {
  // Hospital building with a red cross
  return (
    <group>
      {/* Main building */}
      <mesh position={[-0.05, 0.1, 0]} castShadow>
        <boxGeometry args={[0.3, 0.2, 0.25]} />
        <meshStandardMaterial roughness={0.8} metalness={0} color="#ECEFF1" />
      </mesh>
      {/* Flat roof */}
      <mesh position={[-0.05, 0.21, 0]} castShadow>
        <boxGeometry args={[0.32, 0.02, 0.27]} />
        <meshStandardMaterial roughness={0.8} metalness={0} color="#B0BEC5" />
      </mesh>
      {/* Red cross - horizontal bar */}
      <mesh position={[-0.05, 0.15, 0.126]}>
        <boxGeometry args={[0.1, 0.025, 0.005]} />
        <meshBasicMaterial color="#D32F2F" />
      </mesh>
      {/* Red cross - vertical bar */}
      <mesh position={[-0.05, 0.15, 0.126]}>
        <boxGeometry args={[0.025, 0.1, 0.005]} />
        <meshBasicMaterial color="#D32F2F" />
      </mesh>
      {/* Door */}
      <mesh position={[-0.05, 0.035, 0.126]}>
        <boxGeometry args={[0.06, 0.07, 0.005]} />
        <meshStandardMaterial roughness={0.8} metalness={0} color="#455A64" />
      </mesh>
      {/* Windows */}
      {[-0.12, 0.02].map((x, i) => (
        <mesh key={i} position={[x, 0.12, 0.126]}>
          <boxGeometry args={[0.04, 0.04, 0.005]} />
          <meshBasicMaterial color="#81D4FA" />
        </mesh>
      ))}
    </group>
  )
}

function IndustrialDemandProps() {
  // Factory building with a chimney
  return (
    <group>
      {/* Factory main building */}
      <mesh position={[0.1, 0.08, 0]} castShadow>
        <boxGeometry args={[0.28, 0.16, 0.22]} />
        <meshStandardMaterial roughness={0.8} metalness={0} color="#607D8B" />
      </mesh>
      {/* Sawtooth roof */}
      <mesh position={[0.1, 0.18, 0]} rotation={[0, 0, 0.1]} castShadow>
        <boxGeometry args={[0.3, 0.03, 0.22]} />
        <meshStandardMaterial roughness={0.8} metalness={0} color="#455A64" />
      </mesh>
      {/* Chimney */}
      <mesh position={[0.2, 0.22, -0.06]} castShadow>
        <cylinderGeometry args={[0.025, 0.03, 0.2, 8]} />
        <meshStandardMaterial roughness={0.8} metalness={0} color="#37474F" />
      </mesh>
      {/* Chimney top band */}
      <mesh position={[0.2, 0.32, -0.06]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.02, 8]} />
        <meshStandardMaterial roughness={0.8} metalness={0} color="#263238" />
      </mesh>
      {/* Smoke puff */}
      <mesh position={[0.2, 0.36, -0.06]}>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshBasicMaterial color="#B0BEC5" transparent opacity={0.5} />
      </mesh>
      {/* Loading bay door */}
      <mesh position={[0.1, 0.04, 0.111]}>
        <boxGeometry args={[0.1, 0.08, 0.005]} />
        <meshStandardMaterial roughness={0.8} metalness={0} color="#FFB300" />
      </mesh>
    </group>
  )
}

function CommercialDemandProps() {
  // Shop/store building
  return (
    <group>
      {/* Store building */}
      <mesh position={[-0.1, 0.08, 0]} castShadow>
        <boxGeometry args={[0.25, 0.16, 0.2]} />
        <meshStandardMaterial roughness={0.8} metalness={0} color="#FFF9C4" />
      </mesh>
      {/* Storefront awning */}
      <mesh position={[-0.1, 0.1, 0.11]} rotation={[0.3, 0, 0]} castShadow>
        <boxGeometry args={[0.27, 0.01, 0.06]} />
        <meshStandardMaterial roughness={0.8} metalness={0} color="#E65100" />
      </mesh>
      {/* Shop sign */}
      <mesh position={[-0.1, 0.14, 0.105]}>
        <boxGeometry args={[0.15, 0.04, 0.005]} />
        <meshBasicMaterial color="#1565C0" />
      </mesh>
      {/* Shop window */}
      <mesh position={[-0.1, 0.06, 0.101]}>
        <boxGeometry args={[0.14, 0.07, 0.005]} />
        <meshBasicMaterial color="#B3E5FC" />
      </mesh>
      {/* Door */}
      <mesh position={[-0.03, 0.04, 0.101]}>
        <boxGeometry args={[0.04, 0.08, 0.005]} />
        <meshStandardMaterial roughness={0.8} metalness={0} color="#5D4037" />
      </mesh>
      {/* Roof detail */}
      <mesh position={[-0.1, 0.165, 0]} castShadow>
        <boxGeometry args={[0.26, 0.01, 0.21]} />
        <meshStandardMaterial roughness={0.8} metalness={0} color="#E0E0E0" />
      </mesh>
    </group>
  )
}
