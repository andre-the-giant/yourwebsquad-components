// "Neuro Noise" from Paper Shaders (https://github.com/paper-design/shaders),
// Copyright Lost Coast Labs, Inc., Apache License 2.0. Values below are the
// library's "Default" preset; the shader itself comes from the package.
import { neuroNoiseFragmentShader, defaultPatternSizing } from "@paper-design/shaders";

export default {
  engine: "paper",
  label: "Neuro Noise",
  // [background, main lines, highlights at the crossings]
  colors: ["#000000", "#47a6ff", "#ffffff"],
  darkEdge: null,
  fragment: neuroNoiseFragmentShader,
  speed: 1,
  sizing: { ...defaultPatternSizing },
  /** @param {string[]} colors @param {{ color: (c: string) => number[] }} h */
  uniforms: ([back, mid, front], h) => ({
    u_colorBack: h.color(back),
    u_colorMid: h.color(mid),
    u_colorFront: h.color(front ?? mid),
    u_brightness: 0.05,
    u_contrast: 0.3
  })
};
