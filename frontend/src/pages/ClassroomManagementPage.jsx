import React, { useState, useEffect } from 'react';
import { Users, Plus, QrCode, Upload, Send, Grid, Shield, CheckCircle2, Copy } from 'lucide-react';
import api from '../services/api';

const DEFAULT_HEATMAP = [
  { topic: 'Modern History 1857-1947', avgMastery: 88, status: 'HIGH_MASTERY' },
  { topic: 'Thermodynamics & Heat Transfer', avgMastery: 74, status: 'MODERATE' },
  { topic: 'Organic Reaction Mechanisms', avgMastery: 52, status: 'CRITICAL_WEAKNESS' },
  { topic: 'Calculus & Differential Equations', avgMastery: 91, status: 'HIGH_MASTERY' },
  { topic: 'Electrostatics & Circuits', avgMastery: 64, status: 'MODERATE' },
];

const ClassroomManagementPage = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [activeClassroom, setActiveClassroom] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [csvText, setCsvText] = useState('');
  const [assignTitle, setAssignTitle] = useState('');
  const [assignType, setAssignType] = useState('QUIZ');
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCreateClassroom = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/classrooms', { name, subject, institutionName });
      if (res.data && res.data.success) {
        const newClass = res.data.data;
        setClassrooms((prev) => [newClass, ...prev]);
        setActiveClassroom(newClass);
        setShowCreateModal(false);
        setName('');
        setSubject('');
      }
    } catch (err) {
      console.error('Error creating classroom:', err);
    }
  };

  const handleImportCsv = async (e) => {
    e.preventDefault();
    if (!activeClassroom || !csvText) return;
    try {
      const res = await api.post(`/classrooms/${activeClassroom.id}/roster/import-csv`, { csvContent: csvText });
      if (res.data && res.data.success) {
        alert(`Successfully imported ${res.data.data.importedCount} students!`);
        setShowCsvModal(false);
        setCsvText('');
      }
    } catch (err) {
      console.error('CSV import error:', err);
    }
  };

  const handleDispatchAssignment = async (e) => {
    e.preventDefault();
    if (!activeClassroom || !assignTitle) return;
    try {
      const res = await api.post(`/classrooms/${activeClassroom.id}/assignments`, {
        title: assignTitle,
        type: assignType,
      });
      if (res.data && res.data.success) {
        alert(`Assignment '${assignTitle}' dispatched to classroom roster!`);
        setShowAssignModal(false);
        setAssignTitle('');
      }
    } catch (err) {
      console.error('Assignment dispatch error:', err);
    }
  };

  const copyJoinCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-neutral-900 via-indigo-950/40 to-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 rounded-xl text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-400" /> Educator RBAC Multi-Tenant Portal
            </span>
          </div>
          <h1 className="text-stone-100 font-extrabold text-2xl font-playfair mt-2">Classroom Cohorts & Roster Analytics</h1>
          <p className="text-stone-400 text-xs mt-1">Manage institutional student cohorts, assign tracks, and monitor class mastery heatmaps.</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold transition-all shadow-lg flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Create Classroom Cohort
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Classroom Selector & Join Info */}
        <div className="space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-stone-100 font-bold text-sm font-playfair flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" /> Your Classrooms
            </h3>

            {classrooms.length === 0 ? (
              <div className="text-center p-6 border border-dashed border-neutral-800 rounded-2xl text-stone-500 text-xs">
                No active classroom cohorts yet. Click 'Create Classroom Cohort' to get started.
              </div>
            ) : (
              <div className="space-y-2">
                {classrooms.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveClassroom(c)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all text-xs cursor-pointer flex items-center justify-between ${
                      activeClassroom?.id === c.id
                        ? 'bg-indigo-600/15 border-indigo-500 text-stone-100 font-bold'
                        : 'bg-neutral-950 border-neutral-800 text-stone-400 hover:border-neutral-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{c.name}</div>
                      <div className="text-[10px] text-stone-500 font-mono mt-0.5">{c.subject}</div>
                    </div>
                    <span className="bg-neutral-800 text-indigo-300 font-mono px-2 py-1 rounded-lg text-[10px]">
                      {c.joinCode}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {activeClassroom && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-stone-100 font-bold text-sm font-playfair flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-400" /> Student Join Invite
              </h3>

              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-center space-y-3">
                <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">6-Character Join Code</span>
                <div className="text-3xl font-black font-mono text-indigo-400 tracking-widest">{activeClassroom.joinCode}</div>
                <button
                  onClick={() => copyJoinCode(activeClassroom.joinCode)}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-stone-300 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" /> {copiedCode ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Classroom Roster & Mastery Heatmap */}
        <div className="lg:col-span-2 space-y-6">
          {/* Controls Bar */}
          <div className="flex items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
            <h3 className="text-stone-100 font-bold text-sm font-playfair">
              {activeClassroom ? activeClassroom.name : 'Classroom Dashboard'}
            </h3>

            {activeClassroom && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCsvModal(true)}
                  className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-stone-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-400" /> Bulk CSV Import
                </button>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Dispatch Assignment
                </button>
              </div>
            )}
          </div>

          {/* Aggregate Topic Mastery Heatmap */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h4 className="text-stone-100 font-extrabold text-sm font-playfair flex items-center gap-2">
              <Grid className="w-4 h-4 text-indigo-400" /> Class-Wide Topic Mastery Heatmap
            </h4>

            <div className="space-y-2.5">
              {DEFAULT_HEATMAP.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                  <div>
                    <span className="text-stone-200 text-xs font-bold block">{item.topic}</span>
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${item.avgMastery >= 80 ? 'text-emerald-400' : item.avgMastery >= 65 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black font-mono text-stone-100">{item.avgMastery}%</span>
                    <div className="w-24 h-1.5 bg-neutral-800 rounded-full mt-1 overflow-hidden">
                      <div
                        className={`h-full ${item.avgMastery >= 80 ? 'bg-emerald-400' : item.avgMastery >= 65 ? 'bg-amber-400' : 'bg-rose-500'}`}
                        style={{ width: `${item.avgMastery}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create Classroom Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-stone-100 font-bold text-base font-playfair">Create New Classroom Cohort</h3>
            <form onSubmit={handleCreateClassroom} className="space-y-3">
              <input
                type="text"
                placeholder="Classroom Name (e.g. Physics 101 - Section A)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-stone-200 text-xs focus:border-indigo-500 outline-none"
              />
              <input
                type="text"
                placeholder="Subject (e.g. Physics / Calculus)"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-stone-200 text-xs focus:border-indigo-500 outline-none"
              />
              <input
                type="text"
                placeholder="Institution Name (e.g. OpenPrep Academy)"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-stone-200 text-xs focus:border-indigo-500 outline-none"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-stone-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Create Cohort
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomManagementPage;
