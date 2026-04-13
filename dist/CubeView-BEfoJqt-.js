import { WebGPUEngine as E } from "@babylonjs/core/Engines/webgpuEngine";
import { Engine as C } from "@babylonjs/core/Engines/engine";
import { Scene as P } from "@babylonjs/core/scene";
import { ArcRotateCamera as F } from "@babylonjs/core/Cameras/arcRotateCamera";
import { HemisphericLight as b } from "@babylonjs/core/Lights/hemisphericLight";
import { Vector3 as A } from "@babylonjs/core/Maths/math.vector";
import { Color3 as u, Color4 as L } from "@babylonjs/core/Maths/math.color";
import { Animation as M } from "@babylonjs/core/Animations/animation";
import { CubicEase as v, EasingFunction as S } from "@babylonjs/core/Animations/easing";
import { MeshBuilder as x } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial as D } from "@babylonjs/core/Materials/standardMaterial";
import { MultiMaterial as B } from "@babylonjs/core/Materials/multiMaterial";
import { DynamicTexture as N } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { SubMesh as _ } from "@babylonjs/core/Meshes/subMesh";
var d = /* @__PURE__ */ ((s) => (s.FRONT = "FRONT", s.BACK = "BACK", s.RIGHT = "RIGHT", s.LEFT = "LEFT", s.TOP = "TOP", s.BOTTOM = "BOTTOM", s))(d || {});
const k = {
  FRONT: { alpha: 0, beta: Math.PI / 2 },
  BACK: { alpha: Math.PI, beta: Math.PI / 2 },
  RIGHT: { alpha: Math.PI / 2, beta: Math.PI / 2 },
  LEFT: { alpha: -Math.PI / 2, beta: Math.PI / 2 },
  TOP: { alpha: 0, beta: 0.01 },
  BOTTOM: { alpha: 0, beta: Math.PI - 0.01 }
}, G = {
  FRONT: "FRONT",
  BACK: "BACK",
  RIGHT: "RIGHT",
  LEFT: "LEFT",
  TOP: "TOP",
  BOTTOM: "BOTTOM"
}, U = [
  "FRONT",
  "BACK",
  "RIGHT",
  "LEFT",
  "TOP",
  "BOTTOM"
  /* BOTTOM */
];
function H(s) {
  return U[s];
}
const y = [
  d.FRONT,
  d.BACK,
  d.RIGHT,
  d.LEFT,
  d.TOP,
  d.BOTTOM
], p = 256, X = 2;
function V(s) {
  const e = x.CreateBox("cubeView", { size: X }, s), n = new B("cubeMultiMat", s), o = [];
  for (let t = 0; t < 6; t++) {
    const r = y[t], c = G[r], i = new D(`mat_${r}`, s), l = new N(`tex_${r}`, p, s, !0), a = l.getContext();
    a.fillStyle = "#f0f0f0", a.fillRect(0, 0, p, p), a.strokeStyle = "#cccccc", a.lineWidth = 4, a.strokeRect(2, 2, p - 4, p - 4), a.font = "bold 36px Arial", a.fillStyle = "#333333", a.textAlign = "center", a.textBaseline = "middle", a.fillText(c, p / 2, p / 2), l.update(), i.diffuseTexture = l, i.specularColor = new u(0.1, 0.1, 0.1), o.push(i), n.subMaterials.push(i);
  }
  e.subMeshes = [];
  const h = e.getTotalVertices();
  for (let t = 0; t < 6; t++)
    new _(t, 0, h, t * 6, 6, e);
  return e.material = n, { mesh: e, faceMaterials: o };
}
const K = new u(0.3, 0.5, 1), Y = u.Black();
class Z {
  constructor(e, n, o, h) {
    this.hoveredFaceIndex = -1, this.pointerDownX = 0, this.pointerDownY = 0, this.onPointerMove = () => {
      const t = this.scene.pick(
        this.scene.pointerX,
        this.scene.pointerY
      );
      if (this.hoveredFaceIndex >= 0 && (this.faceMaterials[this.hoveredFaceIndex].emissiveColor = Y, this.hoveredFaceIndex = -1), t.hit && t.pickedMesh === this.cubeMesh) {
        const r = Math.floor(t.faceId / 2);
        r >= 0 && r < 6 && (this.faceMaterials[r].emissiveColor = K, this.hoveredFaceIndex = r);
      }
    }, this.onPointerDown = (t) => {
      this.pointerDownX = t.clientX, this.pointerDownY = t.clientY;
    }, this.onPointerUp = (t) => {
      const r = t.clientX - this.pointerDownX, c = t.clientY - this.pointerDownY;
      if (r * r + c * c > 25) return;
      const i = this.scene.pick(
        this.scene.pointerX,
        this.scene.pointerY
      );
      if (i.hit && i.pickedMesh === this.cubeMesh) {
        const l = Math.floor(i.faceId / 2), a = H(l);
        a && this.callbacks.onFaceClick(a);
      }
    }, this.scene = e, this.cubeMesh = n, this.faceMaterials = o, this.callbacks = h, this.setup();
  }
  setup() {
    const e = this.scene.getEngine().getRenderingCanvas();
    e && (e.addEventListener("pointermove", this.onPointerMove), e.addEventListener("pointerdown", this.onPointerDown), e.addEventListener("pointerup", this.onPointerUp));
  }
  dispose() {
    const e = this.scene.getEngine().getRenderingCanvas();
    e && (e.removeEventListener("pointermove", this.onPointerMove), e.removeEventListener("pointerdown", this.onPointerDown), e.removeEventListener("pointerup", this.onPointerUp));
  }
}
const z = 150, W = 150, f = 5, O = 60, g = 30;
class I {
  constructor(e, n, o, h, t) {
    this.engine = e, this.scene = n, this.camera = o, this.picker = h, this.onAngleChange = t;
  }
  static async create(e, n = {}) {
    const o = n.width ?? z, h = n.height ?? W;
    e.width = o, e.height = h;
    let t;
    if (await E.IsSupportedAsync) {
      const m = new E(e, {
        antialias: !0,
        adaptToDeviceRatio: !0
      });
      await m.initAsync(), t = m;
    } else
      t = new C(e, !0, { adaptToDeviceRatio: !0 });
    const c = new P(t);
    c.clearColor = new L(0, 0, 0, 0);
    const i = new F(
      "camera",
      Math.PI / 4,
      // alpha (horizontal)
      Math.PI / 3,
      // beta (vertical)
      f,
      A.Zero(),
      c
    );
    i.attachControl(e, !0), i.lowerRadiusLimit = f, i.upperRadiusLimit = f, i.panningSensibility = 0, i.minZ = 0.1;
    const l = new b("light", new A(0, 1, 0.5), c);
    l.intensity = 1;
    const { mesh: a, faceMaterials: w } = V(c), R = new Z(c, a, w, {
      onFaceClick: (m) => {
        T.animateToFace(m);
      }
    }), T = new I(
      t,
      c,
      i,
      R,
      n.onAngleChange
    );
    return i.onViewMatrixChangedObservable.add(() => {
      T.onAngleChange && T.onAngleChange(i.beta, i.alpha);
    }), t.runRenderLoop(() => {
      c.render();
    }), T;
  }
  animateToFace(e) {
    const n = k[e], o = new v();
    o.setEasingMode(S.EASINGMODE_EASEINOUT), M.CreateAndStartAnimation(
      "camAlpha",
      this.camera,
      "alpha",
      O,
      g,
      this.camera.alpha,
      n.alpha,
      M.ANIMATIONLOOPMODE_CONSTANT,
      o
    ), M.CreateAndStartAnimation(
      "camBeta",
      this.camera,
      "beta",
      O,
      g,
      this.camera.beta,
      n.beta,
      M.ANIMATIONLOOPMODE_CONSTANT,
      o
    );
  }
  setAngles(e, n) {
    this.camera.beta = e, this.camera.alpha = n;
  }
  resize(e, n) {
    const o = this.engine.getRenderingCanvas();
    o && (o.width = e, o.height = n), this.engine.resize();
  }
  dispose() {
    this.picker.dispose(), this.engine.stopRenderLoop(), this.scene.dispose(), this.engine.dispose();
  }
}
export {
  d as C,
  k as F,
  I as a
};
