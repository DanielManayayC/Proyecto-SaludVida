import React, { useState, useEffect, useCallback } from 'react';
import { Appointment, Patient, Doctor, AppointmentStatus } from '../types';
import { suggestSpecialty } from '../services/geminiService';
import { X, Save, Lightbulb, Loader2 } from 'lucide-react';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: Omit<Appointment, 'id'>, patient: Omit<Patient, 'id'>) => void;
  appointment: Appointment | null;
  patients: Patient[];
  doctors: Doctor[];
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({ isOpen, onClose, onSave, appointment, patients, doctors }) => {
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientIdNumber, setPatientIdNumber] = useState('');
  const [isNewPatient, setIsNewPatient] = useState(true);
  
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<AppointmentStatus>(AppointmentStatus.Pending);
  
  const [suggestion, setSuggestion] = useState('');
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);

  useEffect(() => {
    if (appointment) {
      const patient = patients.find(p => p.id === appointment.patientId);
      setPatientId(appointment.patientId);
      setPatientName(patient?.name || '');
      setPatientPhone(patient?.phone || '');
      setPatientIdNumber(patient?.identification || '');
      setIsNewPatient(false);
      setDoctorId(appointment.doctorId);
      setDate(appointment.date);
      setTime(appointment.time);
      setReason(appointment.reason);
      setStatus(appointment.status);
    } else {
      // Reset form
      setPatientId('');
      setPatientName('');
      setPatientPhone('');
      setPatientIdNumber('');
      setIsNewPatient(true);
      setDoctorId(doctors.length > 0 ? doctors[0].id : '');
      setDate(new Date().toISOString().split('T')[0]);
      setTime('09:00');
      setReason('');
      setStatus(AppointmentStatus.Pending);
    }
  }, [appointment, isOpen, doctors, patients]);

  const handlePatientSelect = (selectedPatientId: string) => {
    if (selectedPatientId === 'new') {
      setIsNewPatient(true);
      setPatientId('');
      setPatientName('');
      setPatientPhone('');
      setPatientIdNumber('');
    } else {
      const patient = patients.find(p => p.id === selectedPatientId);
      if (patient) {
        setPatientId(patient.id);
        setPatientName(patient.name);
        setPatientPhone(patient.phone);
        setPatientIdNumber(patient.identification);
        setIsNewPatient(false);
      }
    }
  };

  const handleGetSuggestion = useCallback(async () => {
    if (!reason) return;
    setIsLoadingSuggestion(true);
    setSuggestion('');
    try {
      const suggestedSpecialty = await suggestSpecialty(reason, doctors.map(d => d.specialty));
      const suggestedDoctor = doctors.find(d => d.specialty.toLowerCase() === suggestedSpecialty.toLowerCase());
      if (suggestedDoctor) {
        setSuggestion(`Especialidad sugerida: ${suggestedDoctor.specialty}. Considera al/la ${suggestedDoctor.name}.`);
        setDoctorId(suggestedDoctor.id);
      } else {
        setSuggestion(`Sugerencia: ${suggestedSpecialty}. No se encontró un doctor para esta especialidad.`);
      }
    } catch (error) {
      console.error("Error fetching suggestion:", error);
      setSuggestion('No se pudo obtener una sugerencia.');
    } finally {
      setIsLoadingSuggestion(false);
    }
  }, [reason, doctors]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(
      { doctorId, date, time, reason, status, patientId },
      { name: patientName, phone: patientPhone, identification: patientIdNumber, historyNotes: '' }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-full overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">{appointment ? 'Editar Cita' : 'Nueva Cita'}</h2>
            <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
              <X size={20} className="text-gray-600" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Patient Section */}
            <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-700">Información del Paciente</h3>
                <select onChange={(e) => handlePatientSelect(e.target.value)} value={isNewPatient ? 'new' : patientId} className="w-full p-2 border border-gray-300 rounded-md">
                    <option value="new">-- Nuevo Paciente --</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name} - {p.identification}</option>)}
                </select>
                {isNewPatient && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" placeholder="Nombre completo" value={patientName} onChange={e => setPatientName(e.target.value)} required className="p-2 border border-gray-300 rounded-md" />
                        <input type="text" placeholder="Nº de Identificación" value={patientIdNumber} onChange={e => setPatientIdNumber(e.target.value)} required className="p-2 border border-gray-300 rounded-md" />
                        <input type="tel" placeholder="Teléfono" value={patientPhone} onChange={e => setPatientPhone(e.target.value)} required className="p-2 border border-gray-300 rounded-md" />
                    </div>
                )}
            </div>

            {/* Appointment Details */}
            <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-700">Detalles de la Cita</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
                        <select value={doctorId} onChange={e => setDoctorId(e.target.value)} required className="w-full p-2 border border-gray-300 rounded-md">
                            {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                        <select value={status} onChange={e => setStatus(e.target.value as AppointmentStatus)} required className="w-full p-2 border border-gray-300 rounded-md">
                            {Object.values(AppointmentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full p-2 border border-gray-300 rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                        <input type="time" value={time} onChange={e => setTime(e.target.value)} required className="w-full p-2 border border-gray-300 rounded-md" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de la consulta</label>
                    <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Ej: Dolor de cabeza, chequeo anual..." required className="w-full p-2 border border-gray-300 rounded-md h-24"></textarea>
                </div>
                 <div className="flex items-start space-x-3">
                    <button type="button" onClick={handleGetSuggestion} disabled={isLoadingSuggestion || !reason} className="flex items-center justify-center px-4 py-2 bg-yellow-400 text-yellow-900 font-semibold rounded-md hover:bg-yellow-500 disabled:bg-gray-300 disabled:cursor-not-allowed">
                      {isLoadingSuggestion ? <Loader2 className="animate-spin mr-2" size={18} /> : <Lightbulb className="mr-2" size={18} />}
                      Sugerir Doctor
                    </button>
                    {suggestion && <p className="text-sm text-gray-600 bg-yellow-100 p-2 rounded-md flex-1">{suggestion}</p>}
                </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-blue-dark flex items-center">
                <Save size={18} className="mr-2"/>
                {appointment ? 'Guardar Cambios' : 'Crear Cita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
