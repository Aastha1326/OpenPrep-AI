import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  GripVertical,
  Plus,
  Trash2,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  Check,
  Edit3,
} from 'lucide-react';
import {
  WIDGET_REGISTRY,
  removeWidget,
  reorderWidgets,
  resizeWidget,
  resetDashboardLayout,
  saveDashboardLayout,
  fetchDashboardLayout,
  toggleCustomizing,
} from '../store/slices/dashboardSlice';

import AddWidgetModal from './dashboard/AddWidgetModal';
import { WIDGET_COMPONENT_MAP } from './dashboard/widgets';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { layout, isCustomizing } = useSelector((state) => state.dashboard);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);

  useEffect(() => {
    dispatch(fetchDashboardLayout());
  }, [dispatch]);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const updatedLayout = [...layout];
    const [movedItem] = updatedLayout.splice(draggedIndex, 1);
    updatedLayout.splice(targetIndex, 0, movedItem);

    // Update orders
    const reordered = updatedLayout.map((item, idx) => ({
      ...item,
      order: idx,
    }));

    dispatch(reorderWidgets(reordered));
    dispatch(saveDashboardLayout(reordered));
    setDraggedIndex(null);
  };

  const handleRemove = (widgetId) => {
    dispatch(removeWidget(widgetId));
    const nextLayout = layout.filter((w) => w.id !== widgetId);
    dispatch(saveDashboardLayout(nextLayout));
  };

  const handleResize = (widgetId, currentSpan) => {
    const nextSpan = currentSpan === 12 ? 6 : 12;
    dispatch(resizeWidget({ id: widgetId, colSpan: nextSpan }));
    const updated = layout.map((w) =>
      w.id === widgetId ? { ...w, colSpan: nextSpan } : w
    );
    dispatch(saveDashboardLayout(updated));
  };

  const handleReset = () => {
    dispatch(resetDashboardLayout());
    dispatch(saveDashboardLayout(layout));
  };

  const handleSaveAndDone = () => {
    dispatch(saveDashboardLayout(layout));
    dispatch(toggleCustomizing());
  };

  return (
    <div className="w-full space-y-6">
      {/* --- DASHBOARD CUSTOMIZATION CONTROLS BAR --- */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-neutral-900/90 text-white border border-amber-500/30 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-playfair font-bold text-lg text-white flex items-center gap-2">
              Customizable Dashboard
            </h2>
            <p className="text-xs text-neutral-400">
              {isCustomizing
                ? 'Drag widgets to reorder, toggle sizes, or add new widgets'
                : 'Personalize your workspace widgets & layout'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isCustomizing ? (
            <>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow transition"
              >
                <Plus className="w-4 h-4" /> Add Widget
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs border border-neutral-700 transition"
                title="Reset layout to default"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
              <button
                onClick={handleSaveAndDone}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition"
              >
                <Check className="w-4 h-4" /> Save & Done
              </button>
            </>
          ) : (
            <button
              onClick={() => dispatch(toggleCustomizing())}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow transition"
            >
              <Edit3 className="w-4 h-4" /> Customize Dashboard
            </button>
          )}
        </div>
      </div>

      {/* --- DYNAMIC WIDGET GRID --- */}
      <div className="grid grid-cols-12 gap-6" id="custom-dashboard-grid">
        {(layout || []).map((widgetItem, index) => {
          const regItem = WIDGET_REGISTRY.find((w) => w.id === widgetItem.id);
          const WidgetComponent = regItem ? WIDGET_COMPONENT_MAP[regItem.componentName] : null;

          if (!WidgetComponent) return null;

          const colSpan = widgetItem.colSpan || regItem?.defaultSize?.colSpan || 6;
          const colSpanClass = colSpan === 12 ? 'col-span-12' : 'col-span-12 md:col-span-6';

          return (
            <div
              key={widgetItem.id}
              draggable={isCustomizing}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              className={`${colSpanClass} relative transition-all duration-300 ${
                isCustomizing
                  ? 'ring-2 ring-amber-500/60 ring-offset-2 ring-offset-neutral-900 rounded-xl cursor-grab active:cursor-grabbing'
                  : ''
              }`}
            >
              {/* Customization Overlay Header */}
              {isCustomizing && (
                <div className="absolute top-2 right-2 z-30 flex items-center gap-1.5 p-1.5 rounded-lg bg-neutral-900/90 border border-neutral-700 text-white shadow-xl backdrop-blur-md">
                  <div className="p-1 cursor-grab active:cursor-grabbing text-neutral-400 hover:text-white">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <button
                    onClick={() => handleResize(widgetItem.id, colSpan)}
                    className="p-1 rounded hover:bg-neutral-800 text-amber-400 transition"
                    title={colSpan === 12 ? 'Switch to Half Width' : 'Switch to Full Width'}
                  >
                    {colSpan === 12 ? (
                      <Minimize2 className="w-3.5 h-3.5" />
                    ) : (
                      <Maximize2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleRemove(widgetItem.id)}
                    className="p-1 rounded hover:bg-red-900/40 text-red-400 transition"
                    title="Remove Widget"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Widget Component */}
              <WidgetComponent />
            </div>
          );
        })}
      </div>

      {/* Add Widget Modal */}
      <AddWidgetModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
