import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { HeartPulse, Users, LayoutDashboard, LogOut } from 'lucide-react';

interface ProtectedLayoutProps {
    onLogout: () => void;
    onNewAppointment: () => void;
}

const NavItem: React.FC<{ to: string; children: React.ReactNode; icon: React.ElementType }> = ({ to, children, icon: Icon }) => (
    <NavLink to={to} className={({ isActive }) => `flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${isActive ? 'bg-brand-blue text-white shadow-sm' : 'text-gray-600 hover:bg-brand-blue-light hover:text-brand-blue-dark'}`}>
      <Icon className="w-5 h-5 mr-3" />
      {children}
    </NavLink>
);

export const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({ onLogout, onNewAppointment }) => {
  return (
    <div className="flex h-screen bg-gray-50 font-sans">
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-brand-blue-dark">SaludVida</h1>
            <p className="text-xs text-gray-500">Gestión de Citas</p>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <NavItem to="/agenda" icon={HeartPulse}>Agenda</NavItem>
            <NavItem to="/patients" icon={Users}>Pacientes</NavItem>
            <NavItem to="/dashboard" icon={LayoutDashboard}>Dashboard</NavItem>
          </nav>
          <div className="p-4 mt-auto border-t border-gray-200 space-y-2">
              <button onClick={onNewAppointment} className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105">
                Nueva Cita
              </button>
              <button onClick={onLogout} className="w-full flex items-center justify-center bg-gray-200 hover:bg-red-100 text-gray-700 hover:text-red-700 font-bold py-2 px-4 rounded-lg transition-colors">
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </button>
          </div>
        </aside>

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
  );
};
