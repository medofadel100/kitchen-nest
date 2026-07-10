"use client";

import React from 'react';
import { useProjectStore } from '@/store/projectStore';
import { Clock3, RotateCcw, RotateCw, GripVertical } from 'lucide-react';

export const HistoryPanel = () => {
  const { historyVisible, toggleHistoryVisible, historyItems, canUndo, canRedo, undo, redo, jumpToHistory } = useProjectStore();

  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const panelRef = React.useRef<HTMLDivElement>(null);

  // Set initial position: below the unit selector buttons area
  React.useEffect(() => {
    // Default position: right side (RTL), below the floating controls
    // The floating controls are at top-6 right-6
    // The unit selector buttons are in ToolsSidebar (top area)
    // We place it at the bottom-right area, but above the canvas
    setPosition({ x: 20, y: window.innerHeight - 480 });
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!panelRef.current) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      // Clamp to viewport
      const clampedX = Math.max(0, Math.min(window.innerWidth - 340, newX));
      const clampedY = Math.max(0, Math.min(window.innerHeight - 120, newY));
      setPosition({ x: clampedX, y: clampedY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  if (!historyVisible) return null;

  return (
    <div 
      ref={panelRef}
      className="fixed z-50 w-[340px] bg-zinc-950/95 backdrop-blur-xl border border-zinc-800/80 rounded-2xl shadow-2xl overflow-hidden select-none"
      style={{ 
        left: position.x, 
        top: position.y,
        boxShadow: isDragging ? '0 20px 60px rgba(0,0,0,0.5)' : '0 10px 40px rgba(0,0,0,0.3)',
      }}
    >
      {/* Drag Handle / Header */}
      <div 
        onMouseDown={handleMouseDown}
        className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
      >
        <div className="flex items-center gap-2">
          <GripVertical size={16} className="text-zinc-600" />
          <Clock3 size={16} className="text-emerald-400" />
          <span className="text-sm font-bold text-white">سجل الحركات (آخر 20)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-600 font-mono">اسحب للتحريك</span>
          <button
            onClick={toggleHistoryVisible}
            className="text-zinc-400 hover:text-white text-sm transition-colors"
            aria-label="إخفاء السجل"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => undo()}
            disabled={!canUndo}
            className={`flex-1 px-3 py-2 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              canUndo
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-zinc-900/40 border-zinc-800 text-zinc-600 cursor-not-allowed'
            }`}
          >
            <RotateCcw size={16} />
            Undo
          </button>
          <button
            onClick={() => redo()}
            disabled={!canRedo}
            className={`flex-1 px-3 py-2 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              canRedo
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-zinc-900/40 border-zinc-800 text-zinc-600 cursor-not-allowed'
            }`}
          >
            <RotateCw size={16} />
            Redo
          </button>
        </div>

        {historyItems.length === 0 ? (
          <div className="text-zinc-500 text-sm text-center py-6">
            لا يوجد حركات بعد.
          </div>
        ) : (
          <div className="space-y-2 max-h-[320px] overflow-auto pr-1 custom-scrollbar">
            {historyItems.map((item, idx) => {
              const isLastItem = idx === historyItems.length - 1;
              return (
                <button
                  key={item.id}
                  onClick={() => jumpToHistory(item)}
                  className={`w-full text-right flex items-start justify-between gap-3 p-2 rounded-xl border transition-all ${
                    isLastItem 
                      ? 'bg-emerald-500/10 border-emerald-500/30' 
                      : 'bg-zinc-900/40 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 cursor-pointer'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className={`text-xs font-bold truncate ${isLastItem ? 'text-emerald-300' : 'text-white'}`}>
                      {item.label}
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-mono text-zinc-500">{item.kind}</span>
                    {isLastItem && (
                      <span className="text-[10px] font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/20">حالي</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};