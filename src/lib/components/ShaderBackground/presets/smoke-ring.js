// "Smoke Ring" from Paper Shaders (https://github.com/paper-design/shaders),
// Copyright Lost Coast Labs, Inc., Apache License 2.0. Values below are the
// library's "Default" preset; the shader itself comes from the package.
import { smokeRingFragmentShader, defaultObjectSizing } from "@paper-design/shaders";

export default {
  engine: "paper",
  label: "Smoke Ring",
  // [background, ...ring colours inside → out]. The first is the dark base text sits on.
  colors: ["#000000", "#ffffff"],
  darkEdge: null,
  fragment: smokeRingFragmentShader,
  speed: 0.5,
  sizing: { ...defaultObjectSizing, scale: 0.8 },
  /** @param {string[]} colors @param {{ color: (c: string) => number[], noise: () => unknown }} h */
  uniforms: ([back, ...ring], h) => ({
    u_colorBack: h.color(back),
    u_colors: (ring.length ? ring : ["#ffffff"]).map(h.color),
    u_colorsCount: ring.length || 1,
    u_noiseScale: 3,
    u_noiseIterations: 8,
    u_radius: 0.25,
    u_thickness: 0.65,
    u_innerShape: 0.7,
    u_noiseTexture: h.noise()
  })
};
