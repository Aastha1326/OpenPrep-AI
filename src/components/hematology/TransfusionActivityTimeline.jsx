import React from 'react';

/**
 * Transfusion Activity Timeline Component.
 * Audits crossmatch status changes, emergency blood disbursements, and patient transfusions.
 */
export const TransfusionActivityTimeline = ({ orders }) => {
  if (!orders || orders.length === 0) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 text-center backdrop-blur-xl">
        <p className="text-slate-400 text-sm">No hematology transfusion audit events recorded.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-2xl">
      <h3 className="text-white font-extrabold text-xl mb-6 flex items-center gap-3">
        <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
        Transfusion & Crossmatch Telemetry Audit Ledger
      </h3>

      <div className="space-y-4">
        {orders.map((order, idx) => (
          <div
            key={order.orderId || idx}
            className="relative pl-6 border-l-2 border-slate-800 hover:border-red-500 transition-colors"
          >
            <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-slate-900 border-2 border-red-500 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
            </div>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-red-400 font-extrabold text-sm">{order.orderId}</span>
                  <span className="text-slate-400 text-xs">Patient: {order.patientName}</span>
                  <span className="bg-red-500/20 text-red-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {order.recipientBloodGroup}
                  </span>
                </div>
                <p className="text-slate-300 text-xs">
                  Hb: <strong className="text-white">{order.hemoglobinGdl} g/dL</strong> | Hct:{' '}
                  <strong className="text-white">{order.hematocritPercentage}%</strong> | Platelets:{' '}
                  <strong className="text-white">{order.plateletCountK}k</strong>
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-slate-400 text-[11px] block">Status</span>
                  <span className="text-amber-400 font-extrabold text-xs">
                    {order.crossmatchStatus}
                  </span>
                </div>
                <span className="text-slate-500 text-xs">
                  {new Date(order.createdAt || Date.now()).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
