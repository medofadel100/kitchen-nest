import React, { useState } from 'react';
import { StructuralObstacle } from '@/types';

interface ObstacleClearanceDialogProps {
  obstacle: StructuralObstacle;
  onConfirm: (clearanceMm: number) => void;
  onCancel: () => void;
}

export const ObstacleClearanceDialog: React.FC<ObstacleClearanceDialogProps> = ({
  obstacle,
  onConfirm,
  onCancel,
}) => {
  const [clearance, setClearance] = useState(5); // افتراضي 5مم

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">تقاطع مع عائق إنشائي</h3>
            <p className="text-sm text-zinc-400">الوحدة بتتقاطع مع عمود إنشائي</p>
          </div>
        </div>

        <div className="bg-zinc-800/50 rounded-xl p-4 mb-4">
          <div className="text-sm text-zinc-400 mb-2">معلومات العمود:</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-zinc-500">العرض:</div>
            <div className="text-zinc-300 font-mono">{obstacle.widthMm} مم</div>
            <div className="text-zinc-500">العمق:</div>
            <div className="text-zinc-300 font-mono">{obstacle.depthMm} مم</div>
            <div className="text-zinc-500">الموقع (X):</div>
            <div className="text-zinc-300 font-mono">{obstacle.xMm} مم</div>
            <div className="text-zinc-500">الموقع (Y):</div>
            <div className="text-zinc-300 font-mono">{obstacle.yMm} مم</div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            عاوز تسيب مسافة (خلوص) قد ايه حوالين العمود؟
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={clearance}
              onChange={(e) => setClearance(Math.max(0, Number(e.target.value)))}
              min={0}
              max={100}
              className="w-24 px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white font-mono text-center focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <span className="text-zinc-400">مم</span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">مسافة الخلوص الافتراضية 5مم (تزيد حسب الحاجة)</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => onConfirm(clearance)}
            className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-xl transition-colors"
          >
            تطبيق
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};