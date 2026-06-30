import { describe, it, expect } from "vitest";
import { nextId } from "./id.js";

describe("nextId", () => {
  it("produces deterministic, incrementing ids per prefix", () => {
    expect(nextId("alpha")).toBe("alpha-1");
    expect(nextId("alpha")).toBe("alpha-2");
    expect(nextId("alpha")).toBe("alpha-3");
  });

  it("keeps an independent counter per prefix", () => {
    expect(nextId("beta")).toBe("beta-1");
    expect(nextId("gamma")).toBe("gamma-1");
    expect(nextId("beta")).toBe("beta-2");
  });

  it("defaults the prefix to 'id'", () => {
    expect(nextId()).toMatch(/^id-\d+$/);
  });

  it("never returns the same id twice for one prefix (collision-free)", () => {
    const ids = new Set(Array.from({ length: 50 }, () => nextId("dup")));
    expect(ids.size).toBe(50);
  });
});
