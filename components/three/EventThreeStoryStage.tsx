"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import type { TimelineNode } from "@/lib/types";
import LightRig from "./LightRig";
import StoryPath from "./StoryPath";
import TimelineMarkers3D from "./TimelineMarkers3D";
import CameraPathController from "./CameraPathController";

type Props = {
  nodes: TimelineNode[];
  progress: number;
  currentNodeId: string;
};

function ParticleStars() {
  const positions = useMemo(() => {
    const arr = new Float32Array(80 * 3);
    for (let i = 0; i < arr.length; i++) {
      arr[i] = (Math.random() - 0.5) * 8;
    }
    return arr;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#D6A84F"
        transparent
        opacity={0.4}
      />
    </points>
  );
}

function StoryScene({ nodes, progress, currentNodeId }: Props) {
  const visitedNodeIds = useMemo(() => {
    const currentIdx = nodes.findIndex((n) => n.id === currentNodeId);
    return nodes
      .slice(0, currentIdx)
      .map((n) => n.id);
  }, [nodes, currentNodeId]);

  return (
    <>
      <LightRig />

      {/* Exhibition wall */}
      <mesh position={[0, 1.0, -2.5]} receiveShadow>
        <boxGeometry args={[6, 3, 0.15]} />
        <meshStandardMaterial
          color="#120608"
          metalness={0.3}
          roughness={0.6}
        />
      </mesh>

      {/* Floor */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -1.5, 0]} receiveShadow>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial
          color="#080E1A"
          metalness={0.5}
          roughness={0.8}
        />
      </mesh>

      {/* Reflective strip on floor */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -1.49, 0]}>
        <planeGeometry args={[4, 0.2]} />
        <meshBasicMaterial
          color="#C32828"
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Background particles */}
      <ParticleStars />

      {/* Story path and markers */}
      <StoryPath nodes={nodes} progress={progress} />
      <TimelineMarkers3D
        nodes={nodes}
        currentNodeId={currentNodeId}
        visitedNodeIds={visitedNodeIds}
      />

      {/* Camera controller */}
      <CameraPathController nodes={nodes} progress={progress} />
    </>
  );
}

export default function EventThreeStoryStage({
  nodes,
  progress,
  currentNodeId,
}: Props) {
  return (
    <div className="w-full h-full min-h-[500px]">
      <Canvas
        dpr={[2, 3]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [2.5, 1.6, 5.0], fov: 55 }}
      >
        <StoryScene
          nodes={nodes}
          progress={progress}
          currentNodeId={currentNodeId}
        />
      </Canvas>
    </div>
  );
}
