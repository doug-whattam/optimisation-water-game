import { Text } from '@react-three/drei'

interface Props {
  name: string
  fillFraction: number
}

export default function TankModel({ name, fillFraction }: Props) {
  const tankHeight = 1.0
  const tankRadius = 0.3
  const waterHeight = Math.max(fillFraction * tankHeight, 0.001)

  return (
    <group>
      {/* Transparent tank shell */}
      <mesh position={[0, tankHeight / 2, 0]}>
        <cylinderGeometry args={[tankRadius, tankRadius, tankHeight, 16, 1, true]} />
        <meshPhongMaterial
          color="#ffffff"
          transparent
          opacity={0.2}
          side={2} // DoubleSide
        />
      </mesh>

      {/* Tank rim top */}
      <mesh position={[0, tankHeight, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[tankRadius - 0.02, tankRadius, 16]} />
        <meshLambertMaterial color="#aaaaaa" />
      </mesh>

      {/* Tank base */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[tankRadius, 16]} />
        <meshLambertMaterial color="#666666" />
      </mesh>

      {/* Water fill */}
      {fillFraction > 0 && (
        <mesh position={[0, waterHeight / 2, 0]}>
          <cylinderGeometry args={[tankRadius * 0.95, tankRadius * 0.95, waterHeight, 16]} />
          <meshPhongMaterial color="#2196F3" transparent opacity={0.8} />
        </mesh>
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
