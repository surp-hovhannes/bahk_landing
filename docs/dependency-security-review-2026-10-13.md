# Dependency security review — 2026-10-13

Reviewed the October 13 Dependabot digest and all 30 open repository alerts against
main `5a4e5ae0b0201c9b4a24a4cf4bc8fef3c2d19fda`. These findings describe the
proposed lockfile and inspected source; the production deployment commit has not
been verified. GitHub alerts on main will remain open until a qualifying change
lands there. This PR does not establish that production is patched.

## Changes

Upgrade the Netlify adapter from 8.2.5 to locked 8.2.9, and Vitest plus its matching
coverage provider from 4.1.7 to 4.1.11. Add explicit Node 22 type definitions:
the config files previously relied on types supplied transitively by Netlify.
Declare `@netlify/blobs ^10.7.13` for Astro's existing unstorage session driver,
whose supported optional peer range ends at Blobs 10. The updated adapter keeps
its separate Blobs 11 copy. This fixes prerendering's missing-package error
without changing session behavior or overriding either supported dependency range.
Astro remains 7.2.10. Existing overrides are unchanged; no new overrides were
introduced.

The adapter refresh includes upstream major versions of Netlify's internal
packages and a bundler change in 8.2.9. This is why the lockfile diff is substantial;
the Netlify production build and existing tests must pass before review.
[Adapter changelog](https://github.com/withastro/astro/blob/main/packages/integrations/netlify/CHANGELOG.md).

| Package | Before → proposed lockfile | Original alert numbers | Assessment |
| --- | --- | --- | --- |
| devalue | 5.9.2 → 5.9.4 | 176–181 | Above the 5.9.3 fixes for all six advisories |
| undici | 8.10.1 → 8.11.2 | 164–174 | Above the 8.10.2 fixes for all eleven advisories |
| brace-expansion | 5.0.9 → 5.0.12 | 175 | Includes the digest fix and newer recursion/CPU fixes |
| fast-uri | 3.1.6 → 3.1.8 | 163 | Includes the digest fix and newer host-normalization fix |
| vitest / @vitest/mocker | 4.1.7 → 4.1.11 | 158, 159 | Fixed, with coverage-v8 kept at the same version |
| toml | 3.0.0 → 4.3.0 | 155, 156 | Netlify's supported bundler now declares toml 4 |
| image-size | 2.0.2 → absent | 161, 162 | Removed through the supported Netlify dependency refresh |
| extract-zip | 2.0.1 → absent | 151, 157 | Removed through the supported Netlify dependency refresh; neither advisory lists a patch |
| sharp | 0.35.4 → 0.35.5; IPX copy stays 0.34.5 | 134, 160 | Astro copy updated; IPX copy still affected |
| http-cache-semantics | 4.2.0 → unchanged | 182 | Disputed advisory; no confirmed patch |

Thus the proposed dependency graph addresses 27 of the original 30 alerts;
the two sharp alerts and cache alert remain unresolved. This is an assessment of
the lockfile, not a claim that GitHub has closed those alerts.

Also refresh smol-toml 1.8.0 → 1.9.1 and source-map-js 1.2.1 → 1.2.2 for
advisories reported by the current npm audit beyond the digest.

## Reachability and remaining advisories

- **devalue:** Astro declares `^5.8.1`, so the patch fits its supported range.
  Source inspection found no application Buffer/devalue serialization, Actions,
  or session calls. That limits the established exposure; it does not prove the
  framework path is unreachable. A synthetic Buffer-view regression check
  confirms that the resolved serializer excludes bytes outside the view.
  [Upstream memory-disclosure advisory](https://github.com/sveltejs/devalue/security/advisories/GHSA-j22f-vq7h-c4qm).
- **sharp:** `@astrojs/netlify → @netlify/vite-plugin → @netlify/dev →
  @netlify/images → ipx@3.1.1` still requires `sharp ^0.34.3`. Netlify image
  emulation is enabled in this application's local dev config. The application
  does not import `astro:assets` or sharp directly. Sharp 0.35 removes deprecated
  APIs, while IPX 4 changes server APIs used by Netlify. Retain the supported
  dependency graph pending an IPX 3 / Netlify release that accepts patched sharp;
  do not treat the patched Astro copy as fixing the nested copy. The newer librsvg
  advisory also affects that nested copy.
  [IPX tracking issue](https://github.com/unjs/ipx/issues/327),
  [sharp 0.35 breaking changes](https://sharp.pixelplumbing.com/changelog/v0.35.0/).
- **http-cache-semantics:** Astro imports it in remote image build/revalidation
  utilities, using internally created requests and `storable()` / `timeToLive()`.
  No application use or call to `satisfiesWithoutRevalidation()` was found in
  Astro's installed code. The advisory still lists no patched version; the
  maintainer disputes its assumptions and closed the report as not planned.
  A 4.3.0 version bump should not be represented as a confirmed fix of max-stale
  behavior. Retain 4.2.0 and revisit upstream resolution or new application
  caching/image usage.
  [Advisory](https://github.com/advisories/GHSA-ch52-4w7c-c8xp),
  [maintainer response](https://github.com/kornelski/http-cache-semantics/issues/56).
- **braces 3.0.3:** GHSA-vfj7-8cjw-p6xm remains via Netlify's function bundler →
  fast-glob → micromatch. The current advisory lists no patch. This is build
  pattern processing; no application import or untrusted glob input was found.
  [Advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
- **node-forge 1.4.0:** GHSA-86w9-cpqp-85rv remains via IPX → listhen, a development
  server dependency. The current advisory lists no patch. No application signature
  verification path was found.
  [Advisory](https://github.com/advisories/GHSA-86w9-cpqp-85rv).
- **postcss-selector-parser 6.0.10:** GHSA-rj75-hqrm-r3gf remains because
  `@tailwindcss/typography@0.5.20` pins that version. The fix is 7.1.6, outside its
  declared range. It processes repository CSS during builds; no public selector
  parsing endpoint was found. Await a compatible typography update rather than
  applying npm audit's suggested downgrade to 0.5.4.
  [Advisory](https://github.com/advisories/GHSA-rj75-hqrm-r3gf).

The audit reports 28 affected package entries before and 16 after (14 high,
2 moderate after). These counts include affected ancestors, not just vulnerable
leaf packages. The remaining leaf packages are sharp, http-cache-semantics,
braces, node-forge, and postcss-selector-parser. The audit is intentionally not
suppressed, and no alerts were dismissed.

## Validation

Local validation used Node 22.23.3, matching CI's Node major:

- Clean `npm ci` from the final lockfile: passed.
- `npm run check`: passed.
- `npm run build`: passed, including static prerendering and generated Netlify SSR function.
- `npm run test:coverage`: 21 tests passed across four files. Reported statement
  coverage is 15.7%; these tests do not establish full application coverage.
- `npm run test:e2e`: all nine Chromium tests passed against a fresh local server.
- `npm ls --all`: no dependency-tree problems.
- Synthetic devalue Buffer-view serialization check: passed for `stringify` /
  `parse` and `uneval`, excluding a known sentinel outside the two-byte view.
- `git diff --check`: passed. There is no lint script or lint configuration.

The browser tests exercise the development server. The production bundle was
built locally; no deployment or production-runtime test was performed. Remote
checks for the exact PR commit are recorded in the PR description.

On this Mac, sharp 0.34's installer detects global libvips and attempts a source
build. A clean install succeeds with its documented
`SHARP_IGNORE_GLOBAL_LIBVIPS=1` environment option, using packaged binaries.
This is a local installation setting and is not added to application or CI config.
Astro detects this local agent and backgrounds its dev server automatically;
the browser run used `ASTRO_DEV_BACKGROUND=1` to suppress that auto-detection and
keep the server attached to Playwright. No test-server reuse or test exclusions
were needed, and the setting is not added to repository config.
