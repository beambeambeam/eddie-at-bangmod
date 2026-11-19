# eddie-at-bangmod

## Linting and formatting

Lint and format config lives in `vite.config.ts` (Vite+ with oxlint, oxfmt, Ultracite presets). Use `vp`, not `npx oxlint` or `npx oxfmt`, so the config loads.

- After making code changes, run `vp lint --fix`, then run `vp fmt`.
- Before finishing, run `vp lint --deny-warnings --format=agent`.
- A pre-commit hook runs `vp staged`. Do not bypass it with `--no-verify`.
