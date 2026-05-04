# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (localhost:5173)
npm run build     # TypeScript compile + Vite production build
npm run lint      # ESLint
npm run preview   # Preview production build locally
```

## Architecture

**Stack:** React + TypeScript, Vite, Tailwind CSS v4 (via `@tailwindcss/vite` plugin — no `tailwind.config.js`), Supabase (PostgreSQL + Auth + RLS), React Query, React Router v6. Deployed on Vercel.

**Auth (`src/context/AuthContext.tsx`):** Wraps the entire app. Exposes `session`, `user`, and `loading` via `useAuth()` hook. `App.tsx` renders `<LoginPage />` when `session === null`. Sign-out calls `supabase.auth.signOut()` from the NavBar.

**Data layer (`src/services/api.ts`):** All Supabase CRUD operations. Handles camelCase ↔ snake_case conversion between TypeScript models and Postgres columns. Import named functions (`getVehicles`, `addVehicle`, etc.) directly into components. Never import `db` — Dexie has been removed.

**Supabase client (`src/services/supabase.ts`):** Single client instance, reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from env. All queries are RLS-scoped to the authenticated user automatically.

**Reactivity (`@tanstack/react-query`):** All data fetching uses `useQuery`. All mutations call `queryClient.invalidateQueries()` after writes. Query keys: `['vehicles']`, `['plans']`, `['entries']`, `['fuel']`. Wrap new queries in the same pattern — no `useLiveQuery`.

**Models (`src/models/index.ts`):** TypeScript interfaces for `Vehicle`, `MaintenancePlan`, `MaintenanceEntry`, `FuelEntry`, plus the `MAINTENANCE_TYPES` constant array. All date fields are ISO strings, not `Date` objects. IDs are numbers (Postgres bigserial).

**camelCase ↔ snake_case column mapping:**

| TypeScript | SQL column |
|---|---|
| `vehicleId` | `vehicle_id` |
| `licensePlate` | `license_plate` |
| `currentMileage` | `current_mileage` |
| `purchaseDate` | `purchase_date` |
| `purchasePrice` | `purchase_price` |
| `intervalKm` | `interval_km` |
| `intervalMonths` | `interval_months` |
| `lastServiceDate` | `last_service_date` |
| `lastServiceMileage` | `last_service_mileage` |
| `totalPrice` | `total_price` |
| `serviceProvider` | `service_provider` |

**Business logic:**
- `src/utils/maintenance.ts` — calculates next due dates/mileage from a plan, determines overdue status
- `src/utils/ics.ts` — generates and triggers download of `.ics` calendar files

**Routing:** Three top-level routes (`/`, `/vehicles`, `/maintenance`) handled in `App.tsx` via `BrowserRouter`. Add new pages under `src/pages/` and register them there.

**Tailwind:** Imported via `@import "tailwindcss"` in `src/index.css`. No config file needed.

## Environment

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL (frontend-safe) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key (frontend-safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side only — never expose in frontend |
| `SUPABASE_PROJECT_REF` | Short project ID, used by Supabase CLI/MCP |
| `SUPABASE_ACCESS_TOKEN` | Personal access token for Supabase MCP |
| `VERCEL_TOKEN` | Vercel personal access token |
| `VERCEL_PROJECT_ID` | Vercel project ID (`prj_...`) |

All secrets live in `.env.local` (gitignored via `*.local`). `.mcp.json` is also gitignored — never commit it.

## Key Constraints

- Auth is required — all routes are behind the Supabase session gate.
- RLS is enforced server-side — users can only read/write their own rows.
- Maintenance triggers can be mileage-based, time-based, or both simultaneously.
- No Dexie / IndexedDB — do not re-introduce it.
