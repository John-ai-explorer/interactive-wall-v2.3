"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { interpolateCamera } from "@/lib/timeline";
import type { TimelineNode } from "@/lib/types";

type Props = {
  nodes: TimelineNode[];
  progress: number;
};

export default function CameraPathController({ nodes, progress }: Props) {
  const { camera } = useThree();
  const targetRef = useRef(new THREE.Vector3(0, 0.8, 0));

  useFrame(() => {
    if (nodes.length === 0) return;

    const { position, target } = interpolateCamera(progress, nodes);
    const targetPos = new THREE.Vector3(...position);
    const targetLook = new THREE.Vector3(...target);

    // Smooth lerp
    camera.position.lerp(targetPos, 0.06);
    targetRef.current.lerp(targetLook, 0.06);
    camera.lookAt(targetRef.current);
  });

  return null;
}
