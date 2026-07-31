/**
 * Flowing river across row 4.
 *
 * Replaces the previous approach (stacked translucent planes with a few small
 * quads oscillating on top) with a single shader evaluated per river cell. One
 * shared material, one quad per cell, so the water stays exactly inside each
 * tile footprint while the flow reads as continuous across the row.
 */
import { COLUMNS } from '@/types'
import * as THREE from 'three'
import { registerAnimated } from './animatedMaterials'
import { CELL_SIZE, GROUND_Y, TILE_SIZE, colToIndex } from './layout'

/** Row 4 in world Z. */
const RIVER_ROW = 4
const RIVER_Z = (RIVER_ROW - 1) * CELL_SIZE

const GEOM = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE)

/**
 * `uOffset` shifts the noise domain per cell so neighbouring tiles form one
 * continuous stream rather than six copies of the same pattern.
 */
const MAT_RIVER = registerAnimated(
  new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color('#0b3f8f') },
      uMid: { value: new THREE.Color('#1c6fd0') },
      uFoam: { value: new THREE.Color('#cdeeff') },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying float vOffset;
      void main() {
        vUv = uv;
        // Instance position in world X seeds the pattern so cells line up.
        vOffset = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).x;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3  uDeep;
      uniform vec3  uMid;
      uniform vec3  uFoam;
      varying vec2  vUv;
      varying float vOffset;

      void main() {
        // Continuous coordinate along the row: cell offset plus local uv.
        float x = vOffset + vUv.x;
        float y = vUv.y;

        // Layered travelling waves. Different speeds and directions give the
        // shear you see in real open-channel flow.
        float w1 = sin((x * 7.0 + y * 2.0) - uTime * 1.8);
        float w2 = sin((x * 13.0 - y * 4.0) - uTime * 2.7);
        float w3 = sin((x * 23.0 + y * 9.0) - uTime * 4.1);
        float h = w1 * 0.5 + w2 * 0.32 + w3 * 0.18;

        vec3 col = mix(uDeep, uMid, smoothstep(-0.6, 0.7, h));

        // Foam only on the steepest crests.
        float foam = smoothstep(0.72, 0.98, h);
        col = mix(col, uFoam, foam * 0.7);

        // Slight darkening toward the banks.
        float bank = smoothstep(0.0, 0.16, min(y, 1.0 - y));
        col *= 0.78 + 0.22 * bank;

        gl_FragColor = vec4(col, 0.93);
      }
    `,
  }),
)

export default function AnimatedRiver() {
  return (
    <group>
      {COLUMNS.map((col) => (
        <mesh
          key={col}
          geometry={GEOM}
          material={MAT_RIVER}
          position={[colToIndex(col) * CELL_SIZE, GROUND_Y + 0.008, RIVER_Z]}
          rotation={[-Math.PI / 2, 0, 0]}
        />
      ))}
    </group>
  )
}
