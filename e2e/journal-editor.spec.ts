import { test, expect } from "@playwright/test";
import { seedPlan } from "./fixtures";

const MOD = process.platform === "darwin" ? "Meta" : "Control";

test.describe("Journal editor", () => {
  test.beforeEach(async ({ page }) => {
    await seedPlan(page);
    await page.goto("/");
    // The editor shows an empty state until a date is selected.
    await page.getByRole("button", { name: /New entry for today/i }).click();
  });

  test("renders Tiptap editor and accepts typing", async ({ page }) => {
    const editor = page.locator(".ProseMirror");
    await expect(editor).toBeVisible();
    await editor.click();
    await page.keyboard.type("Hello world");
    await expect(editor).toContainText("Hello world");
  });

  test("floating toolbar appears on text selection", async ({ page }) => {
    const editor = page.locator(".ProseMirror");
    await expect(editor).toBeVisible();
    await editor.click();
    await page.keyboard.type("Make this bold");

    await page.keyboard.press(`${MOD}+a`);

    await expect(page.getByRole("button", { name: "Bold" })).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole("button", { name: "Italic" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Strikethrough" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Inline code" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Ordered list" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Bulleted list" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Quote" })).toBeVisible();
  });

  test("clicking Bold wraps the selection in <strong>", async ({ page }) => {
    const editor = page.locator(".ProseMirror");
    await expect(editor).toBeVisible();
    await editor.click();
    await page.keyboard.type("bolded");
    await page.keyboard.press(`${MOD}+a`);

    const boldBtn = page.getByRole("button", { name: "Bold" });
    await expect(boldBtn).toBeVisible({ timeout: 3000 });
    await boldBtn.click();

    await expect(editor.locator("strong")).toContainText("bolded");
  });
});
