/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, test } from 'vitest';
import SourceCredit from '../src/components/SourceCredit.astro';
import { sourceCreditSchema } from '../src/data/sourceCredits';

test('server rendering escapes text, removes unsafe URLs, and omits missing fields', async () => {
  const container = await AstroContainer.create();
  const credit = sourceCreditSchema.parse({
    covers: 'Fixture', contentLanguage: 'hy',
    acknowledgment: { en: '<script>alert(1)</script>', hy: 'Հայերեն' },
    sourceLinks: [{ label: 'Unsafe', url: 'javascript:alert(1)' }, { label: '<img src=x onerror=alert(1)>', url: 'https://example.org/' }],
  });
  const english = await container.renderToString(SourceCredit, { props: { credit, full: true } });
  expect(english).toContain('&lt;script&gt;');
  expect(english).not.toContain('<script>');
  expect(english).not.toContain('javascript:');
  expect(english).not.toContain('Unsafe');
  expect(english).toContain('&lt;img');
  expect(english).not.toContain('Original author');
  expect(english).not.toContain('Translator(s)');
  expect(english).not.toContain('Edition');
  expect(english).toContain('Armenian');
  const armenian = await container.renderToString(SourceCredit, { props: { credit, displayLanguage: 'hy' } });
  expect(armenian).toContain('lang="hy"');
  expect(armenian).toContain('Հայերեն');
  const fallback = await container.renderToString(SourceCredit, { props: { credit: { ...credit, acknowledgment: { en: 'Approved English' } }, displayLanguage: 'hy' } });
  expect(fallback).toContain('lang="en"');
  expect(fallback).toContain('Approved English');
  expect(armenian).not.toContain('Full source and acknowledgment');
  const linked = await container.renderToString(SourceCredit, { props: { credit, detailsHref: '/sources/#fixture' } });
  expect(linked).toContain('href="/sources/#fixture"');
  const unsafe = await container.renderToString(SourceCredit, { props: { credit, detailsHref: 'javascript:alert(1)' } });
  expect(unsafe).not.toContain('javascript:');
});


test('details links reject disguised external paths', async () => {
  const container = await AstroContainer.create();
  const credit = sourceCreditSchema.parse({ covers: 'A book', contentLanguage: 'en', acknowledgment: { en: 'Approved' } });
  for (const detailsHref of ['/\t/127.0.0.1', '/\n/example.org', '//example.org', '/\\example.org']) {
    const html = await container.renderToString(SourceCredit, { props: { credit, detailsHref } });
    expect(html).not.toContain('Full source and acknowledgment');
  }
});
