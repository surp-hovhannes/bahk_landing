# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

All commands should be run from the root directory:

- `npm run dev` - Start development server at localhost:4321
- `npm run build` - Build production site to ./dist/
- `npm run preview` - Preview build locally before deploying
- `npm run astro` - Access Astro CLI commands

## Project Architecture

This is an Astro-based landing page for the "Fast & Pray" project with integrated blog functionality, deployed on Netlify with server-side rendering.

### Core Technology Stack
- **Framework**: Astro 5.1.4 with server-side rendering
- **Styling**: Tailwind CSS with Figtree font
- **Deployment**: Netlify with serverless functions
- **Content Management**: Astro Content Collections for blog posts

### Project Structure
```
src/
├── components/         # Reusable Astro components
│   ├── Navbar.astro   # Site navigation
│   ├── Footer.astro   # Site footer  
│   ├── Welcome.astro  # Landing page hero section
│   └── HeroGraphic*.astro # Hero graphics (static/dynamic)
├── layouts/
│   └── Layout.astro   # Main page layout with global styles
├── pages/             # File-based routing
│   ├── index.astro    # Homepage
│   ├── blog/          # Blog system with dynamic routing
│   │   ├── index.astro      # Blog listing page
│   │   ├── [...slug].astro  # Dynamic blog post pages
│   │   └── tags/            # Tag-based filtering
│   ├── rss.xml.js     # RSS feed generation
│   └── *.astro|*.md   # Static pages (team, support, about, etc.)
├── content/
│   ├── config.ts      # Content collections schema
│   └── blog/          # Blog post markdown files
└── styles/
    └── global.css     # Global styles
```

### Content Management
- Blog posts are managed through Astro Content Collections
- Posts use markdown with frontmatter schema validation
- Schema includes: title, description, pubDate, tags, author, heroImage, draft status
- RSS feed automatically generated from published posts
- Tag-based categorization and filtering

### Key Configuration
- **Server Output**: Configured for Netlify serverless deployment
- **Site URL**: Uses PUBLIC_SITE environment variable or localhost fallback
- **Tailwind**: Configured with typography and forms plugins
- **TypeScript**: Uses Astro's strict TypeScript configuration

### Development Guidelines
- Follow existing .cursorrules for Astro best practices
- Use Tailwind utility classes (avoid @apply directive)
- Leverage Astro's partial hydration for performance
- Maintain file-based routing conventions
- Use TypeScript for enhanced type safety
- Never use @apply directive in Tailwind CSS

### Deployment
- Production builds deploy to Netlify
- Static assets served from ./dist/
- Serverless functions handled by Netlify adapter
- RSS feed available at /rss.xml