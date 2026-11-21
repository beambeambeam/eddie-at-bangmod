import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";
import { createServer } from "vite";

import { SHOT } from "./shot";

const root = fileURLToPath(new URL("../", import.meta.url));
const [outputArg, ...extraArgs] = process.argv.slice(2);

const output = path.resolve(
  outputArg ?? path.join(root, "artwork", `${SHOT.name}.png`)
);

if (extraArgs.length > 0 || !output.toLowerCase().endsWith(".png")) {
  throw new Error("Usage: bun run render [output.png]");
}

const host = "127.0.0.1";

const server = await createServer({
  configFile: false,
  logLevel: "error",
  resolve: { dedupe: ["react", "react-dom", "three", "@react-three/fiber"] },
  root,
  server: { host, port: 0, ws: false },
});

try {
  await server.listen();
  const [url] = server.resolvedUrls?.local ?? [];

  if (!url) {
    throw new Error("Could not start the Studio render server.");
  }

  const browser = await chromium.launch({
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });

  try {
    const page = await browser.newPage({
      reducedMotion: "reduce",
      viewport: { width: SHOT.width, height: SHOT.height },
    });

    const ready = page.locator("canvas[data-ready='true']");

    const render = async () => {
      await page.goto(url);
      await ready.waitFor({ timeout: 60_000 });
    };

    await Promise.race([
      render(),
      page.waitForEvent("pageerror", { timeout: 0 }).then((error) => {
        throw error;
      }),
    ]);

    await mkdir(path.dirname(output), { recursive: true });
    await ready.screenshot({ path: output, type: "png" });
    console.log(`Rendered ${SHOT.width} × ${SHOT.height} to ${output}`);
  } finally {
    await browser.close();
  }
} finally {
  await server.close();
}
