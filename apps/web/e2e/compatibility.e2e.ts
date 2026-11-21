import { expect, test } from "@playwright/test";

test.use({ launchOptions: { args: ["--disable-webgl"] } });

test("the compatibility notice switches language", async ({ page }) => {
  await page.goto("/play");
  await expect(
    page.getByRole("heading", { name: "WebGL 2 is unavailable" })
  ).toBeVisible({ timeout: 20_000 });

  await page.getByRole("button", { name: "ไทย" }).click();
  await expect(
    page.getByRole("heading", { name: "ใช้ WebGL 2 ไม่ได้" })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "กลับหน้าหลัก" })).toHaveAttribute(
    "href",
    "/"
  );
});
