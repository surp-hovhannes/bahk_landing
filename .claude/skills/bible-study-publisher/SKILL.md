---
name: bible-study-publisher
description: Converts a fast's 5-day devotional transcript into a guided Bible study (scripture, reflection, discussion questions) and publishes it to the Fast and Pray landing site as an Astro content collection entry, wiring in devotional videos from the API and opening a PR. Use when asked to create or publish a guided bible study for a fast, or given a devotional transcript and fast name to turn into one.
---

# Bible Study Publisher

Turns a raw devotional transcript into a 5-day guided Bible study and publishes it under `src/content/bibleStudies/` in this repo.

## Inputs

| Variable | Required? | Default | Purpose |
|---|---|---|---|
| `fast_name` | required | — | Name to search the fasts API with and build the title/slug (e.g. "Transfiguration") |
| `transcript_path` | required | — | Path to the raw 5-day devotional transcript |
| `icon_id` | required | — | Icon library ID (`https://fastandpray.app/icons/{id}`) used for the cover image |
| `slug` | optional | derived from `fast_name`, e.g. `fast-of-transfiguration` | Override if the auto-derived slug reads awkwardly |
| `church_id` | optional | `1` (Armenian Apostolic Church) | Passed to the fasts API lookup |
| `branch_name` | optional | `<short-name>-bible-study`, e.g. `transfiguration-bible-study` | Git branch for the PR |
| `pr_assignee` | optional | `mattash` | GitHub reviewer to assign |
| `prayer_placeholders` | optional | `true` | Insert `INSERT PRAYER HERE` for Opening/Closing Prayer instead of generating that text |

If any required input is missing, ask for it before starting.

## Workflow

```
Task Progress:
- [ ] 1. Generate the 5-day content (scripture, reflection, questions)
- [ ] 2. Look up fast id via API
- [ ] 3. Look up devotional video/thumbnail URLs via API
- [ ] 4. Download the icon cover image
- [ ] 5. Create the content folder and files
- [ ] 6. Verify the build
- [ ] 7. Commit, push, open PR
```

### 1. Generate the 5-day content

For each day in the transcript, write:

1. **Title** — pull directly from the transcript (e.g. "Day One: Who do you say that I am?" → "Who Do You Say That I Am?").
2. **Scripture Reading** — identify every scripture reference cited that day. Verify the exact **NRSV/NRSVUE** wording via web search (e.g. biblegateway.com) — never recall a passage from memory. Cite book/chapter/verse above the text.
3. **Reflection** — one paragraph, third person, synthesizing the day's theological and personal themes. Paraphrase; never copy the transcript verbatim.
4. **Group Discussion Questions** — 2–3 questions, styled after [foundations-style-reference.md](foundations-style-reference.md): personally grounded, emotionally honest, inviting real sharing rather than abstract theology. Draw directly from that day's content.
5. **Personal Reflection Questions** — 1–2 questions or prompts for quiet/journaling time, can include a prayer prompt drawn from the transcript.
6. **Opening Prayer** and **Closing Prayer** — thematic to the day. If `prayer_placeholders` is true (default), write the literal text `INSERT PRAYER HERE` under each heading instead of generating prayer text — these are meant to be authored by a person.

It's fine for a later day's Scripture Reading to intentionally repeat an earlier day's passage if the transcript itself calls back to it (e.g. "back to the same verse") — match the transcript's own framing rather than forcing a different reference.

### 2. Look up the fast id

```
GET https://api.fastandpray.app/api/fasts/?church_id={church_id}&search={fast_name}
```

The `search` param doesn't reliably filter server-side — fetch the full list and find the entry whose `name` matches `fast_name`. Note its `id`.

### 3. Look up devotional videos

```
GET https://api.fastandpray.app/api/devotionals/by-fast/{fast_id}/
```

Returns 5 results in day order, each with `id` (devotional id), `video` (S3 URL), `thumbnail` (S3 poster URL), and `title` — cross-check `title` against the day titles you pulled from the transcript.

### 4. Download the icon cover image

Fetch `https://fastandpray.app/icons/{icon_id}`, extract the main image URL, and download it to `cover.jpg` inside the new study folder.

### 5. Create the folder and files

Folder: `src/content/bibleStudies/{slug}/` (slug pattern: `fast-of-{name}`, e.g. `fast-of-transfiguration`).

**`index.md`:**

```markdown
---
title: "Fast of {Name}"
description: "A 5-day guided Bible study for the Fast of {Name}: {one-sentence summary}."
studySlug: "{slug}"
coverImage: "./cover.jpg"
fastId: {fast_id}
---

This guided Bible study accompanies the 5-day devotional series for the Fast of {Name}.

Each session includes scripture reading, reflection, group discussion questions, and personal reflection questions — designed for small, self-led groups to journey through together.
```

**`0N-{day-title-slug}.md`** (one per day, kebab-case filename from the day title):

```markdown
---
title: "Fast of {Name}"
description: "A 5-day guided Bible study for the Fast of {Name}"
studySlug: "{slug}"
session:
  day: {1-5}
  title: "{Day Title}"
  devotionalId: {devotional id from step 3}
  videoUrl: "{video URL from step 3}"
  posterUrl: "{thumbnail URL from step 3}"
---

## Opening Prayer

{prayer text or INSERT PRAYER HERE}

## Scripture Reading

**{Book Chapter:Verse}** — *"{full NRSV passage}"*

## Reflection

{reflection paragraph}

## Group Discussion Questions

Gather with your group and discuss:

1. {question}
2. {question}

## Personal Reflection Questions

Take some quiet time with these:

1. {question or prompt}

## Closing Prayer

{prayer text or INSERT PRAYER HERE}
```

### 6. Verify the build

```bash
npm run build
```

Must complete with no errors. Then run `npm run dev` and curl (or open) `/bible-studies/{slug}/` and `/bible-studies/{slug}/1/` through `/5/` — confirm all return 200 and render the cover image, scripture, and devotional video. Stop the dev server when done.

### 7. Commit, push, open PR

Before staging, run `git status --short` and check for anything already staged that isn't part of this change (e.g. unrelated local settings files) — stage only the new study folder by explicit path, never `git add -A`.

```bash
git checkout -b {branch_name}
git add src/content/bibleStudies/{slug}/
git commit -m "Add Fast of {Name} bible study with devotional videos"
git push -u origin {branch_name}
gh pr create --title "Add Fast of {Name} bible study" --assignee {pr_assignee} --body "..."
```

Include in the PR body: what was added, that Opening/Closing Prayer are placeholders pending human authoring (if `prayer_placeholders` is true), the fastId/devotional ids used, and the build/dev verification steps taken.

Confirm with the user before pushing and opening the PR — these are visible, shared-state actions.
