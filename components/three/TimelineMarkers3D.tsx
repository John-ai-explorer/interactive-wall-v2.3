"use client";

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { TimelineNode } from "@/lib/types";

type Props = {
  nodes: TimelineNode[];
  currentNodeId: string;
  visitedNodeIds: string[];
};

function Marker({
  position,
  isCurrent,
  isVisited,
  label,
}: {
  position: [number, number, number];
  isCurrent: boolean;
  isVisited: boolean;
  label?: string;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  const sphereRef = useRef<THREE.Mesh>(null);

  const emissiveColor = useMemo(
    () => (isCurrent ? "#C32828" : isVisited ? "#D6A84F" : "#4a3a2a"),
    [isCurrent, isVisited]
  );
  const emissiveIntensity = isCurrent ? 0.9 : isVisited ? 0.5 : 0.2;

  useFrame((_, delta) => {
    if (ringRef.current && isCurrent) {
      ringRef.current.scale.setScalar(
        1 + Math.sin(Date.now() * 0.004) * 0.15
      );
      ringRef.current.material = new THREE.MeshBasicMaterial({
        color: "#C32828",
        transparent: true,
        opacity: 0.25 + Math.sin(Date.now() * 0.004) * 0.1,
        side: THREE.DoubleSide,
      });
    }
    if (sphereRef.current && isCurrent) {
      sphereRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group position={position}>
      {/* Main sphere */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[isCurrent ? 0.08 : 0.05, 16, 16]} />
        <meshStandardMaterial
          color={emissiveColor}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Pulse ring for current */}
      {isCurrent && (
        <mesh ref={ringRef} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.09, 0.13, 32]} />
          <meshBasicMaterial
            color="#C32828"
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Visited ring */}
      {isVisited && !isCurrent && (
        <mesh rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.06, 0.09, 32]} />
          <meshBasicMaterial
            color="#D6A84F"
            transparent
            opacity={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Label */}
      {label && (
        <Text
          position={[0, 0.2, 0]}
          fontSize={0.15}
          color={isCurrent ? "#F7F2E8" : "#B9B1A2"}
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      )}
    </group>
  );
}

export default function TimelineMarkers3D({
  nodes,
  currentNodeId,
  visitedNodeIds,
}: Props) {
  return (
    <group>
      {nodes.map((node) => (
        <Marker
          key={node.id}
          position={node.marker.position}
          isCurrent={node.id === currentNodeId}
          isVisited={visitedNodeIds.includes(node.id)}
          label={node.marker.label}
        />
      ))}
    </group>
  );
}
