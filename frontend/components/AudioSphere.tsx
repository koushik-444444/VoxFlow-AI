'use client'

import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Icosahedron, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '@/store/useStore'

function Sphere({ audioLevel }: { audioLevel: number }) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const materialRef = useRef<any>(null!)

  // Smooth the audio level for animation
  const smoothedLevel = useRef(0)
  
  useFrame((state, delta) => {
    // Lerp smoothed level
    smoothedLevel.current = THREE.MathUtils.lerp(
      smoothedLevel.current,
      audioLevel,
      0.1
    )

    // Update distortion and speed based on audio
    if (materialRef.current) {
      materialRef.current.distort = 0.4 + smoothedLevel.current * 0.4
      materialRef.current.speed = 1 + smoothedLevel.current * 3
    }

    // Rotate mesh
    meshRef.current.rotation.x += delta * 0.1
    meshRef.current.rotation.y += delta * 0.15
  })

  return (
    <Icosahedron ref={meshRef} args={[1, 64]}>
      <MeshDistortMaterial
        ref={materialRef}
        color="#4b90ff"
        emissive="#a78bfa"
        emissiveIntensity={0.5}
        roughness={0.2}
        metalness={0.9}
        distort={0.4}
        speed={2}
      />
    </Icosahedron>
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
