import Dexie, { type EntityTable } from 'dexie';
import type { Vehicle, MaintenancePlan, MaintenanceEntry, FuelEntry } from '../models';

const db = new Dexie('CarMaintenanceDB') as Dexie & {
  vehicles: EntityTable<Vehicle, 'id'>;
  maintenancePlans: EntityTable<MaintenancePlan, 'id'>;
  maintenanceEntries: EntityTable<MaintenanceEntry, 'id'>;
  fuelEntries: EntityTable<FuelEntry, 'id'>;
};

db.version(1).stores({
  vehicles: '++id, make, model, year, licensePlate',
  maintenancePlans: '++id, vehicleId, type',
  maintenanceEntries: '++id, vehicleId, date, type, category',
});

db.version(2).stores({
  vehicles: '++id, make, model, year, licensePlate',
  maintenancePlans: '++id, vehicleId, type',
  maintenanceEntries: '++id, vehicleId, date, type, category',
  fuelEntries: '++id, vehicleId, date',
});

export { db };
