import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/vehicles', label: 'Vehicles' },
  { to: '/maintenance', label: 'Maintenance' },
];

export default function NavBar() {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex gap-6 items-center">
      <span className="font-semibold text-gray-800 mr-4">🚗 AutoApp</span>
      {links.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            isActive
              ? 'text-blue-600 font-medium'
              : 'text-gray-600 hover:text-gray-900'
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
