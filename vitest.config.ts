/// <reference types="vitest/config" />

import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    testTimeout: 90_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.{astro,js,ts}'],
      exclude: ['src/content/**/*.{gif,jpeg,jpg,png,svg,webp}', 'src/assets/**'],
    },
  },
});
