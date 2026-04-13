// src/core/FacePicker.ts
import { Scene } from "@babylonjs/core/scene";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { Observer } from "@babylonjs/core/Misc/observable";
import type { PointerInfo } from "@babylonjs/core/Events/pointerEvents";
import { CubeFace, faceIndexToFace } from "./types";

const HOVER_COLOR = new Color3(0.3, 0.5, 1.0);
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
  private observer: Observer<PointerInfo> | null = null;

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
    this.observer = this.scene.onPointerObservable.add((pointerInfo) => {
      switch (pointerInfo.type) {
        case PointerEventTypes.POINTERMOVE:
          this.handleHover(pointerInfo);
          break;
        case PointerEventTypes.POINTERTAP:
          this.handleTap(pointerInfo);
          break;
      }
    });
  }

  private handleHover(_pointerInfo: PointerInfo): void {
    // Clear previous hover
    if (this.hoveredFaceIndex >= 0) {
      this.faceMaterials[this.hoveredFaceIndex].emissiveColor = DEFAULT_EMISSIVE;
      this.hoveredFaceIndex = -1;
    }

    // POINTERMOVE doesn't auto-pick in Babylon.js — do it manually
    const pickResult = this.scene.pick(this.scene.pointerX, this.scene.pointerY);
    if (pickResult?.hit && pickResult.pickedMesh === this.cubeMesh) {
      const faceIndex = Math.floor(pickResult.faceId / 2);
      if (faceIndex >= 0 && faceIndex < 6) {
        this.faceMaterials[faceIndex].emissiveColor = HOVER_COLOR;
        this.hoveredFaceIndex = faceIndex;
      }
    }
  }

  private handleTap(pointerInfo: PointerInfo): void {
    const pickResult = pointerInfo.pickInfo;
    if (pickResult?.hit && pickResult.pickedMesh === this.cubeMesh) {
      const faceIndex = Math.floor(pickResult.faceId / 2);
      const face = faceIndexToFace(faceIndex);
      if (face) {
        this.callbacks.onFaceClick(face);
      }
    }
  }

  dispose(): void {
    if (this.observer) {
      this.scene.onPointerObservable.remove(this.observer);
      this.observer = null;
    }
  }
}
