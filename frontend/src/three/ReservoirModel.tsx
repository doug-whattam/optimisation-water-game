/**
 * Elevated reservoir that feeds the network, plus its outlet main.
 *
 * The head available to the whole network comes from this tower, so it is worth
 * making it look like the source of pressure: a braced steel trestle, a ribbed
 * tank with a domed roof, a visible water level, and a flanged outlet main
 * running down and into the board.
 */
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import { registerAnimated } from './animatedMaterials'
import { HALF_CELL, PIPE_Y, RESERVOIR_HEIGHT, RESERVOIR_POS } from './layout'

const MAT_STEEL = new THREE.MeshStandardMaterial({
  color: '#6f7c8a',
  metalness: 0.88,
  roughness: 0.34,
  envMapIntensity: 1.25,
})

const MAT_TANK = new THREE.MeshStandardMaterial({
  color: '#9fb6c6',
  metalness: 0.55,
  roughness: 0.3,
  envMapIntensity: 1.5,
})

const MAT_ROOF = new THREE.MeshStandardMaterial({
  color: '#465b6d',
  metalness: 0.7,
  roughness: 0.42,
  envMapIntensity: 1.2,
})

const MAT_GLASS = new THREE.MeshStandardMaterial({
  color: '#d6ecf7',
  metalness: 0.1,
  roughness: 0.06,
  transparent: true,
  opacity: 0.24,
  envMapIntensity: 2.2,
  side: THREE.DoubleSide,
  depthWrite: false,
})

const MAT_WATER = new THREE.MeshStandardMaterial({
  color: '#0f5fa8',
  metalness: 0.3,
  roughness: 0.2,
  envMapIntensity: 1.4,
})

/** Subtly moving surface so the source never looks frozen. */
const MAT_SURFACE = registerAnimated(
  new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color('#0d5c9e') },
      uCrest: { value: new THREE.Color('#93e4ff') },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3  uDeep;
      uniform vec3  uCrest;
      varying vec2  vUv;
      void main() {
        vec2 p = (vUv - 0.5) * 2.0;
        float w = sin(p.x * 9.0 + uTime * 1.3) * 0.5 + 0.5;
        w = mix(w, sin(p.y * 11.0 - uTime * 0.9) * 0.5 + 0.5, 0.5);
        float edge = 1.0 - smoothstep(0.92, 1.0, length(p));
        gl_FragColor = vec4(mix(uDeep, uCrest, w * 0.5), 0.95 * edge);
      }
    `,
  }),
)

const TANK_R = 0.3
const TANK_H = 0.58
const LEG_SPREAD = 0.19

const GEOM_LEG = new THREE.CylinderGeometry(0.026, 0.032, RESERVOIR_HEIGHT, 8)
const GEOM_BRACE = new THREE.CylinderGeometry(0.011, 0.011, 1, 6)
const GEOM_TANK_SHELL = new THREE.CylinderGeometry(TANK_R, TANK_R, TANK_H, 26, 1, true)
const GEOM_TANK_BASE = new THREE.CylinderGeometry(TANK_R, TANK_R * 0.82, 0.07, 26)
const GEOM_TANK_HOOP = new THREE.TorusGeometry(TANK_R * 1.015, 0.012, 8, 26)
const GEOM_ROOF = new THREE.SphereGeometry(TANK_R * 1.02, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2.6)
const GEOM_FINIAL = new THREE.CylinderGeometry(0.012, 0.012, 0.1, 6)
const GEOM_WATER = new THREE.CylinderGeometry(TANK_R * 0.95, TANK_R * 0.95, TANK_H * 0.8, 26, 1, true)
const GEOM_SURFACE = new THREE.CircleGeometry(TANK_R * 0.95, 26)
const GEOM_PLATFORM = new THREE.TorusGeometry(TANK_R * 1.22, 0.014, 8, 28)
const GEOM_RAIL_POST = new THREE.CylinderGeometry(0.006, 0.006, 0.1, 5)
const GEOM_FOOTING = new THREE.CylinderGeometry(0.07, 0.085, 0.07, 12)
const MAT_CONCRETE = new THREE.MeshStandardMaterial({ color: '#8d8d86', metalness: 0, roughness: 0.95 })

const GEOM_PIPE = new THREE.CylinderGeometry(0.045, 0.045, 1, 12)
const GEOM_BEND = new THREE.SphereGeometry(0.052, 12, 10)
const GEOM_FLANGE = new THREE.CylinderGeometry(0.065, 0.065, 0.024, 12)
const GEOM_VALVE_BODY = new THREE.SphereGeometry(0.062, 12, 10)
const GEOM_VALVE_STEM = new THREE.CylinderGeometry(0.008, 0.008, 0.07, 6)
const GEOM_VALVE_WHEEL = new THREE.TorusGeometry(0.038, 0.008, 6, 16)

const MAT_VALVE = new THREE.MeshStandardMaterial({
  color: '#c2410c',
  metalness: 0.5,
  roughness: 0.45,
  envMapIntensity: 1.1,
})

const LEG_OFFSETS: [number, number][] = [
  [-LEG_SPREAD, -LEG_SPREAD],
  [LEG_SPREAD, -LEG_SPREAD],
  [-LEG_SPREAD, LEG_SPREAD],
  [LEG_SPREAD, LEG_SPREAD],
]

interface Props {
  /** Spin the valve handwheel while the simulation runs. */
  flowing?: boolean
}

export default function ReservoirModel({ flowing = false }: Props) {
  const tankBaseY = RESERVOIR_HEIGHT
  const waterY = tankBaseY + (TANK_H * 0.8) / 2
  const surfaceY = tankBaseY + TANK_H * 0.8

  return (
    <group>
      {/* Footings */}
      {LEG_OFFSETS.map(([x, z], i) => (
        <mesh key={`f${i}`} geometry={GEOM_FOOTING} material={MAT_CONCRETE} position={[x, 0.035, z]} castShadow receiveShadow />
      ))}

      {/* Legs */}
      {LEG_OFFSETS.map(([x, z], i) => (
        <mesh
          key={`l${i}`}
          geometry={GEOM_LEG}
          material={MAT_STEEL}
          position={[x, RESERVOIR_HEIGHT / 2, z]}
          castShadow
        />
      ))}

      <Bracing />

      {/* Tank base cone */}
      <mesh geometry={GEOM_TANK_BASE} material={MAT_STEEL} position={[0, tankBaseY - 0.02, 0]} castShadow />

      {/* Water */}
      <mesh geometry={GEOM_WATER} material={MAT_WATER} position={[0, waterY, 0]} />
      <mesh geometry={GEOM_SURFACE} material={MAT_SURFACE} position={[0, surfaceY, 0]} rotation={[-Math.PI / 2, 0, 0]} />

      {/* Shell: an opaque lower band with a glazed upper section, so the level reads */}
      <mesh geometry={GEOM_TANK_SHELL} material={MAT_GLASS} position={[0, tankBaseY + TANK_H / 2, 0]} />
      <mesh
        geometry={GEOM_TANK_SHELL}
        material={MAT_TANK}
        position={[0, tankBaseY + TANK_H * 0.2, 0]}
        scale={[1.004, 0.4, 1.004]}
        castShadow
      />

      {/* Hoops */}
      {[0.06, TANK_H * 0.55, TANK_H - 0.03].map((y, i) => (
        <mesh
          key={`h${i}`}
          geometry={GEOM_TANK_HOOP}
          material={MAT_STEEL}
          position={[0, tankBaseY + y, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
        />
      ))}

      {/* Domed roof + finial */}
      <mesh geometry={GEOM_ROOF} material={MAT_ROOF} position={[0, tankBaseY + TANK_H, 0]} castShadow />
      <mesh geometry={GEOM_FINIAL} material={MAT_STEEL} position={[0, tankBaseY + TANK_H + 0.19, 0]} castShadow />

      {/* Maintenance platform and handrail */}
      <mesh
        geometry={GEOM_PLATFORM}
        material={MAT_STEEL}
        position={[0, tankBaseY + 0.02, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      />
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2
        return (
          <mesh
            key={`p${i}`}
            geometry={GEOM_RAIL_POST}
            material={MAT_STEEL}
            position={[Math.cos(a) * TANK_R * 1.22, tankBaseY + 0.07, Math.sin(a) * TANK_R * 1.22]}
          />
        )
      })}
      <mesh
        geometry={GEOM_PLATFORM}
        material={MAT_STEEL}
        position={[0, tankBaseY + 0.12, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      />

      <Billboard position={[0, tankBaseY + TANK_H + 0.42, 0]}>
        <Text
          fontSize={0.13}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.007}
          outlineColor="#0a1020"
        >
          Reservoir
        </Text>
      </Billboard>

      <OutletMain flowing={flowing} />
    </group>
  )
}

/** Cross bracing between the legs, on all four faces. */
function Bracing() {
  const braces: { position: [number, number, number]; rotation: [number, number, number]; length: number }[] = []
  const span = LEG_SPREAD * 2
  const levels = [RESERVOIR_HEIGHT * 0.34, RESERVOIR_HEIGHT * 0.68]
  const rise = RESERVOIR_HEIGHT * 0.3
  const diag = Math.hypot(span, rise)
  const tilt = Math.atan2(span, rise)

  for (const y of levels) {
    // Two faces along X, two along Z, each with an X of two diagonals.
    for (const s of [-1, 1]) {
      for (const dir of [1, -1]) {
        braces.push({
          position: [0, y, s * LEG_SPREAD],
          rotation: [0, 0, dir * tilt],
          length: diag,
        })
        braces.push({
          position: [s * LEG_SPREAD, y, 0],
          rotation: [dir * tilt, 0, 0],
          length: diag,
        })
      }
    }
  }

  return (
    <group>
      {braces.map((b, i) => (
        <mesh
          key={i}
          geometry={GEOM_BRACE}
          material={MAT_STEEL}
          position={b.position}
          rotation={b.rotation}
          scale={[1, b.length, 1]}
        />
      ))}
    </group>
  )
}

/**
 * Outlet main: drops from the tank base to pipe height, then runs south to the
 * north face of the entry cell, where the player's first asset connects.
 *
 * The reservoir group sits at RESERVOIR_POS, and the entry tile's north edge is
 * at z = -HALF_CELL in world space, so the horizontal run length is derived
 * rather than hard-coded.
 */
function OutletMain({ flowing }: { flowing: boolean }) {
  const wheel = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (flowing && wheel.current) wheel.current.rotation.z += delta * 2.4
  })

  const dropTop = RESERVOIR_HEIGHT - 0.02
  const dropLength = dropTop - PIPE_Y
  const runEndZ = -HALF_CELL - RESERVOIR_POS[2]
  const runLength = runEndZ

  return (
    <group>
      {/* Vertical drop */}
      <mesh
        geometry={GEOM_PIPE}
        material={MAT_STEEL}
        position={[0, PIPE_Y + dropLength / 2, 0]}
        scale={[1, dropLength, 1]}
        castShadow
      />

      {/* Isolation valve on the downcomer */}
      <group position={[0, PIPE_Y + dropLength * 0.55, 0]}>
        <mesh geometry={GEOM_VALVE_BODY} material={MAT_VALVE} castShadow />
        <mesh geometry={GEOM_VALVE_STEM} material={MAT_STEEL} position={[0.055, 0, 0]} rotation={[0, 0, Math.PI / 2]} />
        <mesh
          ref={wheel}
          geometry={GEOM_VALVE_WHEEL}
          material={MAT_VALVE}
          position={[0.095, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
          castShadow
        />
      </group>

      {/* Bend at ground level */}
      <mesh geometry={GEOM_BEND} material={MAT_STEEL} position={[0, PIPE_Y, 0]} castShadow />

      {/* Horizontal run to the board edge */}
      <mesh
        geometry={GEOM_PIPE}
        material={MAT_STEEL}
        position={[0, PIPE_Y, runLength / 2]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[1, runLength, 1]}
        castShadow
      />

      {/* Terminating flange where the network begins */}
      <mesh
        geometry={GEOM_FLANGE}
        material={MAT_STEEL}
        position={[0, PIPE_Y, runEndZ]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      />
    </group>
  )
}
