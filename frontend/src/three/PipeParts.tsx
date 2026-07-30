/**
 * Reusable pipework primitives.
 *
 * Two things changed from the original pipe rendering:
 *
 * 1. Elbows are real quarter-torus bends instead of two butted cylinders with a
 *    sphere hiding the corner. A 90° bend is the single most repeated shape on
 *    the board, so it is worth getting right.
 *
 * 2. Geometries and materials are module-level singletons. A dense network is
 *    100+ meshes; allocating a BufferGeometry and a Material per mesh per render
 *    was the main avoidable cost in the old implementation. Everything here is
 *    allocated once and shared.
 *
 * Pipes are also opaque now. The previous 40%-opacity grey read as a rendering
 * artefact rather than as pipe, and it made the water inside impossible to see.
 */
import * as THREE from 'three'
import { Direction } from '@/types'
import { registerAnimated } from './animatedMaterials'
import { HALF_CELL, PIPE_BORE, PIPE_RADIUS, PIPE_Y } from './layout'

/* ------------------------------------------------------------------ geometry */

const RADIAL = 14
const ARC_SEGMENTS = 20

/** Straight run spanning a full cell. */
const GEOM_RUN = new THREE.CylinderGeometry(PIPE_RADIUS, PIPE_RADIUS, HALF_CELL * 2, RADIAL, 1, true)
const GEOM_RUN_BORE = new THREE.CylinderGeometry(PIPE_BORE, PIPE_BORE, HALF_CELL * 2, RADIAL, 1, true)

/** Stub from cell centre out to one edge. */
const GEOM_STUB = new THREE.CylinderGeometry(PIPE_RADIUS, PIPE_RADIUS, HALF_CELL, RADIAL, 1, true)
const GEOM_STUB_BORE = new THREE.CylinderGeometry(PIPE_BORE, PIPE_BORE, HALF_CELL, RADIAL, 1, true)

/** Quarter bend. Radius equals half a cell so both ends land on cell edges. */
const GEOM_BEND = new THREE.TorusGeometry(HALF_CELL, PIPE_RADIUS, RADIAL, ARC_SEGMENTS, Math.PI / 2)
const GEOM_BEND_BORE = new THREE.TorusGeometry(HALF_CELL, PIPE_BORE, RADIAL, ARC_SEGMENTS, Math.PI / 2)

/** Bolted flange ring at a connection face. */
const GEOM_FLANGE = new THREE.CylinderGeometry(PIPE_RADIUS * 1.5, PIPE_RADIUS * 1.5, 0.022, RADIAL)
/** Collar covering the centre of a tee/cross where runs intersect. */
const GEOM_COLLAR = new THREE.SphereGeometry(PIPE_RADIUS * 1.28, 16, 12)

/* ------------------------------------------------------------------ materials */

/** Coated ductile iron. */
const MAT_PIPE = new THREE.MeshStandardMaterial({
  color: '#8fa6bd',
  metalness: 0.82,
  roughness: 0.32,
  envMapIntensity: 1.25,
})

const MAT_FLANGE = new THREE.MeshStandardMaterial({
  color: '#5d6f82',
  metalness: 0.9,
  roughness: 0.44,
  envMapIntensity: 1.1,
})

/** Dry bore — dark interior visible through the pipe ends. */
const MAT_BORE_DRY = new THREE.MeshStandardMaterial({
  color: '#1d2836',
  metalness: 0.2,
  roughness: 0.85,
  side: THREE.DoubleSide,
})

/** Semi-transparent preview material for the placement ghost. */
export const MAT_GHOST = new THREE.MeshStandardMaterial({
  color: '#7dd3fc',
  metalness: 0.4,
  roughness: 0.3,
  transparent: true,
  opacity: 0.42,
  depthWrite: false,
})

export const MAT_GHOST_INVALID = new THREE.MeshStandardMaterial({
  color: '#f87171',
  metalness: 0.2,
  roughness: 0.5,
  transparent: true,
  opacity: 0.38,
  depthWrite: false,
})

/* ------------------------------------------------------------- flow shader */

const FLOW_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

/**
 * Travelling bands of brighter water along the bore.
 *
 * `uFlow` / `uGirth` select which UV channel runs along the pipe versus around
 * it, because a CylinderGeometry and a TorusGeometry disagree: a cylinder runs
 * along uv.y, a torus runs along uv.x. One shader serves both.
 */
const FLOW_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uSpeed;
  uniform vec3  uDeep;
  uniform vec3  uCrest;
  uniform vec2  uFlow;
  uniform vec2  uGirth;
  varying vec2  vUv;

  void main() {
    float along = dot(vUv, uFlow);
    float girth = dot(vUv, uGirth);

    // Two bands at different frequencies keep the motion from looking like a
    // rotating barber pole.
    float band = sin((along - uTime * uSpeed) * 34.0) * 0.5 + 0.5;
    band = mix(band, sin((along - uTime * uSpeed * 0.55) * 13.0) * 0.5 + 0.5, 0.4);

    // Fake cylindrical shading so the water reads as a volume, not a decal.
    float shade = 0.55 + 0.45 * sin(girth * 3.14159265);

    vec3 col = mix(uDeep, uCrest, pow(band, 2.0) * 0.85);
    gl_FragColor = vec4(col * shade, 1.0);
  }
`

function makeFlowMaterial(flow: THREE.Vector2, girth: THREE.Vector2) {
  return new THREE.ShaderMaterial({
    vertexShader: FLOW_VERT,
    fragmentShader: FLOW_FRAG,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uSpeed: { value: 0.42 },
      uDeep: { value: new THREE.Color('#0c5fa8') },
      uCrest: { value: new THREE.Color('#7fe0ff') },
      uFlow: { value: flow },
      uGirth: { value: girth },
    },
  })
}

/** Cylinders run along uv.y. */
const MAT_FLOW_AXIAL = registerAnimated(
  makeFlowMaterial(new THREE.Vector2(0, 1), new THREE.Vector2(1, 0)),
)
/** Tori run along uv.x. */
const MAT_FLOW_BEND = registerAnimated(
  makeFlowMaterial(new THREE.Vector2(1, 0), new THREE.Vector2(0, 1)),
)

/* ---------------------------------------------------------------- transforms */

type Vec3 = [number, number, number]

/** Position and rotation for a stub of `length` reaching from centre toward `dir`. */
function stubTransform(dir: Direction, length: number): { position: Vec3; rotation: Vec3 } {
  const half = length / 2
  switch (dir) {
    case Direction.North:
      return { position: [0, PIPE_Y, -half], rotation: [Math.PI / 2, 0, 0] }
    case Direction.South:
      return { position: [0, PIPE_Y, half], rotation: [Math.PI / 2, 0, 0] }
    case Direction.East:
      return { position: [half, PIPE_Y, 0], rotation: [0, 0, Math.PI / 2] }
    case Direction.West:
      return { position: [-half, PIPE_Y, 0], rotation: [0, 0, Math.PI / 2] }
  }
}

const EDGE: Record<Direction, Vec3> = {
  [Direction.North]: [0, PIPE_Y, -HALF_CELL],
  [Direction.South]: [0, PIPE_Y, HALF_CELL],
  [Direction.East]: [HALF_CELL, PIPE_Y, 0],
  [Direction.West]: [-HALF_CELL, PIPE_Y, 0],
}

const EDGE_ROT: Record<Direction, Vec3> = {
  [Direction.North]: [Math.PI / 2, 0, 0],
  [Direction.South]: [Math.PI / 2, 0, 0],
  [Direction.East]: [0, 0, Math.PI / 2],
  [Direction.West]: [0, 0, Math.PI / 2],
}

/* ---------------------------------------------------------------- components */

export type PipeSkin = 'metal' | 'ghost' | 'ghost-invalid'

function shell(skin: PipeSkin): THREE.Material {
  if (skin === 'ghost') return MAT_GHOST
  if (skin === 'ghost-invalid') return MAT_GHOST_INVALID
  return MAT_PIPE
}

interface PartProps {
  skin?: PipeSkin
  /** Render animated water in the bore instead of the dry interior. */
  wet?: boolean
}

/** Straight pipe spanning the whole cell along the north–south axis. */
export function StraightRun({ skin = 'metal', wet = false }: PartProps) {
  const solid = skin === 'metal'
  return (
    <group>
      <mesh
        geometry={GEOM_RUN}
        material={shell(skin)}
        position={[0, PIPE_Y, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow={solid}
        receiveShadow={solid}
      />
      {solid && (
        <mesh
          geometry={GEOM_RUN_BORE}
          material={wet ? MAT_FLOW_AXIAL : MAT_BORE_DRY}
          position={[0, PIPE_Y, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        />
      )}
    </group>
  )
}

/** Half-length pipe from the cell centre out to one edge. */
export function Stub({ dir, skin = 'metal', wet = false }: PartProps & { dir: Direction }) {
  const solid = skin === 'metal'
  const { position, rotation } = stubTransform(dir, HALF_CELL)
  return (
    <group>
      <mesh
        geometry={GEOM_STUB}
        material={shell(skin)}
        position={position}
        rotation={rotation}
        castShadow={solid}
        receiveShadow={solid}
      />
      {solid && (
        <mesh
          geometry={GEOM_STUB_BORE}
          material={wet ? MAT_FLOW_AXIAL : MAT_BORE_DRY}
          position={position}
          rotation={rotation}
        />
      )}
    </group>
  )
}

/**
 * Quarter bend joining the north edge to the east edge.
 *
 * Centre of curvature sits on the north-east corner at (+HALF_CELL, -HALF_CELL)
 * with radius HALF_CELL, which puts both ends exactly on cell-edge midpoints.
 * The inner Z rotation offsets the torus start angle so the swept quarter is the
 * one facing back into the cell.
 */
export function Bend({ skin = 'metal', wet = false }: PartProps) {
  const solid = skin === 'metal'
  return (
    <group position={[HALF_CELL, PIPE_Y, -HALF_CELL]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh
        geometry={GEOM_BEND}
        material={shell(skin)}
        rotation={[0, 0, Math.PI]}
        castShadow={solid}
        receiveShadow={solid}
      />
      {solid && (
        <mesh
          geometry={GEOM_BEND_BORE}
          material={wet ? MAT_FLOW_BEND : MAT_BORE_DRY}
          rotation={[0, 0, Math.PI]}
        />
      )}
    </group>
  )
}

/** Flange ring sitting on a cell edge, marking a connection face. */
export function Flange({ dir, skin = 'metal' }: { dir: Direction; skin?: PipeSkin }) {
  return (
    <mesh
      geometry={GEOM_FLANGE}
      material={skin === 'metal' ? MAT_FLANGE : shell(skin)}
      position={EDGE[dir]}
      rotation={EDGE_ROT[dir]}
      castShadow={skin === 'metal'}
    />
  )
}

/** Collar hiding the intersection at the centre of a tee or cross. */
export function Collar({ skin = 'metal' }: PartProps) {
  return (
    <mesh
      geometry={GEOM_COLLAR}
      material={skin === 'metal' ? MAT_FLANGE : shell(skin)}
      position={[0, PIPE_Y, 0]}
      castShadow={skin === 'metal'}
    />
  )
}

/**
 * Small pressure gauge on top of a junction — a cheap detail that makes the
 * network read as engineered infrastructure rather than plumbing toys.
 */
const GEOM_GAUGE_BODY = new THREE.CylinderGeometry(0.026, 0.026, 0.012, 12)
const GEOM_GAUGE_STEM = new THREE.CylinderGeometry(0.008, 0.008, 0.03, 8)
const MAT_GAUGE_FACE = new THREE.MeshStandardMaterial({
  color: '#e8f4ff',
  metalness: 0.1,
  roughness: 0.25,
  emissive: '#1b3a52',
  emissiveIntensity: 0.35,
})

export function Gauge({ visible = true }: { visible?: boolean }) {
  if (!visible) return null
  return (
    <group position={[0, PIPE_Y + PIPE_RADIUS, 0]}>
      <mesh geometry={GEOM_GAUGE_STEM} material={MAT_FLANGE} position={[0, 0.015, 0]} />
      <mesh
        geometry={GEOM_GAUGE_BODY}
        material={MAT_GAUGE_FACE}
        position={[0, 0.036, 0]}
        rotation={[Math.PI / 2.6, 0, 0]}
        castShadow
      />
    </group>
  )
}
