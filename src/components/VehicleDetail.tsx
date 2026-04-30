import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getPlans, getEntries, deletePlan, deleteEntry } from '../services/api';
import type { Vehicle, MaintenancePlan } from '../models';
import { getNextDueDate, getNextDueMileage, isOverdue } from '../utils/maintenance';
import { formatDate, formatMileage, formatCurrency } from '../utils/format';
import { generateICS, downloadICS } from '../utils/ics';
import MaintenancePlanForm from './MaintenancePlanForm';
import MaintenanceEntryForm from './MaintenanceEntryForm';
import Modal from './Modal';

interface Props {
  vehicle: Vehicle;
}

type Tab = 'plans' | 'history';

function planDueText(plan: MaintenancePlan): string {
  const d = getNextDueDate(plan);
  const km = getNextDueMileage(plan);
  if (d && km) return `${formatDate(d.toISOString().slice(0, 10))} or ${formatMileage(km)}`;
  if (d) return formatDate(d.toISOString().slice(0, 10));
  if (km) return formatMileage(km);
  return 'No schedule';
}

export default function VehicleDetail({ vehicle }: Props) {
  const [tab, setTab] = useState<Tab>('plans');
  const [editingPlan, setEditingPlan] = useState<MaintenancePlan | null | 'new'>(null);
  const [addingEntry, setAddingEntry] = useState(false);

  const queryClient = useQueryClient();
  const { data: allPlans = [] } = useQuery({ queryKey: ['plans'], queryFn: getPlans });
  const { data: allEntries = [] } = useQuery({ queryKey: ['entries'], queryFn: getEntries });

  const plans = allPlans.filter(p => p.vehicleId === vehicle.id);
  const entries = [...allEntries.filter(e => e.vehicleId === vehicle.id)]
    .sort((a, b) => b.date.localeCompare(a.date));

  async function handleDeletePlan(id: number) {
    if (confirm('Delete this maintenance plan?')) {
      await deletePlan(id);
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    }
  }

  async function handleDeleteEntry(id: number) {
    if (confirm('Delete this entry?')) {
      await deleteEntry(id);
      queryClient.invalidateQueries({ queryKey: ['entries'] });
    }
  }

  function exportICS(plan: MaintenancePlan) {
    const dueDate = getNextDueDate(plan);
    if (!dueDate) return;
    const content = generateICS(
      `${plan.type} – ${vehicle.make} ${vehicle.model}`,
      dueDate,
      `Vehicle: ${vehicle.make} ${vehicle.model} (${vehicle.year})\nLicense: ${vehicle.licensePlate ?? '—'}`
    );
    downloadICS(`${vehicle.make}-${vehicle.model}-${plan.type}.ics`, content);
  }

  return (
    <div>
      {/* Vehicle header */}
      <div className="flex items-start justify-between mb-5 pb-4 border-b border-gray-200">
        <div>
          <p className="text-lg font-semibold text-gray-900">{vehicle.make} {vehicle.model} {vehicle.year}</p>
          <p className="text-sm text-gray-500">{vehicle.licensePlate ?? '—'} · {formatMileage(vehicle.currentMileage)}</p>
        </div>
        <div className="text-right text-xs text-gray-400">
          {plans.length} plan{plans.length !== 1 ? 's' : ''} · {entries.length} entr{entries.length !== 1 ? 'ies' : 'y'}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-lg">
        {(['plans', 'history'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'plans' ? 'Maintenance Plans' : 'Service History'}
          </button>
        ))}
      </div>

      {/* Plans tab */}
      {tab === 'plans' && (
        <div className="space-y-2">
          {plans.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">No plans yet. Add one below.</p>
          )}
          {plans.map(plan => {
            const overdue = isOverdue(plan, vehicle);
            const dueD = getNextDueDate(plan);
            return (
              <div
                key={plan.id}
                className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
                  overdue ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div>
                  <p className={`text-sm font-medium ${overdue ? 'text-red-700' : 'text-gray-800'}`}>
                    {plan.type}
                    {overdue && <span className="ml-2 text-xs font-normal uppercase text-red-500">Overdue</span>}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Next: {planDueText(plan)}
                    {plan.lastServiceDate && ` · Last: ${formatDate(plan.lastServiceDate)}`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {dueD && (
                    <button onClick={() => exportICS(plan)} title="Export .ics" className="px-2 py-1 text-xs text-gray-500 hover:text-blue-600">
                      .ics
                    </button>
                  )}
                  <button onClick={() => setEditingPlan(plan)} className="px-2 py-1 text-xs text-gray-500 hover:text-blue-600">
                    Edit
                  </button>
                  <button onClick={() => handleDeletePlan(plan.id!)} className="px-2 py-1 text-xs text-gray-500 hover:text-red-600">
                    ×
                  </button>
                </div>
              </div>
            );
          })}
          <button
            onClick={() => setEditingPlan('new')}
            className="w-full mt-2 py-2 text-sm text-blue-600 border border-dashed border-blue-300 rounded-lg hover:bg-blue-50"
          >
            + Add Plan
          </button>
        </div>
      )}

      {/* History tab */}
      {tab === 'history' && (
        <div>
          <button
            onClick={() => setAddingEntry(true)}
            className="mb-3 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            + Log Entry
          </button>
          {entries.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">No entries yet.</p>
          )}
          <div className="space-y-1">
            {entries.map(entry => (
              <div key={entry.id} className="flex items-center justify-between px-4 py-3 rounded-lg border border-gray-200 bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-800">{entry.title}</p>
                  <p className="text-xs text-gray-400">
                    {formatDate(entry.date)} · {formatMileage(entry.mileage)}
                    {entry.cost != null && ` · ${formatCurrency(entry.cost)}`}
                    {entry.serviceProvider && ` · ${entry.serviceProvider}`}
                  </p>
                </div>
                <button onClick={() => handleDeleteEntry(entry.id!)} className="px-2 py-1 text-xs text-gray-400 hover:text-red-600">
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {editingPlan != null && (
        <Modal
          title={editingPlan === 'new' ? 'Add Maintenance Plan' : 'Edit Plan'}
          onClose={() => setEditingPlan(null)}
        >
          <MaintenancePlanForm
            vehicleId={vehicle.id!}
            plan={editingPlan === 'new' ? undefined : editingPlan}
            onDone={() => setEditingPlan(null)}
          />
        </Modal>
      )}
      {addingEntry && (
        <Modal title="Log Maintenance Entry" onClose={() => setAddingEntry(false)}>
          <MaintenanceEntryForm
            vehicles={[vehicle]}
            defaultVehicleId={vehicle.id}
            onDone={() => setAddingEntry(false)}
          />
        </Modal>
      )}
    </div>
  );
}
