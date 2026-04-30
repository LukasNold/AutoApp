import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { addVehicle, updateVehicle } from '../services/api';
import type { Vehicle } from '../models';
import { today } from '../utils/format';

interface Props {
  vehicle?: Vehicle;
  onDone: () => void;
}

type F = {
  make: string; model: string; year: string; vin: string;
  licensePlate: string; purchaseDate: string; purchasePrice: string;
  currentMileage: string; notes: string;
};

function toForm(v?: Vehicle): F {
  return {
    make: v?.make ?? '',
    model: v?.model ?? '',
    year: v?.year?.toString() ?? new Date().getFullYear().toString(),
    vin: v?.vin ?? '',
    licensePlate: v?.licensePlate ?? '',
    purchaseDate: v?.purchaseDate ?? '',
    purchasePrice: v?.purchasePrice?.toString() ?? '',
    currentMileage: v?.currentMileage?.toString() ?? '0',
    notes: v?.notes ?? '',
  };
}

export default function VehicleForm({ vehicle, onDone }: Props) {
  const [f, setF] = useState<F>(() => toForm(vehicle));
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const set = (field: keyof F) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF(prev => ({ ...prev, [field]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const data: Omit<Vehicle, 'id'> = {
      make: f.make.trim(),
      model: f.model.trim(),
      year: parseInt(f.year),
      vin: f.vin.trim() || undefined,
      licensePlate: f.licensePlate.trim() || undefined,
      purchaseDate: f.purchaseDate || undefined,
      purchasePrice: f.purchasePrice ? parseFloat(f.purchasePrice) : undefined,
      currentMileage: parseInt(f.currentMileage) || 0,
      notes: f.notes.trim() || undefined,
    };
    if (vehicle?.id != null) {
      await updateVehicle(vehicle.id, data);
    } else {
      await addVehicle(data);
    }
    await queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Make *" value={f.make} onChange={set('make')} required placeholder="e.g. Volkswagen" />
        <Field label="Model *" value={f.model} onChange={set('model')} required placeholder="e.g. Golf" />
        <Field label="Year *" value={f.year} onChange={set('year')} required type="number" min="1900" max={new Date().getFullYear() + 1} />
        <Field label="Current Mileage (km) *" value={f.currentMileage} onChange={set('currentMileage')} required type="number" min="0" />
        <Field label="License Plate" value={f.licensePlate} onChange={set('licensePlate')} placeholder="e.g. AB-CD 1234" />
        <Field label="VIN" value={f.vin} onChange={set('vin')} placeholder="17-char VIN" />
        <Field label="Purchase Date" value={f.purchaseDate} onChange={set('purchaseDate')} type="date" max={today()} />
        <Field label="Purchase Price (€)" value={f.purchasePrice} onChange={set('purchasePrice')} type="number" min="0" step="0.01" />
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
          {vehicle ? 'Save Changes' : 'Add Vehicle'}
        </button>
      </div>
    </form>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        {...props}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
