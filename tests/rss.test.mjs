import { beforeEach, expect, test, vi } from 'vitest';
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { GET } from '../src/pages/rss.xml.js';

vi.mock('astro:content', () => ({
  getCollection: vi.fn(),
}));

vi.mock('@astrojs/rss', () => ({
  default: vi.fn(({ items }) => {
    const xml = items
      .map(
        (item) =>
          `<item><title>${item.title}</title><link>${item.link}</link><description>${item.description}</description></item>`
      )
      .join('');

    return new Response(xml, {
      headers: { 'content-type': 'application/rss+xml' },
    });
  }),
}));

const posts = [
  {
    id: 'older-post',
    data: {
      title: 'Older Post',
      description: 'Older description.',
      pubDate: new Date('2029-01-15'),
      draft: false,
    },
  },
  {
    id: 'draft-post',
    data: {
      title: 'Draft Post',
      description: 'Draft description.',
      pubDate: new Date('2031-01-15'),
      draft: true,
    },
  },
  {
    id: 'latest-post',
    data: {
      title: 'Latest Post',
      description: 'Latest description.',
      pubDate: new Date('2030-01-15'),
      draft: false,
    },
  },
];

beforeEach(() => {
  vi.mocked(getCollection).mockImplementation(async (_collection, filter) =>
    posts.filter((post) => !filter || filter(post))
  );
});

test('RSS feed excludes drafts and emits newest published entries with absolute fields', async () => {
  const response = await GET({ site: new URL('https://example.com') });
  const xml = await response.text();

  const itemTitles = [...xml.matchAll(/<item><title>([^<]+)<\/title>/g)].map((match) => match[1]);

  expect(getCollection).toHaveBeenCalledWith('blog', expect.any(Function));
  expect(itemTitles).toEqual(['Latest Post', 'Older Post']);
  expect(xml).not.toContain('Draft Post');
  expect(xml).toContain('<link>https://example.com/blog/latest-post/</link>');
  expect(xml).toContain('<description>Latest description.</description>');
  expect(rss).toHaveBeenCalledWith(expect.objectContaining({ site: 'https://example.com/' }));
});

test('RSS feed requires an absolute configured site URL', async () => {
  await expect(GET({ site: undefined })).rejects.toThrow(
    'RSS feed requires `site` to be configured with an absolute URL.'
  );
});
