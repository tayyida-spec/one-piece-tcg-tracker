# Three Hats — One Piece TCG Tracker

Shared inventory and transaction tracker for your group (5 users). Built with **Next.js**, **Supabase** (auth + Postgres + storage), **Prisma**, deployable on **Vercel** free tier.

## Features (v1)

- Email login (Supabase Auth)
- Shared workspace **Three Hats** with invite link (no public sign-up page)
- **Inventory** — cards, sealed, merchandise; JP/EN; variant, condition, location, prices, photo URL
- **Transactions** — buy / sell / trade / gift / adjustment; auto-updates inventory qty
- **Quick add** — minimal form for trade-night logging
- **Excel import** — `Cards Inventory` + `Transaction Log` sheets from your workbook

## Prerequisites

1. [Node.js 20+](https://nodejs.org/) (includes npm)
2. Free [Supabase](https://supabase.com) project
3. Optional: [Vercel](https://vercel.com) account for deploy

## Setup (about 15 minutes)

### 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. **Authentication → Providers**: enable Email.
3. **Authentication → URL configuration**: add `http://localhost:3000` to Site URL and Redirect URLs (add your Vercel URL later).
4. **Project Settings → API**: copy `Project URL` and `anon` key.
5. **Project Settings → API**: copy `service_role` key (keep secret).
6. **Project Settings → Database**:
   - Copy **Connection string** (URI) for `DATABASE_URL` — use **Transaction** pooler (port **6543**) with `?pgbouncer=true`
   - Copy **Direct connection** for `DIRECT_URL` (port **5432**)

### 2. Local env

```bash
cd one-piece-tcg-tracker
cp .env.example .env
```

Edit `.env` with your Supabase values. Set:

```env
WORKSPACE_INVITE_CODE=three-hats-2026
```

Share the invite link with your friends (not the code alone):

```
https://one-piece-tcg-tracker-five.vercel.app/join?code=three-hats-2026
```

Replace the domain with your Vercel URL if different. Short link `/invite` also works and reads `WORKSPACE_INVITE_CODE` from env.

### 3. Install and database

```bash
npm install
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. First user & friends

1. **First person**: Open the invite link → **New here** → create account (becomes admin of **Three Hats** if workspace does not exist yet).
2. **Friends**: Open the same invite link → **New here** to create an account, or **Returning** if they already have one. The invite code is pre-filled from the link.

There is no public sign-up page. `/signup` redirects to the invite join flow.

**Supabase (optional, recommended for production):** In Authentication → Providers → Email, you can leave sign-ups enabled (registration only appears on the invite link page). To block sign-ups outside your app entirely, disable **Enable sign ups** only if you invite users via Supabase dashboard emails instead.

### 5. Import your Excel

1. Go to **Import**.
2. Upload `Three Hats (1).xlsx` (or your live workbook).
3. Inventory rows and transaction groups are imported; duplicate transaction IDs are skipped on re-import.

## Deploy to Vercel

1. Push this folder to GitHub.
2. Import repo in Vercel.
3. Add the same environment variables as `.env`.
4. Run `npx prisma db push` locally against production DB once (or use Supabase SQL editor after `prisma migrate` if you add migrations later).
5. Update Supabase redirect URLs with your `*.vercel.app` domain.

## Project structure

```
src/app/(app)/     # Authenticated pages
src/app/(auth)/    # Login, invite join
src/app/api/       # REST API routes
prisma/schema.prisma
```

## v2 roadmap

- **Monthly P/L dashboard** — TXN (case breaks), BC (buy/sell same ID); no fees on dashboard; edit Transaction IDs in Transaction Log
- Still planned:
- Auto cost basis from buy history
- Card catalog admin UI
- Photo upload to Supabase Storage
- Multi-line transactions in one form
- Trade lines (in/out pairs)

## Card catalog note

A built-in catalog is **optional**. You can maintain `Card Master List` data later via CSV import into `CardCatalogEntry` (API/UI in v2). For now, manual card ID + name entry matches your Excel workflow.
