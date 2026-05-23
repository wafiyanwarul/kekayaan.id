# kekayaan.id

<p align="center">
  <strong>Personal Wealth Cockpit for assets, cash flow, and long-term financial clarity.</strong>
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=nextdotjs" />
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=111827" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Auth%20%2B%20Postgres-3FCF8E?style=for-the-badge&logo=supabase&logoColor=111827" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=111827" />
</p>

---

## Overview

`kekayaan.id` is a modern personal finance dashboard built to help track wealth allocation, liquid and non-liquid assets, monthly cash flow, and future financial goals.

The app is designed around a salary-cycle workflow: monthly finance periods can run from the 25th of one month to the 24th of the next month, making it suitable for real-world Indonesian payroll habits.

## Highlights

- Authenticated dashboard powered by Supabase Auth.
- Real-time wealth overview from user-owned asset records.
- Asset CRUD for liquid and non-liquid wealth tracking.
- Finance transaction CRUD for daily spending and income.
- Active monthly cycle summary: income, expense, surplus, and savings rate.
- Finance filters by item, day, month, and year with expandable summaries.
- Income and expense category allocation charts.
- Disabled PDF bank mutation import placeholder for future extraction workflow.
- Goals and operational settings pages prepared for future development.
- Maintenance and upgrading toggles as a UI foundation for deployment controls.

## Tech Stack

| Layer | Tools |
| --- | --- |
| Framework | Next.js 16 App Router |
| UI | React 19, Tailwind CSS 4, Lucide Icons |
| Charts | Recharts |
| Auth & Database | Supabase Auth, Postgres, RLS |
| ORM / DB Tooling | Prisma |
| Forms & Validation | React Hook Form, Zod |
| Language | TypeScript |

## Getting Started

```bash
npm install
npm run dev
```

Open the app at:

```txt
http://localhost:3000
```

## Environment Variables

Create `.env` from `.env.example` and fill in your Supabase credentials.

```bash
cp .env.example .env
```

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional fallback anon key |
| `DATABASE_URL` | Supabase pooled database connection |
| `DIRECT_URL` | Supabase direct database connection |

## Database Setup

Run the main migration in Supabase SQL Editor:

```txt
supabase-migration.sql
```

If Supabase Auth signup returns `Database error saving new user`, run:

```txt
supabase-auth-trigger-fix.sql
```

The trigger fix ensures new users can be created safely while default transaction categories and monthly cycle records are prepared.

## Project Structure

```txt
src/
  app/
    (auth)/             Login and register pages
    (dashboard)/        Dashboard, assets, finance, goals, settings
  components/
    layout/             Sidebar and top bar
    settings/           Operational settings UI
    shared/             Reusable UI primitives
  features/
    assets/             Asset CRUD and allocation chart
    finance/            Transactions, grouping, summaries, charts
  lib/
    supabase/           Browser/server Supabase clients
    utils/              Formatting and utility helpers
  proxy.ts              Next.js 16 Proxy for auth routing
```

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start local development server |
| `npm run build` | Build production app |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Current Modules

- **Dashboard**: welcome panel, wealth cards, asset allocation, monthly finance summary.
- **Assets**: add, edit, delete, and classify liquid/non-liquid assets.
- **Finance**: add, edit, delete, filter, group, and chart transactions.
- **Goals**: placeholder page for upcoming goal planning.
- **Settings**: maintenance and upgrading controls prepared for future deployment integration.

## Roadmap

- Goal creation and progress tracking.
- Persistent system settings table.
- Server-side maintenance mode enforcement through Proxy.
- PDF bank mutation extraction.
- Transaction preview table before import confirmation.
- Category management UI.
- Additional analytics for net worth growth and recurring expenses.

## Notes

This project targets modern Next.js conventions. In Next.js 16, Middleware has been renamed to Proxy, so request-level auth logic lives in:

```txt
src/proxy.ts
```

---

<p align="center">
  Built as a focused personal wealth operating system.
</p>
