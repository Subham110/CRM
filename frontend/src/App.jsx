import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AppointmentForm from './components/AppointmentForm';
import AppointmentsList from './components/AppointmentsList';
import DoctorDirectory from './components/DoctorDirectory';
import { api } from './services/api';
import { ShieldCheck, HeartPulse, Clock, Award } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('book'); // 'book' | 'appointments' | 'doctors'
  const [preselectedDoctor, setPreselectedDoctor] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [backendStatus, setBackendStatus] = useState('connecting');

  // Verify backend connectivity
  useEffect(() => {
    async function checkServer() {
      try {
        await api.checkHealth();
        setBackendStatus('online');
      } catch {
        setBackendStatus('offline');
      }
    }
    checkServer();
    const interval = setInterval(checkServer, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleAppointmentBooked = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleSelectDoctorFromDirectory = (doc) => {
    setPreselectedDoctor(doc);
    setActiveTab('book');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        backendStatus={backendStatus}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {activeTab === 'book' && (
          <div>
            <AppointmentForm
              onAppointmentBooked={handleAppointmentBooked}
              preselectedDoctor={preselectedDoctor}
            />
          </div>
        )}

        {activeTab === 'appointments' && (
          <div>
            <AppointmentsList
              refreshTrigger={refreshTrigger}
              onNewBookingClick={() => setActiveTab('book')}
            />
          </div>
        )}

        {activeTab === 'doctors' && (
          <div>
            <DoctorDirectory onSelectDoctor={handleSelectDoctorFromDirectory} />
          </div>
        )}
      </main>

      {/* Microservice Info & Trust Badges */}
      <footer className="border-t border-slate-200 bg-white py-8 mt-12 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 text-center sm:text-left">
            <div className="flex items-center space-x-3 justify-center sm:justify-start">
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-800">PostgreSQL Backed</p>
                <p className="text-[11px]">ACID compliant persistent storage</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 justify-center sm:justify-start">
              <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-800">FastAPI Microservice</p>
                <p className="text-[11px]">High performance async Python architecture</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 justify-center sm:justify-start">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-800">Real-Time Validation</p>
                <p className="text-[11px]">Instant slot allocation & verification</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 justify-center sm:justify-start">
              <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-800">React JSX Frontend</p>
                <p className="text-[11px]">Pure JavaScript reactive interface</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center">
            <p>© {new Date().getFullYear()} MediCare CRM Microservices System. All rights reserved.</p>
            <div className="flex space-x-6 text-slate-400">
              <span>Privacy Policy</span>
              <span>HIPAA Compliance</span>
              <span>Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

