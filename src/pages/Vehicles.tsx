import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import type { Vehicle } from '../models';
import { isOverdue } from '../utils/maintenance';
import { formatMileage } from '../utils/format';
import Modal from '../components/Modal';
import VehicleForm from '../components/VehicleForm';
import VehicleDetail from '../components/VehicleDetail';

export default function Vehicles() {
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [detail, setDetail] = useState<Vehicle | null>(null);

  const vehicles = useLiveQuery(() => db.vehicles.toArray()) ?? [];
  const plans = useLiveQuery(() => db.maintenancePlans.toArray()) ?? [];
  const entries = useLiveQuery(() => db.maintenanceEntries.toArray()) ?? [];

  async function deleteVehicle(vehicle: Vehicle) {
    if (!confirm(`Delete ${vehicle.make} ${vehicle.model}? All plans and entries will also be deleted.`)) return;
    await db.transaction('rw', db.vehicles, db.maintenancePlans, db.maintenanceEntries, async () => {
      await db.maintenancePlans.where('vehicleId').equals(vehicle.id!).delete();
      await db.maintenanceEntries.where('vehicleId').equals(vehicle.id!).delete();
      await db.vehicles.delete(vehicle.id!);
    });
  }

  function vehiclePlans(vehicleId: number) {
    return plans.filter(p => p.vehicleId === vehicleId);
  }

  function vehicleEntries(vehicleId: number) {
    return entries.filter(e => e.vehicleId === vehicleId);
  }

  function overdueCount(vehicle: Vehicle) {
    return vehiclePlans(vehicle.id!).filter(p => isOverdue(p, vehicle)).length;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Vehicles</h1>
        <button
          onClick={() => setAddOpen(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          + Add Vehicle
        </button>
      </div>

      {/* Empty state */}
      {vehicles.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 px-6 py-16 text-center">
          <p className="text-sm font-medium text-gray-500 mb-1">No vehicles yet</p>
          <p className="text-xs text-gray-400 mb-4">Add your first vehicle to get started.</p>
          <button
            onClick={() => setAddOpen(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            + Add Vehicle
          </button>
        </div>
      )}

      {/* Vehicle grid */}
      <div className="grid grid-cols-3 gap-4">
        {vehicles.map(vehicle => {
          const overdue = overdueCount(vehicle);
          const planCount = vehiclePlans(vehicle.id!).length;
          const entryCount = vehicleEntries(vehicle.id!).length;
          return (
            <div
              key={vehicle.id}
              className={`bg-white rounded-xl border p-4 flex flex-col gap-3 ${
                overdue > 0 ? 'border-red-200' : 'border-gray-200'
              }`}
            >
              {/* Card header */}
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{vehicle.make} {vehicle.model}</p>
                    <p className="text-xs text-gray-400">{vehicle.year}</p>
                  </div>
                  {overdue > 0 && (
                    <span className="flex items-center gap-1 text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                      {overdue} overdue
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                  <span>{vehicle.licensePlate ?? '—'}</span>
                  <span>·</span>
                  <span>{formatMileage(vehicle.currentMileage)}</span>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex gap-4 text-xs text-gray-400 border-t border-gray-50 pt-2">
                <span>{planCount} plan{planCount !== 1 ? 's' : ''}</span>
                <span>{entryCount} entr{entryCount !== 1 ? 'ies' : 'y'}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setDetail(vehicle)}
                  className="flex-1 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Details
                </button>
                <button
                  onClick={() => setEditing(vehicle)}
                  className="px-3 py-1.5 text-xs text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteVehicle(vehicle)}
                  className="px-3 py-1.5 text-xs text-gray-400 border border-gray-200 rounded-lg hover:text-red-600 hover:border-red-200"
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add vehicle modal */}
      {addOpen && (
        <Modal title="Add Vehicle" onClose={() => setAddOpen(false)} size="lg">
          <VehicleForm onDone={() => setAddOpen(false)} />
        </Modal>
      )}

      {/* Edit vehicle modal */}
      {editing && (
        <Modal title="Edit Vehicle" onClose={() => setEditing(null)} size="lg">
          <VehicleForm vehicle={editing} onDone={() => setEditing(null)} />
        </Modal>
      )}

      {/* Vehicle detail modal */}
      {detail && (
        <Modal
          title={`${detail.make} ${detail.model}`}
          onClose={() => setDetail(null)}
          size="xl"
        >
          <VehicleDetail
            vehicle={detail}
            onVehicleUpdated={() => {
              // useLiveQuery auto-refreshes; just sync the detail vehicle ref
              db.vehicles.get(detail.id!).then(v => v && setDetail(v));
            }}
          />
        </Modal>
      )}
    </div>
  );
}
