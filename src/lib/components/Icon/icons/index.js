// Simple icons registry for runtime lookup
// Each entry: { viewBox: string, svg: string, fillColor?: string, strokeColor?: string }
// where `svg` contains inner SVG markup (paths, rects, etc.)
const builtinIcons = {
  truck: {
    viewBox: "0 0 24 24",
    svg: `<path d="M2.5 6.5h11v10h-11z" /><path d="M13.5 9.5h4l3 3.5v3.5h-7" /><circle cx="6.5" cy="17.5" r="1.75" /><circle cx="17" cy="17.5" r="1.75" />`
  },
  helmet: {
    viewBox: "0 0 24 24",
    svg: `<path d="M4 15.5a8 8 0 0 1 16 0" /><path d="M2.5 15.5h19v2.5h-19z" /><path d="M10 7.8V5h4v2.8" />`
  },
  pipe: {
    viewBox: "0 0 24 24",
    svg: `<path d="M2.5 8.5h9a4 4 0 0 1 4 4v9" /><path d="M2.5 13.5h7a1 1 0 0 1 1 1v7" /><path d="M2.5 7v8M9 21.5h8" />`
  },
  snowflake: {
    viewBox: "0 0 24 24",
    svg: `<path d="M12 2.5v19M3.8 7.25l16.4 9.5M3.8 16.75l16.4-9.5" /><path d="M9.5 4 12 6.5 14.5 4M9.5 20 12 17.5 14.5 20" />`
  },
  sliders: {
    viewBox: "0 0 24 24",
    svg: `<path d="M3 6h18M3 12h18M3 18h18" /><path d="M8 4v4M15 10v4M10 16v4" />`
  },
  spark: {
    viewBox: "0 0 24 24",
    svg: `<path d="M12 2l2.2 5.8L20 10l-5.8 2.2L12 18l-2.2-5.8L4 10l5.8-2.2L12 2z" />`
  },
  "arrow-right": {
    viewBox: "0 0 24 24",
    svg: `<path d="M5 12h14" /><path d="M13 6l6 6-6 6" />`
  },
  hamburger: {
    viewBox: "0 0 24 24",
    svg: `<path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" />`
  },
  external: {
    viewBox: "0 0 24 24",
    svg: `<g transform="rotate(-45 12 12)"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></g>`,
    strokeWidth: "1",
    strokeLinecap: "round",
    strokeLinejoin: "miter"
  },
  grid: {
    viewBox: "0 0 24 24",
    svg: `<rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" />`
  },
  info: {
    viewBox: "0 0 24 24",
    svg: `<path d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />`,
    strokeWidth: "1"
  },
  success: {
    viewBox: "0 0 24 24",
    svg: `<path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />`,
    strokeWidth: "1"
  },
  warning: {
    viewBox: "0 0 24 24",
    svg: `<path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />`,
    strokeWidth: "1"
  },
  error: {
    viewBox: "0 0 24 24",
    svg: `<path d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />`,
    strokeWidth: "1"
  },
  play: {
    viewBox: "0 0 24 24",
    svg: `<path d="M9 5l10 7-10 7z" />`
  },
  "arrow-left": {
    viewBox: "0 0 24 24",
    svg: `<path d="M19 12H5" /><path d="M11 6l-6 6 6 6" />`
  },
  "chevron-down": {
    viewBox: "0 0 24 24",
    svg: `<path d="M6 9l6 6 6-6" />`
  },
  check: {
    viewBox: "0 0 24 24",
    svg: `<path d="M4 12.5l5 5L20 6.5" />`
  },
  close: {
    viewBox: "0 0 24 24",
    svg: `<path d="M6 6l12 12" /><path d="M18 6L6 18" />`
  },
  clock: {
    viewBox: "0 0 24 24",
    svg: `<circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" />`
  },
  ruler: {
    viewBox: "0 0 24 24",
    svg: `<rect x="2.5" y="8" width="19" height="8" /><path d="M6.5 8v3M10 8v4.5M13.5 8v3M17 8v4.5" />`
  },
  camera: {
    viewBox: "0 0 24 24",
    svg: `<path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" />`
  },
  shield: {
    viewBox: "0 0 24 24",
    svg: `<path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6z" /><path d="M8.5 12l2.5 2.5 4.5-5" />`
  },
  pause: {
    viewBox: "0 0 24 24",
    svg: `<path d="M9 5v14M15 5v14" />`
  }
};

const svgModules = import.meta.glob("../svg/*.svg", {
  eager: true,
  query: "?raw",
  import: "default"
});

function stripSvgWrapper(raw = "") {
  return String(raw)
    .replace(/<svg\b[^>]*>/i, "")
    .replace(/<\/svg>\s*$/i, "")
    .trim();
}

function readViewBox(raw = "") {
  const match = String(raw).match(/viewBox\s*=\s*["']([^"']+)["']/i);
  return match?.[1] || "0 0 24 24";
}

const fileIcons = Object.fromEntries(
  Object.entries(svgModules).map(([path, raw]) => {
    const fileName = path.split("/").pop() || "";
    const iconName = fileName.replace(/\.svg$/i, "");
    return [
      iconName,
      {
        viewBox: readViewBox(raw),
        svg: stripSvgWrapper(raw),
        // Imported file icons are mostly solid path artwork; inherit text color.
        fillColor: "currentColor",
        strokeColor: "none"
      }
    ];
  })
);

const normalizedBuiltinIcons = Object.fromEntries(
  Object.entries(builtinIcons).map(([name, def]) => [
    name,
    {
      fillColor: "none",
      strokeColor: "currentColor",
      ...def
    }
  ])
);

export default {
  ...normalizedBuiltinIcons,
  ...fileIcons
};
