import oxfmt from "ultracite/oxfmt";
import antiSlop from "ultracite/oxlint/anti-slop";
import core from "ultracite/oxlint/core";
import react from "ultracite/oxlint/react";
import tanstack from "ultracite/oxlint/tanstack";
import { defineConfig } from "vite-plus";

const ignorePatterns = [
  "apps/web/.vinxi/**",
  "apps/web/.tanstack/**",
  "apps/web/src/routeTree.gen.ts",
  "apps/web/worker-configuration.d.ts",
  ".alchemy/**",
  ".agents/**",
  ".claude/**",
  "skills-lock.json",
];

export default defineConfig({
  lint: {
    extends: [core, react, tanstack, antiSlop],
    env: core.env,
    ignorePatterns: [...core.ignorePatterns, ...ignorePatterns],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    ...oxfmt,
    ignorePatterns: [...oxfmt.ignorePatterns, ...ignorePatterns],
  },
  staged: {
    "*.{js,ts,jsx,tsx,vue,svelte,json,jsonc,css,md}": "vp check --fix",
  },
});
