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
  },
  info: {
    viewBox: "0 0 24 24",
    svg: `<circle cx="12" cy="12" r="9" /><line x1="12" y1="10" x2="12" y2="16" /><circle cx="12" cy="7" r="1.1" />`
  },
  success: {
    viewBox: "0 0 24 24",
    svg: `<circle cx="12" cy="12" r="9" /><polyline points="8 12.5 11 15.5 16 9.5" />`
  },
  warning: {
    viewBox: "0 0 24 24",
    svg: `<path d="M12 3.5 3.5 19h17L12 3.5z" /><line x1="12" y1="9" x2="12" y2="13.5" /><circle cx="12" cy="17" r="1" />`
  },
  error: {
    viewBox: "0 0 24 24",
    svg: `<circle cx="12" cy="12" r="9" /><line x1="9" y1="9" x2="15" y2="15" /><line x1="15" y1="9" x2="9" y2="15" />`
  }
};
