import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  Brain,
  Wrench,
  Eye,
  CheckCircle,
  XCircle,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Cpu,
  Zap,
  Check
} from 'lucide-react';
import { api } from '../services/api';

const EXAMPLE_PROMPTS = [
  "My father Robert, 58, has persistent chest discomfort and shortness of breath, need Dr. Marcus Vance tomorrow morning.",
  "Lucas is 8 years old with high fever (102°F) and coughing since yesterday, please book a pediatrician tomorrow afternoon.",
  "I am Sarah Jenkins, 32, experiencing severe migraines and light sensitivity for 3 days, want general physician visit."
];

export default function AIAgentBookingPanel({ onApproveAndFill, onApproveAndInstantBook }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [agentResult, setAgentResult] = useState(null);
  const [showTrace, setShowTrace] = useState(true);
  const [error, setError] = useState('');

  const handleRunAgent = async (promptText) => {
    const textToRun = promptText || prompt;
    if (!textToRun.trim()) {
      setError('Please type or select a patient description.');
      return;
    }

    setLoading(true);
    setError('');
    setAgentResult(null);

    try {
      const response = await api.parseWithAgent(textToRun.trim());
      setAgentResult(response);
      setShowTrace(true);
    } catch (err) {
      console.error('Agent execution error:', err);
      setError(err.message || 'Failed to execute ReAct AI Agent. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = () => {
    setAgentResult(null);
  };

  return (
    <div className="mb-8 rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 text-white p-6 sm:p-8 shadow-2xl border border-indigo-500/30 overflow-hidden relative">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-2">
            <Zap className="w-3.5 h-3.5 text-teal-400" />
            <span>Groq & LangChain ReAct Agent (MCP Tools)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <span>AI Natural Language Booking Assistant</span>
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
            Describe symptoms or appointment requirements in plain English. The ReAct agent calls MCP clinical tools to triage symptoms, recommend the doctor, and automatically prepare the booking draft.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-400 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 self-start md:self-auto">
          <Cpu className="w-4 h-4 text-teal-400" />
          <span>LLaMA-3.3-70B • Tool-Use</span>
        </div>
      </div>

      {/* Input Form */}
      <div className="relative z-10 mb-4">
        <div className="relative">
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              setError('');
            }}
            placeholder="e.g. My name is David Miller, 48 years old. I've had sudden sharp back and joint pain after lifting heavy boxes. Need an orthopedic doctor tomorrow."
            className="w-full p-4 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all resize-y"
          />
        </div>

        {error && (
          <p className="text-rose-400 text-xs mt-2 flex items-center">
            <ShieldAlert className="w-3.5 h-3.5 mr-1" />
            {error}
          </p>
        )}
      </div>

      {/* Quick Example Pills */}
      <div className="relative z-10 mb-6">
        <span className="text-xs text-slate-400 font-semibold block mb-2">
          Or try a sample clinical request:
        </span>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((ex, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setPrompt(ex);
                handleRunAgent(ex);
              }}
              className="text-left text-xs bg-white/5 hover:bg-white/15 border border-white/10 text-slate-200 px-3 py-1.5 rounded-lg transition-all"
            >
              "{ex.slice(0, 65)}..."
            </button>
          ))}
        </div>
      </div>

      {/* Run Agent Action Button */}
      <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
        <div className="text-xs text-slate-400 flex items-center space-x-1.5">
          <Bot className="w-4 h-4 text-indigo-400" />
          <span>ReAct loop: Thought ➔ MCP Tool Call ➔ Observation ➔ Structured JSON</span>
        </div>

        <button
          type="button"
          onClick={() => handleRunAgent()}
          disabled={loading}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-lg shadow-teal-500/25 transition-all flex items-center space-x-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Agent Reasoning & Calling Tools...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Process Request with AI Agent</span>
            </>
          )}
        </button>
      </div>

      {/* ============================================================== */}
      {/* ReAct Execution Trace & Human-in-the-Loop (HITL) Review Card */}
      {/* ============================================================== */}
      {agentResult && (
        <div className="mt-8 pt-8 border-t border-white/10 relative z-10 animate-fade-in">
          {/* ReAct Thought Trace Accordion */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 mb-6">
            <button
              type="button"
              onClick={() => setShowTrace(!showTrace)}
              className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-300 uppercase tracking-wider"
            >
              <div className="flex items-center space-x-2">
                <Brain className="w-4 h-4 text-teal-400" />
                <span>ReAct Agent Reasoning Chain ({agentResult.thought_process.length} steps)</span>
                <span className="text-[10px] lowercase text-teal-400 px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20">
                  {agentResult.provider}
                </span>
              </div>
              {showTrace ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showTrace && (
              <div className="mt-4 space-y-3 pl-2 border-l-2 border-indigo-500/40">
                {agentResult.thought_process.map((step) => (
                  <div key={step.step_number} className="text-xs">
                    <div className="flex items-center space-x-2 font-semibold">
                      {step.step_type === 'thought' && <Brain className="w-3.5 h-3.5 text-indigo-400" />}
                      {step.step_type === 'action' && <Wrench className="w-3.5 h-3.5 text-amber-400" />}
                      {step.step_type === 'observation' && <Eye className="w-3.5 h-3.5 text-teal-400" />}
                      {step.step_type === 'decision' && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                      <span className="text-slate-300">
                        Step {step.step_number}: {step.title}
                      </span>
                    </div>
                    <p className="text-slate-400 mt-1 pl-5 font-mono text-[11px] leading-relaxed">
                      {step.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ========================================================== */}
          {/* HUMAN IN THE LOOP (HITL) APPROVAL INTERFACE */}
          {/* ========================================================== */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 text-slate-900 shadow-2xl border-2 border-teal-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-200 uppercase tracking-wider mb-1">
                  Human-in-the-Loop Review Required
                </span>
                <h3 className="text-xl font-bold text-slate-900">
                  Verify AI-Prepared Appointment Booking
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Review the extracted patient details, triage assessment, and doctor allocation before approving.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  Urgency: {agentResult.parsed_data.urgency_level}
                </span>
              </div>
            </div>

            {/* Extracted Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Patient Name</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{agentResult.parsed_data.patient_name}</p>
                <span className="text-slate-500">Age: {agentResult.parsed_data.patient_age} yrs</span>
              </div>

              <div>
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Consulting Doctor</span>
                <p className="text-sm font-bold text-blue-600 mt-0.5">{agentResult.parsed_data.doctor_name}</p>
                <span className="text-slate-500">{agentResult.parsed_data.department}</span>
              </div>

              <div>
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Date & Slot</span>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{agentResult.parsed_data.appointment_date}</p>
                <span className="text-slate-500">{agentResult.parsed_data.time_slot}</span>
              </div>

              <div className="sm:col-span-3 pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Clinical Reason / Symptoms</span>
                <p className="text-xs text-slate-700 mt-0.5 italic">"{agentResult.parsed_data.reason}"</p>
              </div>
            </div>

            {/* HITL Action Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleReject}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 hover:text-slate-900 text-xs font-semibold transition-all flex items-center justify-center space-x-1.5"
              >
                <XCircle className="w-4 h-4 text-slate-400" />
                <span>Reject & Clear</span>
              </button>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => onApproveAndFill(agentResult.parsed_data)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
                >
                  <span>Approve & Fill Form Manually</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onApproveAndInstantBook(agentResult.parsed_data)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve & Confirm Booking Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

