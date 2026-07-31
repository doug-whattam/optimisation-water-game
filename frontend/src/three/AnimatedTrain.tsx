/**
 * Freight train running a continuous loop past the railway corridor on row 1.
 *
 * Previously the consist was a single group translated along +X that teleported
 * back to the start once it passed F1. That produced the visible jump, and it
 * also meant the whole train appeared and disappeared as one block.
 *
 * This is now a closed circuit: an eastbound leg along the rails on row 1, a
 * turn past F, a westbound return leg north of the board, and a turn back at the
 * west end. Because the path never ends there is no respawn to hide — which is
 * why there's no reveal or fade here. Each vehicle is placed independently at
 * its own arc length along the path, so the consist articulates properly through
 * the curves instead of turning as a rigid body.
 *
 * The loop is fitted to clear the fixed furniture around it: the reservoir
 * downcomer at x=0, the Hospital tank pad north edge at z=0.565, and the plinth
 * boundary. See the constants below.
 */
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { GROUND_Y } from './layout'

/* ------------------------------------------------------------------ geometry */

/**
 * The circuit is a stadium: two straights joined by semicircular ends. It is
 * defined by a spine segment, with every point of the path sitting at a fixed
 * distance from that spine. Offsetting the path (for the two rails) is then just
 * the same construction at a different distance, which keeps the rails exactly
 * parallel through the curves for free.
 */
/**
 * West end of the spine. Set to 1.15 rather than B1's centre (1.0) so the west
 * turn's ballast clears tile A1, which is rural and carries no railway — at 1.0
 * the turn cut about 0.06 into A1's north-east corner.
 */
const SPINE_X0 = 1.15
const SPINE_X1 = 5.35 // east end, just past F1
const STRAIGHT = SPINE_X1 - SPINE_X0

/**
 * Centreline distance from the spine. Sets both the turn radius and the
 * separation of the two straights: south leg at z=0 (on the rails), north leg at
 * z=-2R. 0.49 puts the return leg at z=-0.98, which clears the column labels and
 * stays on the plinth.
 */
const LOOP_RADIUS = 0.49

/** Half the track gauge. Matches the wheel spacing on the vehicles. */
const GAUGE_HALF = 0.055

/** Slower than the previous 0.6 — a full lap now takes about 54 seconds. */
const SPEED = 0.22

/** Arc-length spacing between vehicle centres. */
const CARRIAGE_GAP = 0.22

const BALLAST_Y = GROUND_Y + 0.006
const BALLAST_RADIUS = 0.1
/** Squashes the ballast tube into a flat embankment. */
const BALLAST_FLATTEN = 0.14

const SLEEPER_Y = GROUND_Y + 0.026
const SLEEPER_SPACING = 0.155

const RAIL_Y = GROUND_Y + 0.044
const RAIL_RADIUS = 0.012

/**
 * Ride height. Chosen so the wheel treads meet the rail crowns:
 * TRAIN_Y - wheelOffset - wheelRadius === RAIL_Y + RAIL_RADIUS.
 */
const TRAIN_Y = GROUND_Y + 0.109
const WHEEL_DROP = 0.035
const WHEEL_RADIUS = 0.018

interface Pose {
  x: number
  z: number
  /** Rotation about Y that aims the vehicle's +X axis along the path. */
  heading: number
}

/** Path length at a given distance from the spine. */
function loopLength(radius: number): number {
  return 2 * STRAIGHT + 2 * Math.PI * radius
}

/**
 * Position and heading at arc length `s` along the offset path at `radius`.
 *
 * Order of travel: south straight eastbound, east turn, north straight
 * westbound, west turn.
 */
function loopPose(radius: number, s: number): Pose {
  const arc = Math.PI * radius
  const total = 2 * STRAIGHT + 2 * arc
  let d = ((s % total) + total) % total

  let x: number
  let z: number
  let tx: number
  let tz: number

  if (d < STRAIGHT) {
    // Eastbound on the rails.
    x = SPINE_X0 + d
    z = -LOOP_RADIUS + radius
    tx = 1
    tz = 0
  } else if ((d -= STRAIGHT) < arc) {
    // East turn, centred on the spine's east end.
    const th = d / radius
    x = SPINE_X1 + radius * Math.sin(th)
    z = -LOOP_RADIUS + radius * Math.cos(th)
    tx = Math.cos(th)
    tz = -Math.sin(th)
  } else if ((d -= arc) < STRAIGHT) {
    // Westbound on the return leg.
    x = SPINE_X1 - d
    z = -LOOP_RADIUS - radius
    tx = -1
    tz = 0
  } else {
    // West turn, centred on the spine's west end.
    const th = (d - STRAIGHT) / radius
    x = SPINE_X0 - radius * Math.sin(th)
    z = -LOOP_RADIUS - radius * Math.cos(th)
    tx = -Math.cos(th)
    tz = Math.sin(th)
  }

  // A Y rotation of `a` maps +X to (cos a, 0, -sin a), so this aims +X along
  // the tangent.
  return { x, z, heading: Math.atan2(-tz, tx) }
}

/** Closed planar curve for the offset path at `radius`, built flat at y=0. */
class LoopCurve extends THREE.Curve<THREE.Vector3> {
  constructor(private readonly radius: number) {
    super()
  }

  getPoint(t: number, target = new THREE.Vector3()): THREE.Vector3 {
    const { x, z } = loopPose(this.radius, t * loopLength(this.radius))
    return target.set(x, 0, z)
  }
}

/* ----------------------------------------------------------------- materials */

const MAT_BALLAST = new THREE.MeshStandardMaterial({
  color: '#5a4634',
  roughness: 1,
  metalness: 0,
})

const MAT_SLEEPER = new THREE.MeshStandardMaterial({
  color: '#3f2d20',
  roughness: 0.95,
  metalness: 0,
})

const MAT_RAIL = new THREE.MeshStandardMaterial({
  color: '#9aa3ab',
  roughness: 0.35,
  metalness: 0.9,
  envMapIntensity: 1.3,
})

const MAT_DARK = new THREE.MeshStandardMaterial({ color: '#333333', roughness: 0.6, metalness: 0.3 })
const MAT_ROOF = new THREE.MeshStandardMaterial({ color: '#424242', roughness: 0.6, metalness: 0.3 })
const MAT_LAMP = new THREE.MeshBasicMaterial({ color: '#ffe082' })

const CARRIAGE_COLOURS = ['#1565C0', '#2E7D32', '#F9A825']

/* -------------------------------------------------------------------- track */

const GEOM_BALLAST = new THREE.TubeGeometry(
  new LoopCurve(LOOP_RADIUS),
  260,
  BALLAST_RADIUS,
  10,
  true,
)

const GEOM_RAIL_OUTER = new THREE.TubeGeometry(
  new LoopCurve(LOOP_RADIUS + GAUGE_HALF),
  260,
  RAIL_RADIUS,
  6,
  true,
)

const GEOM_RAIL_INNER = new THREE.TubeGeometry(
  new LoopCurve(LOOP_RADIUS - GAUGE_HALF),
  260,
  RAIL_RADIUS,
  6,
  true,
)

/**
 * Continuous track around the whole circuit.
 *
 * The rails used to be drawn per railway tile in TerrainProps, which could only
 * ever cover the straight section on row 1. Track is now owned here so it can
 * follow the curves and the return leg, and the per-tile rails were removed to
 * avoid drawing two sets on top of each other.
 */
function Track() {
  const sleepers = useMemo(() => {
    const centreLength = loopLength(LOOP_RADIUS)
    const count = Math.round(centreLength / SLEEPER_SPACING)
    // Re-derive the spacing from the rounded count so the last sleeper before
    // the seam is spaced like all the others.
    const spacing = centreLength / count

    const geometry = new THREE.BoxGeometry(0.055, 0.016, GAUGE_HALF * 2 + 0.06)
    const mesh = new THREE.InstancedMesh(geometry, MAT_SLEEPER, count)
    mesh.castShadow = true
    mesh.receiveShadow = true

    const matrix = new THREE.Matrix4()
    const quaternion = new THREE.Quaternion()
    const position = new THREE.Vector3()
    const scale = new THREE.Vector3(1, 1, 1)
    const up = new THREE.Vector3(0, 1, 0)

    for (let i = 0; i < count; i++) {
      const pose = loopPose(LOOP_RADIUS, i * spacing)
      position.set(pose.x, SLEEPER_Y, pose.z)
      quaternion.setFromAxisAngle(up, pose.heading)
      matrix.compose(position, quaternion, scale)
      mesh.setMatrixAt(i, matrix)
    }
    mesh.instanceMatrix.needsUpdate = true

    return mesh
  }, [])

  return (
    <group>
      <mesh
        geometry={GEOM_BALLAST}
        material={MAT_BALLAST}
        position={[0, BALLAST_Y, 0]}
        scale={[1, BALLAST_FLATTEN, 1]}
        receiveShadow
      />
      <primitive object={sleepers} />
      <mesh geometry={GEOM_RAIL_OUTER} material={MAT_RAIL} position={[0, RAIL_Y, 0]} castShadow />
      <mesh geometry={GEOM_RAIL_INNER} material={MAT_RAIL} position={[0, RAIL_Y, 0]} castShadow />
    </group>
  )
}

/* -------------------------------------------------------------------- train */

export default function AnimatedTrain() {
  const vehicles = useRef<(THREE.Group | null)[]>([])
  const distance = useRef(0)
  const period = loopLength(LOOP_RADIUS)

  useFrame((_, delta) => {
    // Clamp: returning to a backgrounded tab hands back a large delta, which
    // would jump the train forward by metres.
    distance.current = (distance.current + Math.min(delta, 0.1) * SPEED) % period

    for (let i = 0; i < vehicles.current.length; i++) {
      const group = vehicles.current[i]
      if (!group) continue
      // Each vehicle sits its own gap further back along the path, so the
      // consist bends through the turns rather than swinging as one body.
      const pose = loopPose(LOOP_RADIUS, distance.current - i * CARRIAGE_GAP)
      group.position.set(pose.x, TRAIN_Y, pose.z)
      group.rotation.y = pose.heading
    }
  })

  return (
    <group>
      <Track />

      <group ref={(el) => (vehicles.current[0] = el)}>
        <Engine />
      </group>

      {CARRIAGE_COLOURS.map((colour, i) => (
        <group key={colour} ref={(el) => (vehicles.current[i + 1] = el)}>
          <Carriage colour={colour} />
        </group>
      ))}
    </group>
  )
}

/** Vehicles are modelled facing +X; the path supplies the heading. */
function Engine() {
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[0.16, 0.08, 0.1]} />
        <meshStandardMaterial roughness={0.5} metalness={0.35} color="#D32F2F" />
      </mesh>
      <mesh position={[-0.03, 0.06, 0]} castShadow>
        <boxGeometry args={[0.08, 0.06, 0.08]} />
        <meshStandardMaterial roughness={0.5} metalness={0.35} color="#B71C1C" />
      </mesh>
      <mesh position={[0.05, 0.07, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.018, 0.05, 6]} />
        <meshStandardMaterial roughness={0.5} metalness={0.35} color="#212121" />
      </mesh>
      <mesh position={[0.08, 0.01, 0]} material={MAT_LAMP}>
        <sphereGeometry args={[0.012, 6, 6]} />
      </mesh>
      <Wheels offsets={[-0.05, 0.05]} radius={WHEEL_RADIUS} drop={WHEEL_DROP} />
    </group>
  )
}

function Carriage({ colour }: { colour: string }) {
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[0.14, 0.07, 0.09]} />
        <meshStandardMaterial roughness={0.5} metalness={0.35} color={colour} />
      </mesh>
      <mesh position={[0, 0.04, 0]} material={MAT_ROOF} castShadow>
        <boxGeometry args={[0.13, 0.015, 0.085]} />
      </mesh>
      {/* Coupling bar toward the vehicle ahead */}
      <mesh position={[0.085, -0.015, 0]} material={MAT_DARK}>
        <boxGeometry args={[0.05, 0.008, 0.012]} />
      </mesh>
      <Wheels offsets={[-0.04, 0.04]} radius={0.015} drop={WHEEL_DROP + WHEEL_RADIUS - 0.015} />
    </group>
  )
}

/**
 * Wheel pairs on the gauge. `drop` is derived so every vehicle's tread meets the
 * rail crown regardless of its wheel radius.
 */
function Wheels({
  offsets,
  radius,
  drop,
}: {
  offsets: number[]
  radius: number
  drop: number
}) {
  return (
    <group>
      {offsets.map((x) =>
        [GAUGE_HALF, -GAUGE_HALF].map((z) => (
          <mesh
            key={`${x}-${z}`}
            position={[x, -drop, z]}
            rotation={[Math.PI / 2, 0, 0]}
            material={MAT_DARK}
          >
            <cylinderGeometry args={[radius, radius, 0.012, 10]} />
          </mesh>
        )),
      )}
    </group>
  )
}
