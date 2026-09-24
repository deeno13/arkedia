# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Curious teens and adults who want to pick up a game they half-know (or have never played), understand its rules and the thinking behind good play, and then actually play it — usually alone, in a browser tab, on a laptop or phone, in a few spare minutes. They are self-directed learners, not students assigned homework; nobody is supervising them.

## Product Purpose

Arkedia is a collection of classic games you can learn and play in one place. Each game has a single page that teaches the rules quickly, shows a worked example, explains strategy and the idea underneath the game (probability, constraint reasoning, search, pattern recognition), and hosts a playable version right there. Success means a visitor arrives not knowing a game, can play a legal first round within a minute, and leaves playing better than when they started.

## Positioning

Rules, strategy, and a working board share the same page. Neighbouring sites either host games with no explanation (ad-heavy portals) or explain games with no way to play (wikis, rulebooks). Arkedia's mechanism is "learn it, then play it, right here," with the ideas behind each game made explicit.

## Operating Context

- Static website; each game is its own route (`/games/<slug>/`) with a browsable library at `/games/`.
- Visitors play solo against the computer or a puzzle; no multiplayer networking.
- Progress (best scores, games played/solved, last chosen difficulty) is remembered per device in the browser via `localStorage`. There are no accounts, no server storage, and no leaderboards.

## Capabilities and Constraints

- Stack: Astro (static output) with MDX content collections, Tailwind CSS 4, and React used only for page-scoped playable islands. No backend, no authentication, no SPA conversion without a product request.
- Collection (14 games, every one playable): Snake, Rock Paper Scissors, Wordle-style word game, Sudoku, Crossword, Tic-Tac-Toe, Connect Four, Minesweeper, 2048, Mastermind, Nim, Tower of Hanoi, Memory (Concentration), Lights Out.
- Game content is authored in MDX with typed frontmatter validated at build time.
- Every playable game must work with keyboard and touch/pointer, and communicate state in text as well as colour.
- Word and crossword content must be original to Arkedia (no copied commercial puzzles or word lists beyond common dictionary words).

## Brand Commitments

- Name: Arkedia.
- Voice: clear, curious, a little witty; talks to the player as a capable adult. Explains the "why," not just the "what." No hype, no gamified pressure, no dark patterns.
- Existing assets: `public/favicon.svg`, `public/favicon.ico`.

## Evidence on Hand

- Existing MDX guides for Snake, Rock Paper Scissors, Wordle-style game, Sudoku, Crossword in `src/content/games/`.
- No player counts, ratings, testimonials, reviews, or press exist. Do not invent any.

## Product Principles

1. Playable in a minute: the shortest honest path from "never played" to "making a legal move."
2. Explain the idea underneath: every game names the concept it exercises and shows it in play.
3. The board and the guide reinforce each other: rules reference what you see on the board; the board surfaces hints that point back to the guide.
4. Respect the player: no ads, no nags, no fake urgency; progress stays on their device.
5. Static and fast: pages render fully without JavaScript; only the board hydrates.

## Accessibility & Inclusion

WCAG 2.2 AA target. Full keyboard play for every game, visible focus, screen-reader status announcements for moves and results, no colour-only state, and `prefers-reduced-motion` respected for all animation.
