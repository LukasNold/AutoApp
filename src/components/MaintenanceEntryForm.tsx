import { useState } from 'react';
import { logEntry } from '../services/maintenanceService';
import type { Vehicle } from '../models';
import { MAINTENANCE_TYPES } from '../models';
import { today } from '../utils/format';

interface Props {
  vehicles: Vehicle[];
  defaultVehicleId?: number;
  onDone: () => void;
}

type F = {
  vehicleId: string; date: string; type: string; category: string;
  title: string; mileage: string; cost: string; serviceProvider: string; notes: string;
};

export default function MaintenanceEntryForm({ vehicles, defaultVehicleId, onDone }: Props) {
  const [f, setF] = useState<F>({
    vehicleId: defaultVehicleId?.toString() ?? (vehicles[0]?.id?.toString() ?? ''),
    date: today(),
    type: MAINTENANCE_TYPES[0],
    category: 'maintenance',
    title: MAINTENANCE_TYPES[0],
    mileage: '',
    cost: '',
    serviceProvider: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const set = (field: keyof F) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    setF(prev => {
      const next = { ...prev, [field]: value };
      // Auto-fill title when type changes
      if (field === 'type') next.title = value;
      return next;
    });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.vehicleId || !f.mileage) return;
    setSaving(true);
    await logEntry({
      vehicleId: parseInt(f.vehicleId),
      date: f.date,
      type: f.type,
      category: f.category,
      title: f.title.trim() || f.type,
      mileage: parseInt(f.mileage),
      cost: f.cost ? parseFloat(f.cost) : undefined,
      serviceProvider: f.serviceProvider.trim() || undefined,
      notes: f.notes.trim() || undefined,
    });
    onDone();
  }

  const locked = defaultVehicleId != null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className={locked ? 'opacity-60' : ''}>
          <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle *</label>
          <select
            value={f.vehicleId}
            onChange={set('vehicleId')}
            disabled={locked}
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
          >
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.make} {v.model} ({v.year})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
          <input
            type="date"
            value={f.date}
            onChange={set('date')}
            required
            max={today()}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Type *</label>
          <select
            value={f.type}
            onChange={set('type')}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MAINTENANCE_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Category *</label>
          <select
            value={f.category}
            onChange={set('category')}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="maintenance">Maintenance</option>
            <option value="repair">Repair</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
          <input
            type="text"
            value={f.title}
            onChange={set('title')}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Mileage (km) *</label>
          <input
            type="number"
            value={f.mileage}
            onChange={set('mileage')}
            required
            min="0"
            placeholder="e.g. 45230"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Cost (€)</label>
          <input
            type="number"
            value={f.cost}
            onChange={set('cost')}
            min="0"
            step="0.01"
            placeholder="e.g. 89.00"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Workshop / Provider</label>
          <input
            type="text"
            value={f.serviceProvider}
            onChange={set('serviceProvider')}
            placeholder="e.g. City Auto Service"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
        <textarea
          value={f.notes}
          onChange={set('notes')}
          rows={2}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Optional notes…"
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onDone} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          Log Entry
        </button>
      </div>
    </form>
  );
}
