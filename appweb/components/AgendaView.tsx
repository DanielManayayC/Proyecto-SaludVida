
import React, { useState, useMemo } from 'react';
import { Appointment, Patient, Doctor, AppointmentStatus } from '../types';
import { Edit, Trash2, Calendar, Clock, Stethoscope } from 'lucide-react';

interface AgendaViewProps {
  appointments: Appointment[];
  patients: Patient[];
  doctors: Doctor[];
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: string) => void;
}

interface StatusClasses {
  bg: string;
  text: string;
  border: string;
}

const getStatusClasses = (status: AppointmentStatus): StatusClasses => {
  switch (status) {
    case AppointmentStatus.Pending:
      return { bg: 'bg-status-pending-bg', text: 'text-yellow-800', border: 'border-status-pending-border' };
    case AppointmentStatus.Confirmed:
      return { bg: 'bg-status-confirmed-bg', text: 'text-purple-800', border: 'border-status-confirmed-border' };
    case AppointmentStatus.Cancelled:
      return { bg: 'bg-status-cancelled-bg', text: 'text-red-800', border: 'border-status-cancelled-border' };
    case AppointmentStatus.Completed:
      return { bg: 'bg-status-completed-bg', text: 'text-green-800', border: 'border-status-completed-border' };
    default:
      return { bg: 'bg-gray-200', text: 'text-gray-800', border: 'border-gray-400' };
  }
};

export const AgendaView: React.FC<AgendaViewProps> = ({ appointments, patients, doctors, onEdit, onDelete }) => {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('all');
  const [viewDate, setViewDate] = useState(new Date());

  const filteredAppointments = useMemo(() => {
    return appointments
      .filter(a => selectedDoctorId === 'all' || a.doctorId === selectedDoctorId)
      .filter(a => a.date === viewDate.toISOString().split('T')[0])
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, selectedDoctorId, viewDate]);

  const changeDate = (days: number) => {
    setViewDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + days);
      return newDate;
    });
  };

  const getPatientName = (patientId: string) => patients.find(p => p.id === patientId)?.name || 'Desconocido';
  const getDoctorName = (doctorId: string) => doctors.find(d => d.id === doctorId)?.name || 'Desconocido';

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Agenda del Día</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-gray-100 rounded-lg">
             <button onClick={() => changeDate(-1)} className="p-2 text-gray-600 hover:bg-gray-200 rounded-l-lg">Anterior</button>
             <span className="px-4 py-2 font-semibold text-brand-blue-dark">{viewDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
             <button onClick={() => changeDate(1)} className="p-2 text-gray-600 hover:bg-gray-200 rounded-r-lg">Siguiente</button>
          </div>
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-brand-blue focus:border-brand-blue"
          >
            <option value="all">Todos los doctores</option>
            {doctors.map(doc => (
              <option key={doc.id} value={doc.id}>{doc.name}</option>
            ))}
          </select>
        </div>
      </header>

      {filteredAppointments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAppointments.map(app => {
            const statusClasses = getStatusClasses(app.status);
            return (
              <div key={app.id} className="bg-white rounded-xl shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
                <div className={`p-4 border-l-4 ${statusClasses.border}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${statusClasses.bg} ${statusClasses.text}`}>
                        {app.status}
                      </p>
                      <h3 className="text-xl font-bold text-gray-900 mt-2">{getPatientName(app.patientId)}</h3>
                      <p className="text-gray-500 text-sm">{app.reason}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => onEdit(app)} className="p-2 text-gray-500 hover:text-brand-blue transition-colors"><Edit size={18} /></button>
                      <button onClick={() => onDelete(app.id)} className="p-2 text-gray-500 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-sm text-gray-700">
                    <div className="flex items-center"><Stethoscope size={16} className="mr-2 text-brand-blue-dark" /><span>{getDoctorName(app.doctorId)}</span></div>
                    <div className="flex items-center"><Clock size={16} className="mr-2 text-brand-blue-dark" /><span>{app.time}</span></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-lg shadow-sm">
          <Calendar size={48} className="mx-auto text-gray-300" />
          <h3 className="mt-4 text-xl font-semibold text-gray-700">No hay citas para este día.</h3>
          <p className="mt-1 text-gray-500">Seleccione otra fecha o agregue una nueva cita.</p>
        </div>
      )}
    </div>
  );
};
