import React, { useState, useEffect } from 'react';
import { Stethoscope, Star, Calendar, Clock, MapPin, Award, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

export default function DoctorDirectory({ onSelectDoctor }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getDoctors();
        setDoctors(data);
      } catch (err) {
        console.error('Failed to load doctors:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4 text-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading specialist profiles...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-10 px-4">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
          Medical Faculty
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
          Consult Our Specialist Doctors
        </h1>
        <p className="text-slate-600 text-sm mt-2">
          Choose a physician from our board-certified specialist directory to visit for your medical care.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map((doc) => (
          <div
            key={doc.id || doc.name}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
          >
            <div className="p-6">
              {/* Avatar / Badge */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                  <Stethoscope className="w-7 h-7" />
                </div>
                <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{doc.rating || 4.9}</span>
                </div>
              </div>

              {/* Doctor Details */}
              <h3 className="text-lg font-bold text-slate-900">{doc.name}</h3>
              <p className="text-xs font-semibold text-blue-600 mb-1">{doc.specialty}</p>
              <p className="text-xs text-slate-400 mb-4">{doc.qualification}</p>

              <div className="space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  <span>{doc.experience_years} Years Clinical Practice</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  <span>{doc.room}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <span>Available: {doc.available_days?.slice(0, 3).join(', ')}...</span>
                </div>
              </div>
            </div>

            {/* Card Action */}
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => onSelectDoctor(doc)}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs tracking-wide transition-all shadow-sm"
              >
                Book Visit with {doc.name.split(' ')[1] || doc.name}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

