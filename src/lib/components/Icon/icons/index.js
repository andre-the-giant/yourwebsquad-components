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
  }
};
