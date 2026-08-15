"use client";

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";

/* ================================================================
   PART 1: FULL-SCREEN PARTICLES (fills entire viewport)
   ================================================================ */
function Starfield() {
  const { positions } = useMemo(() => {
    const pos = new Float32Array(1200 * 3);
    for (let i = 0; i < 1200; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 35;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40 - 8;
    }
    return { positions: pos };
  }, []);

  const ref = useRef<THREE.Points>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.01;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.1} color="#F7F2E8" transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

function SpiralParticles() {
  const ref = useRef<THREE.Points>(null);
  const colors = ["#D6A84F", "#C32828", "#E8A840", "#FF6B4A", "#8B4FDF"];

  const { positions, colorArray } = useMemo(() => {
    const count = 300;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const angle = t * Math.PI * 10;
      const r = 10 + Math.sin(t * Math.PI * 6) * 3;
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = t * 16 - 8;
      pos[i * 3 + 2] = Math.sin(angle) * r;
      const c = new THREE.Color(colors[i % colors.length]);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    return { positions: pos, colorArray: col };
  }, []);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.08;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colorArray, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.15} vertexColors transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

function ParticlesScene() {
  return (
    <>
      <ambientLight color="#1a1020" intensity={0.3} />
      <Starfield />
      <SpiralParticles />
    </>
  );
}

export function HeroParticlesCanvas() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 3, 16], fov: 55 }}
      >
        <ParticlesScene />
      </Canvas>
    </div>
  );
}

/* ================================================================
   PART 2: CENTERED GLOBE (rings, shapes, orb — keeps circular shape)
   ================================================================ */
function EnergyRing({
  radius = 5.5, color = "#D6A84F", emissive = "#D6A84F",
  rotationSpeed = 0.2, axis = "y" as "x" | "y" | "z", pulseSpeed = 0.6,
}: {
  radius?: number; color?: string; emissive?: string;
  rotationSpeed?: number; axis?: "x" | "y" | "z"; pulseSpeed?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    if (axis === "y") ref.current.rotation.y += delta * rotationSpeed;
    if (axis === "x") ref.current.rotation.x += delta * rotationSpeed;
    if (axis === "z") ref.current.rotation.z += delta * rotationSpeed;
    ref.current.scale.setScalar(1 + Math.sin(Date.now() * 0.001 * pulseSpeed) * 0.02);
  });
  return (
    <mesh ref={ref}>
      <torusGeometry args={[radius, 0.08, 24, 200]} />
      <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={1.0} metalness={0.5} roughness={0.25} transparent opacity={0.85} />
    </mesh>
  );
}

function CentralOrb() {
  const orbRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const colorRef = useRef(new THREE.Color("#C32828"));
  useFrame((_, delta) => {
    const t = Date.now() * 0.001;
    colorRef.current.copy(new THREE.Color("#C32828").lerp(new THREE.Color("#D6A84F"), Math.sin(t * 0.3) * 0.5 + 0.5));
    if (orbRef.current) {
      orbRef.current.rotation.y += delta * 0.4;
      orbRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.06);
      (orbRef.current.material as THREE.MeshStandardMaterial).emissive = colorRef.current;
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(2.2 + Math.sin(t * 1.5) * 0.2);
      (glowRef.current.material as THREE.MeshBasicMaterial).color = colorRef.current;
    }
  });
  return (
    <group>
      <mesh ref={orbRef}>
        <icosahedronGeometry args={[0.45, 2]} />
        <meshStandardMaterial color="#C32828" emissive="#C32828" emissiveIntensity={2.5} metalness={0.25} roughness={0.15} />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.7, 48, 48]} />
        <meshBasicMaterial color="#C32828" transparent opacity={0.18} depthWrite={false} />
      </mesh>
    </group>
  );
}

function FloatingShapes() {
  const shapes = useMemo(() => {
    const result: { position: [number,number,number]; geoType: "octahedron"|"torusKnot"|"dodecahedron"|"icosahedron"; color: string; speed: number; phase: number; size: number }[] = [];
    const geoTypes = ["octahedron","torusKnot","dodecahedron","icosahedron"] as const;
    const colors = ["#C32828","#D6A84F","#E87040","#8B4FDF","#E8A840","#FF6B4A"];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      result.push({
        position: [Math.cos(angle) * 7, (Math.random() - 0.5) * 6, Math.sin(angle) * 7],
        geoType: geoTypes[i % geoTypes.length], color: colors[i % colors.length],
        speed: 0.15 + Math.random() * 0.3, phase: Math.random() * Math.PI * 2, size: 0.25 + Math.random() * 0.35,
      });
    }
    return result;
  }, []);
  return <group>{shapes.map((s, i) => <FloatingShape key={i} {...s} />)}</group>;
}

function FloatingShape({ position, geoType, color, speed, phase, size }: {
  position: [number,number,number]; geoType: string; color: string; speed: number; phase: number; size: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const geo = useMemo(() => {
    switch (geoType) {
      case "octahedron": return new THREE.OctahedronGeometry(size, 0);
      case "torusKnot": return new THREE.TorusKnotGeometry(size * 0.6, size * 0.2, 40, 8);
      case "dodecahedron": return new THREE.DodecahedronGeometry(size, 0);
      case "icosahedron": return new THREE.IcosahedronGeometry(size, 0);
      default: return new THREE.OctahedronGeometry(size, 0);
    }
  }, [geoType, size]);
  useFrame((_, delta) => {
    if (!ref.current) return;
    const t = Date.now() * 0.001 * speed + phase;
    ref.current.position.x = position[0] + Math.cos(t) * 1.2;
    ref.current.position.y = position[1] + Math.sin(t * 0.7) * 1.5;
    ref.current.position.z = position[2] + Math.sin(t) * 1.2;
    ref.current.rotation.x += delta * 0.4;
    ref.current.rotation.y += delta * 0.5;
  });
  return (
    <mesh ref={ref} position={position}>
      <primitive object={geo} attach="geometry" />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} metalness={0.4} roughness={0.3} />
    </mesh>
  );
}

function EnergyArcs() {
  const arcs = useMemo(() => {
    const result: { points: THREE.Vector3[]; color: string }[] = [];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      result.push({
        points: new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(Math.cos(a) * 6.5, 1.5, Math.sin(a) * 6.5),
          new THREE.Vector3(Math.cos(a + 0.5) * 2.5, 1, Math.sin(a + 0.5) * 2.5),
          new THREE.Vector3(0, 0, 0),
        ]).getPoints(100),
        color: ["#C32828","#D6A84F","#E87040","#8B4FDF","#FF6B4A"][i],
      });
    }
    return result;
  }, []);
  return (
    <group>
      {arcs.map((arc, i) => (
        <line key={i}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[new Float32Array(arc.points.flatMap(p => [p.x,p.y,p.z])), 3]} />
          </bufferGeometry>
          <lineBasicMaterial color={arc.color} transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} />
        </line>
      ))}
    </group>
  );
}

function GlobeLights() {
  const keyRef = useRef<THREE.PointLight>(null);
  useFrame(() => {
    if (keyRef.current) keyRef.current.intensity = 35 + Math.sin(Date.now() * 0.0005) * 8;
  });
  return (
    <>
      <ambientLight color="#1a1020" intensity={0.5} />
      <pointLight ref={keyRef} position={[8,8,12]} color="#D6A84F" intensity={35} distance={45} decay={2} />
      <pointLight position={[-8,4,-6]} color="#C32828" intensity={22} distance={30} decay={2} />
      <pointLight position={[0,12,-8]} color="#8B6FD4" intensity={10} distance={35} decay={2} />
      <pointLight position={[6,-3,8]} color="#E8A840" intensity={8} distance={25} decay={2} />
      <pointLight position={[-3,8,4]} color="#FF6B4A" intensity={6} distance={22} decay={2} />
      <directionalLight position={[0,20,0]} color="#ffffff" intensity={0.3} />
    </>
  );
}

function GlobeModel() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.04;
  });

  return (
    <group ref={groupRef}>
      {/* === SOLID SPHERE WIREFRAME — maintains spherical shape from all angles === */}
      <mesh>
        <icosahedronGeometry args={[5.8, 3]} />
        <meshStandardMaterial
          color="#1a1a30"
          emissive="#1a1a30"
          emissiveIntensity={0.25}
          metalness={0.8}
          roughness={0.35}
          wireframe
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Dark semi-transparent core sphere — matches wireframe radius */}
      <mesh>
        <sphereGeometry args={[5.75, 64, 64]} />
        <meshStandardMaterial
          color="#0a0a18"
          emissive="#040410"
          emissiveIntensity={0.1}
          metalness={0.3}
          roughness={0.65}
          transparent
          opacity={0.45}
        />
      </mesh>

      {/* === ORBITAL RINGS — distinct radii for depth separation === */}
      <EnergyRing radius={5.8} color="#D6A84F" emissive="#D6A84F" axis="y" rotationSpeed={0.15} pulseSpeed={0.5} />
      <EnergyRing radius={5.95} color="#C32828" emissive="#C32828" axis="x" rotationSpeed={0.12} pulseSpeed={0.7} />
      <EnergyRing radius={5.65} color="#E8A840" emissive="#E8A840" axis="z" rotationSpeed={0.2} pulseSpeed={0.6} />
      <EnergyRing radius={6.1} color="#8B4FDF" emissive="#8B4FDF" axis="y" rotationSpeed={0.1} pulseSpeed={0.4} />

      {/* Arc wall — sits on sphere surface */}
      <mesh>
        <torusGeometry args={[5.8, 0.08, 16, 140, Math.PI * 0.55]} />
        <meshStandardMaterial color="#8B1E1E" emissive="#C32828" emissiveIntensity={0.5} metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Tech panel — behind/outside the sphere */}
      <mesh position={[0, 0, -7]}>
        <planeGeometry args={[8, 4.5]} />
        <meshPhysicalMaterial color="#080E1A" emissive="#1a1040" emissiveIntensity={0.4} metalness={0.9} roughness={0.2} transparent opacity={0.4} />
      </mesh>

      {/* Central glowing orb */}
      <CentralOrb />

      {/* Floating shapes */}
      <FloatingShapes />

      {/* Energy arcs */}
      <EnergyArcs />

      {/* Base platform — matches sphere bottom */}
      <mesh position={[0, -5.8, 0]} rotation-x={-Math.PI / 2}>
        <cylinderGeometry args={[5.0, 5.5, 0.3, 64]} />
        <meshStandardMaterial color="#120608" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, -5.55, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[5.1, 5.4, 64]} />
        <meshBasicMaterial color="#D6A84F" side={THREE.DoubleSide} transparent opacity={0.35} depthWrite={false} />
      </mesh>
    </group>
  );
}

function GlobeScene() {
  return (
    <>
      <GlobeLights />
      <GlobeModel />
    </>
  );
}

export function HeroGlobeCanvas() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-full h-full" style={{ maxWidth: "100vh", aspectRatio: "1/1", margin: "0 auto" }}>
        <Canvas
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          camera={{ position: [0, 3, 16], fov: 52 }}
        >
          <GlobeScene />
        </Canvas>
      </div>
    </div>
  );
}

/* ================================================================
   COMBINED EXPORT — both layers stacked
   ================================================================ */
export default function HeroThreeScene() {
  return (
    <div className="absolute inset-0">
      {/* Layer 0: Full-screen particles */}
      <HeroParticlesCanvas />
      {/* Layer 1: Centered square globe */}
      <div className="absolute inset-0 z-[1]">
        <HeroGlobeCanvas />
      </div>
    </div>
  );
}
