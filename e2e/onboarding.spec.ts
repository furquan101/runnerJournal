import { test, expect } from "@playwright/test";

test.describe("onboarding (no plan)", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("shows the Create a plan dialog when no plan exists", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Create a plan" })).toBeVisible();
  });

  test("can create a baseline plan and reach the journal", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Create a plan" })).toBeVisible();

    await page.getByPlaceholder("Sydney Marathon").fill("Sydney Marathon");
    // Suggestion list opens — pick the first match
    const suggestion = page.getByRole("button", { name: /Sydney Marathon/i }).first();
    if (await suggestion.isVisible({ timeout: 1000 }).catch(() => false)) {
      await suggestion.click();
    } else {
      // Fall back: fill the rest manually
      await page.locator('input[type="date"]').fill("2026-08-30");
    }

    // Goal time
    await page.getByPlaceholder("3:45").fill("3:45");

    // Default freq is 4 — we need 4 preferred days
    for (const day of ["Mon", "Wed", "Fri", "Sat"]) {
      const btn = page.getByRole("button", { name: day, exact: true });
      const ariaSelectedIsh = await btn.evaluate(
        (el) => el.classList.contains("bg-black"),
      );
      if (!ariaSelectedIsh) await btn.click();
    }

    await page.getByRole("button", { name: /Preview plan/i }).click();

    // Preview dialog
    await expect(page.getByRole("heading", { name: /Preview your plan/i })).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole("button", { name: /Save plan/i }).click();

    // Status bar links should now be visible
    await expect(page.getByRole("button", { name: "Plan overview" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Edit plan" })).toBeVisible();
  });
});
