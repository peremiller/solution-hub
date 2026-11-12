import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { Script } from "node:vm";
import { chromium } from "playwright";

const html = readFileSync(resolve("index.html"), "utf8");
const script = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(script, "Current published single-file application has a script");
new Script(script[1]); // independently parse every embedded domain and all UI logic
assert.equal((html.match(/HUB_DOMAINS\.push\(/g) || []).length, 21, "Do not lose any of 21 embedded domains");
assert.match(html, /voltdown_status_v1/, "Preserve existing progress namespace");
assert.match(html, /voltdown_theme/, "Preserve existing theme namespace");

const startUrl = pathToFileURL(resolve("index.html")).href + "?campaign=qa&domain=electricity#reference";

for (const [width, height, theme] of [[320, 720, "dark"], [390, 844, "light"], [1280, 800, "dark"]]) {
  test("real Chromium UI: " + width + "px, " + theme + " mode", async () => {
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({ viewport: {width,height}, colorScheme: theme, acceptDownloads: true });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", err => errors.push(err.message));
      await page.goto(startUrl);
      await assert.doesNotReject(() => page.locator(".card").first().waitFor({state:"visible"}));
      assert.match(await page.title(), /Solution Hub/);
      assert.equal(await page.locator("#domainSelect option").count(), 21);
      await page.keyboard.press("Tab");
      assert.equal(await page.evaluate(() => document.activeElement.className), "skip-link");
      await page.keyboard.press("Enter");
      assert.equal(await page.evaluate(() => document.activeElement.id), "mainContent");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), true, "No viewport overflow at " + width + "px");

      await page.locator("#themeToggle").click();
      assert.equal(await page.locator("#themeToggle").getAttribute("aria-pressed"), "true");
      assert.equal(await page.locator("html").getAttribute("data-theme"), "light");

      await page.selectOption("#domainSelect","disease");
      assert.equal(new URL(page.url()).searchParams.get("domain"), "disease");
      await page.locator(".card").first().click();
      assert.equal(new URL(page.url()).searchParams.get("solution"), "1");
      assert.equal(new URL(page.url()).searchParams.get("campaign"), "qa");
      assert.equal(new URL(page.url()).hash, "#reference");
      assert.equal(await page.locator("#detail").getAttribute("aria-modal"), width <= 760 ? "true" : "false");
      assert.equal(await page.locator("#detailClose").evaluate(el => el === document.activeElement), true);

      const status = page.locator(".status-btn").first();
      await status.click();
      assert.equal(await page.locator(".status-btn").first().evaluate(el => el === document.activeElement), true, "Status focus restored after re-render");
      const saved = await page.evaluate(() => localStorage.getItem("voltdown_status_v1"));
      assert.ok(saved && JSON.parse(saved)["disease:1:0"], "Progress saved under original namespace");
      const toggle = page.locator(".steps-toggle").first();
      await toggle.click();
      assert.equal(await page.locator(".steps-toggle").first().evaluate(el => el === document.activeElement), true, "Steps focus restored after re-render");
      await page.reload();
      assert.equal(await page.locator("#detail").evaluate(el => el.classList.contains("open")), true, "Deep link survives reload");
      assert.equal(await page.evaluate(() => localStorage.getItem("voltdown_status_v1")), saved, "Saved status survives reload");
      await page.goBack();
      assert.equal(new URL(page.url()).searchParams.has("solution"), false, "Back closes solution");
      assert.equal(await page.locator("#detail").evaluate(el => el.classList.contains("open")), false);
      await page.goForward();
      assert.equal(await page.locator("#detail").evaluate(el => el.classList.contains("open")), true, "Forward re-opens solution");
      await page.locator("#detailClose").click();
      assert.equal(new URL(page.url()).searchParams.has("solution"), false);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), true, "No overflow after interaction");
      assert.deepEqual(errors, [], "No JavaScript errors");
      await context.close();
    } finally { await browser.close(); }
  });
}

test("invalid solution links do not open or mutate saved progress", async () => {
  const browser = await chromium.launch({headless:true});
  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(resolve("index.html")).href + "?domain=disease&solution=999999&campaign=qa");
    assert.equal(await page.locator("#detail").evaluate(el => el.classList.contains("open")), false);
    assert.equal(await page.evaluate(() => localStorage.getItem("voltdown_status_v1")), null);
  } finally { await browser.close(); }
});
