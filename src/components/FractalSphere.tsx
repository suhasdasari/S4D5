import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

interface PulsingSphereProps {
  ripple: boolean;
}

const FractalSphereInner = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = clock.getElapsedTime() * 0.15;
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.2;
    }
    if (materialRef.current) {
      materialRef.current.distort = 0.3 + Math.sin(clock.getElapsedTime() * 2) * 0.15;
    }
  });

  return (
    <Sphere ref={meshRef} args={[1.5, 128, 128]}>
      <MeshDistortMaterial
        ref={materialRef}
        color="#FFFFFF"
        emissive="#FFFFFF"
        emissiveIntensity={0.15}
        roughness={0.1}
        metalness={0.9}
        distort={0.3}
        speed={3}
        transparent
        opacity={0.7}
        wireframe
      />
    </Sphere>
  );
};

const InnerGlow = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(clock.getElapsedTime() * 2) * 0.05;
      meshRef.current.scale.set(scale, scale, scale);
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <Sphere ref={meshRef} args={[1.2, 64, 64]}>
      <meshStandardMaterial
        color="#A0A0A0"
        emissive="#A0A0A0"
        emissiveIntensity={0.3}
        transparent
        opacity={0.1}
      />
    </Sphere>
  );
};

const FractalSphere = ({ ripple }: PulsingSphereProps) => {
  return (
    <div className="relative w-full h-full">
      <Canvas camera={{ position: [0, 0, 4.5], fov: 50 }}>
        <ambientLight intensity={0.15} />
        <pointLight position={[5, 5, 5]} intensity={0.8} color="#FFFFFF" />
        <pointLight position={[-5, -5, -5]} intensity={0.3} color="#A0A0A0" />
        <FractalSphereInner />
        <InnerGlow />
      </Canvas>
      {ripple && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full border border-foreground/30 animate-plasma-ripple" />
        </div>
      )}
    </div>
  );
};

export default FractalSphere;
