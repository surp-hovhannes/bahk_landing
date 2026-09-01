import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string().optional(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      tags: z.array(z.string()).default([]),
      author: z.string().optional(),
      heroImage: image().optional(),
      draft: z.boolean().default(false),
    }),
});

const bibleStudies = defineCollection({
  loader: glob({ base: './src/content/bibleStudies', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      studySlug: z.string(),
      coverImage: image().optional(),
      devotionalSetId: z.number().int().optional(),
      fastId: z.number().int().optional(),
      session: z
        .object({
          day: z.number().int(),
          title: z.string(),
          devotionalId: z.number().int().optional(),
          videoUrl: z.string().url().optional(),
          posterUrl: z.string().url().optional(),
        })
        .optional(),
    }),
});

export const collections = { blog, bibleStudies };


