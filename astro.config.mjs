// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind()],
  output: 'server',
  adapter: netlify(),
  site: process.env.PUBLIC_SITE || 'http://localhost:4321',
});