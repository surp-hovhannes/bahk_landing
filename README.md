# bahk_landing

`bahk_landing` is the Astro-based Fast & Pray landing site. It powers the public marketing pages, blog, RSS feed, and icon library for the Fast & Pray app.

## Stack

- Astro 5 with SSR output
- Netlify adapter for deployment
- Tailwind CSS
- Astro content collections for blog posts and Bible studies

## Local development

```sh
npm install
npm run dev
```

The dev server runs at `http://localhost:4321`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local Astro dev server |
| `npm run build` | Build the production site into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run astro -- --help` | Show Astro CLI help |

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `PUBLIC_SITE` | `https://fastandpray.app` | Canonical site URL used by Astro SSR and RSS generation |
| `PUBLIC_API_URL` | `https://api.fastandpray.app` | Backend API base URL for the icon library and related client-side fetches |

The dev server still runs at `http://localhost:4321`. Set `PUBLIC_SITE=http://localhost:4321` explicitly if you need local absolute URLs in the feed, or use another origin for a preview build.

## Content model

Content collections are defined in `src/content/config.ts`.

- `blog`: Markdown posts with `title`, `pubDate`, optional `description`, `updatedDate`, `tags`, `author`, `heroImage`, and `draft`
- `bibleStudies`: Study landing pages and sessions with metadata such as `studySlug`, optional cover image, and optional per-session video/poster fields

Draft blog posts are excluded from the blog index and `src/pages/rss.xml.js`.

### Scheduled publishing

A blog post is public only if `draft` is not `true` **and** `pubDate` is at or before the build time. Posts with a future `pubDate` are left out of the blog index, tag pages, post pages and RSS (all go through `src/lib/blog.ts`). `draft: true` hides a post regardless of its date.

- Use a full timestamp with an offset, e.g. `pubDate: 2026-11-24T08:00:00-08:00`. A date-only value (`2026-11-24`) is parsed as UTC midnight.
- The post appears at the first build after that time. `.github/workflows/scheduled-rebuild.yml` triggers a Netlify build daily at 15:30 UTC (about 07:30 PT), so a post can go live up to ~24 hours late unless you trigger a build sooner (re-run the workflow with *Run workflow*, or trigger a deploy in Netlify).
- The workflow needs the repository secret `NETLIFY_BUILD_HOOK_URL` (a Netlify build hook for `main`). Without it the run fails with an explanatory message and nothing is published automatically.
- A mistyped future date hides a post, so check the date when adding one.

## Project structure

- `src/pages/`: Astro routes for the landing pages, blog, icon library, Bible studies, and static content pages
- `src/content/`: Markdown content for blog posts and Bible studies
- `src/components/`: Shared UI components such as the navbar, footer, and hero graphics
- `public/`: Static assets, screenshots, badges, and exported media

## Deployment

This site is configured for Netlify SSR through `@astrojs/netlify`. Production builds use `npm run build`, and the generated server output is intended to be deployed by Netlify using the repository's `netlify.toml` and `astro.config.mjs` settings.
