// Available themes. A theme is activated with <html data-theme="id">.
//
// To add a theme:
//   1. Create src/lib/themes/<id>.css, with every rule behind
//      html[data-theme="<id>"], and export it in package.json.
//   2. Add it to this list.
//   3. Import it in src/docs/layouts/DocLayout.astro.
// It then appears in the theme menu of the documentation, on every component.
export const themes = [
  { id: "light", label: "Default" },
  { id: "dark", label: "Dark" },
  { id: "plein-jour", label: "Plein jour" },
  { id: "marbre", label: "Marbre" }
];

export const defaultTheme = "light";
