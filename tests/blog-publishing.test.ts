import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getCollection } from 'astro:content';
import { getPublishedPosts, getPublishedPostsSorted, isPublished } from '../src/lib/blog';

vi.mock('astro:content', () => ({
  getCollection: vi.fn(),
}));

const now = new Date('2026-11-24T16:00:00.000Z'); // 08:00 PST

const post = (id: string, pubDate: string, draft = false, tags: string[] = []) =>
  ({ id, data: { title: id, pubDate: new Date(pubDate), draft, tags } }) as any;

describe('isPublished', () => {
  test('past, non-draft post is published', () => {
    expect(isPublished(post('a', '2026-11-23T00:00:00Z'), now)).toBe(true);
  });

  test('pubDate exactly equal to now is published', () => {
    expect(isPublished(post('a', '2026-11-24T08:00:00-08:00'), now)).toBe(true);
  });

  test('future pubDate is hidden, even one millisecond ahead', () => {
    expect(isPublished(post('a', '2026-11-24T16:00:00.001Z'), now)).toBe(false);
    expect(isPublished(post('a', '2027-01-01'), now)).toBe(false);
  });

  test('draft is hidden regardless of date', () => {
    expect(isPublished(post('a', '2020-01-01', true), now)).toBe(false);
    expect(isPublished(post('a', '2030-01-01', true), now)).toBe(false);
  });

  test('date-only front matter (UTC midnight) is published once that UTC day starts', () => {
    expect(isPublished(post('a', '2026-11-24'), now)).toBe(true);
    expect(isPublished(post('a', '2026-11-25'), now)).toBe(false);
  });

  test('defaults now to the current time', () => {
    expect(isPublished(post('a', '2000-01-01'))).toBe(true);
    expect(isPublished(post('a', '2999-01-01'))).toBe(false);
  });
});

describe('getPublishedPosts', () => {
  const posts = [
    post('old', '2026-01-01', false, ['x']),
    post('new', '2026-11-20', false, ['y']),
    post('draft', '2026-01-02', true),
    post('scheduled', '2026-12-01'),
  ];

  beforeEach(() => {
    vi.mocked(getCollection).mockImplementation(async (_c: any, filter: any) =>
      posts.filter((p) => !filter || filter(p)),
    );
  });

  test('excludes drafts and future-dated posts', async () => {
    const ids = (await getPublishedPosts({ now })).map((p) => p.id);
    expect(ids.sort()).toEqual(['new', 'old']);
  });

  test('a scheduled post appears once now passes its pubDate', async () => {
    const later = new Date('2026-12-01T00:00:00Z');
    const ids = (await getPublishedPosts({ now: later })).map((p) => p.id);
    expect(ids).toContain('scheduled');
    expect(ids).not.toContain('draft');
  });

  test('sorted helper returns newest first and honours extra filter', async () => {
    expect((await getPublishedPostsSorted({ now })).map((p) => p.id)).toEqual(['new', 'old']);
    const tagged = await getPublishedPostsSorted({ now, filter: (p) => p.data.tags.includes('x') });
    expect(tagged.map((p) => p.id)).toEqual(['old']);
  });
});
