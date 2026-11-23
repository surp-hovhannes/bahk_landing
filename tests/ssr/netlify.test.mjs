import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { after, test } from 'node:test';

// Import the packaged function, not the intermediate build or Astro dev server.
const { default: handler, config } = await import('../../.netlify/v1/functions/ssr/ssr.mjs');
const origin = 'https://fastandpray.app';
const nativeFetch = globalThis.fetch;
const apiRequests = [];
globalThis.fetch = async (input, options) => {
  const url = new URL(input instanceof Request ? input.url : input);
  apiRequests.push(url.href);
  assert.equal(options?.method ?? (input instanceof Request ? input.method : 'GET'), 'GET');
  if (url.origin === 'https://api.fastandpray.app') {
    if (url.pathname === '/api/icons/101/') {
      return Response.json({ id: 101, title: 'Nativity & light', image: '/favicon.svg', tag_list: ['Nativity'] });
    }
    if (url.pathname === '/api/icons/999/') return new Response(null, { status: 404 });
    if (url.pathname === '/api/readings/') {
      return Response.json({ date: url.searchParams.get('date'), readings: [{
        id: 1, book: 'John', startChapter: 1, startVerse: 1,
        endChapter: 1, endVerse: 5, citation: 'John 1:1–5',
        text: 'In the beginning was the Word.', textVersion: 'KJV',
      }] });
    }
  }
  if (url.origin === 'https://lectionary.andylitalo.com' && url.pathname === '/readings') {
    return Response.json({ Readings: { Gospel: ['John 1:1–5'] }, ReadingsList: ['John 1:1–5'],
      ReadingsRefs: [{ book: 'John', start_chapter: 1, start_verse: 1, end_chapter: 1, end_verse: 5, citation: 'John 1:1–5' }] });
  }
  throw new Error(`Unexpected outbound request in isolated SSR test: ${url}`);
};
after(() => { globalThis.fetch = nativeFetch; });

const request = path => handler(new Request(new URL(path, origin)), { ip: '127.0.0.1' });

test('packaged Netlify handler renders pages, content collections, and source links', async () => {
  assert.equal(config.path, '/*');
  assert.equal(config.preferStatic, true);
  for (const [path, text] of [
    ['/', 'Download the App'],
    ['/prayer-attributions/', 'Thomas J. Samuelian'],
    ['/bible-studies/', 'Guided Bible Studies'],
    ['/bible-studies/fast-of-elijah/', 'Sessions'],
    ['/bible-studies/fast-of-elijah/1/', 'The Spirit of Communion and Love'],
    ['/readings/', 'Daily Bible Readings'],
  ]) {
    const response = await request(path);
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get('content-type'), /text\/html/);
    const html = await response.text();
    assert.ok(html.includes(text), `${path}: missing expected rendered content`);
    if (path === '/prayer-attributions/') {
      assert.ok(html.includes('id="narek-samuelian-2021"'));
      assert.ok(html.includes('https://www.arak29.org/stgregoryofnarek/about.php'));
    }
    // The generated server must refer to assets that actually ship in dist.
    const styles = [...html.matchAll(/href="(\/_astro\/[^"?]+\.css)"/g)];
    assert.ok(styles.length > 0, path);
    for (const [, stylesheet] of styles) {
      assert.ok((await readFile(new URL('../../dist' + stylesheet, import.meta.url))).length > 0);
    }
  }
});

test('SSR icon fetch renders an image and handles API 404 redirects', async () => {
  const response = await request('/icons/101/');
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(html.includes('Nativity &amp; light'));
  assert.ok(html.includes('src="/favicon.svg"'));
  const missing = await request('/icons/999/');
  assert.equal(missing.status, 302);
  assert.equal(missing.headers.get('location'), '/icons');
});

test('Daily Readings SSR merges both services and rejects invalid dates', async () => {
  const response = await request('/readings/2026-11-23/');
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(html.includes('In the beginning was the Word.'));
  assert.ok(html.includes('Gospel'));
  assert.ok(apiRequests.some(url => url.includes('lectionary.andylitalo.com/readings?date=2026-11-23')));
  assert.ok(apiRequests.some(url => url.includes('api.fastandpray.app/api/readings/?date=2026-11-23')));
  const invalid = await request('/readings/invalid/');
  assert.equal(invalid.status, 400);
  assert.ok((await invalid.text()).includes('Invalid date'));
});

test('RSS from the packaged server contains canonical links and excludes drafts', async () => {
  const response = await request('/rss.xml');
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /xml/);
  const xml = await response.text();
  assert.ok(xml.includes('<link>https://fastandpray.app/blog/welcome/</link>'));
  const index = await request('/blog/');
  assert.equal(index.status, 200);
  const html = await index.text();
  for (const filename of await readdir(new URL('../../src/content/blog/', import.meta.url))) {
    if (!filename.endsWith('.md')) continue;
    const markdown = await readFile(new URL('../../src/content/blog/' + filename, import.meta.url), 'utf8');
    if (!/^draft:\s*true\s*$/m.test(markdown)) continue;
    const slug = filename.slice(0, -3);
    assert.ok(!xml.includes(`/blog/${slug}/`), `RSS includes draft ${slug}`);
    assert.ok(!html.includes(`/blog/${slug}/`), `blog index includes draft ${slug}`);
    const hidden = await request(`/blog/${slug}/`);
    assert.equal(hidden.status, 404, `draft ${slug}`);
  }
});

test('prerendered blog and public SVG ship alongside the SSR function', async () => {
  const html = await readFile(new URL('../../dist/blog/welcome/index.html', import.meta.url), 'utf8');
  assert.ok(html.includes('Welcome to the Fast &amp; Pray Blog'));
  assert.ok(html.includes('Stay tuned—more posts coming soon.'));
  assert.match(await readFile(new URL('../../dist/favicon.svg', import.meta.url), 'utf8'), /<svg/);
});

test('unknown routes return 404 from the generated function', async () => {
  assert.equal((await request('/missing-maintenance-smoke-route/')).status, 404);
});
