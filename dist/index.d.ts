export declare interface CameraAngles {
    alpha: number;
    beta: number;
}

export declare enum CubeFace {
    FRONT = "FRONT",
    BACK = "BACK",
    RIGHT = "RIGHT",
    LEFT = "LEFT",
    TOP = "TOP",
    BOTTOM = "BOTTOM"
}

export declare class CubeView {
    private engine;
    private scene;
    private camera;
    private picker;
    private onAngleChange?;
    private constructor();
    static create(canvas: HTMLCanvasElement, options?: CubeViewOptions): Promise<CubeView>;
    private animateToFace;
    setAngles(phi: number, theta: number): void;
    resize(width: number, height: number): void;
    dispose(): void;
}

export declare interface CubeViewOptions {
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
export declare const FACE_ANGLES: Record<CubeFace, CameraAngles>;

export { }
