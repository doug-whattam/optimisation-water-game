/**
 * Registry for shader materials that need a `uTime` uniform advanced each frame.
 *
 * Materials in this scene are module-level singletons shared across many meshes,
 * so driving them from a single subscriber is both cheaper and simpler than
 * giving every mesh its own useFrame callback. Mount <AnimationClock /> once.
 */
import { useFrame } from '@react-three/fiber'
import type * as THREE from 'three'

const animated = new Set<THREE.ShaderMaterial>()

/** Register a material whose `uTime` uniform should advance with the clock. */
export function registerAnimated<T extends THREE.ShaderMaterial>(material: T): T {
  animated.add(material)
  return material
}

export function AnimationClock() {
  useFrame((_, delta) => {
    // Clamp: a backgrounded tab can hand back a multi-second delta, which would
    // jump every animation forward and look like a glitch on return.
    const step = Math.min(delta, 0.1)
    animated.forEach((mat) => {
      const u = mat.uniforms.uTime
      if (u) u.value += step
    })
  })
  return null
}
