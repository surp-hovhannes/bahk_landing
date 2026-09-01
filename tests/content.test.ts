import { describe, expect, test } from 'vitest';
import { getCollection } from 'astro:content';

describe('content collections', () => {
  test('blog entries have unique ids and publishable metadata', async () => {
    const posts = await getCollection('blog');
    const ids = posts.map((post) => post.id);

    expect(new Set(ids).size).toBe(ids.length);

    for (const post of posts) {
      expect(post.data.title.trim(), post.id).not.toBe('');
      expect(post.data.pubDate, post.id).toBeInstanceOf(Date);

      if (!post.data.draft) {
        expect(post.data.description?.trim(), post.id).toBeTruthy();
        expect(post.data.tags.length, post.id).toBeGreaterThan(0);
      }
    }
  });

  test('Bible studies have one overview and contiguous session days', async () => {
    const entries = await getCollection('bibleStudies');
    const studies = new Map<string, typeof entries>();

    for (const entry of entries) {
      const studyEntries = studies.get(entry.data.studySlug) ?? [];
      studyEntries.push(entry);
      studies.set(entry.data.studySlug, studyEntries);
    }

    for (const [studySlug, studyEntries] of studies) {
      const overviewEntries = studyEntries.filter((entry) => !entry.data.session);
      const sessionEntries = studyEntries.filter((entry) => entry.data.session);

      expect(overviewEntries.length, studySlug).toBe(1);
      expect(sessionEntries.length, studySlug).toBeGreaterThan(0);

      const days = sessionEntries
        .map((entry) => entry.data.session?.day)
        .filter((day): day is number => typeof day === 'number')
        .sort((a, b) => a - b);

      expect(new Set(days).size, studySlug).toBe(days.length);
      expect(days, studySlug).toEqual(Array.from({ length: days.length }, (_, index) => index + 1));

      for (const entry of studyEntries) {
        expect(entry.data.title.trim(), entry.id).not.toBe('');
        expect(entry.data.description.trim(), entry.id).not.toBe('');

        if (entry.data.session) {
          expect(entry.data.session.title.trim(), entry.id).not.toBe('');
        }
      }
    }
  });
});
