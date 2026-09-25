# Arkedia

Arkedia is a shelf of fourteen classic games you can learn and play on the same page: Snake, Rock Paper Scissors, a Wordle-style word game, Sudoku, a mini crossword, Tic-Tac-Toe, Connect Four, Minesweeper, 2048, Mastermind, Nim, Tower of Hanoi, Memory and Lights Out.

Every game page is an opened box. The board sits beside a rule sheet with the complete rules in a few numbered steps, the controls, and the player's own record. Below it is a guide: the full rules, a worked example, strategy, and the idea underneath the game (search, probability, constraint reasoning, recursion and so on).

It is a static site. There is no backend, no accounts and no tracking; a player's record is kept in their own browser. See [PRODUCT.md](PRODUCT.md) for the audience, voice and principles.

## Stack

- [Astro](https://astro.build) 6, static output
- MDX content collections with typed frontmatter
- Tailwind CSS 4
- React 19, only for the game boards (one island per game page)

## Run it

Node must satisfy the `engines` range in `package.json`.

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # static site in dist/
npm run preview   # serve the build
```

Set `SITE_URL` when building for production so canonical and social URLs are absolute:

```sh
SITE_URL=https://example.com npm run build
```

## Project structure

```text
src/
├── components/
│   ├── content/InteractiveWidget.astro  # maps a widget key to its React island
│   ├── islands/                         # one React board per game, plus kit/
│   │   └── kit/                         # GameFrame, Button, Segmented, useProgress…
│   ├── layout/                          # SiteHead, SiteHeader, SiteFooter, Container
│   └── ui/                              # BoxLid, ShelfTile, RecordPanel, Callout, Mark
├── content/games/<slug>/                # index.mdx + cover.svg per game
├── content.config.ts                    # the games collection schema
├── data/site.ts                         # site name, description, navigation
├── layouts/MainLayout.astro
├── lib/
│   ├── games.ts                         # collection queries and formatting
│   ├── inks.ts                          # the twelve process inks and inkStyle()
│   ├── playable-games.ts                # widget keys accepted by the schema
│   ├── playable/                        # framework-free game logic
│   ├── progress.ts                      # per-device record in localStorage
│   └── record-format.ts                 # words for stamps and "Your record"
├── pages/
│   ├── index.astro                      # the shelf
│   ├── games/index.astro                # library with filters
│   ├── games/[slug].astro               # a game page
│   ├── about.astro
│   └── 404.astro
└── styles/global.css                    # tokens, browser surfaces, guide prose
```

## Content model

Each game is a folder in `src/content/games/` holding `index.mdx` and `cover.svg`. The schema in `src/content.config.ts` validates:

| Field | What it is for |
| --- | --- |
| `title`, `slug` | Name and URL (`/games/<slug>/`). Quote numeric slugs: `slug: "2048"`. |
| `excerpt` | One-line hook (max 110 characters) for listings. |
| `description` | One or two sentences under the title on the game page. |
| `category` | `arcade`, `word`, `puzzle` or `strategy`. |
| `ink` | The game's process ink, one of the names in `src/lib/inks.ts`. |
| `difficulty` | `beginner`, `intermediate` or `advanced`. |
| `minPlayers`, `maxPlayers` | Player range. `maxPlayers >= 2` marks the game as two-player capable in the library filter. |
| `estimatedMinutes` | Typical round length. |
| `concept` | The idea underneath, as a short noun phrase. Listed in the home page concept index. |
| `skills` | 2–5 thinking skills the game trains. |
| `quickRules` | 3–6 short imperative steps that are the complete rules. Shown numbered beside the board. |
| `controls` | 1–6 lines covering keyboard and pointer/touch. `Lead: text` renders the lead in bold. |
| `widget` | Key of the React board, from `src/lib/playable-games.ts`. |
| `coverImage`, `coverImageAlt` | `./cover.svg` and its description (alt is required when a cover is set). |
| `relatedGameSlugs` | Games offered under "Play next". |
| `seoTitle`, `seoDescription` | Page title and meta description. |
| `status` | `published` (default) or `draft`. Drafts get no route and no lid. |
| `publishedAt`, `updatedAt` | Dates. |

The MDX body is the guide. Use this order: one or two intro paragraphs, `## How to play`, `## A worked example`, `## Strategy` (with `###` steps from beginner to advanced), `## The idea underneath`, optionally `## Common mistakes`, and one `<Callout title="Try this">` challenge. Level-two headings become the "On this page" list, and a heading containing "The idea underneath" is linked from the Concept fact in the title band.

## Adding a game

1. **Content.** Create `src/content/games/<slug>/index.mdx` with the frontmatter above and the guide body. Import the callout with `import Callout from '../../../components/ui/Callout.astro';`.
2. **Cover.** Draw `cover.svg` as the box-lid motif: `viewBox="0 0 400 300"`, a `<title>`, transparent background, no text, gradients, filters or shadows. Use only `#f2eee5`, `#1d1c1a` and `#fbf9f4`, strokes at least 4 units, and keep the drawing in the upper three quarters (the title is set along the bottom in HTML over the game's ink). It must read on every ink.
3. **Logic.** Put pure rules in `src/lib/playable/<widget>.ts`, deterministic given an injectable `random`.
4. **Board.** Write `src/components/islands/<Name>.tsx` (default export, props `{ slug: string }`) using the kit's `GameFrame`. Call `recordRound(slug, …)` exactly once per finished round and persist options with `usePref`.
5. **Register.** Add the widget key to `PLAYABLE_WIDGET_OPTIONS` in `src/lib/playable-games.ts`, then add an import and one `client:only="react"` line for it in `src/components/content/InteractiveWidget.astro`.
6. Run `npm run build` to validate the frontmatter and generate the route.

## Player progress

`src/lib/progress.ts` keeps one JSON object in `localStorage` under `arkedia:progress:v1`, keyed by game slug: rounds played, wins, losses, draws, streaks, best scores per bucket (with whether higher or lower is better), last played time and saved options. Nothing is sent anywhere. The lid stamps, the home page's "Continue where you left off", the library's "Yours" filter and each page's "Your record" read it on the client and update on `onProgressChange`. Players can clear one game from its page or everything from `/about/#progress`.

## Design

The direction is a tabletop compendium: chipboard paper, black ink, one solid process ink per game, Archivo (expanded black for lids and titles) and Source Serif 4 for the guides. Product and voice rules live in [PRODUCT.md](PRODUCT.md); tokens, named design rules and component anatomy (box lids, GameFrame, board diagrams, cover spec) live in [DESIGN.md](DESIGN.md).
