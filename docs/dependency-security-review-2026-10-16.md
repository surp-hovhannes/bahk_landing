# Dependency remediation follow-up — 2026-10-16

This follow-up to PR #55 fixes the remaining vulnerable image-processing copy of
Sharp and the CSS selector parser. It also refreshes a cache dependency without
claiming a confirmed fix for its disputed advisory. The full npm audit decreases
from 16 affected package entries (14 high, two moderate) to 12 high entries.
Braces and node-forge remain unpatched upstream; their findings are not suppressed.

The baseline is main `46adaa0c91c6bf6dfb2c51c21f01e9bce4a5a2bb`.
The original [October 13 review](dependency-security-review-2026-10-13.md)
remains a historical record of PR #55.

## Dependency changes and compatibility boundaries

| Dependency | Before → proposed | Reason and constraint |
| --- | --- | --- |
| Typography's postcss-selector-parser | 6.0.10 → 7.1.6 | A scoped override replaces typography 0.5.20's exact pin with the security fix. This crosses the parser's major version and is covered by selector-output, performance, generated-CSS, and browser checks. |
| IPX | 3.1.1 → 3.1.2 | Retains the IPX 3 API required by Netlify images 2.0.3. The patch requires unstorage `^1.17.6`, so its installed version also changes from 1.17.5 to 1.17.6. |
| IPX's Sharp | 0.34.5 → 0.35.5 | An override scoped to `ipx@3.1.2` replaces its declared `^0.34.4` dependency with the reviewed patched version. The adapter and Astro now resolve the same Sharp copy. |
| http-cache-semantics | 4.2.0 → 4.3.0 | A lockfile refresh within Astro's existing `^4.2.0` range; see the separate advisory assessment below. |

The parser update fixes
[GHSA-rj75-hqrm-r3gf](https://github.com/advisories/GHSA-rj75-hqrm-r3gf).
A 200 KB flat-selector regression exceeds the five-second subprocess limit on
the original parser and passes after the update. Eight representative selector
cases preserve typography's pseudo-element extraction. The generated site CSS
is compared with the baseline, in addition to desktop/mobile blog checks.

Sharp 0.35.5 covers the three advisories affecting the old IPX copy:
[libvips](https://github.com/advisories/GHSA-f88m-g3jw-g9cj),
[libheif](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c), and
[librsvg](https://github.com/advisories/GHSA-wq5f-xc86-pv6w).
Astro's copy was already 0.35.5 before this PR.

The Sharp override is deliberately narrow, rather than a claim of general
upstream IPX 3 support for Sharp 0.35. The compatibility tests exercise the actual
Netlify adapter → Vite plugin → dev → images → IPX resolution, decoding PNG,
JPEG, WebP, AVIF, GIF, and SVG inputs; resizing; fit/position; quality; output
formats; and request restrictions. An end-to-end test rasterizes the site's real
SVG favicon through the running development server. General IPX modifiers not
exposed by Netlify's image handler are outside this compatibility claim.
Sharp's [0.35 breaking changes](https://sharp.pixelplumbing.com/changelog/v0.35.0/)
include AVIF quality tuning; byte-identical lossy image output is not promised.
Validation is on Linux/Node 22, not every native target platform.

The exact IPX scope prevents silently extending this override to future IPX
versions. The native-version regression will fail if an update reintroduces the
unreviewed 0.34 copy. Remove or reassess the override when an upstream supported
dependency graph includes patched Sharp.

IPX 4 is not substituted: Netlify images 2.0.3 imports `createIPXWebServer`, which
IPX 4 removes in favor of its new handler APIs. Its upgrade would require an
upstream Netlify change or a separately maintained integration patch. The latest
Netlify adapter 8.2.10 and images 2.0.3 still retain the IPX 3 dependency. No adapter
downgrade or application/deployment configuration change is included.

## Cache advisory assessment

[GHSA-ch52-4w7c-c8xp](https://github.com/advisories/GHSA-ch52-4w7c-c8xp)
flags http-cache-semantics `<=4.2.0`, but still lists no patched version. Its
[maintainer disputes the report](https://github.com/kornelski/http-cache-semantics/issues/56).
Version 4.3.0 falls outside that affected range and therefore removes one audit
entry. Comparing the published source with 4.2.0 shows changes to status handling
and Vary matching, without a change to the reported max-stale logic. This refresh
must not be represented as a confirmed repair of the alleged behavior.

Astro's installed use is in remote-image build/revalidation utilities, with
internally constructed requests and calls to `storable()` and `timeToLive()`.
No application use or Astro call to `satisfiesWithoutRevalidation()` was found.
Reassess the advisory if shared-cache behavior or application image usage changes.

## Remaining upstream issues and mitigations

**Braces 3.0.3 — high, [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).**
There is no published patched release; 3.0.3 remains latest. The dependency path is:

```text
@astrojs/netlify → @netlify/vite-plugin → @netlify/dev
  → @netlify/functions-dev → @netlify/zip-it-and-ship-it
  → fast-glob → micromatch → braces
```

The advisory concerns stack exhaustion from deeply nested brace patterns.
The established use here is development/function-build glob processing, not a
public application glob endpoint. Keep bundler glob inputs in reviewed repository
configuration and avoid accepting untrusted patterns. An upstream depth guard,
supported bundler replacement, or maintained patched fork is needed to eliminate
this finding. Each would require its own build/function regression review.

**node-forge 1.4.0 — high, [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv).**
There is no published patched release; 1.4.0 remains latest. The dependency path is:

```text
@astrojs/netlify → @netlify/vite-plugin → @netlify/dev
  → @netlify/images → ipx@3.1.2 → listhen → node-forge
```

The reported issue affects RSA signature verification. Listhen uses forge for
development TLS certificate handling and signing; no application or listhen call
to the affected signature-verification operation was found. Keep development
servers private and certificate/key input trusted. Using trusted supplied
certificates or avoiding local HTTPS can reduce the relevant execution surface,
but does not remove the installed dependency or its audit entry. A compatible
Netlify/IPX 4 integration could remove the listhen/forge chain; changing an
unrelated package version or disabling image emulation alone does not remove it.

These are exposure limits established by source inspection, not proof that
production is invulnerable. No separate copies of either remaining vulnerable
leaf package were found in the locally generated SSR function package. Production
deployment and runtime reachability have not been verified.

## Audit evidence

The checked-in raw reports are
[before](security-audits/2026-10-16-before.json) and
[after](security-audits/2026-10-16-after.json), generated with `npm audit --json`
on Node 22.23.3. They retain the nonzero audit result.

| Measurement | Before | Proposed |
| --- | --- | --- |
| Affected package entries | 16 | 12 |
| High entries | 14 | 12 |
| Moderate entries | 2 | 0 |
| Vulnerable leaf packages reported | 5 | 2 |
| Distinct advisories reported | 7 | 2 |

The 12 remaining entries consist of Braces, node-forge, and ten affected parent
packages. They are not 12 independent vulnerabilities. Four advisories are fixed
by patched Sharp/parser releases; the cache advisory leaves the scanner's range
without a confirmed behavioral fix. `npm audit --omit=dev` still reports the same
12 entries because the adapter and its tooling are declared under dependencies.
That manifest classification does not establish production execution.

`npm audit fix --force` is not used. Its proposed Netlify 6.4.1 downgrade expects
Astro 5 rather than this application's Astro 7, and its old typography downgrade
would change styling dependencies. No advisory is ignored, dismissed, or hidden.

## Validation

Local validation on Linux, Node 22.23.3:

- Clean `npm ci` with npm 10.9.9: passed; npm 11.9.0 also verified the reviewed
  dependency paths during lockfile preparation.
- `npm run check`: passed.
- `npm run test:coverage`: 50 tests passed across five files, including 29 new
  dependency compatibility/security regressions. Application statement coverage
  remains 15.7%.
- `npm run test:e2e`: all 11 Chromium tests passed, including the integrated image
  endpoint and desktop/mobile blog typography.
- `npm run build`: passed, including the generated Netlify SSR function.
- The complete generated CSS is byte-identical to the baseline (SHA-256
  `8c28de27fe5a1ad5617381cee07975c93ade6b0523e09c1e3f20dab1f9636737`).
- Local generated-function checks passed for prayer attributions, Bible studies,
  and the static blog at 1440px and 375px, without horizontal overflow or browser
  page errors. The mobile attribution and desktop Bible-study screenshots also
  match the baseline exactly. RSS, favicon, and missing-route checks passed.
- `npm ls sharp ipx postcss-selector-parser http-cache-semantics`: passed with no
  invalid versions; `git diff --check`: passed. There is no lint script/config.

The tests cover the current Netlify image surface, not all upstream IPX APIs.
The PR description records CI for its exact head. Production runtime was not
tested and no production deployment is claimed.

`npm ls --all` remains nonzero for six extraneous optional WASM artifacts on
Linux: `@emnapi/core`, `@emnapi/runtime`, `@emnapi/wasi-threads`,
`@img/sharp-wasm32`, `@napi-rs/wasm-runtime`, and `@tybys/wasm-util`. The baseline
also reports optional WASM problems (five reports, including the old Sharp WASM
version warning); this PR does not claim an entirely clean dependency tree.
The reviewed Sharp, IPX, parser, and cache paths resolve without invalid-version
errors. The development server is kept attached with
`ASTRO_DEV_BACKGROUND=1`, and writable XDG/npm cache locations are local execution
settings rather than repository changes. No merge or manual deployment is part
of this follow-up.
