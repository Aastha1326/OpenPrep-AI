import React from 'react';

const TruthTableCard = ({ currentA = 0, currentB = 0 }) => {
  const rows = [
    { a: 0, b: 0, sum: 0, carry: 0 },
    { a: 0, b: 1, sum: 1, carry: 0 },
    { a: 1, b: 0, sum: 1, carry: 0 },
    { a: 1, b: 1, sum: 0, carry: 1 },
  ];

  return (
    <div className="bg-gray-950 p-5 rounded-2xl border border-gray-800 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-white">Full Half Adder Truth Table (2² = 4 States)</h4>
        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          Active: A={currentA}, B={currentB}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 uppercase font-mono">
              <th className="py-2.5 px-4">Pin A</th>
              <th className="py-2.5 px-4">Pin B</th>
              <th className="py-2.5 px-4 text-purple-400">Sum (A ⊕ B)</th>
              <th className="py-2.5 px-4 text-blue-400">Carry (A ∧ B)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-850 font-mono">
            {rows.map((r, idx) => {
              const isActive = r.a === currentA && r.b === currentB;
              return (
                <tr
                  key={idx}
                  className={`transition-colors ${
                    isActive ? 'bg-emerald-500/10 text-emerald-300 font-bold' : 'text-gray-300 hover:bg-gray-900'
                  }`}
                >
                  <td className="py-2.5 px-4">{r.a}</td>
                  <td className="py-2.5 px-4">{r.b}</td>
                  <td className="py-2.5 px-4">{r.sum}</td>
                  <td className="py-2.5 px-4">{r.carry}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TruthTableCard;
