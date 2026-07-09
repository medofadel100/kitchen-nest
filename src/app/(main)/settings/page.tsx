"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Layers, Box, Wrench, Edit3, Trash2, Plus, AlertTriangle } from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';
import { MaterialModal } from '@/components/settings/MaterialModal';
import { HardwareModal } from '@/components/settings/HardwareModal';
import { Material, HardwareItem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsPage() {
  const { 
    materials, updateMaterial, deleteMaterial, addMaterial,
    hardwareItems, updateHardwareItem, deleteHardwareItem, addHardwareItem,
    workshopSettings, updateWorkshopSettings,
    saveToCloud, seedDefaultsToCloud
  } = useSettingsStore();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'materials' | 'hardware' | 'general'>('materials');

  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);
  const [selectedHardware, setSelectedHardware] = useState<HardwareItem | null>(null);

  return (
    <div className="p-10 max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="text-4xl font-black text-white tracking-tight mb-2">إعدادات الورشة</h1>
        <p className="text-zinc-400 text-sm">إدارة الخامات، الإكسسوارات، وأسعار التكلفة لحساب دقيق للتسعير.</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-zinc-900/50 p-1.5 rounded-2xl w-fit border border-zinc-800/80">
        <button 
          onClick={() => setActiveTab('materials')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all text-sm ${activeTab === 'materials' ? 'bg-emerald-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'}`}
        >
          <Layers size={18} />
          <span>الخامات والألواح</span>
        </button>
        <button 
          onClick={() => setActiveTab('hardware')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all text-sm ${activeTab === 'hardware' ? 'bg-emerald-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'}`}
        >
          <Wrench size={18} />
          <span>الإكسسوارات</span>
        </button>
        <button 
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all text-sm ${activeTab === 'general' ? 'bg-emerald-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'}`}
        >
          <Settings size={18} />
          <span>إعدادات عامة</span>
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 rounded-3xl shadow-2xl overflow-hidden min-h-[500px]"
      >
        {activeTab === 'materials' && (
          <div>
            <div className="p-6 border-b border-zinc-800/80 bg-zinc-900/80 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">قائمة الخامات (Materials)</h2>
              <button 
                onClick={() => { setSelectedMaterial(null); setIsMaterialModalOpen(true); }}
                className="flex items-center gap-2 bg-emerald-500 text-zinc-950 px-4 py-2 rounded-xl font-bold hover:bg-emerald-400 transition-colors shadow-lg text-sm"
              >
                <Plus size={16} />
                إضافة خامة جديدة
              </button>
            </div>
            
            <div className="overflow-x-auto p-6">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider">
                    <th className="pb-4 font-semibold">اسم الخامة</th>
                    <th className="pb-4 font-semibold">النوع</th>
                    <th className="pb-4 font-semibold">مقاس اللوح (mm)</th>
                    <th className="pb-4 font-semibold">سعر اللوح (جنيه)</th>
                    <th className="pb-4 font-semibold text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {materials.map((mat, idx) => (
                    <motion.tr 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={mat.id} 
                      className="hover:bg-zinc-800/30 transition-colors group"
                    >
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center border border-zinc-700">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: mat.colorHex || '#ccc' }}></div>
                          </div>
                          <span className="font-bold text-zinc-200 text-sm">{mat.nameAr}</span>
                          {mat.isPricePlaceholder && (
                            <div className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-500/20" title="هذا السعر افتراضي للتجربة، يرجى تعديله بالسعر الحقيقي للورشة">
                              <AlertTriangle size={12} />
                              سعر افتراضي
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 text-zinc-400 text-sm font-mono uppercase">{mat.category}</td>
                      <td className="py-4 text-zinc-300 text-sm font-mono">
                        {mat.standardSheet.widthMm} <span className="text-zinc-600">x</span> {mat.standardSheet.heightMm} <span className="text-zinc-500 text-xs">(سمك {mat.standardSheet.thicknessMm})</span>
                      </td>
                      <td className="py-4 font-bold text-emerald-400">
                        {mat.pricePerSheet.toLocaleString()} <span className="text-xs text-zinc-500">ج.م</span>
                      </td>
                      <td className="py-4 text-center">
                        <div className="flex items-center justify-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => { setSelectedMaterial(mat); setIsMaterialModalOpen(true); }}
                            className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 flex items-center justify-center transition-colors"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button 
                            onClick={async () => {
                              deleteMaterial(mat.id);
                              if (user) await saveToCloud(user.uid);
                            }}
                            className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:text-white hover:bg-red-500 flex items-center justify-center transition-colors border border-red-500/20 hover:border-transparent"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'hardware' && (
          <div>
            <div className="p-6 border-b border-zinc-800/80 bg-zinc-900/80 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">قائمة الإكسسوارات والمفصلات (Hardware)</h2>
              <button 
                onClick={() => { setSelectedHardware(null); setIsHardwareModalOpen(true); }}
                className="flex items-center gap-2 bg-emerald-500 text-zinc-950 px-4 py-2 rounded-xl font-bold hover:bg-emerald-400 transition-colors shadow-lg text-sm"
              >
                <Plus size={16} />
                إضافة إكسسوار جديد
              </button>
            </div>
            
            <div className="overflow-x-auto p-6">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider">
                    <th className="pb-4 font-semibold">اسم القطعة</th>
                    <th className="pb-4 font-semibold">الماركة / الشركة</th>
                    <th className="pb-4 font-semibold">التصنيف</th>
                    <th className="pb-4 font-semibold">سعر القطعة (جنيه)</th>
                    <th className="pb-4 font-semibold text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {hardwareItems.map((item, idx) => (
                    <motion.tr 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={item.id} 
                      className="hover:bg-zinc-800/30 transition-colors group"
                    >
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center border border-zinc-700">
                            {item.category === 'hinge' && <Wrench size={16} className="text-emerald-400" />}
                            {item.category === 'handle' && <Box size={16} className="text-amber-400" />}
                            {item.category === 'drawer_runner' && <Layers size={16} className="text-blue-400" />}
                            {item.category === 'lighting' && <AlertTriangle size={16} className="text-yellow-400" />}
                          </div>
                          <span className="font-bold text-zinc-200 text-sm">{item.nameAr}</span>
                          {item.isPricePlaceholder && (
                            <div className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-500/20" title="هذا السعر افتراضي للتجربة، يرجى تعديله بالسعر الحقيقي للورشة">
                              <AlertTriangle size={12} />
                              سعر افتراضي
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 text-zinc-300 text-sm font-semibold">{item.brand}</td>
                      <td className="py-4 text-zinc-400 text-sm font-mono uppercase">
                        {item.category === 'hinge' ? 'مفصلات' : 
                         item.category === 'drawer_runner' ? 'سكك أدراج' : 
                         item.category === 'handle' ? 'مقابض' : 
                         item.category === 'lighting' ? 'إضاءة' : item.category}
                      </td>
                      <td className="py-4 font-bold text-emerald-400">
                        {item.price.toLocaleString()} <span className="text-xs text-zinc-500">ج.م</span>
                      </td>
                      <td className="py-4 text-center">
                        <div className="flex items-center justify-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => { setSelectedHardware(item); setIsHardwareModalOpen(true); }}
                            className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 flex items-center justify-center transition-colors"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button 
                            onClick={async () => {
                              deleteHardwareItem(item.id);
                              if (user) await saveToCloud(user.uid);
                            }}
                            className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:text-white hover:bg-red-500 flex items-center justify-center transition-colors border border-red-500/20 hover:border-transparent"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'general' && (
          <div className="p-8 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-white mb-6 border-b border-zinc-800 pb-4 flex items-center gap-2">
              <Settings className="text-zinc-400" size={20} />
              الإعدادات العامة للورشة
            </h2>
            
            <div className="space-y-6">
              {/* Workshop Name */}
              <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/50">
                <label className="block text-zinc-300 text-sm font-semibold mb-2">اسم الورشة / الشركة</label>
                <input 
                  type="text" 
                  value={workshopSettings.name}
                  onChange={(e) => updateWorkshopSettings({ name: e.target.value })}
                  placeholder="مثال: ورشة الإبداع للأثاث"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                />
                <p className="text-zinc-500 text-xs mt-2">سيظهر هذا الاسم في عروض الأسعار والتقارير المطبوعة.</p>
              </div>

              {/* Default Profit Margin */}
              <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/50">
                <label className="block text-zinc-300 text-sm font-semibold mb-2">نسبة الربح الافتراضية (%)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={workshopSettings.defaultProfitMarginPercent}
                    onChange={(e) => updateWorkshopSettings({ defaultProfitMarginPercent: Number(e.target.value) })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-left"
                    dir="ltr"
                  />
                  <span className="absolute right-4 top-3.5 text-zinc-500">%</span>
                </div>
                <p className="text-zinc-500 text-xs mt-2">تُطبق هذه النسبة كافتراضي عند إنشاء مشروع جديد (يمكن تعديلها لكل مشروع على حدة).</p>
              </div>

              {/* Currency */}
              <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/50">
                <label className="block text-zinc-300 text-sm font-semibold mb-2">العملة الافتراضية</label>
                <select 
                  value={workshopSettings.currency}
                  onChange={(e) => updateWorkshopSettings({ currency: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                >
                  <option value="ج.م">جنيه مصري (ج.م)</option>
                  <option value="SAR">ريال سعودي (SAR)</option>
                  <option value="AED">درهم إماراتي (AED)</option>
                  <option value="$">دولار أمريكي ($)</option>
                </select>
                <p className="text-zinc-500 text-xs mt-2">تُستخدم لعرض كافة الأسعار في النظام.</p>
              </div>
              
              <div className="pt-4 flex justify-end gap-3 border-t border-zinc-800/50 mt-6">
                <button 
                  onClick={async () => {
                    if (user && confirm('هل أنت متأكد؟ سيتم استبدال كل الخامات والإكسسوارات بالقيم الافتراضية للنظام!')) {
                      try {
                        await seedDefaultsToCloud(user.uid);
                        alert('تم رفع الخامات الافتراضية بنجاح!');
                      } catch(e) {
                        alert('حدث خطأ أثناء الرفع!');
                      }
                    }
                  }}
                  className="bg-zinc-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-zinc-700 transition-colors shadow-lg"
                >
                  استعادة الخامات الافتراضية (Seed)
                </button>
                <button 
                  onClick={async () => {
                    if (user) {
                      await saveToCloud(user.uid);
                      alert('تم مزامنة الإعدادات مع السحابة بنجاح!');
                    }
                  }}
                  className="bg-emerald-500 text-emerald-950 px-6 py-3 rounded-xl font-bold hover:bg-emerald-400 transition-colors shadow-lg"
                >
                  حفظ ومزامنة للإعدادات
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <MaterialModal
        isOpen={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        material={selectedMaterial}
        onSave={async (data) => {
          if (selectedMaterial) updateMaterial(selectedMaterial.id, data);
          else addMaterial(data);
          if (user) await saveToCloud(user.uid);
        }}
      />

      <HardwareModal
        isOpen={isHardwareModalOpen}
        onClose={() => setIsHardwareModalOpen(false)}
        hardware={selectedHardware}
        onSave={async (data) => {
          if (selectedHardware) updateHardwareItem(selectedHardware.id, data);
          else addHardwareItem(data);
          if (user) await saveToCloud(user.uid);
        }}
      />

      <HardwareModal
        isOpen={isHardwareModalOpen}
        onClose={() => setIsHardwareModalOpen(false)}
        hardware={selectedHardware}
        onSave={(data) => {
          if (selectedHardware) updateHardwareItem(selectedHardware.id, data);
          else addHardwareItem(data);
        }}
      />
    </div>
  );
}
