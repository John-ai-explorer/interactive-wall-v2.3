"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";
import type { TimelineNode } from "@/lib/types";

type Props = {
  nodes: TimelineNode[];
  progress: number;
};

export default function StoryPath({ nodes, progress }: Props) {
  const points = useMemo(() => {
    // Build a curved path through all marker positions
    return nodes.map(
      (n) =>
        new THREE.Vector3(
          n.marker.position[0],
          n.marker.position[1],
          n.marker.position[2]
        )
    );
  }, [nodes]);

  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3(points);
  }, [points]);

  const tubePath = useMemo(() => {
    return curve.getPoints(200);
  }, [curve]);

  // Visible portion of the path based on progress
  const visiblePoints = useMemo(() => {
    const total = tubePath.length;
    const visibleCount = Math.floor(total * Math.max(progress, 0.02));
    return tubePath.slice(0, Math.max(visibleCount, 2));
  }, [tubePath, progress]);

  return (
    <group>
      {/* Dim full path */}
      <Line
        points={tubePath}
        color="#D6A84F"
        opacity={0.12}
        transparent
        lineWidth={1}
      />

      {/* Bright visible path */}
      <Line
        points={visiblePoints}
        color="#D6A84F"
        opacity={0.5}
        transparent
        lineWidth={2}
      />
    </group>
  );
}
