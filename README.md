# Arkedia

Arkedia is a static-first educational games site built with Astro. Each game page is treated as a learning resource first: the rules, examples, strategies, and related concepts live in typed MDX content, while React is reserved for page-scoped playable widgets only where interaction adds real value.

## v1 scope

Arkedia v1 includes:

- a static Astro site shell with reusable layouts and UI components
- a typed `games` content collection powered by MDX
- dynamic game detail pages generated from content entries
- optimized local cover images through Astro assets
- related-game editorial links
- playable React islands for Snake, Rock Paper Scissors, and a Wordle-style mini game
- scaffold placeholders for future Sudoku and Crossword widgets

Intentionally deferred to v2:

- backend features
- accounts, persistence, or leaderboards
- CMS integration
- site-wide SPA behavior
- heavier browse tooling beyond the current static-first experience
- full playable implementations for every game

## Stack

- Astro
- TypeScript
- Tailwind CSS 4
- MDX
- React for islands only

## Run locally

```sh
npm install
npm run dev
```

Open the local URL shown by Astro in your terminal.

## Build for production

```sh
npm run build
npm run preview
```

If you want canonical URLs and share metadata to use the production domain, provide `SITE_URL` before building:

```sh
SITE_URL=https://example.com npm run build
```

## Project structure

```text
/
├── public/
│   ├── favicon.ico
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── content/
│   │   ├── islands/
│   │   ├── layout/
│   │   └── ui/
│   ├── content/
│   │   └── games/
│   │       └── <slug>/
│   │           ├── cover.svg
│   │           └── index.mdx
│   ├── data/
│   ├── layouts/
│   ├── lib/
│   ├── pages/
│   └── styles/
├── astro.config.mjs
├── package.json
└── src/content.config.ts
```

## Content model

Game content lives in the `games` collection under `src/content/games/`. Each game gets its own folder so local assets can stay next to the MDX entry.

Example:

```text
src/content/games/snake/
├── cover.svg
└── index.mdx
```

The collection schema validates fields such as:

- `title`
- `slug`
- `excerpt`
- `category`
- `tags`
- `difficulty`
- `minPlayers`
- `maxPlayers`
- `estimatedMinutes`
- `educationalTopics`
- `isPlayable`
- `status`
- `coverImage`
- `coverImageAlt`
- `relatedGameSlugs`
- `seoTitle`
- `seoDescription`
- `description`
- `publishedAt`
- `updatedAt`
- `playableWidget`
- `widgetHydration`

## How to add a new game

1. Create a folder in `src/content/games/` using a lowercase, hyphen-separated slug.
2. Add an `index.mdx` file with the required frontmatter.
3. Add an optional local cover image such as `cover.svg` beside the entry.
4. Write the educational body content in MDX.
5. Add `relatedGameSlugs` so the page can suggest useful next reads.
6. Run `npm run build` to validate the schema and generate the route.

Minimal example:

```mdx
---
title: Example Game
slug: example-game
excerpt: A short summary for cards and listings.
category: logic
tags:
  - reasoning
difficulty: beginner
minPlayers: 1
maxPlayers: 1
estimatedMinutes: 10
educationalTopics:
  - pattern recognition
isPlayable: false
status: published
seoTitle: Example Game guide
seoDescription: Learn how Example Game works and why it is educational.
description: A longer sentence for the page hero.
publishedAt: 2026-04-10
relatedGameSlugs: []
---

## How the game works

Write the guide here.
```

## How to attach a playable widget

Playable widgets are intentionally isolated from the rest of the site shell.

1. Create the React island in `src/components/islands/`.
2. Add any small logic helpers in `src/lib/playable/` if needed.
3. Register the widget key and metadata in `src/lib/playable-games.ts`.
4. Extend the widget mapping in `src/components/content/InteractiveWidget.astro`.
5. Set `isPlayable: true` and `playableWidget: <key>` in the game entry frontmatter.
6. Choose the lightest useful hydration mode, usually `visible`.

## Architecture notes

- Astro handles routing, layout, metadata, and static rendering by default.
- MDX is the source of truth for long-form educational content.
- React is limited to interactive islands inside game pages.
- Local cover images live in `src/content/` so Astro can optimize them.
- Page metadata flows through the shared layout and supports canonical URLs when `SITE_URL` is configured.
- The games index stays static-first and uses collection metadata for browse cues instead of a heavy search UI.

## v1 checklist

- Static Astro site shell
- Typed content collection for games
- MDX-authored educational game pages
- Dynamic routes generated from content
- Optimized local cover images
- Related games
- Playable islands for selected games
- Shared SEO and accessibility foundations

## Suggested v2 next steps

- Add more game entries and richer editorial examples
- Replace the Sudoku and Crossword scaffolds with focused playable widgets
- Add progressive browse enhancements such as lightweight filtering
- Configure the production domain through `SITE_URL`
- Add an official sitemap integration once the final public domain is fixed
