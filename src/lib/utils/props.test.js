import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { parseProps } from "./props.js";

const Schema = z.looseObject({
  variant: z.enum(["solid", "ghost"]).default("solid"),
  count: z.number().optional()
});

describe("parseProps", () => {
  it("applies schema defaults for missing props", () => {
    expect(parseProps(Schema, {})).toEqual({ variant: "solid" });
  });

  it("passes through valid props", () => {
    expect(parseProps(Schema, { variant: "ghost", count: 3 })).toEqual({
      variant: "ghost",
      count: 3
    });
  });

  it("preserves unknown keys so {...rest} passthrough works (data-/aria- attrs)", () => {
    const out = parseProps(Schema, { variant: "ghost", "data-x": "y", "aria-label": "z" });
    expect(out["data-x"]).toBe("y");
    expect(out["aria-label"]).toBe("z");
  });

  it("is resilient: drops an invalid prop, keeps the rest, applies defaults (no throw)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const out = parseProps(Schema, { variant: "nope", count: 5 }, { component: "Demo" });
    expect(out.variant).toBe("solid"); // bad enum dropped → default applied
    expect(out.count).toBe(5); // valid sibling retained
    warn.mockRestore();
  });

  it("never throws on bad input", () => {
    expect(() => parseProps(Schema, { count: "not-a-number" })).not.toThrow();
    expect(() => parseProps(Schema, null)).not.toThrow();
    expect(() => parseProps(Schema, undefined)).not.toThrow();
  });
});
