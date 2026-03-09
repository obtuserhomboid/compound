import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, Plus, BarChart3 } from 'lucide-react';
import { useHabitStore } from './store/habitStore';
import Dashboard from './pages/Dashboard';
import HabitDetail from './pages/HabitDetail';
import Insights from './pages/Insights';
import AddHabit from './pages/AddHabit';
import Onboarding from './pages/Onboarding';
import './App.css';

function AppLayout() {
  return (
    <div className="app">
      <nav className="sidebar">
        <div className="sidebar-brand">
          <h1>Compound</h1>
          <p>every day compounds</p>
        </div>
        <div className="sidebar-nav">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
            <LayoutDashboard />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/insights" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <BarChart3 />
            <span>Insights</span>
          </NavLink>
          <NavLink to="/add" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Plus />
            <span>Add Habit</span>
          </NavLink>
        </div>
      </nav>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/habit/:id" element={<HabitDetail />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/add" element={<AddHabit />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const onboarded = useHabitStore(s => s.onboarded);

  return (
    <BrowserRouter>
      {onboarded ? <AppLayout /> : <Onboarding />}
    </BrowserRouter>
  );
}
