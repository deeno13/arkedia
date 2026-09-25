---
name: Arkedia
description: A shelf of classic game boxes; each game page is one box opened, its rule sheet and a live board side by side.
colors:
  paper: "#f2eee5"
  paper-deep: "#e6e0d2"
  card: "#fbf9f4"
  ink: "#1d1c1a"
  ink-soft: "#4e4a42"
  ink-muted: "#6b665b"
  rule: "#cfc6b4"
  vermilion: "#c8341b"
  cobalt: "#2544c4"
  green: "#0a7049"
  mustard: "#e0a21a"
  violet: "#6536a6"
  pink: "#c73d7e"
  teal: "#0b6f7a"
  orange: "#e0661c"
  sky: "#3b8fd9"
  plum: "#8c2b5b"
  olive: "#6b7a1e"
  brick: "#9c3b24"
typography:
  display:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.375rem, 6vw, 4.5rem)"
    fontWeight: 900
    lineHeight: 0.94
    letterSpacing: "-0.03em"
    fontVariation: "'wdth' 125"
  headline:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 3.75rem)"
    fontWeight: 900
    lineHeight: 0.95
    letterSpacing: "-0.03em"
    fontVariation: "'wdth' 125"
  section:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.625rem, 3.4vw, 2.25rem)"
    fontWeight: 900
    lineHeight: 1.05
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 125"
  title:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(0.9375rem, 7.6cqi, 1.875rem)"
    fontWeight: 900
    lineHeight: 0.98
    letterSpacing: "-0.015em"
    fontVariation: "'wdth' 125"
  body:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  prose:
    fontFamily: "Source Serif 4 Variable, ui-serif, Georgia, serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "normal"
  label:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.025em"
    fontVariation: "'wdth' 112.5"
rounded:
  die: "6px"
  micro: "4px"
  tab: "3px"
spacing:
  section: "5rem"
  section-wide: "7rem"
  card-pad: "1.25rem"
  container: "78rem"
components:
  box-lid:
    backgroundColor: "var(--game-ink)"
    textColor: "var(--game-on-ink)"
    rounded: "{rounded.die}"
    padding: "0"
  box-lid-stamp:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tab}"
    padding: "0.55em 0.6em"
  shelf-tile:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.die}"
    padding: "5cqi"
  game-frame:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.die}"
    padding: "0"
  game-frame-strip-win:
    backgroundColor: "var(--game-ink)"
    textColor: "var(--game-on-ink)"
  game-frame-strip-loss:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.die}"
    padding: "0 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "var(--game-ink)"
    textColor: "var(--game-on-ink)"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.die}"
    padding: "0 16px"
    height: "44px"
  button-paper:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.die}"
    padding: "0 16px"
    height: "36px"
  segmented-option:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.tab}"
    padding: "0 10px"
    height: "32px"
  segmented-option-checked:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  filter-chip:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.die}"
    padding: "0 12px"
    height: "40px"
  filter-chip-checked:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  callout:
    backgroundColor: "{colors.paper-deep}"
    textColor: "{colors.ink}"
    rounded: "{rounded.die}"
    padding: "16px 20px"
  board-diagram-max:
    backgroundColor: "var(--game-ink)"
    textColor: "var(--game-on-ink)"
---

# Design System: Arkedia

## Overview

**Creative North Star: "The Shelf of Boxes"**

Arkedia is a shelf of game boxes, and every game page is one box opened. The shelf is a grid of solid ink lids — one process colour per game, its cover motif printed on top, the title set along the bottom in expanded black, and a rubber stamp in the corner once this browser has played it. Opening a box does not launch an app; it sets the board beside the rule sheet, the live game and the printed rules sharing one spread the way a box lid and its insert do.

The world is printed matter, not software chrome. The ground is chipboard paper, panels are card stock, and everything structural — headings, rules, borders, dividers — is drawn in black ink at a steady 2px. Colour is ink too, but it is *process* ink: a single flat spot colour per game, laid down only where a press would lay it — a lid, a title band, a game piece, an active or winning state. Fourteen inks never meet; each game writes in one.

Depth and decoration are refused. There are no gradients, no glass, no blur, no glows, and no shadows at rest; corners are die-cut, not rounded off, and the only lift in the system is a lid rising toward you on hover. The type is a two-voice pairing: Archivo, expanded and black, for all structure and interface; Source Serif 4 for the guide prose you actually read.

**Key Characteristics:**
- Chipboard paper ground (#f2eee5) with card-stock panels (#fbf9f4); never plain white.
- Black ink (#1d1c1a) carries all text, all 2px structural rules and all borders.
- One process ink per game, injected as `--game-ink`, used only as solid fills.
- Two typefaces only: Archivo for structure and controls, Source Serif 4 for guide prose.
- Die-cut 6px corners, printed board geometry, dashed borders for empty or onward slots.
- Flat by default: no gradients, glass, blur, glow, or resting shadow.

## Colors

A two-family palette: warm paper neutrals carrying black ink, and a shelf of twelve saturated process inks that take turns as the one accent.

### Primary
- **Process Ink (one per game)** — the game's signature colour, drawn from `src/lib/inks.ts` and injected as `--game-ink` / `--game-on-ink`. It is a *fill*, never a text or link colour: it appears on box lids, game-page title bands, game pieces, and active or winning states, and nowhere else. The twelve inks are **Vermilion** (#c8341b), **Cobalt** (#2544c4), **Green** (#0a7049), **Mustard** (#e0a21a), **Violet** (#6536a6), **Pink** (#c73d7e), **Teal** (#0b6f7a), **Orange** (#e0661c), **Sky** (#3b8fd9), **Plum** (#8c2b5b), **Olive** (#6b7a1e) and **Brick** (#9c3b24). Each ink ships a paired "on" colour — white for the dark inks, black ink (#1d1c1a) for Mustard, Orange and Sky — chosen so text on a solid fill holds WCAG AA.

### Neutral
- **Chipboard Paper** (#f2eee5): the page ground everywhere, and the interior of board holes and empty squares.
- **Deep Chipboard** (#e6e0d2): the footer, callout slips, table headers, code chips and hover fills on paper.
- **Card Stock** (#fbf9f4): the raised panel — board frames, rule sheets, cells, buttons on ink.
- **Black Ink** (#1d1c1a): all body text, all headings, every 2px structural rule and border, and the loss/draw strip.
- **Soft Ink** (#4e4a42): secondary prose and blockquotes on paper.
- **Muted Ink** (#6b665b): tertiary text — stat labels, captions, disabled hints.
- **Rule Grey** (#cfc6b4): 1px internal subdivision lines only (inside a rule sheet, between a table's cells, hairline list borders).

### Named Rules
**The One Ink Rule.** A game has exactly one process ink. Two game inks never appear inside the same game's surfaces, and the ink is the same colour on the lid, the title band, the pieces and the win state.

**The Solid-Fill Rule.** Process ink is laid down only as a solid fill on lids, title bands, pieces, and active/win states. It is never body text, never a link colour, never a heading, and never a gradient.

**The Never-Colour-Alone Rule.** Colour never carries meaning by itself. Every state a player must read — a placed piece, a win, a wrong guess, a live count — is also in text (`aria-live` status), in shape, or in a glyph. The opponent's Connect Four disc is ink with a paper ring, not a second colour; X and O are drawn, not tinted.

## Typography

**Display Font:** Archivo Variable (with ui-sans-serif, system-ui, sans-serif)
**Body Font:** Archivo Variable (interface) and Source Serif 4 Variable (guide prose, with ui-serif, Georgia, serif)

**Character:** Archivo carries the whole interface and every title, pushed to its widest, heaviest setting (`font-stretch-expanded`, weight 900, negative tracking) so headings read as printed box lids rather than web headings. Source Serif 4 appears only where a person reads at length — the MDX guides — and never in a control, label or heading.

### Hierarchy
- **Display** (900, `clamp(2.375rem, 6vw, 4.5rem)`, 0.94): the home hero only ("Learn it in a minute. Then play it."). Expanded width, tracking −0.03em, balanced wrap.
- **Headline** (900, `clamp(2.25rem, 5vw, 3.75rem)`, 0.95): page H1s — the library, About, 404 and each game title. Expanded width, tracking −0.03em.
- **Section** (900, `clamp(1.625rem, 3.4vw, 2.25rem)`, 1.05): home-page band headings and "Play next"; tracking −0.02em.
- **Title** (900, `clamp(0.9375rem, 7.6cqi, 1.875rem)`, 0.98): the box-lid and shelf-tile title, sized in container queries (`cqi`) so it scales with the tile, tracking −0.015em.
- **Body** (400, 0.9375rem, 1.5): all interface text — game descriptions, rule steps, controls, footers. Secondary copy drops to Soft Ink, tertiary to Muted Ink.
- **Prose** (400, 1.125rem, 1.7): the guide body only, Source Serif 4 with optical sizing, held to 68ch. Its h2 (800, 1.625rem, width 115%) and h3 (750, 1.1875rem, width 108%) switch back to Archivo.
- **Label** (600, 0.75rem, letter-spacing 0.025em, uppercase): micro-labels only — stat labels in the game bar, the "Code" tag, clue column headers, palette labels. Set in Archivo semi-expanded.

### Named Rules
**The Two-Voice Rule.** Archivo for everything a player uses or scans; Source Serif 4 for everything a player reads. A serif heading or a sans-serif guide paragraph is a break, not a variation.

**The Expanded-Caps Rule.** Titles and headings are Archivo at expanded width and weight 900 with negative tracking. Uppercase is reserved for micro-labels; it is never used to build an eyebrow or kicker above a heading.

## Layout

A single centred container, `max-w-[78rem]`, with gutters of 1rem, widening to 1.5rem at `sm` and 2rem at `lg`; the About body uses the `narrow` variant (`max-w-3xl`) and guide prose caps at 68ch. Vertical rhythm between page bands is `mt-20` (5rem), widening to `mt-28` (7rem) at `sm`.

The shelf is a grid of box lids: 2 columns, 3 at `sm`, 4 at `lg`, with the gap stepping 0.75rem → 1rem → 1.25rem so the lids grow with the viewport. Lids are a fixed 4:3 (`aspect-[4/3]`) and use container queries (`@container`, `cqi` units) so their title and stamp scale to the tile, not the viewport.

The game page is the one asymmetric spread in the system. The ink title band spans full width with a 2-column facts list (`grid-cols-2`, `sm:grid-cols-4`, returning to 2 columns beside the title at `lg`). Below it, a grid places the rule sheet in a 20rem right column (`xl` 22rem) and the board in the left column spanning two rows, so on desktop the numbered quick rules sit directly beside the live board and the rest of the sheet (Controls, Skills, Your record) stacks under the rules. Under `lg` the same cells linearise to phone order: rules, then board, then sheet, then guide. Guide prose is set in a `13rem + 1fr` grid with a sticky "On this page" rail, separated by a 2px ink rule and 8rem–10rem of air.

## Elevation & Depth

The system is flat. Panels do not float; they are sheets of card laid on chipboard, separated by a 2px black rule, not by shadow. Depth comes from paper tone (paper → deep paper → card), from ink rules, and from die-cut corners. Nothing blurs, glows, or casts a soft shadow at rest.

The only genuine shadow in the system is the box lid lifting on hover (a single translated lift plus a soft ink shadow), and a set of inset "ring" shadows used as printed marks: the rubber stamp on a lid (a triple inset ring in ink and paper) and the highest tile in 2048 (an inset ink ring). Focus is always drawn, never glowed: a 3px solid ink outline at 3px offset, which flips to the field's "on" colour inside a solid ink strip.

### Shadow Vocabulary
- **Lid hover lift** (`box-shadow: 0 16px 28px -14px rgb(29 28 26 / 0.6)`): box lids only, on `:hover`, paired with `hover:-translate-y-1`; suppressed under reduced motion.
- **Stamp ring** (`box-shadow: inset 0 0 0 2px var(--color-ink), inset 0 0 0 3.5px var(--color-paper), inset 0 0 0 4.5px var(--color-ink)`): the progress stamp printed on a played lid.
- **High-tile ring** (`box-shadow: inset 0 0 0 6px var(--game-ink)`): 2048 tiles above the painted set, so the ink still reads as a printed edge.
- **Focus outline** (`outline: 3px solid var(--color-ink); outline-offset: 3px`): every focusable element.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadow appears only as the lid hover lift, as an inset printed ring, or as a focus outline — never as ambient depth.

## Shapes

Form language is die-cut printing. The one structural radius is 6px (`--radius-die`, `rounded-die`), used on every panel, lid, game frame, button and tile so each element reads as a card punched from a board. Micro controls and printed cells step down to 4px (`rounded-[4px]`: skill chips, number badges, clue cells, the 2048 grid) and 3px (`rounded-[3px]`: segmented tabs, puzzle cells, breadcrumb links) — small parts of a big die-cut, not a second radius language.

Borders do the work that fill and shadow do elsewhere: 2px solid black ink for structure (panel edges, the frame's top and bottom bars, section rules, table borders), and 1px Rule Grey for internal subdivisions inside a panel. Empty or onward slots — the "Surprise me" tile, the "no box matches" state, the 404 panel — swap to a 2px *dashed* ink border on paper, so an empty slot looks unprinted rather than disabled. Circles exist only where the material is circular: game pieces (Connect Four discs, Mastermind pegs, Memory cards), never controls. Buttons, tabs and chips are always rectangles.

### Named Rules
**The Die-Cut Rule.** Structure is cut at 6px. 4px and 3px are for small printed parts only; anything larger or rounder breaks the box.

**The Two-Weight Rule.** 2px black ink draws structure; 1px Rule Grey draws only what is inside a panel. A 1px black rule or a 2px grey rule is off-system.

**The Dashed-For-Empty Rule.** Paper with a dashed ink border means "nothing printed here yet" — an empty slot, an unplayed shelf, a dead end. Filled panels are always solid.

## Components

### Buttons
- **Shape:** die-cut rectangle, 6px radius (6px), 2px black ink border, Archivo semi-expanded semibold.
- **Primary:** black ink fill with paper text (`bg-ink text-paper`, `min-h-11`, `px-4`); on hover it becomes the game's ink (`hover:bg-game hover:text-on-game`). This is the one main action, "New game".
- **Secondary:** transparent with a 2px ink border and ink text; hover fills with Deep Chipboard. The default for Undo, Hint and other beside-actions.
- **Paper:** paper fill with ink text and a paper border, for use on a solid ink strip — this is "Play again" on the result strip.
- **Quiet:** borderless ink-soft text with a Rule Grey underline, for low-emphasis links.
- **Hover / Focus:** colour transitions run 150ms; every button shows the shared 3px ink focus outline. Disabled buttons drop to 45% opacity with `cursor-not-allowed`.
- **Touch:** all sizes meet `min-h-11` (44px); `pointer-coarse` raises the small size to 44px and the medium to 48px.

### Chips
- **Style:** the library filter is a hidden radio plus a visible label styled as a 2px ink-bordered chip (`min-h-10`, 6px radius, Archivo semibold); skill tags on the game page are flat Deep Chipboard chips with 4px corners and no border.
- **State:** checked chips invert to ink fill with paper text (`peer-checked:bg-ink peer-checked:text-paper`); focus-visible reuses the 3px ink outline at 2px offset.

### Cards / Containers
- **Corner Style:** 6px die-cut (`rounded-die`).
- **Background:** Card Stock for interactive panels, Deep Chipboard for callouts and footer, Chipboard Paper for the page ground and empty slots.
- **Shadow Strategy:** flat — see Elevation & Depth.
- **Border:** 2px solid black ink; dashed ink for empty slots; no border on the guide body itself.
- **Internal Padding:** 1.25rem (`px-5 py-5`) is the standard panel padding; the game frame pads its board region to 1.5rem at `sm`.

### Inputs / Fields
- **Style:** there are no text fields. The only inputs are hidden radios behind chip labels (library filters) and segmented radiogroups (game options); both render as die-cut, 2px ink-bordered controls.
- **Focus:** the shared 3px ink outline; segmented options move focus with arrow keys (roving tabindex) and invert to ink fill when selected. Inside a solid ink field the outline takes the field's "on" colour.
- **Disabled:** 45% opacity, `cursor-not-allowed`.

### Navigation
- **Style:** the header is a paper bar under a 2px ink rule; its links are `min-h-11` Archivo semibold, and the current page is marked with a 4px ink underbar (`aria-current`). A "Random game" link resolves to a random slug with JavaScript and falls back to `/games/` without it.
- **Footer:** Deep Chipboard above a 2px ink rule, a 4-column list of every game grouped by kind, with plain ink-soft links.
- **In-page:** the guide rail and About contents use a 1px Rule Grey spine whose active item gets a 2px ink segment.

### Box Lid (signature)
The repeated unit of the site and the whole premise of the shelf. A 4:3 solid field of the game's ink hosting the cover SVG (contained, pinned to the top), the title in expanded black along the bottom-left, a meta line (kind · minutes · players) beneath it, and — when this browser has a record for the game — a rubber stamp rotated −6° in the top-right, printed in paper with the triple ink ring and reading "Won ×N", "Best N", or "Played ×N". The stamp is filled client-side from `localStorage`; without it the lid is simply un-stamped.

### Game Frame (signature)
The die-cut frame every board sits in: a 2px ink border on Card Stock, an options-and-stats bar on top (game controls on the left, `label → value` stats in tabular numerals on the right, separated by a 2px ink rule), the board in the padded middle, and a live status strip along the bottom. The strip is a polite `aria-live` region that reads the current state in words; when the round ends it becomes the result — the game's ink for a win, black ink for a loss or draw — and its action switches from "New game" (ink fill) to "Play again" (paper fill). Focusing the board after a new round, and moving focus to "Play again" when a round ends while focus was lost, are part of the component.

## Do's and Don'ts

### Do:
- **Do** give each game exactly one process ink, injected with `inkStyle()` as `--game-ink`/`--game-on-ink` and consumed through `bg-game` / `text-on-game` / `fill-game` / `text-game`.
- **Do** keep ink to solid fills on lids, title bands, pieces, and active or win states — The Solid-Fill Rule.
- **Do** draw structure with 2px black ink rules and reserve 1px Rule Grey for subdivisions inside a panel.
- **Do** cut corners at 6px (`rounded-die`), stepping to 4px and 3px only for small printed parts.
- **Do** set titles and headings in Archivo expanded (width 125) black (900) with negative tracking, and guide prose in Source Serif 4 at 1.125rem/1.7 capped at 68ch.
- **Do** put a 2px dashed ink border on paper for any empty or onward slot.
- **Do** state every outcome in text and shape as well as colour (`aria-live` status, X/O glyphs, a ringed opponent disc, printed numbers).
- **Do** animate transform and opacity in 120–220ms ease-out and colour in 150ms, and guard motion with `motion-safe:` / `motion-reduce:` (the global `prefers-reduced-motion` rule collapses all transitions to 0.01ms).
- **Do** keep every control at `min-h-11` (44px) and enlarge under `pointer-coarse` (`min-h-12` for medium buttons, `min-h-10` for segmented options).
- **Do** author covers as 400×300 transparent SVGs — a `<title>`, printed geometry, and only the paper, card and ink colours, with no text in the artwork.

### Don't:
- **Don't** use a process ink for text, links, headings or any large surface; ink is a fill, not a voice.
- **Don't** let two game inks meet inside one game's surfaces — The One Ink Rule.
- **Don't** add gradients, glass or frost, backdrop blur, glows, or any shadow at rest — The Flat-By-Default Rule.
- **Don't** put an eyebrow or kicker line above a heading; type begins with the heading itself.
- **Don't** round a control into a pill — circles belong to game pieces only.
- **Don't** ship icon fonts or third-party icon packages; every icon is an inline SVG drawn in `currentColor`.
- **Don't** colour a state without also naming it in text or marking it in shape — The Never-Colour-Alone Rule.
