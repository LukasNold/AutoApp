import type { MaintenancePlan, Vehicle } from '../models';

export function getNextDueDate(plan: MaintenancePlan): Date | null {
  if (!plan.lastServiceDate || !plan.intervalMonths) return null;
  const last = new Date(plan.lastServiceDate);
  last.setMonth(last.getMonth() + plan.intervalMonths);
  return last;
}

export function getNextDueMileage(plan: MaintenancePlan): number | null {
  if (plan.lastServiceMileage == null || !plan.intervalKm) return null;
  return plan.lastServiceMileage + plan.intervalKm;
}

export function isOverdue(plan: MaintenancePlan, vehicle: Vehicle): boolean {
  const dueDate = getNextDueDate(plan);
  const dueMileage = getNextDueMileage(plan);
  const now = new Date();

  if (dueDate && dueDate < now) return true;
  if (dueMileage != null && vehicle.currentMileage >= dueMileage) return true;
  return false;
}
