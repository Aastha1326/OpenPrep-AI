import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, MousePointer2, Save, X, PlusCircle } from 'lucide-react';
import api from '../../services/api';

/**
 * MVP Model Viewer for 3D Annotations (Issue #1293)
 * Note: Due to the complexity of Three.js, this MVP uses a mock 2D bounding box
 * with CSS 3D transforms to simulate the spatial annotation UI workflow.
 * Full Three.js Canvas injection will follow in the next iteration.
 */
const ModelViewer = ({ onClose }) => {
  const [annotations, setAnnotations] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [activePin, setActivePin] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const containerRef = useRef(null);

  // Rotate state to simulate 3D inspection
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const prevMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Fetch mock metadata
    api.get('/visualizer/annotations/model_123').then(res => {
      if (res.data?.annotations) {
        setAnnotations(res.data.annotations);
      }
    }).catch(console.error);
  }, []);

  const handlePointerDown = (e) => {
    if (isAdding) return;
    isDragging.current = true;
    prevMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current || isAdding) return;
    const deltaX = e.clientX - prevMouse.current.x;
    const deltaY = e.clientY - prevMouse.current.y;
    
    setRotation(prev => ({
      x: prev.x - deltaY * 0.5,
      y: prev.y + deltaX * 0.5
    }));
    
    prevMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleAddClick = (e) => {
    if (!isAdding || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    // Calculate relative coordinates in percentage for the mock surface
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const newPin = {
      id: Date.now(),
      x, y, z: 0, // Mock Z
      label: 'New Annotation',
      content: ''
    };
    
    setAnnotations([...annotations, newPin]);
    setActivePin(newPin.id);
    setIsAdding(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.post('/visualizer/annotations', {
        modelId: 'model_123',
        annotations
      });
      // In real app, toast success
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const updatePin = (id, field, value) => {
    setAnnotations(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
    >
      <div className="bg-stone-900 border border-stone-700 w-full max-w-6xl h-[85vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl relative">
        
        {/* Header */}
        <div className="p-4 border-b border-stone-800 flex justify-between items-center bg-stone-950">
          <div className="flex items-center gap-3">
            <Box className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-bold text-stone-200">3D Anatomy Visualizer</h2>
            <span className="text-xs bg-stone-800 text-stone-400 px-2 py-1 rounded">MVP Simulator</span>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setIsAdding(!isAdding)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                isAdding ? 'bg-amber-600 text-white shadow-[0_0_15px_rgba(217,119,6,0.5)]' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <MousePointer2 className="w-4 h-4" />
              {isAdding ? 'Click surface to drop pin' : 'Add Annotation'}
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Meta'}
            </button>
            <button onClick={onClose} className="text-stone-400 hover:text-white p-2">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Workspace */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Sidebar - Pins List */}
          <div className="w-80 bg-stone-950 border-r border-stone-800 overflow-y-auto p-4 flex flex-col gap-4">
            <h3 className="text-stone-400 font-medium uppercase tracking-wider text-sm mb-2">Spatial Annotations</h3>
            <AnimatePresence>
              {annotations.map(pin => (
                <motion.div
                  key={pin.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    activePin === pin.id ? 'bg-stone-800 border-amber-500/50' : 'bg-stone-900 border-stone-800 hover:border-stone-700'
                  }`}
                  onClick={() => setActivePin(pin.id)}
                >
                  <input
                    type="text"
                    value={pin.label}
                    onChange={(e) => updatePin(pin.id, 'label', e.target.value)}
                    className="w-full bg-transparent text-stone-200 font-bold outline-none mb-2"
                    placeholder="Structure Name..."
                  />
                  <textarea
                    value={pin.content}
                    onChange={(e) => updatePin(pin.id, 'content', e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded p-2 text-sm text-stone-400 outline-none focus:border-amber-500/30 resize-none h-20"
                    placeholder="Enter details..."
                  />
                  <div className="text-[10px] text-stone-600 font-mono mt-2 flex justify-between">
                    <span>X: {pin.x.toFixed(2)}</span>
                    <span>Y: {pin.y.toFixed(2)}</span>
                    <span>Z: {pin.z.toFixed(2)}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {annotations.length === 0 && (
              <div className="text-stone-600 text-center py-8 text-sm">No annotations added yet.</div>
            )}
          </div>

          {/* 3D Canvas Area (Mock) */}
          <div className="flex-1 bg-stone-900 relative overflow-hidden flex items-center justify-center">
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            
            <div 
              ref={containerRef}
              className={`w-[600px] h-[600px] relative transition-transform duration-75 ${isAdding ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`}
              style={{
                perspective: '1000px',
                transformStyle: 'preserve-3d'
              }}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onPointerMove={handlePointerMove}
              onClick={handleAddClick}
            >
              {/* Mock 3D Model Geometry */}
              <div 
                className="absolute inset-0 bg-stone-800 border border-stone-700 rounded-3xl shadow-2xl flex items-center justify-center overflow-hidden"
                style={{
                  transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                  transformStyle: 'preserve-3d'
                }}
              >
                <div className="text-stone-600 font-bold text-4xl opacity-50 flex flex-col items-center select-none pointer-events-none">
                  <Box className="w-32 h-32 mb-4" />
                  MOCK 3D MESH
                </div>

                {/* Render Pins on the mesh surface */}
                {annotations.map(pin => (
                  <div
                    key={`pin-${pin.id}`}
                    className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full bg-amber-500 shadow-[0_0_15px_rgba(217,119,6,0.8)] border-2 border-white flex items-center justify-center cursor-pointer hover:scale-125 transition-transform"
                    style={{ left: `${pin.x}%`, top: `${pin.y}%`, transform: 'translateZ(1px)' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePin(pin.id);
                    }}
                  >
                    <PlusCircle className="w-4 h-4 text-stone-900" />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Overlay instruction */}
            <div className="absolute bottom-6 right-6 bg-stone-950/80 backdrop-blur border border-stone-800 text-stone-400 p-4 rounded-xl text-sm max-w-xs pointer-events-none">
              <p className="font-bold text-stone-200 mb-1">Controls</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Drag to rotate mock model</li>
                <li>Toggle "Add Annotation" to place a pin</li>
                <li>Select pins to edit metadata</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
};

export default ModelViewer;
