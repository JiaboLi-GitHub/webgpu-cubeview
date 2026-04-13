// src/react/CubeViewComponent.tsx
import { useRef, useEffect } from "react";
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
