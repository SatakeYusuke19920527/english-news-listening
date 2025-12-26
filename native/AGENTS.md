# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Primary Expo Router entrypoint; screens are authored as route files (e.g., `index.tsx` with a matching `_layout.tsx` stack). Keep shared UI in `components/` or `hooks/` alongside routes when they are reused.
- `app/(tabs)/`: Bottom tab group for Home + Setting screens. Add new tab screens here.
- `app/news/[id].tsx`: News detail route used by Home list items.
- `components/`: Shared UI (e.g., `LoadingPing`).
- `features/`: Redux Toolkit slices (news, settings).
- `hooks/`: Typed Redux hooks (`useAppDispatch`, `useAppSelector`).
- `lib/`: API clients and helpers (news fetching, content selection).
- `store/`: Redux store setup.
- `server/`: Backend prototypes (TypeScript) for local API/Cosmos access.
- `assets/`: Images and static assets consumed by the Expo app.
- `app-example/`: Reference implementation with `app/`, `components/`, `constants/`, `hooks/`, and `scripts/` (including `reset-project.js`); mirror its patterns when introducing new UI primitives.
- Root configs: `app.json` (Expo config), `tsconfig.json`, `eslint.config.js`, `expo-env.d.ts`, and `package.json`. Avoid editing generated `.expo/` artifacts manually.

## Build, Test, and Development Commands
- `npm start` / `npx expo start`: Launch the Expo dev server with QR code output.
- `npm run android` / `npm run ios` / `npm run web`: Start platform-specific bundles from the same Expo entrypoint.
- `npm run lint`: Run ESLint with the Expo configuration; resolve all warnings before opening a PR.
- `npm run server`: Run the local TypeScript API server (if used).
- `npm run reset-project`: Reset starter content (script currently lives at `app-example/scripts/reset-project.js`).

## Coding Style & Naming Conventions
- Language: TypeScript-first React Native. Prefer functional components with hooks and keep inline styles small; lift shared styles into objects.
- Formatting: 2-space indentation, single quotes, and trailing commas where allowed; let ESLint guide decisions rather than adding ad-hoc rules.
- File naming: Components in `PascalCase`, hooks/utilities in `camelCase`, and Expo Router route segments in kebab-case or `index.tsx` for defaults. Co-locate tests or story files with their components when added.
- Imports: Use relative paths within a route group; avoid deep nesting by extracting shared pieces to `components/`.

## Testing Guidelines
- No automated test suite is configured yet. When adding logic-heavy modules, favor Jest with React Native Testing Library; place specs near the source using `*.test.tsx` naming.
- Provide reproducible manual steps (device/emulator, Expo Go vs. development build) in PRs until automated tests exist.

## Commit & Pull Request Guidelines
- Commit messages: Use concise, imperative summaries (e.g., `Add onboarding carousel`). Conventional Commit prefixes are welcome but not required given the current history.
- Pull requests should include: a short description of the change, linked issues/task references, screenshots or recordings for UI updates, and a list of manual checks performed (platforms/devices). Keep diffs focused and avoid bundling unrelated cleanups.

## Security & Configuration Tips
- Do not commit secrets or service keys. Prefer environment variables or Expo config parameters injected at build time, and keep any `.env` files out of version control.
- When introducing new libraries, favor Expo-compatible packages to maintain parity across Android, iOS, and web targets.
- Client uses `EXPO_PUBLIC_NEWS_API_URL` for news API access; keep Cosmos credentials server-only.

## Project Documentation
- `api_contract.md`: API contract between the app and backend; do not change without following `agent_rules.md`.
- `data_model.md`: Cosmos DB data model (containers, partition keys, query patterns).
- `runbook.md`: Operational runbook for incidents and error handling.
- `prompt_design.md`: Rules for generated English prompts and output constraints.
- `agent_rules.md`: Change protocol and agent rules that govern updates to contracts/docs.
