import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, MeshWobbleMaterial, Environment } from '@react-three/drei';
import * as THREE from 'three';

function DataOrb({ position, color, speed = 1, distort = 0.3, size = 1 }) {
  const ref = useRef();
  useFrame((state) => {
    ref.current.rotation.x = state.clock.elapsedTime * 0.15 * speed;
    ref.current.rotation.y = state.clock.elapsedTime * 0.2 * speed;
  });
  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={ref} position={position} scale={size}>
        <icosahedronGeometry args={[1, 4]} />
        <MeshDistortMaterial
          color={color}
          roughness={0.2}
          metalness={0.9}
          distort={distort}
          speed={2}
          envMapIntensity={1.5}
        />
      </mesh>
    </Float>
  );
}

function WireGrid() {
  const ref = useRef();
  useFrame((state) => {
    ref.current.rotation.z = state.clock.elapsedTime * 0.05;
  });
  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
      <planeGeometry args={[20, 20, 20, 20]} />
      <meshBasicMaterial color="#0ea5e9" wireframe transparent opacity={0.06} />
    </mesh>
  );
}

function FloatingParticles({ count = 80 }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      pos[i] = (Math.random() - 0.5) * 15;
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    ref.current.rotation.y = state.clock.elapsedTime * 0.02;
    ref.current.rotation.x = state.clock.elapsedTime * 0.01;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#06b6d4" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

function RingMesh({ radius = 3, color = '#0ea5e9' }) {
  const ref = useRef();
  useFrame((state) => {
    ref.current.rotation.x = state.clock.elapsedTime * 0.3;
    ref.current.rotation.y = state.clock.elapsedTime * 0.2;
  });
  return (
    <mesh ref={ref}>
      <torusGeometry args={[radius, 0.015, 16, 100]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.3} metalness={0.8} />
    </mesh>
  );
}

export default function Scene3D() {
  return (
    <div className="absolute inset-0 opacity-60 pointer-events-none" style={{ zIndex: 0 }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={1} color="#e0f2fe" />
        <pointLight position={[-5, -5, 5]} intensity={0.5} color="#06b6d4" />
        <pointLight position={[5, 5, -5]} intensity={0.3} color="#f59e0b" />

        {/* Main orb — deep blue */}
        <DataOrb position={[0, 0.5, 0]} color="#1e40af" speed={0.8} distort={0.25} size={1.6} />
        {/* Accent orbs */}
        <DataOrb position={[-3, -1, -1]} color="#0891b2" speed={1.2} distort={0.4} size={0.6} />
        <DataOrb position={[3.5, 1, -2]} color="#d97706" speed={0.6} distort={0.3} size={0.5} />

        {/* Rings */}
        <RingMesh radius={3.2} color="#0ea5e9" />
        <RingMesh radius={4} color="#06b6d4" />

        {/* Grid */}
        <WireGrid />

        {/* Particles */}
        <FloatingParticles count={100} />

        <Environment preset="night" />
      </Canvas>
    </div>
  );
}
