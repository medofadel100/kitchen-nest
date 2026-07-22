"use client";

import React, { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { KitchenUnit, LedPlacement, DoorDivisionStyle } from '@/types';
import { convertMmToDisplayUnit, convertDisplayUnitToMm } from '@/utils/measurements';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box, ChevronDown, ChevronUp, Trash2,
  Lightbulb, DoorOpen, Layers, Wrench, Palette, Ruler
} from 'lucide-react';

const PropertyRow = ({ label, value, unit, onChange, step }: {
  label: string; value: number | string; unit?: string; onChange: (v: any) => void; step?: number
}) => (
  <div className="flex justify-between items-center bg-zinc-950/50 p-1.5 rounded-lg border border-zinc-800">
    <span className="text-zinc-500 text-[10px] font-medium">{label}</span>
    <div className="flex items-center gap-1">
      <input type="number" step={step ?? 1} value={typeof value === 'number' ? value : value}
        onChange={(e) => { const val = e.target.value; if (val !== '' && val !== '-') onChange(Number(val)); }}
        className="w-16 bg-transparent text-white font-mono text-[10px] text-left outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
      {unit && <span className="text-zinc-600 text-[8px]">{unit}</span>}
    </div>
  </div>
);

const ToggleRow = ({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void
}) => (
  <div className="flex justify-between items-center bg-zinc-950/50 p-1.5 rounded-lg border border-zinc-800">
    <span className="text-zinc-500 text-[10px] font-medium">{label}</span>
    <input type="checkbox" checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="w-3.5 h-3.5 rounded accent-emerald-500" />
  </div>
);

const SelectRow = ({ label, value, options, onChange }: {
  label: string; value: string | number; options: { value: string | number; label: string }[];
  onChange: (v: any) => void
}) => (
  <div className="flex justify-between items-center bg-zinc-950/50 p-1.5 rounded-lg border border-zinc-800">
    <span className="text-zinc-500 text-[10px] font-medium">{label}</span>
    <select value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-20 bg-transparent text-white font-mono text-[10px] text-left outline-none">
      {options.map(o => <option key={o.value} value={o.value} className="text-black">{o.label}</option>)}
    </select>
  </div>
);

const SectionHeader = ({ title, icon: Icon, expanded, onToggle }: {
  title: string; icon: any; expanded: boolean; onToggle: () => void
}) => (
  <button onClick={onToggle}
    className="w-full flex items-center justify-between text-zinc-400 hover:text-white transition-colors py-1">
    <span className="text-[10px] font-bold flex items-center gap-1.5">
      <Icon size={11} />
      {title}
    </span>
    {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
  </button>
);

interface UnitPropertiesPanelProps {
  unit: KitchenUnit;
}

export const UnitPropertiesPanel: React.FC<UnitPropertiesPanelProps> = ({ unit }) => {
  const { displayUnit, deleteUnit } = useProjectStore();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    dimensions: true,
    doors: false,
    shelves: false,
    led: false,
    handles: false,
  });

  const update = (updates: Partial<KitchenUnit>) => {
    useProjectStore.getState().updateUnitDetails(unit.id, updates);
  };

  const toggleSection = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isBaseType = ['base', 'corner_base', 'drawer_unit', 'island', 'pantry_pullout'].includes(unit.type);
  const isUpperType = ['wall', 'corner_wall', 'loft'].includes(unit.type);
  const isTallType = ['tall', 'corner_tall'].includes(unit.type);
  const hasDoors = unit.doorCount > 0;

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Box size={12} className="text-emerald-400" />
        <h3 className="font-bold text-white text-[11px]">خصائص الوحدة</h3>
        <span className="bg-emerald-500/20 text-emerald-400 text-[8px] px-1.5 py-0.5 rounded font-mono">
          {unit.type}
        </span>
      </div>

      {/* ── Dimensions ── */}
      <div className="border-b border-zinc-800/50 pb-1.5">
        <SectionHeader title="الأبعاد" icon={Ruler} expanded={expanded.dimensions} onToggle={() => toggleSection('dimensions')} />
        <AnimatePresence>
          {expanded.dimensions && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="space-y-1 mt-1 overflow-hidden">
              <PropertyRow label="العرض" value={convertMmToDisplayUnit(unit.dimensions.widthMm, displayUnit)} unit={displayUnit}
                step={displayUnit === 'm' ? 0.01 : displayUnit === 'cm' ? 0.1 : 1}
                onChange={(v) => useProjectStore.getState().updateUnitDimensions(unit.id, convertDisplayUnitToMm(v, displayUnit), unit.dimensions.depthMm, unit.dimensions.heightMm)} />
              <PropertyRow label="العمق" value={convertMmToDisplayUnit(unit.dimensions.depthMm, displayUnit)} unit={displayUnit}
                step={displayUnit === 'm' ? 0.01 : displayUnit === 'cm' ? 0.1 : 1}
                onChange={(v) => useProjectStore.getState().updateUnitDimensions(unit.id, unit.dimensions.widthMm, convertDisplayUnitToMm(v, displayUnit), unit.dimensions.heightMm)} />
              <PropertyRow label="الارتفاع" value={convertMmToDisplayUnit(unit.dimensions.heightMm, displayUnit)} unit={displayUnit}
                step={displayUnit === 'm' ? 0.01 : displayUnit === 'cm' ? 0.1 : 1}
                onChange={(v) => useProjectStore.getState().updateUnitDimensions(unit.id, unit.dimensions.widthMm, unit.dimensions.depthMm, convertDisplayUnitToMm(v, displayUnit))} />
              <PropertyRow label="من الأرض" value={convertMmToDisplayUnit(unit.position.zMm ?? 0, displayUnit)} unit={displayUnit}
                step={displayUnit === 'm' ? 0.01 : displayUnit === 'cm' ? 0.1 : 1}
                onChange={(v) => useProjectStore.getState().updateUnitPosition(unit.id, unit.position.xMm, unit.position.yMm, convertDisplayUnitToMm(v, displayUnit))} />

              {/* Color */}
              <div className="flex justify-between items-center bg-zinc-950/50 p-1.5 rounded-lg border border-zinc-800">
                <span className="text-zinc-500 text-[10px] font-medium">لون الجسم</span>
                <input type="color" value={unit.colorHex || '#D4B896'}
                  onChange={(e) => update({ colorHex: e.target.value })}
                  className="w-8 h-6 rounded cursor-pointer border border-zinc-700 bg-transparent" />
              </div>

              {/* Rotation */}
              <SelectRow label="الزاوية" value={unit.position.rotationDeg}
                options={[
                  { value: 0, label: '0°' }, { value: 90, label: '90°' },
                  { value: 180, label: '180°' }, { value: 270, label: '270°' }
                ]}
                onChange={(v) => useProjectStore.getState().updateUnitPosition(unit.id, unit.position.xMm, unit.position.yMm, unit.position.zMm, Number(v))} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Doors ── */}
      {hasDoors && (
        <div className="border-b border-zinc-800/50 pb-1.5">
          <SectionHeader title="الأبواب" icon={DoorOpen} expanded={expanded.doors} onToggle={() => toggleSection('doors')} />
          <AnimatePresence>
            {expanded.doors && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} className="space-y-1 mt-1 overflow-hidden">
                <PropertyRow label="عدد الأبواب" value={unit.doorCount}
                  onChange={(v) => update({ doorCount: Math.max(0, Math.min(6, v)) })} />
                {unit.doorCount > 1 && (
                  <SelectRow label="تقسيم الأبواب" value={unit.doorConfig?.divisionStyle || 'equal'}
                    options={[
                      { value: 'equal', label: 'متساوية' },
                      { value: 'symmetrical', label: 'تناظرية' },
                    ]}
                    onChange={(v) => update({ doorConfig: { ...unit.doorConfig, count: unit.doorCount, divisionStyle: v as DoorDivisionStyle } })} />
                )}
                {/* Door color */}
                <div className="flex justify-between items-center bg-zinc-950/50 p-1.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 text-[10px] font-medium">لون الأبواب</span>
                  <input type="color" value={unit.doorColorHex || '#8B4513'}
                    onChange={(e) => update({ doorColorHex: e.target.value })}
                    className="w-8 h-6 rounded cursor-pointer border border-zinc-700 bg-transparent" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Shelves ── */}
      <div className="border-b border-zinc-800/50 pb-1.5">
        <SectionHeader title="الأرفف" icon={Layers} expanded={expanded.shelves} onToggle={() => toggleSection('shelves')} />
        <AnimatePresence>
          {expanded.shelves && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="space-y-1 mt-1 overflow-hidden">
              <PropertyRow label="عدد الأرفف" value={unit.shelfCount || 0}
                onChange={(v) => update({ shelfCount: Math.max(0, Math.min(8, v)) })} />
              <ToggleRow label="وحدة حوض (بدون أرفف)" checked={!!unit.isSinkBase}
                onChange={(v) => update({ isSinkBase: v })} />
              <p className="text-[9px] text-zinc-600 leading-tight">
                الأرفف تتوزع بالتساوي على ارتفاع الوحدة. تظهر عند فتح الأبواب.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── LED ── */}
      <div className="border-b border-zinc-800/50 pb-1.5">
        <SectionHeader title="إضاءة LED" icon={Lightbulb} expanded={expanded.led} onToggle={() => toggleSection('led')} />
        <AnimatePresence>
          {expanded.led && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="space-y-1 mt-1 overflow-hidden">
              <ToggleRow label="تفعيل LED" checked={!!unit.ledConfig?.hasLed}
                onChange={(v) => update({ ledConfig: { hasLed: v, placement: unit.ledConfig?.placement || 'external_top', ...unit.ledConfig } })} />
              {unit.ledConfig?.hasLed && (
                <>
                  <SelectRow label="الموضع" value={unit.ledConfig?.placement || 'external_top'}
                    options={[
                      { value: 'external_top', label: 'خارجي علوي' },
                      { value: 'external_bottom', label: 'خارجي سفلي' },
                      { value: 'internal_top', label: 'داخلي علوي' },
                      { value: 'internal_bottom', label: 'داخلي سفلي' },
                      { value: 'both', label: 'الكل' },
                    ]}
                    onChange={(v) => update({ ledConfig: { ...unit.ledConfig, hasLed: true, placement: v as LedPlacement } })} />
                  <div className="flex justify-between items-center bg-zinc-950/50 p-1.5 rounded-lg border border-zinc-800">
                    <span className="text-zinc-500 text-[10px] font-medium">لون الإضاءة</span>
                    <input type="color" value={unit.ledConfig?.colorHex || '#FFE4B5'}
                      onChange={(e) => update({ ledConfig: { ...unit.ledConfig, hasLed: true, placement: unit.ledConfig?.placement || 'external_top', colorHex: e.target.value } })}
                      className="w-8 h-6 rounded cursor-pointer border border-zinc-700 bg-transparent" />
                  </div>
                  <PropertyRow label="السطوع" value={Math.round((unit.ledConfig?.brightness ?? 0.8) * 100)} unit="%"
                    onChange={(v) => update({ ledConfig: { ...unit.ledConfig, hasLed: true, placement: unit.ledConfig?.placement || 'external_top', brightness: Math.max(0, Math.min(1, v / 100)) } })} />
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Handles & Hinges ── */}
      <div className="border-b border-zinc-800/50 pb-1.5">
        <SectionHeader title="المقابض والمفصلات" icon={Wrench} expanded={expanded.handles} onToggle={() => toggleSection('handles')} />
        <AnimatePresence>
          {expanded.handles && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="space-y-1 mt-1 overflow-hidden">
              <SelectRow label="نوع المقبض" value={unit.handleType || 'standard'}
                options={[
                  { value: 'none', label: 'بدون' },
                  { value: 'standard', label: 'بار عادي' },
                  { value: 'profile', label: 'بروفايل' },
                  { value: 'gola', label: 'غولا' },
                  { value: 'knob', label: 'مقبض دائري' },
                  { value: 'cnc_groove', label: 'خوش CNC' },
                ]}
                onChange={(v) => update({ handleType: v })} />
              {hasDoors && (
                <>
                  <PropertyRow label="مفصلات/باب" value={unit.hingesPerDoor ?? 2}
                    onChange={(v) => update({ hingesPerDoor: Math.max(1, Math.min(5, v)) })} />
                  <SelectRow label="نوع المفصلة" value={unit.hingeType || 'soft_close'}
                    options={[
                      { value: 'standard', label: 'عادية' },
                      { value: 'soft_close', label: 'إغلاق رخو' },
                      { value: 'concealed', label: 'مدفونة (Blum)' },
                    ]}
                    onChange={(v) => update({ hingeType: v })} />
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete */}
      <button onClick={() => deleteUnit(unit.id)}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500 hover:text-white transition-all font-bold text-[10px]">
        <Trash2 size={12} />
        حذف الوحدة
      </button>
    </div>
  );
};
