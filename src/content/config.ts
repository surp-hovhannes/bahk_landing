import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
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
  type: 'content',
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
        })
        .optional(),
    }),
});

export const collections = { blog, bibleStudies };


