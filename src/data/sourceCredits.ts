import { z } from 'astro:content';
import type { infer as Infer } from 'astro/zod';

const text = z.string().trim().min(1);
const localizedText = z.object({ en: text, hy: text.optional() });
const person = z.object({ name: text, role: text.optional() });
const link = z.object({ label: text, url: text });
export const creditFields = z.object({
  acknowledgment: localizedText,
  author: text.optional(),
  translators: z.array(person).optional(),
  editors: z.array(person).optional(),
  sourceTitle: text.optional(),
  sourceLinks: z.array(link).optional(),
});

export const sourceCreditSchema = creditFields.extend({
  covers: text,
  contentLanguage: text,
  edition: text.optional(),
  year: z.number().int().optional(),
  notices: z.array(localizedText).default([]),
});
export type SourceCreditData = Infer<typeof sourceCreditSchema>;
export type DisplayLanguage = 'en' | 'hy';

export function localize(value: { en: string; hy?: string }, language: DisplayLanguage) {
  return { text: value[language] || value.en, language: value[language] ? language : 'en' };
}

/** Public web sources only: no credentials, local URLs, or executable schemes. */
export function safeSourceUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return;
    const host = url.hostname.toLowerCase().replace(/\.$/, '');
    if (!host.includes('.') || host.endsWith('.local') || host.endsWith('.localhost') || host.endsWith('.internal') || host.endsWith('.test') || host.endsWith('.invalid') ||
        host.includes(':') || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return;
    return url.href;
  } catch { return; }
}

