"use client";

import React, { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useSettingsStore } from '@/store/settingsStore';
import { X, Settings2, Save } from 'lucide-react';
import { ProjectSettings } from '@/types';

const DEFAULT_COLOR_SWATCHES = [
  { id: 'wood_beige', nameAr: 'بيج خشبي', colorHex: '#D4B896' },
  { id: 'oak', nameAr: 'بلوط فاتح', colorHex: '#C8A96E' },
  { id: 'walnut', nameAr: 'جوز غامق', colorHex: '#5C3317' },
  { id: 'wenge', nameAr: 'وينج', colorHex: '#3B2A1A' },
  { id: 'grey', nameAr: 'رمادي', colorHex: '#6B7280' },
  { id: 'white', nameAr: 'أبيض', colorHex: '#FFFFFF' },
  { id: 'black', nameAr: 'أسود', colorHex: '#111111' },
  { id: 'green', nameAr: 'أخضر زيتوني', colorHex: '#2D4A2D' },
];

const ColorSelector = ({ label, value, onChange, swatches }: { label: string; value: string; onChange: (value: string) => void; swatches: typeof DEFAULT_COLOR_SWATCHES }) => (
  <div className="space-y-2">
    <label className="text-xs text-zinc-400">{label}</label>
    <div className="flex flex-wrap gap-2">
      {swatches.map((swatch) => (
        <button
          key={swatch.id}
          type="button"
          onClick={() => onChange(swatch.colorHex)}
          className={`h-8 w-8 rounded-full border-2 transition ${value === swatch.colorHex ? 'border-emerald-400 scale-110' : 'border-zinc-700 hover:border-zinc-500'}`}
          style={{ backgroundColor: swatch.colorHex }}
          title={swatch.nameAr}
        />
      ))}
      <label className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-zinc-700 bg-zinc-900 text-[10px] text-zinc-400 cursor-pointer">
        <input type="color" value={value || '#D4B896'} onChange={(e) => onChange(e.target.value)} className="absolute h-8 w-8 opacity-0 cursor-pointer" />
        +
      </label>
    </div>
  </div>
);

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectSettingsModal = ({ isOpen, onClose }: Props) => {
  const { projectSettings, updateProjectSettings } = useProjectStore();
  const { materials, hardwareItems } = useSettingsStore();
  const [localSettings, setLocalSettings] = useState<ProjectSettings>(projectSettings);

  if (!isOpen) return null;

  const handleChange = (key: keyof ProjectSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveOnlyNew = () => {
    updateProjectSettings(localSettings, false);
    onClose();
  };

  const handleSaveAndApplyExisting = () => {
    updateProjectSettings(localSettings, true);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-zinc-800 bg-zinc-900/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings2 className="text-emerald-400" />
            إعدادات المشروع الافتراضية
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-zinc-800">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
          
          {/* Base Units */}
          <section>
            <h3 className="text-sm font-bold text-emerald-400 mb-4 border-b border-emerald-500/20 pb-2">الوحدات السفلية (Base Units)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">الارتفاع الافتراضي (مم)</label>
                <input 
                  type="number" 
                  value={localSettings.defaultBaseHeightMm}
                  onChange={e => handleChange('defaultBaseHeightMm', Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-500/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">العمق الافتراضي (مم)</label>
                <input 
                  type="number" 
                  value={localSettings.defaultBaseDepthMm}
                  onChange={e => handleChange('defaultBaseDepthMm', Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>
          </section>

          {/* Wall Units */}
          <section>
            <h3 className="text-sm font-bold text-sky-400 mb-4 border-b border-sky-500/20 pb-2">الوحدات العلوية (Wall Units)</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">الارتفاع عن الأرض (مم)</label>
                <input 
                  type="number" 
                  value={localSettings.defaultWallElevationMm}
                  onChange={e => handleChange('defaultWallElevationMm', Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-sky-500/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">الارتفاع الافتراضي (مم)</label>
                <input 
                  type="number" 
                  value={localSettings.defaultWallHeightMm}
                  onChange={e => handleChange('defaultWallHeightMm', Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-sky-500/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">العمق الافتراضي (مم)</label>
                <input 
                  type="number" 
                  value={localSettings.defaultWallDepthMm}
                  onChange={e => handleChange('defaultWallDepthMm', Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-sky-500/50"
                />
              </div>
            </div>
          </section>

          {/* Loft Units */}
          <section>
            <h3 className="text-sm font-bold text-indigo-400 mb-4 border-b border-indigo-500/20 pb-2">وحدات المستوى الثاني (Loft Units)</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">الارتفاع عن الأرض (مم)</label>
                <input 
                  type="number" 
                  value={localSettings.defaultLoftElevationMm}
                  onChange={e => handleChange('defaultLoftElevationMm', Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-indigo-500/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">الارتفاع الافتراضي (مم)</label>
                <input 
                  type="number" 
                  value={localSettings.defaultLoftHeightMm}
                  onChange={e => handleChange('defaultLoftHeightMm', Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-indigo-500/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">العمق الافتراضي (مم)</label>
                <input 
                  type="number" 
                  value={localSettings.defaultLoftDepthMm}
                  onChange={e => handleChange('defaultLoftDepthMm', Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-indigo-500/50"
                />
              </div>
            </div>
          </section>

          {/* Materials & Colors */}
          <section>
            <h3 className="text-sm font-bold text-amber-400 mb-4 border-b border-amber-500/20 pb-2">الخامات والألوان</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">خامة البدن الافتراضية</label>
                <select 
                  value={localSettings.defaultMaterialId || ''}
                  onChange={e => handleChange('defaultMaterialId', e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-amber-500/50"
                >
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>{m.nameAr}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">خامة الأبواب الافتراضية</label>
                <select 
                  value={localSettings.defaultDoorMaterialId || ''}
                  onChange={e => handleChange('defaultDoorMaterialId', e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-amber-500/50"
                >
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>{m.nameAr}</option>
                  ))}
                </select>
              </div>

              {(() => {
                const bodyMaterial = materials.find(m => m.id === localSettings.defaultMaterialId);
                const bodyColors = bodyMaterial?.availableColors || [];
                const doorMaterial = materials.find(m => m.id === localSettings.defaultDoorMaterialId);
                const doorColors = doorMaterial?.availableColors || [];
                const bodySwatches = bodyColors.length > 0 ? bodyColors.map(c => ({ id: c.id, nameAr: c.nameAr, colorHex: c.colorHex })) : DEFAULT_COLOR_SWATCHES;
                const doorSwatches = doorColors.length > 0 ? doorColors.map(c => ({ id: c.id, nameAr: c.nameAr, colorHex: c.colorHex })) : DEFAULT_COLOR_SWATCHES;

                return (
                  <>
                    <ColorSelector label="لون الشاسيه (الوحدات السفلية)" value={localSettings.defaultBaseColor || ''} onChange={(value) => handleChange('defaultBaseColor', value)} swatches={bodySwatches} />
                    <ColorSelector label="لون الشاسيه (الوحدات العلوية)" value={localSettings.defaultWallColor || ''} onChange={(value) => handleChange('defaultWallColor', value)} swatches={bodySwatches} />
                    <ColorSelector label="لون الشاسيه (الوحدات الطولية)" value={localSettings.defaultTallColor || ''} onChange={(value) => handleChange('defaultTallColor', value)} swatches={bodySwatches} />
                    <ColorSelector label="لون الشاسيه (وحدات المستوى الثاني)" value={localSettings.defaultLoftColor || ''} onChange={(value) => handleChange('defaultLoftColor', value)} swatches={bodySwatches} />
                    <ColorSelector label="لون الباب (الوحدات السفلية)" value={localSettings.defaultBaseDoorColor || ''} onChange={(value) => handleChange('defaultBaseDoorColor', value)} swatches={doorSwatches} />
                    <ColorSelector label="لون الباب (الوحدات العلوية)" value={localSettings.defaultWallDoorColor || ''} onChange={(value) => handleChange('defaultWallDoorColor', value)} swatches={doorSwatches} />
                    <ColorSelector label="لون الباب (الوحدات الطولية)" value={localSettings.defaultTallDoorColor || ''} onChange={(value) => handleChange('defaultTallDoorColor', value)} swatches={doorSwatches} />
                    <ColorSelector label="لون الباب (وحدات المستوى الثاني)" value={localSettings.defaultLoftDoorColor || ''} onChange={(value) => handleChange('defaultLoftDoorColor', value)} swatches={doorSwatches} />
                  </>
                );
              })()}
            </div>
          </section>

          {/* Hardware & Accessories */}
          <section>
            <h3 className="text-sm font-bold text-rose-400 mb-4 border-b border-rose-500/20 pb-2">الإكسسوارات الافتراضية</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">المفصلات</label>
                <select 
                  value={localSettings.defaultHingeId || ''}
                  onChange={e => handleChange('defaultHingeId', e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-rose-500/50"
                >
                  <option value="none">بدون مفصلات</option>
                  {hardwareItems.filter(h => h.category === 'hinge').map(h => (
                    <option key={h.id} value={h.id}>{h.nameAr}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">المقابض</label>
                <select 
                  value={localSettings.defaultHandleId || ''}
                  onChange={e => handleChange('defaultHandleId', e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-rose-500/50"
                >
                  <option value="none">بدون مقابض</option>
                  {hardwareItems.filter(h => h.category === 'handle').map(h => (
                    <option key={h.id} value={h.id}>{h.nameAr}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">سكك الأدراج</label>
                <select 
                  value={localSettings.defaultDrawerRunnerId || ''}
                  onChange={e => handleChange('defaultDrawerRunnerId', e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-rose-500/50"
                >
                  {hardwareItems.filter(h => h.category === 'drawer_runner').map(h => (
                    <option key={h.id} value={h.id}>{h.nameAr}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <p className="text-xs text-emerald-400/90 bg-emerald-950/30 p-3 rounded-lg border border-emerald-900/50">
            ملاحظة: يمكنك اختيار تطبيق هذه الإعدادات على <strong>الوحدات الجديدة</strong> فقط، أو تحديث <strong>جميع الوحدات الحالية</strong> في المشروع لتتطابق مع هذه المقاسات والخامات.
          </p>

        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex flex-col sm:flex-row justify-between items-center gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors text-sm font-bold w-full sm:w-auto"
          >
            إلغاء
          </button>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button 
              onClick={handleSaveOnlyNew}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-colors text-sm font-bold flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Save size={16} />
              تطبيق على الجديد فقط
            </button>
            <button 
              onClick={handleSaveAndApplyExisting}
              className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors text-sm font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Save size={16} />
              حفظ وتطبيق على الجميع
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
