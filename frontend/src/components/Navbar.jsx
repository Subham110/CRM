import React from 'react';
import { Activity, Calendar, Users, PhoneCall, ShieldCheck, Stethoscope } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, backendStatus }) {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('book')}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  MediCare<span className="text-blue-600">Plus</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  Clinic CRM
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Doctor Appointment & Consultation Portal</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('book')}
              className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'book'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>

            <button
              onClick={() => setActiveTab('appointments')}
              className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'appointments'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>All Appointments</span>
            </button>

            <button
              onClick={() => setActiveTab('doctors')}
              className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'doctors'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Specialist Doctors</span>
            </button>
          </nav>

          {/* Microservice Status & Hotline */}
          <div className="hidden lg:flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  backendStatus === 'online'
                    ? 'bg-emerald-500 animate-pulse'
                    : backendStatus === 'connecting'
                    ? 'bg-amber-400'
                    : 'bg-rose-500'
                }`}
              />
              <span className="font-medium text-slate-600">
                {backendStatus === 'online'
                  ? 'Postgres & API Connected'
                  : backendStatus === 'connecting'
                  ? 'Connecting API...'
                  : 'API Offline'}
              </span>
            </div>

            <div className="text-right">
              <span className="block text-[11px] text-slate-400 font-medium">Emergency Desk</span>
              <a href="tel:+18005553628" className="flex items-center text-xs font-bold text-slate-800 hover:text-blue-600">
                <PhoneCall className="w-3.5 h-3.5 mr-1 text-teal-600" />
                1-800-DOC-HELP
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

