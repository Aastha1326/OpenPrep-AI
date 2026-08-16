import React, { useState, useMemo } from 'react';
import {
  Package,
  Truck,
  Thermometer,
  ShieldCheck,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  RefreshCw,
  Clock,
  Layers,
  Database,
  Sliders,
  XCircle,
  Eye,
  Box,
  QrCode,
  Archive,
  Sparkles
} from 'lucide-react';

const PharmacySupplyChainHub = () => {
  const [activeTab, setActiveTab] = useState('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [tempFilter, setTempFilter] = useState('all');
  const [selectedBatch, setSelectedBatch] = useState(null);

  const [inventory, setInventory] = useState([
    {
      id: 'LOT-9021',
      medName: 'Comirnaty mRNA Vaccine',
      category: 'Biologics / Cold-Chain',
      targetTemp: '-70°C ± 5°C',
      currentTemp: '-71.4°C',
      tempStatus: 'Optimal',
      stockLevel: 4500,
      minThreshold: 1000,
      expiryDate: '2027-04-15',
      location: 'Cryo-Vault 04',
      rfidSensorId: 'RF-88192'
    },
    {
      id: 'LOT-9022',
      medName: 'Human Insulin Regular',
      category: 'Refrigerated Biologics',
      targetTemp: '2°C - 8°C',
      currentTemp: '4.1°C',
      tempStatus: 'Optimal',
      stockLevel: 1200,
      minThreshold: 500,
      expiryDate: '2026-11-20',
      location: 'Cold-Storage B2',
      rfidSensorId: 'RF-44102'
    },
    {
      id: 'LOT-9023',
      medName: 'Monoclonal Antibody Anti-TNF',
      category: 'Cold-Chain Injectables',
      targetTemp: '2°C - 8°C',
      currentTemp: '9.8°C',
      tempStatus: 'Excursion Alert',
      stockLevel: 320,
      minThreshold: 400,
      expiryDate: '2026-09-10',
      location: 'Transit Pod 12',
      rfidSensorId: 'RF-19284'
    },
    {
      id: 'LOT-9024',
      medName: 'Amoxicillin Trihydrate 500mg',
      category: 'Ambient Oral Solids',
      targetTemp: '15°C - 25°C',
      currentTemp: '21.0°C',
      tempStatus: 'Optimal',
      stockLevel: 18500,
      minThreshold: 5000,
      expiryDate: '2028-01-30',
      location: 'Main Depot Shelf A-14',
      rfidSensorId: 'RF-77210'
    }
  ]);

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch =
        item.medName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTemp =
        tempFilter === 'all' ||
        (tempFilter === 'excursion' && item.tempStatus === 'Excursion Alert') ||
        (tempFilter === 'optimal' && item.tempStatus === 'Optimal');

      return matchesSearch && matchesTemp;
    });
  }, [inventory, searchTerm, tempFilter]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-600/20 rounded-xl border border-emerald-500/30 text-emerald-400">
            <Package className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Pharmacy & Med-Supply Chain Automation
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                Cold-Chain IoT Stream
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Real-time cold-chain sensor monitoring, automated inventory lifecycle & pharmaceutical origin verification.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-emerald-600/20">
            <Truck className="w-4 h-4" />
            Dispatch New Cold Pod
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Active Inventory Batches</p>
            <p className="text-2xl font-bold text-white mt-1">24,520 Units</p>
            <span className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3" /> 98.4% In Stock
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
            <Box className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Temp Excursions</p>
            <p className="text-2xl font-bold text-white mt-1">1 Alert</p>
            <span className="text-xs text-rose-400 flex items-center gap-1 mt-1">
              <AlertTriangle className="w-3 h-3" /> Transit Pod 12 Over Temp
            </span>
          </div>
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg">
            <Thermometer className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">RFID Sensors Active</p>
            <p className="text-2xl font-bold text-white mt-1">482 Nodes</p>
            <span className="text-xs text-indigo-400 flex items-center gap-1 mt-1">
              <Sparkles className="w-3 h-3" /> 100% Mesh Ping
            </span>
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
            <QrCode className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Expiring within 30 days</p>
            <p className="text-2xl font-bold text-white mt-1">3 Batches</p>
            <span className="text-xs text-amber-400 flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3" /> Auto-Rotation Queued
            </span>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg">
            <Archive className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/40 p-4 border border-slate-800 rounded-xl mb-6">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search lot number, medication or depot..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-slate-400">Temp Status:</span>
            <select
              value={tempFilter}
              onChange={e => setTempFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="optimal">Optimal</option>
              <option value="excursion">Excursion Alert</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="px-6 py-4">Lot ID</th>
              <th className="px-6 py-4">Medication Name</th>
              <th className="px-6 py-4">Target Temp</th>
              <th className="px-6 py-4">Current Temp</th>
              <th className="px-6 py-4">Stock Level</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredInventory.map(item => (
              <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="px-6 py-4 font-mono text-emerald-400 font-medium">{item.id}</td>
                <td className="px-6 py-4">
                  <p className="font-semibold text-white">{item.medName}</p>
                  <p className="text-xs text-slate-500">{item.category}</p>
                </td>
                <td className="px-6 py-4 text-slate-400 font-mono text-xs">{item.targetTemp}</td>
                <td className="px-6 py-4 font-mono font-bold text-slate-200">{item.currentTemp}</td>
                <td className="px-6 py-4 font-mono">{item.stockLevel.toLocaleString()} units</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      item.tempStatus === 'Optimal'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse'
                    }`}
                  >
                    {item.tempStatus}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => setSelectedBatch(item)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-all"
                  >
                    Inspect Sensor Logs
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Popup */}
      {selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-400" />
                  Lot Inspection: {selectedBatch.id}
                </h2>
                <p className="text-xs text-slate-400 mt-1">{selectedBatch.medName}</p>
              </div>
              <button onClick={() => setSelectedBatch(null)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <p className="text-slate-400">Location: <strong className="text-slate-200">{selectedBatch.location}</strong></p>
                <p className="text-slate-400">RFID Sensor ID: <strong className="text-slate-200">{selectedBatch.rfidSensorId}</strong></p>
                <p className="text-slate-400">Expiry Date: <strong className="text-slate-200">{selectedBatch.expiryDate}</strong></p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                onClick={() => setSelectedBatch(null)}
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

export default PharmacySupplyChainHub;
