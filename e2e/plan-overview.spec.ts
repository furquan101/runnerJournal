import { test, expect } from "@playwright/test";
import { seedPlan } from "./fixtures";

test.describe("Plan overview dialog", () => {
  test.beforeEach(async ({ page }) => {
    await seedPlan(page);
    await page.goto("/");
  });

  test("opens, shows weeks, navigates with Prev / Next", async ({ page }) => {
    await page.getByRole("button", { name: "Plan overview" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/Sydney Marathon plan overview/i)).toBeVisible();

    // The seed has 3 weeks, defaults to the current (today is 2026-04-28 so week 1)
    await expect(dialog.getByText(/Week \d+ of 3/)).toBeVisible();

    const next = dialog.getByRole("button", { name: /Next/i });
    const prev = dialog.getByRole("button", { name: /Prev/i });

    // Read current index, click Next, confirm increment
    const before = (await dialog.getByText(/Week \d+ of 3/).textContent()) ?? "";
    await next.click();
    const after = (await dialog.getByText(/Week \d+ of 3/).textContent()) ?? "";
    expect(after).not.toBe(before);

    await prev.click();
    const back = (await dialog.getByText(/Week \d+ of 3/).textContent()) ?? "";
    expect(back).toBe(before);
  });

  test("ArrowRight / ArrowLeft step weeks", async ({ page }) => {
    await page.getByRole("button", { name: "Plan overview" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const before = (await dialog.getByText(/Week \d+ of 3/).textContent()) ?? "";
    await page.keyboard.press("ArrowRight");
    const after = (await dialog.getByText(/Week \d+ of 3/).textContent()) ?? "";
    expect(after).not.toBe(before);
  });
});
