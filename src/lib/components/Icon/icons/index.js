// Simple icons registry for runtime lookup
// Each entry: { viewBox: string, svg: string } where `svg` contains inner SVG markup (paths, rects, etc.)
export default {
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
  }
};
