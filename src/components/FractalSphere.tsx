import { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";
import { tradeEventBus } from "./AgentTerminal";

interface PulsingSphereProps {
  ripple: boolean;
}

// Heat zones: lat/lon converted to xyz on unit sphere
const HEAT_ZONES = [
  { lat: 40.7, lon: -74.0 },  // New York
  { lat: 51.5, lon: -0.1 },   // London
  { lat: 35.7, lon: 139.7 },  // Tokyo
  { lat: 22.3, lon: 114.2 },  // Hong Kong
  { lat: 1.3, lon: 103.8 },   // Singapore
  { lat: 48.9, lon: 2.3 },    // Paris
];

function latLonToXYZ(lat: number, lon: number, r: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return {
    x: -r * Math.sin(phi) * Math.cos(theta),
    y: r * Math.cos(phi),
    z: r * Math.sin(phi) * Math.sin(theta),
  };
}

const HeatZones = ({ active }: { active: number | null }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {HEAT_ZONES.map((zone, i) => {
        const pos = latLonToXYZ(zone.lat, zone.lon, 1.52);
        const isActive = active === i;
        return (
          <mesh key={i} position={[pos.x, pos.y, pos.z]}>
            <sphereGeometry args={[isActive ? 0.06 : 0.03, 8, 8]} />
            <meshStandardMaterial
              color={isActive ? "#FFFFFF" : "#888888"}
              emissive={isActive ? "#FFFFFF" : "#444444"}
              emissiveIntensity={isActive ? 2 : 0.5}
              transparent
              opacity={isActive ? 1 : 0.6}
            />
          </mesh>
        );
      })}
    </group>
  );
};

const DataPoints = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const [positions, setPositions] = useState<Float32Array>(new Float32Array(0));

  useEffect(() => {
    const addPoint = () => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.55;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      setPositions((prev) => {
        const maxPoints = 30;
        const newArr = new Float32Array(Math.min(prev.length + 3, maxPoints * 3));
        const start = Math.max(0, prev.length + 3 - maxPoints * 3);
        newArr.set(prev.subarray(start), 0);
        const insertAt = newArr.length - 3;
        newArr[insertAt] = x;
        newArr[insertAt + 1] = y;
        newArr[insertAt + 2] = z;
        return newArr;
      });
    };

    const interval = setInterval(addPoint, 800);
    return () => clearInterval(interval);
  }, []);

  useFrame(({ clock }) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = clock.getElapsedTime() * 0.1;
    }
  });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial color="#FFFFFF" size={0.04} sizeAttenuation transparent opacity={0.9} />
    </points>
  );
};

const FractalSphereInner = ({ hovered }: { hovered: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);
  const speedRef = useRef(0.2);

  useFrame(({ clock }) => {
    const targetSpeed = hovered ? 0.8 : 0.2;
    speedRef.current += (targetSpeed - speedRef.current) * 0.05;

    if (meshRef.current) {
      meshRef.current.rotation.x = clock.getElapsedTime() * speedRef.current * 0.75;
      meshRef.current.rotation.y = clock.getElapsedTime() * speedRef.current;
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
  const [hovered, setHovered] = useState(false);
  const [pulseColor, setPulseColor] = useState<string | null>(null);
  const [activeZone, setActiveZone] = useState<number | null>(null);

  useEffect(() => {
    // Cycle active heat zone to simulate news ingestion
    const interval = setInterval(() => {
      setActiveZone(Math.floor(Math.random() * HEAT_ZONES.length));
      setTimeout(() => setActiveZone(null), 1800);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsub = tradeEventBus.subscribe((type) => {
      setPulseColor(type === "positive" ? "hsl(120, 100%, 50%)" : "hsl(0, 100%, 50%)");
      setTimeout(() => setPulseColor(null), 1500);
    });
    return unsub;
  }, []);

  return (
    <div
      className="relative w-full h-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Canvas camera={{ position: [0, 0, 4.5], fov: 50 }}>
        <ambientLight intensity={0.15} />
        <pointLight position={[5, 5, 5]} intensity={0.8} color="#FFFFFF" />
        <pointLight position={[-5, -5, -5]} intensity={0.3} color="#A0A0A0" />
        <FractalSphereInner hovered={hovered} />
        <InnerGlow />
        <DataPoints />
        <HeatZones active={activeZone} />
      </Canvas>

      {/* Active zone label */}
      {activeZone !== null && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-display tracking-[0.2em] uppercase text-foreground/60 pointer-events-none">
          ◎ INGESTING: {["NEW YORK", "LONDON", "TOKYO", "HONG KONG", "SINGAPORE", "PARIS"][activeZone]}
        </div>
      )}

      {/* Ripple from deposit */}
      {ripple && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full border border-foreground/30 animate-plasma-ripple" />
        </div>
      )}

      {/* Trade pulse overlay */}
      {pulseColor && (
        <div
          className="absolute inset-0 pointer-events-none animate-plasma-ripple rounded-full"
          style={{
            background: `radial-gradient(circle, ${pulseColor}20 0%, transparent 70%)`,
          }}
        />
      )}
    </div>
  );
};

export default FractalSphere;
