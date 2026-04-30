import { db } from './db';
import type { MaintenanceEntry } from '../models';

export async function logEntry(entry: Omit<MaintenanceEntry, 'id'>): Promise<number> {
  const entryId = await db.maintenanceEntries.add(entry);

  // Auto-update the matching maintenance plan for this vehicle + type
  const plan = await db.maintenancePlans
    .where('vehicleId').equals(entry.vehicleId)
    .and(p => p.type === entry.type)
    .first();

  if (plan?.id != null) {
    await db.maintenancePlans.update(plan.id, {
      lastServiceDate: entry.date,
      lastServiceMileage: entry.mileage,
    });
  }

  // Bump vehicle's current mileage if the entry mileage is higher
  const vehicle = await db.vehicles.get(entry.vehicleId);
  if (vehicle?.id != null && entry.mileage > vehicle.currentMileage) {
    await db.vehicles.update(vehicle.id, { currentMileage: entry.mileage });
  }

  return entryId as number;
}

export async function deleteEntry(id: number): Promise<void> {
  await db.maintenanceEntries.delete(id);
}
