import { test, expect } from "@playwright/test";

// The theme menu of the documentation, and the Plein jour button behaviour.
test("Theme menu switches the theme and remembers it", async ({ page }) => {
  await page.goto("/components/button");
  const select = page.getByLabel("Theme");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await select.selectOption("plein-jour");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "plein-jour");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "plein-jour");
  await expect(select).toHaveValue("plein-jour");
});

// Regression: Button's own :hover used the `background` shorthand, which reset the
// repeat, so the 5px line covered the whole button: dark text on a dark fill.
for (const variant of ["solid", "outline"]) {
  test(`Plein jour: ${variant} button hover keeps a single line`, async ({ page }) => {
    await page.goto("/components/button?theme=plein-jour");
    const button = page.locator(`.preview__frame .button--${variant}`).first();
    await button.hover();
    await expect(button).toHaveCSS("background-size", /100% 5px/);
    await expect(button).toHaveCSS("background-repeat", "no-repeat");
    await expect(button).toHaveCSS("background-position", /100%/);
  });
}

const luminance = (rgb) => {
  const [r, g, b] = rgb
    .match(/[\d.]+/g)
    .slice(0, 3)
    .map((v) => Number(v) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

for (const theme of ["light", "plein-jour", "marbre"]) {
  test(`Form-Radio: a checked radio is visible (${theme})`, async ({ page }) => {
    await page.goto(`/components/atoms/form-radio?theme=${theme}`);
    const label = page.locator("label:has(.radio-input)").first();
    await label.click();
    await page.waitForTimeout(400); // let the check animation finish
    const colors = await label.locator(".radio").evaluate((el) => {
      const input = el.previousElementSibling;
      // What is really painted behind the dot: the first non-transparent background
      let node = el;
      let behind = "rgba(0, 0, 0, 0)";
      while (node && node !== document.documentElement) {
        const bg = getComputedStyle(node).backgroundColor;
        if (bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
          behind = bg;
          break;
        }
        node = node.parentElement;
      }
      return {
        checked: input.checked,
        behind,
        dot: getComputedStyle(el, "::after").backgroundColor,
        dotScale: getComputedStyle(el, "::after").transform
      };
    });
    expect(colors.checked).toBe(true);
    // WCAG 1.4.11: the chosen state needs 3:1 against what is behind it
    expect(contrast(colors.dot, colors.behind)).toBeGreaterThanOrEqual(3);
    expect(colors.dotScale).not.toContain("matrix(0, 0");
  });
}

for (const theme of ["light", "plein-jour", "marbre"]) {
  test(`Form-Checkbox: checked switches and boxes are visible (${theme})`, async ({ page }) => {
    await page.goto(`/components/atoms/form-checkbox?theme=${theme}`);
    const toggles = page.locator(".toggle-input:not(:disabled):not(:checked) + .toggle");
    const count = await toggles.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i += 1) {
      const toggle = page.locator(".toggle-input:not(:disabled) + .toggle").nth(i);
      const input = toggle.locator("xpath=preceding-sibling::input[1]");
      if (await input.isChecked()) continue;
      await toggle.click();
      await page.waitForTimeout(400);
      const colors = await toggle.evaluate((el) => {
        let node = el;
        let behind = "rgba(0, 0, 0, 0)";
        while (node && node !== document.documentElement) {
          const bg = getComputedStyle(node).backgroundColor;
          if (bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
            behind = bg;
            break;
          }
          node = node.parentElement;
        }
        const after = getComputedStyle(el, "::after");
        // A check mark is drawn with borders, a switch knob with a background
        const mark =
          after.backgroundColor !== "rgba(0, 0, 0, 0)"
            ? after.backgroundColor
            : after.borderRightColor;
        return { behind, mark };
      });
      expect(contrast(colors.mark, colors.behind), JSON.stringify(colors)).toBeGreaterThanOrEqual(
        3
      );
    }
  });
}
