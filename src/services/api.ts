import { supabase } from './supabase';
import type { Vehicle, MaintenancePlan, MaintenanceEntry, FuelEntry } from '../models';

// ─── camelCase ↔ snake_case adapters ─────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toVehicle(r: any): Vehicle {
  return {
    id: r.id,
    make: r.make,
    model: r.model,
    year: r.year,
    vin: r.vin ?? undefined,
    licensePlate: r.license_plate ?? undefined,
    purchaseDate: r.purchase_date ?? undefined,
    purchasePrice: r.purchase_price ?? undefined,
    currentMileage: r.current_mileage,
    notes: r.notes ?? undefined,
  };
}

function fromVehicle(v: Omit<Vehicle, 'id'>) {
  return {
    make: v.make,
    model: v.model,
    year: v.year,
    vin: v.vin ?? null,
    license_plate: v.licensePlate ?? null,
    purchase_date: v.purchaseDate ?? null,
    purchase_price: v.purchasePrice ?? null,
    current_mileage: v.currentMileage,
    notes: v.notes ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPlan(r: any): MaintenancePlan {
  return {
    id: r.id,
    vehicleId: r.vehicle_id,
    type: r.type,
    intervalKm: r.interval_km ?? undefined,
    intervalMonths: r.interval_months ?? undefined,
    lastServiceDate: r.last_service_date ?? undefined,
    lastServiceMileage: r.last_service_mileage ?? undefined,
  };
}

function fromPlan(p: Omit<MaintenancePlan, 'id'>) {
  return {
    vehicle_id: p.vehicleId,
    type: p.type,
    interval_km: p.intervalKm ?? null,
    interval_months: p.intervalMonths ?? null,
    last_service_date: p.lastServiceDate ?? null,
    last_service_mileage: p.lastServiceMileage ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toEntry(r: any): MaintenanceEntry {
  return {
    id: r.id,
    vehicleId: r.vehicle_id,
    title: r.title,
    category: r.category,
    type: r.type,
    date: r.date,
    mileage: r.mileage,
    cost: r.cost ?? undefined,
    serviceProvider: r.service_provider ?? undefined,
    notes: r.notes ?? undefined,
  };
}

function fromEntry(e: Omit<MaintenanceEntry, 'id'>) {
  return {
    vehicle_id: e.vehicleId,
    title: e.title,
    category: e.category,
    type: e.type,
    date: e.date,
    mileage: e.mileage,
    cost: e.cost ?? null,
    service_provider: e.serviceProvider ?? null,
    notes: e.notes ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toFuel(r: any): FuelEntry {
  return {
    id: r.id,
    vehicleId: r.vehicle_id,
    date: r.date,
    mileage: r.mileage,
    liters: r.liters ?? undefined,
    totalPrice: r.total_price ?? undefined,
  };
}

function fromFuel(f: Omit<FuelEntry, 'id'>) {
  return {
    vehicle_id: f.vehicleId,
    date: f.date,
    mileage: f.mileage,
    liters: f.liters ?? null,
    total_price: f.totalPrice ?? null,
  };
}

// ─── Vehicles ─────────────────────────────────────────────────────────────────

export async function getVehicles(): Promise<Vehicle[]> {
  const { data, error } = await supabase.from('vehicles').select('*').order('id');
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map(toVehicle);
}

export async function addVehicle(v: Omit<Vehicle, 'id'>): Promise<void> {
  const { error } = await supabase.from('vehicles').insert(fromVehicle(v));
  if (error) throw error;
}

export async function updateVehicle(id: number, v: Omit<Vehicle, 'id'>): Promise<void> {
  const { error } = await supabase.from('vehicles').update(fromVehicle(v)).eq('id', id);
  if (error) throw error;
}

export async function deleteVehicle(id: number): Promise<void> {
  const { error } = await supabase.from('vehicles').delete().eq('id', id);
  if (error) throw error;
}

// ─── Maintenance Plans ────────────────────────────────────────────────────────

export async function getPlans(): Promise<MaintenancePlan[]> {
  const { data, error } = await supabase.from('maintenance_plans').select('*').order('id');
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map(toPlan);
}

export async function addPlan(p: Omit<MaintenancePlan, 'id'>): Promise<void> {
  const { error } = await supabase.from('maintenance_plans').insert(fromPlan(p));
  if (error) throw error;
}

export async function updatePlan(id: number, p: Omit<MaintenancePlan, 'id'>): Promise<void> {
  const { error } = await supabase.from('maintenance_plans').update(fromPlan(p)).eq('id', id);
  if (error) throw error;
}

export async function deletePlan(id: number): Promise<void> {
  const { error } = await supabase.from('maintenance_plans').delete().eq('id', id);
  if (error) throw error;
}

// ─── Maintenance Entries ──────────────────────────────────────────────────────

export async function getEntries(): Promise<MaintenanceEntry[]> {
  const { data, error } = await supabase
    .from('maintenance_entries')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map(toEntry);
}

export async function logEntry(entry: Omit<MaintenanceEntry, 'id'>): Promise<void> {
  const { error } = await supabase.from('maintenance_entries').insert(fromEntry(entry));
  if (error) throw error;

  // Auto-update the matching maintenance plan
  const { data: plans } = await supabase
    .from('maintenance_plans')
    .select('id')
    .eq('vehicle_id', entry.vehicleId)
    .eq('type', entry.type)
    .limit(1);
  if (plans?.length) {
    await supabase
      .from('maintenance_plans')
      .update({ last_service_date: entry.date, last_service_mileage: entry.mileage })
      .eq('id', plans[0].id);
  }

  // Bump vehicle mileage if higher
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('current_mileage')
    .eq('id', entry.vehicleId)
    .single();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (vehicle && entry.mileage > (vehicle as any).current_mileage) {
    await supabase
      .from('vehicles')
      .update({ current_mileage: entry.mileage })
      .eq('id', entry.vehicleId);
  }
}

export async function deleteEntry(id: number): Promise<void> {
  const { error } = await supabase.from('maintenance_entries').delete().eq('id', id);
  if (error) throw error;
}

// ─── Fuel Entries ─────────────────────────────────────────────────────────────

export async function getFuelEntries(): Promise<FuelEntry[]> {
  const { data, error } = await supabase
    .from('fuel_entries')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map(toFuel);
}

export async function addFuelEntry(f: Omit<FuelEntry, 'id'>): Promise<void> {
  const { error } = await supabase.from('fuel_entries').insert(fromFuel(f));
  if (error) throw error;

  // Bump vehicle mileage if higher
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('current_mileage')
    .eq('id', f.vehicleId)
    .single();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (vehicle && f.mileage > (vehicle as any).current_mileage) {
    await supabase
      .from('vehicles')
      .update({ current_mileage: f.mileage })
      .eq('id', f.vehicleId);
  }
}
