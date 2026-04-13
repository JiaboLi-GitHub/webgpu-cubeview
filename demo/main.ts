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
  (window as any).cubeView = cv;
});
