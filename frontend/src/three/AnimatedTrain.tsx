/**
 * Animated train with engine + 3 carriages spanning all railway cells (Row 1: B1-F1).
 * Rendered at GridScene level, not per-tile.
 * World space: row 1 = z=0, columns B-F = x from 1.0 to 5.0.
 * Train animates from x=0.8 to x=5.5, then loops.
 */
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const TRAIN_START_X = 1.0
const TRAIN_END_X = 5.3
const TRAIN_SPEED = 0.6
const TRAIN_Y = 0.06
const TRAIN_Z = 0.0 // Row 1 = z=0

// Carriage spacing
const CARRIAGE_GAP = 0.22

export default function AnimatedTrain() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.position.x += delta * TRAIN_SPEED
      if (groupRef.current.position.x > TRAIN_END_X) {
        groupRef.current.position.x = TRAIN_START_X
      }
    }
  })

  return (
    <group ref={groupRef} position={[TRAIN_START_X, TRAIN_Y, TRAIN_Z]}>
      {/* Engine */}
      <group position={[0, 0, 0]}>
        {/* Engine body */}
        <mesh castShadow>
          <boxGeometry args={[0.16, 0.08, 0.1]} />
          <meshLambertMaterial color="#D32F2F" />
        </mesh>
        {/* Cabin */}
        <mesh position={[-0.03, 0.06, 0]} castShadow>
          <boxGeometry args={[0.08, 0.06, 0.08]} />
          <meshLambertMaterial color="#B71C1C" />
        </mesh>
        {/* Chimney */}
        <mesh position={[0.05, 0.07, 0]} castShadow>
          <cylinderGeometry args={[0.012, 0.018, 0.05, 6]} />
          <meshLambertMaterial color="#212121" />
        </mesh>
        {/* Headlight */}
        <mesh position={[0.08, 0.01, 0]}>
          <sphereGeometry args={[0.012, 6, 6]} />
          <meshBasicMaterial color="#FFEB3B" />
        </mesh>
        {/* Wheels */}
        {[-0.05, 0.05].map((x, i) => (
          <group key={`ew-${i}`}>
            <mesh position={[x, -0.035, 0.055]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.018, 0.018, 0.012, 8]} />
              <meshLambertMaterial color="#333333" />
            </mesh>
            <mesh position={[x, -0.035, -0.055]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.018, 0.018, 0.012, 8]} />
              <meshLambertMaterial color="#333333" />
            </mesh>
          </group>
        ))}
      </group>

      {/* Carriage 1 - Blue */}
      <Carriage offset={-CARRIAGE_GAP} color="#1565C0" />

      {/* Carriage 2 - Green */}
      <Carriage offset={-CARRIAGE_GAP * 2} color="#2E7D32" />

      {/* Carriage 3 - Yellow */}
      <Carriage offset={-CARRIAGE_GAP * 3} color="#F9A825" />
    </group>
  )
}

function Carriage({ offset, color }: { offset: number; color: string }) {
  return (
    <group position={[offset, 0, 0]}>
      {/* Carriage body */}
      <mesh castShadow>
        <boxGeometry args={[0.14, 0.07, 0.09]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 0.04, 0]} castShadow>
        <boxGeometry args={[0.13, 0.015, 0.085]} />
        <meshLambertMaterial color="#424242" />
      </mesh>
      {/* Wheels */}
      {[-0.04, 0.04].map((x, i) => (
        <group key={`cw-${i}`}>
          <mesh position={[x, -0.03, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.01, 8]} />
            <meshLambertMaterial color="#333333" />
          </mesh>
          <mesh position={[x, -0.03, -0.05]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.01, 8]} />
            <meshLambertMaterial color="#333333" />
          </mesh>
        </group>
      ))}
    </group>
  )
}
