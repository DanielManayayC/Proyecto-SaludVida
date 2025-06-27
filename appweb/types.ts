
export enum AppointmentStatus {
  Pending = 'Pendiente',
  Confirmed = 'Confirmada',
  Cancelled = 'Cancelada',
  Completed = 'Completada',
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  identification: string;
  historyNotes: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  reason: string;
  status: AppointmentStatus;
}
