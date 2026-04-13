import { jsx as d } from "react/jsx-runtime";
import { useRef as t, useEffect as C } from "react";
import { a as V } from "./CubeView-BEfoJqt-.js";
function x({
  width: u = 150,
  height: s = 150,
  onAngleChange: o,
  className: p,
  style: m
}) {
  const c = t(null), n = t(null), r = t(o);
  return r.current = o, C(() => {
    const f = c.current;
    if (!f) return;
    let i = !1;
    return V.create(f, {
      width: u,
      height: s,
      onAngleChange: (e, l) => {
        var a;
        (a = r.current) == null || a.call(r, e, l);
      }
    }).then((e) => {
      if (i) {
        e.dispose();
        return;
      }
      n.current = e;
    }), () => {
      var e;
      i = !0, (e = n.current) == null || e.dispose(), n.current = null;
    };
  }, [u, s]), /* @__PURE__ */ d(
    "canvas",
    {
      ref: c,
      className: p,
      style: m
    }
  );
}
export {
  x as CubeViewComponent
};
