import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { HardwareItem } from '@/types';

interface HardwareModalProps {
  isOpen: boolean;
  onClose: () => void;
  hardware?: HardwareItem | null;
  onSave: (data: Omit<HardwareItem, 'id'>) => void;
}

export const HardwareModal = ({ isOpen, onClose, hardware, onSave }: HardwareModalProps) => {
  const [formData, setFormData] = useState<Partial<HardwareItem>>({
    nameAr: '',
    category: 'hinge',
    price: 0,
    brand: '',
  });

  useEffect(() => {
    if (hardware && isOpen) {
      setFormData(hardware);
    } else if (isOpen) {
      setFormData({
        nameAr: '',
        category: 'hinge',
        price: 0,
        brand: '',
      });
    }
  }, [hardware, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameAr) return;
    
    onSave(formData as Omit<HardwareItem, 'id'>);
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
          className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
        >
          <div className="flex justify-between items-center p-6 border-b border-zinc-800 bg-zinc-900/50">
            <h2 className="text-xl font-bold text-white">
              {hardware ? 'تعديل الإكسسوار' : 'إضافة إكسسوار جديد'}
            </h2>
            <button type="button" onClick={onClose} className="p-2 text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 flex-1">
            <form id="hardware-form" onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5">اسم الإكسسوار</label>
                  <input 
                    required
                    type="text" 
                    value={formData.nameAr}
                    onChange={e => setFormData({...formData, nameAr: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="مثال: مفصلة سوفت كلوز"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1.5">الماركة (Brand)</label>
                    <input 
                      type="text" 
                      value={formData.brand || ''}
                      onChange={e => setFormData({...formData, brand: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      placeholder="مثال: Blum"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1.5">التصنيف</label>
                    <select 
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value as HardwareItem['category']})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    >
                      <option value="hinge">مفصلات (Hinges)</option>
                      <option value="drawer_runner">مجرى أدراج (Runners)</option>
                      <option value="handle">مقابض (Handles)</option>
                      <option value="leg">أرجل (Legs)</option>
                      <option value="lighting">إضاءة (Lighting)</option>
                      <option value="other">أخرى</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 pt-4 border-t border-zinc-800">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1.5">السعر</label>
                    <input 
                      required
                      type="number" 
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors text-left font-mono"
                    />
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
              form="hardware-form"
              className="flex items-center gap-2 bg-emerald-500 text-zinc-950 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-400 transition-colors shadow-lg"
            >
              <Save size={18} />
              حفظ الإكسسوار
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
