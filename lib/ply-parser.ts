/**
 * Minimal binary PLY parser for Gaussian Splat point clouds.
 * Handles format: binary_little_endian 1.0
 * with properties: x, y, z, f_dc_0, f_dc_1, f_dc_2, opacity, scale_*, rot_*
 */

export type PlyHeader = {
  vertexCount: number;
  properties: string[]; // e.g. ["x","y","z","f_dc_0","f_dc_1","f_dc_2","opacity",...]
  vertexByteSize: number; // bytes per vertex
};

export type ParsedPly = {
  header: PlyHeader;
  positions: Float32Array; // xyz
  colors: Float32Array; // rgb (from f_dc or opacity-inferred)
};

/** Parse PLY header from text buffer */
export function parsePlyHeader(text: string): PlyHeader {
  const lines = text.split("\n");
  let vertexCount = 0;
  const properties: string[] = [];
  let inVertex = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("element vertex ")) {
      vertexCount = parseInt(trimmed.split(" ")[2], 10);
    }
    if (trimmed === "end_header") break;
    if (inVertex && trimmed.startsWith("property ")) {
      const parts = trimmed.split(" ");
      properties.push(parts[2]); // property float <name>
    }
    if (trimmed.startsWith("element vertex")) {
      inVertex = true;
      properties.length = 0;
    }
    if (inVertex && trimmed.startsWith("element ")) {
      // Moved to next element — stop collecting vertex properties
      // (we just keep the vertex ones; other elements are ignored)
    }
  }

  // Each property is a float (4 bytes) in binary_little_endian
  const vertexByteSize = properties.length * 4;

  return { vertexCount, properties, vertexByteSize };
}

/** Load and parse a binary PLY file */
export async function loadPlyFile(url: string): Promise<ParsedPly> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const buffer = await response.arrayBuffer();

  // Find end of ASCII header
  const headerBytes = new Uint8Array(buffer);
  let headerEnd = 0;
  for (let i = 0; i < headerBytes.length - 9; i++) {
    if (
      headerBytes[i] === 0x65 && // e
      headerBytes[i + 1] === 0x6e && // n
      headerBytes[i + 2] === 0x64 && // d
      headerBytes[i + 3] === 0x5f && // _
      headerBytes[i + 4] === 0x68 && // h
      headerBytes[i + 5] === 0x65 && // e
      headerBytes[i + 6] === 0x61 && // a
      headerBytes[i + 7] === 0x64 && // d
      headerBytes[i + 8] === 0x65 && // e
      headerBytes[i + 9] === 0x72 // r
    ) {
      headerEnd = i + 10; // "end_header\n" → 11 chars, or "end_header\r\n"
      if (headerBytes[headerEnd] === 0x0d) headerEnd++; // \r
      if (headerBytes[headerEnd] === 0x0a) headerEnd++; // \n
      break;
    }
  }

  // Parse header text
  const headerText = new TextDecoder().decode(buffer.slice(0, headerEnd));
  const header = parsePlyHeader(headerText);

  // Parse binary vertex data
  const vertexData = new DataView(buffer, headerEnd);
  const positions = new Float32Array(header.vertexCount * 3);
  const colors = new Float32Array(header.vertexCount * 3);

  // Find property indices
  const propIdx: Record<string, number> = {};
  header.properties.forEach((p, i) => {
    propIdx[p] = i;
  });

  const xIdx = propIdx["x"] ?? 0;
  const yIdx = propIdx["y"] ?? 1;
  const zIdx = propIdx["z"] ?? 2;

  // Color from f_dc (spherical harmonics DC component) or fallback
  const rIdx = propIdx["f_dc_0"];
  const gIdx = propIdx["f_dc_1"];
  const bIdx = propIdx["f_dc_2"];
  const opacityIdx = propIdx["opacity"];

  for (let i = 0; i < header.vertexCount; i++) {
    const offset = i * header.vertexByteSize;

    positions[i * 3] = vertexData.getFloat32(offset + xIdx * 4, true);
    positions[i * 3 + 1] = vertexData.getFloat32(offset + yIdx * 4, true);
    positions[i * 3 + 2] = vertexData.getFloat32(offset + zIdx * 4, true);

    if (rIdx !== undefined && gIdx !== undefined && bIdx !== undefined) {
      // Convert SH DC to RGB (SH0 = 1/(2*sqrt(pi)) ≈ 0.28209)
      // f_dc = RGB * 0.28209 → RGB = f_dc / 0.28209, then clamp
      let r = vertexData.getFloat32(offset + rIdx * 4, true) / 0.28209;
      let g = vertexData.getFloat32(offset + gIdx * 4, true) / 0.28209;
      let b = vertexData.getFloat32(offset + bIdx * 4, true) / 0.28209;
      // Sigmoid activation for SH colors (standard practice)
      r = 1 / (1 + Math.exp(-r));
      g = 1 / (1 + Math.exp(-g));
      b = 1 / (1 + Math.exp(-b));
      colors[i * 3] = Math.max(0, Math.min(1, r));
      colors[i * 3 + 1] = Math.max(0, Math.min(1, g));
      colors[i * 3 + 2] = Math.max(0, Math.min(1, b));
    } else if (opacityIdx !== undefined) {
      // Fallback: use opacity as grayscale
      const o = Math.max(
        0,
        Math.min(1, vertexData.getFloat32(offset + opacityIdx * 4, true))
      );
      colors[i * 3] = o * 0.8;
      colors[i * 3 + 1] = o * 0.5;
      colors[i * 3 + 2] = o * 0.3;
    } else {
      // Default gold-ish
      colors[i * 3] = 0.84;
      colors[i * 3 + 1] = 0.66;
      colors[i * 3 + 2] = 0.31;
    }
  }

  return { header, positions, colors };
}
