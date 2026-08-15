import * as THREE from "three";

/** Create a red-gold gradient texture for emissive materials */
export function createRedGoldGradientTexture(
  width = 256,
  height = 256
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#8B1E1E");
  gradient.addColorStop(0.5, "#C32828");
  gradient.addColorStop(1, "#D6A84F");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/** Create a glowing gold ring mesh */
export function createGlowRing(
  radius = 2,
  tubeRadius = 0.02,
  color = 0xd6a84f
): THREE.Mesh {
  const geometry = new THREE.TorusGeometry(radius, tubeRadius, 16, 100);
  const material = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.6,
  });
  return new THREE.Mesh(geometry, material);
}

/** Create a marker sphere for timeline nodes */
export function createMarkerSphere(
  color = 0xc32828,
  radius = 0.06
): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(radius, 16, 16);
  const material = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.8,
  });
  return new THREE.Mesh(geometry, material);
}

/** Create a pulse ring (transparent circle sprite-like) */
export function createPulseRing(
  innerRadius = 0.08,
  outerRadius = 0.15,
  color = 0xc32828
): THREE.Mesh {
  const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 32);
  const material = new THREE.MeshBasicMaterial({
    color,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.5,
  });
  const ring = new THREE.Mesh(geometry, material);
  ring.rotation.x = -Math.PI / 2; // lay flat or face camera
  return ring;
}

/** Create a curved path from points */
export function createCurvePath(
  points: [number, number, number][]
): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(p[0], p[1], p[2]))
  );
}

/** Create a tube mesh along a curve */
export function createTubeFromCurve(
  curve: THREE.CatmullRomCurve3,
  color = 0xd6a84f,
  radius = 0.03,
  tubularSegments = 200
): THREE.Mesh {
  const geom = new THREE.TubeGeometry(curve, tubularSegments, radius, 8, false);
  const material = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.4,
  });
  return new THREE.Mesh(geom, material);
}
