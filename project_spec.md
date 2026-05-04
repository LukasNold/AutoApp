# Car Maintenance Tracker – Project Specification

## 1. Overview

### Purpose
Track maintenance, mileage, and costs for multiple vehicles in a centralized web application, accessible from any device.

### Scope
- Personal-use application
- Supports multiple vehicles
- Multi-device access via cloud sync
- Focus on simplicity and extensibility

---

## 2. Platform & Technology

### Platform
- Web application hosted on Vercel, accessible from any browser on any device

### Frontend
- React + TypeScript
- Vite
- Tailwind CSS v4
- React Query (`@tanstack/react-query`) for data fetching and cache invalidation

### Backend
- Supabase (PostgreSQL + Auth + Row Level Security)
- All data scoped per user via RLS — no row is accessible without a valid session

### Auth
- Email/password via Supabase Auth (`@supabase/auth-ui-react`)
- Session managed app-wide through `AuthContext`

### Storage
- Supabase PostgreSQL (cloud, per-user RLS)
- Four tables: `vehicles`, `maintenance_plans`, `maintenance_entries`, `fuel_entries`

### Hosting
- Vercel (auto-deploys from GitHub `master` branch)

### Calendar Integration
- Generate downloadable `.ics` files for calendar import

---

## 3. Core Features

### 3.1 Vehicle Management
- Add / edit / delete vehicles
- Cascade delete: removing a vehicle removes all its plans, entries, and fuel logs

#### Vehicle Data
- Make, Model, Year
- VIN
- License plate
- Purchase date & price
- Current mileage
- Notes

---

### 3.2 Maintenance Tracking

#### Predefined Maintenance Types
- Oil change
- Tire change
- Brake service
- Inspection (e.g. TÜV)

#### Maintenance Scheduling
Each maintenance plan supports:
- Mileage-based trigger (e.g. every 10,000 km)
- Time-based trigger (e.g. every 12 months)
- Combination of both

#### Maintenance Plans
Each plan includes:
- Maintenance type
- Interval (km and/or months)
- Last service date & mileage (auto-updated when a matching entry is logged)

---

### 3.3 Maintenance Entries (History)

Each entry includes:
- Title
- Category (maintenance / repair)
- Maintenance type
- Date & mileage
- Cost
- Service provider (workshop)
- Notes

Logging an entry automatically:
- Updates `last_service_date` / `last_service_mileage` on the matching plan
- Bumps the vehicle's `current_mileage` if the entry mileage is higher

---

### 3.4 Fuel Tracking

Each fuel entry includes:
- Date & mileage
- Liters
- Total price (price per litre calculated in-app)

Logging a fuel entry automatically bumps the vehicle's `current_mileage` if higher.

---

### 3.5 Calendar Support

Generates calendar events for upcoming maintenance.

- Title (e.g. "Oil Change – VW Golf")
- Due date
- Vehicle description
- Downloadable `.ics` file

---

### 3.6 Dashboard

Displays:
- Stat cards: vehicle count, plan count, overdue count, year-to-date spend
- Maintenance status table (all plans, sorted overdue-first)
- Recent service entries (last 6)

---

## 4. Data Model

### Vehicle
| Field | Type | Notes |
|---|---|---|
| `id` | number | Postgres bigserial |
| `make` / `model` / `year` | string / number | required |
| `vin` | string | optional |
| `licensePlate` | string | optional |
| `purchaseDate` / `purchasePrice` | string / number | optional |
| `currentMileage` | number | auto-bumped on entry/fuel log |
| `notes` | string | optional |

### MaintenancePlan
| Field | Type | Notes |
|---|---|---|
| `id` | number | |
| `vehicleId` | number | FK → vehicles |
| `type` | string | from MAINTENANCE_TYPES |
| `intervalKm` / `intervalMonths` | number | at least one required |
| `lastServiceDate` / `lastServiceMileage` | string / number | auto-updated |

### MaintenanceEntry
| Field | Type | Notes |
|---|---|---|
| `id` | number | |
| `vehicleId` | number | FK → vehicles |
| `title` / `category` / `type` | string | |
| `date` | string | ISO date |
| `mileage` | number | |
| `cost` / `serviceProvider` / `notes` | mixed | optional |

### FuelEntry
| Field | Type | Notes |
|---|---|---|
| `id` | number | |
| `vehicleId` | number | FK → vehicles |
| `date` | string | ISO date |
| `mileage` | number | |
| `liters` / `totalPrice` | number | optional |

---

## 5. User Flow

1. User signs up / logs in (email + password)
2. User adds vehicles
3. User defines maintenance plans per vehicle
4. User logs maintenance entries and fuel stops
5. App calculates overdue status and upcoming due dates
6. User exports calendar events as `.ics`
7. Data is available on any device after login

---

## 6. Project Structure

```
/src
  /components      — reusable UI (forms, modals, NavBar, VehicleDetail)
  /context         — AuthContext (Supabase session)
  /pages           — Dashboard, Vehicles, Maintenance, LoginPage
  /services        — supabase.ts (client), api.ts (all CRUD functions)
  /models          — TypeScript interfaces + MAINTENANCE_TYPES
  /utils           — maintenance calculations, .ics generation, formatting
```

---

## 7. Future Enhancements

- Google OAuth sign-in
- Custom maintenance types (user-defined)
- File uploads (invoices / receipts)
- Cost analytics: cost per km, monthly spend charts
- Direct calendar integration (Google / Apple CalDAV)
- Mobile PWA (installable on phone home screen)
- Supabase Realtime for live multi-device sync

---

## 8. Key Design Principles

- Simple and fast UI
- Data-first architecture
- Cloud-native — data is always in sync across devices
- Easy extensibility for future features
