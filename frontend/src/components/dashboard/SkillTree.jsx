import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Zap, Target, Lock, Unlock, X } from 'lucide-react';
import api from '../../services/api';

const SkillTree = ({ onClose }) => {
  const [progression, setProgression] = useState({
    level: 1,
    totalXP: 0,
    skillPoints: 0,
    unlockedNodes: []
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/progress/xp/status')
      .then(res => {
        if (res.data.success) {
          setProgression({
            level: res.data.level,
            totalXP: res.data.totalXP,
            skillPoints: res.data.skillPoints,
            unlockedNodes: res.data.unlockedNodes || ['root']
          });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleUnlock = async (nodeId, cost) => {
    if (progression.unlockedNodes.includes(nodeId) || progression.skillPoints < cost) return;

    try {
      const res = await api.post('/progress/xp/unlock', { nodeId });
      setProgression(prev => ({
        ...prev,
        skillPoints: prev.skillPoints - cost,
        unlockedNodes: [...prev.unlockedNodes, nodeId]
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const Node = ({ id, label, icon: Icon, x, y, cost, parentId }) => {
    const isUnlocked = progression.unlockedNodes.includes(id);
    const canUnlock = progression.unlockedNodes.includes(parentId) && progression.skillPoints >= cost;

    return (
      <div 
        className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer z-10"
        style={{ left: `${x}%`, top: `${y}%` }}
        onClick={() => !isUnlocked && canUnlock && handleUnlock(id, cost)}
      >
        <motion.div 
          whileHover={canUnlock ? { scale: 1.1 } : {}}
          className={`w-16 h-16 rounded-full flex items-center justify-center border-4 shadow-xl transition-colors duration-300 ${
            isUnlocked 
              ? 'bg-amber-500 border-amber-300 text-stone-900 shadow-amber-500/50' 
              : canUnlock 
                ? 'bg-stone-800 border-amber-600 text-amber-500 animate-pulse'
                : 'bg-stone-900 border-stone-700 text-stone-600'
          }`}
        >
          {isUnlocked ? <Unlock className="w-6 h-6 opacity-50 absolute bottom-1 right-1" /> : !canUnlock && <Lock className="w-5 h-5 absolute bottom-1 right-1" />}
          <Icon className="w-8 h-8" />
        </motion.div>
        
        <div className="mt-3 bg-stone-900/80 backdrop-blur-sm border border-stone-800 px-3 py-1 rounded-lg text-center">
          <p className={`font-bold text-sm ${isUnlocked ? 'text-amber-400' : 'text-stone-400'}`}>{label}</p>
          {!isUnlocked && (
            <p className="text-xs text-amber-600 font-mono mt-1">{cost} SP</p>
          )}
        </div>
      </div>
    );
  };

  const Line = ({ x1, y1, x2, y2, active }) => (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
      <line 
        x1={`${x1}%`} y1={`${y1}%`} 
        x2={`${x2}%`} y2={`${y2}%`} 
        stroke={active ? '#f59e0b' : '#44403c'} 
        strokeWidth="4" 
        strokeDasharray={active ? 'none' : '5,5'}
        className="transition-colors duration-1000"
      />
    </svg>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
    >
      <div className="bg-stone-950 border border-stone-800 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden relative shadow-2xl">
        
        <button onClick={onClose} className="absolute top-6 right-6 text-stone-400 hover:text-white z-50 transition">
          <X className="w-8 h-8" />
        </button>

        <div className="p-8 border-b border-stone-800 bg-stone-900/50 flex justify-between items-end relative z-20">
          <div>
            <h2 className="text-4xl font-playfair font-bold text-amber-500 mb-2">Skill Tree</h2>
            <p className="text-stone-400">Unlock perks to enhance your study sessions.</p>
          </div>
          <div className="text-right">
            <p className="text-stone-400 font-medium mb-1">Level {progression.level} <span className="text-stone-600 ml-2">({progression.totalXP} XP)</span></p>
            <div className="inline-flex items-center gap-2 bg-stone-800 border border-amber-900/50 px-4 py-2 rounded-xl">
              <Zap className="w-5 h-5 text-amber-400" />
              <span className="text-amber-400 font-bold text-xl">{progression.skillPoints}</span>
              <span className="text-stone-400 text-sm font-medium">Skill Points</span>
            </div>
          </div>
        </div>

        <div className="flex-1 relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-900 to-stone-950">
          
          {/* Background Grid */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#f59e0b 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center text-amber-500 animate-pulse">Loading Tree...</div>
          ) : (
            <div className="absolute inset-0">
              {/* Lines */}
              <Line x1={50} y1={80} x2={30} y2={50} active={progression.unlockedNodes.includes('memory_1')} />
              <Line x1={50} y1={80} x2={70} y2={50} active={progression.unlockedNodes.includes('focus_1')} />
              <Line x1={30} y1={50} x2={30} y2={20} active={progression.unlockedNodes.includes('memory_2')} />
              <Line x1={70} y1={50} x2={70} y2={20} active={progression.unlockedNodes.includes('focus_2')} />

              {/* Nodes */}
              <Node id="root" parentId={null} label="Novice Scholar" icon={Brain} x={50} y={80} cost={0} />
              
              <Node id="memory_1" parentId="root" label="Eidetic Memory I" icon={Target} x={30} y={50} cost={1} />
              <Node id="memory_2" parentId="memory_1" label="Eidetic Memory II" icon={Target} x={30} y={20} cost={2} />
              
              <Node id="focus_1" parentId="root" label="Deep Work I" icon={Zap} x={70} y={50} cost={1} />
              <Node id="focus_2" parentId="focus_1" label="Deep Work II" icon={Zap} x={70} y={20} cost={2} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SkillTree;
