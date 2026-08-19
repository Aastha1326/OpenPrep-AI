import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  Bell,
  Cpu,
  Database,
  Heart,
  Layers,
  Radio,
  RefreshCw,
  Search,
  ShieldAlert,
  Sliders,
  Sparkles,
  Thermometer,
  Zap,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  Settings,
  Wifi,
  Volume2
} from 'lucide-react';

const ICUTelemetryStreamHub = () => {
  const [activeTab, setActiveTab] = useState('telemetry');
  const [searchTerm, setSearchTerm] = useState('');
  const [bedFilter, setBedFilter] = useState('all');
  const [selectedBed, setSelectedBed] = useState(null);
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState(120);

  const [bedsData, setBedsData] = useState([
    {
      id: 'BED-101',
      unit: 'Cardiovascular ICU',
      patientName: 'Sarah Jenkins',
      age: 58,
      hr: 118,
      bp: '142/90',
      spo2: 94,
      respRate: 24,
      temp: 38.2,
      riskLevel: 'Critical',
      deviceMeshStatus: 'Connected (5 Sensors)',
      waveformData: [65, 80, 115, 40, 60, 75, 120, 50],
      alerts: ['Tachycardia Warning', 'Slight Hypoxia'],
      timestamp: 'Just now'
    },
    {
      id: 'BED-102',
      unit: 'Neuro ICU',
      patientName: 'David Miller',
      age: 67,
      hr: 72,
      bp: '120/78',
      spo2: 98,
      respRate: 16,
      temp: 36.8,
      riskLevel: 'Normal',
      deviceMeshStatus: 'Connected (4 Sensors)',
      waveformData: [70, 72, 75, 71, 73, 72, 74, 72],
      alerts: [],
      timestamp: '1 sec ago'
    },
    {
      id: 'BED-103',
      unit: 'Trauma ICU',
      patientName: 'Elena Rostova',
      age: 34,
      hr: 135,
      bp: '90/55',
      spo2: 89,
      respRate: 28,
      temp: 39.1,
      riskLevel: 'Critical',
      deviceMeshStatus: 'Connected (7 Sensors)',
      waveformData: [90, 130, 140, 85, 110, 135, 145, 95],
      alerts: ['Hypotensive Shock Risk', 'Severe Oxygen Desaturation'],
      timestamp: 'Just now'
    },
    {
      id: 'BED-104',
      unit: 'Surgical ICU',
      patientName: 'Robert Thorne',
      age: 72,
      hr: 88,
      bp: '130/82',
      spo2: 96,
      respRate: 18,
      temp: 37.1,
      riskLevel: 'Moderate',
      deviceMeshStatus: 'Connected (3 Sensors)',
      waveformData: [85, 88, 90, 86, 88, 89, 87, 88],
      alerts: ['Elevated Post-Op Heart Rate'],
      timestamp: '2 secs ago'
    },
    {
      id: 'BED-105',
      unit: 'Cardiovascular ICU',
      patientName: 'Amara Okafor',
      age: 51,
      hr: 64,
      bp: '115/72',
      spo2: 99,
      respRate: 14,
      temp: 36.6,
      riskLevel: 'Normal',
      deviceMeshStatus: 'Connected (6 Sensors)',
      waveformData: [62, 65, 64, 63, 66, 64, 65, 64],
      alerts: [],
      timestamp: '3 secs ago'
    }
  ]);

  const filteredBeds = useMemo(() => {
    return bedsData.filter(bed => {
      const matchesSearch =
        bed.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bed.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bed.unit.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRisk =
        bedFilter === 'all' || bed.riskLevel.toLowerCase() === bedFilter.toLowerCase();

      return matchesSearch && matchesRisk;
    });
  }, [bedsData, searchTerm, bedFilter]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-600/20 rounded-xl border border-rose-500/30 text-rose-400">
            <Radio className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Real-Time ICU Telemetry & IoT Mesh Hub
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-medium">
                Live Vitals Sync
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              High-frequency multi-parameter IoT telemetry streaming, dynamic arrhythmia wave analysis & alert escalation matrix.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isLiveStreaming
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            <Wifi className="w-4 h-4" />
            {isLiveStreaming ? 'Streaming Live Vitals' : 'Stream Paused'}
          </button>
        </div>
      </div>

      {/* Vitals Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Active Monitored Beds</p>
            <p className="text-2xl font-bold text-white mt-1">28 Units</p>
            <span className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3" /> 100% Sensor Connection
            </span>
          </div>
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Critical Escalations</p>
            <p className="text-2xl font-bold text-white mt-1">2 Patients</p>
            <span className="text-xs text-rose-400 flex items-center gap-1 mt-1">
              <AlertTriangle className="w-3 h-3 text-rose-400" /> Rapid Response Dispatched
            </span>
          </div>
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Avg Oxygen Saturation</p>
            <p className="text-2xl font-bold text-white mt-1">96.8%</p>
            <span className="text-xs text-indigo-400 flex items-center gap-1 mt-1">
              <Activity className="w-3 h-3" /> Stable Fleet Baseline
            </span>
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
            <Heart className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">IoT Sensor Telemetry Mesh</p>
            <p className="text-2xl font-bold text-white mt-1">142 Devices</p>
            <span className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
              <Wifi className="w-3 h-3" /> Latency &lt; 15ms
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
            <Cpu className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/40 p-4 border border-slate-800 rounded-xl mb-6">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search bed ID, patient or ICU unit..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-slate-400">Risk Filter:</span>
            <select
              value={bedFilter}
              onChange={e => setBedFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Beds</option>
              <option value="critical">Critical</option>
              <option value="moderate">Moderate</option>
              <option value="normal">Normal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Beds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBeds.map(bed => (
          <div
            key={bed.id}
            className={`bg-slate-900 border rounded-2xl p-5 space-y-4 transition-all shadow-lg ${
              bed.riskLevel === 'Critical'
                ? 'border-rose-500/50 shadow-rose-950/30'
                : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-lg">{bed.id}</span>
                  <span className="text-xs text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {bed.unit}
                  </span>
                </div>
                <p className="text-sm text-slate-300 font-medium mt-1">{bed.patientName} ({bed.age} y/o)</p>
              </div>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                  bed.riskLevel === 'Critical'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse'
                    : bed.riskLevel === 'Moderate'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                }`}
              >
                {bed.riskLevel}
              </span>
            </div>

            {/* Vitals Telemetry Readings */}
            <div className="grid grid-cols-4 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-center">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">HR (BPM)</p>
                <p className={`text-base font-extrabold mt-0.5 ${bed.hr > 110 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {bed.hr}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">BP (mmHg)</p>
                <p className="text-base font-extrabold text-slate-200 mt-0.5">{bed.bp}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">SpO2 (%)</p>
                <p className={`text-base font-extrabold mt-0.5 ${bed.spo2 < 92 ? 'text-rose-400' : 'text-blue-400'}`}>
                  {bed.spo2}%
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Temp (°C)</p>
                <p className="text-base font-extrabold text-amber-400 mt-0.5">{bed.temp}</p>
              </div>
            </div>

            {/* Simulated Live Waveform */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
                <span>ECG LEAD II STREAM</span>
                <span className="text-rose-400 flex items-center gap-1">
                  <Activity className="w-3 h-3 animate-spin" /> Live 250Hz
                </span>
              </div>
              <div className="h-10 flex items-end justify-between gap-1 px-1">
                {bed.waveformData.map((val, i) => (
                  <div
                    key={i}
                    style={{ height: `${(val / 150) * 100}%` }}
                    className={`w-full rounded-t transition-all ${
                      bed.riskLevel === 'Critical' ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Alerts List */}
            {bed.alerts.length > 0 && (
              <div className="space-y-1">
                {bed.alerts.map((alt, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-rose-300 bg-rose-950/40 border border-rose-900/50 p-2 rounded-lg">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{alt}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setSelectedBed(bed)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-all border border-slate-700"
            >
              Inspect Full Telemetry & Escalation
            </button>
          </div>
        ))}
      </div>

      {/* Modal Popup */}
      {selectedBed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Radio className="w-5 h-5 text-rose-500" />
                  ICU Telemetry Deep-Dive: {selectedBed.id}
                </h2>
                <p className="text-xs text-slate-400 mt-1">{selectedBed.unit} • {selectedBed.patientName}</p>
              </div>
              <button onClick={() => setSelectedBed(null)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <p className="text-xs font-semibold text-slate-400">IoT Mesh Status</p>
                <p className="text-sm text-emerald-400 font-medium">{selectedBed.deviceMeshStatus}</p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Active Alert Matrix</h4>
                {selectedBed.alerts.length === 0 ? (
                  <p className="text-sm text-slate-400">No active alerts recorded.</p>
                ) : (
                  selectedBed.alerts.map((a, i) => (
                    <div key={i} className="p-3 bg-rose-950/30 border border-rose-800/50 rounded-lg text-sm text-rose-300 mb-2">
                      {a}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setSelectedBed(null)}
                className="px-4 py-2 bg-slate-800 text-slate-200 rounded-lg text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ICUTelemetryStreamHub;
