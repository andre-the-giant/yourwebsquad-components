// Adapter for Paper Shaders presets (https://github.com/paper-design/shaders, Apache-2.0).
// ShaderMount brings its own canvas, WebGL2 context, pixel-ratio handling, and pauses
// while the tab is hidden or the element is off screen.
import {
  ShaderMount,
  ShaderFitOptions,
  getShaderColorFromString,
  getShaderNoiseTexture
} from "@paper-design/shaders";

// Moment (ms of shader time) used for a still frame, so the pattern looks settled.
const STILL_FRAME_MS = 12000;

/**
 * @param {HTMLElement} element — the shader fills it; ShaderMount adds its canvas inside
 * @param {{ fragment: string, colors: string[], speed: number, sizing: Record<string, any>,
 *   uniforms: (colors: string[], helpers: { color: typeof getShaderColorFromString, noise: typeof getShaderNoiseTexture }) => Record<string, any> }} preset
 * @param {{ colors?: string[], animate?: boolean }} [options]
 * @returns {Promise<(() => void) | null>} stop function, or null without WebGL2
 */
export async function mountPaper(element, preset, options = {}) {
  const colors = options.colors?.length ? options.colors : preset.colors;
  const s = preset.sizing;
  // ShaderMount refuses image uniforms that are still loading, so wait for the
  // noise texture (a small data: PNG) before mounting.
  let noise;
  const loadNoise = () => {
    noise = getShaderNoiseTexture();
    return noise;
  };
  const own = preset.uniforms(colors, { color: getShaderColorFromString, noise: loadNoise });
  if (noise instanceof HTMLImageElement && !noise.complete) {
    try {
      await noise.decode();
    } catch {
      // Decoding failed: ShaderMount will report it below and the fallback stays.
    }
  }
  const uniforms = {
    ...own,
    u_fit: ShaderFitOptions[/** @type {keyof typeof ShaderFitOptions} */ (s.fit)],
    u_scale: s.scale,
    u_rotation: s.rotation,
    u_offsetX: s.offsetX,
    u_offsetY: s.offsetY,
    u_originX: s.originX,
    u_originY: s.originY,
    u_worldWidth: s.worldWidth,
    u_worldHeight: s.worldHeight
  };
  const animate = options.animate !== false;
  try {
    const mount = new ShaderMount(
      element,
      preset.fragment,
      uniforms,
      undefined,
      animate ? preset.speed : 0,
      animate ? 0 : STILL_FRAME_MS
    );
    element.dataset.ready = "";
    return () => mount.dispose();
  } catch (error) {
    // No WebGL2: the element's CSS gradient fallback stays visible.
    console.warn("[ShaderBackground] Paper shader:", error);
    return null;
  }
}
