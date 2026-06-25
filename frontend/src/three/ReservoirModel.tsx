export default function ReservoirModel() {
  const towerHeight = 2.5
  const legPositions: [number, number][] = [[-0.15, -0.15], [0.15, -0.15], [-0.15, 0.15], [0.15, 0.15]]

  return (
    <group>
      {/* Support legs */}
      {legPositions.map(([x, z], i) => (
        <mesh key={i} position={[x, towerHeight / 2, z]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, towerHeight, 8]} />
          <meshLambertMaterial color="#666666" />
        </mesh>
      ))}

      {/* Cross braces */}
      <mesh position={[0, towerHeight * 0.4, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.5, 0.02, 0.02]} />
        <meshLambertMaterial color="#555555" />
      </mesh>
      <mesh position={[0, towerHeight * 0.4, 0]} rotation={[Math.PI / 4, 0, 0]}>
        <boxGeometry args={[0.02, 0.02, 0.5]} />
        <meshLambertMaterial color="#555555" />
      </mesh>

      {/* Water tank at top */}
      <mesh position={[0, towerHeight + 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.5, 16]} />
        <meshPhongMaterial color="#4FC3F7" transparent opacity={0.6} />
      </mesh>

      {/* Water surface */}
      <mesh position={[0, towerHeight + 0.45, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.24, 16]} />
        <meshPhongMaterial color="#1976D2" />
      </mesh>

      {/* Label */}
      <mesh position={[0, towerHeight + 0.7, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color="#87CEEB" />
      </mesh>
    </group>
  )
}
