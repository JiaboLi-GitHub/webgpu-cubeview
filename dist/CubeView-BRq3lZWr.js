import { WebGPUEngine as E } from "@babylonjs/core/Engines/webgpuEngine";
import { Engine as w } from "@babylonjs/core/Engines/engine";
import { Scene as N } from "@babylonjs/core/scene";
import { ArcRotateCamera as v } from "@babylonjs/core/Cameras/arcRotateCamera";
import { HemisphericLight as L } from "@babylonjs/core/Lights/hemisphericLight";
import { Vector3 as u } from "@babylonjs/core/Maths/math.vector";
import { Color3 as A, Color4 as S } from "@babylonjs/core/Maths/math.color";
import { Animation as T } from "@babylonjs/core/Animations/animation";
import { CubicEase as B, EasingFunction as _ } from "@babylonjs/core/Animations/easing";
import "@babylonjs/core/Engines/Extensions/engine.dynamicTexture";
import "@babylonjs/core/Engines/Extensions/engine.alpha";
import "@babylonjs/core/Engines/WebGPU/Extensions/engine.dynamicTexture";
import "@babylonjs/core/Engines/WebGPU/Extensions/engine.alpha";
import "@babylonjs/core/Culling/ray";
import "@babylonjs/core/Animations/animatable";
import { MeshBuilder as x } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial as H } from "@babylonjs/core/Materials/standardMaterial";
import { MultiMaterial as k } from "@babylonjs/core/Materials/multiMaterial";
import { DynamicTexture as D } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { SubMesh as G } from "@babylonjs/core/Meshes/subMesh";
import { PointerEventTypes as b } from "@babylonjs/core/Events/pointerEvents";
var c = /* @__PURE__ */ ((n) => (n.FRONT = "FRONT", n.BACK = "BACK", n.RIGHT = "RIGHT", n.LEFT = "LEFT", n.TOP = "TOP", n.BOTTOM = "BOTTOM", n))(c || {});
const y = {
  FRONT: { alpha: 0, beta: Math.PI / 2 },
  BACK: { alpha: Math.PI, beta: Math.PI / 2 },
  RIGHT: { alpha: Math.PI / 2, beta: Math.PI / 2 },
  LEFT: { alpha: -Math.PI / 2, beta: Math.PI / 2 },
  TOP: { alpha: 0, beta: 0.01 },
  BOTTOM: { alpha: 0, beta: Math.PI - 0.01 }
}, U = {
  FRONT: "FRONT",
  BACK: "BACK",
  RIGHT: "RIGHT",
  LEFT: "LEFT",
  TOP: "TOP",
  BOTTOM: "BOTTOM"
}, K = [
  "RIGHT",
  "LEFT",
  "FRONT",
  "BACK",
  "TOP",
  "BOTTOM"
  /* BOTTOM */
];
function V(n) {
  return K[n];
}
const X = [
  c.RIGHT,
  c.LEFT,
  c.FRONT,
  c.BACK,
  c.TOP,
  c.BOTTOM
], P = 256, Z = 2, p = P, g = p / 2, z = {
  [c.RIGHT]: Math.PI,
  // X+ face: upside down → rotate 180°
  [c.LEFT]: Math.PI,
  // X- face: upside down → rotate 180°
  [c.FRONT]: Math.PI / 2,
  // Z+ face: rotated CCW → rotate 90° CW
  [c.BACK]: -Math.PI / 2,
  // Z- face: rotated CW → rotate 90° CCW
  [c.TOP]: -Math.PI / 2,
  // Y+ face: rotated CW → rotate 90° CCW
  [c.BOTTOM]: Math.PI / 2
  // Y- face: rotated CCW → rotate 90° CW
};
function W(n) {
  const t = x.CreateBox("cubeView", { size: Z }, n), e = new k("cubeMultiMat", n), a = [];
  for (let i = 0; i < 6; i++) {
    const h = X[i], l = U[h], r = new H(`mat_${h}`, n), m = new D(`tex_${h}`, P, n, !0), s = m.getContext(), d = z[h];
    s.fillStyle = "#f0f0f0", s.fillRect(0, 0, p, p), s.strokeStyle = "#cccccc", s.lineWidth = 4, s.strokeRect(2, 2, p - 4, p - 4), s.save(), s.translate(g, g), s.rotate(d), s.font = "bold 36px Arial", s.fillStyle = "#333333", s.textAlign = "center", s.textBaseline = "middle", s.fillText(l, 0, 0), s.restore(), m.update(), r.diffuseTexture = m, r.specularColor = new A(0.1, 0.1, 0.1), a.push(r), e.subMaterials.push(r);
  }
  t.subMeshes = [];
  const o = t.getTotalVertices();
  for (let i = 0; i < 6; i++)
    new G(i, 0, o, i * 6, 6, t);
  return t.material = e, { mesh: t, faceMaterials: a };
}
const Y = new A(0.3, 0.5, 1), $ = A.Black();
class j {
  constructor(t, e, a, o) {
    this.hoveredFaceIndex = -1, this.observer = null, this.scene = t, this.cubeMesh = e, this.faceMaterials = a, this.callbacks = o, this.setup();
  }
  setup() {
    this.observer = this.scene.onPointerObservable.add((t) => {
      switch (t.type) {
        case b.POINTERMOVE:
          this.handleHover(t);
          break;
        case b.POINTERTAP:
          this.handleTap(t);
          break;
      }
    });
  }
  handleHover(t) {
    this.hoveredFaceIndex >= 0 && (this.faceMaterials[this.hoveredFaceIndex].emissiveColor = $, this.hoveredFaceIndex = -1);
    const e = this.scene.pick(this.scene.pointerX, this.scene.pointerY);
    if (e != null && e.hit && e.pickedMesh === this.cubeMesh) {
      const a = Math.floor(e.faceId / 2);
      a >= 0 && a < 6 && (this.faceMaterials[a].emissiveColor = Y, this.hoveredFaceIndex = a);
    }
  }
  handleTap(t) {
    const e = t.pickInfo;
    if (e != null && e.hit && e.pickedMesh === this.cubeMesh) {
      const a = Math.floor(e.faceId / 2), o = V(a);
      o && this.callbacks.onFaceClick(o);
    }
  }
  dispose() {
    this.observer && (this.scene.onPointerObservable.remove(this.observer), this.observer = null);
  }
}
const q = 150, J = 150, f = 5, F = 60, I = 30;
class R {
  constructor(t, e, a, o, i) {
    this.engine = t, this.scene = e, this.camera = a, this.picker = o, this.onAngleChange = i;
  }
  static async create(t, e = {}) {
    const a = e.width ?? q, o = e.height ?? J;
    t.width = a, t.height = o;
    let i;
    if (await E.IsSupportedAsync) {
      const O = new E(t, {
        antialias: !0,
        adaptToDeviceRatio: !0
      });
      await O.initAsync(), i = O;
    } else
      i = new w(t, !0, { adaptToDeviceRatio: !0 });
    const l = new N(i);
    l.clearColor = new S(0, 0, 0, 0);
    const r = new v(
      "camera",
      Math.PI / 4,
      // alpha (horizontal)
      Math.PI / 3,
      // beta (vertical)
      f,
      u.Zero(),
      l
    );
    r.attachControl(t, !0), r.lowerRadiusLimit = f, r.upperRadiusLimit = f, r.panningSensibility = 0, r.minZ = 0.1;
    const m = new L("light", new u(0, 1, 0.5), l);
    m.intensity = 1;
    const { mesh: s, faceMaterials: d } = W(l), C = new j(l, s, d, {
      onFaceClick: (O) => {
        M.animateToFace(O);
      }
    }), M = new R(
      i,
      l,
      r,
      C,
      e.onAngleChange
    );
    return r.onViewMatrixChangedObservable.add(() => {
      M.onAngleChange && M.onAngleChange(r.beta, r.alpha);
    }), i.runRenderLoop(() => {
      l.render();
    }), M;
  }
  animateToFace(t) {
    const e = y[t], a = this.engine.getRenderingCanvas();
    this.camera.detachControl();
    const o = new B();
    o.setEasingMode(_.EASINGMODE_EASEINOUT);
    const i = new T("camAlpha", "alpha", F, T.ANIMATIONTYPE_FLOAT, T.ANIMATIONLOOPMODE_CONSTANT);
    i.setKeys([
      { frame: 0, value: this.camera.alpha },
      { frame: I, value: e.alpha }
    ]), i.setEasingFunction(o);
    const h = new T("camBeta", "beta", F, T.ANIMATIONTYPE_FLOAT, T.ANIMATIONLOOPMODE_CONSTANT);
    h.setKeys([
      { frame: 0, value: this.camera.beta },
      { frame: I, value: e.beta }
    ]), h.setEasingFunction(o), this.scene.beginDirectAnimation(this.camera, [i, h], 0, I, !1, 1, () => {
      a && this.camera.attachControl(a, !0);
    });
  }
  setAngles(t, e) {
    this.camera.beta = t, this.camera.alpha = e;
  }
  resize(t, e) {
    const a = this.engine.getRenderingCanvas();
    a && (a.width = t, a.height = e), this.engine.resize();
  }
  dispose() {
    this.picker.dispose(), this.engine.stopRenderLoop(), this.scene.dispose(), this.engine.dispose();
  }
}
export {
  c as C,
  y as F,
  R as a
};
