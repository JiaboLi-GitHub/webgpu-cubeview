// src/core/types.ts

export enum CubeFace {
  FRONT = "FRONT",
  BACK = "BACK",
  RIGHT = "RIGHT",
  LEFT = "LEFT",
  TOP = "TOP",
  BOTTOM = "BOTTOM",
}

export interface CameraAngles {
  alpha: number; // Horizontal rotation (ArcRotateCamera alpha)
  beta: number;  // Vertical rotation (ArcRotateCamera beta)
}

export interface CubeViewOptions {
  width?: number;
  height?: number;
  onAngleChange?: (phi: number, theta: number) => void;
}

/**
 * ArcRotateCamera angles for each cube face.
 *
 * ArcRotateCamera coordinate system:
 *  - alpha=0, beta=PI/2 → camera on +Z axis → sees FRONT face
 *  - alpha=PI/2, beta=PI/2 → camera on +X axis → sees RIGHT face
 *  - beta near 0 → camera above → sees TOP face
 *  - beta near PI → camera below → sees BOTTOM face
 *
 * beta is clamped to [0.01, PI-0.01] to avoid gimbal lock at poles.
 */
export const FACE_ANGLES: Record<CubeFace, CameraAngles> = {
  [CubeFace.FRONT]:  { alpha: 0,              beta: Math.PI / 2 },
  [CubeFace.BACK]:   { alpha: Math.PI,        beta: Math.PI / 2 },
  [CubeFace.RIGHT]:  { alpha: Math.PI / 2,    beta: Math.PI / 2 },
  [CubeFace.LEFT]:   { alpha: -Math.PI / 2,   beta: Math.PI / 2 },
  [CubeFace.TOP]:    { alpha: 0,              beta: 0.01 },
  [CubeFace.BOTTOM]: { alpha: 0,              beta: Math.PI - 0.01 },
};

/** Face labels for DynamicTexture rendering */
export const FACE_LABELS: Record<CubeFace, string> = {
  [CubeFace.FRONT]:  "FRONT",
  [CubeFace.BACK]:   "BACK",
  [CubeFace.RIGHT]:  "RIGHT",
  [CubeFace.LEFT]:   "LEFT",
  [CubeFace.TOP]:    "TOP",
  [CubeFace.BOTTOM]: "BOTTOM",
};

/**
 * Babylon.js CreateBox face index ordering (verified empirically):
 * 0=right(X+), 1=left(X-), 2=front(Z+), 3=back(Z-), 4=top(Y+), 5=bottom(Y-)
 */
const FACE_INDEX_ORDER: CubeFace[] = [
  CubeFace.RIGHT,
  CubeFace.LEFT,
  CubeFace.FRONT,
  CubeFace.BACK,
  CubeFace.TOP,
  CubeFace.BOTTOM,
];

export function faceIndexToFace(index: number): CubeFace | undefined {
  return FACE_INDEX_ORDER[index];
}
