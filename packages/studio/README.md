# Studio

Studio stages Eddie and the Market using the same 3D models as the game. The first Shot, Market Sprint, frames Eddie mid-stride at dusk and exports a 1920 × 1080 PNG.

From the repository root, install workspace dependencies and the Playwright browser if needed.

```sh
bun install
cd packages/studio
bun x playwright install chromium
```

Run `bun run render` from `packages/studio`. It writes `artwork/market-sprint.png`. Pass another path with `bun run render /path/to/shot.png`. The command starts a local server and closes it after Chromium captures the canvas.

To restage the Shot, edit the pose, camera, stall placement, and lights in [`src/market-sprint.tsx`](src/market-sprint.tsx), then render again.
