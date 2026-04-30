export interface Vehicle {
  id?: number;
  make: string;
  model: string;
  year: number;
  vin?: string;
  licensePlate?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  currentMileage: number;
  notes?: string;
}

export interface MaintenancePlan {
  id?: number;
  vehicleId: number;
  type: string;
  intervalKm?: number;
  intervalMonths?: number;
  lastServiceDate?: string;
  lastServiceMileage?: number;
}

export interface MaintenanceEntry {
  id?: number;
  vehicleId: number;
  title: string;
  category: string;
  type: string;
  date: string;
  mileage: number;
  cost?: number;
  serviceProvider?: string;
  notes?: string;
}

export const MAINTENANCE_TYPES = [
  'Oil Change',
  'Tire Change',
  'Brake Service',
  'Inspection',
] as const;

export type MaintenanceType = (typeof MAINTENANCE_TYPES)[number];
