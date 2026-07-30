/**
 * Customer demand tank.
 *
 * Changes from the original: the fill level now eases toward its target instead
 * of snapping, the water has an animated surface, and the shell reads as glass
 * on a steel frame (hoops, roof, ladder, concrete pad) rather than a bare
 * 15%-opacity cylinder. The target water level is marked so a player can see at
 * a glance how far short a tank fell.
 */
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import { Direction } from '@/types'
import { registerAnimated } from './animatedMaterials'
import { HALF_CELL, PIPE_Y, TANK_HEIGHT, TANK_OFFSET, TANK_RADIUS } from './layout'

/* ------------------------------------------------------------------ materials */

const MAT_GLASS = new THREE.MeshStandardMaterial({
  color: '#cfe4f2',
  metalness: 0.1,
  roughness: 0.08,
  transparent: true,
  opacity: 0.22,
  envMapIntensity: 2.4,
  side: THREE.DoubleSide,
  depthWrite: false,
})

const MAT_STEEL = new THREE.MeshStandardMaterial({
  color: '#7e8b99',
  metalness: 0.85,
  roughness: 0.35,
  envMapIntensity: 1.2,
})

const MAT_CONCRETE = new THREE.MeshStandardMaterial({
  color: '#8d8d86',
  metalness: 0,
  roughness: 0.95,
})

/**
 * Kept opaque deliberately. As a transparent material it would be depth-sorted
 * against the glass shell, which sits at the same origin, and the two would
 * swap order as the camera orbits. Opaque water renders in the first pass and
 * the glass overlays it afterwards, which is both correct and cheaper.
 */
const MAT_WATER_BODY = new THREE.MeshStandardMaterial({
  color: '#1668b8',
  metalness: 0.25,
  roughness: 0.22,
  envMapIntensity: 1.4,
})

/** Marker ring at the target water level. */
const MAT_TWL = new THREE.MeshBasicMaterial({ color: '#fcd34d', transparent: true, opacity: 0.75 })

/** Animated free surface: concentric ripples plus a drifting sparkle. */
const MAT_WATER_SURFACE = registerAnimated(
  new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color('#0b5ea8') },
      uCrest: { value: new THREE.Color('#8ce8ff') },
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
        vec2 p = vUv - 0.5;
        float r = length(p) * 2.0;

        // Outward-travelling rings, plus a slower counter-rotating set so the
        // pattern never looks like a single repeating pulse.
        float rings = sin(r * 22.0 - uTime * 2.1) * 0.5 + 0.5;
        rings *= sin(atan(p.y, p.x) * 3.0 + uTime * 0.7) * 0.25 + 0.75;

        vec3 col = mix(uDeep, uCrest, rings * 0.55);

        // Fade the very edge so the disc doesn't cut a hard line against the wall.
        float edge = 1.0 - smoothstep(0.9, 1.0, r);
        gl_FragColor = vec4(col, 0.95 * edge);
      }
    `,
  }),
)

/* ----------------------------------------------------------------- geometries */

const GEOM_SHELL = new THREE.CylinderGeometry(TANK_RADIUS, TANK_RADIUS, TANK_HEIGHT, 28, 1, true)
const GEOM_ROOF = new THREE.ConeGeometry(TANK_RADIUS * 1.06, 0.16, 28)
const GEOM_HOOP = new THREE.TorusGeometry(TANK_RADIUS * 1.01, 0.011, 8, 28)
const GEOM_PAD = new THREE.CylinderGeometry(TANK_RADIUS * 1.35, TANK_RADIUS * 1.45, 0.05, 24)
const GEOM_FLOOR = new THREE.CircleGeometry(TANK_RADIUS * 0.98, 28)
/** Unit-height water body, scaled on Y to the current level. */
const GEOM_WATER = new THREE.CylinderGeometry(TANK_RADIUS * 0.94, TANK_RADIUS * 0.94, 1, 28, 1, true)
const GEOM_SURFACE = new THREE.CircleGeometry(TANK_RADIUS * 0.94, 28)
const GEOM_TWL_RING = new THREE.TorusGeometry(TANK_RADIUS * 1.02, 0.006, 6, 28)
const GEOM_LADDER_RAIL = new THREE.CylinderGeometry(0.006, 0.006, TANK_HEIGHT, 6)
const GEOM_LADDER_RUNG = new THREE.CylinderGeometry(0.004, 0.004, 0.05, 5)

const GEOM_PIPE = new THREE.CylinderGeometry(0.036, 0.036, 1, 10, 1, false)
const GEOM_ELBOW = new THREE.SphereGeometry(0.042, 10, 8)
const GEOM_SUPPORT = new THREE.BoxGeometry(0.03, 0.14, 0.03)

/** Minimum visible sliver of water, so an empty tank still reads as a vessel. */
const MIN_FILL = 0.004

interface Props {
  name: string
  /** Target fill as a fraction of the tank's target water level. */
  fillFraction: number
  showConnection: boolean
  connectionSide: 'left' | 'right'
  /** Direction from which pipework enters the demand cell. */
  connectingDirection: Direction | null
  /** Shortfall against target, in metres. Drives the label colour. */
  penalty?: number
}

export default function TankModel({
  name,
  fillFraction,
  showConnection,
  connectionSide,
  connectingDirection,
  penalty = 0,
}: Props) {
  const target = THREE.MathUtils.clamp(fillFraction, 0, 1)

  const waterRef = useRef<THREE.Mesh>(null)
  const surfaceRef = useRef<THREE.Mesh>(null)
  const labelRef = useRef<THREE.Group>(null)
  const shown = useRef(0)

  useFrame((_, delta) => {
    // Exponential ease. Framerate-independent, so the fill looks the same on a
    // 60Hz and a 144Hz display.
    shown.current += (target - shown.current) * (1 - Math.exp(-delta * 3.2))
    const h = Math.max(shown.current * TANK_HEIGHT, MIN_FILL)

    if (waterRef.current) {
      waterRef.current.scale.y = h
      waterRef.current.position.y = h / 2
    }
    if (surfaceRef.current) {
      surfaceRef.current.position.y = h
    }
    if (labelRef.current) {
      labelRef.current.position.y = TANK_HEIGHT + 0.3
    }
  })

  const full = target >= 0.999
  const pctColor = full ? '#6ee7b7' : target > 0.6 ? '#7dd3fc' : '#fbbf24'

  return (
    <group>
      {/* Concrete pad */}
      <mesh geometry={GEOM_PAD} material={MAT_CONCRETE} position={[0, 0.025, 0]} receiveShadow castShadow />

      {/* Tank floor, so you don't see through the base */}
      <mesh
        geometry={GEOM_FLOOR}
        material={MAT_STEEL}
        position={[0, 0.052, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      />

      {/* Water body — scaled each frame */}
      <mesh ref={waterRef} geometry={GEOM_WATER} material={MAT_WATER_BODY} position={[0, 0, 0]} />
      <mesh
        ref={surfaceRef}
        geometry={GEOM_SURFACE}
        material={MAT_WATER_SURFACE}
        rotation={[-Math.PI / 2, 0, 0]}
      />

      {/* Glass shell */}
      <mesh geometry={GEOM_SHELL} material={MAT_GLASS} position={[0, TANK_HEIGHT / 2, 0]} />

      {/* Structural hoops */}
      {[0.06, TANK_HEIGHT * 0.5, TANK_HEIGHT - 0.04].map((y, i) => (
        <mesh
          key={i}
          geometry={GEOM_HOOP}
          material={MAT_STEEL}
          position={[0, y, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
        />
      ))}

      {/* Target water level marker */}
      <mesh
        geometry={GEOM_TWL_RING}
        material={MAT_TWL}
        position={[0, TANK_HEIGHT, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      />

      {/* Conical roof */}
      <mesh geometry={GEOM_ROOF} material={MAT_STEEL} position={[0, TANK_HEIGHT + 0.08, 0]} castShadow />

      <Ladder side={connectionSide === 'right' ? -1 : 1} />

      {showConnection && connectingDirection && (
        <TankConnection side={connectionSide} direction={connectingDirection} />
      )}

      {/* Labels always face the camera, so they stay legible while orbiting */}
      <group ref={labelRef} position={[0, TANK_HEIGHT + 0.3, 0]}>
        <Billboard>
          <Text
            fontSize={0.115}
            color="#ffffff"
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.006}
            outlineColor="#0a1020"
          >
            {name}
          </Text>
          <Text
            position={[0, -0.03, 0]}
            fontSize={0.1}
            color={pctColor}
            anchorX="center"
            anchorY="top"
            outlineWidth={0.005}
            outlineColor="#0a1020"
          >
            {penalty > 0
              ? `${Math.round(target * 100)}%  −${penalty.toFixed(2)}m`
              : `${Math.round(target * 100)}%`}
          </Text>
        </Billboard>
      </group>
    </group>
  )
}

/** Access ladder on the face away from the pipework. */
function Ladder({ side }: { side: 1 | -1 }) {
  const x = side * TANK_RADIUS * 1.02
  return (
    <group position={[x, 0, 0]}>
      {[-0.035, 0.035].map((z, i) => (
        <mesh key={i} geometry={GEOM_LADDER_RAIL} material={MAT_STEEL} position={[0, TANK_HEIGHT / 2, z]} />
      ))}
      {[0.14, 0.32, 0.5, 0.68, 0.86].map((f, i) => (
        <mesh
          key={`r${i}`}
          geometry={GEOM_LADDER_RUNG}
          material={MAT_STEEL}
          position={[0, TANK_HEIGHT * f, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        />
      ))}
    </group>
  )
}

/**
 * Inlet pipework from the tank across to the demand cell edge where the
 * player's pipework terminates.
 *
 * The tank sits TANK_OFFSET from its cell centre. For an east/west inlet the run
 * is a single straight length; for north/south it turns at the cell centre.
 */
function TankConnection({ side, direction }: { side: 'left' | 'right'; direction: Direction }) {
  const xDir = side === 'right' ? 1 : -1
  const cellCentreX = xDir * TANK_OFFSET
  const straightAxis = direction === Direction.East || direction === Direction.West

  if (straightAxis) {
    const endX = direction === Direction.East ? HALF_CELL : -HALF_CELL
    // Guard against a degenerate run. With the current board an inlet face can
    // never fall inside the tank radius (column A has no west neighbour, F has
    // no east), but a layout change shouldn't produce inverted geometry.
    const length = Math.max(Math.abs(cellCentreX + endX) - TANK_RADIUS, 0.05)
    const midX = xDir * TANK_RADIUS + (xDir * length) / 2
    return (
      <group position={[0, PIPE_Y, 0]}>
        <mesh
          geometry={GEOM_PIPE}
          material={MAT_STEEL}
          position={[midX, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
          scale={[1, length, 1]}
          castShadow
        />
        <PipeSupport x={midX} />
      </group>
    )
  }

  const endZ = direction === Direction.North ? -HALF_CELL : HALF_CELL
  const runLength = Math.max(Math.abs(cellCentreX) - TANK_RADIUS, 0.05)
  const midX = xDir * (TANK_RADIUS + runLength / 2)

  return (
    <group position={[0, PIPE_Y, 0]}>
      {/* Tank wall out to the cell centre */}
      <mesh
        geometry={GEOM_PIPE}
        material={MAT_STEEL}
        position={[midX, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        scale={[1, runLength, 1]}
        castShadow
      />
      {/* Bend at the cell centre */}
      <mesh geometry={GEOM_ELBOW} material={MAT_STEEL} position={[cellCentreX, 0, 0]} castShadow />
      {/* Cell centre out to the connecting edge */}
      <mesh
        geometry={GEOM_PIPE}
        material={MAT_STEEL}
        position={[cellCentreX, 0, endZ / 2]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[1, Math.abs(endZ), 1]}
        castShadow
      />
      <PipeSupport x={midX} />
    </group>
  )
}

/** Short stanchion holding the inlet pipe up over the gap between pad and board. */
function PipeSupport({ x }: { x: number }) {
  return <mesh geometry={GEOM_SUPPORT} material={MAT_STEEL} position={[x, -0.09, 0]} castShadow />
}
