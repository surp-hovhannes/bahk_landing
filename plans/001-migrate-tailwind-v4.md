# Plan 001: Migrate the site styling pipeline to Tailwind CSS v4

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat d3d7950..HEAD -- package.json package-lock.json astro.config.mjs postcss.config.mjs tailwind.config.mjs src/styles/global.css src/layouts/Layout.astro src/components/PageHeader.astro src/pages/bible-studies/[slug]/index.astro src/pages/icons/index.astro src/pages/readings/index.astro tests playwright.config.ts`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: migration
- **Planned at**: commit `d3d7950`, 2026-08-31

## Why this matters

The project is on Tailwind CSS 3.4.16 with a PostCSS pipeline. Tailwind 4 moves the preferred Astro/Vite integration to `@tailwindcss/vite`, replaces the three `@tailwind` directives with a CSS import, and requires CSS-first theme configuration. A correct migration must preserve the Fast & Pray semantic color tokens and generated utilities such as `bg-primary`, `max-w-content`, and `bg-cta-gradient`, while addressing Tailwind 4 utility behavior changes that otherwise alter controls and cards.

Tailwind 4 supports only Safari 16.4+, Chrome 111+, and Firefox 128+. Browser support has been explicitly approved by the user.

## Current state

- `package.json:18-33` installs Tailwind 3.4.16, PostCSS, Autoprefixer, and the v3 forms/typography plugins. It has no `@tailwindcss/vite` dependency.
- `astro.config.mjs:1-11` configures only Netlify; it has no `vite.plugins` array.
- `postcss.config.mjs:1-6` passes `tailwindcss` and `autoprefixer` to PostCSS. That is a v3 pipeline and must be removed when using Tailwind’s Vite plugin.
- `tailwind.config.mjs:1-50` defines the semantic colors, font aliases, named max widths, CTA background images, forms plugin, and typography plugin. The v4 migration must preserve every generated class currently used in templates.
- `src/styles/global.css:1-3` starts with the removed v3 directives. `src/styles/global.css:12-77` is the canonical Fast & Pray token source. Preserve its values and manually authored utilities.
- `src/layouts/Layout.astro:4,24-30` imports `global.css` and consumes `font-sans`, `max-w-content`, and `bg-surface`. This import must remain the global CSS entry point.
- `src/components/PageHeader.astro:18-33` builds `mb-${mb}` dynamically. Replace it with a finite `Record` mapping with `mb-0`, `mb-1`, `mb-2`, `mb-4`, `mb-6`, and `mb-8` values.
- `src/pages/readings/index.astro:81-85` uses `shadow-sm` and `focus:outline-none`; `src/pages/bible-studies/[slug]/index.astro:81-84` uses `hover:shadow-sm` and `flex-shrink-0`; `src/pages/icons/index.astro:166` generates `shadow-sm`.
- `src/pages/bible-studies/index.astro:45` uses `bg-gradient-to-br`; `src/pages/icons/index.astro:30` uses `bg-gradient-to-r`. Rename those to `bg-linear-to-br`/`bg-linear-to-r` preserving the `from-*`/`to-*` stops.
- Prose pages depend on typography; input/control pages depend on forms normalization.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `npm install` | exit 0 |
| Typecheck | `npm run check` | exit 0 |
| Unit/content tests | `npm test` | all tests pass |
| Production build | `npm run build` | exit 0; Netlify SSR function generated |
| Browser verification | `npm run dev` | listens on port 4321 |
| E2E | `npm run test:e2e` | all tests pass |

## Scope

**In scope**: `package.json`, `package-lock.json`, `astro.config.mjs`, `postcss.config.mjs` (delete), `tailwind.config.mjs` (delete), `src/styles/global.css`, `src/components/PageHeader.astro`, template files with documented v3-renamed utilities, and existing tests only when class-generation assumptions require a regression test.

**Out of scope**: Astro, Netlify, content, routing, APIs, copy, browser-support policy, visual redesign/new tokens, and direct `caniuse-lite`, `baseline-browser-mapping`, or `autoprefixer` dependencies.

## Steps

1. Inventory current source for `flex-shrink-`, `flex-grow-`, `outline-none`, bare `shadow`/`shadow-sm`, bare `rounded`/`rounded-sm`, bare `blur`/`blur-sm`, `ring`, `bg-gradient-to-`, deprecated opacity utilities, and dynamically constructed Tailwind utility strings. Replace dynamic utility construction with finite static mappings; do not safelist broadly.
2. Install current compatible stable `tailwindcss` 4.x, `@tailwindcss/vite`, `@tailwindcss/forms`, and `@tailwindcss/typography`. Remove `autoprefixer`, `postcss`, and `postcss-cli` only if unused outside Tailwind. Add `tailwindcss()` from `@tailwindcss/vite` to `vite.plugins` in `astro.config.mjs`; delete `postcss.config.mjs` and `tailwind.config.mjs` after migration.
3. In `src/styles/global.css`, replace v3 directives with `@import "tailwindcss";`, then register `@plugin "@tailwindcss/forms";` and `@plugin "@tailwindcss/typography";`. Directly after canonical `:root` tokens, create an `@theme inline` block that maps existing variables to Tailwind names: fonts (`--font-sans`, `--font-display`, `--font-body`, `--font-mono`), every semantic `--color-*` currently configured, `--background-image-cta-gradient`/`-hover`, and `--container-content`/`-prose`/`-chrome`. Use complete existing `var(--*)` colors, preserving alpha modifiers. Retain `.focus-ring`.
4. Apply only documented migrations from the inventory. At minimum `flex-shrink-0` → `shrink-0`, `focus:outline-none` → `focus:outline-hidden`, gradient utilities to `bg-linear-to-*` preserving stops, and `shadow-sm` → `shadow-xs` only where the old small-shadow visual must remain. Audit uncolored borders/dividers: Tailwind 4 default is `currentColor`, add explicit color only if a dependency on the old default is demonstrated.
5. Run `npm run check`, `npm test`, `npm run build`, and `npm run test:e2e`. Browser-check desktop/mobile: home navbar/footer/container/CTA/mobile menu; blog list/detail prose; Bible-study cards/day view; readings input/focus/validation; icons cards/chips/modal controls. No missing styles, changed token colors, unstyled prose, responsive breakage, or focus regressions.

## Done criteria

- Browser support approved.
- v4 packages and Vite integration active; no v3 directives/config/pipeline remain.
- Semantic classes `font-sans`, `max-w-content`, `max-w-prose`, `max-w-chrome`, `bg-primary`, `bg-surface`, `text-fg`, `border-border`, `bg-cta-gradient`, `hover:bg-cta-gradient-hover`, `prose`, and `focus-ring` resolve.
- Dynamic classes are finite literals, no broad safelist.
- `npm run check`, `npm test`, `npm run build`, and `npm run test:e2e` pass.
- Desktop/mobile browser checks pass.

## STOP conditions

Stop if a plugin loses design-critical behavior without v4 replacement; a current utility cannot be reproduced without visual redesign; scope reaches Astro/Netlify/content/API/routing; a verification command fails twice after a focused fix; or plan excerpts drift.

## Maintenance notes

Keep tokens in `global.css` and expose via `@theme inline`; avoid reintroducing JS config. Keep dynamic classes finite literals. Do not re-add PostCSS/Autoprefixer for Tailwind alone.
