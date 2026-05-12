# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Dev server at http://localhost:4321
npm run build     # Production build to ./dist/
npm run preview   # Preview production build locally
```

There are no tests.

## Architecture

This is the **Fast & Pray landing site** — an Astro SSR site deployed on Netlify. It serves as the public-facing marketing site for the Fast & Pray mobile app and links out to the web app at `https://web.fastandpray.app`.

The backend API lives at `https://api.fastandpray.app` (Django, see `../bahk`). Pages that talk to the API do so **client-side** (CORS is configured on the backend to allow the landing site's origin). The backend API URL defaults to `https://api.fastandpray.app` and can be overridden with the `PUBLIC_API_URL` environment variable.

### Key config

- `output: 'server'` + Netlify adapter — all pages are SSR by default
- Tailwind v3 with `@tailwindcss/typography` and `@tailwindcss/forms`
- Font: Figtree (loaded from Google Fonts in `Layout.astro`)

### Brand colors

Defined as custom Tailwind utilities in `src/styles/global.css`:
- `.bg-color-primary` / navbar background: `#390714`
- `.text-accent` / `.bg-accent`: `#80273e`
- Body text color for most pages: `#3B0714` (used inline, not a utility class)
- CTA gradient: `from-[#B5244A] to-[#E54670]`

### Pages & routing

| Route | File | Notes |
|---|---|---|
| `/` | `src/pages/index.astro` | Home — includes SSR fetch of 5 recent icons from API |
| `/icons` | `src/pages/icons/index.astro` | Icon search — client-side fetches to `PUBLIC_API_URL` |
| `/icons/[id]` | `src/pages/icons/[id].astro` | Icon detail — SSR fetch, 404 redirects to `/icons` |
| `/blog` | `src/pages/blog/index.astro` | Blog index — uses Astro content collections |
| `/blog/[slug]` | `src/pages/blog/[...slug].astro` | Blog post renderer |
| `/blog/tags` | `src/pages/blog/tags/` | Tag index and per-tag listing |
| `/rss.xml` | `src/pages/rss.xml.js` | RSS feed for blog |

Static pages (`/about`, `/team`, `/support`, `/privacy`, `/terms`) are either `.astro` or `.md` files directly in `src/pages/`.

### Blog content

Blog posts live in `src/content/blog/` as Markdown files. The collection schema (in `src/content/config.ts`) requires `title` and `pubDate`; optional fields include `description`, `tags`, `author`, `heroImage`, and `draft`. Posts with `draft: true` are excluded from the index and RSS feed.

### Icon library

The icon search page (`/icons`) calls `GET /api/icons/` with `?search=` (title lookup) or `?tags=` (exact tag match) query params, and paginates at 15 per page. An AI match endpoint (`POST /api/icons/match/`) is wired up but the button is currently hidden. Icon detail pages fetch `GET /api/icons/{id}/` server-side. Tag chips on detail pages link back to `/icons?tags=<tag>`, which the search page reads on load.

### Layout

`src/layouts/Layout.astro` wraps every page. It accepts a `pageTitle` prop (defaults to `'Fast & Pray'`) and has a named `meta` slot for per-page `<head>` additions. The `<main>` element has `max-w-4xl` centering and white rounded-card styling.

The `Navbar.astro` component contains the `redirectToAppStore` logic that detects iOS/Android/desktop and routes the "Download the App" / "Get the App" links accordingly.
