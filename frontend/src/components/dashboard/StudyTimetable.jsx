import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, X, CloudSync, Clock, Info } from 'lucide-react';
import api from '../../services/api';

/**
 * MVP Visual Study Timetable (Issue #1294)
 * Uses native HTML5 Drag and Drop for the grid matrix.
 */
const StudyTimetable = ({ onClose }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  // Mock days and hours matrix
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = ['09:00', '11:00', '13:00', '15:00', '17:00'];

  // Draggable items (Decks/Quizzes)
  const [inventory, setInventory] = useState([
    { id: 'deck-1', type: 'deck', title: 'Biology Ch 4', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' },
    { id: 'deck-2', type: 'deck', title: 'Math Formulas', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
    { id: 'quiz-1', type: 'quiz', title: 'Physics Mock', color: 'bg-purple-500/20 text-purple-400 border-purple-500/50' },
  ]);

  // Timetable State: key is `${day}-${hour}`, value is array of items
  const [timetable, setTimetable] = useState({});

  const handleDragStart = (e, item, sourceSlot) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ item, sourceSlot }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetSlot) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('application/json'));
    const { item, sourceSlot } = data;

    // Remove from source
    if (sourceSlot === 'inventory') {
      setInventory(prev => prev.filter(i => i.id !== item.id));
    } else {
      setTimetable(prev => ({
        ...prev,
        [sourceSlot]: prev[sourceSlot].filter(i => i.id !== item.id)
      }));
    }

    // Add to target
    setTimetable(prev => ({
      ...prev,
      [targetSlot]: [...(prev[targetSlot] || []), item]
    }));
  };

  const syncToGoogleCalendar = async () => {
    setIsSyncing(true);
    try {
      // Flatten timetable into array of events
      const events = [];
      Object.entries(timetable).forEach(([slot, items]) => {
        items.forEach(i => events.push({ slot, item: i.title }));
      });

      await api.post('/calendar/sync', { events });
      setSynced(true);
      setTimeout(() => setSynced(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
    >
      <div className="bg-stone-900 border border-stone-700 w-full max-w-6xl h-[85vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-6 border-b border-stone-800 flex justify-between items-center bg-stone-950">
          <div>
            <h2 className="text-2xl font-bold text-stone-200 flex items-center gap-3">
              <Calendar className="w-6 h-6 text-amber-500" />
              Visual Study Timetable
            </h2>
            <p className="text-sm text-stone-400 mt-1">Drag and drop your study materials onto the calendar.</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={syncToGoogleCalendar}
              disabled={isSyncing}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                synced ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              <CloudSync className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {synced ? 'Synced!' : isSyncing ? 'Syncing...' : 'Sync with GCal'}
            </button>
            <button onClick={onClose} className="text-stone-400 hover:text-white p-2">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Inventory (Left Sidebar) */}
          <div 
            className="w-72 bg-stone-950 border-r border-stone-800 p-4 flex flex-col gap-4 overflow-y-auto"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'inventory')}
          >
            <h3 className="text-stone-400 font-medium uppercase text-sm flex items-center gap-2">
              <Info className="w-4 h-4" /> Available Materials
            </h3>
            
            {inventory.length === 0 && (
              <div className="text-stone-600 text-sm italic text-center py-4 border border-dashed border-stone-800 rounded-lg">
                Drag items here to remove them from the timetable.
              </div>
            )}

            {inventory.map(item => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, item, 'inventory')}
                className={`p-3 rounded-lg border cursor-grab active:cursor-grabbing ${item.color}`}
              >
                <p className="font-bold text-sm">{item.title}</p>
                <p className="text-xs opacity-70 uppercase tracking-wider mt-1">{item.type}</p>
              </div>
            ))}
          </div>

          {/* Timetable Grid */}
          <div className="flex-1 bg-stone-900 p-6 overflow-auto">
            <div className="min-w-[800px]">
              {/* Header Row */}
              <div className="grid grid-cols-8 gap-2 mb-2">
                <div className="p-3 text-center text-stone-500 font-medium"><Clock className="w-5 h-5 mx-auto" /></div>
                {days.map(day => (
                  <div key={day} className="p-3 text-center font-bold text-stone-300 bg-stone-800 rounded-t-xl border-b-2 border-amber-500">
                    {day}
                  </div>
                ))}
              </div>

              {/* Grid Body */}
              <div className="space-y-2">
                {hours.map(hour => (
                  <div key={hour} className="grid grid-cols-8 gap-2">
                    {/* Time Label */}
                    <div className="p-3 text-center text-stone-500 font-medium flex items-center justify-center bg-stone-950 rounded-lg">
                      {hour}
                    </div>

                    {/* Day Slots for this Hour */}
                    {days.map(day => {
                      const slotId = `${day}-${hour}`;
                      const slotItems = timetable[slotId] || [];

                      return (
                        <div 
                          key={slotId}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, slotId)}
                          className="bg-stone-950 border border-stone-800 rounded-lg min-h-[80px] p-2 flex flex-col gap-2 transition-colors hover:bg-stone-800/50"
                        >
                          {slotItems.map(item => (
                            <div
                              key={item.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, item, slotId)}
                              className={`p-2 rounded text-xs border cursor-grab active:cursor-grabbing ${item.color}`}
                            >
                              <p className="font-bold truncate">{item.title}</p>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
};

export default StudyTimetable;
