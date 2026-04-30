# 🚗 Car Maintenance Tracker – Project Specification

## 1. Overview

### Purpose
Track maintenance, mileage, and costs for multiple vehicles in a centralized web application.

### Scope
- Personal-use application
- Supports multiple vehicles (≥2 from MVP)
- Focus on simplicity and extensibility

---

## 2. Platform & Technology

### Platform
- Web application (runs in browser on laptop)

### Frontend
- React + TypeScript
- Tailwind CSS

### Backend
- No backend in MVP (frontend-only application)

### Storage
- IndexedDB using Dexie.js

### Calendar Integration
- Generate downloadable `.ics` files for calendar import

---

## 3. Core Features (MVP)

### 3.1 Vehicle Management
- Add / edit / delete vehicles

#### Vehicle Data
- Make
- Model
- Year
- VIN
- License plate
- Purchase date
- Purchase price
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
- Last service date
- Last service mileage

---

### 3.3 Maintenance Entries (History)

Each entry includes:
- Title
- Category (e.g. maintenance, repair)
- Maintenance type
- Date
- Mileage
- Cost
- Service provider (workshop)
- Notes

---

### 3.4 Calendar Support

The app generates calendar events for upcoming maintenance.

#### Event Data
- Title (e.g. "Oil Change Due")
- Due date
- Description (vehicle + details)

#### Output
- Downloadable `.ics` file

---

### 3.5 Dashboard

Displays:
- List of vehicles
- Upcoming maintenance
- Overdue maintenance
- Recent maintenance entries

---

## 4. Data Model

### Vehicle
```json
{
  "id": "string",
  "make": "string",
  "model": "string",
  "year": "number",
  "vin": "string",
  "licensePlate": "string",
  "purchaseDate": "date",
  "purchasePrice": "number",
  "currentMileage": "number",
  "notes": "string"
}
MaintenancePlan
{
  "id": "string",
  "vehicleId": "string",
  "type": "string",
  "intervalKm": "number",
  "intervalMonths": "number",
  "lastServiceDate": "date",
  "lastServiceMileage": "number"
}
MaintenanceEntry
{
  "id": "string",
  "vehicleId": "string",
  "title": "string",
  "category": "string",
  "type": "string",
  "date": "date",
  "mileage": "number",
  "cost": "number",
  "serviceProvider": "string",
  "notes": "string"
}
5. Storage Strategy
IndexedDB via Dexie.js
Fully local data storage
No cloud sync in MVP
6. User Flow
User creates vehicles
User defines maintenance plans
User logs maintenance entries
App calculates upcoming maintenance
User exports calendar events as .ics
7. Out of Scope (MVP)
Authentication / user accounts
Cloud sync
Custom maintenance types
File uploads (receipts)
Mobile app
8. Future Enhancements
Mobile app (React Native)
Cloud sync & backup
Custom maintenance types
File upload (invoices)
Cost analytics:
Cost per km
Monthly expenses
Fuel tracking
Direct calendar integration (Google / Apple)
9. Project Structure
/src
  /components
  /pages
    - Dashboard
    - Vehicles
    - Maintenance
  /hooks
  /services
    - storage.ts
  /models
  /utils
10. Development Plan
Phase 1
Setup React + TypeScript project
Configure Tailwind CSS
Setup IndexedDB with Dexie
Implement vehicle CRUD
Phase 2
Implement maintenance plans
Implement maintenance entries
Phase 3
Dashboard with:
Upcoming maintenance
Overdue maintenance
Phase 4
Generate .ics calendar export
11. Key Design Principles
Simple and fast UI
Fully offline-capable
Data-first architecture
Easy extensibility for future features