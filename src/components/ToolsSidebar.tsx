"use client";

import React from 'react';
import { useProjectStore } from '@/store/projectStore';
import { UnitType } from '@/types';
import { Box, Layers, ArrowUpFromLine, CornerDownRight, Trash2, Square, DoorOpen, LayoutGrid, Ruler, Magnet, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { convertMmToDisplayUnit, convertDisplayUnitToMm } from '@/utils/measurements';
import { findSmartUnitPlacement } from '@/utils/geometry';

export const ToolsSidebar = () => {
  const { addUnit, units, selectedUnitId, deleteUnit, activeTool, setActiveTool, displayUnit, isSnappingEnabled, toggleSnapping, room, historyVisible, toggleHistoryVisible } = useProjectStore();

  const handleAddUnit = (type: UnitType) => {
    // وضع الوحدة بشكل ذكي بحيث تتحاذى مع الحائط دون التصادم أو الخروج من الغرفة
    const settings = useProjectStore.getState().projectSettings;
    const baseX = room ? Math.max(50, (room.widthMm / 2) - 300) : 1000;
    const baseY = 0;

    let defaultX = baseX;
    let defaultY = baseY;

    if (room) {
      const newUnit = {
        id: `unit_temp`,
        type,
        position: { xMm: baseX, yMm: baseY, zMm: 0, rotationDeg: 0 },
        dimensions: {
          widthMm: type === 'base' || type === 'drawer_unit' || type === 'corner_base' || type === 'corner_tall' ? 600 : type === 'wall' || type === 'loft' ? 600 : 900,
          depthMm: type === 'base' || type === 'drawer_unit' ? settings.defaultBaseDepthMm : type === 'wall' ? settings.defaultWallDepthMm : type === 'loft' ? settings.defaultLoftDepthMm : 900,
          heightMm: 0,
          ...(type.startsWith('corner') ? {
            leftLegCarcassDepthMm: type === 'corner_wall' ? settings.defaultWallDepthMm : settings.defaultBaseDepthMm,
            rightLegCarcassDepthMm: type === 'corner_wall' ? settings.defaultWallDepthMm : settings.defaultBaseDepthMm,
          } : {})
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

    addUnit(type, defaultX, defaultY);
  };

  const selectedUnit = units.find(u => u.id === selectedUnitId);

  const kitchenTools = [
    { type: 'base' as UnitType, label: 'وحدة أرضية', icon: Box, color: 'text-blue-400', bgHover: 'hover:bg-blue-500/10 hover:border-blue-500/50' },
    { type: 'wall' as UnitType, label: 'وحدة معلقة', icon: Layers, color: 'text-emerald-400', bgHover: 'hover:bg-emerald-500/10 hover:border-emerald-500/50' },
    { type: 'tall' as UnitType, label: 'وحدة طولية (Tall)', icon: ArrowUpFromLine, color: 'text-purple-400', bgHover: 'hover:bg-purple-500/10 hover:border-purple-500/50' },
    { type: 'drawer_unit' as UnitType, label: 'وحدة أدراج', icon: Layers, color: 'text-amber-400', bgHover: 'hover:bg-amber-500/10 hover:border-amber-500/50' },
    { type: 'corner_base' as UnitType, label: 'وحدة ركن (L-Shape) أرضية', icon: CornerDownRight, color: 'text-pink-400', bgHover: 'hover:bg-pink-500/10 hover:border-pink-500/50' },
    { type: 'corner_wall' as UnitType, label: 'وحدة ركن (L-Shape) معلقة', icon: CornerDownRight, color: 'text-teal-400', bgHover: 'hover:bg-teal-500/10 hover:border-teal-500/50' },
    { type: 'corner_tall' as UnitType, label: 'وحدة ركن (L-Shape) طولية', icon: CornerDownRight, color: 'text-fuchsia-400', bgHover: 'hover:bg-fuchsia-500/10 hover:border-fuchsia-500/50' },
    { type: 'loft' as UnitType, label: 'وحدة قلاب (مستوى ثاني)', icon: ArrowUpFromLine, color: 'text-indigo-400', bgHover: 'hover:bg-indigo-500/10 hover:border-indigo-500/50' },
  ];

  const archTools = [
    { type: 'select', label: 'تحديد', icon: Box, color: 'text-zinc-400' },
    { type: 'measure', label: 'شريط القياس', icon: Ruler, color: 'text-zinc-400' },
    { type: 'column', label: 'إضافة عمود / بروز', icon: Square, color: 'text-red-400' },
    { type: 'door', label: 'إضافة باب', icon: DoorOpen, color: 'text-sky-400' },
    { type: 'window', label: 'إضافة شباك', icon: LayoutGrid, color: 'text-sky-400' },
  ];

  return (
    <div className="w-72 bg-zinc-950/80 backdrop-blur-2xl border-l border-zinc-800/80 p-5 h-full flex flex-col shadow-2xl shrink-0 z-20">
      
      <div className="mb-6">
        <h2 className="text-sm font-bold text-zinc-500 mb-3 flex items-center gap-2">
          أدوات المعمار والقياس
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {archTools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.type;
            return (
              <button
                key={tool.type}
                onClick={() => setActiveTool(isActive ? 'select' : (tool.type as any))}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                  isActive 
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
                    : `bg-zinc-900/50 border-zinc-800/50 ${tool.color} hover:bg-zinc-800 hover:text-white`
                }`}
              >
                <Icon size={24} className="mb-2" />
                <span className="text-xs font-bold text-center leading-tight mt-2">{tool.label}</span>
              </button>
            );
          })}
        </div>
        
        <button
          onClick={toggleSnapping}
          className={`mt-2 w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
            isSnappingEnabled 
              ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' 
              : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:text-zinc-400'
          }`}
        >
          <span className="text-xs font-bold flex items-center gap-2">
            <Magnet size={16} className={isSnappingEnabled ? 'text-amber-400' : 'text-zinc-500'} />
            المغناطيس (Snapping)
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/20">
            {isSnappingEnabled ? 'ON' : 'OFF'}
          </span>
        </button>

        <button
          onClick={() => toggleHistoryVisible()}
          className={`mt-2 w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
            historyVisible
              ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
              : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          <span className="text-xs font-bold flex items-center gap-2">
            🕘
            سجل الحركات
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/20">
            {historyVisible ? 'مخفي' : 'عائم'}
          </span>
        </button>

        <button
          onClick={useProjectStore.getState().showAllHiddenElements}
          className="mt-2 w-full flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all duration-300"
        >
          <span className="text-xs font-bold flex items-center gap-2">
            <EyeOff size={16} />
            إظهار كل المخفي
          </span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
        <h2 className="text-sm font-bold text-zinc-500 mb-3 flex items-center gap-2">
          وحدات المطبخ
        </h2>
        <div className="space-y-2 mb-6">
          {kitchenTools.map((tool, idx) => {
            const Icon = tool.icon;
            return (
              <motion.button 
                key={tool.type}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => handleAddUnit(tool.type)} 
                className={`w-full flex items-center gap-4 p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl transition-all duration-300 text-right group ${tool.bgHover}`}
              >
                <div className={`p-2 rounded-lg bg-zinc-950 border border-zinc-800 group-hover:border-transparent transition-colors ${tool.color}`}>
                  <Icon size={16} />
                </div>
                <span className="font-semibold text-zinc-300 group-hover:text-white transition-colors text-xs">{tool.label}</span>
              </motion.button>
            )
          })}
        </div>

        <h2 className="text-sm font-bold text-zinc-500 mb-3 flex items-center gap-2">
          الأجهزة الكهربائية
        </h2>
        <div className="space-y-2">
          {[
            { type: 'fridge', label: 'ثلاجة', labelEn: 'Fridge', icon: '🧊', color: 'text-cyan-400', bgHover: 'hover:bg-cyan-500/10 hover:border-cyan-500/50' },
            { type: 'freezer', label: 'فريزر', labelEn: 'Freezer', icon: '❄️', color: 'text-blue-400', bgHover: 'hover:bg-blue-500/10 hover:border-blue-500/50' },
            { type: 'oven', label: 'فرن', labelEn: 'Oven', icon: '🔥', color: 'text-orange-400', bgHover: 'hover:bg-orange-500/10 hover:border-orange-500/50' },
            { type: 'stove', label: 'بوتاجاز', labelEn: 'Stove', icon: '🍳', color: 'text-red-400', bgHover: 'hover:bg-red-500/10 hover:border-red-500/50' },
            { type: 'dishwasher', label: 'غسالة أطباق', labelEn: 'Dishwasher', icon: '🍽️', color: 'text-teal-400', bgHover: 'hover:bg-teal-500/10 hover:border-teal-500/50' },
            { type: 'washing_machine', label: 'غسالة ملابس', labelEn: 'Washing Machine', icon: '👕', color: 'text-indigo-400', bgHover: 'hover:bg-indigo-500/10 hover:border-indigo-500/50' },
            { type: 'dryer', label: 'مجفف ملابس', labelEn: 'Dryer', icon: '🌬️', color: 'text-purple-400', bgHover: 'hover:bg-purple-500/10 hover:border-purple-500/50' },
            { type: 'sink', label: 'حوض مطبخ', labelEn: 'Sink', icon: '🚰', color: 'text-emerald-400', bgHover: 'hover:bg-emerald-500/10 hover:border-emerald-500/50' },
          ].map((appliance, idx) => (
            <motion.button
              key={appliance.type}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (kitchenTools.length + idx) * 0.05 }}
              onClick={() => {
                // Add appliance as a base unit with special label
                const settings = useProjectStore.getState().projectSettings;
                const baseX = room ? Math.max(50, (room.widthMm / 2) - 300) : 1000;
                const baseY = 0;
                
                let defaultX = baseX;
                let defaultY = baseY;
                
                // Default dimensions for appliances
                let widthMm = 600;
                let depthMm = 600;
                let heightMm = 850;
                
                // Set specific dimensions for each appliance type
                switch(appliance.type) {
                  case 'fridge':
                    widthMm = 700;
                    depthMm = 700;
                    heightMm = 1800;
                    break;
                  case 'freezer':
                    widthMm = 600;
                    depthMm = 600;
                    heightMm = 1800;
                    break;
                  case 'oven':
                    widthMm = 600;
                    depthMm = 600;
                    heightMm = 900;
                    break;
                  case 'stove':
                    widthMm = 600;
                    depthMm = 600;
                    heightMm = 900;
                    break;
                  case 'dishwasher':
                    widthMm = 600;
                    depthMm = 600;
                    heightMm = 850;
                    break;
                  case 'washing_machine':
                    widthMm = 600;
                    depthMm = 600;
                    heightMm = 850;
                    break;
                  case 'dryer':
                    widthMm = 600;
                    depthMm = 600;
                    heightMm = 850;
                    break;
                  case 'sink':
                    widthMm = 700;
                    depthMm = 600;
                    heightMm = 850;
                    break;
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
                    doorCount: 0,
                    drawerCount: 0,
                    shelfCount: 0,
                    hingeType: settings.defaultHingeId,
                    handleType: settings.defaultHandleId,
                    hasLedProfile: false,
                  } as any;
                  
                  const placement = findSmartUnitPlacement(newUnit, room, useProjectStore.getState().units, baseX, baseY, 50, 80);
                  defaultX = placement.xMm;
                  defaultY = placement.yMm;
                }
                
                // Add unit with appliance label
                const unitId = `unit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                const newUnit: any = {
                  id: unitId,
                  type: 'base',
                  label: `${appliance.label} (${appliance.labelEn})`,
                  position: { xMm: defaultX, yMm: defaultY, zMm: 0, rotationDeg: 0 },
                  dimensions: { widthMm, depthMm, heightMm },
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
                };
                
                useProjectStore.getState().commitSnapshot();
                useProjectStore.setState((state) => ({
                  units: [...state.units, newUnit],
                  selectedUnitId: unitId,
                  selectedElement: { id: unitId, type: 'unit' },
                  selectedElements: [{ id: unitId, type: 'unit' }],
                }));
              }}
              className={`w-full flex items-center gap-3 p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl transition-all duration-300 text-right group ${appliance.bgHover}`}
            >
              <div className={`text-2xl`}>{appliance.icon}</div>
              <div className="flex-1">
                <span className="font-semibold text-zinc-300 group-hover:text-white transition-colors text-xs block">{appliance.label}</span>
                <span className="text-[10px] text-zinc-500">{appliance.labelEn}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {useProjectStore.getState().selectedElement ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 bg-zinc-900/80 border border-emerald-500/30 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.05)] relative overflow-hidden flex flex-col"
          style={{ maxHeight: 'calc(100vh - 500px)' }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl -z-10 rounded-full"></div>
          <div className="p-5 overflow-y-auto flex-1 custom-scrollbar" onWheelCapture={(e) => e.stopPropagation()}>
          
          {useProjectStore.getState().selectedElement?.type === 'unit' && selectedUnit && (
            <>
              <h3 className="font-bold text-white mb-4 text-sm flex items-center gap-2">
                خصائص الوحدة
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-mono uppercase tracking-widest">{selectedUnit.type}</span>
              </h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 text-xs font-medium">
                    {selectedUnit.type.startsWith('corner') ? 'الطول على الجدار (X)' : 'العرض'}
                  </span>
                  <input 
                    type="number"
                    value={convertMmToDisplayUnit(selectedUnit.dimensions.widthMm, displayUnit)}
                    onChange={(e) => useProjectStore.getState().updateUnitDimensions(selectedUnit.id, convertDisplayUnitToMm(Number(e.target.value), displayUnit), selectedUnit.dimensions.depthMm, selectedUnit.dimensions.heightMm)}
                    className="w-20 bg-transparent text-white font-mono text-sm text-left outline-none"
                  />
                  <span className="text-zinc-600 text-xs">{displayUnit}</span>
                </div>
                <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 text-xs font-medium">
                    {selectedUnit.type.startsWith('corner') ? 'الطول على الجدار (Y)' : 'العمق الإجمالي'}
                  </span>
                  <input 
                    type="number"
                    value={convertMmToDisplayUnit(selectedUnit.dimensions.depthMm, displayUnit)}
                    onChange={(e) => useProjectStore.getState().updateUnitDimensions(selectedUnit.id, selectedUnit.dimensions.widthMm, convertDisplayUnitToMm(Number(e.target.value), displayUnit), selectedUnit.dimensions.heightMm)}
                    className="w-20 bg-transparent text-white font-mono text-sm text-left outline-none"
                  />
                  <span className="text-zinc-600 text-xs">{displayUnit}</span>
                </div>

                {selectedUnit.type.startsWith('corner') && (
                  <>
                    <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                      <span className="text-zinc-500 text-xs font-medium">عمق الوحدات المجاورة (X)</span>
                      <input 
                        type="number"
                        value={convertMmToDisplayUnit(selectedUnit.dimensions.rightLegCarcassDepthMm || 600, displayUnit)}
                        onChange={(e) => useProjectStore.getState().updateUnitDimensions(selectedUnit.id, selectedUnit.dimensions.widthMm, selectedUnit.dimensions.depthMm, selectedUnit.dimensions.heightMm, selectedUnit.dimensions.leftLegCarcassDepthMm, convertDisplayUnitToMm(Number(e.target.value), displayUnit))}
                        className="w-20 bg-transparent text-white font-mono text-sm text-left outline-none"
                      />
                      <span className="text-zinc-600 text-xs">{displayUnit}</span>
                    </div>
                    <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                      <span className="text-zinc-500 text-xs font-medium">عمق الوحدات المجاورة (Y)</span>
                      <input 
                        type="number"
                        value={convertMmToDisplayUnit(selectedUnit.dimensions.leftLegCarcassDepthMm || 600, displayUnit)}
                        onChange={(e) => useProjectStore.getState().updateUnitDimensions(selectedUnit.id, selectedUnit.dimensions.widthMm, selectedUnit.dimensions.depthMm, selectedUnit.dimensions.heightMm, convertDisplayUnitToMm(Number(e.target.value), displayUnit), selectedUnit.dimensions.rightLegCarcassDepthMm)}
                        className="w-20 bg-transparent text-white font-mono text-sm text-left outline-none"
                      />
                      <span className="text-zinc-600 text-xs">{displayUnit}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 text-xs font-medium">الارتفاع</span>
                  <input 
                    type="number"
                    value={convertMmToDisplayUnit(selectedUnit.dimensions.heightMm, displayUnit)}
                    onChange={(e) => useProjectStore.getState().updateUnitDimensions(selectedUnit.id, selectedUnit.dimensions.widthMm, selectedUnit.dimensions.depthMm, convertDisplayUnitToMm(Number(e.target.value), displayUnit))}
                    className="w-20 bg-transparent text-white font-mono text-sm text-left outline-none"
                  />
                  <span className="text-zinc-600 text-xs">{displayUnit}</span>
                </div>
                <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 text-xs font-medium">الارتفاع من الأرض</span>
                  <input 
                    type="number"
                    value={convertMmToDisplayUnit(selectedUnit.position.zMm ?? 0, displayUnit)}
                    onChange={(e) => useProjectStore.getState().updateUnitPosition(selectedUnit.id, selectedUnit.position.xMm, selectedUnit.position.yMm, convertDisplayUnitToMm(Number(e.target.value), displayUnit))}
                    className="w-20 bg-transparent text-white font-mono text-sm text-left outline-none"
                  />
                  <span className="text-zinc-600 text-xs">{displayUnit}</span>
                </div>
                <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 text-xs font-medium">الزاوية</span>
                  <select 
                    value={selectedUnit.position.rotationDeg}
                    onChange={(e) => useProjectStore.getState().updateUnitPosition(selectedUnit.id, selectedUnit.position.xMm, selectedUnit.position.yMm, selectedUnit.position.zMm, Number(e.target.value) as any)}
                    className="w-20 bg-transparent text-white font-mono text-sm text-left outline-none"
                  >
                    <option value={0} className="text-black">0°</option>
                    <option value={90} className="text-black">90°</option>
                    <option value={180} className="text-black">180°</option>
                    <option value={270} className="text-black">270°</option>
                  </select>
                </div>

                {/* --- Parametric Properties --- */}
                <div className="h-px bg-zinc-800/80 my-4 w-full"></div>
                <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 text-xs font-medium">الأبواب</span>
                  <input 
                    type="number"
                    value={selectedUnit.doorCount}

                    onChange={(e) => {
                      const updatedUnits = units.map(u => u.id === selectedUnit.id ? { ...u, doorCount: Number(e.target.value) } : u);
                      useProjectStore.setState({ units: updatedUnits });
                    }}
                    className="w-12 bg-transparent text-white font-mono text-sm text-center outline-none"
                  />
                </div>

                <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 text-xs font-medium">الأرفف الداخلية</span>
                  <input 
                    type="number"
                    value={selectedUnit.shelfCount || 0}

                    onChange={(e) => {
                      const updatedUnits = units.map(u => u.id === selectedUnit.id ? { ...u, shelfCount: Number(e.target.value) } : u);
                      useProjectStore.setState({ units: updatedUnits });
                    }}
                    className="w-12 bg-transparent text-white font-mono text-sm text-center outline-none"
                  />
                </div>

                <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 text-xs font-medium">مفصلات للباب</span>
                  <input 
                    type="number"
                    value={selectedUnit.hingesPerDoor || 2}

                    onChange={(e) => {
                      const updatedUnits = units.map(u => u.id === selectedUnit.id ? { ...u, hingesPerDoor: Number(e.target.value) } : u);
                      useProjectStore.setState({ units: updatedUnits });
                    }}
                    className="w-12 bg-transparent text-white font-mono text-sm text-center outline-none"
                  />
                </div>

                <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 text-xs font-medium">نوع المفصلات</span>
                  <select 
                    value={selectedUnit.hingeType || 'standard'}
                    onChange={(e) => {
                      const updatedUnits = units.map(u => u.id === selectedUnit.id ? { ...u, hingeType: e.target.value as any } : u);
                      useProjectStore.setState({ units: updatedUnits });
                    }}
                    className="w-24 bg-transparent text-white font-mono text-xs text-left outline-none"
                  >
                    <option value="standard" className="text-black">عادية</option>
                    <option value="soft_close" className="text-black">باكم (Soft Close)</option>
                    <option value="180_deg" className="text-black">180 درجة</option>
                    <option value="none" className="text-black">بدون</option>
                  </select>
                </div>

                <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 text-xs font-medium">المقابض</span>
                  <select 
                    value={selectedUnit.handleType || 'standard'}
                    onChange={(e) => {
                      const updatedUnits = units.map(u => u.id === selectedUnit.id ? { ...u, handleType: e.target.value as any } : u);
                      useProjectStore.setState({ units: updatedUnits });
                    }}
                    className="w-24 bg-transparent text-white font-mono text-xs text-left outline-none"
                  >
                    <option value="standard" className="text-black">عادي</option>
                    <option value="profile" className="text-black">بروفايل (Gola)</option>
                    <option value="cnc_groove" className="text-black">مجرى CNC</option>
                    <option value="knob" className="text-black">مقبض صغير (Knob)</option>
                    <option value="hidden" className="text-black">مخفي (Push to open)</option>
                    <option value="none" className="text-black">بدون</option>
                  </select>
                </div>

                <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 text-xs font-medium">إضاءة ليد (LED Profile)</span>
                  <input 
                    type="checkbox"
                    checked={selectedUnit.hasLedProfile || false}
                    onChange={(e) => {
                      const updatedUnits = units.map(u => u.id === selectedUnit.id ? { ...u, hasLedProfile: e.target.checked, ledProfileLengthMm: e.target.checked ? u.dimensions.widthMm : 0 } : u);
                      useProjectStore.setState({ units: updatedUnits });
                    }}
                    className="w-4 h-4 rounded accent-emerald-500"
                  />
                </div>

                {/* --- 3D View Controls: فتح الأبواب والأدراج --- */}
                <div className="h-px bg-zinc-800/80 my-4 w-full"></div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const updatedUnits = units.map(u => u.id === selectedUnit.id ? { ...u, _3dDoorOpen: !u._3dDoorOpen } : u);
                      useProjectStore.setState({ units: updatedUnits });
                    }}
                    className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${
                      selectedUnit._3dDoorOpen
                        ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                        : 'bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    {selectedUnit._3dDoorOpen ? '🗝️ إغلاق الأبواب' : '🚪 فتح الأبواب'}
                  </button>
                  {(selectedUnit.drawerCount || 0) > 0 && (
                    <button
                      onClick={() => {
                        const updatedUnits = units.map(u => u.id === selectedUnit.id ? { ...u, _3dDrawerOpen: !u._3dDrawerOpen } : u);
                        useProjectStore.setState({ units: updatedUnits });
                      }}
                      className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${
                        selectedUnit._3dDrawerOpen
                          ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                          : 'bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
                      }`}
                    >
                      {selectedUnit._3dDrawerOpen ? '✖️ إغلاق الأدراج' : '📂 فتح الأدراج'}
                    </button>
                  )}
                </div>
                <div className="text-[10px] text-zinc-600 text-center mt-1">(للعرض 3D فقط)</div>

                {/* --- Door Division & Dividers --- */}
                <div className="h-px bg-zinc-800/80 my-4 w-full"></div>
                <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 text-xs font-medium">تقسيم الأبواب</span>
                  <select
                    value={selectedUnit.doorConfig?.divisionStyle || 'equal'}
                    onChange={(e) => {
                      const style = e.target.value as any;
                      const existing = selectedUnit.doorConfig || { count: selectedUnit.doorCount, divisionStyle: 'equal' as any, dividerWidthMm: 50 };
                      let newConfig: any = { ...existing, divisionStyle: style };
                      // Auto-compute panel groups
                      if (style === 'equal') {
                        newConfig.panelGroupSizes = undefined;
                        newConfig.dividerWidthMm = undefined;
                      } else if (style === 'symmetrical' && selectedUnit.doorCount >= 4) {
                        newConfig.panelGroupSizes = [Math.floor(selectedUnit.doorCount / 2), Math.ceil(selectedUnit.doorCount / 2)];
                        newConfig.dividerWidthMm = newConfig.dividerWidthMm || 50;
                      }
                      useProjectStore.getState().updateUnitDetails(selectedUnit.id, { doorConfig: newConfig });
                    }}
                    className="w-24 bg-transparent text-white font-mono text-xs text-left outline-none"
                  >
                    <option value="equal" className="text-black">متساوي</option>
                    <option value="symmetrical" className="text-black">مع فاصل في النص</option>
                    <option value="asymmetric" className="text-black">توزيع حر</option>
                  </select>
                </div>
                {selectedUnit.doorConfig?.divisionStyle === 'symmetrical' && (
                  <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                    <span className="text-zinc-500 text-xs font-medium">عرض الفاصل (مم)</span>
                    <input
                      type="number"
                      value={selectedUnit.doorConfig?.dividerWidthMm || 50}
                      onChange={(e) => {
                        const newConfig = { ...(selectedUnit.doorConfig || { count: selectedUnit.doorCount, divisionStyle: 'symmetrical' as any }), dividerWidthMm: Number(e.target.value) };
                        useProjectStore.getState().updateUnitDetails(selectedUnit.id, { doorConfig: newConfig });
                      }}
                      className="w-16 bg-transparent text-white font-mono text-sm text-center outline-none border-b border-zinc-700"
                    />
                  </div>
                )}
                {selectedUnit.doorConfig?.divisionStyle === 'symmetrical' && selectedUnit.doorConfig?.panelGroupSizes && (
                  <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                    <span className="text-zinc-500 text-xs font-medium">توزيع الضلف</span>
                    <span className="text-white font-mono text-xs">
                      {selectedUnit.doorConfig.panelGroupSizes.join(' + ')}
                      {' = '}{selectedUnit.doorConfig.panelGroupSizes.reduce((a, b) => a + b, 0)} باب
                    </span>
                  </div>
                )}

                {/* --- LED Profile Advanced --- */}
                <div className="h-px bg-zinc-800/80 my-4 w-full"></div>
                <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 text-xs font-medium">إضاءة ليد</span>
                    <span className="text-[10px] text-zinc-700">(LED)</span>
                  </div>
                  <input 
                    type="checkbox"
                    checked={selectedUnit.ledConfig?.hasLed || selectedUnit.hasLedProfile || false}
                    onChange={(e) => {
                      const hasLed = e.target.checked;
                      const existing = selectedUnit.ledConfig || { hasLed: false, placement: 'external_top' as any, colorHex: '#FFE4B5', brightness: 0.8 };
                      const newConfig: any = { ...existing, hasLed };
                      if (hasLed) {
                        // Auto-compute lengths
                        newConfig.externalLengthMm = selectedUnit.dimensions.widthMm;
                        newConfig.internalLengthMm = (selectedUnit.shelfCount || 0) > 0 ? (selectedUnit.shelfCount || 1) * selectedUnit.dimensions.widthMm : 0;
                      }
                      useProjectStore.getState().updateUnitDetails(selectedUnit.id, { hasLedProfile: hasLed, ledConfig: newConfig, ledProfileLengthMm: hasLed ? selectedUnit.dimensions.widthMm : 0 });
                    }}
                    className="w-4 h-4 rounded accent-emerald-500"
                  />
                </div>
                {selectedUnit.ledConfig?.hasLed && (
                  <>
                    <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                      <span className="text-zinc-500 text-xs font-medium">مكان الليد</span>
                      <select
                        value={selectedUnit.ledConfig?.placement || 'external_top'}
                        onChange={(e) => {
                          const newConfig = { ...selectedUnit.ledConfig!, placement: e.target.value as any };
                          useProjectStore.getState().updateUnitDetails(selectedUnit.id, { ledConfig: newConfig });
                        }}
                        className="w-24 bg-transparent text-white font-mono text-xs text-left outline-none"
                      >
                        <option value="external_top" className="text-black">خارجي - فوق</option>
                        <option value="external_bottom" className="text-black">خارجي - تحت</option>
                        <option value="internal_top" className="text-black">داخلي - فوق الرفوف</option>
                        <option value="internal_bottom" className="text-black">داخلي - تحت الرفوف</option>
                        <option value="both" className="text-black">خارجي + داخلي</option>
                      </select>
                    </div>
                    <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                      <span className="text-zinc-500 text-xs font-medium">الطول الخارجي (مم)</span>
                      <input
                        type="number"
                        value={selectedUnit.ledConfig?.externalLengthMm || selectedUnit.dimensions.widthMm}
                        onChange={(e) => {
                          const newConfig = { ...selectedUnit.ledConfig!, externalLengthMm: Number(e.target.value) };
                          useProjectStore.getState().updateUnitDetails(selectedUnit.id, { ledConfig: newConfig, ledProfileLengthMm: Number(e.target.value) + (newConfig.internalLengthMm || 0) });
                        }}
                        className="w-16 bg-transparent text-white font-mono text-sm text-center outline-none border-b border-zinc-700"
                      />
                    </div>
                    {(selectedUnit.ledConfig?.placement === 'internal_top' || selectedUnit.ledConfig?.placement === 'internal_bottom' || selectedUnit.ledConfig?.placement === 'both') && (
                      <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                        <span className="text-zinc-500 text-xs font-medium">الطول الداخلي (مم)</span>
                        <input
                          type="number"
                          value={selectedUnit.ledConfig?.internalLengthMm || 0}
                          onChange={(e) => {
                            const newConfig = { ...selectedUnit.ledConfig!, internalLengthMm: Number(e.target.value) };
                            useProjectStore.getState().updateUnitDetails(selectedUnit.id, { ledConfig: newConfig, ledProfileLengthMm: (newConfig.externalLengthMm || 0) + Number(e.target.value) });
                          }}
                          className="w-16 bg-transparent text-white font-mono text-sm text-center outline-none border-b border-zinc-700"
                        />
                      </div>
                    )}
                    <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                      <span className="text-zinc-500 text-xs font-medium">لون الإضاءة</span>
                      <input
                        type="color"
                        value={selectedUnit.ledConfig?.colorHex || '#FFE4B5'}
                        onChange={(e) => {
                          const newConfig = { ...selectedUnit.ledConfig!, colorHex: e.target.value };
                          useProjectStore.getState().updateUnitDetails(selectedUnit.id, { ledConfig: newConfig });
                        }}
                        className="w-10 h-8 rounded cursor-pointer border border-zinc-700 bg-transparent"
                      />
                    </div>
                    <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                      <span className="text-zinc-500 text-xs font-medium">شدة الإضاءة</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={selectedUnit.ledConfig?.brightness || 0.8}
                        onChange={(e) => {
                          const newConfig = { ...selectedUnit.ledConfig!, brightness: Number(e.target.value) };
                          useProjectStore.getState().updateUnitDetails(selectedUnit.id, { ledConfig: newConfig });
                        }}
                        className="w-20 accent-emerald-500"
                      />
                    </div>
                  </>
                )}

                {selectedUnit.type.startsWith('corner') && (
                  <>
                    <div className="h-px bg-zinc-800/80 my-4 w-full"></div>
                    <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                      <span className="text-zinc-500 text-xs font-medium">شكل باب الركن</span>
                      <select 
                        value={selectedUnit.cornerConfig?.doorStyle || 'bifold_lazy_susan'}
                        onChange={(e) => {
                          const updatedConfig = { ...(selectedUnit.cornerConfig || { internalSolution: 'none', hardwareCost: 0 }), doorStyle: e.target.value as any };
                          useProjectStore.getState().updateUnitDetails(selectedUnit.id, { cornerConfig: updatedConfig });
                        }}
                        className="w-24 bg-transparent text-white font-mono text-xs text-left outline-none"
                      >
                        <option value="bifold_lazy_susan" className="text-black">مفصلات متصلة (Bi-fold)</option>
                        <option value="diagonal_single" className="text-black">باب قطري (شطف)</option>
                        <option value="none" className="text-black">بدون</option>
                      </select>
                    </div>

                    <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                      <span className="text-zinc-500 text-xs font-medium">نظام التخزين الداخلي</span>
                      <select 
                        value={selectedUnit.cornerConfig?.internalSolution || 'none'}
                        onChange={(e) => {
                          const updatedConfig = { ...(selectedUnit.cornerConfig || { doorStyle: 'bifold_lazy_susan', hardwareCost: 0 }), internalSolution: e.target.value as any };
                          useProjectStore.getState().updateUnitDetails(selectedUnit.id, { cornerConfig: updatedConfig });
                        }}
                        className="w-24 bg-transparent text-white font-mono text-xs text-left outline-none"
                      >
                        <option value="fixed_shelf" className="text-black">أرفف خشب ثابتة</option>
                        <option value="lazy_susan_2tier" className="text-black">أطباق دوارة (Lazy Susan)</option>
                        <option value="magic_corner_pullout" className="text-black">سحب ذكي (Magic Corner)</option>
                        <option value="none" className="text-black">بدون</option>
                      </select>
                    </div>

                    {(selectedUnit.cornerConfig?.internalSolution === 'lazy_susan_2tier' || selectedUnit.cornerConfig?.internalSolution === 'magic_corner_pullout') && (
                      <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                        <span className="text-zinc-500 text-xs font-medium">تكلفة الميكانيزم الجاهز</span>
                        <input 
                          type="number"
                          value={selectedUnit.cornerConfig.hardwareCost}
                          onChange={(e) => {
                            const updatedConfig = { ...selectedUnit.cornerConfig!, hardwareCost: Number(e.target.value) };
                            useProjectStore.getState().updateUnitDetails(selectedUnit.id, { cornerConfig: updatedConfig });
                          }}
                          className="w-16 bg-transparent text-white font-mono text-sm text-center outline-none border-b border-zinc-700"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
              <button 
                onClick={() => deleteUnit(selectedUnit.id)} 
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all font-bold text-sm"
              >
                <Trash2 size={16} />
                حذف الوحدة
              </button>
            </>
          )}
          
          {useProjectStore.getState().selectedElement?.type === 'fixture' && (
            <>
              <h3 className="font-bold text-white mb-4 text-sm flex items-center gap-2">
                خصائص الفتحة
                <span className="bg-sky-500/20 text-sky-400 text-[10px] px-2 py-0.5 rounded font-mono uppercase tracking-widest">
                  {useProjectStore.getState().room?.fixtures.find(f => f.id === useProjectStore.getState().selectedElement?.id)?.type}
                </span>
              </h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 text-xs font-medium">العرض</span>
                  <input 
                    type="number"
                    value={convertMmToDisplayUnit(useProjectStore.getState().room?.fixtures.find(f => f.id === useProjectStore.getState().selectedElement?.id)?.widthMm || 0, displayUnit)}
                    onChange={(e) => useProjectStore.getState().updateRoomFixture(useProjectStore.getState().selectedElement!.id, { widthMm: convertDisplayUnitToMm(Number(e.target.value), displayUnit) })}
                    className="w-20 bg-transparent text-white font-mono text-sm text-left outline-none"
                  />
                  <span className="text-zinc-600 text-xs">{displayUnit}</span>
                </div>
                <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 text-xs font-medium">الارتفاع العمودي</span>
                  <input 
                    type="number"
                    value={convertMmToDisplayUnit(useProjectStore.getState().room?.fixtures.find(f => f.id === useProjectStore.getState().selectedElement?.id)?.heightMm || 0, displayUnit)}
                    onChange={(e) => useProjectStore.getState().updateRoomFixture(useProjectStore.getState().selectedElement!.id, { heightMm: convertDisplayUnitToMm(Number(e.target.value), displayUnit) })}
                    className="w-20 bg-transparent text-white font-mono text-sm text-left outline-none"
                  />
                  <span className="text-zinc-600 text-xs">{displayUnit}</span>
                </div>
                <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 text-xs font-medium">الارتفاع عن الأرض</span>
                  <input 
                    type="number"
                    value={convertMmToDisplayUnit(useProjectStore.getState().room?.fixtures.find(f => f.id === useProjectStore.getState().selectedElement?.id)?.zMm || 0, displayUnit)}
                    onChange={(e) => useProjectStore.getState().updateRoomFixture(useProjectStore.getState().selectedElement!.id, { zMm: convertDisplayUnitToMm(Number(e.target.value), displayUnit) })}
                    className="w-20 bg-transparent text-white font-mono text-sm text-left outline-none"
                  />
                  <span className="text-zinc-600 text-xs">{displayUnit}</span>
                </div>
                <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 text-xs font-medium">الزاوية</span>
                  <select 
                    value={useProjectStore.getState().room?.fixtures.find(f => f.id === useProjectStore.getState().selectedElement?.id)?.rotationDeg || 0}
                    onChange={(e) => useProjectStore.getState().updateRoomFixture(useProjectStore.getState().selectedElement!.id, { rotationDeg: Number(e.target.value) })}
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
                onClick={() => useProjectStore.getState().deleteRoomFixture(useProjectStore.getState().selectedElement!.id)} 
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all font-bold text-sm"
              >
                <Trash2 size={16} />
                حذف
              </button>
            </>
          )}

          {useProjectStore.getState().selectedElement?.type === 'obstacle' && (
            <>
              <h3 className="font-bold text-white mb-4 text-sm flex items-center gap-2">
                خصائص العمود
                <span className="bg-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded font-mono uppercase tracking-widest">
                  {useProjectStore.getState().room?.obstacles.find(o => o.id === useProjectStore.getState().selectedElement?.id)?.type}
                </span>
              </h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 text-xs font-medium">العرض</span>
                  <input 
                    type="number"
                    value={convertMmToDisplayUnit(useProjectStore.getState().room?.obstacles.find(o => o.id === useProjectStore.getState().selectedElement?.id)?.widthMm || 0, displayUnit)}
                    onChange={(e) => useProjectStore.getState().updateRoomObstacle(useProjectStore.getState().selectedElement!.id, { widthMm: convertDisplayUnitToMm(Number(e.target.value), displayUnit) })}
                    className="w-20 bg-transparent text-white font-mono text-sm text-left outline-none"
                  />
                  <span className="text-zinc-600 text-xs">{displayUnit}</span>
                </div>
                <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 text-xs font-medium">العمق</span>
                  <input 
                    type="number"
                    value={convertMmToDisplayUnit(useProjectStore.getState().room?.obstacles.find(o => o.id === useProjectStore.getState().selectedElement?.id)?.depthMm || 0, displayUnit)}
                    onChange={(e) => useProjectStore.getState().updateRoomObstacle(useProjectStore.getState().selectedElement!.id, { depthMm: convertDisplayUnitToMm(Number(e.target.value), displayUnit) })}
                    className="w-20 bg-transparent text-white font-mono text-sm text-left outline-none"
                  />
                  <span className="text-zinc-600 text-xs">{displayUnit}</span>
                </div>
                <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 text-xs font-medium">الزاوية</span>
                  <select 
                    value={useProjectStore.getState().room?.obstacles.find(o => o.id === useProjectStore.getState().selectedElement?.id)?.rotationDeg || 0}
                    onChange={(e) => useProjectStore.getState().updateRoomObstacle(useProjectStore.getState().selectedElement!.id, { rotationDeg: Number(e.target.value) })}
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
                onClick={() => useProjectStore.getState().deleteRoomObstacle(useProjectStore.getState().selectedElement!.id)} 
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all font-bold text-sm"
              >
                <Trash2 size={16} />
                حذف
              </button>
            </>
          )}

          </div>{/* END inner scrollable div */}
        </motion.div>
      ) : (
        <div className="mt-6 p-6 text-sm text-zinc-500 text-center bg-zinc-900/30 border border-zinc-800/50 rounded-2xl border-dashed">
          اختر عنصراً من مساحة العمل لتعديل خصائصه
        </div>
      )}
    </div>
  );
};
