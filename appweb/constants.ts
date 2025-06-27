
import { Doctor, Patient, Appointment, AppointmentStatus } from './types';

export const DOCTORS: Doctor[] = [
  { id: 'doc1', name: 'Dra. Ana Pérez', specialty: 'Cardiología' },
  { id: 'doc2', name: 'Dr. Carlos Gómez', specialty: 'Medicina General' },
  { id: 'doc3', name: 'Dra. Luisa Martínez', specialty: 'Dermatología' },
  { id: 'doc4', name: 'Dr. Juan Rodríguez', specialty: 'Ortopedia' },
];

export const PATIENTS: Patient[] = [
  { id: 'pat1', name: 'Elena Vázquez', phone: '555-1234', identification: '12345678A', historyNotes: 'Paciente con hipertensión controlada.' },
  { id: 'pat2', name: 'Roberto Fernández', phone: '555-5678', identification: '87654321B', historyNotes: 'Alergia a la penicilina.' },
  { id: 'pat3', name: 'Carmen Ruiz', phone: '555-8765', identification: '45678912C', historyNotes: 'Chequeo anual.' },
];

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);

const formatDate = (date: Date) => date.toISOString().split('T')[0];

export const APPOINTMENTS: Appointment[] = [
  { id: 'app1', patientId: 'pat1', doctorId: 'doc1', date: formatDate(today), time: '10:00', reason: 'Revisión de marcapasos', status: AppointmentStatus.Confirmed },
  { id: 'app2', patientId: 'pat2', doctorId: 'doc2', date: formatDate(today), time: '11:30', reason: 'Consulta general, resfriado', status: AppointmentStatus.Pending },
  { id: 'app3', patientId: 'pat3', doctorId: 'doc3', date: formatDate(tomorrow), time: '09:00', reason: 'Revisión de lunar', status: AppointmentStatus.Confirmed },
  { id: 'app4', patientId: 'pat1', doctorId: 'doc4', date: formatDate(tomorrow), time: '12:00', reason: 'Dolor de rodilla', status: AppointmentStatus.Pending },
  { id: 'app5', patientId: 'pat2', doctorId: 'doc2', date: formatDate(yesterday), time: '15:00', reason: 'Seguimiento', status: AppointmentStatus.Completed },
];
