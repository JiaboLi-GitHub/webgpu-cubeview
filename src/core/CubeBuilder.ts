// src/core/CubeBuilder.ts
import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { MultiMaterial } from "@babylonjs/core/Materials/multiMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { SubMesh } from "@babylonjs/core/Meshes/subMesh";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { CubeFace, FACE_LABELS } from "./types";

/**
 * Babylon.js CreateBox index buffer face ordering (verified empirically):
 * 0=right(X+), 1=left(X-), 2=front(Z+), 3=back(Z-), 4=top(Y+), 5=bottom(Y-)
 */
const FACE_ORDER: CubeFace[] = [
  CubeFace.RIGHT,
  CubeFace.LEFT,
  CubeFace.FRONT,
  CubeFace.BACK,
  CubeFace.TOP,
  CubeFace.BOTTOM,
];

const TEXTURE_SIZE = 256;
const CUBE_SIZE = 2;
const S = TEXTURE_SIZE;
const HALF = S / 2;

/**
 * Canvas rotation (radians) to correct UV orientation per Babylon.js box face.
 * Babylon.js CreateBox UV mapping differs per face — these rotations make
 * text appear upright when viewing each face straight-on.
 */
/**
 * Rotations keyed by CubeFace, applied to the physical face each label lands on.
 * Physical faces: RIGHT→X+, LEFT→X-, FRONT→Z+, BACK→Z-, TOP→Y+, BOTTOM→Y-
 */
const FACE_TEXTURE_ROTATION: Record<CubeFace, number> = {
  [CubeFace.RIGHT]:  Math.PI,       // X+ face: upside down → rotate 180°
  [CubeFace.LEFT]:   Math.PI,       // X- face: upside down → rotate 180°
  [CubeFace.FRONT]:  Math.PI / 2,   // Z+ face: rotated CCW → rotate 90° CW
  [CubeFace.BACK]:   -Math.PI / 2,  // Z- face: rotated CW → rotate 90° CCW
  [CubeFace.TOP]:    -Math.PI / 2,  // Y+ face: rotated CW → rotate 90° CCW
  [CubeFace.BOTTOM]: Math.PI / 2,   // Y- face: rotated CCW → rotate 90° CW
};

export interface CubeBuilderResult {
  mesh: Mesh;
  faceMaterials: StandardMaterial[];
}

export function buildCube(scene: Scene): CubeBuilderResult {
  const box = MeshBuilder.CreateBox("cubeView", { size: CUBE_SIZE }, scene);

  const multiMat = new MultiMaterial("cubeMultiMat", scene);
  const faceMaterials: StandardMaterial[] = [];

  for (let i = 0; i < 6; i++) {
    const face = FACE_ORDER[i];
    const label = FACE_LABELS[face];

    const mat = new StandardMaterial(`mat_${face}`, scene);
    const tex = new DynamicTexture(`tex_${face}`, TEXTURE_SIZE, scene, true);

    // Draw face label with per-face rotation to correct UV orientation
    const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
    const rotation = FACE_TEXTURE_ROTATION[face];

    // Background (drawn without rotation — fills entire canvas)
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, S, S);
    ctx.strokeStyle = "#cccccc";
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, S - 4, S - 4);

    // Rotated text
    ctx.save();
    ctx.translate(HALF, HALF);
    ctx.rotate(rotation);
    ctx.font = "bold 36px Arial";
    ctx.fillStyle = "#333333";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 0, 0);
    ctx.restore();
    tex.update();

    mat.emissiveTexture = tex;
    mat.disableLighting = true;

    faceMaterials.push(mat);
    multiMat.subMaterials.push(mat);
  }

  // Assign sub-meshes: one per face, each face = 6 indices (2 triangles)
  box.subMeshes = [];
  const totalVertices = box.getTotalVertices();
  for (let i = 0; i < 6; i++) {
    new SubMesh(i, 0, totalVertices, i * 6, 6, box);
  }

  box.material = multiMat;

  return { mesh: box, faceMaterials };
}
