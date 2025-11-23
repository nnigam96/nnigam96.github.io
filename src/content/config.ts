import { defineCollection, z } from 'astro:content';

const projectsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    year: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
    metric_value: z.string(),
    metric_label: z.string(),
    featured: z.boolean().default(false),
    order: z.number().default(0),
    highlights: z.array(
      z.object({
        value: z.string().optional(),
        label: z.string().optional(),
        text: z.string().optional(),
      })
    ).optional(),
  }),
});

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    tags: z.array(z.string()),
    readingTime: z.string(),
  }),
});

export const collections = {
  projects: projectsCollection,
  blog: blogCollection,
};
