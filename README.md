# Logo.io

Logo.io is a monorepo for the Logo.io product, built with Bun workspaces and Turborepo.

## Monorepo Structure

```
packages/
  web/       Web app + API server (Vite + Hono + Drizzle)
  mobile/    Expo + React Native client
  desktop/   Electron desktop shell
```

## Getting Started

1. Install [Bun](https://bun.sh/).
2. Create a root `.env` file from `.env.template` (and package templates if needed).
3. Run development servers:

```sh
bun run dev           # web
bun run dev:mobile    # mobile
bun run dev:desktop   # desktop
```

## Common Commands

```sh
bun run typecheck
bun run build
```

Web linting:

```sh
cd packages/web
bun run lint
```

## Environment Variables

Secrets and credentials are stored in a root `.env` file (gitignored). API/server code reads from `process.env`. Client-side code should use `VITE_`-prefixed variables via `import.meta.env`.

## Database (Web Package)

```sh
cd packages/web
bun run db:push
bun run db:generate
bun run db:migrate
bun run db:studio
```
