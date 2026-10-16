# Avyakta: The Living Traditions

Avyakta is a student-led cultural club bringing together students interested in performing arts, design, technology, event management, and related disciplines. This repository contains its public website and internal event, membership, and recruitment tools.

## Stack

- Next.js 16 App Router, React 19, and TypeScript
- Tailwind CSS 4
- Supabase (PostgreSQL, Auth, and Storage) with Drizzle schema and migrations
- React Hook Form and Zod for form handling and validation

## Requirements

- Node.js 22.6 or newer (Node.js 24 is recommended)
- npm
- Supabase project credentials for database-backed features

## Run locally

```bash
cd frontend
npm install
cp .env.local.example .env.local
```

Edit `frontend/.env.local` with the values for your environment. The template is [`.env.local.example`](frontend/.env.local.example).

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` for server-side API routes; never expose this key in client code
- `AUTH_SESSION_SECRET` for signed sessions; generate one with `openssl rand -base64 48`
- `NEXT_PUBLIC_SITE_URL`, if links should use a fixed site URL
- SMTP settings (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and optionally `MAIL_FROM`) for outgoing mail. Remove or leave these unset to disable mail locally.
- `DATABASE_URL` when using Drizzle database tooling or migrations

Start the development server from `frontend/`:

```bash
npm run dev
```

The site is available at [http://localhost:3000](http://localhost:3000).

## Commands

Run these from `frontend/`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |

## Main routes

- `/`, `/about`, `/about-ira`, and `/contact`
- `/events` and `/events/[slug]`
- `/gallery`, `/history`, and `/members`
- `/recruitment`, `/recruitment-closed`, and `/registrations`
- `/auth/login`, `/dashboard`, and `/domain/[domain]` for team workflows

## Project layout

- `frontend/src/app/` — pages and API routes
- `frontend/src/components/` — reusable interface components
- `frontend/src/lib/` — data access, authentication, mail, validation, and utilities
- `frontend/drizzle/` — database schema and migrations
- `frontend/public/` — static assets

Keep local environment files and service-role credentials out of version control.
