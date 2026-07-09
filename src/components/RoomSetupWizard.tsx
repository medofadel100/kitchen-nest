"use client";

import React, { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { motion } from 'framer-motion';
import { Ruler, DoorOpen, LayoutGrid, CheckCircle2 } from 'lucide-react';
import { convertMmToDisplayUnit, convertDisplayUnitToMm } from '@/utils/measurements';

export const RoomSetupWizard = () => {
  const { setupRoomDimensions, completeRoomSetup, displayUnit } = useProjectStore();
  const [step, setStep] = useState(1);
  const [width, setWidth] = useState(3000);
  const [length, setLength] = useState(3000);
  const [height, setHeight] = useState(2800);

  const handleNext = () => {
    if (step === 1) {
      setupRoomDimensions(width, length, height);
      setStep(2);
    } else if (step === 2) {
      completeRoomSetup();
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-zinc-950 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-8 border-b border-zinc-800/80">
          <h2 className="text-2xl font-bold text-white mb-2">تأسيس الغرفة</h2>
          <p className="text-zinc-400 text-sm">أدخل مقاسات الفراغ المعماري قبل البدء في تصميم المطبخ.</p>
          
          <div className="flex gap-4 mt-8">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-emerald-400' : 'text-zinc-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 1 ? 'bg-emerald-500/20 border border-emerald-500/50' : 'bg-zinc-800'}`}>1</div>
              <span className="font-semibold text-sm">المقاسات</span>
            </div>
            <div className="flex-1 h-px bg-zinc-800 my-auto"></div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-emerald-400' : 'text-zinc-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 2 ? 'bg-emerald-500/20 border border-emerald-500/50' : 'bg-zinc-800'}`}>2</div>
              <span className="font-semibold text-sm">الفتحات والتأسيسات</span>
            </div>
          </div>
        </div>

        <div className="p-8">
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">عرض الغرفة ({displayUnit})</label>
                  <div className="relative">
                    <Ruler className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                    <input 
                      type="number" 
                      value={convertMmToDisplayUnit(width, displayUnit)} 
                      onChange={e => setWidth(convertDisplayUnitToMm(Number(e.target.value), displayUnit))}
                      className="w-full bg-zinc-950/50 border border-zinc-800 text-white rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">طول الغرفة ({displayUnit})</label>
                  <div className="relative">
                    <Ruler className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                    <input 
                      type="number" 
                      value={convertMmToDisplayUnit(length, displayUnit)} 
                      onChange={e => setLength(convertDisplayUnitToMm(Number(e.target.value), displayUnit))}
                      className="w-full bg-zinc-950/50 border border-zinc-800 text-white rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">الارتفاع ({displayUnit})</label>
                  <div className="relative">
                    <Ruler className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                    <input 
                      type="number" 
                      value={convertMmToDisplayUnit(height, displayUnit)} 
                      onChange={e => setHeight(convertDisplayUnitToMm(Number(e.target.value), displayUnit))}
                      className="w-full bg-zinc-950/50 border border-zinc-800 text-white rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="p-6 bg-zinc-950/50 border border-zinc-800 rounded-2xl text-center border-dashed">
                <DoorOpen size={48} className="mx-auto text-zinc-600 mb-4" />
                <h3 className="text-zinc-300 font-semibold mb-2">أضف الأبواب والشبابيك</h3>
                <p className="text-zinc-500 text-sm mb-4">يمكنك إضافة الفتحات لاحقاً من داخل مساحة العمل للحصول على دقة أعلى.</p>
              </div>
            </motion.div>
          )}
        </div>

        <div className="p-6 border-t border-zinc-800/80 bg-zinc-900/50 flex justify-end">
          <button 
            onClick={handleNext}
            className="flex items-center gap-2 bg-emerald-500 text-zinc-950 px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
          >
            {step === 1 ? 'التالي' : 'ابدأ التصميم'}
            <CheckCircle2 size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
