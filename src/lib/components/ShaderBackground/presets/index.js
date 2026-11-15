// Shader presets for <ShaderBackground>, one file each. Two kinds:
// - 21st.dev Shader Builder (engine.js): packed WebGL1 uniforms,
//   { label, colors, darkEdge, timeScale, uniforms, fragment }
// - Paper Shaders (paper-engine.js, Apache-2.0): WebGL2 via ShaderMount,
//   { engine: "paper", label, colors, speed, sizing, uniforms(colors, helpers), fragment }
// `colors` always starts with the dark base that text sits on.
import waves from "./waves.js";
import smokeRing from "./smoke-ring.js";
import godRays from "./god-rays.js";
import neuroNoise from "./neuro-noise.js";

export const shaderPresets = {
  waves,
  "smoke-ring": smokeRing,
  "god-rays": godRays,
  "neuro-noise": neuroNoise
};

/** @typedef {keyof typeof shaderPresets} ShaderName */
export const shaderNames = /** @type {[ShaderName, ...ShaderName[]]} */ (
  Object.keys(shaderPresets)
);

/** @param {string} hex → "r g b" for rgb(var(--x) / alpha) */
export function hexToRgbTriplet(hex) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h.slice(0, 6);
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/**
 * Colours a component needs around a shader: the dark base ("ink") text sits on,
 * and a light highlight for accented words. Server-side safe.
 * @param {string} name
 * @param {string[]} [colors]
 */
export function shaderPalette(name, colors) {
  const preset = shaderPresets[/** @type {ShaderName} */ (name)] ?? shaderPresets.waves;
  const list = colors?.length ? colors : preset.colors;
  return {
    colors: list,
    ink: list[0],
    highlight: list[Math.max(list.length - 2, 1)],
    darkEdge: preset.darkEdge
  };
}

/** #rgb, #rrggbb, or #rrggbbaa (opacity is used by Paper presets, ignored by Waves). */
export const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
