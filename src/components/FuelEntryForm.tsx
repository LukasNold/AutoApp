import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { addFuelEntry } from '../services/api';
import type { Vehicle } from '../models';
import { today } from '../utils/format';

interface Props {
  vehicles: Vehicle[];
  onDone: () => void;
}

export default function FuelEntryForm({ vehicles, onDone }: Props) {
  const queryClient = useQueryClient();
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id?.toString() ?? '');
  const [mileage, setMileage] = useState('');
  const [date, setDate] = useState(today());
  const [liters, setLiters] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vehicleId || !mileage) return;
    setSaving(true);

    const km = parseInt(mileage);
    const vid = parseInt(vehicleId);

    await addFuelEntry({
      vehicleId: vid,
      date,
      mileage: km,
      liters: liters ? parseFloat(liters) : undefined,
      totalPrice: totalPrice ? parseFloat(totalPrice) : undefined,
    });
    queryClient.invalidateQueries({ queryKey: ['fuel'] });
    queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    onDone();
  }

  const pricePerLiter =
    liters && totalPrice && parseFloat(liters) > 0
      ? (parseFloat(totalPrice) / parseFloat(liters)).toFixed(3)
      : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Required fields */}
      <div className="grid grid-cols-2 gap-3">
        <div className={vehicles.length === 1 ? 'opacity-60' : ''}>
          <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle *</label>
          <select
            value={vehicleId}
            onChange={e => setVehicleId(e.target.value)}
            disabled={vehicles.length === 1}
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
          >
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>
                {v.make} {v.model} ({v.year})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
            max={today()}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Mileage (km) *</label>
        <input
          type="number"
          value={mileage}
          onChange={e => setMileage(e.target.value)}
          required
          min="0"
          placeholder="e.g. 45230"
          autoFocus
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Optional fields */}
      <div className="border-t border-gray-200 pt-4">
        <p className="text-xs text-gray-400 mb-3">Optional</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Liters</label>
            <input
              type="number"
              value={liters}
              onChange={e => setLiters(e.target.value)}
              min="0"
              step="0.01"
              placeholder="e.g. 42.5"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Total Price (€)</label>
            <input
              type="number"
              value={totalPrice}
              onChange={e => setTotalPrice(e.target.value)}
              min="0"
              step="0.01"
              placeholder="e.g. 68.40"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        {pricePerLiter && (
          <p className="mt-2 text-xs text-gray-400">
            → {pricePerLiter} €/L
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onDone}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Log Fuel
        </button>
      </div>
    </form>
  );
}
