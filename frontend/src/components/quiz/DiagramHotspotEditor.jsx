import React, { useState, useRef } from 'react';
import { Upload, Plus, Trash2, CheckCircle, Sparkles } from 'lucide-react';
import api from '../../services/api';

const DiagramHotspotEditor = ({ onSaveHotspots }) => {
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [activeLabel, setActiveLabel] = useState('');
  const [activePrompt, setActivePrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const imageRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleCanvasClick = (e) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const xPct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const yPct = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const newHotspot = {
      id: `hs-${Date.now()}`,
      type: 'CIRCLE',
      label: activeLabel || `Target Zone ${hotspots.length + 1}`,
      prompt: activePrompt || `Click on the ${activeLabel || 'indicated region'} in the diagram below.`,
      center: { x: xPct, y: yPct },
      radiusPercent: 12,
    };

    setHotspots((prev) => [...prev, newHotspot]);
  };

  const handleAutoGenerate = async () => {
    setGenerating(true);
    try {
      const formData = new FormData();
      if (imageFile) formData.append('image', imageFile);
      formData.append('topic', activeLabel || 'Medical / STEM Diagram');

      const res = await api.post('/quizzes/diagram-hotspot/generate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data && res.data.success) {
        setHotspots(res.data.data.hotspots);
      }
    } catch (err) {
      console.error('Error generating AI hotspots:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleRemoveHotspot = (id) => {
    setHotspots((prev) => prev.filter((h) => h.id !== id));
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div>
          <h3 className="text-stone-100 font-extrabold text-base font-playfair flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-400" />
            Educator Diagram Hotspot Editor
          </h3>
          <p className="text-stone-400 text-xs mt-0.5">Upload a diagram and click to position interactive SVG target zones</p>
        </div>

        {imagePreview && (
          <button
            onClick={handleAutoGenerate}
            disabled={generating}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {generating ? 'AI Detecting Hotspots...' : 'Auto-Detect Hotspots via AI'}
          </button>
        )}
      </div>

      {!imagePreview ? (
        <label className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-neutral-700 hover:border-indigo-500 rounded-2xl cursor-pointer bg-neutral-950/60 transition-all group">
          <Upload className="w-10 h-10 text-stone-400 group-hover:text-indigo-400 mb-2 transition-colors" />
          <span className="text-stone-300 text-xs font-bold">Click to upload diagram image (PNG, JPG, SVG)</span>
          <span className="text-stone-500 text-[10px] mt-1">Biology, Medicine, Circuits, Mechanical figures supported</span>
          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </label>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Canvas Viewport */}
          <div className="md:col-span-2 relative border border-neutral-800 rounded-2xl bg-neutral-950 overflow-hidden flex items-center justify-center p-2">
            <div className="relative cursor-crosshair max-w-full" onClick={handleCanvasClick}>
              <img ref={imageRef} src={imagePreview} alt="Hotspot Target Canvas" className="rounded-xl max-h-96 object-contain select-none" />
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {hotspots.map((h) => (
                  <g key={h.id}>
                    <circle cx={`${h.center.x}%`} cy={`${h.center.y}%`} r={`${h.radiusPercent}%`} className="fill-indigo-500/20 stroke-indigo-400 stroke-2" />
                    <text x={`${h.center.x}%`} y={`${h.center.y}%`} fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle" dy=".3em">
                      {h.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Form & Hotspot List */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-stone-400 text-xs font-bold">Hotspot Target Label</label>
              <input
                type="text"
                placeholder="e.g. Mitochondria / Resistor R1"
                value={activeLabel}
                onChange={(e) => setActiveLabel(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-stone-200 text-xs focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-stone-400 text-xs font-bold">Question Prompt</label>
              <input
                type="text"
                placeholder="e.g. Click on the Mitochondria in the diagram"
                value={activePrompt}
                onChange={(e) => setActivePrompt(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-stone-200 text-xs focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="border-t border-neutral-800 pt-3 space-y-2">
              <span className="text-stone-400 text-xs font-bold">Defined Hotspots ({hotspots.length})</span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {hotspots.map((h) => (
                  <div key={h.id} className="flex items-center justify-between p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-stone-300">
                    <div>
                      <strong className="block font-bold">{h.label}</strong>
                      <span className="text-[10px] text-stone-500">Center ({h.center.x}%, {h.center.y}%)</span>
                    </div>
                    <button onClick={() => handleRemoveHotspot(h.id)} className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {hotspots.length > 0 && (
              <button
                onClick={() => onSaveHotspots && onSaveHotspots({ imagePreview, hotspots })}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" /> Save Diagram Question
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagramHotspotEditor;
