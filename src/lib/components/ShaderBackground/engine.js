// Tiny WebGL1 runner for 21st.dev Shader Builder presets: one fullscreen triangle,
// one fragment shader, packed uniforms. No libraries.

const VERTEX = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const MAX_DPR = 2;
// Moment used for a still frame, so the pattern looks settled rather than at t=0.
const STILL_SECONDS = 12;

/** @param {string} hex */
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h.slice(0, 6);
  const n = parseInt(full, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {number} type
 * @param {string} source
 */
function compile(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn("[ShaderBackground] shader:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/**
 * Starts a preset on a canvas. Returns a stop function, or null when WebGL is
 * unavailable (the canvas's CSS gradient fallback then stays visible).
 * Pauses while the tab is hidden and while the canvas is off screen.
 * @param {HTMLCanvasElement} canvas
 * @param {{ fragment: string, colors: string[], timeScale: number, uniforms: Record<string, number[]> }} preset
 * @param {{ colors?: string[], animate?: boolean }} [options]
 */
export function mountShader(canvas, preset, options = {}) {
  const gl = canvas.getContext("webgl", { antialias: false, premultipliedAlpha: false });
  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fs = compile(gl, gl.FRAGMENT_SHADER, preset.fragment);
  const program = gl.createProgram();
  if (!vs || !fs || !program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn("[ShaderBackground] link:", gl.getProgramInfoLog(program));
    return null;
  }
  gl.useProgram(program);

  // Fullscreen triangle: one triangle covering the whole clip space.
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  /** @param {string} name */
  const loc = (name) => gl.getUniformLocation(program, name);
  const uScene = loc("u_scene");
  const colors = (options.colors?.length ? options.colors : preset.colors).slice(0, 8);
  const packed = new Float32Array(24);
  colors.forEach((hex, i) => packed.set(hexToRgb(hex), i * 3));
  gl.uniform3fv(loc("u_colors[0]") ?? loc("u_colors"), packed);
  for (const [name, value] of Object.entries(preset.uniforms)) {
    gl.uniform4fv(loc(`u_${name}`), value);
  }

  const animate = options.animate !== false;
  const start = performance.now();
  let frame = 0;
  let onScreen = true;
  let stopped = false;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  };

  /** @param {number} seconds */
  const draw = (seconds) => {
    resize();
    gl.uniform4f(uScene, canvas.width, canvas.height, seconds * preset.timeScale, colors.length);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const now = () => (animate ? (performance.now() - start) / 1000 : STILL_SECONDS);

  /** @param {number} t */
  const loop = (t) => {
    frame = 0;
    if (stopped || !onScreen || document.hidden) return;
    draw((t - start) / 1000);
    frame = requestAnimationFrame(loop);
  };
  const play = () => {
    if (animate && !frame && !stopped && onScreen && !document.hidden) {
      frame = requestAnimationFrame(loop);
    }
  };
  const pause = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  };

  const onVisibility = () => (document.hidden ? pause() : play());
  document.addEventListener("visibilitychange", onVisibility);

  const io = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen) play();
    else pause();
  });
  io.observe(canvas);

  // Redraw on resize when no loop is running (still frame, or paused off screen).
  const ro = new ResizeObserver(() => {
    if (!frame) draw(now());
  });
  ro.observe(canvas);

  draw(animate ? 0 : STILL_SECONDS);
  canvas.dataset.ready = "";
  play();

  return () => {
    stopped = true;
    pause();
    io.disconnect();
    ro.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
