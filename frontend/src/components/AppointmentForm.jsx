import React, { useState, useEffect } from 'react';
import {
  User,
  Calendar,
  Clock,
  FileText,
  Stethoscope,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import AIAgentBookingPanel from './AIAgentBookingPanel';

const QUICK_REASONS = [
  'Routine Health Checkup',
  'High Fever & Severe Cold',
  'Chest Pain & Discomfort',
  'Chronic Joint / Back Pain',
  'Skin Rash & Itching',
  'Migraine & Headaches',
  'Prescription Refill',
  'Digestive Issues & Stomach Ache'
];

export default function AppointmentForm({ onAppointmentBooked, preselectedDoctor }) {
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [formError, setFormError] = useState('');
  const [aiNotice, setAiNotice] = useState('');

  // Human-in-the-Loop Handlers
  const handleAIApproveAndFill = (parsedData) => {
    setFormData((prev) => ({
      ...prev,
      patient_name: parsedData.patient_name || prev.patient_name,
      patient_age: parsedData.patient_age ? String(parsedData.patient_age) : prev.patient_age,
      reason: parsedData.reason || prev.reason,
      doctor_name: parsedData.doctor_name || prev.doctor_name,
      department: parsedData.department || prev.department,
      appointment_date: parsedData.appointment_date || prev.appointment_date,
      time_slot: parsedData.time_slot || prev.time_slot,
      contact_phone: parsedData.contact_phone || prev.contact_phone,
      contact_email: parsedData.contact_email || prev.contact_email,
      notes: parsedData.clinical_notes || prev.notes,
    }));
    setErrors({});
    setAiNotice(`✨ Form auto-filled by AI Agent for ${parsedData.patient_name} (${parsedData.department}). Review the details below and confirm booking.`);
    const formElement = document.getElementById('booking-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAIApproveAndInstantBook = async (parsedData) => {
    setSubmitting(true);
    setFormError('');
    try {
      const appointmentDateTime = new Date(`${parsedData.appointment_date}T09:00:00Z`).toISOString();
      const payload = {
        patient_name: parsedData.patient_name.trim(),
        patient_age: parseInt(parsedData.patient_age, 10),
        reason: parsedData.reason.trim(),
        doctor_name: parsedData.doctor_name,
        department: parsedData.department,
        appointment_date: appointmentDateTime,
        time_slot: parsedData.time_slot,
        contact_phone: parsedData.contact_phone?.trim() || null,
        contact_email: parsedData.contact_email?.trim() || null,
        notes: parsedData.clinical_notes?.trim() || null,
      };

      const result = await api.createAppointment(payload);
      setSuccessData(result);
      if (onAppointmentBooked) {
        onAppointmentBooked(result);
      }
    } catch (err) {
      console.error('Instant booking failed:', err);
      setFormError(`Instant booking failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Form State - strictly includes Name, Age, Reason
  const [formData, setFormData] = useState({
    patient_name: '',
    patient_age: '',
    reason: '',
    doctor_name: '',
    department: 'General Medicine',
    appointment_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time_slot: '09:00 AM - 10:00 AM',
    contact_phone: '',
    contact_email: '',
    notes: ''
  });

  // Validation errors
  const [errors, setErrors] = useState({});

  useEffect(() => {
    async function loadDoctors() {
      try {
        setLoadingDoctors(true);
        const data = await api.getDoctors();
        setDoctors(data);
        if (data.length > 0) {
          const selected = preselectedDoctor || data[0];
          setFormData((prev) => ({
            ...prev,
            doctor_name: selected.name,
            department: selected.department || 'General Medicine',
            time_slot: selected.time_slots?.[0] || '09:00 AM - 10:00 AM'
          }));
        }
      } catch (err) {
        console.error('Failed to load doctors list:', err);
        // Fallback default doctors list if backend is loading
        const fallback = [
          { name: 'Dr. Evelyn Harper', department: 'General Medicine', specialty: 'Family Physician' },
          { name: 'Dr. Marcus Vance', department: 'Cardiology', specialty: 'Cardiologist' },
          { name: 'Dr. Priya Sharma', department: 'Pediatrics', specialty: 'Child Specialist' },
          { name: 'Dr. Liam Thorne', department: 'Orthopedics', specialty: 'Orthopedic Surgeon' },
          { name: 'Dr. Sophia Chen', department: 'Dermatology', specialty: 'Dermatologist' },
        ];
        setDoctors(fallback);
        setFormData((prev) => ({ ...prev, doctor_name: fallback[0].name }));
      } finally {
        setLoadingDoctors(false);
      }
    }
    loadDoctors();
  }, [preselectedDoctor]);

  // When a preselected doctor changes from outside
  useEffect(() => {
    if (preselectedDoctor) {
      setFormData((prev) => ({
        ...prev,
        doctor_name: preselectedDoctor.name,
        department: preselectedDoctor.department || prev.department,
        time_slot: preselectedDoctor.time_slots?.[0] || prev.time_slot
      }));
    }
  }, [preselectedDoctor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear validation error on type
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    setFormError('');
  };

  const handleSelectQuickReason = (reasonText) => {
    setFormData((prev) => ({
      ...prev,
      reason: prev.reason ? `${prev.reason}, ${reasonText}` : reasonText
    }));
    if (errors.reason) {
      setErrors((prev) => ({ ...prev, reason: null }));
    }
  };

  const handleDoctorChange = (e) => {
    const docName = e.target.value;
    const doc = doctors.find((d) => d.name === docName);
    setFormData((prev) => ({
      ...prev,
      doctor_name: docName,
      department: doc?.department || prev.department,
      time_slot: doc?.time_slots?.[0] || prev.time_slot
    }));
  };

  const validate = () => {
    const newErrors = {};

    // 1. Name validation
    if (!formData.patient_name || formData.patient_name.trim().length < 2) {
      newErrors.patient_name = 'Please provide patient full name (at least 2 characters).';
    }

    // 2. Age validation
    const ageNum = parseInt(formData.patient_age, 10);
    if (!formData.patient_age || isNaN(ageNum) || ageNum < 1 || ageNum > 125) {
      newErrors.patient_age = 'Please enter a valid age between 1 and 125 years.';
    }

    // 3. Reason validation
    if (!formData.reason || formData.reason.trim().length < 3) {
      newErrors.reason = 'Please explain the reason for the appointment (symptoms or consultation goal).';
    }

    // 4. Doctor selection validation
    if (!formData.doctor_name) {
      newErrors.doctor_name = 'Please select a consulting doctor.';
    }

    // 5. Date validation
    if (!formData.appointment_date) {
      newErrors.appointment_date = 'Please select a visit date.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      // Assemble ISO date string with chosen slot
      const [hourMinute] = formData.time_slot.split(' - ')[0].split(' ');
      const appointmentDateTime = new Date(`${formData.appointment_date}T09:00:00Z`).toISOString();

      const payload = {
        patient_name: formData.patient_name.trim(),
        patient_age: parseInt(formData.patient_age, 10),
        reason: formData.reason.trim(),
        doctor_name: formData.doctor_name,
        department: formData.department,
        appointment_date: appointmentDateTime,
        time_slot: formData.time_slot,
        contact_phone: formData.contact_phone.trim() || null,
        contact_email: formData.contact_email.trim() || null,
        notes: formData.notes.trim() || null
      };

      const result = await api.createAppointment(payload);
      setSuccessData(result);
      if (onAppointmentBooked) {
        onAppointmentBooked(result);
      }
    } catch (err) {
      console.error('Booking failed:', err);
      setFormError(err.message || 'Failed to submit appointment. Please check your backend connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSuccessData(null);
    setFormData({
      patient_name: '',
      patient_age: '',
      reason: '',
      doctor_name: doctors[0]?.name || '',
      department: doctors[0]?.department || 'General Medicine',
      appointment_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      time_slot: '09:00 AM - 10:00 AM',
      contact_phone: '',
      contact_email: '',
      notes: ''
    });
    setErrors({});
    setFormError('');
  };

  // If successfully booked, render booking confirmation receipt card
  if (successData) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-xl max-w-2xl mx-auto my-8 animate-fade-in">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="text-center mb-8">
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold tracking-wide uppercase mb-2 border border-emerald-200">
            Appointment Confirmed
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Booking Received Successfully!
          </h2>
          <p className="text-slate-600 mt-2 text-sm sm:text-base">
            Your appointment has been registered in our PostgreSQL database and assigned to the physician.
          </p>
        </div>

        {/* Confirmation Details Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-6 mb-8 divide-y divide-slate-200/60">
          <div className="grid grid-cols-2 gap-4 pb-4">
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Booking ID</span>
              <p className="text-base font-bold text-blue-600">#APT-{successData.id.toString().padStart(5, '0')}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Status</span>
              <p className="text-sm font-semibold text-emerald-700 flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
                {successData.status}
              </p>
            </div>
          </div>

          <div className="py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Patient Name</span>
              <p className="text-sm font-bold text-slate-900">{successData.patient_name}</p>
              <span className="text-xs text-slate-500">Age: {successData.patient_age} years</span>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Consulting Doctor</span>
              <p className="text-sm font-bold text-slate-900">{successData.doctor_name}</p>
              <span className="text-xs text-slate-500">{successData.department}</span>
            </div>
          </div>

          <div className="py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Appointment Date</span>
              <p className="text-sm font-semibold text-slate-800">
                {new Date(successData.appointment_date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Time Slot</span>
              <p className="text-sm font-semibold text-slate-800">{successData.time_slot}</p>
            </div>
          </div>

          <div className="pt-4">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Reason for Visit</span>
            <p className="text-sm text-slate-700 italic mt-0.5">"{successData.reason}"</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={resetForm}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2"
          >
            <span>Book Another Appointment</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const selectedDoctorObj = doctors.find((d) => d.name === formData.doctor_name);

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 px-4">
      {/* Header Banner */}
      <div className="mb-8 text-center sm:text-left">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Patient Registration & Booking</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Book an Appointment with a Visiting Doctor
        </h1>
        <p className="text-slate-600 mt-2 text-sm sm:text-base">
          Fill out the consultation form below with the patient's name, age, and reason for visit to confirm your slot.
          Fill out the consultation form below with the patient's name, age, and reason for visit to confirm your slot, or use our ReAct AI Agent above.
        </p>
      </div>

      {/* Groq LangChain ReAct Agent with MCP Tools & Human-in-the-Loop */}
      <AIAgentBookingPanel
        onApproveAndFill={handleAIApproveAndFill}
        onApproveAndInstantBook={handleAIApproveAndInstantBook}
      />

      {aiNotice && (
        <div className="mb-6 p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-between text-sm shadow-sm animate-fade-in">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0" />
            <p className="font-medium">{aiNotice}</p>
          </div>
          <button
            type="button"
            onClick={() => setAiNotice('')}
            className="text-xs text-teal-600 hover:text-teal-900 font-bold ml-4 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {formError && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start space-x-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
          <div>
            <p className="font-semibold">Unable to process booking</p>
            <p>{formError}</p>
          </div>
        </div>
      )}

      {/* Main Form Container */}
      <form id="booking-form" onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Section 1: Patient Information */}
        <div className="p-6 sm:p-8 border-b border-slate-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Patient Details</h2>
              <p className="text-xs text-slate-500">Provide basic demographic and identification details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Patient Name Field */}
            <div className="sm:col-span-2">
              <label htmlFor="patient_name" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Patient Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="patient_name"
                  type="text"
                  name="patient_name"
                  value={formData.patient_name}
                  onChange={handleChange}
                  placeholder="e.g. Robert Smith"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                    errors.patient_name
                      ? 'border-rose-300 bg-rose-50/30 text-rose-900 focus:ring-rose-200 focus:border-rose-400'
                      : 'border-slate-300 focus:ring-blue-100 focus:border-blue-500 text-slate-800'
                  }`}
                />
              </div>
              {errors.patient_name && (
                <p className="text-xs text-rose-600 mt-1.5 flex items-center">
                  <AlertCircle className="w-3.5 h-3.5 mr-1" />
                  {errors.patient_name}
                </p>
              )}
            </div>

            {/* Patient Age Field */}
            <div>
              <label htmlFor="patient_age" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Age (Years) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="patient_age"
                  type="number"
                  name="patient_age"
                  min="1"
                  max="125"
                  value={formData.patient_age}
                  onChange={handleChange}
                  placeholder="e.g. 35"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                    errors.patient_age
                      ? 'border-rose-300 bg-rose-50/30 text-rose-900 focus:ring-rose-200 focus:border-rose-400'
                      : 'border-slate-300 focus:ring-blue-100 focus:border-blue-500 text-slate-800'
                  }`}
                />
              </div>
              {errors.patient_age && (
                <p className="text-xs text-rose-600 mt-1.5 flex items-center">
                  <AlertCircle className="w-3.5 h-3.5 mr-1" />
                  {errors.patient_age}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Reason for Visiting Doctor */}
        <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Reason for Visit & Symptoms</h2>
              <p className="text-xs text-slate-500">Describe what brings the patient to visit the doctor</p>
            </div>
          </div>

          {/* Quick-pick Reason Tags */}
          <div className="mb-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Common Reasons (Click to add):
            </span>
            <div className="flex flex-wrap gap-2">
              {QUICK_REASONS.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => handleSelectQuickReason(tag)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-all flex items-center space-x-1"
                >
                  <span>+</span>
                  <span>{tag}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reason Textarea Field */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="reason" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Primary Reason / Chief Complaints <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs text-slate-400">
                {formData.reason.length} / 1500 chars
              </span>
            </div>
            <div className="relative">
              <textarea
                id="reason"
                name="reason"
                rows={4}
                value={formData.reason}
                onChange={handleChange}
                placeholder="Describe your current symptoms, how long you have had them, or specific health concerns..."
                className={`w-full p-3.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 resize-y ${
                  errors.reason
                    ? 'border-rose-300 bg-rose-50/30 text-rose-900 focus:ring-rose-200 focus:border-rose-400'
                    : 'border-slate-300 focus:ring-blue-100 focus:border-blue-500 text-slate-800'
                }`}
              />
            </div>
            {errors.reason && (
              <p className="text-xs text-rose-600 mt-1.5 flex items-center">
                <AlertCircle className="w-3.5 h-3.5 mr-1" />
                {errors.reason}
              </p>
            )}
          </div>
        </div>

        {/* Section 3: Doctor & Schedule Selection */}
        <div className="p-6 sm:p-8 border-b border-slate-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Visiting Doctor & Time Slot</h2>
              <p className="text-xs text-slate-500">Select the specialist and preferred appointment schedule</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Doctor Selection */}
            <div>
              <label htmlFor="doctor_name" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Consulting Doctor <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="doctor_name"
                  name="doctor_name"
                  value={formData.doctor_name}
                  onChange={handleDoctorChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                >
                  {doctors.map((doc) => (
                    <option key={doc.name} value={doc.name}>
                      {doc.name} ({doc.specialty || doc.department})
                    </option>
                  ))}
                </select>
              </div>

              {selectedDoctorObj && (
                <div className="mt-3 p-3 rounded-xl bg-blue-50/60 border border-blue-100 flex items-start space-x-3">
                  <Stethoscope className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-semibold text-slate-800">{selectedDoctorObj.specialty}</p>
                    <p className="text-slate-500">
                      Room: {selectedDoctorObj.room || 'General Clinic'} • Rating: ⭐ {selectedDoctorObj.rating || '4.9'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Date & Time Slot Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="appointment_date" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Visit Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="appointment_date"
                    type="date"
                    name="appointment_date"
                    value={formData.appointment_date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="time_slot" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Preferred Slot
                </label>
                <select
                  id="time_slot"
                  name="time_slot"
                  value={formData.time_slot}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                >
                  {(selectedDoctorObj?.time_slots || [
                    '09:00 AM - 10:00 AM',
                    '10:30 AM - 11:30 AM',
                    '02:00 PM - 03:00 PM',
                    '04:00 PM - 05:00 PM'
                  ]).map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Contact & Optional Notes */}
        <div className="p-6 sm:p-8 bg-slate-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="contact_phone" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Contact Phone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  id="contact_phone"
                  type="tel"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact_email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Email Address (For Confirmation)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="contact_email"
                  type="email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleChange}
                  placeholder="patient@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 sm:p-8 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Encrypted patient data stored securely in PostgreSQL</span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-semibold transition-all"
            >
              Clear Form
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-md shadow-blue-500/25 flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Registering Booking...</span>
                </>
              ) : (
                <>
                  <span>Confirm Appointment Booking</span>
                  <Check className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

