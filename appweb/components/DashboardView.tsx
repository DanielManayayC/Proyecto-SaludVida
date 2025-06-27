
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Appointment, Doctor, AppointmentStatus } from '../types';
import { Calendar, UserCheck, BarChart2 } from 'lucide-react';

interface DashboardViewProps {
  appointments: Appointment[];
  doctors: Doctor[];
}

const COLORS = {
  [AppointmentStatus.Pending]: '#FBBF24', // amber-400
  [AppointmentStatus.Confirmed]: '#A78BFA', // violet-400
  [AppointmentStatus.Completed]: '#6EE7B7', // emerald-300
  [AppointmentStatus.Cancelled]: '#F87171', // red-400
};

export const DashboardView: React.FC<DashboardViewProps> = ({ appointments, doctors }) => {
  const stats = useMemo(() => {
    const totalAppointments = appointments.length;
    const completed = appointments.filter(a => a.status === AppointmentStatus.Completed).length;
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments.filter(a => a.date === today).length;
    return { totalAppointments, completed, todayAppointments };
  }, [appointments]);

  const appointmentsByDoctor = useMemo(() => {
    return doctors.map(doc => ({
      name: doc.name.split(' ').slice(1).join(' '), // Shorten name
      citas: appointments.filter(a => a.doctorId === doc.id).length
    }));
  }, [appointments, doctors]);

  const appointmentsByStatus = useMemo(() => {
    const statusCounts = appointments.reduce((acc, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    }, {} as Record<AppointmentStatus, number>);

    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [appointments]);

  const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType; color: string }> = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm flex items-center space-x-4">
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard de Rendimiento</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Citas Totales" value={stats.totalAppointments} icon={Calendar} color="bg-blue-500" />
        <StatCard title="Citas Completadas" value={stats.completed} icon={UserCheck} color="bg-green-500" />
        <StatCard title="Citas para Hoy" value={stats.todayAppointments} icon={BarChart2} color="bg-indigo-500" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="font-semibold text-lg mb-4 text-gray-700">Citas por Doctor</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={appointmentsByDoctor} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="citas" fill="#3182CE" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="font-semibold text-lg mb-4 text-gray-700">Distribución de Estados de Cita</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={appointmentsByStatus} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {appointmentsByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name as AppointmentStatus]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
