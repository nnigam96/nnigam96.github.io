import { defineCollection, z } from 'astro:content';

const projectsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    year: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
    // Legacy fields for backward compatibility
    metric_value: z.string().optional(),
    metric_label: z.string().optional(),
    // New metrics system (max 3)
    github_url: z.string().optional(),
    metrics: z.array(
      z.object({
        value: z.string(),
        label: z.string(),
      })
    ).max(3).optional(),
    homepage_metric_index: z.number().min(0).max(2).optional(),
    featured: z.boolean().default(false),
    order: z.number().default(0),
    archived: z.boolean().default(false),
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
    archived: z.boolean().default(false),
  }),
});

export const collections = {
  projects: projectsCollection,
  blog: blogCollection,
};
