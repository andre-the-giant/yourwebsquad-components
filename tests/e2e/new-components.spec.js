import { test, expect } from "@playwright/test";

test.describe("Toast", () => {
  test("data-toast shows, announces and dismisses a message", async ({ page }) => {
    await page.goto("/components/toast");
    await page.getByRole("button", { name: "Success" }).click();

    const region = page.getByRole("region", { name: "Notifications" });
    await expect(region.getByText("Quote request sent")).toBeVisible();
    await expect(page.locator("[data-toast-polite]")).toHaveText("Quote request sent");

    await region.getByRole("button", { name: "Dismiss" }).click();
    await expect(region.getByText("Quote request sent")).toHaveCount(0);
  });

  test("danger goes to the assertive region and stays with duration 0", async ({ page }) => {
    await page.goto("/components/toast");
    await page.getByRole("button", { name: "Danger, stays" }).click();
    await expect(page.locator("[data-toast-assertive]")).toHaveText(/too large/);
    await page.waitForTimeout(5500);
    await expect(
      page.getByRole("region", { name: "Notifications" }).getByText(/too large/)
    ).toBeVisible();
  });

  test("keeps at most 3 toasts", async ({ page }) => {
    await page.goto("/components/toast");
    for (let i = 0; i < 5; i += 1) await page.getByRole("button", { name: "Info" }).click();
    await expect(page.locator(".toast:not(.is-leaving)")).toHaveCount(3);
  });
});

test.describe("StatsCounter", () => {
  test("ends on the final values, with the value in the HTML for screen readers", async ({
    page
  }) => {
    await page.goto("/components/statscounter");
    const first = page.locator(".stats").first();
    await first.scrollIntoViewIfNeeded();
    await expect(first.locator(".stats__sr").first()).toHaveText("25+");
    await expect(first.locator(".stats__number").nth(1)).toHaveText("1,200", { timeout: 4000 });
  });
});

test.describe("Tabs", () => {
  test("arrow keys move and select, hash follows", async ({ page }) => {
    await page.goto("/components/tabs");
    const first = page.getByRole("tab", { name: "Residential" });
    await first.click();
    await page.keyboard.press("ArrowRight");
    const second = page.getByRole("tab", { name: "Commercial" });
    await expect(second).toBeFocused();
    await expect(second).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#commercial")).toBeVisible();
    await expect(page.locator("#residential")).toBeHidden();
    expect(page.url()).toContain("#commercial");
    await page.keyboard.press("End");
    await expect(page.getByRole("tab", { name: "Repairs" })).toBeFocused();
  });

  test("hash opens a tab and selected opens the second", async ({ page }) => {
    await page.goto("/components/tabs#repairs");
    await expect(page.getByRole("tab", { name: "Repairs" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await expect(page.locator("#laval")).toBeVisible();
    await expect(page.locator("#montreal")).toBeHidden();
  });
});

test.describe("VideoFacade", () => {
  test("loads nothing from the platform until play, then swaps in the player", async ({ page }) => {
    const requests = [];
    await page.route(/youtube(-nocookie)?\.com|vimeo\.com|ytimg\.com/, (route) => {
      requests.push(route.request().url());
      return route.abort();
    });
    await page.goto("/components/videofacade");
    const play = page.getByRole("link", { name: "Play video: Big Buck Bunny" });
    await expect(play).toHaveAttribute("href", /youtube\.com\/watch\?v=aqz-KE-bpKQ/);
    expect(requests.some((url) => /youtube(-nocookie)?\.com\/(embed|watch)/.test(url))).toBe(false);

    await play.click();
    const iframe = page.locator('iframe[title="Big Buck Bunny"]');
    await expect(iframe).toHaveAttribute(
      "src",
      /youtube-nocookie\.com\/embed\/aqz-KE-bpKQ\?autoplay=1/
    );
    await expect(play).toHaveCount(0);
  });
});

test.describe("SlotPicker", () => {
  test("shows one day at a time and submits the chosen slot", async ({ page }) => {
    await page.goto("/components/slotpicker");
    const form = page.locator("#slot-demo");
    await expect(form.locator(".slots__day:visible")).toHaveCount(1);

    await form.getByRole("button", { name: /Thu.*26/ }).click();
    await form.getByRole("radio", { name: "10:30 a.m." }).check();
    await expect(form.locator("[data-status]")).toContainText("Thursday, November 26 at 10:30");
    await form.getByRole("button", { name: "Book the visit" }).click();
    await expect(form.locator("output")).toHaveText("2026-11-26T10:30");
  });

  test("required: shows its own message instead of a broken native bubble", async ({ page }) => {
    await page.goto("/components/slotpicker");
    const form = page.locator("#slot-demo");
    await form.getByRole("button", { name: "Book the visit" }).click();
    await expect(form.locator("[data-error]")).toBeVisible();
    await expect(form.locator(".slots__input:focus")).toHaveCount(1);
  });

  test("taken slots are disabled and a full day says so", async ({ page }) => {
    await page.goto("/components/slotpicker");
    const form = page.locator("#slot-demo");
    await expect(form.getByRole("radio", { name: "11:00 a.m." })).toBeDisabled();
    await form.getByRole("button", { name: /Wed.*25/ }).click();
    await expect(form.locator(".slots__day:visible .slots__none")).toHaveText("Full");
  });
});

test.describe("Hero", () => {
  test("kinetic variant keeps the title readable as one heading", async ({ page }) => {
    await page.goto("/components/hero");
    const hero = page.locator(".hero-kinetic").first();
    await expect(
      hero.getByRole("heading", { name: "Kitchens rebuilt in five weeks, permits handled" })
    ).toBeVisible();
    await expect(hero.locator(".hero-kinetic__word")).toHaveCount(7);
    await expect(hero.getByRole("link", { name: "Book a free estimate" })).toBeVisible();
    await expect(hero.locator(".hero-kinetic__window img")).toHaveAttribute("alt", "");
  });

  test("showcase variant starts the WebGL shader behind the copy", async ({ page }) => {
    const errors = [];
    page.on(
      "console",
      (msg) =>
        msg.type() === "warning" && /ShaderBackground/.test(msg.text()) && errors.push(msg.text())
    );
    await page.goto("/components/hero");
    const hero = page.locator(".hero-showcase").first();
    await hero.scrollIntoViewIfNeeded();
    await expect(
      hero.getByRole("heading", { name: "Pools opened, cleaned and closed for the season" })
    ).toBeVisible();
    const canvas = hero.locator('canvas[data-shader="waves"]');
    await expect(hero.locator(".shader-bg")).toHaveAttribute("aria-hidden", "true");
    await expect(canvas).toHaveAttribute("data-ready", "");
    const size = await canvas.evaluate((c) => ({ w: c.width, h: c.height, cw: c.clientWidth }));
    expect(size.w).toBeGreaterThanOrEqual(size.cw);
    expect(size.h).toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });

  test("entrance motion is off under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/components/hero");
    const word = page.locator(".hero .hero-word > span").first();
    await expect(word).toHaveCSS("animation-name", "none");
    await expect(page.locator(".hero-kinetic__word").first()).toHaveCSS("animation-name", "none");
  });
});

test.describe("ShaderBackground", () => {
  for (const url of [
    "/components/pagehero",
    "/components/ctaband",
    "/components/shaderbackground"
  ]) {
    test(`shader starts on ${url}`, async ({ page }) => {
      await page.goto(url);
      const canvas = page.locator('canvas[data-shader="waves"]').first();
      await canvas.scrollIntoViewIfNeeded();
      await expect(canvas).toHaveAttribute("data-ready", "");
      await expect(canvas.locator("xpath=..")).toHaveAttribute("aria-hidden", "true");
    });
  }

  test("shader text turns white in PageHero and CtaBand", async ({ page }) => {
    await page.goto("/components/pagehero");
    await expect(page.locator(".pagehero--shader .pagehero__title").first()).toHaveCSS(
      "color",
      "rgb(255, 255, 255)"
    );
    await page.goto("/components/ctaband");
    await expect(page.locator(".ctaband--shader .ctaband__title").first()).toHaveCSS(
      "color",
      "rgb(255, 255, 255)"
    );
  });
});
