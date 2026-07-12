"use client";

import React, { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { convertMmToDisplayUnit, convertDisplayUnitToMm } from '@/utils/measurements';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DoorOpen, 
  LayoutGrid, 
  Square, 
  ChevronDown, 
  ChevronUp,
  Palette,
  Ruler,
  RotateCw,
  Trash2
} from 'lucide-react';

interface RoomPropertiesPanelProps {
  selectedElementType: 'door' | 'window' | 'column' | null;
}

export const RoomPropertiesPanel: React.FC<RoomPropertiesPanelProps> = ({ selectedElementType }) => {
  const { room, selectedElement, updateRoomFixture, updateRoomObstacle, deleteRoomFixture, deleteRoomObstacle, displayUnit } = useProjectStore();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    dimensions: true,
    position: true,
    appearance: true,
  });

  if (!room || !selectedElement) return null;

  const selectedFixture = room.fixtures.find(f => f.id === selectedElement.id);
  const selectedObstacle = room.obstacles.find(o => o.id === selectedElement.id);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Door/Window specific properties
  if (selectedElementType === 'door' || selectedElementType === 'window') {
    if (!selectedFixture) return null;

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 bg-zinc-900/80 border border-sky-500/30 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.05)] relative overflow-hidden flex flex-col"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 blur-3xl -z-10 rounded-full"></div>
        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
          <h3 className="font-bold text-white mb-4 text-sm flex items-center gap-2">
            {selectedElementType === 'door' ? <DoorOpen size={16} /> : <LayoutGrid size={16} />}
            خصائص {selectedElementType === 'door' ? 'الباب' : 'الشباك'}
            <span className="bg-sky-500/20 text-sky-400 text-[10px] px-2 py-0.5 rounded font-mono uppercase tracking-widest">
              {selectedElementType}
            </span>
          </h3>

          <div className="space-y-3 mb-6">
            {/* Dimensions Section */}
            <div className="border-b border-zinc-800/50 pb-2">
              <button
                onClick={() => toggleSection('dimensions')}
                className="w-full flex items-center justify-between text-zinc-400 hover:text-white transition-colors"
              >
                <span className="text-xs font-bold flex items-center gap-2">
                  <Ruler size={14} />
                  الأبعاد
                </span>
                {expandedSections.dimensions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              
              <AnimatePresence>
                {expandedSections.dimensions && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-2 mt-2 overflow-hidden"
                  >
                    <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                      <span className="text-zinc-500 text-xs font-medium">العرض</span>
                      <input 
                        type="number"
                        value={convertMmToDisplayUnit(selectedFixture.widthMm || 0, displayUnit)}
                        onChange={(e) => updateRoomFixture(selectedFixture.id, { widthMm: convertDisplayUnitToMm(Number(e.target.value), displayUnit) })}
                        className="w-20 bg-transparent text-white font-mono text-sm text-left outline-none"
                      />
                      <span className="text-zinc-600 text-xs">{displayUnit}</span>
                    </div>
                    
                    <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                      <span className="text-zinc-500 text-xs font-medium">الارتفاع</span>
                      <input 
                        type="number"
                        value={convertMmToDisplayUnit(selectedFixture.heightMm || 0, displayUnit)}
                        onChange={(e) => updateRoomFixture(selectedFixture.id, { heightMm: convertDisplayUnitToMm(Number(e.target.value), displayUnit) })}
                        className="w-20 bg-transparent text-white font-mono text-sm text-left outline-none"
                      />
                      <span className="text-zinc-600 text-xs">{displayUnit}</span>
                    </div>
                    
                    <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                      <span className="text-zinc-500 text-xs font-medium">الارتفاع من الأرض</span>
                      <input 
                        type="number"
                        value={convertMmToDisplayUnit(selectedFixture.zMm || 0, displayUnit)}
                        onChange={(e) => updateRoomFixture(selectedFixture.id, { zMm: convertDisplayUnitToMm(Number(e.target.value), displayUnit) })}
                        className="w-20 bg-transparent text-white font-mono text-sm text-left outline-none"
                      />
                      <span className="text-zinc-600 text-xs">{displayUnit}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Position Section */}
            <div className="border-b border-zinc-800/50 pb-2">
              <button
                onClick={() => toggleSection('position')}
                className="w-full flex items-center justify-between text-zinc-400 hover:text-white transition-colors"
              >
                <span className="text-xs font-bold flex items-center gap-2">
                  <RotateCw size={14} />
                  الموضع والزاوية
                </span>
                {expandedSections.position ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              
              <AnimatePresence>
                {expandedSections.position && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-2 mt-2 overflow-hidden"
                  >
                    <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                      <span className="text-zinc-500 text-xs font-medium">الزاوية</span>
                      <select 
                        value={selectedFixture.rotationDeg || 0}
                        onChange={(e) => updateRoomFixture(selectedFixture.id, { rotationDeg: Number(e.target.value) })}
                        className="w-20 bg-transparent text-white font-mono text-sm text-left outline-none"
                      >
                        <option value={0} className="text-black">0°</option>
                        <option value={90} className="text-black">90°</option>
                        <option value={180} className="text-black">180°</option>
                        <option value={270} className="text-black">270°</option>
                      </select>
                    </div>
                    
                    <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                      <span className="text-zinc-500 text-xs font-medium">موضع X</span>
                      <input 
                        type="number"
                        value={convertMmToDisplayUnit(selectedFixture.xMm, displayUnit)}
                        onChange={(e) => updateRoomFixture(selectedFixture.id, { xMm: convertDisplayUnitToMm(Number(e.target.value), displayUnit) })}
                        className="w-20 bg-transparent text-white font-mono text-sm text-left outline-none"
                      />
                      <span className="text-zinc-600 text-xs">{displayUnit}</span>
                    </div>
                    
                    <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                      <span className="text-zinc-500 text-xs font-medium">موضع Y</span>
                      <input 
                        type="number"
                        value={convertMmToDisplayUnit(selectedFixture.yMm, displayUnit)}
                        onChange={(e) => updateRoomFixture(selectedFixture.id, { yMm: convertDisplayUnitToMm(Number(e.target.value), displayUnit) })}
                        className="w-20 bg-transparent text-white font-mono text-sm text-left outline-none"
                      />
                      <span className="text-zinc-600 text-xs">{displayUnit}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Appearance Section */}
            <div className="border-b border-zinc-800/50 pb-2">
              <button
                onClick={() => toggleSection('appearance')}
                className="w-full flex items-center justify-between text-zinc-400 hover:text-white transition-colors"
              >
                <span className="text-xs font-bold flex items-center gap-2">
                  <Palette size={14} />
                  المظهر
                </span>
                {expandedSections.appearance ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              
              <AnimatePresence>
                {expandedSections.appearance && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-2 mt-2 overflow-hidden"
                  >
                    {selectedElementType === 'door' && (
                      <>
                        <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                          <span className="text-zinc-500 text-xs font-medium">لون الباب</span>
                          <input
                            type="color"
                            value={selectedFixture.doorColorHex || '#8B4513'}
                            onChange={(e) => updateRoomFixture(selectedFixture.id, { doorColorHex: e.target.value })}
                            className="w-10 h-8 rounded cursor-pointer border border-zinc-700 bg-transparent"
                          />
                        </div>
                        
                        <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                          <span className="text-zinc-500 text-xs font-medium">لون الخشب</span>
                          <input
                            type="color"
                            value={selectedFixture.frameColorHex || '#D4B896'}
                            onChange={(e) => updateRoomFixture(selectedFixture.id, { frameColorHex: e.target.value })}
                            className="w-10 h-8 rounded cursor-pointer border border-zinc-700 bg-transparent"
                          />
                        </div>
                        
                        <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                          <span className="text-zinc-500 text-xs font-medium">بدون باب (شبه شفاف)</span>
                          <input 
                            type="checkbox"
                            checked={selectedFixture.isTransparent || false}
                            onChange={(e) => updateRoomFixture(selectedFixture.id, { isTransparent: e.target.checked })}
                            className="w-4 h-4 rounded accent-sky-500"
                          />
                        </div>
                      </>
                    )}
                    
                    {selectedElementType === 'window' && (
                      <>
                        <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                          <span className="text-zinc-500 text-xs font-medium">لون الفريم</span>
                          <input
                            type="color"
                            value={selectedFixture.frameColorHex || '#C0C0C0'}
                            onChange={(e) => updateRoomFixture(selectedFixture.id, { frameColorHex: e.target.value })}
                            className="w-10 h-8 rounded cursor-pointer border border-zinc-700 bg-transparent"
                          />
                        </div>
                        
                        <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                          <span className="text-zinc-500 text-xs font-medium">لون الأزاز</span>
                          <input
                            type="color"
                            value={selectedFixture.sashColorHex || '#87CEEB'}
                            onChange={(e) => updateRoomFixture(selectedFixture.id, { sashColorHex: e.target.value })}
                            className="w-10 h-8 rounded cursor-pointer border border-zinc-700 bg-transparent"
                          />
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <button 
            onClick={() => deleteRoomFixture(selectedFixture.id)} 
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all font-bold text-sm"
          >
            <Trash2 size={16} />
            حذف
          </button>
        </div>
      </motion.div>
    );
  }

  // Column/Obstacle specific properties
  if (selectedElementType === 'column') {
    if (!selectedObstacle) return null;

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 bg-zinc-900/80 border border-red-500/30 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.05)] relative overflow-hidden flex flex-col"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl -z-10 rounded-full"></div>
        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
          <h3 className="font-bold text-white mb-4 text-sm flex items-center gap-2">
            <Square size={16} />
            خصائص العمود
            <span className="bg-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded font-mono uppercase tracking-widest">
              {selectedObstacle.type}
            </span>
          </h3>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
              <span className="text-zinc-500 text-xs font-medium">العرض</span>
              <input 
                type="number"
                value={convertMmToDisplayUnit(selectedObstacle.widthMm || 0, displayUnit)}
                onChange={(e) => updateRoomObstacle(selectedObstacle.id, { widthMm: convertDisplayUnitToMm(Number(e.target.value), displayUnit) })}
                className="w-20 bg-transparent text-white font-mono text-sm text-left outline-none"
              />
              <span className="text-zinc-600 text-xs">{displayUnit}</span>
            </div>
            
            <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
              <span className="text-zinc-500 text-xs font-medium">العمق</span>
              <input 
                type="number"
                value={convertMmToDisplayUnit(selectedObstacle.depthMm || 0, displayUnit)}
                onChange={(e) => updateRoomObstacle(selectedObstacle.id, { depthMm: convertDisplayUnitToMm(Number(e.target.value), displayUnit) })}
                className="w-20 bg-transparent text-white font-mono text-sm text-left outline-none"
              />
              <span className="text-zinc-600 text-xs">{displayUnit}</span>
            </div>
            
            <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
              <span className="text-zinc-500 text-xs font-medium">الزاوية</span>
              <select 
                value={selectedObstacle.rotationDeg || 0}
                onChange={(e) => updateRoomObstacle(selectedObstacle.id, { rotationDeg: Number(e.target.value) })}
                className="w-20 bg-transparent text-white font-mono text-sm text-left outline-none"
              >
                <option value={0} className="text-black">0°</option>
                <option value={90} className="text-black">90°</option>
                <option value={180} className="text-black">180°</option>
                <option value={270} className="text-black">270°</option>
              </select>
            </div>
          </div>

          <button 
            onClick={() => deleteRoomObstacle(selectedObstacle.id)} 
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all font-bold text-sm"
          >
            <Trash2 size={16} />
            حذف
          </button>
        </div>
      </motion.div>
    );
  }

  return null;
};