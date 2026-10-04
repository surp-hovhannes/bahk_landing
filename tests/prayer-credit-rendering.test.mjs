/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, test } from 'vitest';
import PrayerCredit from '../src/components/PrayerCredit.astro';
import PrayerCredits from '../src/components/PrayerCredits.astro';
import { attributionSchema } from '../src/data/prayerAttributions';

test('server rendering escapes text, removes unsafe URLs, and omits missing fields', async () => {
  const container = await AstroContainer.create();
  const credit = attributionSchema.parse({
    id: 'fixture', workId: 'fixture', editionId: 'fixture', covers: 'Fixture', contentLanguage: 'hy',
    acknowledgment: { en: '<script>alert(1)</script>', hy: 'Հայերեն' },
    sourceLinks: [{ label: 'Unsafe', url: 'javascript:alert(1)' }, { label: '<img src=x onerror=alert(1)>', url: 'https://example.org/' }],
  });
  const english = await container.renderToString(PrayerCredit, { props: { credit, full: true } });
  expect(english).toContain('&lt;script&gt;');
  expect(english).not.toContain('<script>');
  expect(english).not.toContain('javascript:');
  expect(english).not.toContain('Unsafe');
  expect(english).toContain('&lt;img');
  expect(english).not.toContain('Original author');
  expect(english).not.toContain('Translator(s)');
  expect(english).not.toContain('Edition');
  expect(english).toContain('Armenian');
  const armenian = await container.renderToString(PrayerCredit, { props: { credit, displayLanguage: 'hy' } });
  expect(armenian).toContain('lang="hy"');
  expect(armenian).toContain('Հայերեն');
  const fallback = await container.renderToString(PrayerCredit, { props: { credit: { ...credit, acknowledgment: { en: 'Approved English' } }, displayLanguage: 'hy' } });
  expect(fallback).toContain('lang="en"');
  expect(fallback).toContain('Approved English');
  const empty = await container.renderToString(PrayerCredits, { props: { references: [] } });
  expect(empty).not.toContain('<aside');
});
