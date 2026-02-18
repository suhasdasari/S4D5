import { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";
import { tradeEventBus } from "./AgentTerminal";
import { athEventBus } from "./SnakeHUD";

interface PulsingSphereProps {
  ripple: boolean;
}

// Heat zones: lat/lon → xyz on unit sphere
// Colors: green = bullish zone, red = risk zone
const HEAT_ZONES = [
  { lat: 40.7, lon: -74.0,  focus: "Analyzing: US CPI Data Release",     color: "positive" },
  { lat: 51.5, lon: -0.1,   focus: "Analyzing: EU Energy Supply Shock",   color: "negative" },
  { lat: 35.7, lon: 139.7,  focus: "Analyzing: JP Yield Curve Control",   color: "negative" },
  { lat: 22.3, lon: 114.2,  focus: "Analyzing: HK Crypto Liquidity Flow", color: "positive" },
  { lat: 1.3,  lon: 103.8,  focus: "Analyzing: SG Commodity Derivatives", color: "positive" },
  { lat: 48.9, lon: 2.3,    focus: "Analyzing: EU Monetary Policy Pivot", color: "negative" },
];

const ZONE_NAMES = ["NEW YORK", "LONDON", "TOKYO", "HONG KONG", "SINGAPORE", "PARIS"];

function latLonToXYZ(lat: number, lon: number, r: number) {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return {
    x: -r * Math.sin(phi) * Math.cos(theta),
    y:  r * Math.cos(phi),
    z:  r * Math.sin(phi) * Math.sin(theta),
  };
}

const HeatZones = ({
  active,
  onHover,
}: {
  active: number | null;
  onHover: (i: number | null, screenPos?: { x: number; y: number }) => void;
}) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {HEAT_ZONES.map((zone, i) => {
        const pos      = latLonToXYZ(zone.lat, zone.lon, 1.52);
        const isActive = active === i;
        const isPos    = zone.color === "positive";
        const baseCol  = isPos ? "#00FF00" : "#FF0000";
        const dimCol   = isPos ? "#004400" : "#440000";

        return (
          <mesh
            key={i}
            position={[pos.x, pos.y, pos.z]}
            onPointerEnter={(e) => {
              e.stopPropagation();
              onHover(i);
            }}
            onPointerLeave={(e) => {
              e.stopPropagation();
              onHover(null);
            }}
          >
            <sphereGeometry args={[isActive ? 0.07 : 0.035, 10, 10]} />
            <meshStandardMaterial
              color={isActive ? baseCol : dimCol}
              emissive={isActive ? baseCol : dimCol}
              emissiveIntensity={isActive ? 3.5 : 0.8}
              transparent
              opacity={isActive ? 1 : 0.5}
            />
          </mesh>
        );
      })}
    </group>
  );
};

// Animated data streaks — particles fly from sphere surface
const DataPoints = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const [positions, setPositions] = useState<Float32Array>(new Float32Array(0));

  useEffect(() => {
    const addPoint = () => {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 1.55;
      const x     = r * Math.sin(phi) * Math.cos(theta);
      const y     = r * Math.sin(phi) * Math.sin(theta);
      const z     = r * Math.cos(phi);

      setPositions((prev) => {
        const maxPoints = 30;
        const newArr    = new Float32Array(Math.min(prev.length + 3, maxPoints * 3));
        const start     = Math.max(0, prev.length + 3 - maxPoints * 3);
        newArr.set(prev.subarray(start), 0);
        const insertAt = newArr.length - 3;
        newArr[insertAt]     = x;
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

const FractalSphereInner = ({ hovered, athFlash }: { hovered: boolean; athFlash: boolean }) => {
  const meshRef     = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);
  const speedRef    = useRef(0.2);

  useFrame(({ clock }) => {
    const targetSpeed = hovered ? 0.8 : 0.2;
    speedRef.current += (targetSpeed - speedRef.current) * 0.05;

    if (meshRef.current) {
      meshRef.current.rotation.x = clock.getElapsedTime() * speedRef.current * 0.75;
      meshRef.current.rotation.y = clock.getElapsedTime() * speedRef.current;
    }
    if (materialRef.current) {
      const baseDistort             = athFlash ? 0.6 : 0.3;
      materialRef.current.distort   = baseDistort + Math.sin(clock.getElapsedTime() * 2) * 0.15;
      materialRef.current.emissiveIntensity = athFlash ? 0.8 : 0.15;
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
  const [hovered, setHovered]         = useState(false);
  const [pulseColor, setPulseColor]   = useState<string | null>(null);
  const [activeZone, setActiveZone]   = useState<number | null>(null);
  const [hoveredZone, setHoveredZone] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos]   = useState<{ x: number; y: number } | null>(null);
  const [athFlash, setAthFlash]       = useState(false);

  // Auto-cycle active zone (Strategist focus)
  useEffect(() => {
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

  useEffect(() => {
    const unsub = athEventBus.subscribe(() => {
      setAthFlash(true);
      setTimeout(() => setAthFlash(false), 600);
    });
    return unsub;
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setTooltipPos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
  };

  return (
    <div
      className="relative w-full h-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setHoveredZone(null); setTooltipPos(null); }}
      onMouseMove={handleMouseMove}
    >
      {/* ATH white flash overlay */}
      {athFlash && (
        <div
          className="absolute inset-0 pointer-events-none z-30 rounded-md"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)", transition: "opacity 0.3s" }}
        />
      )}

      <Canvas camera={{ position: [0, 0, 4.5], fov: 50 }}>
        <ambientLight intensity={0.15} />
        <pointLight position={[5, 5, 5]} intensity={athFlash ? 2.5 : 0.8} color="#FFFFFF" />
        <pointLight position={[-5, -5, -5]} intensity={0.3} color="#A0A0A0" />
        <FractalSphereInner hovered={hovered} athFlash={athFlash} />
        <InnerGlow />
        <DataPoints />
        <HeatZones active={activeZone} onHover={setHoveredZone} />
      </Canvas>

      {/* Heat zone hover tooltip — cursor-following */}
      {hoveredZone !== null && tooltipPos && (
        <div
          className="absolute pointer-events-none z-40"
          style={{ left: tooltipPos.x + 14, top: tooltipPos.y - 32 }}
        >
          <div
            className="text-[9px] font-mono tracking-widest uppercase px-2.5 py-1.5 rounded-sm whitespace-nowrap"
            style={{
              background: "rgba(0,0,0,0.92)",
              border: `1px solid ${HEAT_ZONES[hoveredZone].color === "positive" ? "rgba(0,255,0,0.4)" : "rgba(255,0,0,0.4)"}`,
              color: HEAT_ZONES[hoveredZone].color === "positive" ? "hsl(120 100% 50%)" : "hsl(0 100% 50%)",
              textShadow: HEAT_ZONES[hoveredZone].color === "positive"
                ? "0 0 8px rgba(0,255,0,0.6)"
                : "0 0 8px rgba(255,0,0,0.6)",
            }}
          >
            ◉ {HEAT_ZONES[hoveredZone].focus}
          </div>
        </div>
      )}

      {/* Active zone ingestion banner */}
      {activeZone !== null && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-display tracking-[0.2em] uppercase pointer-events-none"
          style={{
            color: HEAT_ZONES[activeZone].color === "positive" ? "hsl(120 100% 50% / 0.7)" : "hsl(0 100% 50% / 0.7)"
          }}
        >
          ◎ INGESTING: {ZONE_NAMES[activeZone]}
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
          style={{ background: `radial-gradient(circle, ${pulseColor}20 0%, transparent 70%)` }}
        />
      )}
    </div>
  );
};

export default FractalSphere;
