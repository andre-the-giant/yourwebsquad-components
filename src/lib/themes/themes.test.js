import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { themes } from "./index.js";

// A theme changes the look through CSS variables only. It may style plain HTML
// elements (body, headings, links, focus), but a rule that targets a component class
// must only set custom properties: it never overrides a property of the component.
const strictThemes = ["chantier"];

const read = (id) => readFileSync(fileURLToPath(new URL(`./${id}.css`, import.meta.url)), "utf8");

// Flat list of { selector, body } for every rule, media queries included
const rules = (css) => {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const out = [];
  const walk = (text) => {
    let depth = 0;
    let start = 0;
    let selector = "";
    for (let i = 0; i < text.length; i++) {
      if (text[i] === "{") {
        if (depth === 0) {
          selector = text.slice(start, i).trim();
          start = i + 1;
        }
        depth++;
      } else if (text[i] === "}") {
        depth--;
        if (depth === 0) {
          const body = text.slice(start, i);
          if (selector.startsWith("@")) walk(body);
          else out.push({ selector, body });
          start = i + 1;
        }
      }
    }
  };
  walk(clean);
  return out;
};

const declarations = (body) =>
  body
    .split(/;(?![^(]*\))/)
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => d.slice(0, d.indexOf(":")).trim());

describe("themes", () => {
  it("lists every theme file", () => {
    for (const { id } of themes.filter((t) => !["light", "dark"].includes(t.id))) {
      expect(read(id).length).toBeGreaterThan(0);
    }
  });

  for (const id of strictThemes) {
    it(`${id}: every rule is behind [data-theme="${id}"]`, () => {
      for (const { selector } of rules(read(id))) {
        for (const part of selector.split(/,(?![^(]*\))/)) {
          expect(part.trim(), selector).toMatch(new RegExp(`^html\\[data-theme="${id}"\\]`));
        }
      }
    });

    it(`${id}: rules on component classes set CSS variables only`, () => {
      for (const { selector, body } of rules(read(id))) {
        // Plain element selectors (body, h1, a, ::selection…) have no class in them
        if (!/\.[a-z]/i.test(selector)) continue;
        for (const name of declarations(body)) {
          expect(name.startsWith("--"), `${selector} sets ${name}`).toBe(true);
        }
      }
    });
  }
});
