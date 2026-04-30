import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Maintenance from './pages/Maintenance';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <main className="max-w-5xl mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/maintenance" element={<Maintenance />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
