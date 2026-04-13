// src/core/CubeBuilder.ts
import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { MultiMaterial } from "@babylonjs/core/Materials/multiMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { SubMesh } from "@babylonjs/core/Meshes/subMesh";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { CubeFace, FACE_LABELS } from "./types";

const FACE_ORDER: CubeFace[] = [
  CubeFace.FRONT,
  CubeFace.BACK,
  CubeFace.RIGHT,
  CubeFace.LEFT,
  CubeFace.TOP,
  CubeFace.BOTTOM,
];

const TEXTURE_SIZE = 256;
const CUBE_SIZE = 2;

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

    // Draw face label centered on white background
    const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

    // Border
    ctx.strokeStyle = "#cccccc";
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, TEXTURE_SIZE - 4, TEXTURE_SIZE - 4);

    // Label text
    ctx.font = "bold 36px Arial";
    ctx.fillStyle = "#333333";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, TEXTURE_SIZE / 2, TEXTURE_SIZE / 2);
    tex.update();

    mat.diffuseTexture = tex;
    mat.specularColor = new Color3(0.1, 0.1, 0.1);

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
