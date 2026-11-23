import { execFileSync } from 'node:child_process';
import { expect, test } from 'vitest';

function productionSite(publicSite) {
  const env = { ...process.env, NODE_ENV: 'production' };
  delete env.PUBLIC_SITE;
  if (publicSite !== undefined) env.PUBLIC_SITE = publicSite;

  // Import the real config in a fresh process so inherited env and module caches
  // cannot hide a broken production default.
  return execFileSync(process.execPath, ['--input-type=module', '-e', `
    import config from ${JSON.stringify(new URL('../astro.config.mjs', import.meta.url).href)};
    process.stdout.write(config.site);
  `], { env, encoding: 'utf8', timeout: 10_000 });
}

test.each([undefined, ''])('defaults to the canonical production site with PUBLIC_SITE=%j', (publicSite) => {
  expect(productionSite(publicSite)).toBe('https://fastandpray.app');
});

test.each(['http://localhost:4321', 'https://preview.example.com'])(
  'preserves an explicit PUBLIC_SITE override: %s',
  (site) => {
    expect(productionSite(site)).toBe(site);
  },
);
