import { useState } from 'react';
import { db } from '../services/db';
import type { MaintenancePlan } from '../models';
import { MAINTENANCE_TYPES } from '../models';

interface Props {
  vehicleId: number;
  plan?: MaintenancePlan;
  onDone: () => void;
}

type F = {
  type: string; intervalKm: string; intervalMonths: string;
  lastServiceDate: string; lastServiceMileage: string;
};

function toForm(p?: MaintenancePlan): F {
  return {
    type: p?.type ?? MAINTENANCE_TYPES[0],
    intervalKm: p?.intervalKm?.toString() ?? '',
    intervalMonths: p?.intervalMonths?.toString() ?? '',
    lastServiceDate: p?.lastServiceDate ?? '',
    lastServiceMileage: p?.lastServiceMileage?.toString() ?? '',
  };
}

export default function MaintenancePlanForm({ vehicleId, plan, onDone }: Props) {
  const [f, setF] = useState<F>(() => toForm(plan));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field: keyof F) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setF(prev => ({ ...prev, [field]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.intervalKm && !f.intervalMonths) {
      setError('Set at least one interval (km or months).');
      return;
    }
    setSaving(true);
    const data: Omit<MaintenancePlan, 'id'> = {
      vehicleId,
      type: f.type,
      intervalKm: f.intervalKm ? parseInt(f.intervalKm) : undefined,
      intervalMonths: f.intervalMonths ? parseInt(f.intervalMonths) : undefined,
      lastServiceDate: f.lastServiceDate || undefined,
      lastServiceMileage: f.lastServiceMileage ? parseInt(f.lastServiceMileage) : undefined,
    };
    if (plan?.id != null) {
      await db.maintenancePlans.update(plan.id, data);
    } else {
      await db.maintenancePlans.add(data);
    }
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Maintenance Type *</label>
        <select
          value={f.type}
          onChange={set('type')}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {MAINTENANCE_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <NField label="Interval (km)" value={f.intervalKm} onChange={set('intervalKm')} placeholder="e.g. 10000" />
        <NField label="Interval (months)" value={f.intervalMonths} onChange={set('intervalMonths')} placeholder="e.g. 12" />
      </div>

      <div className="border-t border-gray-200 pt-4">
        <p className="text-xs text-gray-400 mb-3">Last service (to calculate next due)</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Last Service Date</label>
            <input
              type="date"
              value={f.lastServiceDate}
              onChange={set('lastServiceDate')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <NField label="Last Service Mileage (km)" value={f.lastServiceMileage} onChange={set('lastServiceMileage')} placeholder="e.g. 40000" />
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onDone} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {plan ? 'Save Changes' : 'Add Plan'}
        </button>
      </div>
    </form>
  );
}

function NField({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type="number"
        min="1"
        {...props}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
