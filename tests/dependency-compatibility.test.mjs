import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

const require = createRequire(import.meta.url);
const typography = require('@tailwindcss/typography/src/utils.js');

describe('typography selector parser compatibility', () => {
  test.each([
    ['p::before', ['::before', 'p']],
    ['p::before, li::before', ['::before', 'p, li']],
    ['.article:hover > p::before, .article > li::before', ['::before', '.article:hover > p, .article > li']],
    ['a:hover::after, a:focus::after', ['::after', 'a:hover, a:focus']],
    [':is(h1,h2) > a[href^="https:"]::after', ['::after', ':is(h1,h2) > a[href^="https:"]']],
    ['.article :not(:where([class~="not-prose"],[class~="not-prose"] *))::before', ['::before', '.article :not(:where([class~="not-prose"],[class~="not-prose"] *))']],
    ['.foo\\:bar > p::before', ['::before', '.foo\\:bar > p']],
    ['p::before, p::after', [null, 'p::before, p::after']],
  ])('preserves pseudo-element extraction for %s', (selector, expected) => {
    expect(typography.commonTrailingPseudos(selector)).toEqual(expected);
  });

  test('handles a long flat selector within a bounded worker', () => {
    // Exercise the advisory's quadratic case without risking a hung test runner.
    const result = execFileSync(process.execPath, ['--input-type=module', '-e', `
      import { createRequire } from 'node:module';
      const require = createRequire(${JSON.stringify(import.meta.url)});
      const typography = require('@tailwindcss/typography/src/utils.js');
      const selector = '.a'.repeat(100_000);
      const [pseudo, rest] = typography.commonTrailingPseudos(selector + '::before');
      if (pseudo !== '::before' || rest !== selector) process.exit(1);
      process.stdout.write('ok');
    `], { timeout: 5_000, encoding: 'utf8' });
    expect(result).toBe('ok');
  });
});

// Resolve through the adapter's real dependency chain, including any nested copies.
const adapterRequire = createRequire(require.resolve('@astrojs/netlify'));
const pluginRequire = createRequire(adapterRequire.resolve('@netlify/vite-plugin'));
const devRequire = createRequire(pluginRequire.resolve('@netlify/dev'));
const imagesPath = devRequire.resolve('@netlify/images');
const { ImageHandler } = await import(pathToFileURL(imagesPath).href);
const imagesRequire = createRequire(imagesPath);
const ipxRequire = createRequire(imagesRequire.resolve('ipx'));
const { default: sharp } = await import(pathToFileURL(ipxRequire.resolve('sharp')).href);

describe('Netlify image emulation with its resolved Sharp', () => {
  let server;
  let origin;
  const images = new Map();
  const handler = new ImageHandler({ logger: { warn() {} } });

  beforeAll(async () => {
    const pixels = Buffer.alloc(32 * 20 * 4);
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 32; x++) {
        const offset = (y * 32 + x) * 4;
        pixels.set([x * 8, y * 12, (x * 17 + y * 23) % 256, 255], offset);
      }
    }
    for (const format of ['png', 'jpeg', 'webp', 'avif', 'gif']) {
      const data = await sharp(pixels, { raw: { width: 32, height: 20, channels: 4 } })
        .toFormat(format).toBuffer();
      images.set('/fixture.' + format, { data, type: 'image/' + format });
    }
    images.set('/fixture.svg', {
      data: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="20"><rect width="16" height="20" fill="#80273e"/></svg>'),
      type: 'image/svg+xml',
    });
    server = createServer((request, response) => {
      const image = images.get(request.url);
      if (!image) { response.writeHead(404).end(); return; }
      response.writeHead(200, { 'content-type': image.type });
      response.end(image.data);
    });
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    origin = `http://127.0.0.1:${server.address().port}`;
  });

  afterAll(async () => {
    if (!server) return;
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  });

  async function transform(parameters, options) {
    const request = new Request(origin + '/.netlify/images?' + new URLSearchParams(parameters), options);
    return handler.match(request).handle(origin);
  }

  test('resolves the reviewed patched Sharp through the adapter dependency chain', () => {
    expect(sharp.versions.sharp).toBe('0.35.5');
  });

  test.each(['png', 'jpeg', 'webp', 'avif', 'gif', 'svg'])('decodes %s and resizes through the Netlify handler', async format => {
    const response = await transform({ url: '/fixture.' + format, w: '8', h: '8', fit: 'contain', fm: 'webp' });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/webp');
    const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata();
    expect(metadata).toMatchObject({ width: 8, height: 5, format: 'webp' });
  });

  test.each([
    [{ width: '12' }, { width: 12, height: 8 }],
    [{ height: '6' }, { width: 10, height: 6 }],
    [{ w: '12', h: '12', fit: 'cover', position: 'top' }, { width: 12, height: 12 }],
    [{ w: '12', h: '12', fit: 'contain' }, { width: 12, height: 8 }],
    [{ w: '120' }, { width: 32, height: 20 }],
  ])('preserves sizing behavior for %j', async (parameters, dimensions) => {
    const response = await transform({ url: '/fixture.png', fm: 'png', ...parameters });
    expect(response.status).toBe(200);
    const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata();
    expect(metadata).toMatchObject({ ...dimensions, format: 'png' });
  });

  test.each([
    ['png', 'png'], ['jpg', 'jpeg'], ['webp', 'webp'], ['avif', 'heif'],
  ])('encodes %s with quality controls', async (format, decodedFormat) => {
    const response = await transform({ url: '/fixture.png', w: '12', fm: format, quality: '80' });
    expect(response.status).toBe(200);
    const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata();
    expect(metadata).toMatchObject({ width: 12, height: 8, format: decodedFormat });
  });

  test('preserves SVG color and transparency when rasterizing', async () => {
    const response = await transform({ url: '/fixture.svg', fm: 'png' });
    expect(response.status).toBe(200);
    const { data, info } = await sharp(Buffer.from(await response.arrayBuffer()))
      .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const pixel = x => Array.from(data.subarray((10 * info.width + x) * 4, (10 * info.width + x) * 4 + 4));
    expect(pixel(8)).toEqual([128, 39, 62, 255]);
    expect(pixel(24)[3]).toBe(0);
  });

  test('applies crop position to image pixels', async () => {
    async function firstRed(position) {
      const response = await transform({ url: '/fixture.png', fm: 'png', w: '8', h: '8', fit: 'cover', position });
      expect(response.status).toBe(200);
      return (await sharp(Buffer.from(await response.arrayBuffer())).raw().toBuffer())[0];
    }
    expect(await firstRed('left')).toBeLessThan(await firstRed('right'));
  });

  test('applies WebP quality rather than ignoring the query parameter', async () => {
    async function encoded(quality) {
      const response = await transform({ url: '/fixture.png', fm: 'webp', quality });
      expect(response.status).toBe(200);
      return Buffer.from(await response.arrayBuffer());
    }
    const low = await encoded('20');
    const high = await encoded('90');
    expect(high.equals(low)).toBe(false);
    expect(high.length).toBeGreaterThan(low.length);
  });

  test('preserves image endpoint request restrictions', async () => {
    expect((await transform({ url: 'https://example.invalid/untrusted.svg' })).status).toBe(403);
    expect((await transform({})).status).toBe(400);
    expect((await transform({ url: '/fixture.png' }, { method: 'POST' })).status).toBe(405);
  });
});
