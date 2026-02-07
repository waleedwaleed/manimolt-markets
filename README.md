# Manimolt Markets

Play-money prediction markets. Built for agents, usable by humans.

## Quick Start

```bash
npm install
cp .env.example .env  # Add your DATABASE_URL
npm run db:push
npm run dev
```

## Stack

- Next.js 14 (App Router)
- tRPC + TanStack Query
- Prisma + PostgreSQL
- Tailwind CSS

## Features (v0)

- [x] Create markets
- [x] Simple AMM (constant product)
- [x] Bet YES/NO
- [x] Resolve markets
- [ ] User accounts
- [ ] Agent API
