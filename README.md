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
| `PUBLIC_SITE` | `http://localhost:4321` | Canonical site URL used by Astro SSR and RSS generation |
| `PUBLIC_API_URL` | `https://api.fastandpray.app` | Backend API base URL for the icon library and related client-side fetches |

## Content model

Content collections are defined in `src/content/config.ts`.

- `blog`: Markdown posts with `title`, `pubDate`, optional `description`, `updatedDate`, `tags`, `author`, `heroImage`, and `draft`
- `bibleStudies`: Study landing pages and sessions with metadata such as `studySlug`, optional cover image, and optional per-session video/poster fields

Draft blog posts are excluded from the blog index and `src/pages/rss.xml.js`.

## Project structure

- `src/pages/`: Astro routes for the landing pages, blog, icon library, Bible studies, and static content pages
- `src/content/`: Markdown content for blog posts and Bible studies
- `src/components/`: Shared UI components such as the navbar, footer, and hero graphics
- `public/`: Static assets, screenshots, badges, and exported media

## Deployment

This site is configured for Netlify SSR through `@astrojs/netlify`. Production builds use `npm run build`, and the generated server output is intended to be deployed by Netlify using the repository's `netlify.toml` and `astro.config.mjs` settings.
