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

**Stack:** React + TypeScript, Vite, Tailwind CSS v4 (via `@tailwindcss/vite` plugin — no `tailwind.config.js`), Dexie.js for IndexedDB, React Router v6.

**Data layer (`src/services/db.ts`):** Single Dexie database instance (`CarMaintenanceDB`) with three tables: `vehicles`, `maintenancePlans`, `maintenanceEntries`. All IDs are auto-incremented integers. Import `db` directly into components or hooks — no repository abstraction layer.

**Models (`src/models/index.ts`):** TypeScript interfaces for `Vehicle`, `MaintenancePlan`, `MaintenanceEntry`, plus the `MAINTENANCE_TYPES` constant array. All date fields are ISO strings, not `Date` objects.

**Business logic:**
- `src/utils/maintenance.ts` — calculates next due dates/mileage from a plan, determines overdue status
- `src/utils/ics.ts` — generates and triggers download of `.ics` calendar files

**Routing:** Three top-level routes (`/`, `/vehicles`, `/maintenance`) handled in `App.tsx` via `BrowserRouter`. Add new pages under `src/pages/` and register them there.

**Tailwind:** Imported via `@import "tailwindcss"` in `src/index.css`. No config file needed.

## Key Constraints

- No backend, no auth — fully local, offline-first via IndexedDB.
- Maintenance triggers can be mileage-based, time-based, or both simultaneously.
