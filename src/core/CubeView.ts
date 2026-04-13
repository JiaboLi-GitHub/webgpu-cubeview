// src/core/CubeView.ts
import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import { Engine } from "@babylonjs/core/Engines/engine";
import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { Animation } from "@babylonjs/core/Animations/animation";
import { CubicEase, EasingFunction } from "@babylonjs/core/Animations/easing";

import { CubeFace, FACE_ANGLES } from "./types";
import type { CubeViewOptions } from "./types";
import { buildCube } from "./CubeBuilder";
import { FacePicker } from "./FacePicker";

const DEFAULT_WIDTH = 150;
const DEFAULT_HEIGHT = 150;
const CAMERA_RADIUS = 5;
const ANIM_FPS = 60;
const ANIM_FRAMES = 30; // 0.5s at 60fps

export class CubeView {
  private engine: AbstractEngine;
  private scene: Scene;
  private camera: ArcRotateCamera;
  private picker: FacePicker;
  private onAngleChange?: (phi: number, theta: number) => void;

  private constructor(
    engine: AbstractEngine,
    scene: Scene,
    camera: ArcRotateCamera,
    picker: FacePicker,
    onAngleChange?: (phi: number, theta: number) => void,
  ) {
    this.engine = engine;
    this.scene = scene;
    this.camera = camera;
    this.picker = picker;
    this.onAngleChange = onAngleChange;
  }

  static async create(
    canvas: HTMLCanvasElement,
    options: CubeViewOptions = {},
  ): Promise<CubeView> {
    const width = options.width ?? DEFAULT_WIDTH;
    const height = options.height ?? DEFAULT_HEIGHT;
    canvas.width = width;
    canvas.height = height;

    // Try WebGPU, fall back to WebGL
    let engine: AbstractEngine;
    const webGPUSupported = await WebGPUEngine.IsSupportedAsync;
    if (webGPUSupported) {
      const gpuEngine = new WebGPUEngine(canvas, {
        antialias: true,
        adaptToDeviceRatio: true,
      });
      await gpuEngine.initAsync();
      engine = gpuEngine;
    } else {
      engine = new Engine(canvas, true, { adaptToDeviceRatio: true });
    }

    const scene = new Scene(engine);
    scene.clearColor = new Color4(0, 0, 0, 0); // Transparent background

    // Camera: initial isometric-ish view
    const camera = new ArcRotateCamera(
      "camera",
      Math.PI / 4,   // alpha (horizontal)
      Math.PI / 3,   // beta (vertical)
      CAMERA_RADIUS,
      Vector3.Zero(),
      scene,
    );
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = CAMERA_RADIUS;
    camera.upperRadiusLimit = CAMERA_RADIUS;
    camera.panningSensibility = 0; // Disable panning
    camera.minZ = 0.1;

    // Lighting
    const light = new HemisphericLight("light", new Vector3(0, 1, 0.5), scene);
    light.intensity = 1.0;

    // Build cube
    const { mesh, faceMaterials } = buildCube(scene);

    // Face picker
    const picker = new FacePicker(scene, mesh, faceMaterials, {
      onFaceClick: (face: CubeFace) => {
        cubeView.animateToFace(face);
      },
    });

    const cubeView = new CubeView(
      engine,
      scene,
      camera,
      picker,
      options.onAngleChange,
    );

    // Fire angle callback on camera movement
    camera.onViewMatrixChangedObservable.add(() => {
      if (cubeView.onAngleChange) {
        cubeView.onAngleChange(camera.beta, camera.alpha);
      }
    });

    // Start render loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    return cubeView;
  }

  private animateToFace(face: CubeFace): void {
    const target = FACE_ANGLES[face];

    const ease = new CubicEase();
    ease.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

    Animation.CreateAndStartAnimation(
      "camAlpha", this.camera, "alpha",
      ANIM_FPS, ANIM_FRAMES,
      this.camera.alpha, target.alpha,
      Animation.ANIMATIONLOOPMODE_CONSTANT,
      ease,
    );
    Animation.CreateAndStartAnimation(
      "camBeta", this.camera, "beta",
      ANIM_FPS, ANIM_FRAMES,
      this.camera.beta, target.beta,
      Animation.ANIMATIONLOOPMODE_CONSTANT,
      ease,
    );
  }

  setAngles(phi: number, theta: number): void {
    this.camera.beta = phi;
    this.camera.alpha = theta;
  }

  resize(width: number, height: number): void {
    const canvas = this.engine.getRenderingCanvas();
    if (canvas) {
      canvas.width = width;
      canvas.height = height;
    }
    this.engine.resize();
  }

  dispose(): void {
    this.picker.dispose();
    this.engine.stopRenderLoop();
    this.scene.dispose();
    this.engine.dispose();
  }
}
