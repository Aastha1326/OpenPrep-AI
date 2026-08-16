import React, { useState, useMemo } from 'react';
import {
  Ambulance,
  Activity,
  BedDouble,
  Clock,
  MapPin,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  PhoneCall,
  Sliders,
  XCircle,
  Users,
  Shield,
  Zap
} from 'lucide-react';

const HospitalEmergencyTriageHub = () => {
  const [activeTab, setActiveTab] = useState('triage');
  const [searchTerm, setSearchTerm] = useState('');
  const [triageFilter, setTriageFilter] = useState('all');
  const [selectedAmbulance, setSelectedAmbulance] = useState(null);

  const [erQueue, setErQueue] = useState([
    {
      id: 'ER-901',
      patientName: 'Jonathan Vance',
      age: 62,
      triageLevel: 'ESI 1 - Resuscitation',
      chiefComplaint: 'Acute Chest Pain, Diaphoretic, STEMI Suspicion',
      arrivalTime: '3 mins ago',
      assignedBed: 'Trauma Bay 01',
      vitals: 'HR: 124, BP: 85/50, SpO2: 91%',
      status: 'Immediate Physician Care'
    },
    {
      id: 'ER-902',
      patientName: 'Samantha Wu',
      age: 28,
      triageLevel: 'ESI 2 - Emergent',
      chiefComplaint: 'Severe Anaphylactic Reaction to Peanuts',
      arrivalTime: '8 mins ago',
      assignedBed: 'Resus Bed 03',
      vitals: 'HR: 110, BP: 105/70, SpO2: 94%',
      status: 'Epi Administered / Monitoring'
    },
    {
      id: 'ER-903',
      patientName: 'Gary Higgins',
      age: 75,
      triageLevel: 'ESI 3 - Urgent',
      chiefComplaint: 'High Fever, Confusion, Potential Sepsis',
      arrivalTime: '15 mins ago',
      assignedBed: 'ER Bed 14',
      vitals: 'HR: 98, BP: 115/75, SpO2: 96%',
      status: 'Labs Pending'
    }
  ]);

  const [ambulances, setAmbulances] = useState([
    {
      id: 'AMB-402',
      unit: 'Medic 04 - Unit Alpha',
      eta: '4 mins',
      patientInfo: 'Male, 45, Sudden Onset Weakness & Slurred Speech',
      strokeScale: 'Positive (FAST 3/3)',
      destinationBay: 'Stroke Resus Bay 2',
      status: 'In Transit'
    },
    {
      id: 'AMB-109',
      unit: 'Rescue 12 - Trauma Specialist',
      eta: '9 mins',
      patientInfo: 'Female, 19, Motor Vehicle Collision, Pelvic Pain',
      strokeScale: 'N/A',
      destinationBay: 'Trauma Bay 02',
      status: 'In Transit'
    }
  ]);

  const filteredQueue = useMemo(() => {
    return erQueue.filter(item => {
      const matchesSearch =
        item.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.chiefComplaint.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTriage =
        triageFilter === 'all' || item.triageLevel.toLowerCase().includes(triageFilter.toLowerCase());

      return matchesSearch && matchesTriage;
    });
  }, [erQueue, searchTerm, triageFilter]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-600/20 rounded-xl border border-red-500/30 text-red-400">
            <Ambulance className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Hospital Operations & Emergency Triage Hub
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-medium">
                ER Queue Active
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Real-time ER bed capacity management, inbound ambulance dispatch routing & ESI triage scoring.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-red-600/20">
            <PhoneCall className="w-4 h-4" />
            Dispatch Trauma Team
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">ER Capacity</p>
            <p className="text-2xl font-bold text-white mt-1">92% Occupied</p>
            <span className="text-xs text-red-400 flex items-center gap-1 mt-1">
              <AlertTriangle className="w-3 h-3" /> 2 Beds Remaining
            </span>
          </div>
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
            <BedDouble className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Inbound Ambulances</p>
            <p className="text-2xl font-bold text-white mt-1">2 Incoming</p>
            <span className="text-xs text-amber-400 flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3" /> ETA &lt; 10 mins
            </span>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg">
            <Ambulance className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Door-to-Doctor Time</p>
            <p className="text-2xl font-bold text-white mt-1">11.4 mins</p>
            <span className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3" /> Target &lt; 15 mins
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">ICU Transfer Queue</p>
            <p className="text-2xl font-bold text-white mt-1">4 Patients</p>
            <span className="text-xs text-indigo-400 flex items-center gap-1 mt-1">
              <Users className="w-3 h-3" /> Step-Down Pending
            </span>
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
            <Shield className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/40 p-4 border border-slate-800 rounded-xl mb-6">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search patient, complaint or ER ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-slate-400">Triage Level:</span>
            <select
              value={triageFilter}
              onChange={e => setTriageFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All ESI Levels</option>
              <option value="esi 1">ESI 1 - Resuscitation</option>
              <option value="esi 2">ESI 2 - Emergent</option>
              <option value="esi 3">ESI 3 - Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* ER Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredQueue.map(item => (
          <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-start">
              <span className="font-mono text-xs text-red-400 bg-red-950/50 px-2 py-0.5 rounded border border-red-800">
                {item.id}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 font-semibold">
                {item.triageLevel}
              </span>
            </div>

            <div>
              <h3 className="font-bold text-white text-lg">{item.patientName} ({item.age} y/o)</h3>
              <p className="text-xs text-slate-300 mt-1 font-medium bg-slate-950 p-2 rounded border border-slate-800">
                {item.chiefComplaint}
              </p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Vitals Stream:</span>
                <span className="text-slate-200 font-mono">{item.vitals}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Assigned Location:</span>
                <span className="text-emerald-400 font-semibold">{item.assignedBed}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Status:</span>
                <span className="text-amber-400 font-medium">{item.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HospitalEmergencyTriageHub;
