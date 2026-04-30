import Dexie, { type EntityTable } from 'dexie';
import type { Vehicle, MaintenancePlan, MaintenanceEntry } from '../models';

const db = new Dexie('CarMaintenanceDB') as Dexie & {
  vehicles: EntityTable<Vehicle, 'id'>;
  maintenancePlans: EntityTable<MaintenancePlan, 'id'>;
  maintenanceEntries: EntityTable<MaintenanceEntry, 'id'>;
};

db.version(1).stores({
  vehicles: '++id, make, model, year, licensePlate',
  maintenancePlans: '++id, vehicleId, type',
  maintenanceEntries: '++id, vehicleId, date, type, category',
});

export { db };
