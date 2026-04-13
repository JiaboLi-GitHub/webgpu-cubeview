# WebGPU CubeView Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite react-cubeview as a Babylon.js WebGPU library with pure TS core + React wrapper. MVP: 6-face click + drag orbit + angle callback.

**Architecture:** Two-layer design — a framework-agnostic TypeScript core class (`CubeView`) orchestrates Babylon.js WebGPU engine, scene, camera, cube mesh, and interaction. A thin React wrapper (`CubeViewComponent`) manages the canvas lifecycle and props bridging.

**Tech Stack:** TypeScript, Babylon.js 7 (`@babylonjs/core` with WebGPU engine), React 18+, Vite (library mode), Vitest

---

## File Map

| File | Responsibility |
|------|---------------|
| `src/core/types.ts` | CubeFace enum, FACE_ANGLES constant, interfaces |
| `src/core/CubeBuilder.ts` | Create box mesh + 6 DynamicTexture face materials |
| `src/core/FacePicker.ts` | Pointer hover/click detection, face highlighting |
| `src/core/CubeView.ts` | Main class: engine init, scene, camera, render loop, public API |
| `src/react/CubeViewComponent.tsx` | React FC wrapper with useRef/useEffect |
| `src/index.ts` | Public exports |
| `demo/index.html` | Visual test page |
| `demo/main.ts` | Demo script |
| `tests/core/types.test.ts` | Unit tests for angle mapping logic |
| `package.json` | Dependencies and build scripts |
| `tsconfig.json` | TypeScript config |
| `vite.config.ts` | Vite library mode build |

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "webgpu-cubeview",
  "version": "0.1.0",
  "description": "3D ViewCube navigation widget powered by Babylon.js WebGPU",
  "type": "module",
  "main": "dist/index.cjs",
  "module": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./react": {
      "import": "./dist/react.js",
      "require": "./dist/react.cjs",
      "types": "./dist/react.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "dev": "vite serve demo",
    "build": "vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  },
  "peerDependenciesMeta": {
    "react": { "optional": true },
    "react-dom": { "optional": true }
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vite": "^5.4.0",
    "vite-plugin-dts": "^3.9.0",
    "vitest": "^1.6.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@types/react": "^18.3.0"
  },
  "dependencies": {
    "@babylonjs/core": "^7.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationDir": "dist",
    "outDir": "dist",
    "sourceMap": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "demo", "tests"]
}
```

- [ ] **Step 3: Create vite.config.ts**

```typescript
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    dts({ rollupTypes: true }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        react: resolve(__dirname, "src/react/CubeViewComponent.tsx"),
      },
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
    },
  },
});
```

- [ ] **Step 4: Install dependencies**

Run: `npm install`
Expected: `node_modules` created, lock file generated, no errors.

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json vite.config.ts package-lock.json
git commit -m "chore: project scaffolding with vite, typescript, babylonjs"
```

---

### Task 2: Types & Constants

**Files:**
- Create: `src/core/types.ts`
- Create: `tests/core/types.test.ts`

- [ ] **Step 1: Write failing test for face angle mapping**

```typescript
// tests/core/types.test.ts
import { describe, it, expect } from "vitest";
import { CubeFace, FACE_ANGLES } from "../../src/core/types";

describe("FACE_ANGLES", () => {
  it("defines angles for all 6 faces", () => {
    expect(Object.keys(FACE_ANGLES)).toHaveLength(6);
  });

  it("FRONT face: camera on +Z axis (alpha=0, beta=PI/2)", () => {
    const angles = FACE_ANGLES[CubeFace.FRONT];
    expect(angles.alpha).toBeCloseTo(0);
    expect(angles.beta).toBeCloseTo(Math.PI / 2);
  });

  it("TOP face: camera above (beta near 0)", () => {
    const angles = FACE_ANGLES[CubeFace.TOP];
    expect(angles.beta).toBeCloseTo(0.01);
  });

  it("BOTTOM face: camera below (beta near PI)", () => {
    const angles = FACE_ANGLES[CubeFace.BOTTOM];
    expect(angles.beta).toBeCloseTo(Math.PI - 0.01);
  });

  it("RIGHT face: camera on +X axis (alpha=PI/2)", () => {
    const angles = FACE_ANGLES[CubeFace.RIGHT];
    expect(angles.alpha).toBeCloseTo(Math.PI / 2);
    expect(angles.beta).toBeCloseTo(Math.PI / 2);
  });

  it("LEFT face: camera on -X axis (alpha=-PI/2)", () => {
    const angles = FACE_ANGLES[CubeFace.LEFT];
    expect(angles.alpha).toBeCloseTo(-Math.PI / 2);
    expect(angles.beta).toBeCloseTo(Math.PI / 2);
  });

  it("BACK face: camera on -Z axis (alpha=PI)", () => {
    const angles = FACE_ANGLES[CubeFace.BACK];
    expect(angles.alpha).toBeCloseTo(Math.PI);
    expect(angles.beta).toBeCloseTo(Math.PI / 2);
  });
});

describe("faceIndexToFace", () => {
  it("maps Babylon.js box face indices 0-5 to CubeFace", () => {
    // Babylon.js CreateBox face order: front, back, right, left, top, bottom
    const { faceIndexToFace } = await import("../../src/core/types");
    expect(faceIndexToFace(0)).toBe(CubeFace.FRONT);
    expect(faceIndexToFace(1)).toBe(CubeFace.BACK);
    expect(faceIndexToFace(2)).toBe(CubeFace.RIGHT);
    expect(faceIndexToFace(3)).toBe(CubeFace.LEFT);
    expect(faceIndexToFace(4)).toBe(CubeFace.TOP);
    expect(faceIndexToFace(5)).toBe(CubeFace.BOTTOM);
  });

  it("returns undefined for out-of-range index", () => {
    const { faceIndexToFace } = await import("../../src/core/types");
    expect(faceIndexToFace(6)).toBeUndefined();
    expect(faceIndexToFace(-1)).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/core/types.test.ts`
Expected: FAIL — cannot resolve `../../src/core/types`

- [ ] **Step 3: Implement types.ts**

```typescript
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
 * Babylon.js CreateBox face index ordering:
 * 0=front(Z+), 1=back(Z-), 2=right(X+), 3=left(X-), 4=top(Y+), 5=bottom(Y-)
 */
const FACE_INDEX_ORDER: CubeFace[] = [
  CubeFace.FRONT,
  CubeFace.BACK,
  CubeFace.RIGHT,
  CubeFace.LEFT,
  CubeFace.TOP,
  CubeFace.BOTTOM,
];

export function faceIndexToFace(index: number): CubeFace | undefined {
  return FACE_INDEX_ORDER[index];
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/core/types.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/types.ts tests/core/types.test.ts
git commit -m "feat: add CubeFace types, angle mappings, and face index lookup"
```

---

### Task 3: CubeBuilder

**Files:**
- Create: `src/core/CubeBuilder.ts`

- [ ] **Step 1: Implement CubeBuilder**

```typescript
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
    const ctx = tex.getContext();
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
```

- [ ] **Step 2: Commit**

```bash
git add src/core/CubeBuilder.ts
git commit -m "feat: CubeBuilder creates box mesh with 6 labeled face materials"
```

---

### Task 4: FacePicker

**Files:**
- Create: `src/core/FacePicker.ts`

- [ ] **Step 1: Implement FacePicker**

```typescript
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
  private isDragging: boolean = false;

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
    this.isDragging = false;
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
```

- [ ] **Step 2: Commit**

```bash
git add src/core/FacePicker.ts
git commit -m "feat: FacePicker with hover highlight and click-to-face detection"
```

---

### Task 5: CubeView Main Class

**Files:**
- Create: `src/core/CubeView.ts`

- [ ] **Step 1: Implement CubeView**

```typescript
// src/core/CubeView.ts
import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import { Engine } from "@babylonjs/core/Engines/engine";
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

// Side-effect imports needed for WebGPU engine features
import "@babylonjs/core/Engines/WebGPU/Extensions/engine.uniformBuffer";

const DEFAULT_WIDTH = 150;
const DEFAULT_HEIGHT = 150;
const CAMERA_RADIUS = 5;
const ANIM_FPS = 60;
const ANIM_FRAMES = 30; // 0.5s at 60fps

export class CubeView {
  private engine: Engine;
  private scene: Scene;
  private camera: ArcRotateCamera;
  private picker: FacePicker;
  private onAngleChange?: (phi: number, theta: number) => void;

  private constructor(
    engine: Engine,
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
    let engine: Engine;
    const webGPUSupported = await WebGPUEngine.IsSupportedAsync();
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
```

- [ ] **Step 2: Commit**

```bash
git add src/core/CubeView.ts
git commit -m "feat: CubeView main class with WebGPU engine, camera, and face animation"
```

---

### Task 6: Public Exports

**Files:**
- Create: `src/index.ts`

- [ ] **Step 1: Create index.ts**

```typescript
// src/index.ts
export { CubeView } from "./core/CubeView";
export { CubeFace, FACE_ANGLES } from "./core/types";
export type { CubeViewOptions, CameraAngles } from "./core/types";
```

- [ ] **Step 2: Commit**

```bash
git add src/index.ts
git commit -m "feat: public API exports"
```

---

### Task 7: Demo Page

**Files:**
- Create: `demo/index.html`
- Create: `demo/main.ts`

- [ ] **Step 1: Create demo/index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WebGPU CubeView Demo</title>
  <style>
    body {
      margin: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #1a1a2e;
      color: #eee;
      font-family: system-ui, sans-serif;
    }
    #cubeCanvas {
      border: 1px solid #444;
      border-radius: 8px;
    }
    #info {
      margin-top: 16px;
      font-size: 14px;
      color: #aaa;
    }
  </style>
</head>
<body>
  <h2>WebGPU CubeView</h2>
  <canvas id="cubeCanvas"></canvas>
  <div id="info">phi: — / theta: —</div>
  <script type="module" src="./main.ts"></script>
</body>
</html>
```

- [ ] **Step 2: Create demo/main.ts**

```typescript
// demo/main.ts
import { CubeView } from "../src/index";

const canvas = document.getElementById("cubeCanvas") as HTMLCanvasElement;
const info = document.getElementById("info")!;

CubeView.create(canvas, {
  width: 250,
  height: 250,
  onAngleChange: (phi, theta) => {
    info.textContent = `phi: ${phi.toFixed(2)} / theta: ${theta.toFixed(2)}`;
  },
}).then((cv) => {
  console.log("CubeView initialized", cv);
  // Expose for console debugging
  (window as any).cubeView = cv;
});
```

- [ ] **Step 3: Run dev server and visually verify**

Run: `npx vite serve demo`
Expected: Opens browser. Cube visible with 6 labeled faces. Drag to orbit. Click face → camera animates to face view. Angle info updates.

**Verification checklist:**
- [ ] Cube renders with all 6 face labels readable
- [ ] Face labels match their actual positions (FRONT on Z+ face, etc.)
- [ ] Hover highlights the face under cursor
- [ ] Click a face → smooth camera animation to that face
- [ ] Drag to orbit works
- [ ] phi/theta display updates on camera movement

If face labels are swapped or mirrored, adjust `FACE_INDEX_ORDER` in `types.ts` or the texture drawing in `CubeBuilder.ts`.

- [ ] **Step 4: Commit**

```bash
git add demo/
git commit -m "feat: demo page for visual testing"
```

---

### Task 8: React Wrapper

**Files:**
- Create: `src/react/CubeViewComponent.tsx`

- [ ] **Step 1: Implement CubeViewComponent**

```tsx
// src/react/CubeViewComponent.tsx
import { useRef, useEffect, useCallback } from "react";
import { CubeView } from "../core/CubeView";
import type { CubeViewOptions } from "../core/types";

export interface CubeViewProps {
  width?: number;
  height?: number;
  onAngleChange?: (phi: number, theta: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function CubeViewComponent({
  width = 150,
  height = 150,
  onAngleChange,
  className,
  style,
}: CubeViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cubeViewRef = useRef<CubeView | null>(null);

  // Stable callback ref to avoid re-creating CubeView on callback change
  const callbackRef = useRef(onAngleChange);
  callbackRef.current = onAngleChange;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;

    CubeView.create(canvas, {
      width,
      height,
      onAngleChange: (phi: number, theta: number) => {
        callbackRef.current?.(phi, theta);
      },
    }).then((cv) => {
      if (disposed) {
        cv.dispose();
        return;
      }
      cubeViewRef.current = cv;
    });

    return () => {
      disposed = true;
      cubeViewRef.current?.dispose();
      cubeViewRef.current = null;
    };
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={style}
    />
  );
}
```

- [ ] **Step 2: Add React export to index**

Update `src/react/CubeViewComponent.tsx` is already a separate entry point in vite.config.ts. Add a barrel re-export:

```typescript
// At the end of src/react/CubeViewComponent.tsx, the named export is already there.
// The vite config entry "react" points to this file.
```

No additional file changes needed — the vite config already has `react: resolve(__dirname, "src/react/CubeViewComponent.tsx")` as a separate entry.

- [ ] **Step 3: Commit**

```bash
git add src/react/CubeViewComponent.tsx
git commit -m "feat: React wrapper component for CubeView"
```

---

### Task 9: Build Verification

- [ ] **Step 1: Run unit tests**

Run: `npx vitest run`
Expected: All tests in `tests/core/types.test.ts` pass.

- [ ] **Step 2: Run library build**

Run: `npx vite build`
Expected: `dist/` folder created with:
- `index.js`, `index.cjs` (core library)
- `react.js`, `react.cjs` (React wrapper)
- `index.d.ts` (type declarations)

No build errors.

- [ ] **Step 3: Verify exports**

Run: `node -e "const m = require('./dist/index.cjs'); console.log(Object.keys(m))"`
Expected: `['CubeView', 'CubeFace', 'FACE_ANGLES']`

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: verify build output and exports"
```
