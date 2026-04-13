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
  it("maps Babylon.js box face indices 0-5 to CubeFace", async () => {
    // Babylon.js CreateBox face order: right(X+), left(X-), front(Z+), back(Z-), top(Y+), bottom(Y-)
    const { faceIndexToFace } = await import("../../src/core/types");
    expect(faceIndexToFace(0)).toBe(CubeFace.RIGHT);
    expect(faceIndexToFace(1)).toBe(CubeFace.LEFT);
    expect(faceIndexToFace(2)).toBe(CubeFace.FRONT);
    expect(faceIndexToFace(3)).toBe(CubeFace.BACK);
    expect(faceIndexToFace(4)).toBe(CubeFace.TOP);
    expect(faceIndexToFace(5)).toBe(CubeFace.BOTTOM);
  });

  it("returns undefined for out-of-range index", async () => {
    const { faceIndexToFace } = await import("../../src/core/types");
    expect(faceIndexToFace(6)).toBeUndefined();
    expect(faceIndexToFace(-1)).toBeUndefined();
  });
});
