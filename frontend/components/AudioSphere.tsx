'use client'

import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '@/store/useStore'

function Sphere({ audioLevel }: { audioLevel: number }) {
  const meshRef = useRef<THREE.Mesh>(null!)
  
  // Smooth the audio level for animation
  const smoothedLevel = useRef(0)
  
  useFrame((state, delta) => {
    // Lerp smoothed level
    smoothedLevel.current = THREE.MathUtils.lerp(
      smoothedLevel.current,
      audioLevel,
      0.1
    )

    // Manual mesh distortion effect using scale as a fallback
    const scale = 1 + smoothedLevel.current * 0.2
    meshRef.current.scale.set(scale, scale, scale)

    // Rotate mesh
    meshRef.current.rotation.x += delta * 0.2
    meshRef.current.rotation.y += delta * 0.3
  })

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1, 15]} />
      <meshStandardMaterial
        color="#4b90ff"
        emissive="#a78bfa"
        emissiveIntensity={0.5}
        roughness={0.2}
        metalness={0.9}
        wireframe
      />
    </mesh>
  )
}

function Scene() {
  const audioLevel = useStore((s) => s.audioLevel)
  const isPlaying = useStore((s) => s.isPlaying)
  const isRecording = useStore((s) => s.isRecording)
  const assistantIsThinking = useStore((s) => s.assistantIsThinking)

  const effectiveLevel = (isPlaying || isRecording || assistantIsThinking) ? audioLevel : 0

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#4b90ff" />
      <pointLight position={[-10, -10, -10]} color="#ff8fab" intensity={1} />
      <Sphere audioLevel={effectiveLevel} />
    </>
  )
}

export function AudioSphere() {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
        <Scene />
      </Canvas>
    </div>
  )
}
