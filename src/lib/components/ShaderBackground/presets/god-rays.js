// "God Rays" from Paper Shaders (https://github.com/paper-design/shaders),
// Copyright Lost Coast Labs, Inc., Apache License 2.0. Values below are the
// library's "Default" preset; the shader itself comes from the package.
import { godRaysFragmentShader, defaultObjectSizing } from "@paper-design/shaders";

export default {
  engine: "paper",
  label: "God Rays",
  // [background, bloom, ...ray colours]. 8-digit hex sets a colour's opacity.
  colors: ["#000000", "#0000ff", "#a600ff6e", "#6200fff0", "#ffffff", "#33fff5"],
  darkEdge: null,
  fragment: godRaysFragmentShader,
  speed: 0.75,
  sizing: { ...defaultObjectSizing, offsetX: 0, offsetY: -0.55 },
  /** @param {string[]} colors @param {{ color: (c: string) => number[], noise: () => unknown }} h */
  uniforms: ([back, bloom, ...rays], h) => ({
    u_colorBack: h.color(back),
    u_colorBloom: h.color(bloom),
    u_colors: (rays.length ? rays : ["#ffffff"]).map(h.color),
    u_colorsCount: rays.length || 1,
    u_density: 0.3,
    u_spotty: 0.3,
    u_midIntensity: 0.4,
    u_midSize: 0.2,
    u_intensity: 0.8,
    u_bloom: 0.4,
    u_noiseTexture: h.noise()
  })
};
