import { defineConfig } from "astro/config";

export default defineConfig({
  outDir: "build",
  srcDir: "./src/docs",
  output: "static"
});
