import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { getNextDueDate, getNextDueMileage, isOverdue } from '../utils/maintenance';
import { formatDate, formatMileage, formatCurrency } from '../utils/format';
import type { MaintenancePlan, Vehicle, MaintenanceEntry } from '../models';

type PlanRow = {
  plan: MaintenancePlan;
  vehicle: Vehicle;
  overdue: boolean;
  dueText: string;
  lastText: string;
};

function buildRows(plans: MaintenancePlan[], vehicles: Vehicle[]): PlanRow[] {
  const vehicleMap = new Map(vehicles.map(v => [v.id!, v]));
  return plans
    .map(plan => {
      const vehicle = vehicleMap.get(plan.vehicleId);
      if (!vehicle) return null;
      const dueDate = getNextDueDate(plan);
      const dueMileage = getNextDueMileage(plan);
      const overdue = isOverdue(plan, vehicle);

      let dueText = '—';
      if (dueDate && dueMileage) {
        dueText = `${formatDate(dueDate.toISOString().slice(0, 10))} or ${formatMileage(dueMileage)}`;
      } else if (dueDate) {
        dueText = formatDate(dueDate.toISOString().slice(0, 10));
      } else if (dueMileage) {
        dueText = formatMileage(dueMileage);
      }

      const lastText = plan.lastServiceDate
        ? `${formatDate(plan.lastServiceDate)}${plan.lastServiceMileage != null ? ` · ${formatMileage(plan.lastServiceMileage)}` : ''}`
        : '—';

      return { plan, vehicle, overdue, dueText, lastText };
    })
    .filter((r): r is PlanRow => r !== null)
    .sort((a, b) => {
      if (a.overdue && !b.overdue) return -1;
      if (!a.overdue && b.overdue) return 1;
      return 0;
    });
}

function thisYear(entries: MaintenanceEntry[]) {
  const y = new Date().getFullYear().toString();
  return entries.filter(e => e.date.startsWith(y));
}

function totalCost(entries: MaintenanceEntry[]) {
  return entries.reduce((s, e) => s + (e.cost ?? 0), 0);
}

export default function Dashboard() {
  const vehicles = useLiveQuery(() => db.vehicles.toArray()) ?? [];
  const plans = useLiveQuery(() => db.maintenancePlans.toArray()) ?? [];
  const entries = useLiveQuery(() => db.maintenanceEntries.toArray()) ?? [];

  const rows = buildRows(plans, vehicles);
  const overdueCount = rows.filter(r => r.overdue).length;
  const yearEntries = thisYear(entries);
  const recentEntries = [...entries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  const vehicleMap = new Map(vehicles.map(v => [v.id!, v]));

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <span className="text-xs text-gray-400">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Vehicles" value={vehicles.length} />
        <StatCard label="Plans" value={plans.length} />
        <StatCard label="Overdue" value={overdueCount} alert={overdueCount > 0} />
        <StatCard
          label={`Spent ${new Date().getFullYear()}`}
          value={formatCurrency(totalCost(yearEntries))}
          mono
        />
      </div>

      {/* Maintenance status table */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Maintenance Status
        </h2>
        {rows.length === 0 ? (
          <EmptyState text="No maintenance plans yet. Add vehicles and plans to see status here." />
        ) : (
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <Th>Vehicle</Th>
                  <Th>Type</Th>
                  <Th>Last Service</Th>
                  <Th>Next Due</Th>
                  <Th>Current km</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ plan, vehicle, overdue, dueText, lastText }) => (
                  <tr
                    key={plan.id}
                    className={`border-b border-gray-100 last:border-0 ${overdue ? 'bg-red-50' : 'bg-white hover:bg-gray-50'}`}
                  >
                    <Td>
                      <span className="font-medium text-gray-800">{vehicle.make} {vehicle.model}</span>
                      <span className="ml-1 text-gray-400 text-xs">{vehicle.year}</span>
                    </Td>
                    <Td>{plan.type}</Td>
                    <Td className="text-gray-400">{lastText}</Td>
                    <Td className={overdue ? 'font-medium text-red-700' : 'text-gray-600'}>{dueText}</Td>
                    <Td className="text-gray-500">{formatMileage(vehicle.currentMileage)}</Td>
                    <Td>
                      {overdue ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                          Overdue
                        </span>
                      ) : dueText === '—' ? (
                        <span className="text-xs text-gray-300">No schedule</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                          OK
                        </span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Recent entries */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Recent Entries
        </h2>
        {recentEntries.length === 0 ? (
          <EmptyState text="No entries logged yet." />
        ) : (
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <Th>Date</Th>
                  <Th>Vehicle</Th>
                  <Th>Type</Th>
                  <Th>Mileage</Th>
                  <Th>Cost</Th>
                  <Th>Workshop</Th>
                </tr>
              </thead>
              <tbody>
                {recentEntries.map(entry => {
                  const v = vehicleMap.get(entry.vehicleId);
                  return (
                    <tr key={entry.id} className="border-b border-gray-100 last:border-0 bg-white hover:bg-gray-50">
                      <Td className="text-gray-500">{formatDate(entry.date)}</Td>
                      <Td className="font-medium text-gray-800">{v ? `${v.make} ${v.model}` : '—'}</Td>
                      <Td>{entry.type}</Td>
                      <Td className="text-gray-500">{formatMileage(entry.mileage)}</Td>
                      <Td className="text-gray-500">{formatCurrency(entry.cost)}</Td>
                      <Td className="text-gray-400">{entry.serviceProvider ?? '—'}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, alert, mono }: {
  label: string; value: string | number; alert?: boolean; mono?: boolean;
}) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${alert ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${alert ? 'text-red-600' : 'text-gray-900'} ${mono ? 'text-base mt-1' : ''}`}>
        {value}
      </p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">{children}</th>;
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-sm ${className}`}>{children}</td>;
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 px-6 py-8 text-center">
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  );
}
