// Shader presets for <ShaderBackground>. Every preset comes from the 21st.dev Shader
// Builder and shares its packed WebGL1 uniform layout, so adding one means adding a
// file here: { label, colors, darkEdge, timeScale, uniforms, fragment }.
import waves from "./waves.js";

export const shaderPresets = { waves };

/** @typedef {keyof typeof shaderPresets} ShaderName */
export const shaderNames = /** @type {[ShaderName, ...ShaderName[]]} */ (
  Object.keys(shaderPresets)
);

/** @param {string} hex → "r g b" for rgb(var(--x) / alpha) */
export function hexToRgbTriplet(hex) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h;
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

/** Shared zod-free check used by component schemas. */
export const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
