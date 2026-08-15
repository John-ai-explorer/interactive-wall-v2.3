export type HotspotAnchor = { left: number; top: number };

const HOTSPOT_ANCHORS: HotspotAnchor[] = [
  { left: 30, top: 34 },
  { left: 46, top: 42 },
  { left: 58, top: 31 },
  { left: 70, top: 45 },
  { left: 40, top: 54 },
];

export function getHotspotAnchor(index: number): HotspotAnchor {
  return HOTSPOT_ANCHORS[index] ?? HOTSPOT_ANCHORS[HOTSPOT_ANCHORS.length - 1];
}
