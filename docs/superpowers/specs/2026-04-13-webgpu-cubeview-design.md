# WebGPU CubeView Design Spec

## Overview

Rewrite of [react-cubeview](https://github.com/lucascassiano/react-cubeview) using Babylon.js WebGPU engine. The original library is a 3D ViewCube navigation widget (like AutoCAD/Fusion360) built on Three.js/WebGL.

**Goal:** MVP with 6-face click navigation + drag-to-rotate + angle callback.

## Architecture

### Layered Design

```
React Wrapper (CubeViewComponent.tsx)
        |
   Core TS Library (CubeView.ts)
        |
   Babylon.js WebGPU Engine (@babylonjs/core)
```

- **Core layer:** Framework-agnostic TypeScript class. Owns the Babylon.js engine, scene, camera, cube mesh, and interaction logic.
- **React layer:** Thin wrapper. Manages canvas ref, lifecycle (mount/unmount), and props-to-core bridging.

### Project Structure

```
D:\babylon-renderer\
├── src/
│   ├── core/
│   │   ├── CubeView.ts          # Main class: engine, scene, render loop, lifecycle
│   │   ├── CubeBuilder.ts       # Cube mesh creation with 6-face materials
│   │   ├── FacePicker.ts        # Mouse hover detection + click handling via scene.pick()
│   │   └── types.ts             # Shared types and constants
│   ├── react/
│   │   └── CubeViewComponent.tsx # React FC wrapper
│   └── index.ts                  # Public API exports
├── package.json
├── tsconfig.json
└── vite.config.ts                # Build with vite + vite-plugin-dts
```

## Core API

### CubeView (core class)

```typescript
interface CubeViewOptions {
  width?: number;          // default: 150
  height?: number;         // default: 150
  onAngleChange?: (phi: number, theta: number) => void;
}

class CubeView {
  constructor(canvas: HTMLCanvasElement, options?: CubeViewOptions);
  setAngles(phi: number, theta: number): void;   // Programmatic camera control
  resize(width: number, height: number): void;    // Resize canvas/engine
  dispose(): void;                                 // Cleanup all resources
}
```

### CubeViewComponent (React wrapper)

```typescript
interface CubeViewProps {
  width?: number;
  height?: number;
  onAngleChange?: (phi: number, theta: number) => void;
  className?: string;
  style?: React.CSSProperties;
}
```

Uses `useRef` for canvas element, `useEffect` for CubeView lifecycle, `useCallback` for stable callback refs.

## Rendering

### Engine Setup

- `WebGPUEngine` from `@babylonjs/core` (async initialization via `engine.initAsync()`)
- Falls back gracefully if WebGPU unavailable (Babylon.js handles this)
- Single `Scene` with transparent background (`scene.clearColor` alpha = 0)

### Camera

- `ArcRotateCamera` centered on origin
  - `radius`: fixed (no zoom), ~8 units
  - `alpha` / `beta`: mapped from spherical (theta, phi)
  - `panningSensibility: 0` (no panning)
  - `lowerRadiusLimit === upperRadiusLimit` (lock zoom)
  - `attachControl(canvas, true)` for drag-to-rotate

### Cube Mesh

- `BoxGeometry` of size 2, with `MultiMaterial` (6 sub-materials)
- Each face: `StandardMaterial` with a `DynamicTexture` rendering the face label text (FRONT, BACK, TOP, BOTTOM, LEFT, RIGHT)
- DynamicTexture: white background, dark text, drawn via canvas 2D `drawText()`
- Face sub-material indices follow Babylon.js box face ordering

### Lighting

- `HemisphericLight` for even illumination (no harsh shadows on cube)

## Interaction

### Face Picking (FacePicker.ts)

- **Hover:** On `pointermove`, call `scene.pick(x, y)`. If hit cube mesh, determine which face via `pickResult.faceId`. Highlight face by changing sub-material emissive color.
- **Click:** On `pointerdown`+`pointerup` (distinguish from drag), get clicked face. Animate camera to face's target angles.
- **Drag:** Handled by `ArcRotateCamera.attachControl` natively. On camera angle change, fire `onAngleChange` callback.

### Face ID to Face Mapping

Babylon.js `BoxGeometry` produces 12 triangles (2 per face). `faceId` from pick result maps:
- faceId 0,1 → face 0 (FRONT or similar, depends on Babylon.js ordering)
- faceId 2,3 → face 1
- ...etc.

Map: `Math.floor(faceId / 2)` → face index → target angles.

### Face → Angle Table

| Face   | phi (polar) | theta (azimuthal) | ArcRotateCamera beta | ArcRotateCamera alpha |
|--------|-------------|--------------------|-----------------------|------------------------|
| FRONT  | π/2         | 0                  | π/2                   | -π/2                   |
| BACK   | π/2         | π                  | π/2                   | π/2                    |
| RIGHT  | π/2         | π/2                | π/2                   | 0                      |
| LEFT   | π/2         | -π/2               | π/2                   | π                      |
| TOP    | 0           | 0                  | 0                     | -π/2                   |
| BOTTOM | π           | 0                  | π                     | -π/2                   |

Note: Babylon.js ArcRotateCamera uses (alpha, beta, radius) where alpha = horizontal rotation, beta = vertical angle from Y-up. Exact mapping will be verified during implementation.

### Angle Animation

On face click: use `Animation.CreateAndStartAnimation()` to smoothly transition `camera.alpha` and `camera.beta` to target values over ~0.5s with easing (`EasingFunction` - `CubicEase`).

### Angle Change Callback

- Listen to `camera.onViewMatrixChangedObservable`
- Convert camera (alpha, beta) back to spherical (phi, theta)
- Call `onAngleChange(phi, theta)`

## Build & Package

- **Bundler:** Vite with `vite-plugin-dts` for `.d.ts` generation
- **Output:** ESM + CJS dual format
- **Entry points:**
  - `webgpu-cubeview` → core TS library
  - `webgpu-cubeview/react` → React wrapper
- **Peer deps:** `react`, `react-dom` (optional, only for React wrapper)
- **Deps:** `@babylonjs/core`

## Scope (MVP)

### In scope
- 6-face click navigation with smooth animation
- Drag-to-rotate orbit control
- Hover highlight on faces
- `onAngleChange` callback
- `setAngles()` programmatic control
- `dispose()` cleanup
- React wrapper component

### Out of scope (future iterations)
- 12 edge + 8 corner interactive zones
- Home button / reset view
- Custom face textures/colors
- Dark mode
- Touch gesture support beyond basic pointer events
