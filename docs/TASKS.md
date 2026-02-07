# Immediate Tasks (Milestone 1)

## Priority Order

### 1. Fix Balance Logic (~30 min)
**File:** `src/server/routers/markets.ts`

The bet mutation doesn't deduct from user balance:
```typescript
// Current: just creates bet record
// Need: deduct amount from user.balance first
```

Fix:
- Check `user.balance >= amount`
- Deduct `amount` from balance on bet
- Transaction to ensure atomicity

### 2. Add Payout on Resolution (~30 min)
**File:** `src/server/routers/markets.ts`

The resolve mutation just marks resolved, doesn't pay winners:
```typescript
// Current: just sets resolved=true, resolution='YES'
// Need: calculate each bet's payout
```

Fix:
- Get all bets for the market
- For winning bets: `payout = shares` (1:1 on resolution)
- Add payout to each winner's balance

### 3. Show Balance in UI (~15 min)
**File:** `src/app/layout.tsx` and `src/app/page.tsx`

Add:
- tRPC endpoint: `users.me` → returns current user with balance
- Display balance in header
- Show balance change after betting

### 4. Market Detail Page (~45 min)
**Files:** `src/app/market/[id]/page.tsx`

Add:
- Individual market view
- Bet history list
- Larger bet buttons
- Resolution controls (for creator)

### 5. Deploy to Render (~20 min)
**Files:** `render.yaml` (blueprint)

Need:
- PostgreSQL database (free tier)
- Web service (Next.js)
- Environment: `DATABASE_URL`

---

## Files to Touch

```
src/server/routers/markets.ts    # Balance + payout logic
src/server/routers/users.ts      # New: user queries
src/server/routers/_app.ts       # Add users router
src/app/layout.tsx               # Show balance header
src/app/page.tsx                 # Minor UI tweaks
src/app/market/[id]/page.tsx     # New: detail page
render.yaml                      # New: deploy config
```

---

## Estimated Total: ~2.5 hours

Start with #1 (balance deduction) - it's the most critical bug.
