import { getCollection, type CollectionEntry } from 'astro:content';

type BlogPost = CollectionEntry<'blog'>;
type PublishableData = Pick<BlogPost['data'], 'draft' | 'pubDate'>;

/**
 * A post is public only when it is not a draft AND its pubDate is at or before `now`.
 * Posts with a future pubDate are "scheduled": they stay hidden until a build runs after that time.
 */
export function isPublished(post: { data: PublishableData }, now: Date = new Date()): boolean {
  return !post.data.draft && post.data.pubDate.valueOf() <= now.valueOf();
}

/** All published blog posts (unsorted), optionally narrowed by an extra filter. */
export async function getPublishedPosts(
  options: { now?: Date; filter?: (post: BlogPost) => boolean } = {},
): Promise<BlogPost[]> {
  const now = options.now ?? new Date();
  return getCollection(
    'blog',
    (post) => isPublished(post, now) && (options.filter ? options.filter(post) : true),
  );
}

/** Published posts, newest first. */
export async function getPublishedPostsSorted(
  options: { now?: Date; filter?: (post: BlogPost) => boolean } = {},
): Promise<BlogPost[]> {
  return (await getPublishedPosts(options)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );
}
