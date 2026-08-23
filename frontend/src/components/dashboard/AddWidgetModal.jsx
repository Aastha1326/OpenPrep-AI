import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Plus, Check, Grid, Sparkles, Layout } from 'lucide-react';
import { WIDGET_REGISTRY, addWidget } from '../../store/slices/dashboardSlice';

const AddWidgetModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { layout } = useSelector((state) => state.dashboard);
  const [selectedCategory, setSelectedCategory] = useState('All');

  if (!isOpen) return null;

  const activeWidgetIds = new Set((layout || []).map((w) => w.id));

  const categories = ['All', 'Analytics', 'Study', 'Tasks', 'Activity'];

  const filteredWidgets = WIDGET_REGISTRY.filter((w) => {
    if (selectedCategory === 'All') return true;
    return w.category === selectedCategory;
  });

  const handleAdd = (widgetId, colSpan) => {
    dispatch(addWidget({ id: widgetId, colSpan }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-playfair font-bold text-neutral-800 dark:text-neutral-100">
              Add Dashboard Widgets
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Widget Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredWidgets.map((widget) => {
            const isAdded = activeWidgetIds.has(widget.id);
            return (
              <div
                key={widget.id}
                className={`flex flex-col justify-between p-4 rounded-xl border transition-all ${
                  isAdded
                    ? 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-300 dark:border-neutral-700/50 opacity-75'
                    : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:border-amber-500/60 hover:shadow-lg'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                      {widget.category}
                    </span>
                    <span className="text-xs text-neutral-400 font-mono">
                      {widget.defaultSize?.colSpan === 12 ? 'Full Width' : 'Half Width'}
                    </span>
                  </div>
                  <h3 className="font-playfair font-bold text-base text-neutral-900 dark:text-neutral-100 mb-1">
                    {widget.name}
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-4 line-clamp-2">
                    {widget.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-700/40 flex justify-end">
                  {isAdded ? (
                    <button
                      disabled
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg"
                    >
                      <Check className="w-4 h-4" /> Added
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAdd(widget.id, widget.defaultSize?.colSpan || 6)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow transition"
                    >
                      <Plus className="w-4 h-4" /> Add Widget
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 flex justify-between items-center">
          <span className="text-xs text-neutral-500 font-medium">
            {layout.length} active widgets on dashboard
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddWidgetModal;
