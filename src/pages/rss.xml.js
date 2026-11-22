import rss from '@astrojs/rss';
import { getPublishedPostsSorted } from '../lib/blog';

export async function GET(context) {
  if (!context.site?.href) {
    throw new Error('RSS feed requires `site` to be configured with an absolute URL.');
  }

  const posts = await getPublishedPostsSorted();
  return rss({
    title: 'Fast & Pray Blog',
    description: 'News, reflections, and updates from the Fast & Pray team',
    site: context.site.href,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description ?? '',
      pubDate: post.data.pubDate,
      link: new URL(`/blog/${post.id}/`, context.site).href,
    })),
  });
}

