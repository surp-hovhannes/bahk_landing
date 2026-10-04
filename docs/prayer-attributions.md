# Prayer attribution integration

Canonical source: `/prayer-attributions/#narek-samuelian-2021`.

The registry holds reviewed work/edition information once. `PrayerCredits` accepts explicit references on Bible-study frontmatter; session references render alongside session content and collection references render once on the overview. Never copy overview credits to sessions based on study membership. A standalone reference identifies its own edition. No current Markdown identifies Narek or a verified Narek excerpt; no existing text has been relabeled.

Example (only after verifying the actual text):

```yaml
prayerCredits:
  - attributionId: narek-samuelian-2021
    covers: Narek prayer 1
    scope: prayer
    contentLanguage: en
    editionId: samuelian-2021-revised
```

Use `scope: collection` on a collection overview. For individual exceptions, use an explicit prayer reference with `overrides` for only the differing credit fields. Identical references render once. Overrides replace specified fields and always preserve the required shared notices; language, edition, and stable source IDs cannot be overridden. Different editions require separate reviewed registry entries. Optional empty arrays render no fields. Missing or mismatched references render no attribution UI.

`contentLanguage` is the actual rendered prayer language, not the requested interface language. If text falls back from Armenian to English, pass English and the verified English edition. `displayLanguage` affects only approved display wording: supplied Armenian strings are supported, and missing strings fall back to English with `lang="en"`. There is no reviewed Armenian Narek entry or localized wording here. Do not invent one.

The English permission is verified; this repository contains only public acknowledgment wording, not correspondence or contact information. No broader license or thematic-index permission is claimed. Before importing any text, verify its edition and content. This change imports no production prayers and changes no backend schema.

## Backend dependency

The backend Prayer/PrayerSet models and serializers do not persist or expose structured attribution. The reviewed CLI provenance sidecar is not an API field. API-backed attribution requires an agreed persisted backend/import/API contract; do not insert credits in prayer text, tags, or descriptions as a substitute. Track that work in issue #52.

## Validation for issue #52

Validated in the cloud container on 2026-10-04, from main commit `c04b1c334e1812f571d31088a54ca68959d48848`:

- `npm run check`: passed (Astro sync and TypeScript).
- `npm test`: 4 files, 20 tests passed, including explicit language/edition matching, localization, deduplication, partial overrides, preserved notices, hostile-text escaping, safe rendered URLs, and absent optional fields/empty UI.
- `npm run build`: passed with the Netlify server adapter.
- Relevant Playwright: 5 tests passed (prayer attribution and existing Bible-study navigation). Verified 375px mobile wrapping, semantic heading, keyboard focus, no-JavaScript visibility, canonical links, and at least 4.5:1 body/link contrast with 16px credit text. Mobile screenshot inspected.
- Independent reviewer initially identified lost coverage labels, hardcoded registry headings, and reserved-domain URL gaps. All fixed; re-review found no remaining blocking issues and independently passed 16 model/render tests.
- Public colophon and introduction links were read successfully and confirmed translator/editor and revised-edition metadata. No private correspondence or prayer text was added.

The container’s `gh` token reports invalid; public git clone and the connected GitHub issue reader succeeded without credential changes. Playwright’s managed browser download returned HTTP 403 `Domain forbidden`; the existing `/usr/bin/chromium` passed browser tests instead. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to use an existing browser, or leave it unset for standard Playwright-managed Chromium. Container commands used `ASTRO_TELEMETRY_DISABLED=1`, `XDG_CONFIG_HOME=/tmp/issue52-config`, and `XDG_CACHE_HOME=/tmp/issue52-cache` to keep runtime files in writable paths. No repository-scope blocker remained. No push, PR, merge, or deployment was performed.
