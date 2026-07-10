import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { Material, MaterialCategory, BoardType, MaterialColor } from '@/types';

interface MaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  material?: Material | null;
  onSave: (data: Omit<Material, 'id' | 'updatedAt'>) => void;
}

export const MaterialModal = ({ isOpen, onClose, material, onSave }: MaterialModalProps) => {
  const [formData, setFormData] = useState<Partial<Material>>({
    nameAr: '',
    category: 'mdf',
    boardType: 'mdf',
    standardSheet: { widthMm: 1220, heightMm: 2440, thicknessMm: 18 },
    pricePerSheet: 0,
    edgeBandingPricePerMeter: 0,
    wastePercentDefault: 10,
    hasGrainDirection: false,
    isPricePlaceholder: false,
    colorHex: '#cccccc',
    availableColors: [],
    supplierName: '',
  });

  useEffect(() => {
    if (material && isOpen) {
      setFormData(material);
    } else if (isOpen) {
      setFormData({
        nameAr: '',
        category: 'mdf',
        boardType: 'mdf',
        standardSheet: { widthMm: 1220, heightMm: 2440, thicknessMm: 18 },
        pricePerSheet: 0,
        edgeBandingPricePerMeter: 0,
        wastePercentDefault: 10,
        hasGrainDirection: false,
        isPricePlaceholder: false, // Explicitly false for new user-added materials
        colorHex: '#cccccc',
        availableColors: [],
        supplierName: '',
      });
    }
  }, [material, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameAr) return;
    
    // When saving from UI, remove placeholder warning
    const finalData = { ...formData, isPricePlaceholder: false } as Omit<Material, 'id' | 'updatedAt'>;
    onSave(finalData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="flex justify-between items-center p-6 border-b border-zinc-800 bg-zinc-900/50">
            <h2 className="text-xl font-bold text-white">
              {material ? 'تعديل الخامة' : 'إضافة خامة جديدة'}
            </h2>
            <button type="button" onClick={onClose} className="p-2 text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
            {material?.isPricePlaceholder && (
              <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
                <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-amber-500 font-bold text-sm">سعر افتراضي</p>
                  <p className="text-amber-400/80 text-xs mt-1">هذه الخامة تستخدم سعراً افتراضياً. يرجى إدخال سعر موردك الحقيقي وسيتم إزالة هذا التنبيه.</p>
                </div>
              </div>
            )}

            <form id="material-form" onSubmit={handleSubmit} className="space-y-6">
              
              {/* القسم الأساسي */}
              <div className="space-y-4">
                <h3 className="text-emerald-500 font-bold text-sm border-b border-zinc-800 pb-2">البيانات الأساسية</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1.5">اسم الخامة</label>
                    <input 
                      required
                      type="text" 
                      value={formData.nameAr}
                      onChange={e => setFormData({...formData, nameAr: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      placeholder="مثال: MDF بولاك مقاوم رطوبة"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1.5">اسم المورد (اختياري)</label>
                    <input 
                      type="text" 
                      value={formData.supplierName || ''}
                      onChange={e => setFormData({...formData, supplierName: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      placeholder="اسم المورد أو التاجر"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1.5">التصنيف</label>
                    <select 
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value as MaterialCategory})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    >
                      <option value="mdf">MDF</option>
                      <option value="hpl">HPL</option>
                      <option value="acrylic">أكريليك (Acrylic)</option>
                      <option value="melamine">ميلامين (Melamine)</option>
                      <option value="plywood">كونتر (Plywood)</option>
                      <option value="solid_wood">خشب طبيعي (Solid Wood)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1.5">لون العرض (للرسم 3D)</label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={formData.colorHex || '#cccccc'}
                        onChange={e => setFormData({...formData, colorHex: e.target.value})}
                        className="h-10 w-12 rounded cursor-pointer bg-zinc-950 border border-zinc-800 p-1"
                      />
                      <input 
                        type="text" 
                        value={formData.colorHex || '#cccccc'}
                        onChange={e => setFormData({...formData, colorHex: e.target.value})}
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-emerald-500 font-bold text-sm border-b border-zinc-800 pb-2">الألوان المتاحة لنفس الخامة</h3>
                <div className="space-y-3">
                  <p className="text-xs text-zinc-500">أضف أكثر من لون لنفس الخامة حتى تظهر في اختيار الألوان داخل المشروع.</p>
                  {(formData.availableColors || []).map((color, index) => (
                    <div key={color.id || index} className="flex gap-2 items-center rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                      <input
                        type="text"
                        value={color.nameAr}
                        onChange={(e) => {
                          const nextColors = [...(formData.availableColors || [])];
                          nextColors[index] = { ...nextColors[index], nameAr: e.target.value };
                          setFormData({ ...formData, availableColors: nextColors });
                        }}
                        placeholder="اسم اللون"
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                      <input
                        type="color"
                        value={color.colorHex}
                        onChange={(e) => {
                          const nextColors = [...(formData.availableColors || [])];
                          nextColors[index] = { ...nextColors[index], colorHex: e.target.value };
                          setFormData({ ...formData, availableColors: nextColors });
                        }}
                        className="h-10 w-12 rounded cursor-pointer bg-zinc-950 border border-zinc-800 p-1"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const nextColors = (formData.availableColors || []).filter((_, i) => i !== index);
                          setFormData({ ...formData, availableColors: nextColors });
                        }}
                        className="p-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-rose-500/40 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const nextColors = [...(formData.availableColors || []), { id: `color_${Date.now()}`, nameAr: `لون ${((formData.availableColors || []).length + 1)}`, colorHex: '#D4B896' } as MaterialColor];
                      setFormData({ ...formData, availableColors: nextColors });
                    }}
                    className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <Plus size={16} />
                    إضافة لون جديد
                  </button>
                </div>
              </div>

              {/* قسم الأبعاد والمقاسات */}
              <div className="space-y-4">
                <h3 className="text-emerald-500 font-bold text-sm border-b border-zinc-800 pb-2">أبعاد اللوح القياسية (ملم)</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1.5">طول اللوح (Height)</label>
                    <input 
                      required
                      type="number" 
                      value={formData.standardSheet?.heightMm}
                      onChange={e => setFormData({...formData, standardSheet: { ...formData.standardSheet!, heightMm: Number(e.target.value) }})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors text-left"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1.5">عرض اللوح (Width)</label>
                    <input 
                      required
                      type="number" 
                      value={formData.standardSheet?.widthMm}
                      onChange={e => setFormData({...formData, standardSheet: { ...formData.standardSheet!, widthMm: Number(e.target.value) }})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors text-left"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1.5">التخانة (Thickness)</label>
                    <input 
                      required
                      type="number" 
                      value={formData.standardSheet?.thicknessMm}
                      onChange={e => setFormData({...formData, standardSheet: { ...formData.standardSheet!, thicknessMm: Number(e.target.value) }})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors text-left"
                    />
                  </div>
                </div>
              </div>

              {/* قسم التكاليف */}
              <div className="space-y-4">
                <h3 className="text-emerald-500 font-bold text-sm border-b border-zinc-800 pb-2">التكلفة والخصائص</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1.5">سعر اللوح الكامل (جنيه)</label>
                    <input 
                      required
                      type="number" 
                      value={formData.pricePerSheet}
                      onChange={e => setFormData({...formData, pricePerSheet: Number(e.target.value)})}
                      className="w-full bg-zinc-950 border border-emerald-500/30 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors text-left font-mono text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1.5">سعر شريط الحرف (للمتر)</label>
                    <input 
                      type="number" 
                      value={formData.edgeBandingPricePerMeter}
                      onChange={e => setFormData({...formData, edgeBandingPricePerMeter: Number(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors text-left"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1.5">نسبة الهالك المتوقعة (%)</label>
                    <input 
                      required
                      type="number" 
                      value={formData.wastePercentDefault}
                      onChange={e => setFormData({...formData, wastePercentDefault: Number(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors text-left"
                    />
                  </div>
                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={formData.hasGrainDirection}
                          onChange={e => setFormData({...formData, hasGrainDirection: e.target.checked})}
                          className="peer appearance-none w-6 h-6 border-2 border-zinc-700 rounded-lg checked:bg-emerald-500 checked:border-emerald-500 transition-colors cursor-pointer"
                        />
                        <svg className="absolute w-4 h-4 text-zinc-950 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <span className="block text-sm font-bold text-zinc-200 group-hover:text-emerald-400 transition-colors">لها اتجاه ثمرة (العرق)</span>
                        <span className="block text-xs text-zinc-500">مهم جداً في تقطيع الأبواب والأدراج لضبط الشكل</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

            </form>
          </div>

          <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors text-sm"
            >
              إلغاء
            </button>
            <button 
              type="submit"
              form="material-form"
              className="flex items-center gap-2 bg-emerald-500 text-zinc-950 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-400 transition-colors shadow-lg"
            >
              <Save size={18} />
              حفظ الخامة
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
