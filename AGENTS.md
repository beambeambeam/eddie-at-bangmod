# eddie-at-bangmod

## Linting and formatting

Lint and format config lives in `vite.config.ts` (Vite+ with oxlint, oxfmt, Ultracite presets). Use `vp`, not `npx oxlint` or `npx oxfmt`, so the config loads.

- After making code changes, run `vp lint --fix`, then run `vp fmt`.
- Before finishing, run `vp lint --deny-warnings --format=agent`.
- A pre-commit hook runs `vp staged`. Do not bypass it with `--no-verify`.

## UI: Plop UI primitives

`@plop-ui/react` ([docs](https://plopui.com/docs/getting-started)) is the primitive layer for `apps/web`. The look is hand-drawn stickers on paper. Every screen should read as Plop UI.

- Reach for a Plop component first (Button, IconButton, Tag, Cards, TextField, Tabs, Sheet, Callout, Toast, and the rest of the docs sidebar). Compose custom UI from them. Build a new primitive only when none fits.
- One `PlopProvider` lives in `src/routes/__root.tsx` (surface `poster`, `paint={false}` with `plop-surface` on `<body>`). Never mount a second one. Set sound and haptics there too.
- Style custom elements with `--plop-*` tokens (`var(--plop-ink)`, `--plop-paper`, spot colors, `--plop-radius-sticker`, `--plop-stroke`, `--plop-font-letter`, `--plop-font-body`, `--plop-ease-spring`). Tailwind handles layout and spacing only. Browse the token list at [plopui.com/docs/tokens](https://plopui.com/docs/tokens).
- Pair every fill with its `--plop-on-fill-*` text token. For runtime colors, call `onColor(bg)` to pick the text color.
- Scale corners with `--plop-roundness`. Leave raw `border-radius` values out.
- Dark mode runs through `data-plop-theme` on `<html>` (see `src/lib/theme.ts`). Plop tokens flip with it, so write no `dark:` variants for Plop-styled UI.
- Pass the text label for every status. Color alone never carries meaning.
- Keep Plop's dashed focus ring. Animate only in response to a user action, and respect reduced motion. Apply wobble and crayon filters to lines and lettering, never to body text.
