# Repository Guidelines

## Project Structure & Module Organization
- Next.js 15 routes live in `app/`; `app/page.tsx` drives the landing experience, while `app/layout.tsx` and `app/globals.css` define shared chrome and styles.
- Presentational components sit in `components/`, with Radix-inspired primitives under `components/ui/` and map-focused widgets such as `Map.tsx` and `FloatingChat.tsx` alongside them.
- Cross-cutting utilities and API helpers are collected in `lib/`; shared state is handled through Zustand stores in `store/generalStore.ts`.
- Static assets (icons, manifest, favicons) belong in `public/`; keep any large media or generated files out of the repository.

## Build, Test, and Development Commands
- `npm run dev` launches the local development server with Turbopack hot reloading.
- `npm run build` produces an optimized production bundle; run it before opening a pull request to catch compile-time issues.
- `npm run start` serves the production build locally, useful for sanity checks after bundling.
- `npm run lint` executes ESLint across the codebase; it must pass before merging.

## Coding Style & Naming Conventions
- Use TypeScript everywhere; prefer explicit types on exported functions and hook return values.
- Follow React conventions: components and hooks in PascalCase (`MapSearchBar`) or camelCase (`useChatStore`), files mirroring the exported symbol.
- Styling relies on Tailwind CSS 4 utilities; co-locate class logic near the JSX and keep conditional classes readable with `clsx`/`tailwind-merge`.
- Run `npm run lint` to enforce formatting; configure editor tooling to respect the repository’s ESLint and TypeScript settings.

## Testing Guidelines
- Automated tests are not yet in place; new features should ship with lightweight unit or integration tests when practical.
- Prefer colocated test files using the `.test.ts` or `.test.tsx` suffix and mirror the directory structure of the source under test.
- Add smoke tests for critical flows (map initialization, chat submission) and document any manual QA steps in the pull request description.

## Commit & Pull Request Guidelines
- Commits follow sentence-case summaries (e.g., “Fix POI card text contrast”); keep them focused and include rationale in the body when complexity warrants it.
- Reference issue IDs or discussion links when available, and push incremental commits instead of force-pushing shared branches.
- Pull requests should describe the change, outline testing performed (`npm run lint`, manual verification), and attach screenshots or recordings for UI-affecting updates.

## Configuration & Environment
- Declare secrets such as `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` and `NEXT_PUBLIC_BACKEND_API_URL` in `.env.local`; never commit concrete values.
- Mapbox GL requires a valid access token before `components/Map.tsx` will render correctly, so confirm the token when testing locally.
- When integrating new services, update the README with setup instructions and guard client-only env vars with `NEXT_PUBLIC_` prefixes.
