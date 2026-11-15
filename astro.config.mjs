import { defineConfig } from "astro/config";
import { components, formKitTabs } from "./src/docs/data/components.js";

// Old tier-based URLs (/components/<level>/<slug>) redirect to flat /components/<slug>.
// Former standalone Form pages (flat and tier-based) redirect to their Form kit tab.
const redirects = Object.fromEntries([
  ...components.map(({ href, level }) => [
    href.replace("/components/", `/components/${level}/`),
    href
  ]),
  ...formKitTabs.flatMap(({ id, slug, level }) => [
    [`/components/${slug}`, `/components/form-kit#${id}`],
    [`/components/${level}/${slug}`, `/components/form-kit#${id}`]
  ])
]);

export default defineConfig({
  outDir: "build",
  srcDir: "./src/docs",
  output: "static",
  redirects
});
