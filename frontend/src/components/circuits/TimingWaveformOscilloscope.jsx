import React from 'react';

const TimingWaveformOscilloscope = ({ signals = [] }) => {
  return (
    <div className="bg-gray-950 p-5 rounded-2xl border border-gray-800 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-white">Digital Timing Waveform (Oscilloscope Mode)</h4>
        <span className="text-[11px] font-mono text-gray-400">Clock Domain: Async (t = 0ns to 100ns)</span>
      </div>

      <div className="space-y-3 font-mono text-xs">
        {signals.map((sig, idx) => (
          <div key={idx} className="flex items-center gap-4">
            <span className="w-28 text-gray-300 font-bold shrink-0">{sig.name}:</span>
            <div className="flex-1 h-8 bg-gray-900 rounded-lg border border-gray-800 flex items-center px-3 relative overflow-hidden">
              {/* High / Low Square Wave Line */}
              <div
                className={`h-0.5 w-full transition-all duration-300 ${
                  sig.state ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-red-500/50'
                }`}
                style={{
                  transform: sig.state ? 'translateY(-6px)' : 'translateY(6px)',
                }}
              />
              <span className={`absolute right-3 font-bold ${sig.state ? 'text-emerald-400' : 'text-gray-500'}`}>
                {sig.state ? 'HIGH (1)' : 'LOW (0)'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimingWaveformOscilloscope;
