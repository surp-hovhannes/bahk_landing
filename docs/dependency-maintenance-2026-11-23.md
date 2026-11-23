# Runtime, dependency security, and Netlify maintenance — 2026-11-23

Based on a clean checkout of main `c0d7df206db46dad36afc549dec83c38efb4a4d2`.
At inspection, [#54](https://github.com/surp-hovhannes/bahk_landing/issues/54)
was the only open issue, with no open PRs. Its Astro 7.3.5 target predates the
current security fixes. This change stays on Astro 7, Netlify adapter 8, Vite 8,
Vitest 4, Tailwind 4, and Node 22.

## Runtime and compatibility decisions

- Pin Node **22.23.5** in `.nvmrc` and `netlify.toml`, require `^22.23.5` in
  package engines, and make every CI job read `.nvmrc`. This is the
  [November 11 Node security release](https://nodejs.org/en/blog/release/v22.23.5).
  The cloud's initial runtime was 24.22.3; validation explicitly used 22.23.5.
- Raise Astro's minimum and lock to **7.4.13**, the stable release verified in
  npm and [the official release](https://github.com/withastro/astro/releases/tag/astro%407.4.13).
  Astro's published engine is now `>=22.23.4`: retaining Netlify's old 22.12.0
  pin would leave a partial dependency refresh incompatible with its build runtime.
- Raise the adapter minimum and lock to **8.2.14**, whose peer accepts Astro
  `^7.0.0`. Its [stable release](https://github.com/withastro/astro/releases/tag/%40astrojs/netlify%408.2.14)
  includes the preceding NFT tracing correction and unpins internal Astro
  dependencies. Vite resolves to 8.3.8, satisfying both consumers.
- Refresh the adapter's supported `@netlify/dev` range to locked **5.2.2**.
  This moves `@netlify/images` **2.0.3 → 2.0.8** and IPX **3.1.2 → 4.1.0**.
  Merely refreshing the adapter leaves the old dev version valid in the lockfile.
  Removing the old Sharp override at that point would restore vulnerable Sharp
  0.34.5. The final graph uses Netlify's own IPX 4 integration and Sharp 0.35.5;
  the earlier IPX-3-specific override is therefore removed. Existing image tests
  exercise the real adapter → dev → images → IPX → Sharp dependency chain.
- Retain the SVGO and typography parser overrides and the existing direct Blobs
  10 dependency. The adapter retains its supported Blobs 11 copy; no session
  configuration or application storage behavior is changed.
- All direct framework/tool selections are stable. Published Astro internals
  retain `get-tsconfig` 5.0.0-beta.6 (baseline beta.4); upstream optional WASM
  dependencies also include `@emnapi/*` 2.0.0-beta.2. No beta adapter or Astro
  release was selected. Those upstream transitive prereleases are an explicit
  exception to #54's broad “no prerelease dependency” criterion.

## Security evidence

The raw [before audit](security-audits/2026-11-23-before.json) reports **21 affected
package entries: 5 high, 15 moderate, 1 low**, representing 47 distinct advisory
IDs across ten leaf packages. Parent entries are included in the package count.
The [after audit](security-audits/2026-11-23-after.json) reports **zero** findings.
`npm audit --omit=dev` also reports zero. No audit suppression, advisory dismissal,
or `npm audit fix --force` was used.

Official GitHub advisory metadata was fetched without descriptions or exploit
payloads. The [recorded affected/patched ranges](security-audits/2026-11-23-patched-versions.json)
cover every advisory in the baseline audit. The highest required fixed version
within each installed package line is summarized below.

| Package | Baseline → final | Published fixed version / resolution |
| --- | --- | --- |
| Astro | 7.2.10 → 7.4.13 | 7.4.7 covers the latest affected range in this audit |
| Vitest / mocker / coverage | 4.1.11 → 4.1.12 | 4.1.12, matching runner and coverage provider |
| fast-uri | 3.1.8 → 3.1.9 | 3.1.9 |
| fast-xml-parser | 5.7.0 → 5.12.1 | 5.12.0; refresh the existing exact override |
| Glob | 13.0.6 → 14.0.6 | 14.0.2 |
| Minimatch | 10.2.6 → 11.0.9 | 11.0.1 |
| node-forge | 1.4.0 → absent | Removed with IPX 3 / listhen; no repair claim for the old code |
| toml | 4.3.0 → 5.0.1 | 5.0.1 through the supported Netlify bundler refresh |
| undici | 8.11.2 → 8.13.1 | 8.12.2 |
| Zod | 4.5.4 → 4.6.7 | 4.6.6 |

Glob and Minimatch require cross-major transitive updates because the current
Netlify bundler still declares older lines. They are scoped under
`@netlify/zip-it-and-ship-it@16.6.0`, rather than overridden globally. This is
the only new override. Remove or reassess it when Netlify updates its declared
ranges or the bundler version changes. `tests/netlify-bundling.test.mjs` resolves
the actual dev consumer and packages functions with NFT, ZISI, and esbuild;
wildcard-specific config, nested included assets, negative exclusions, ZIP
extraction, and execution outside the source directory all pass. A separate NFT
consumer check traces dynamic filesystem JSON assets through Glob. These are
ordinary compatibility fixtures, not vulnerability reproductions.

The lockfile changes include Astro's internal packages, native compiler/WASM
platform packages, and the supported Netlify dependency refresh. Tailwind and its
Vite plugin remain 4.3.3, and no product CSS or content changes are included.
Security findings describe installed source, not verified production exposure.

## Verification

Linux x64, Node **22.23.5**, npm **11.19.1**, from the final committed lockfile:

- `npm ci`, `npm run check`, `npm test`, and `npm run test:coverage`: passed;
  **67 tests across eight files**. Statement coverage is **16.75%**, not full
  application coverage.
- `npm run test:e2e`: **11 Chromium tests passed**, including the running
  Netlify image endpoint, rasterized SVG favicon, browser interactions, typography,
  prayer attribution links, and mobile layout. Local execution used the supplied
  `/usr/bin/chromium`; CI installs the Playwright browser normally.
- `npm run test:ssr`: normal production build and **six packaged-function tests
  passed**. They import `.netlify/v1/functions/ssr/ssr.mjs`, exercise SSR content,
  canonical RSS, icon images/API-404 redirects, both Daily Readings services,
  invalid dates, missing routes and draft exclusion, and check shipped CSS/static
  blog/favicon files. The new CI build job runs this command.
- Local HTTP/browser checks of baseline and proposed packaged outputs passed for
  home, welcome blog, prayer attributions, Bible-study session, readings landing
  and icon detail at **1440px and 375px**: status 200, no horizontal overflow or
  browser page errors. [Recorded comparisons](maintenance-visual-checks-2026-11-23.json)
  show eight of twelve screenshots byte-identical. The other four differ only
  within animated hero graphics or the native video loading spinner, confirmed by
  pixel bounds and visual inspection. External API responses were fixtures and
  remote fonts/media were blocked for both versions.
- Complete generated CSS is byte-identical to baseline: SHA-256
  `b592246b398ffeedcc62f5b0d29ba15b257ab5a6acb251ac097fe278ddcec88e`.
- `npm ls --all`, both audit modes, and `git diff --check`: passed. No lint
  script/config exists. The lockfile SHA-256 is
  `2886b19aa39f6475aaf618d0673f93ad6ab3232f1ec9d9b49485b81449850455`.

Writable npm/XDG caches and `ASTRO_DEV_BACKGROUND=0` were local execution
settings, not repository changes. npm reported upstream deprecation/install-script
notices; install, native image transformation, bundling and builds succeeded.

## Integration gaps and review boundary

The connected GitHub integration returned **HTTP 403, “Resource not accessible by
integration”** for `GET /repos/surp-hovhannes/bahk_landing/dependabot/alerts?state=open`.
Consequently, individual private Dependabot alert IDs/statuses could not be
reconciled; the current npm audit and public official advisories provide the
available security evidence. A clean scanner result does not establish absence
of every vulnerability.

No deployment or live settings change was performed. Local function tests do not
verify hosted Netlify routing, Image CDN infrastructure, Blobs credentials,
provider-managed Lambda patch levels, or live backend availability. They use the
real packaged handler with isolated API fixtures; the image middleware tests use
Netlify's local implementation. Hosted preview acceptance in #54 remains for the
normal deployment review. The repo pin governs future builds; it does not prove
the current production runtime changed. Other OS/native targets were not tested.

The commit message and PR title carry `[skip netlify]` to prevent automatic
branch/PR preview deploys while allowing GitHub test CI. This follows
[Netlify's documented skip-deploy behavior](https://docs.netlify.com/deploy/manage-deploys/manage-deploys-overview/#skip-a-deploy).
No merge, production deploy, scheduled rebuild workflow edit, or content/draft
edit is part of this work. For rollback after a separately authorized release,
revert runtime pins, manifest, lockfile and configuration together to the baseline
above and rebuild under its prior runtime; no data migration is involved.
