"use client";

import React from 'react';
import { useProjectStore } from '@/store/projectStore';
import { UnitType } from '@/types';
import { Box, Layers, ArrowUpFromLine, CornerDownRight, Trash2, Square, DoorOpen, LayoutGrid, Ruler, Magnet, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { convertMmToDisplayUnit, convertDisplayUnitToMm } from '@/utils/measurements';

export const ToolsSidebar = () => {
  const { addUnit, units, selectedUnitId, deleteUnit, activeTool, setActiveTool, displayUnit, isSnappingEnabled, toggleSnapping, room } = useProjectStore();

  const handleAddUnit = (type: UnitType) => {
    // وضع الوحدة بذكاء: لو في وحدات، حطها جمب آخر وحدة من نفس النوع، ولو مفيش حطها في النص أو على الحيطة
    const sameTypeUnits = units.filter(u => u.type === type || (type === 'base' && u.type === 'drawer_unit'));
    
    let defaultX = room ? Math.max(100, (room.widthMm / 2) - 300) : 1000;
    let defaultY = 0; // لزق في الحيطة الخلفية الافتراضية

    if (sameTypeUnits.length > 0) {
      // إيجاد أبعد وحدة على محور X
      const lastUnit = sameTypeUnits.reduce((prev, current) => (prev.position.xMm > current.position.xMm) ? prev : current);
      // وضع الوحدة الجديدة بجوارها مباشرة
      defaultX = lastUnit.position.xMm + lastUnit.dimensions.widthMm;
      defaultY = lastUnit.position.yMm;
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
        <div className="space-y-2">
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
      </div>

      {useProjectStore.getState().selectedElement ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-5 bg-zinc-900/80 border border-emerald-500/30 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.05)] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl -z-10 rounded-full"></div>
          
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
                    type="number" min="0" max="4"
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
                    type="number" min="0" max="10"
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
                    type="number" min="1" max="6"
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

        </motion.div>
      ) : (
        <div className="mt-6 p-6 text-sm text-zinc-500 text-center bg-zinc-900/30 border border-zinc-800/50 rounded-2xl border-dashed">
          اختر عنصراً من مساحة العمل لتعديل خصائصه
        </div>
      )}
    </div>
  );
};
