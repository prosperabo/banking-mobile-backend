# AGENTS.md — Banking Mobile Backend

## Stack
- TypeScript 5.8, Express 5, Prisma 6 (MySQL), Node.js >=24
- Winston, JWT, Firebase Admin, GCP (Storage + Firestore)
- Jest, ESLint + Prettier

## Project Structure
```
src/
  api/          — Axios instances for external APIs
  config/       — Env config, Prisma client, Firebase, GCP
  controllers/  — Static classes, methods wrapped in catchErrors
  data/         — Mock data
  middlewares/  — authenticateToken, validateRequest, etc.
  repositories/ — Static classes, Prisma access via db singleton
  routes/       — Express Router, index.ts mounts all
  schemas/      — TypeScript interfaces/DTOs (re-exported from index.ts)
  services/     — Static classes, business logic
  shared/       — errors/, handlers/, consts/
  types/        — express.d.ts augmentation
  utils/        — Logger, JWT, hash, dates, etc.
tests/          — Jest test files (*.test.ts)
scripts/        — Utility scripts with own service/repo layers
prisma/         — schema.prisma + migrations
public/         — Static assets (checkout HTML, emails)
```

## Adding a New Feature
1. Define DTOs in `src/schemas/<feature>.schemas.ts`, export from `src/schemas/index.ts`
2. Define validators in `src/validators/<feature>.validator.ts` using express-validator
3. Create repository in `src/repositories/<feature>.repository.ts` (static class, Prisma)
4. Create service in `src/services/<feature>.service.ts` (static class)
5. Create controller in `src/controllers/<feature>.controller.ts` (static methods, catchErrors wrapper)
6. Create routes in `src/routes/<feature>.routes.ts` (Router, wire middleware + validator + controller)
7. Mount in `src/routes/index.ts`
8. Write tests in `tests/<feature>.<layer>.test.ts`

If the feature calls an external API, add the axios instance in `src/api/`.

## TypeScript Rules
- **Hard rule: never use `any`** — always use explicit types
- **Hard rule: never use `as any`**
- **Hard rule: never use `@ts-ignore` or `@ts-expect-error`** — only with explicit approval
- Prefer `unknown` + type narrowing over `any`
- Strict mode is enabled; `strictNullChecks` is `false` — handle nulls explicitly where they occur

## Architecture Rules
- Follow the existing static-class pattern (no DI, no DI containers)
- Controllers → Services → Repositories — never skip a layer
- Use `successHandler(res, data, message)` for success, throw custom errors for failures
- Wrap async controller methods with `catchErrors`
- Use `buildLogger('<name>')` for structured logging
- Never import services/repos directly into routes; controllers are the bridge
- Do NOT update dependencies unless explicitly asked
- Do NOT touch unrelated files
- Do NOT reformat unrelated files
- Preserve API contracts (request/response shapes) unless explicitly asked to change

## Naming Rules
- Variables must be self-descriptive and clearly communicate intent
- Abbreviations are not allowed unless they are universally understood (e.g., `id`, `url`, `email`)
- Examples of **forbidden** patterns: `ctx` instead of `context`, `cfg` instead of `config`, `authService` is fine but `svc` is not

## Security Rules
- No secrets in code; all sensitive config via environment variables
- Auth: JWT via `authenticateToken` middleware; token extracted from `Authorization: Bearer <token>`
- Validate all input with express-validator before it reaches controllers
- Use custom error classes for auth failures (UnauthorizedError, ForbiddenError, etc.)
- Use `cors` with per-environment origins
- Never log secrets or full payloads; use structured logger with sanitized metadata

## Database Rules
- All Prisma access through repositories only (never in services/controllers directly)
- Use the `db` singleton from `@/config/prisma`
- Generate Prisma Client after schema changes: `npm run orm:generate`
- Create migration: `npm run orm:migrate:create` (creates SQL file, does NOT apply)
- Apply migration: `npm run orm:migrate:execute` (applies via `prisma db execute`)
- Deploy pending: `npm run orm:migrate:deploy` (safe for production)
- Never use `prisma migrate dev` — it can drop and recreate the database schema
- Never bypass migrations; schema changes must be tracked

## Testing / Verification
- Run `npm run lint` before committing (enforced by husky pre-commit)
- Run `npm test` to execute jest test suite
- Run `npm run build` to verify TypeScript compiles
- Run `npx tsc --noEmit` for type checking
- Tests live in `tests/` as `*.test.ts`, mapped via jest `@/` alias
- Mock external APIs and repositories in tests using `jest.mock`

## Final Response Format After Changes
After implementing a feature or fix, report:
- What was done
- Files created/modified (path:line numbers if relevant)
- Verification commands run and their results
- Migration steps needed: `npm run orm:migrate:create && npm run orm:migrate:execute && npm run orm:generate`
