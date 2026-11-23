import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Stethoscope,
  XCircle,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { api } from '../services/api';

export default function AppointmentsList({ refreshTrigger, onNewBookingClick }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const data = await api.getAppointments({
        search: searchTerm || undefined,
        status: statusFilter || undefined,
      });
      setAppointments(data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setErrorMsg('Failed to load appointments from server. Make sure PostgreSQL and backend are running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [refreshTrigger, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadAppointments();
  };

  const handleCancel = async (id) => {
    if (!window.confirm(`Are you sure you want to cancel appointment #APT-${id.toString().padStart(5, '0')}?`)) {
      return;
    }

    try {
      setCancellingId(id);
      await api.cancelAppointment(id);
      // Update local state
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === id ? { ...apt, status: 'CANCELLED' } : apt))
      );
    } catch (err) {
      alert(`Failed to cancel appointment: ${err.message}`);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-10 px-4">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Consultation Appointments
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Real-time appointments ledger retrieved directly from the PostgreSQL microservice.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadAppointments}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:border-blue-300 transition-all flex items-center shadow-sm"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            onClick={onNewBookingClick}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all"
          >
            + Book New Appointment
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by patient name, reason, or keyword..."
            className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-800"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
          >
            Search
          </button>
        </form>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PENDING">Pending</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

      {/* Appointments List View */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">Querying appointments from PostgreSQL...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No appointments found</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
            There are currently no booked appointments matching your criteria. Use the booking form to schedule a new visit.
          </p>
          <button
            onClick={onNewBookingClick}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all"
          >
            Book Your First Appointment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {appointments.map((apt) => (
            <div
              key={apt.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              {/* Left: Patient Details */}
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    #APT-{apt.id.toString().padStart(5, '0')}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      apt.status === 'CONFIRMED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : apt.status === 'CANCELLED'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {apt.status}
                  </span>
                </div>

                <div className="flex items-baseline space-x-3">
                  <h3 className="text-lg font-bold text-slate-900">{apt.patient_name}</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    Age: {apt.patient_age} yrs
                  </span>
                </div>

                {/* Reason */}
                <div className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <span className="font-semibold text-slate-700 block text-xs uppercase tracking-wider mb-0.5">
                    Reason for Visit:
                  </span>
                  <p className="italic text-slate-800">"{apt.reason}"</p>
                </div>
              </div>

              {/* Right: Doctor, Schedule & Actions */}
              <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-start lg:items-center gap-6 border-t md:border-t-0 pt-4 md:pt-0">
                <div className="space-y-1.5 text-xs text-slate-600 min-w-[200px]">
                  <div className="flex items-center space-x-2">
                    <Stethoscope className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-slate-800">{apt.doctor_name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>
                      {new Date(apt.appointment_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{apt.time_slot}</span>
                  </div>
                </div>

                {/* Action button */}
                <div>
                  {apt.status !== 'CANCELLED' && (
                    <button
                      onClick={() => handleCancel(apt.id)}
                      disabled={cancellingId === apt.id}
                      className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 text-xs font-semibold transition-all flex items-center space-x-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{cancellingId === apt.id ? 'Cancelling...' : 'Cancel'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

