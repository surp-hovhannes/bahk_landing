import { getViteConfig } from 'astro/config';
import { defineConfig, mergeConfig } from 'vitest/config';

export default defineConfig(async (env) =>
  mergeConfig(await getViteConfig({})(env), {
    test: {
      exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
      testTimeout: 90_000,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        reportsDirectory: 'coverage',
        include: ['src/**/*.{astro,js,ts}'],
        exclude: ['src/content/**/*.{gif,jpeg,jpg,png,svg,webp}', 'src/assets/**'],
      },
    },
  }),
);
