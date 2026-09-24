import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { INK_NAMES } from './lib/inks';
import { PLAYABLE_WIDGET_OPTIONS } from './lib/playable-games';

const games = defineCollection({
  loader: glob({ pattern: '**/index.mdx', base: './src/content/games' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase hyphen-separated slugs.'),
    /** One-line hook for box lids and listings. */
    excerpt: z.string().max(110),
    /** One or two sentences under the title on the game page. */
    description: z.string(),
    category: z.enum(['arcade', 'word', 'puzzle', 'strategy']),
    ink: z.enum(INK_NAMES),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    minPlayers: z.number().int().min(1),
    maxPlayers: z.number().int().min(1),
    estimatedMinutes: z.number().int().min(1),
    /** The idea underneath the game, as a short noun phrase (e.g. "Constraint propagation"). */
    concept: z.string(),
    /** Thinking skills the game exercises, 2–5 short phrases. */
    skills: z.array(z.string()).min(2).max(5),
    /** "Learn it in a minute": the complete rules as 3–6 short imperative steps. */
    quickRules: z.array(z.string()).min(3).max(6),
    /** Control hints shown beside the board, keyboard and pointer/touch. */
    controls: z.array(z.string()).min(1).max(6),
    widget: z.enum(PLAYABLE_WIDGET_OPTIONS),
    coverImage: image().optional(),
    coverImageAlt: z.string().optional(),
    relatedGameSlugs: z.array(z.string()).default([]),
    seoTitle: z.string(),
    seoDescription: z.string(),
    status: z.enum(['published', 'draft']).default('published'),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
  })
    .refine((data) => data.minPlayers <= data.maxPlayers, {
      message: 'minPlayers must be less than or equal to maxPlayers.',
      path: ['minPlayers'],
    })
    .refine((data) => !data.coverImage || Boolean(data.coverImageAlt?.trim()), {
      message: 'Provide coverImageAlt when coverImage is set.',
      path: ['coverImageAlt'],
    }),
});

export const collections = { games };
