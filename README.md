# Arkedia

Arkedia is a fast, content-first educational games site built with Astro. The project is static-first by default: game pages and educational explanations are authored as content, while React is reserved for isolated interactive widgets.

## Stack

- Astro
- TypeScript
- Tailwind CSS 4 via Astro's current Tailwind setup
- MDX
- React for islands only

## Commands Used In This Phase

The workspace already contained a clean Astro `basics` starter, which matches the official minimal CLI path:

```sh
npm create astro@latest -- --template basics
```

The required integrations were added using Astro's official integration flow:

```sh
npx astro add tailwind react mdx --yes
```

Verification:

```sh
npm run build
```

## Project Structure

```text
/
├── public/
│   ├── favicon.ico
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── content/
│   │   │   └── InteractiveWidget.astro
│   │   ├── islands/
│   │   │   └── RockPaperScissorsWidget.tsx
│   │   └── ui/
│   │       ├── GameCard.astro
│   │       └── SiteHeader.astro
│   ├── content/
│   │   └── games/
│   │       ├── rock-paper-scissors.mdx
│   │       └── snake.mdx
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── pages/
│   │   ├── games/
│   │   │   ├── [slug].astro
│   │   │   └── index.astro
│   │   └── index.astro
│   ├── styles/
│   │   └── global.css
│   └── content.config.ts
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

## Architecture Guardrails

### Static-first

- Prefer Astro pages, layouts, and server-rendered HTML by default.
- Keep all site content build-time friendly.
- Do not introduce backend routes, a database, auth, or CMS dependencies.
- Ship client JavaScript only when a page truly needs interaction.

### Content collections

- Game pages live in the `games` collection under `src/content/games/`.
- Use Astro's content layer with a `glob()` loader in `src/content.config.ts`.
- Treat frontmatter as the source of truth for page metadata, taxonomy, and widget attachment.
- Prefer one MDX file per game so the educational article and metadata stay together.

### MDX usage

- Use MDX for long-form educational pages with examples, callouts, diagrams, and structured explanations.
- Keep most pages mostly Markdown-first; only reach for embedded components when the content really benefits from them.
- Prefer frontmatter-driven layout concerns over sprinkling page chrome into MDX files.

### React islands

- Keep React inside `src/components/islands/`.
- Use React only for stateful widgets, input-heavy UI, timers, animation state, or browser APIs.
- Do not use React for headers, cards, navigation, article chrome, or static marketing sections.
- Attach widgets to a game page through frontmatter and a small Astro wrapper so only pages that need JS receive it.

### JavaScript budget

- Default to zero client-side JS for informational pages.
- Prefer Astro plus semantic HTML for layout, navigation, lists, and presentational UI.
- Use a small inline `<script>` only for tiny, page-local progressive enhancement where React would be overkill.
- Avoid `client:load` unless the widget must be interactive immediately on page load.

## Conventions For Future Phases

### Naming

- Use PascalCase for Astro and React components.
- Use kebab-case for route files and content entry filenames.
- Keep collection names lowercase and plural, such as `games`.

### Directory layout

- `src/pages/` contains route entry points only.
- `src/layouts/` contains shared page shells.
- `src/components/ui/` contains reusable presentational components.
- `src/components/islands/` contains React components that hydrate on the client.
- `src/components/content/` contains Astro helpers that bridge content and widgets.
- `public/` is for unprocessed static assets.

### Reusable UI

- Build reusable cards, badges, headers, and callouts as Astro components first.
- Keep components content-agnostic where reasonable, with data passed from pages or collections.
- Avoid creating a component abstraction until at least two pages need the same pattern.

### Content-driven routing

- Use collection-driven routes like `src/pages/games/[slug].astro`.
- Keep listing pages simple and powered by `getCollection()`.
- Let collection frontmatter drive titles, descriptions, taxonomy, and optional widget metadata.

### SEO flow

- Centralize document title, description, canonical, and robots handling in `BaseLayout.astro`.
- Flow page metadata from content frontmatter into the layout.
- Add `site` in `astro.config.mjs` once the production domain is known.

### Accessibility defaults

- Use semantic headings and preserve a single `h1` per page.
- Include a skip link in the base layout.
- Ensure islands expose labels, keyboard support, and status updates where needed.
- Keep color contrast and focus states visible by default.

### Astro vs React

- Use plain Astro plus HTML for static UI and page composition.
- Use plain Astro plus a small `<script>` for tiny DOM-only enhancements.
- Use React islands for multi-step interaction, local state, or reusable interactive widgets.

### Hydration directives

- Prefer `client:visible` for demos or widgets that can wait until the user scrolls near them.
- Use `client:idle` for above-the-fold interaction that is helpful soon but not critical for first paint.
- Use `client:load` only for widgets that must be ready immediately.
- Avoid `client:only` unless SSR is impossible for a specific browser-only dependency.

## Phase 1 Checklist

- Minimal Astro foundation in place
- Official Tailwind integration added
- Official React integration added
- Official MDX integration added
- Content collection scaffolded for games
- Content-driven listing and dynamic route added
- React limited to a sample island pattern
- Project conventions documented for the next build phases
