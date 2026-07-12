"use client";

import React, { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { convertMmToDisplayUnit, convertDisplayUnitToMm } from '@/utils/measurements';
import { X, Ruler } from 'lucide-react';

interface QuickRectangleModalProps {
  onClose: () => void;
}

export const QuickRectangleModal = ({ onClose }: QuickRectangleModalProps) => {
  const { createQuickRectangleRoom, displayUnit } = useProjectStore();
  const [width, setWidth] = useState(4000);
  const [length, setLength] = useState(3000);
  const [height, setHeight] = useState(2800);

  const handleCreate = () => {
    if (width <= 0 || length <= 0 || height <= 0) return;
    createQuickRectangleRoom(width, length, height);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h3 className="text-lg font-bold text-white">مستطيل سريع</h3>
          <button onClick={onClose} className="p-1 text-zinc-500 hover:text-white rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-zinc-400">أدخل أبعاد الغرفة المستطيلة مباشرة بدون رسم يدوي.</p>

          {[
            { label: 'العرض', value: width, set: setWidth },
            { label: 'الطول', value: length, set: setLength },
            { label: 'ارتفاع الغرفة (إجباري)', value: height, set: setHeight, required: true },
          ].map((field) => (
            <div key={field.label}>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                {field.label} ({displayUnit})
                {field.required && <span className="text-red-400 mr-1">*</span>}
              </label>
              <div className="relative">
                <Ruler className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                <input
                  type="number"
                  min={100}
                  value={convertMmToDisplayUnit(field.value, displayUnit)}
                  onChange={(e) => field.set(convertDisplayUnitToMm(Number(e.target.value), displayUnit))}
                  className="w-full bg-zinc-950/50 border border-zinc-800 text-white rounded-xl py-2.5 pl-3 pr-10 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="p-5 border-t border-zinc-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors text-sm font-bold"
          >
            إلغاء
          </button>
          <button
            onClick={handleCreate}
            disabled={width <= 0 || length <= 0 || height <= 0}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-zinc-950 font-bold hover:bg-emerald-400 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            إنشاء الغرفة
          </button>
        </div>
      </div>
    </div>
  );
};
