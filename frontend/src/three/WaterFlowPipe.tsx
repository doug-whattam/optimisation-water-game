/**
 * Animated water flow inside pipes using a custom shader.
 * Shows directional blue stripes animating along the pipe.
 */
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Props {
  length: number
  position: [number, number, number]
  rotation: [number, number, number]
}

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform float uTime;
  uniform float uSpeed;
  uniform vec3 uColor;
  varying vec2 vUv;

  void main() {
    float stripe = sin((vUv.y - uTime * uSpeed) * 25.0) * 0.5 + 0.5;
    float alpha = mix(0.5, 0.9, stripe);
    gl_FragColor = vec4(uColor, alpha);
  }
`

export default function WaterFlowPipe({ length, position, rotation }: Props) {
  const matRef = useRef<THREE.ShaderMaterial>(null)

  useFrame((_, delta) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += delta
    }
  })

  return (
    <mesh position={position} rotation={rotation}>
      <cylinderGeometry args={[0.04, 0.04, length, 8]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        uniforms={{
          uTime: { value: 0 },
          uSpeed: { value: 1.5 },
          uColor: { value: new THREE.Color('#2196F3') },
        }}
      />
    </mesh>
  )
}
