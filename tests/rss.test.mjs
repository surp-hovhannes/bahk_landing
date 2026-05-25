import test from 'node:test';
import assert from 'node:assert/strict';
import { rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const repoRoot = process.cwd();
const blogDir = path.join(repoRoot, 'src', 'content', 'blog');

function run(command, args) {
  execFileSync(command, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    env: { ...process.env, PUBLIC_SITE: 'https://example.com' },
  });
}

test('RSS feed excludes drafts and emits newest published entries with absolute fields', async () => {
  const publishedFixture = path.join(blogDir, 'rss-test-latest.md');
  const draftFixture = path.join(blogDir, 'rss-test-draft.md');

  writeFileSync(
    publishedFixture,
    `---
title: "RSS Test Latest Post"
description: "Published fixture description."
pubDate: 2030-01-15
tags: ["test"]
draft: false
---

Published fixture body.
`
  );

  writeFileSync(
    draftFixture,
    `---
title: "RSS Test Draft Post"
description: "Draft fixture description."
pubDate: 2031-01-15
tags: ["test"]
draft: true
---

Draft fixture body.
`
  );

  try {
    run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build']);

    const rssModulePath = pathToFileURL(
      path.join(repoRoot, '.netlify', 'build', 'pages', 'rss.xml.astro.mjs')
    ).href;
    const rssModule = await import(`${rssModulePath}?t=${Date.now()}`);
    const response = await rssModule.page().GET({ site: new URL('https://example.com') });
    const xml = await response.text();

    const itemTitles = [...xml.matchAll(/<item><title>([^<]+)<\/title>/g)].map((match) => match[1]);
    assert.equal(itemTitles[0], 'RSS Test Latest Post');
    assert.ok(!xml.includes('RSS Test Draft Post'));
    assert.ok(xml.includes('<link>https://example.com/blog/rss-test-latest/</link>'));
    assert.ok(xml.includes('<description>Published fixture description.</description>'));
  } finally {
    rmSync(publishedFixture, { force: true });
    rmSync(draftFixture, { force: true });
  }
});
