import { describe, expect, test } from 'vitest';
import { attributionSchema, localize, narekAttribution, prayerCreditReferenceSchema, resolvePrayerCredits, safeSourceUrl, type PrayerCreditReference } from '../src/data/prayerAttributions';

const reference: PrayerCreditReference = {
  attributionId: narekAttribution.id, covers: 'Prayer 1', scope: 'prayer',
  contentLanguage: 'en', editionId: narekAttribution.editionId,
};
describe('explicit prayer source resolution', () => {
  test('standalone and collection references resolve the same edition and deduplicate', () => {
    expect(resolvePrayerCredits([reference, reference])).toHaveLength(1);
    expect(resolvePrayerCredits([{ ...reference, scope: 'collection' }])[0].translators).toEqual(narekAttribution.translators);
    expect(resolvePrayerCredits([reference, { ...reference, covers: 'Prayer 2' }])[0].covers).toBe('Prayer 1; Prayer 2');
    expect(resolvePrayerCredits()).toEqual([]);
    expect(resolvePrayerCredits([{ ...reference, attributionId: 'missing' }])).toEqual([]);
  });
  test('actual text language and edition must match, including text fallback', () => {
    expect(resolvePrayerCredits([{ ...reference, contentLanguage: 'hy' }])).toEqual([]);
    expect(resolvePrayerCredits([{ ...reference, editionId: '2001' }])).toEqual([]);
    expect(resolvePrayerCredits([reference])[0].contentLanguage).toBe('en');
    const armenian = attributionSchema.parse({ id: 'test-hy', workId: 'test', editionId: 'reviewed-hy', contentLanguage: 'hy', covers: 'Test', acknowledgment: { en: 'English credit', hy: 'Հայերեն' } });
    expect(resolvePrayerCredits([{ ...reference, attributionId: 'test-hy', contentLanguage: 'hy', editionId: 'reviewed-hy' }], [armenian])[0].translators).toBeUndefined();
  });
  test('display localization is independent of content language, with English fallback', () => {
    expect(localize({ en: 'Approved English', hy: 'Հայերեն' }, 'hy')).toEqual({ text: 'Հայերեն', language: 'hy' });
    expect(localize({ en: 'Approved English' }, 'hy')).toEqual({ text: 'Approved English', language: 'en' });
  });
  test('partial overrides preserve source fields and mandatory notices; exceptions remain visible', () => {
    const override = { ...reference, covers: 'Prayer 2', overrides: { editors: [{ name: 'Reviewed editor' }] } };
    const credits = resolvePrayerCredits([reference, override]);
    expect(credits).toHaveLength(2);
    expect(credits[1].editors).toEqual([{ name: 'Reviewed editor' }]);
    expect(credits[1].notices).toEqual(narekAttribution.notices);
    expect(credits[1].translators).toEqual(narekAttribution.translators);
    expect(prayerCreditReferenceSchema.safeParse({ ...reference, overrides: { notices: [], contentLanguage: 'hy' } }).success).toBe(false);
  });
  test('optional missing metadata is accepted; empty wording is rejected', () => {
    const minimal = attributionSchema.parse({ id: 'minimal', workId: 'minimal', editionId: 'minimal', covers: 'Minimal', contentLanguage: 'en', acknowledgment: { en: 'Approved' } });
    expect(minimal.notices).toEqual([]);
    expect(minimal.sourceTitle).toBeUndefined();
    expect(attributionSchema.safeParse({ ...minimal, acknowledgment: { en: ' ' } }).success).toBe(false);
  });
});
describe('public source URLs', () => {
  test.each(['javascript:alert(1)', 'data:text/html,test', '//example.org', 'https://user:password@example.org', 'http://localhost', 'http://127.0.0.1', 'http://[::1]', 'https://host.local', 'file:///etc/passwd'])('rejects %s', (url) => expect(safeSourceUrl(url)).toBeUndefined());
  test('permits verified public sources', () => {
    for (const link of narekAttribution.sourceLinks ?? []) expect(safeSourceUrl(link.url)).toBe(link.url);
  });
});
