import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getVehicles } from '../services/api';
import { supabase } from '../services/supabase';
import Modal from './Modal';
import FuelEntryForm from './FuelEntryForm';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/vehicles', label: 'Vehicles' },
  { to: '/maintenance', label: 'Maintenance' },
];

export default function NavBar() {
  const [fuelOpen, setFuelOpen] = useState(false);
  const { data: vehicles = [] } = useQuery({ queryKey: ['vehicles'], queryFn: getVehicles });

  return (
    <>
      <nav className="bg-white border-b border-gray-200 px-6 h-12 flex gap-1 items-center sticky top-0 z-40">
        <span className="text-sm font-semibold text-gray-900 mr-5">Car Tracker</span>
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `px-3 py-1.5 text-sm rounded-md transition-colors ${
                isActive
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`
            }
          >
            {label}
          </NavLink>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setFuelOpen(true)}
            disabled={vehicles.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <span>⛽</span>
            Log Fuel
          </button>
          <button
            onClick={() => supabase.auth.signOut()}
            className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      {fuelOpen && (
        <Modal title="Log Fuel Stop" onClose={() => setFuelOpen(false)}>
          <FuelEntryForm
            vehicles={vehicles}
            onDone={() => setFuelOpen(false)}
          />
        </Modal>
      )}
    </>
  );
}
