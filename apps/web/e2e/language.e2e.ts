import { expect, test } from "@playwright/test";

const thaiPages = [
  ["/", "มินิเกมพาเอ็ดดี้ไปซื้อของที่ตลาดบางมด"],
  ["/play", "กำลังจัดตลาด"],
  ["/leaderboard", "ตารางคะแนน"],
] as const;

for (const [path, text] of thaiPages) {
  test(`a Thai browser gets Thai text in the first response for ${path}`, async ({
    request,
  }) => {
    const response = await request.get(path, {
      headers: { "Accept-Language": "fr-FR,th-TH;q=0.9,en;q=0.8" },
    });

    expect(response.ok()).toBe(true);
    const html = await response.text();
    expect(html.includes('<html lang="th"')).toBe(true);
    expect(html.includes(text)).toBe(true);
  });
}

test("a saved choice overrides the browser language after a reload", async ({
  page,
}) => {
  await page.setExtraHTTPHeaders({ "Accept-Language": "fr-FR,th;q=0" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");

  await page.getByRole("button", { name: "ไทย" }).click();
  await expect(page.getByRole("link", { name: "ตารางคะแนน" })).toBeVisible();
  const response = await page.reload();

  const html = await response?.text();
  expect(html?.includes('<html lang="th"')).toBe(true);
  await expect(
    page.getByRole("button", { name: "ไทย", pressed: true })
  ).toBeVisible();
});

test("the first-run instructions offer both languages before the Countdown", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  await page.goto("/play");
  const dialog = page.getByRole("dialog", { name: "How to play" });
  await expect(dialog).toBeVisible({ timeout: 20_000 });
  await dialog.getByRole("button", { name: "ไทย" }).click();
  const thaiDialog = page.getByRole("dialog", { name: "วิธีเล่น" });
  await expect(thaiDialog.getByText(/กด Shift ค้างไว้/u)).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("switching in Play Settings keeps the current Run going", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 740, height: 360 });
  await page.goto("/play");
  await page.getByRole("button", { name: "Got it" }).click();

  const status = page.getByRole("complementary", { name: "Run status" });
  await expect(status).toContainText(/1:2\d/u, { timeout: 40_000 });
  await status.getByRole("button", { name: "Settings" }).click();
  await status.getByRole("menuitem", { name: "ไทย" }).click();

  const translated = page.getByRole("complementary", { name: "สถานะรอบนี้" });
  await expect(translated).toBeVisible();
  await expect(
    translated.getByRole("progressbar", { name: "พลังวิ่ง" })
  ).toBeVisible();
  const timer = await translated.getByRole("definition").first().textContent();
  expect(timer).toMatch(/1:[012]\d|0:\d\d/u);
  await expect(
    page.getByRole("heading", { name: /รายการซื้อของ/u })
  ).toBeVisible();
});

test("switching languages keeps the Nickname draft and translates its error", async ({
  page,
}) => {
  test.setTimeout(150_000);
  // Keep the canvas small while advancing the timer to the results Sheet.
  await page.setViewportSize({ width: 320, height: 195 });
  await page.clock.install();
  await page.goto("/play");
  await page.getByRole("button", { name: "Got it" }).click();
  await expect(
    page.getByRole("complementary", { name: "Run status" })
  ).toContainText(/1:2\d/u, { timeout: 40_000 });
  await page.clock.runFor(90_000);
  await page.setViewportSize({ width: 740, height: 360 });

  await page.getByRole("textbox", { name: "Nickname" }).fill("E");
  await page.getByRole("button", { name: "Post Score" }).click();
  await expect(page.getByText("Use at least 2 characters.")).toBeVisible();
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("menuitem", { name: "ไทย" }).click();

  await expect(page.getByRole("textbox", { name: "ชื่อเล่น" })).toHaveValue("E");
  await expect(page.getByText("ใช้ชื่ออย่างน้อย 2 ตัวอักษร")).toBeVisible();
});

test("Leaderboard switches in place and uses IBM Plex Sans Thai glyphs", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/leaderboard");
  await expect(page).toHaveTitle("Leaderboard · Eddie@Bangmod");
  await page.getByRole("button", { name: "ไทย" }).click();

  const heading = page.getByRole("heading", { name: "ตารางคะแนน" });
  await expect(heading).toBeVisible();
  await expect(page).toHaveTitle("ตารางคะแนน · Eddie@Bangmod");
  await expect(page).toHaveURL(/\/leaderboard$/u);
  await heading.evaluate(async () => {
    await document.fonts.ready;
  });

  const session = await page.context().newCDPSession(page);
  await session.send("DOM.enable");
  await session.send("CSS.enable");
  const { root } = await session.send("DOM.getDocument");

  const { nodeId } = await session.send("DOM.querySelector", {
    nodeId: root.nodeId,
    selector: 'h1 span[lang="th"]',
  });

  const { fonts } = await session.send("CSS.getPlatformFontsForNode", {
    nodeId,
  });

  expect(fonts).toContainEqual(
    expect.objectContaining({
      familyName: "IBM Plex Sans Thai",
      isCustomFont: true,
    })
  );
});
