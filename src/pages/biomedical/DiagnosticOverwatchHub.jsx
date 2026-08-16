import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Brain,
  Cpu,
  Database,
  FileText,
  Filter,
  Layers,
  RefreshCw,
  Search,
  ShieldCheck,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Sliders,
  Sparkles,
  BarChart3,
  Stethoscope,
  Microscope,
  Crosshair,
  Settings2
} from 'lucide-react';

const DiagnosticOverwatchHub = () => {
  const [activeTab, setActiveTab] = useState('overwatch');
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [confidenceThreshold, setConfidenceThreshold] = useState(85);

  const [diagnosticFeeds, setDiagnosticFeeds] = useState([
    {
      id: 'DX-9021',
      patientId: 'PT-88219',
      patientName: 'Eleanor Vance',
      age: 64,
      gender: 'Female',
      primaryModel: 'OncoVision-v4',
      modality: 'CT Thorax',
      riskScore: 94,
      riskLevel: 'Critical',
      confidence: 98.4,
      findings: 'Suspicious focal opacity right upper lobe (2.4cm). Spiculation noted.',
      timestamp: '2 mins ago',
      status: 'Pending Physician Review',
      triagePriority: 'P1'
    },
    {
      id: 'DX-9022',
      patientId: 'PT-41023',
      patientName: 'Marcus Holloway',
      age: 42,
      gender: 'Male',
      primaryModel: 'CardioPulse-AI',
      modality: 'ECG 12-Lead Stream',
      riskScore: 78,
      riskLevel: 'High',
      confidence: 91.2,
      findings: 'Paroxysmal Atrial Fibrillation with rapid ventricular response pattern.',
      timestamp: '5 mins ago',
      status: 'Escalated to ICU',
      triagePriority: 'P1'
    },
    {
      id: 'DX-9023',
      patientId: 'PT-19204',
      patientName: 'Sophia Rodriguez',
      age: 29,
      gender: 'Female',
      primaryModel: 'NeuroGene-X',
      modality: 'Brain MRI T2-FLAIR',
      riskScore: 32,
      riskLevel: 'Low',
      confidence: 99.1,
      findings: 'Unremarkable brain parenchyma. No demyelinating lesions detected.',
      timestamp: '12 mins ago',
      status: 'Verified',
      triagePriority: 'P3'
    },
    {
      id: 'DX-9024',
      patientId: 'PT-63910',
      patientName: 'Arthur Pendelton',
      age: 71,
      gender: 'Male',
      primaryModel: 'SepsisEarlyGuard',
      modality: 'EHR Telemetry Stream',
      riskScore: 88,
      riskLevel: 'Critical',
      confidence: 94.7,
      findings: 'SOFA score elevation (+3 points). Lactate trend rising (3.8 mmol/L).',
      timestamp: '15 mins ago',
      status: 'Alert Triggered',
      triagePriority: 'P1'
    },
    {
      id: 'DX-9025',
      patientId: 'PT-33109',
      patientName: 'Chloe Bennett',
      age: 53,
      gender: 'Female',
      primaryModel: 'PathoScan-Ultra',
      modality: 'Histopathology Slide',
      riskScore: 61,
      riskLevel: 'Moderate',
      confidence: 87.5,
      findings: 'Atypical ductal hyperplasia with nuclear pleomorphism.',
      timestamp: '22 mins ago',
      status: 'Under AI Review',
      triagePriority: 'P2'
    }
  ]);

  const filteredFeeds = useMemo(() => {
    return diagnosticFeeds.filter(feed => {
      const matchesSearch =
        feed.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feed.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feed.findings.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feed.primaryModel.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRisk =
        riskFilter === 'all' || feed.riskLevel.toLowerCase() === riskFilter.toLowerCase();

      return matchesSearch && matchesRisk;
    });
  }, [diagnosticFeeds, searchTerm, riskFilter]);

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const newFeed = {
        id: `DX-${Math.floor(1000 + Math.random() * 9000)}`,
        patientId: `PT-${Math.floor(10000 + Math.random() * 90000)}`,
        patientName: 'Simulated Patient Event',
        age: Math.floor(25 + Math.random() * 60),
        gender: Math.random() > 0.5 ? 'Male' : 'Female',
        primaryModel: 'AutoTriage-GenAI',
        modality: 'Realtime Telemetry Sync',
        riskScore: Math.floor(40 + Math.random() * 55),
        riskLevel: Math.random() > 0.5 ? 'High' : 'Critical',
        confidence: Number((88 + Math.random() * 11).toFixed(1)),
        findings: 'Automated synthetic diagnostic payload trigger evaluated via model mesh.',
        timestamp: 'Just now',
        status: 'Pending Physician Review',
        triagePriority: 'P1'
      };
      setDiagnosticFeeds(prev => [newFeed, ...prev]);
      setIsSimulating(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/20 rounded-xl border border-indigo-500/30 text-indigo-400">
              <Brain className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Biomedical AI Diagnostics Hub
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-medium">
                  v4.2 Overwatch
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Real-time neural model diagnostic streaming, patient risk stratifications & multimodal EHR insight synthesis.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            <Zap className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
            {isSimulating ? 'Processing Pipeline...' : 'Run Neural Inference Demo'}
          </button>
          <button className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-sm text-slate-300 font-medium transition-all">
            <RefreshCw className="w-4 h-4" />
            Sync Engine
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Active Neural Models</p>
            <p className="text-2xl font-bold text-white mt-1">14 Subsystems</p>
            <span className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3" /> All Models Operational
            </span>
          </div>
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg">
            <Cpu className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">High/Critical Risk Alerts</p>
            <p className="text-2xl font-bold text-white mt-1">3 Cases</p>
            <span className="text-xs text-rose-400 flex items-center gap-1 mt-1">
              <AlertTriangle className="w-3 h-3" /> Requires Immediate Action
            </span>
          </div>
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Avg Diagnostic Confidence</p>
            <p className="text-2xl font-bold text-white mt-1">96.2%</p>
            <span className="text-xs text-indigo-400 flex items-center gap-1 mt-1">
              <Sparkles className="w-3 h-3" /> Calibrated Threshold
            </span>
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">24h Ingested Payload</p>
            <p className="text-2xl font-bold text-white mt-1">12,490 Records</p>
            <span className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> +14.2% Volume Stream
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
            <Database className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-6 mb-6">
        <button
          onClick={() => setActiveTab('overwatch')}
          className={`pb-3 text-sm font-medium transition-all relative flex items-center gap-2 ${
            activeTab === 'overwatch'
              ? 'text-indigo-400 border-b-2 border-indigo-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Eye className="w-4 h-4" />
          Live Diagnostic Overwatch
        </button>
        <button
          onClick={() => setActiveTab('models')}
          className={`pb-3 text-sm font-medium transition-all relative flex items-center gap-2 ${
            activeTab === 'models'
              ? 'text-indigo-400 border-b-2 border-indigo-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-4 h-4" />
          Neural Model Registry
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 text-sm font-medium transition-all relative flex items-center gap-2 ${
            activeTab === 'analytics'
              ? 'text-indigo-400 border-b-2 border-indigo-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Population Risk Analytics
        </button>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'overwatch' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/40 p-4 border border-slate-800 rounded-xl">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search patient, ID, findings or model..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400">Risk Filter:</span>
                <select
                  value={riskFilter}
                  onChange={e => setRiskFilter(e.target.value)}
                  className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="moderate">Moderate</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400">Min Confidence:</span>
                <input
                  type="range"
                  min="50"
                  max="99"
                  value={confidenceThreshold}
                  onChange={e => setConfidenceThreshold(Number(e.target.value))}
                  className="w-20 accent-indigo-500"
                />
                <span className="text-indigo-400 font-semibold">{confidenceThreshold}%</span>
              </div>
            </div>
          </div>

          {/* Diagnostic Feeds Grid */}
          <div className="grid grid-cols-1 gap-4">
            {filteredFeeds.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/30 border border-slate-800 rounded-xl">
                <Stethoscope className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">No diagnostic records matching current filters.</p>
              </div>
            ) : (
              filteredFeeds.map(feed => (
                <div
                  key={feed.id}
                  className="bg-slate-900/70 border border-slate-800/90 hover:border-slate-700 rounded-xl p-5 transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-bold text-white text-lg">{feed.patientName}</span>
                      <span className="text-xs text-slate-500 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {feed.patientId}
                      </span>
                      <span className="text-xs text-slate-400">{feed.age} yrs • {feed.gender}</span>
                      
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                          feed.riskLevel === 'Critical'
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                            : feed.riskLevel === 'High'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        }`}
                      >
                        {feed.riskLevel} Risk ({feed.riskScore}/100)
                      </span>
                    </div>

                    <p className="text-sm text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800/50">
                      <span className="font-semibold text-indigo-400 mr-2">AI Findings:</span>
                      {feed.findings}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                        Model: <strong className="text-slate-200">{feed.primaryModel}</strong>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-400" />
                        Modality: <strong className="text-slate-200">{feed.modality}</strong>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Confidence: <strong className="text-emerald-400">{feed.confidence}%</strong>
                      </span>
                      <span className="text-slate-500">• {feed.timestamp}</span>
                    </div>
                  </div>

                  <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-800 gap-3">
                    <span className="text-xs px-3 py-1 rounded-md bg-slate-800 text-slate-300 font-medium">
                      {feed.status}
                    </span>
                    <button
                      onClick={() => setSelectedPatient(feed)}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold transition-all"
                    >
                      <Crosshair className="w-3.5 h-3.5" />
                      Inspect Insights
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Model Registry Tab */}
      {activeTab === 'models' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'OncoVision-v4', type: 'Computer Vision', acc: '99.1%', status: 'Active' },
            { name: 'CardioPulse-AI', type: 'Signal Telemetry', acc: '97.8%', status: 'Active' },
            { name: 'SepsisEarlyGuard', type: 'EHR Predictor', acc: '95.4%', status: 'Active' },
            { name: 'NeuroGene-X', type: 'Genomic & MRI Synthesis', acc: '98.6%', status: 'Active' },
            { name: 'PathoScan-Ultra', type: 'Cellular Pathology', acc: '96.9%', status: 'Active' }
          ].map((m, idx) => (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-white text-base">{m.name}</h3>
                  <p className="text-xs text-slate-400">{m.type}</p>
                </div>
                <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-medium">
                  {m.status}
                </span>
              </div>
              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Validation Accuracy:</span>
                  <span className="text-slate-200 font-mono">{m.acc}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Latency:</span>
                  <span className="text-slate-200 font-mono">140ms</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Inspection Popup */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Microscope className="w-5 h-5 text-indigo-400" />
                  Diagnostic Deep Dive: {selectedPatient.patientName}
                </h2>
                <p className="text-xs text-slate-400 mt-1">Payload Reference ID: {selectedPatient.id}</p>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/50"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500">Primary Model:</span>
                  <p className="text-slate-200 font-medium">{selectedPatient.primaryModel}</p>
                </div>
                <div>
                  <span className="text-slate-500">Modality:</span>
                  <p className="text-slate-200 font-medium">{selectedPatient.modality}</p>
                </div>
                <div>
                  <span className="text-slate-500">Risk Score:</span>
                  <p className="text-rose-400 font-bold">{selectedPatient.riskScore} / 100</p>
                </div>
                <div>
                  <span className="text-slate-500">AI Confidence:</span>
                  <p className="text-emerald-400 font-bold">{selectedPatient.confidence}%</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Synthesized Neural Findings</h4>
                <p className="text-sm text-slate-200 bg-slate-950 p-4 rounded-xl border border-slate-800 leading-relaxed">
                  {selectedPatient.findings}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setSelectedPatient(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-all"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert(`Alert dispatched for ${selectedPatient.patientName}`);
                  setSelectedPatient(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-all"
              >
                Confirm & Dispatch Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagnosticOverwatchHub;
