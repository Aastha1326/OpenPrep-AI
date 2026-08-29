import React, { useState } from 'react';
import { Check, X, Sparkles } from 'lucide-react';
import LanguageAccentToolbar from './LanguageAccentToolbar';

const ConjugationMatrixTable = () => {
  const [inputs, setInputs] = useState({
    yo: '',
    tu: '',
    el: '',
    nosotros: '',
    vosotros: '',
    ellos: '',
  });

  const correctAnswers = {
    yo: 'hablo',
    tu: 'hablas',
    el: 'habla',
    nosotros: 'hablamos',
    vosotros: 'habláis',
    ellos: 'hablan',
  };

  const [activeField, setActiveField] = useState('yo');

  const handleInsertChar = (char) => {
    if (!activeField) return;
    setInputs((prev) => ({
      ...prev,
      [activeField]: (prev[activeField] || '') + char,
    }));
  };

  const pronouns = [
    { key: 'yo', label: 'Yo (I)' },
    { key: 'tu', label: 'Tú (You)' },
    { key: 'el', label: 'Él/Ella/Usted (He/She)' },
    { key: 'nosotros', label: 'Nosotros (We)' },
    { key: 'vosotros', label: 'Vosotros (You all)' },
    { key: 'ellos', label: 'Ellos/Ellas (They)' },
  ];

  return (
    <div className="bg-gray-950 p-6 rounded-2xl border border-gray-800 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-white">Verb Drill: Hablar (Presente Indicativo)</h4>
          <p className="text-xs text-gray-400">Fill in the conjugated forms or use accent shortcuts</p>
        </div>
        <span className="px-3 py-1 bg-pink-500/10 text-pink-300 text-xs font-bold rounded-full border border-pink-500/20">
          Spanish • Regular -AR
        </span>
      </div>

      <LanguageAccentToolbar onSelectChar={handleInsertChar} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {pronouns.map((p) => {
          const userVal = inputs[p.key].trim().toLowerCase();
          const isCorrect = userVal === correctAnswers[p.key];
          const hasInput = userVal.length > 0;

          return (
            <div key={p.key} className="p-3 bg-gray-900 rounded-xl border border-gray-800 space-y-1.5">
              <label className="text-xs font-bold text-gray-400">{p.label}</label>
              <div className="relative">
                <input
                  type="text"
                  value={inputs[p.key]}
                  onFocus={() => setActiveField(p.key)}
                  onChange={(e) => setInputs({ ...inputs, [p.key]: e.target.value })}
                  placeholder={`Conjugate for ${p.label}...`}
                  className={`w-full bg-gray-850 border rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none ${
                    hasInput
                      ? isCorrect
                        ? 'border-emerald-500/50 bg-emerald-950/10'
                        : 'border-red-500/50 bg-red-950/10'
                      : 'border-gray-700'
                  }`}
                />
                {hasInput && (
                  <div className="absolute right-3 top-2.5">
                    {isCorrect ? (
                      <Check size={14} className="text-emerald-400" />
                    ) : (
                      <X size={14} className="text-red-400" />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConjugationMatrixTable;
