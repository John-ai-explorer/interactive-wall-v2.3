"use client";

export default function LightRig() {
  return (
    <>
      {/* Ambient fill */}
      <ambientLight color="#322020" intensity={0.6} />

      {/* Key warm light */}
      <pointLight
        position={[3, 4, 4]}
        color="#D6A84F"
        intensity={2.5}
        distance={12}
        decay={2}
      />

      {/* Rim cool light for contrast */}
      <pointLight
        position={[-3, 2, -2]}
        color="#8B1E1E"
        intensity={1.5}
        distance={10}
        decay={2}
      />

      {/* Subtle top light */}
      <directionalLight
        position={[0, 5, 0]}
        color="#ffffff"
        intensity={0.4}
      />
    </>
  );
}
