import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getVehicles, getEntries, deleteEntry } from '../services/api';
import { formatDate, formatMileage, formatCurrency } from '../utils/format';
import Modal from '../components/Modal';
import MaintenanceEntryForm from '../components/MaintenanceEntryForm';

export default function Maintenance() {
  const [logOpen, setLogOpen] = useState(false);
  const [vehicleFilter, setVehicleFilter] = useState<string>('all');

  const queryClient = useQueryClient();
  const { data: vehicles = [] } = useQuery({ queryKey: ['vehicles'], queryFn: getVehicles });
  const { data: allEntries = [] } = useQuery({ queryKey: ['entries'], queryFn: getEntries });

  const vehicleMap = new Map(vehicles.map(v => [v.id!, v]));

  const entries = vehicleFilter === 'all'
    ? allEntries
    : allEntries.filter(e => e.vehicleId === parseInt(vehicleFilter));

  async function handleDelete(id: number) {
    if (confirm('Delete this entry?')) {
      await deleteEntry(id);
      queryClient.invalidateQueries({ queryKey: ['entries'] });
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-900">Service History</h1>
          <select
            value={vehicleFilter}
            onChange={e => setVehicleFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
          >
            <option value="all">All vehicles</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.make} {v.model} ({v.year})</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setLogOpen(true)}
          disabled={vehicles.length === 0}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          + Log Entry
        </button>
      </div>

      {/* Entry count */}
      <p className="text-xs text-gray-400 mb-3">
        {entries.length} entr{entries.length !== 1 ? 'ies' : 'y'}
      </p>

      {/* Empty state */}
      {entries.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 px-6 py-16 text-center">
          <p className="text-sm text-gray-400">
            {vehicles.length === 0
              ? 'Add a vehicle first, then log maintenance entries here.'
              : 'No entries yet. Log your first service entry.'}
          </p>
        </div>
      )}

      {/* Entries table */}
      {entries.length > 0 && (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <Th>Date</Th>
                <Th>Vehicle</Th>
                <Th>Title</Th>
                <Th>Category</Th>
                <Th>Mileage</Th>
                <Th>Cost</Th>
                <Th>Workshop</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => {
                const vehicle = vehicleMap.get(entry.vehicleId);
                return (
                  <tr key={entry.id} className="border-b border-gray-100 last:border-0 bg-white hover:bg-gray-50">
                    <Td className="text-gray-500 tabular-nums">{formatDate(entry.date)}</Td>
                    <Td className="font-medium text-gray-800">
                      {vehicle ? `${vehicle.make} ${vehicle.model}` : '—'}
                    </Td>
                    <Td className="text-gray-700">{entry.title}</Td>
                    <Td>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        entry.category === 'repair'
                          ? 'bg-orange-50 text-orange-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}>
                        {entry.category}
                      </span>
                    </Td>
                    <Td className="text-gray-500 tabular-nums">{formatMileage(entry.mileage)}</Td>
                    <Td className="text-gray-500 tabular-nums">{formatCurrency(entry.cost)}</Td>
                    <Td className="text-gray-400">{entry.serviceProvider ?? '—'}</Td>
                    <Td>
                      <button
                        onClick={() => handleDelete(entry.id!)}
                        className="text-gray-300 hover:text-red-500 px-1"
                      >
                        ×
                      </button>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Log entry modal */}
      {logOpen && (
        <Modal title="Log Maintenance Entry" onClose={() => setLogOpen(false)} size="lg">
          <MaintenanceEntryForm
            vehicles={vehicles}
            onDone={() => setLogOpen(false)}
          />
        </Modal>
      )}
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">{children}</th>;
}

function Td({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-sm ${className}`}>{children}</td>;
}
