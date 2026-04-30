# V2 Upgrade Playbook: Vite + Supabase + Vercel

Migrates the Car Tracker from a local offline-only IndexedDB app to a cloud-hosted multi-device web app.

**Stack change:** Dexie (IndexedDB) → Supabase (PostgreSQL + Auth + RLS) · Vercel hosting

---

## Phase 1 — Supabase Project & Schema

**Goal:** Cloud database ready, tables match current models, RLS locks rows to their owner.

**Time estimate:** 30 min

### Steps

1. Create a Supabase account at [supabase.com](https://supabase.com) and start a new project (free tier: 500 MB, 50k MAU).

2. Open the **SQL Editor** in the Supabase dashboard and run the schema below.

3. Copy **Project URL** and **anon public key** from Settings → API. You'll need them in Phase 2.

### SQL Schema

```sql
-- VEHICLES
create table vehicles (
  id            bigserial primary key,
  user_id       uuid references auth.users not null default auth.uid(),
  make          text not null,
  model         text not null,
  year          int  not null,
  vin           text,
  license_plate text,
  purchase_date date,
  purchase_price numeric,
  current_mileage int not null default 0,
  notes         text,
  created_at    timestamptz default now()
);
alter table vehicles enable row level security;
create policy "own vehicles" on vehicles
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- MAINTENANCE PLANS
create table maintenance_plans (
  id                   bigserial primary key,
  user_id              uuid references auth.users not null default auth.uid(),
  vehicle_id           bigint references vehicles(id) on delete cascade not null,
  type                 text not null,
  interval_km          int,
  interval_months      int,
  last_service_date    date,
  last_service_mileage int,
  created_at           timestamptz default now()
);
alter table maintenance_plans enable row level security;
create policy "own plans" on maintenance_plans
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- MAINTENANCE ENTRIES
create table maintenance_entries (
  id               bigserial primary key,
  user_id          uuid references auth.users not null default auth.uid(),
  vehicle_id       bigint references vehicles(id) on delete cascade not null,
  title            text not null,
  category         text not null,
  type             text not null,
  date             date not null,
  mileage          int  not null,
  cost             numeric,
  service_provider text,
  notes            text,
  created_at       timestamptz default now()
);
alter table maintenance_entries enable row level security;
create policy "own entries" on maintenance_entries
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- FUEL ENTRIES
create table fuel_entries (
  id          bigserial primary key,
  user_id     uuid references auth.users not null default auth.uid(),
  vehicle_id  bigint references vehicles(id) on delete cascade not null,
  date        date    not null,
  mileage     int     not null,
  liters      numeric,
  total_price numeric,
  created_at  timestamptz default now()
);
alter table fuel_entries enable row level security;
create policy "own fuel" on fuel_entries
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
```

### Verify

- Tables appear in **Table Editor**
- Each table has RLS enabled (shield icon)
- No data visible when not logged in (test via the API tab)

---

## Phase 2 — Authentication

**Goal:** Users can sign up / log in. The rest of the app is gated behind auth.

**Time estimate:** 2–3 hours

### Install

```bash
npm install @supabase/supabase-js @supabase/auth-ui-react @supabase/auth-ui-shared
```

### Steps

1. Create `.env.local` in project root (already in `.gitignore` via Vite defaults):
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

2. Create `src/services/supabase.ts` — single client instance:
   ```ts
   import { createClient } from '@supabase/supabase-js';
   export const supabase = createClient(
     import.meta.env.VITE_SUPABASE_URL,
     import.meta.env.VITE_SUPABASE_ANON_KEY
   );
   ```

3. Create `src/context/AuthContext.tsx` — wraps the app, exposes `session` and `user` via context.

4. Create `src/pages/LoginPage.tsx` — uses `<Auth>` from `@supabase/auth-ui-react` (email/password to start).

5. In `App.tsx`: if `session === null` → render `<LoginPage />`, else → render existing routes.

6. Add a sign-out button to `NavBar.tsx` → calls `supabase.auth.signOut()`.

### Optional: Google OAuth

Enable Google provider in Supabase Dashboard → Auth → Providers. Add one line to the `<Auth>` component: `providers={['google']}`.

---

## Phase 3 — Swap the Data Layer

**Goal:** Replace all Dexie calls with Supabase equivalents. Components stay unchanged.

**Time estimate:** 4–6 hours

### Column name mapping

The TypeScript models use camelCase; Supabase columns use snake_case. Apply this mapping on read (convert snake → camel) and write (convert camel → snake), or use a thin adapter per table.

| TypeScript | SQL column |
|---|---|
| `vehicleId` | `vehicle_id` |
| `intervalKm` | `interval_km` |
| `intervalMonths` | `interval_months` |
| `lastServiceDate` | `last_service_date` |
| `lastServiceMileage` | `last_service_mileage` |
| `licensePlate` | `license_plate` |
| `currentMileage` | `current_mileage` |
| `purchaseDate` | `purchase_date` |
| `purchasePrice` | `purchase_price` |
| `totalPrice` | `total_price` |
| `serviceProvider` | `service_provider` |

### Dexie → Supabase cheatsheet

| Dexie | Supabase |
|---|---|
| `db.vehicles.toArray()` | `supabase.from('vehicles').select('*')` |
| `db.vehicles.get(id)` | `supabase.from('vehicles').select('*').eq('id', id).single()` |
| `db.vehicles.add(data)` | `supabase.from('vehicles').insert(data).select().single()` |
| `db.vehicles.update(id, data)` | `supabase.from('vehicles').update(data).eq('id', id)` |
| `db.vehicles.delete(id)` | `supabase.from('vehicles').delete().eq('id', id)` |
| `db.vehicles.where('vehicleId').equals(x)` | `supabase.from('vehicles').select('*').eq('vehicle_id', x)` |
| `useLiveQuery(() => ...)` | `useQuery` (React Query) with `queryKey` + `queryFn` |

### Reactivity strategy

Replace `dexie-react-hooks` with **React Query**:

```bash
npm install @tanstack/react-query
```

- Wrap app in `<QueryClientProvider>`
- Replace each `useLiveQuery` call with a `useQuery` hook
- After any mutation (insert/update/delete), call `queryClient.invalidateQueries({ queryKey: ['vehicles'] })` to trigger a re-fetch

This gives you multi-device sync on the next navigation or manual refetch. Add `refetchInterval: 5000` per query for near-realtime if needed.

### Migration order (least to most dependencies)

1. `fuel_entries` — standalone, nothing depends on it
2. `vehicles` — depended on by everything else but has no FK itself
3. `maintenance_plans` — depends on vehicles
4. `maintenance_entries` — depends on vehicles; `maintenanceService.ts` also updates plans + vehicles

### Cleanup

After all tables are migrated:

```bash
npm uninstall dexie dexie-react-hooks
```

Remove `src/services/db.ts`.

---

## Phase 4 — Vercel Deploy

**Goal:** App live on a public URL, accessible from any device.

**Time estimate:** 15 min

1. Push all changes to GitHub (`main` branch).

2. Go to [vercel.com](https://vercel.com) → **New Project** → Import `LukasNold/AutoApp`.

3. Vercel auto-detects Vite. No `vercel.json` needed.

4. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

5. Click **Deploy**. First deploy takes ~60 seconds.

6. Test login + CRUD from two different browsers/devices.

### Custom domain (optional)

Vercel Dashboard → Project → Settings → Domains. Add any domain you own; Vercel handles SSL automatically.

---

## Phase 5 — Mobile Polish & PWA

**Goal:** App installable on phone home screen, usable in the car.

**Time estimate:** 1–2 hours

### PWA setup

1. Install `vite-plugin-pwa`:
   ```bash
   npm install -D vite-plugin-pwa
   ```

2. Add to `vite.config.ts`:
   ```ts
   import { VitePWA } from 'vite-plugin-pwa';
   // in plugins array:
   VitePWA({
     registerType: 'autoUpdate',
     manifest: {
       name: 'Car Tracker',
       short_name: 'CarTracker',
       theme_color: '#2563eb',
       icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }]
     }
   })
   ```

3. Add a 192×192 and 512×512 PNG icon to `/public/`.

4. On mobile: open the app in Safari/Chrome → Share → **Add to Home Screen**.

### Responsive adjustments

- Dashboard 4-column stat grid → 2-column on mobile (`grid-cols-2 sm:grid-cols-4`)
- Vehicle card grid → single column on mobile (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`)
- Tables → consider a card-list layout on small screens

---

## Key decisions

| Topic | Recommendation | Notes |
|---|---|---|
| Auth provider | Email/password first | Add Google OAuth in 30 min when ready |
| Real-time sync | React Query polling (`refetchInterval`) | Add Supabase Realtime subscriptions in V3 |
| Offline support | Drop for now | PWA service worker caches the shell; data requires network |
| Data migration | Manual one-time export/import | Export from browser DevTools IndexedDB, import via Supabase dashboard CSV upload |

---

## Data migration (one-time, existing local data)

If you want to keep data entered during the MVP phase:

1. Open DevTools → Application → IndexedDB → CarMaintenanceDB
2. Export each table manually (copy rows to a spreadsheet or JSON)
3. In Supabase dashboard → Table Editor → each table → **Insert rows** or use the CSV import

This is a one-time operation; after V2 goes live, all new data goes to Supabase.
