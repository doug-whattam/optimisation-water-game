/**
 * Animated river spanning all river cells (Row 4: A4-F4).
 * Uses per-cell wave effects that stay strictly within each cell's 0.95x0.95 bounds.
 * World space: row 4 = z=3.0, columns A-F = x from 0 to 5.0.
 */
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

const RIVER_Z = 3.0 // Row 4 = z = (4-1)*1.0 = 3.0

export default function AnimatedRiver() {
  // Use a single time ref to animate all cells uniformly
  const timeRef = useRef(0)

  useFrame((_, delta) => {
    timeRef.current += delta
  })

  return (
    <group>
      {/* Render per-cell river — each cell gets its own contained water */}
      {[0, 1, 2, 3, 4, 5].map((colIdx) => (
        <RiverCell key={colIdx} x={colIdx} z={RIVER_Z} timeRef={timeRef} />
      ))}
    </group>
  )
}

function RiverCell({ x, z, timeRef }: { x: number; z: number; timeRef: React.MutableRefObject<number> }) {
  const wave1Ref = useRef<any>(null)
  const wave2Ref = useRef<any>(null)

  useFrame(() => {
    const t = timeRef.current
    // Oscillate wave positions within cell bounds (max ±0.2 from center)
    if (wave1Ref.current) {
      wave1Ref.current.position.x = Math.sin(t * 1.2 + x) * 0.15
    }
    if (wave2Ref.current) {
      wave2Ref.current.position.x = Math.sin(t * 0.9 + x * 2) * 0.12
    }
  })

  return (
    <group position={[x, 0, z]}>
      {/* Base water — fits exactly within cell (0.95 x 0.95) */}
      <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.93, 0.93]} />
        <meshPhongMaterial color="#0D47A1" transparent opacity={0.8} shininess={100} />
      </mesh>

      {/* Mid layer */}
      <mesh position={[0, 0.009, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.85, 0.6]} />
        <meshPhongMaterial color="#1565C0" transparent opacity={0.45} shininess={80} />
      </mesh>

      {/* Wave highlights - oscillate within cell, max extent stays inside 0.93/2 = 0.465 */}
      <group ref={wave1Ref} position={[0, 0.012, 0]}>
        <mesh position={[0.1, 0, 0.05]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.12, 0.02]} />
          <meshBasicMaterial color="#42A5F5" transparent opacity={0.4} />
        </mesh>
        <mesh position={[-0.15, 0, -0.1]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.1, 0.015]} />
          <meshBasicMaterial color="#42A5F5" transparent opacity={0.35} />
        </mesh>
      </group>

      <group ref={wave2Ref} position={[0, 0.014, 0]}>
        <mesh position={[-0.05, 0, 0.15]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.09, 0.015]} />
          <meshBasicMaterial color="#64B5F6" transparent opacity={0.3} />
        </mesh>
        <mesh position={[0.2, 0, -0.08]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.08, 0.012]} />
          <meshBasicMaterial color="#64B5F6" transparent opacity={0.25} />
        </mesh>
      </group>
    </group>
  )
}
