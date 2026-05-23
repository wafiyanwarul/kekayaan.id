# kekayaan.id

**Personal Wealth OS** — Pantau total kekayaan, pengeluaran bulanan, dan tujuan finansialmu.

## Tech Stack
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Auth + Postgres + RLS)
- Prisma ORM
- Zustand (state)
- React Hook Form + Zod (forms)
- Recharts (charts)

## Getting Started

```bash
npm install
cp .env.example .env.local
# Fill in your Supabase credentials in .env.local
npm run dev
```

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `DATABASE_URL` | Supabase pooled connection (Prisma) |
| `DIRECT_URL` | Supabase direct connection (migrations) |

## Modules (MVP)
- [x] Wealth Dashboard
- [x] Monthly Expense Tracker
- [ ] Asset CRUD (next sprint)
- [ ] Goal Planner (next sprint)
- [ ] Bank Mutation Import (v1.1)
