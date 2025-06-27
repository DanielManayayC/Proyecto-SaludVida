import React, { useState, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Appointment, Patient, Doctor } from './types';
import { APPOINTMENTS, PATIENTS, DOCTORS } from './constants';
import { AgendaView } from './components/AgendaView';
import { PatientListView } from './components/PatientListView';
import { DashboardView } from './components/DashboardView';
import { AppointmentModal } from './components/AppointmentModal';
import { LoginView } from './components/LoginView';
import { ProtectedLayout } from './components/ProtectedLayout';

const App: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>(APPOINTMENTS);
  const [patients, setPatients] = useState<Patient[]>(PATIENTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = (user: string, pass: string): boolean => {
    // Hardcoded credentials for demonstration purposes.
    // In a real application, this would involve a server call.
    if (user === 'admin' && pass === 'password') {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };


  const handleOpenModal = (appointment?: Appointment) => {
    setEditingAppointment(appointment || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAppointment(null);
  };

  const handleSaveAppointment = useCallback((appointmentData: Omit<Appointment, 'id'>, patientData: Omit<Patient, 'id'>) => {
    let patientId = appointmentData.patientId;

    if (!patientId) {
      const existingPatient = patients.find(p => p.identification === patientData.identification);
      if (existingPatient) {
        patientId = existingPatient.id;
      } else {
        const newPatient: Patient = {
          id: `pat${Date.now()}`,
          ...patientData
        };
        setPatients(prev => [...prev, newPatient]);
        patientId = newPatient.id;
      }
    }
    
    if (editingAppointment) {
      const updatedAppointment = { ...editingAppointment, ...appointmentData, patientId };
      setAppointments(prev => prev.map(a => a.id === editingAppointment.id ? updatedAppointment : a));
    } else {
      const newAppointment: Appointment = {
        id: `app${Date.now()}`,
        ...appointmentData,
        patientId,
      };
      setAppointments(prev => [...prev, newAppointment]);
    }
    handleCloseModal();
  }, [editingAppointment, patients]);

  const handleDeleteAppointment = useCallback((id: string) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
  }, []);

  return (
    <HashRouter>
      {isModalOpen && <AppointmentModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveAppointment} appointment={editingAppointment} patients={patients} doctors={DOCTORS}/>}
      
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <LoginView onLogin={handleLogin} /> : <Navigate to="/agenda" replace />} />
        
        <Route path="/*" element={
            isAuthenticated ? 
            <ProtectedLayout onLogout={handleLogout} onNewAppointment={() => handleOpenModal()} /> : 
            <Navigate to="/login" replace />
          }
        >
          <Route path="agenda" element={<AgendaView appointments={appointments} patients={patients} doctors={DOCTORS} onEdit={handleOpenModal} onDelete={handleDeleteAppointment} />} />
          <Route path="patients" element={<PatientListView patients={patients} appointments={appointments} />} />
          <Route path="dashboard" element={<DashboardView appointments={appointments} doctors={DOCTORS} />} />
          {/* Default route inside protected area */}
          <Route index element={<Navigate to="/agenda" replace />} />
           {/* Fallback for any other route to redirect to the main view */}
          <Route path="*" element={<Navigate to="/agenda" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;
