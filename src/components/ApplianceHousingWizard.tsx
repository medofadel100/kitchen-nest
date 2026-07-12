import React, { useState } from 'react';

interface ApplianceHousingWizardProps {
  applianceName: string;
  onConfirm: (config: {
    clearanceMm: { leftMm: number; rightMm: number; topMm: number; backMm: number };
    removeDoorAtApplianceZone: boolean;
    hasBaseUnderneath: boolean;
  }) => void;
  onCancel: () => void;
}

export const ApplianceHousingWizard: React.FC<ApplianceHousingWizardProps> = ({
  applianceName,
  onConfirm,
  onCancel,
}) => {
  const [leftMm, setLeftMm] = useState(5);
  const [rightMm, setRightMm] = useState(5);
  const [topMm, setTopMm] = useState(50); // تهوية التلاجة تحتاج مسافة أكبر
  const [backMm, setBackMm] = useState(5);
  const [removeDoor, setRemoveDoor] = useState(true);
  const [hasBase, setHasBase] = useState(false);
  const [step, setStep] = useState(1);

  const handleConfirm = () => {
    onConfirm({
      clearanceMm: { leftMm, rightMm, topMm, backMm },
      removeDoorAtApplianceZone: removeDoor,
      hasBaseUnderneath: hasBase,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">إعدادات إحاطة الجهاز</h3>
            <p className="text-sm text-zinc-400">
              تحويل الوحدة لإحاطة: <span className="text-sky-400 font-medium">{applianceName}</span>
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-amber-600 text-white' : 'bg-zinc-700 text-zinc-500'}`}>1</div>
          <div className={`h-0.5 flex-1 ${step >= 2 ? 'bg-amber-600' : 'bg-zinc-700'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-amber-600 text-white' : 'bg-zinc-700 text-zinc-500'}`}>2</div>
          <div className={`h-0.5 flex-1 ${step >= 3 ? 'bg-amber-600' : 'bg-zinc-700'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 3 ? 'bg-amber-600 text-white' : 'bg-zinc-700 text-zinc-500'}`}>3</div>
        </div>

        {step === 1 && (
          <div>
            <h4 className="text-white font-medium mb-4">مسافات الخلوص (مم)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">من الشمال</label>
                <input type="number" value={leftMm} onChange={e => setLeftMm(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white font-mono text-center focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">من اليمين</label>
                <input type="number" value={rightMm} onChange={e => setRightMm(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white font-mono text-center focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">من فوق</label>
                <input type="number" value={topMm} onChange={e => setTopMm(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white font-mono text-center focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">من الضهر</label>
                <input type="number" value={backMm} onChange={e => setBackMm(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white font-mono text-center focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
            </div>
            <div className="mt-4 bg-zinc-800/50 rounded-xl p-3 text-xs text-zinc-500">
              <p>💡 مسافة التهوية من فوق للتلاجة/الفرن عادة 50-100مم. المسافات الجانبية عادة 5-10مم.</p>
            </div>
            <button onClick={() => setStep(2)} className="mt-6 w-full px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-xl transition-colors">
              التالي
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h4 className="text-white font-medium mb-4">إعدادات الباب والقاعدة</h4>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl cursor-pointer hover:bg-zinc-800 transition-colors">
                <div>
                  <div className="text-white font-medium">إلغاء باب الوحدة في منطقة الجهاز</div>
                  <div className="text-xs text-zinc-500">الجهاز له بابه الأصلي، مش محتاج باب وهمي قدامه</div>
                </div>
                <input type="checkbox" checked={removeDoor} onChange={e => setRemoveDoor(e.target.checked)}
                  className="w-5 h-5 rounded border-zinc-600 text-amber-600 focus:ring-amber-500" />
              </label>

              <label className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl cursor-pointer hover:bg-zinc-800 transition-colors">
                <div>
                  <div className="text-white font-medium">قعدة (كيك بورد) تحت الجهاز</div>
                  <div className="text-xs text-zinc-500">فيه قاعدة خشب تحت الجهاز ولا قاعد على الأرض مباشرة؟</div>
                </div>
                <input type="checkbox" checked={hasBase} onChange={e => setHasBase(e.target.checked)}
                  className="w-5 h-5 rounded border-zinc-600 text-amber-600 focus:ring-amber-500" />
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)} className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl transition-colors">
                السابق
              </button>
              <button onClick={() => setStep(3)} className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-xl transition-colors">
                التالي
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h4 className="text-white font-medium mb-4">مراجعة الإعدادات</h4>
            
            <div className="bg-zinc-800/50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">الخلوص شمال:</span>
                <span className="text-white font-mono">{leftMm} مم</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">الخلوص يمين:</span>
                <span className="text-white font-mono">{rightMm} مم</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">الخلوص فوق:</span>
                <span className="text-white font-mono">{topMm} مم</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">الخلوص ضهر:</span>
                <span className="text-white font-mono">{backMm} مم</span>
              </div>
              <div className="border-t border-zinc-700 my-2" />
              <div className="flex justify-between">
                <span className="text-zinc-400">إلغاء باب الجهاز:</span>
                <span className={removeDoor ? 'text-emerald-400' : 'text-red-400'}>{removeDoor ? 'نعم' : 'لا'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">قعدة تحت الجهاز:</span>
                <span className={hasBase ? 'text-emerald-400' : 'text-red-400'}>{hasBase ? 'نعم' : 'لا'}</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(2)} className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl transition-colors">
                السابق
              </button>
              <button onClick={handleConfirm} className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-xl transition-colors">
                تأكيد
              </button>
            </div>
          </div>
        )}

        {/* Cancel button always available */}
        <button onClick={onCancel} className="mt-3 w-full text-center text-sm text-zinc-500 hover:text-zinc-400 transition-colors">
          إلغاء
        </button>
      </div>
    </div>
  );
};