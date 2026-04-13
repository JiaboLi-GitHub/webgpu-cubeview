// src/core/FacePicker.ts
import { Scene } from "@babylonjs/core/scene";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { CubeFace, faceIndexToFace } from "./types";

const HOVER_COLOR = new Color3(0.3, 0.5, 1.0); // Light blue highlight
const DEFAULT_EMISSIVE = Color3.Black();

export interface FacePickerCallbacks {
  onFaceClick: (face: CubeFace) => void;
}

export class FacePicker {
  private scene: Scene;
  private cubeMesh: Mesh;
  private faceMaterials: StandardMaterial[];
  private callbacks: FacePickerCallbacks;

  private hoveredFaceIndex: number = -1;
  private pointerDownX: number = 0;
  private pointerDownY: number = 0;

  constructor(
    scene: Scene,
    cubeMesh: Mesh,
    faceMaterials: StandardMaterial[],
    callbacks: FacePickerCallbacks,
  ) {
    this.scene = scene;
    this.cubeMesh = cubeMesh;
    this.faceMaterials = faceMaterials;
    this.callbacks = callbacks;
    this.setup();
  }

  private setup(): void {
    const canvas = this.scene.getEngine().getRenderingCanvas();
    if (!canvas) return;

    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointerup", this.onPointerUp);
  }

  private onPointerMove = (): void => {
    const pickResult = this.scene.pick(
      this.scene.pointerX,
      this.scene.pointerY,
    );

    // Clear previous hover
    if (this.hoveredFaceIndex >= 0) {
      this.faceMaterials[this.hoveredFaceIndex].emissiveColor = DEFAULT_EMISSIVE;
      this.hoveredFaceIndex = -1;
    }

    if (pickResult.hit && pickResult.pickedMesh === this.cubeMesh) {
      const faceIndex = Math.floor(pickResult.faceId / 2);
      if (faceIndex >= 0 && faceIndex < 6) {
        this.faceMaterials[faceIndex].emissiveColor = HOVER_COLOR;
        this.hoveredFaceIndex = faceIndex;
      }
    }
  };

  private onPointerDown = (evt: PointerEvent): void => {
    this.pointerDownX = evt.clientX;
    this.pointerDownY = evt.clientY;
  };

  private onPointerUp = (evt: PointerEvent): void => {
    // Distinguish click from drag: if pointer moved more than 5px, it was a drag
    const dx = evt.clientX - this.pointerDownX;
    const dy = evt.clientY - this.pointerDownY;
    if (dx * dx + dy * dy > 25) return; // Was a drag, not a click

    const pickResult = this.scene.pick(
      this.scene.pointerX,
      this.scene.pointerY,
    );

    if (pickResult.hit && pickResult.pickedMesh === this.cubeMesh) {
      const faceIndex = Math.floor(pickResult.faceId / 2);
      const face = faceIndexToFace(faceIndex);
      if (face) {
        this.callbacks.onFaceClick(face);
      }
    }
  };

  dispose(): void {
    const canvas = this.scene.getEngine().getRenderingCanvas();
    if (!canvas) return;
    canvas.removeEventListener("pointermove", this.onPointerMove);
    canvas.removeEventListener("pointerdown", this.onPointerDown);
    canvas.removeEventListener("pointerup", this.onPointerUp);
  }
}
