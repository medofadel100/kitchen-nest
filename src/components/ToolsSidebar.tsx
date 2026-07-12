"use client";

import React, { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { UnitType, FixtureType } from '@/types';
import { 
  Box, Layers, ArrowUpFromLine, CornerDownRight, Trash2, 
  Square, DoorOpen, LayoutGrid, Ruler, Magnet, EyeOff, MoveHorizontal,
  Refrigerator as FridgeIcon, Snowflake, Flame, ChefHat, Utensils, 
  WashingMachine as WashMachine, Wind, Package,
  Columns, Home, Sofa, Lamp, Paintbrush, 

  ChevronDown, ChevronUp, Palette, RotateCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { convertMmToDisplayUnit, convertDisplayUnitToMm } from '@/utils/measurements';
import { findSmartUnitPlacement } from '@/utils/geometry';
import { RoomWallEditor } from './RoomWallEditor';
import { QuickRectangleModal } from './QuickRectangleModal';
import { RoomPropertiesPanel } from './RoomPropertiesPanel';

interface ToolItem {
  type: string;
  label: string;
  icon: any;
  color: string;
  bgColor: string;
  category: 'arch' | 'unit' | 'appliance';
}

export const ToolsSidebar = () => {
  const { 
    addUnit, units, selectedUnitId, deleteUnit, activeTool, setActiveTool, 
    displayUnit, isSnappingEnabled, toggleSnapping, room, 
    historyVisible, toggleHistoryVisible, isOrthoMode, toggleOrthoMode,
    selectedElement
  } = useProjectStore();
  const [showQuickRect, setShowQuickRect] = React.useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('unit');

  const selectedUnit = units.find(u => u.id === selectedUnitId);

  // All tools grouped for the grid
  const archTools: ToolItem[] = [
    { type: 'select', label: 'تحديد', icon: Box, color: 'text-zinc-400', bgColor: 'from-zinc-900 to-zinc-950', category: 'arch' },
    { type: 'door', label: 'باب', icon: DoorOpen, color: 'text-sky-400', bgColor: 'from-sky-900/50 to-sky-950/50', category: 'arch' },
    { type: 'window', label: 'شباك', icon: LayoutGrid, color: 'text-indigo-400', bgColor: 'from-indigo-900/50 to-indigo-950/50', category: 'arch' },
    { type: 'column', label: 'عمود', icon: Square, color: 'text-red-400', bgColor: 'from-red-900/50 to-red-950/50', category: 'arch' },
    { type: 'measure', label: 'قياس', icon: Ruler, color: 'text-amber-400', bgColor: 'from-amber-900/50 to-amber-950/50', category: 'arch' },
    { type: 'polygon', label: 'رسم غرفة', icon: Square, color: 'text-emerald-400', bgColor: 'from-emerald-900/50 to-emerald-950/50', category: 'arch' },

  ];

  const unitTools: ToolItem[] = [
    { type: 'base', label: 'أرضية', icon: Box, color: 'text-blue-400', bgColor: 'from-blue-900/50 to-blue-950/50', category: 'unit' },
    { type: 'wall', label: 'معلقة', icon: Layers, color: 'text-emerald-400', bgColor: 'from-emerald-900/50 to-emerald-950/50', category: 'unit' },
    { type: 'tall', label: 'طولية', icon: ArrowUpFromLine, color: 'text-purple-400', bgColor: 'from-purple-900/50 to-purple-950/50', category: 'unit' },
    { type: 'drawer_unit', label: 'أدراج', icon: Layers, color: 'text-amber-400', bgColor: 'from-amber-900/50 to-amber-950/50', category: 'unit' },
    { type: 'corner_base', label: 'ركن أرضي', icon: CornerDownRight, color: 'text-pink-400', bgColor: 'from-pink-900/50 to-pink-950/50', category: 'unit' },
    { type: 'corner_wall', label: 'ركن معلق', icon: CornerDownRight, color: 'text-teal-400', bgColor: 'from-teal-900/50 to-teal-950/50', category: 'unit' },
    { type: 'loft', label: 'قلاب', icon: ArrowUpFromLine, color: 'text-indigo-400', bgColor: 'from-indigo-900/50 to-indigo-950/50', category: 'unit' },
  ];

  const applianceTools: ToolItem[] = [
    { type: 'fridge', label: 'ثلاجة', icon: FridgeIcon, color: 'text-cyan-400', bgColor: 'from-cyan-900/50 to-cyan-950/50', category: 'appliance' },
    { type: 'freezer', label: 'فريزر', icon: Snowflake, color: 'text-blue-400', bgColor: 'from-blue-900/50 to-blue-950/50', category: 'appliance' },
    { type: 'oven', label: 'فرن', icon: Flame, color: 'text-orange-400', bgColor: 'from-orange-900/50 to-orange-950/50', category: 'appliance' },
    { type: 'stove', label: 'بوتاجاز', icon: ChefHat, color: 'text-red-400', bgColor: 'from-red-900/50 to-red-950/50', category: 'appliance' },
    { type: 'dishwasher', label: 'غسالة أطباق', icon: Utensils, color: 'text-teal-400', bgColor: 'from-teal-900/50 to-teal-950/50', category: 'appliance' },
    { type: 'sink', label: 'حوض', icon: Package, color: 'text-emerald-400', bgColor: 'from-emerald-900/50 to-emerald-950/50', category: 'appliance' },
    { type: 'washing_machine', label: 'غسالة', icon: WashMachine, color: 'text-indigo-400', bgColor: 'from-indigo-900/50 to-indigo-950/50', category: 'appliance' },
    { type: 'dryer', label: 'مجفف', icon: Wind, color: 'text-purple-400', bgColor: 'from-purple-900/50 to-purple-950/50', category: 'appliance' },
  ];

  const handleArchToolClick = (type: string) => {
    if (type === 'select' || type === 'measure' || type === 'polygon') {
      setActiveTool(type as any);
    } else if (type === 'door' || type === 'window' || type === 'column') {
      setActiveTool(type as any);
    }
  };

  const handleUnitClick = (type: string) => {
    const settings = useProjectStore.getState().projectSettings;
    const baseX = room ? Math.max(50, (room.widthMm / 2) - 300) : 1000;
    const baseY = 0;

    let defaultX = baseX;
    let defaultY = baseY;

    if (room) {
      const newUnit = {
        id: `unit_temp`,
        type: type as UnitType,
        position: { xMm: baseX, yMm: baseY, zMm: 0, rotationDeg: 0 },
        dimensions: {
          widthMm: 600,
          depthMm: 600,
          heightMm: 0,
        },
        materialId: settings.defaultMaterialId,
        colorHex: settings.defaultBaseColor,
        doorMaterialId: settings.defaultDoorMaterialId,
        doorColorHex: settings.defaultBaseDoorColor,
        doorCount: 0,
        drawerCount: 0,
        shelfCount: 0,
        hingeType: settings.defaultHingeId,
        handleType: settings.defaultHandleId,
        hasLedProfile: false,
      } as any;

      const placement = findSmartUnitPlacement(newUnit, room, units, baseX, baseY, 50, 80);
      defaultX = placement.xMm;
      defaultY = placement.yMm;
    }

    addUnit(type as UnitType, defaultX, defaultY);
  };

  const handleApplianceClick = (tool: ToolItem) => {
    const settings = useProjectStore.getState().projectSettings;
    const baseX = room ? Math.max(50, (room.widthMm / 2) - 300) : 1000;
    const baseY = 0;

    let defaultX = baseX;
    let defaultY = baseY;

    let widthMm = 600, depthMm = 600, heightMm = 850;
    switch(tool.type) {
      case 'fridge': widthMm = 700; depthMm = 700; heightMm = 1800; break;
      case 'freezer': widthMm = 600; depthMm = 600; heightMm = 1800; break;
      case 'oven': widthMm = 600; depthMm = 600; heightMm = 900; break;
      case 'stove': widthMm = 600; depthMm = 600; heightMm = 900; break;
      case 'dishwasher': widthMm = 600; depthMm = 600; heightMm = 850; break;
      case 'washing_machine': widthMm = 600; depthMm = 600; heightMm = 850; break;
      case 'dryer': widthMm = 600; depthMm = 600; heightMm = 850; break;
      case 'sink': widthMm = 700; depthMm = 600; heightMm = 850; break;
    }

    if (room) {
      const newUnit = {
        id: `unit_temp`,
        type: 'base' as UnitType,
        position: { xMm: baseX, yMm: baseY, zMm: 0, rotationDeg: 0 },
        dimensions: { widthMm, depthMm, heightMm },
        materialId: settings.defaultMaterialId,
        colorHex: settings.defaultBaseColor,
        doorMaterialId: settings.defaultDoorMaterialId,
        doorColorHex: settings.defaultBaseDoorColor,
        doorCount: 0, drawerCount: 0, shelfCount: 0,
        hingeType: settings.defaultHingeId,
        handleType: settings.defaultHandleId,
        hasLedProfile: false,
      } as any;
      const placement = findSmartUnitPlacement(newUnit, room, useProjectStore.getState().units, baseX, baseY, 50, 80);
      defaultX = placement.xMm;
      defaultY = placement.yMm;
    }

    const unitId = `unit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newUnit: any = {
      id: unitId, type: 'base',
      label: tool.label,
      position: { xMm: defaultX, yMm: defaultY, zMm: 0, rotationDeg: 0 },
      dimensions: { widthMm, depthMm, heightMm },
      materialId: settings.defaultMaterialId,
      colorHex: settings.defaultBaseColor,
      doorMaterialId: settings.defaultDoorMaterialId,
      doorColorHex: settings.defaultBaseDoorColor,
      doorCount: 0, drawerCount: 0, shelfCount: 0,
      hingeType: settings.defaultHingeId,
      handleType: settings.defaultHandleId,
      hasLedProfile: false,
    };

    useProjectStore.getState().commitSnapshot();
    useProjectStore.setState((state) => ({
      units: [...state.units, newUnit],
      selectedUnitId: unitId,
      selectedElement: { id: unitId, type: 'unit' },
      selectedElements: [{ id: unitId, type: 'unit' }],
    }));
  };

  const handleToolClick = (tool: ToolItem) => {
    if (tool.category === 'arch') {
      handleArchToolClick(tool.type);
    } else if (tool.category === 'unit') {
      handleUnitClick(tool.type);
    } else if (tool.category === 'appliance') {
      handleApplianceClick(tool);
    }
  };

  const isToolActive = (tool: ToolItem): boolean => {
    if (tool.category === 'arch') {
      return activeTool === tool.type;
    }
    return false;
  };

  const getFixtureType = (): 'door' | 'window' | 'column' | null => {
    if (!selectedElement) return null;
    if (selectedElement.type === 'fixture') {
      const fixture = room?.fixtures.find(f => f.id === selectedElement.id);
      if (fixture?.type === 'door' || fixture?.type === 'balcony_door') return 'door';
      if (fixture?.type === 'window') return 'window';
    }
    if (selectedElement.type === 'obstacle') return 'column';
    return null;
  };

  // Count units by label for display
  const unitCounts = {
    base: units.filter(u => u.type === 'base').length,
    wall: units.filter(u => u.type === 'wall').length,
    tall: units.filter(u => u.type === 'tall').length,
    appliances: units.filter(u => u.label && !['base','wall','tall','drawer_unit','loft','corner_base','corner_wall','corner_tall'].includes(u.type)).length,
  };

  return (
    <div className="w-80 bg-gradient-to-b from-zinc-950 to-zinc-900 backdrop-blur-2xl border-l border-zinc-800/80 p-4 h-full flex flex-col shadow-2xl shrink-0 z-20 overflow-y-auto custom-scrollbar">
      
      {/* Header */}
      <div className="mb-4 text-center">
        <h1 className="text-lg font-black text-white tracking-tight">
          <span className="text-emerald-400">Kitchen</span>Nest
        </h1>
        <p className="text-[10px] text-zinc-600 font-medium">مُصمِّم المطابخ الذكي</p>
      </div>

      {/* ===== MAIN TOOLS GRID ===== */}
      <div className="mb-4">
        <h2 className="text-xs font-bold text-zinc-500 mb-3 flex items-center gap-2">
          <Box size={12} />
          أدوات الغرفة والمعمار
        </h2>
        <div className="grid grid-cols-3 gap-1.5">
          {archTools.map((tool) => {
            const Icon = tool.icon;
            const isActive = isToolActive(tool);
            return (
              <button
                key={tool.type}
                onClick={() => handleToolClick(tool)}
                className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all duration-200 overflow-hidden group ${
                  isActive 
                    ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                    : `bg-gradient-to-br ${tool.bgColor} border-zinc-800/60 text-zinc-500 hover:border-zinc-600 hover:text-white hover:shadow-lg`
                }`}
              >
                {/* Hover glow */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                <Icon size={18} className="mb-1 relative z-10" />
                <span className="text-[10px] font-bold text-center leading-tight relative z-10">{tool.label}</span>
                {isActive && (
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-zinc-950"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Settings Bar */}
      <div className="flex items-center gap-1 mb-4 p-2 bg-zinc-900/80 rounded-xl border border-zinc-800/50">
        <button
          onClick={toggleOrthoMode}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[9px] font-bold transition-all ${
            isOrthoMode
              ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
          }`}
        >
          <MoveHorizontal size={12} />
          <span>Ortho</span>
          <span className={`w-1.5 h-1.5 rounded-full ${isOrthoMode ? 'bg-sky-400' : 'bg-zinc-600'}`}></span>
        </button>
        <button
          onClick={toggleSnapping}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[9px] font-bold transition-all ${
            isSnappingEnabled
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
          }`}
        >
          <Magnet size={12} />
          <span>Snap</span>
          <span className={`w-1.5 h-1.5 rounded-full ${isSnappingEnabled ? 'bg-amber-400' : 'bg-zinc-600'}`}></span>
        </button>
        <button
          onClick={() => setShowQuickRect(true)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[9px] font-bold text-orange-400 hover:bg-orange-500/10 transition-all"
        >
          <Square size={12} />
          <span>سريع</span>
        </button>
      </div>

      {/* ===== UNITS & APPLIANCES SECTION ===== */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 custom-scrollbar space-y-4">
        
        {/* Units Grid */}
        <div>
          <button
            onClick={() => setExpandedCategory(expandedCategory === 'unit' ? null : 'unit')}
            className="w-full flex items-center justify-between text-xs font-bold text-zinc-500 mb-2 hover:text-zinc-300 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Layers size={12} />
              وحدات المطبخ
              {units.length > 0 && (
                <span className="bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded text-[9px]">{units.length}</span>
              )}
            </span>
            {expandedCategory === 'unit' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          
          <AnimatePresence>
            {expandedCategory === 'unit' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-1.5">
                  {unitTools.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <button
                        key={tool.type}
                        onClick={() => handleToolClick(tool)}
                        className="relative flex items-center gap-2.5 p-2.5 bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 border border-zinc-800/50 rounded-xl transition-all duration-200 hover:border-zinc-600 hover:shadow-lg group text-right"
                      >
                        <div className={`p-1.5 rounded-lg bg-gradient-to-br ${tool.bgColor} border border-zinc-800/50 group-hover:border-zinc-700/50 transition-colors`}>
                          <Icon size={14} className={tool.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-bold text-zinc-300 group-hover:text-white transition-colors leading-tight truncate">{tool.label}</div>
                          <div className="text-[8px] text-zinc-600 font-mono">مقاس قياسي</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Appliances Grid */}
        <div>
          <button
            onClick={() => setExpandedCategory(expandedCategory === 'appliance' ? null : 'appliance')}
            className="w-full flex items-center justify-between text-xs font-bold text-zinc-500 mb-2 hover:text-zinc-300 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Flame size={12} />
              الأجهزة الكهربائية
            </span>
            {expandedCategory === 'appliance' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          
          <AnimatePresence>
            {expandedCategory === 'appliance' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-1.5">
                  {applianceTools.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <button
                        key={tool.type}
                        onClick={() => handleToolClick(tool)}
                        className="relative flex items-center gap-2.5 p-2.5 bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 border border-zinc-800/50 rounded-xl transition-all duration-200 hover:border-zinc-600 hover:shadow-lg group text-right"
                      >
                        <div className={`p-1.5 rounded-lg bg-gradient-to-br ${tool.bgColor} border border-zinc-800/50 group-hover:border-zinc-700/50 transition-colors`}>
                          <Icon size={14} className={tool.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-bold text-zinc-300 group-hover:text-white transition-colors leading-tight truncate">{tool.label}</div>
                          <div className="text-[8px] text-zinc-600 font-mono">{tool.type}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Room Wall Editor (in collapsed section) */}
        <div className="pt-2 border-t border-zinc-800/30">
          <RoomWallEditor />
        </div>
      </div>

      {/* ===== PROPERTIES PANEL ===== */}
      <AnimatePresence>
        {selectedElement ? (
          <motion.div 
            key="properties-panel"
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 20, height: 0 }}
            className="mt-4 bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 border border-emerald-500/20 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.03)] overflow-hidden flex-shrink-0"
          >
            <div className="p-3 max-h-64 overflow-y-auto custom-scrollbar">
              {selectedElement.type === 'unit' && selectedUnit && (
                <>
                  <h3 className="font-bold text-white mb-3 text-xs flex items-center gap-2">
                    <Box size={12} />
                    خصائص الوحدة
                    <span className="bg-emerald-500/20 text-emerald-400 text-[8px] px-1.5 py-0.5 rounded font-mono">{selectedUnit.type}</span>
                  </h3>
                  
                  <div className="space-y-1.5 mb-3">
                    <PropertyRow label="العرض" value={convertMmToDisplayUnit(selectedUnit.dimensions.widthMm, displayUnit)} unit={displayUnit}
                      onChange={(v) => useProjectStore.getState().updateUnitDimensions(selectedUnit.id, convertDisplayUnitToMm(v, displayUnit), selectedUnit.dimensions.depthMm, selectedUnit.dimensions.heightMm)} />
                    <PropertyRow label="العمق" value={convertMmToDisplayUnit(selectedUnit.dimensions.depthMm, displayUnit)} unit={displayUnit}
                      onChange={(v) => useProjectStore.getState().updateUnitDimensions(selectedUnit.id, selectedUnit.dimensions.widthMm, convertDisplayUnitToMm(v, displayUnit), selectedUnit.dimensions.heightMm)} />
                    <PropertyRow label="الارتفاع" value={convertMmToDisplayUnit(selectedUnit.dimensions.heightMm, displayUnit)} unit={displayUnit}
                      onChange={(v) => useProjectStore.getState().updateUnitDimensions(selectedUnit.id, selectedUnit.dimensions.widthMm, selectedUnit.dimensions.depthMm, convertDisplayUnitToMm(v, displayUnit))} />
                    <PropertyRow label="من الأرض" value={convertMmToDisplayUnit(selectedUnit.position.zMm ?? 0, displayUnit)} unit={displayUnit}
                      onChange={(v) => useProjectStore.getState().updateUnitPosition(selectedUnit.id, selectedUnit.position.xMm, selectedUnit.position.yMm, convertDisplayUnitToMm(v, displayUnit))} />
                    
                    {/* Color */}
                    <div className="flex justify-between items-center bg-zinc-950/50 p-1.5 rounded-lg border border-zinc-800">
                      <span className="text-zinc-500 text-[10px] font-medium">اللون</span>
                      <input type="color" value={selectedUnit.colorHex || '#D4B896'}
                        onChange={(e) => useProjectStore.getState().updateUnitDetails(selectedUnit.id, { colorHex: e.target.value })}
                        className="w-8 h-6 rounded cursor-pointer border border-zinc-700 bg-transparent" />
                    </div>
                    
                    <div className="flex justify-between items-center bg-zinc-950/50 p-1.5 rounded-lg border border-zinc-800">
                      <span className="text-zinc-500 text-[10px] font-medium">الزاوية</span>
                      <select value={selectedUnit.position.rotationDeg}
                        onChange={(e) => useProjectStore.getState().updateUnitPosition(selectedUnit.id, selectedUnit.position.xMm, selectedUnit.position.yMm, selectedUnit.position.zMm, Number(e.target.value) as any)}
                        className="w-14 bg-transparent text-white font-mono text-[10px] text-left outline-none">
                        <option value={0} className="text-black">0°</option>
                        <option value={90} className="text-black">90°</option>
                        <option value={180} className="text-black">180°</option>
                        <option value={270} className="text-black">270°</option>
                      </select>
                    </div>
                  </div>
                  
                  <button onClick={() => deleteUnit(selectedUnit.id)} 
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500 hover:text-white transition-all font-bold text-[10px]">
                    <Trash2 size={12} />
                    حذف الوحدة
                  </button>
                </>
              )}

              {selectedElement.type === 'fixture' && (
                <RoomPropertiesPanel selectedElementType={
                  room?.fixtures.find(f => f.id === selectedElement.id)?.type === 'door' || 
                  room?.fixtures.find(f => f.id === selectedElement.id)?.type === 'balcony_door'
                    ? 'door' : 'window'
                } />
              )}

              {selectedElement.type === 'obstacle' && (
                <RoomPropertiesPanel selectedElementType="column" />
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="no-selection"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 p-4 text-[10px] text-zinc-600 text-center bg-zinc-900/30 border border-zinc-800/30 rounded-2xl border-dashed"
          >
            <Box size={16} className="mx-auto mb-1 opacity-50" />
            اختر عنصراً من مساحة العمل لتعديل خصائصه
          </motion.div>
        )}
      </AnimatePresence>

      {/* Extra Controls Footer */}
      <div className="mt-3 flex items-center gap-1">
        <button onClick={toggleHistoryVisible}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
            historyVisible
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
          }`}>
          🕘 سجل
        </button>
        <button onClick={useProjectStore.getState().showAllHiddenElements}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 text-[10px] font-bold transition-all">
          <EyeOff size={12} />
          إظهار المخفي
        </button>
      </div>

      {showQuickRect && <QuickRectangleModal onClose={() => setShowQuickRect(false)} />}
    </div>
  );
};

// Helper component for property rows
const PropertyRow = ({ label, value, unit, onChange }: { 
  label: string; value: number; unit: string; onChange: (v: number) => void 
}) => (
  <div className="flex justify-between items-center bg-zinc-950/50 p-1.5 rounded-lg border border-zinc-800">
    <span className="text-zinc-500 text-[10px] font-medium">{label}</span>
    <div className="flex items-center gap-1">
      <input type="number" value={Number(value.toFixed(2))}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-14 bg-transparent text-white font-mono text-[10px] text-left outline-none" />
      <span className="text-zinc-600 text-[8px]">{unit}</span>
    </div>
  </div>
);
