import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const games = defineCollection({
  loader: glob({ pattern: '**/index.mdx', base: './src/content/games' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase hyphen-separated slugs.'),
    excerpt: z.string(),
    category: z.enum(['arcade', 'word', 'logic', 'probability']),
    tags: z.array(z.string()).default([]),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
    minPlayers: z.number().int().min(1),
    maxPlayers: z.number().int().min(1),
    estimatedMinutes: z.number().int().min(1),
    educationalTopics: z.array(z.string()).min(1),
    isPlayable: z.boolean().default(false),
    status: z.enum(['published', 'prototype', 'coming-soon']).default('published'),
    coverImage: image().optional(),
    coverImageAlt: z.string().optional(),
    relatedGameSlugs: z.array(z.string()).default([]),
    seoTitle: z.string(),
    seoDescription: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    playableWidget: z.enum(['rock-paper-scissors']).optional(),
    widgetHydration: z.enum(['visible', 'idle', 'load']).default('visible'),
  }).refine((data) => data.minPlayers <= data.maxPlayers, {
    message: 'minPlayers must be less than or equal to maxPlayers.',
    path: ['minPlayers'],
  }),
});

export const collections = { games };
