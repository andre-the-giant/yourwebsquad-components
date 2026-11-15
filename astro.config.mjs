import { defineConfig } from "astro/config";
import { components } from "./src/docs/data/components.js";

// Old tier-based URLs (/components/<level>/<slug>) redirect to flat /components/<slug>.
const redirects = Object.fromEntries(
  components.map(({ href, level }) => [href.replace("/components/", `/components/${level}/`), href])
);

export default defineConfig({
  outDir: "build",
  srcDir: "./src/docs",
  output: "static",
  redirects
});
