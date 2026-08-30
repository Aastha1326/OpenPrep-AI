import React from 'react';

const MatrixInspectorCard = () => {
  const adjacencyMatrix = [
    [0, 4, 2, 0],
    [4, 0, 1, 5],
    [2, 1, 0, 8],
    [0, 5, 8, 0],
  ];

  const labels = ['A', 'B', 'C', 'D'];

  return (
    <div className="bg-gray-950 p-6 rounded-2xl border border-gray-800 space-y-6">
      <div>
        <h4 className="text-sm font-bold text-white">Weighted Adjacency Matrix (A)</h4>
        <p className="text-xs text-gray-400">Node-to-node edge connection weights</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono text-center">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400">
              <th className="p-3"></th>
              {labels.map((l) => (
                <th key={l} className="p-3 text-amber-400 font-bold">{l}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-850">
            {adjacencyMatrix.map((row, i) => (
              <tr key={i} className="hover:bg-gray-900">
                <td className="p-3 font-bold text-amber-400">{labels[i]}</td>
                {row.map((val, j) => (
                  <td key={j} className={`p-3 ${val > 0 ? 'text-emerald-300 font-bold bg-emerald-500/5' : 'text-gray-600'}`}>
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MatrixInspectorCard;
