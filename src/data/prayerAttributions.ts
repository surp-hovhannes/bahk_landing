import { z } from 'astro:content';
import type { infer as Infer } from 'astro/zod';

import { creditFields, sourceCreditSchema } from './sourceCredits';

const text = z.string().trim().min(1);

export const attributionSchema = sourceCreditSchema.extend({
  id: text.regex(/^[a-z0-9-]+$/),
  workId: text,
  editionId: text,
});
export const prayerCreditReferenceSchema = z.object({
  attributionId: text,
  covers: text,
  scope: z.enum(['prayer', 'collection']),
  // These describe the rendered text, including any language fallback.
  contentLanguage: text,
  editionId: text,
  overrides: creditFields.partial().strict().optional(),
});
export type Attribution = Infer<typeof attributionSchema>;
export type PrayerCreditReference = Infer<typeof prayerCreditReferenceSchema>;

export const narekAttribution = attributionSchema.parse({
  id: 'narek-samuelian-2021',
  workId: 'narek',
  editionId: 'samuelian-2021-revised',
  covers: 'English prayers from the 2021 revised edition of the Book of Prayer',
  contentLanguage: 'en',
  author: 'St. Gregory of Narek',
  translators: [{ name: 'Thomas J. Samuelian', role: 'English translation' }],
  editors: [{ name: 'Diana Der Hovanessian', role: 'Poetic editing' }],
  sourceTitle: 'Book of Prayer / Book of Lamentations',
  edition: '2021 revised edition',
  year: 2021,
  sourceLinks: [
    { label: "arak29.org — Translator’s colophon", url: 'https://www.arak29.org/stgregoryofnarek/about.php' },
    { label: 'arak29.org — Introduction and revised-edition notes', url: 'https://www.arak29.org/stgregoryofnarek/intro.php' },
  ],
  acknowledgment: { en: 'We gratefully acknowledge Thomas J. Samuelian for his English translation of St. Gregory of Narek’s Book of Prayer, with poetic editing by Diana Der Hovanessian.' },
  notices: [{ en: 'English translation used by permission. This acknowledgment applies to text sourced from the 2021 revised edition.' }],
});
export const prayerAttributions: readonly Attribution[] = [narekAttribution];

/** Resolve explicit edition references, never collection membership. */
export function resolvePrayerCredits(
  references: readonly PrayerCreditReference[] = [],
  registry: readonly Attribution[] = prayerAttributions,
): Attribution[] {
  const result: Attribution[] = [];
  const seen = new Map<string, number>();
  for (const reference of references) {
    const source = registry.find((entry) => entry.id === reference.attributionId);
    if (!source || source.contentLanguage !== reference.contentLanguage || source.editionId !== reference.editionId) continue;
    const credit = attributionSchema.parse({ ...source, ...reference.overrides, notices: source.notices });
    // Same edition and same wording render once; distinct overrides remain explicit.
    const key = JSON.stringify(credit);
    const existing = seen.get(key);
    if (existing !== undefined) {
      const labels = result[existing].covers.split('; ');
      if (!labels.includes(reference.covers)) result[existing].covers += `; ${reference.covers}`;
      continue;
    }
    seen.set(key, result.length);
    result.push({ ...credit, covers: reference.covers });
  }
  return result;
}
