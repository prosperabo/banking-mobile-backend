# Banking Mobile Backend

Backend API for the banking mobile application. Built with Express.js 5, Prisma 6, TypeScript, and MySQL.

## Requirements

- Node.js >= 24.0.0 (LTS)
- npm >= 11.10.0
- MySQL

## Getting started

```bash
cp .env.sample .env
# Fill in required environment variables

npm install
npx prisma generate
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |
| `npm run lint` | Run ESLint with auto-fix |
| `npm run format` | Format code with Prettier |
| `npm run test:auth-flow` | Run auth flow guard validation |

## Prisma

```bash
npm run orm:generate       # Generate Prisma Client
npm run orm:migrate:dev    # Run migrations in development
npm run orm:migrate:deploy # Apply migrations in production
```

## Docker

**Development:**
```bash
docker build -f Dockerfile.dev -t banking-mobile-backend:dev .
docker compose -f docker-compose.dev.yml up
```

**Production:**
```bash
docker build -f Dockerfile -t banking-mobile-backend:prod .
docker compose -f docker-compose.prod.yml up
```

## Node.js version

Managed via `.nvmrc`. To switch automatically:
```bash
nvm use
```

Current LTS: `v24.15.0`

## npm security

Supply chain security strategy: native npm tooling instead of `ignore-scripts=true`.

`ignore-scripts=true` was evaluated and discarded — it breaks three critical direct dependencies that require lifecycle scripts to function. See `.npmrc` for the full rationale.

**Installing dependencies**

`npm install` works normally — lifecycle scripts are intentionally allowed. See the exceptions table below for which packages require them and why.

```bash
npm install               # installs all dependencies (scripts run as expected)
npm audit signatures      # verify cryptographic registry signatures — run after every install
npm audit                 # scan for known CVEs — run periodically or in CI
```

**Active mitigations:**

| Control | How to run | What it does |
|---------|-----------|--------------|
| `min-release-age=1` | automatic on `npm install` | Rejects packages published less than 1 day ago |
| `npm audit signatures` | `npm audit signatures` | Verifies cryptographic registry signatures for all installed packages |
| `npm audit` | `npm audit` | Scans for known CVEs across the dependency tree |

**Packages that require lifecycle scripts** (justification for not blocking them):

| Package | Script | Why it's necessary | Trust basis |
|---------|--------|-------------------|-------------|
| `@prisma/client` | `postinstall` | Generates the Prisma Client for the current platform | Official Prisma package, core dependency |
| `@prisma/engines` | `postinstall` | Downloads the query engine binary for the current OS | Official Prisma package, core dependency |
| `prisma` | `preinstall` | Validates Node.js version compatibility | Official Prisma package, core dependency |
| `puppeteer` | `postinstall` | Downloads the Chromium binary required for PDF/screenshot generation | Official Google package |
| `bcrypt` | `install` | Compiles the native C++ addon via `node-pre-gyp` | Widely adopted, no viable pure-JS alternative with same security profile |
| `protobufjs` | `postinstall` | Validates internal version scheme (transitive dep of `firebase-admin`) | Official protobuf package |
| `@firebase/util` | `postinstall` | Writes Firebase SDK defaults to dist (transitive dep of `firebase-admin`) | Official Google/Firebase package |
