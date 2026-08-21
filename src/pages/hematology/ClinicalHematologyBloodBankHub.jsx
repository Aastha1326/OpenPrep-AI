import React, { useState } from 'react';
import { BloodUnitCard } from '../../components/hematology/BloodUnitCard';
import { TransfusionActivityTimeline } from '../../components/hematology/TransfusionActivityTimeline';

/**
 * Clinical Hematology & Transfusion Blood Bank Dashboard Page.
 * Manages donor blood units, ABO/Rh crossmatching, emergency STAT orders,
 * and real-time transfusion telemetry audit logging.
 */
export default function ClinicalHematologyBloodBankHub() {
  const [bloodUnits, setBloodUnits] = useState([
    {
      unitId: 'PRBC-90412',
      donorId: 'DNR-771',
      bloodGroup: 'O-',
      componentType: 'Packed Red Blood Cells',
      volumeMl: 350,
      storageTemperatureCelsius: 4.0,
      expirationDate: '2026-09-15',
      status: 'AVAILABLE',
    },
    {
      unitId: 'FFP-33109',
      donorId: 'DNR-804',
      bloodGroup: 'A+',
      componentType: 'Fresh Frozen Plasma',
      volumeMl: 250,
      storageTemperatureCelsius: -18.0,
      expirationDate: '2026-11-20',
      status: 'AVAILABLE',
    },
    {
      unitId: 'PLT-55201',
      donorId: 'DNR-912',
      bloodGroup: 'B+',
      componentType: 'Platelet Concentrate',
      volumeMl: 200,
      storageTemperatureCelsius: 22.0,
      expirationDate: '2026-08-28',
      status: 'CROSSMATCHED',
    },
  ]);

  const [orders, setOrders] = useState([
    {
      orderId: 'HEM-ORD-8819',
      patientId: 'PT-4091',
      patientName: 'Marcus Vance',
      recipientBloodGroup: 'O+',
      hemoglobinGdl: 6.8,
      hematocritPercentage: 20.4,
      plateletCountK: 145,
      requestedUnitsCount: 2,
      urgencyLevel: 'STAT_EMERGENCY',
      crossmatchStatus: 'COMPATIBLE',
      createdAt: '2026-08-21T02:00:00Z',
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterBloodGroup, setFilterBloodGroup] = useState('ALL');
  const [showOrderModal, setShowOrderModal] = useState(false);

  const [newOrder, setNewOrder] = useState({
    patientName: '',
    patientId: '',
    recipientBloodGroup: 'O-',
    hemoglobinGdl: 7.0,
    hematocritPercentage: 21.0,
    plateletCountK: 150,
    requestedUnitsCount: 1,
    urgencyLevel: 'ROUTINE',
  });

  const handleCreateOrder = (e) => {
    e.preventDefault();
    const created = {
      orderId: `HEM-ORD-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      ...newOrder,
      crossmatchStatus: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    setOrders([created, ...orders]);
    setShowOrderModal(false);
  };

  const filteredUnits = bloodUnits.filter((unit) => {
    const matchesSearch =
      unit.unitId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.donorId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = filterBloodGroup === 'ALL' || unit.bloodGroup === filterBloodGroup;
    return matchesSearch && matchesGroup;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-red-950/40 to-slate-900 border border-slate-800 rounded-3xl p-8 mb-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                FDA 21 CFR Part 600 Compliant
              </span>
              <span className="bg-slate-800 text-slate-300 text-xs font-bold px-3 py-1 rounded-full">
                ABO/Rh Crossmatch Engine
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">
              Clinical Hematology & Transfusion Blood Bank
            </h1>
            <p className="text-slate-400 text-sm md:text-base max-w-2xl">
              Real-time telemetry surveillance for donor unit inventory, ABO compatibility verification, emergency STAT blood requests, and transfusion safety audit trails.
            </p>
          </div>

          <button
            onClick={() => setShowOrderModal(true)}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-extrabold px-6 py-3.5 rounded-2xl shadow-xl shadow-red-600/25 transition-all transform hover:-translate-y-0.5"
          >
            + New Transfusion Order
          </button>
        </div>
      </div>

      {/* Telemetry Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">
            Total Inventory Units
          </span>
          <span className="text-white text-3xl font-black">{bloodUnits.length}</span>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">
            Universal O- Units
          </span>
          <span className="text-red-400 text-3xl font-black">
            {bloodUnits.filter((u) => u.bloodGroup === 'O-').length}
          </span>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">
            Crossmatched Units
          </span>
          <span className="text-amber-400 text-3xl font-black">
            {bloodUnits.filter((u) => u.status === 'CROSSMATCHED').length}
          </span>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">
            Pending Orders
          </span>
          <span className="text-indigo-400 text-3xl font-black">
            {orders.filter((o) => o.crossmatchStatus === 'PENDING').length}
          </span>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by Unit ID or Donor ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-white rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-red-500 flex-grow"
        />

        <select
          value={filterBloodGroup}
          onChange={(e) => setFilterBloodGroup(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-white rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-red-500"
        >
          <option value="ALL">All Blood Groups</option>
          <option value="O-">O Negative (Universal)</option>
          <option value="O+">O Positive</option>
          <option value="A+">A Positive</option>
          <option value="A-">A Negative</option>
          <option value="B+">B Positive</option>
          <option value="B-">B Negative</option>
          <option value="AB+">AB Positive</option>
          <option value="AB-">AB Negative</option>
        </select>
      </div>

      {/* Blood Units Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {filteredUnits.map((unit) => (
          <BloodUnitCard
            key={unit.unitId}
            unit={unit}
            onCrossmatchSelect={(u) => alert(`Initiated crossmatch workflow for Unit ${u.unitId}`)}
          />
        ))}
      </div>

      {/* Audit Timeline */}
      <TransfusionActivityTimeline orders={orders} />

      {/* New Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-xl w-full shadow-2xl">
            <h3 className="text-white font-extrabold text-2xl mb-6">Create Transfusion Order</h3>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="text-slate-400 text-xs font-bold block mb-1">Patient Name</label>
                <input
                  type="text"
                  required
                  value={newOrder.patientName}
                  onChange={(e) => setNewOrder({ ...newOrder, patientName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-xs font-bold block mb-1">Patient ID</label>
                  <input
                    type="text"
                    required
                    value={newOrder.patientId}
                    onChange={(e) => setNewOrder({ ...newOrder, patientId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-sm"
                  />
                </div>

                <div>
                  <label className="text-slate-400 text-xs font-bold block mb-1">Recipient Blood Group</label>
                  <select
                    value={newOrder.recipientBloodGroup}
                    onChange={(e) => setNewOrder({ ...newOrder, recipientBloodGroup: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-sm"
                  >
                    <option value="O-">O-</option>
                    <option value="O+">O+</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 text-xs font-bold block mb-1">Hb (g/dL)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newOrder.hemoglobinGdl}
                    onChange={(e) => setNewOrder({ ...newOrder, hemoglobinGdl: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-bold block mb-1">Hematocrit %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newOrder.hematocritPercentage}
                    onChange={(e) => setNewOrder({ ...newOrder, hematocritPercentage: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-bold block mb-1">Platelets (k)</label>
                  <input
                    type="number"
                    value={newOrder.plateletCountK}
                    onChange={(e) => setNewOrder({ ...newOrder, plateletCountK: parseInt(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="bg-slate-800 text-slate-300 font-bold px-5 py-2.5 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm"
                >
                  Submit Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
