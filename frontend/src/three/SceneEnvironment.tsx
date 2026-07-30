/**
 * Lighting, sky, and render-pipeline configuration for the board.
 *
 * Replaces the previous setup (flat `#87CEEB` clear colour, one ambient +
 * one directional light, Lambert/Phong materials) with a physically-based rig:
 *
 *  - ACES Filmic tone mapping so bright highlights roll off instead of clipping
 *  - a warm key light with a tightly framed shadow camera (sharp shadows at
 *    2048² across a ~15 unit board instead of being spread over the default frustum)
 *  - a cool sky fill + bounce light, which is what actually makes the low-poly
 *    props read as solid volumes rather than flat silhouettes
 *  - a small local environment map built from Lightformers, giving the metal
 *    pipework and glass tanks something to reflect. Built in-engine, so there is
 *    no external HDRI fetch and no CDN dependency at runtime.
 */
import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, Sky, SoftShadows } from '@react-three/drei'
import * as THREE from 'three'
import { BOARD_CENTER, GRID_DEPTH, GRID_WIDTH } from './layout'

/** Imperative renderer settings that aren't exposed as Canvas props. */
function RenderConfig() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)

  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = 1.05
    gl.shadowMap.type = THREE.PCFSoftShadowMap
    gl.shadowMap.enabled = true

    // Aerial haze that fades the far edge of the board into the sky, giving the
    // isometric view a sense of scale.
    scene.fog = new THREE.Fog('#b7d3e8', 16, 42)

    return () => {
      scene.fog = null
    }
  }, [gl, scene])

  return null
}

export default function SceneEnvironment() {
  const [cx, , cz] = BOARD_CENTER

  return (
    <>
      <RenderConfig />

      {/* Percentage-closer soft shadows — softens contact edges without a post pass */}
      <SoftShadows size={26} samples={12} focus={0.85} />

      <Sky
        distance={450000}
        sunPosition={[12, 9, -6]}
        inclination={0.52}
        azimuth={0.28}
        turbidity={7}
        rayleigh={1.4}
        mieCoefficient={0.006}
        mieDirectionalG={0.82}
      />

      {/* Sky/ground bounce. Does most of the work in defining form. */}
      <hemisphereLight args={['#cfe6ff', '#4a5a3a', 0.85]} />
      <ambientLight intensity={0.18} />

      {/*
        Key light. The shadow frustum is sized to the board (plus margin for the
        reservoir tower and the outboard tanks) so the 2048² map is spent where
        it is visible rather than across a default 1000-unit frustum.
      */}
      <directionalLight
        position={[cx + 6.5, 11, cz - 5]}
        intensity={2.1}
        color="#fff3e0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0006}
        shadow-normalBias={0.02}
        shadow-camera-near={1}
        shadow-camera-far={32}
        shadow-camera-left={-(GRID_WIDTH / 2 + 4)}
        shadow-camera-right={GRID_WIDTH / 2 + 4}
        shadow-camera-top={GRID_DEPTH / 2 + 5}
        shadow-camera-bottom={-(GRID_DEPTH / 2 + 4)}
      />

      {/* Cool rim light from the opposite side so shadowed faces don't go black */}
      <directionalLight position={[cx - 7, 5, cz + 8]} intensity={0.45} color="#9fc6ff" />

      {/*
        Local IBL. `frames={1}` renders the cubemap once on mount — the cost is a
        single 128px cube render, and in exchange every meshStandardMaterial in
        the scene gets plausible specular response.
      */}
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.2} color="#ffffff" scale={[12, 12, 1]} position={[0, 8, -9]} />
        <Lightformer form="rect" intensity={1.1} color="#bcd9ff" scale={[10, 6, 1]} position={[-9, 4, 4]} rotation-y={Math.PI / 2} />
        <Lightformer form="rect" intensity={0.9} color="#ffe6c2" scale={[10, 6, 1]} position={[9, 3, 2]} rotation-y={-Math.PI / 2} />
        <Lightformer form="ring" intensity={1.6} color="#ffffff" scale={5} position={[3, 9, 3]} rotation-x={Math.PI / 2} />
      </Environment>

      {/* Grounding shadow beneath the board — sells the tiles as raised blocks */}
      <ContactShadows
        position={[cx, 0.002, cz]}
        scale={GRID_WIDTH + 6}
        resolution={1024}
        blur={2.4}
        opacity={0.42}
        far={2.4}
        color="#0b1a2a"
        frames={1}
      />

      <Terrain />
    </>
  )
}

/** Surrounding landscape the board sits within. */
function Terrain() {
  const [cx, , cz] = BOARD_CENTER

  return (
    <group>
      {/* Wide grass plain */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, -0.06, cz]} receiveShadow>
        <planeGeometry args={[70, 70]} />
        <meshStandardMaterial color="#5e7a42" roughness={0.95} metalness={0} />
      </mesh>

      {/* Darker apron directly under the board, to visually seat the tiles */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, -0.04, cz]} receiveShadow>
        <planeGeometry args={[GRID_WIDTH + 3.4, GRID_DEPTH + 4.4]} />
        <meshStandardMaterial color="#4a6336" roughness={0.95} metalness={0} />
      </mesh>
    </group>
  )
}
