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

// Side-effect imports: register engine methods needed by Babylon.js features
import "@babylonjs/core/Engines/Extensions/engine.dynamicTexture";
import "@babylonjs/core/Engines/Extensions/engine.alpha";
import "@babylonjs/core/Engines/WebGPU/Extensions/engine.dynamicTexture";
import "@babylonjs/core/Engines/WebGPU/Extensions/engine.alpha";
import "@babylonjs/core/Culling/ray"; // Required for scene.pick()
import "@babylonjs/core/Animations/animatable"; // Required for scene.beginDirectAnimation()

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
    camera.lowerBetaLimit = 0.01;          // Near top pole
    camera.upperBetaLimit = Math.PI - 0.01; // Near bottom pole
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

  /**
   * Normalize angle to [-PI, PI) range.
   */
  private normalizeAngle(angle: number): number {
    angle = angle % (2 * Math.PI);
    if (angle > Math.PI) angle -= 2 * Math.PI;
    if (angle <= -Math.PI) angle += 2 * Math.PI;
    return angle;
  }

  /**
   * Compute shortest-path target for alpha so the animation never rotates
   * more than 180°. Adjusts target relative to current alpha.
   */
  private shortestAlpha(current: number, target: number): number {
    let diff = this.normalizeAngle(target - current);
    return current + diff;
  }

  private animateToFace(face: CubeFace): void {
    const target = FACE_ANGLES[face];
    const canvas = this.engine.getRenderingCanvas();

    // Detach camera controls during animation to prevent input from fighting it
    this.camera.detachControl();

    const ease = new CubicEase();
    ease.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

    // Compute shortest rotation path for alpha
    const targetAlpha = this.shortestAlpha(this.camera.alpha, target.alpha);

    const alphaAnim = new Animation("camAlpha", "alpha", ANIM_FPS, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    alphaAnim.setKeys([
      { frame: 0, value: this.camera.alpha },
      { frame: ANIM_FRAMES, value: targetAlpha },
    ]);
    alphaAnim.setEasingFunction(ease);

    const betaAnim = new Animation("camBeta", "beta", ANIM_FPS, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    betaAnim.setKeys([
      { frame: 0, value: this.camera.beta },
      { frame: ANIM_FRAMES, value: target.beta },
    ]);
    betaAnim.setEasingFunction(ease);

    this.scene.beginDirectAnimation(this.camera, [alphaAnim, betaAnim], 0, ANIM_FRAMES, false, 1, () => {
      if (canvas) this.camera.attachControl(canvas, true);
    });
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
