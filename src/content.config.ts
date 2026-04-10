import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const games = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/games' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    excerpt: z.string(),
    cover: image().optional(),
    coverAlt: z.string().optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
    tags: z.array(z.string()).default([]),
    relatedConcepts: z.array(z.string()).default([]),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    widget: z.enum(['rock-paper-scissors']).optional(),
    widgetHydration: z.enum(['visible', 'idle', 'load']).default('visible'),
  }),
});

export const collections = { games };
