
import React, { useState } from 'react';
import { Patient, Appointment } from '../types';
import { User, Phone, List, ChevronDown, ChevronUp } from 'lucide-react';

interface PatientListViewProps {
  patients: Patient[];
  appointments: Appointment[];
}

const PatientCard: React.FC<{ patient: Patient; appointments: Appointment[] }> = ({ patient, appointments }) => {
  const [isOpen, setIsOpen] = useState(false);
  const patientAppointments = appointments.filter(a => a.patientId === patient.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 flex justify-between items-center cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center">
          <div className="p-3 bg-brand-blue-light rounded-full mr-4">
            <User className="text-brand-blue-dark" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-800">{patient.name}</h3>
            <p className="text-sm text-gray-500">{patient.identification}</p>
          </div>
        </div>
        <div className="flex items-center">
          <Phone size={16} className="text-gray-400 mr-2"/>
          <span className="text-gray-600 mr-6">{patient.phone}</span>
          {isOpen ? <ChevronUp /> : <ChevronDown />}
        </div>
      </div>
      {isOpen && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <h4 className="font-semibold text-md mb-2 text-gray-700">Historial de Citas</h4>
          {patientAppointments.length > 0 ? (
            <ul className="space-y-2">
              {patientAppointments.map(app => (
                <li key={app.id} className="flex justify-between p-2 rounded-md bg-white">
                  <span>{app.date}: {app.reason}</span>
                  <span className="font-medium text-sm">{app.status}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No hay citas registradas para este paciente.</p>
          )}
           <h4 className="font-semibold text-md mt-4 mb-2 text-gray-700">Notas Clínicas</h4>
           <p className="text-sm text-gray-600 bg-white p-3 rounded-md whitespace-pre-wrap">{patient.historyNotes || 'Sin notas.'}</p>
        </div>
      )}
    </div>
  );
};

export const PatientListView: React.FC<PatientListViewProps> = ({ patients, appointments }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.identification.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800">Listado de Pacientes</h2>
        <input 
          type="text" 
          placeholder="Buscar por nombre o identificación..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-brand-blue focus:border-brand-blue mt-4 md:mt-0"
        />
      </header>
      <div className="space-y-4">
        {filteredPatients.length > 0 ? (
          filteredPatients.map(patient => <PatientCard key={patient.id} patient={patient} appointments={appointments} />)
        ) : (
           <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <User size={48} className="mx-auto text-gray-300" />
            <h3 className="mt-4 text-xl font-semibold text-gray-700">No se encontraron pacientes.</h3>
            <p className="mt-1 text-gray-500">Intente con otro término de búsqueda o agregue un nuevo paciente al crear una cita.</p>
          </div>
        )}
      </div>
    </div>
  );
};
