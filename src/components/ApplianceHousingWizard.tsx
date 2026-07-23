import React, { useState, useMemo } from 'react';
import { useProjectStore } from '@/store/projectStore';

const KNOWN_APPLIANCES = [
  { id: 'fridge', label: 'ثلاجة', defaultW: 600, defaultD: 600, defaultH: 1700 },
  { id: 'freezer', label: 'فريزر', defaultW: 600, defaultD: 600, defaultH: 1700 },
  { id: 'washing_machine', label: 'غسالة ملابس', defaultW: 600, defaultD: 600, defaultH: 850 },
  { id: 'dishwasher', label: 'غسالة أطباق', defaultW: 600, defaultD: 600, defaultH: 850 },
  { id: 'dryer', label: 'مجفف', defaultW: 600, defaultD: 600, defaultH: 850 },
  { id: 'oven', label: 'فرن', defaultW: 600, defaultD: 600, defaultH: 900 },
  { id: 'electric_oven', label: 'فرن كهربائي', defaultW: 600, defaultD: 600, defaultH: 900 },
  { id: 'microwave', label: 'مكرويف', defaultW: 500, defaultD: 400, defaultH: 300 },
  { id: 'stove_full', label: 'بوتاجاز كامل', defaultW: 600, defaultD: 600, defaultH: 900 },
  { id: 'custom', label: 'جهاز مخصص (أدخل المقاسات يدوياً)', defaultW: 600, defaultD: 600, defaultH: 850 },
];

interface Props {
  housingType: 'base_appliance_housing' | 'tall_appliance_housing';
  onConfirm: (config: {
    clearanceMm: { leftMm: number; rightMm: number; topMm: number; backMm: number; bottomMm: number };
    removeDoorAtApplianceZone: boolean;
    hasBaseUnderneath: boolean;
    aboveAppliance: "door" | "drawer" | "shelf" | "empty";
    shelfCountAbove?: number;
    applianceLabel: string;
    finalWidthMm: number;
    finalDepthMm: number;
    finalHeightMm: number;
  }) => void;
  onCancel: () => void;
}

export const ApplianceHousingWizard: React.FC<Props> = ({ housingType, onConfirm, onCancel }) => {
  const [step, setStep] = useState(1);

  // Step 1: Appliance selection
  const [selectedAppliance, setSelectedAppliance] = useState(KNOWN_APPLIANCES[0]);

  // Step 2: Appliance dimensions (editable)
  const [appW, setAppW] = useState(selectedAppliance.defaultW);
  const [appD, setAppD] = useState(selectedAppliance.defaultD);
  const [appH, setAppH] = useState(selectedAppliance.defaultH);

  // Step 3: Clearance
  const [leftMm, setLeftMm] = useState(5);
  const [rightMm, setRightMm] = useState(5);
  const [topMm, setTopMm] = useState(50);
  const [backMm, setBackMm] = useState(5);
  const [bottomMm, setBottomMm] = useState(5);

  // Step 4: Door & base
  const [removeDoor, setRemoveDoor] = useState(true);
  const [hasBase, setHasBase] = useState(false);

  // Step 5: Above appliance
  const [aboveAppliance, setAboveAppliance] = useState<"door" | "drawer" | "shelf" | "empty">("empty");
  const [shelfCountAbove, setShelfCountAbove] = useState(1);

  const isTall = housingType === 'tall_appliance_housing';

  // Auto-calculate final housing dimensions
  const finalDims = useMemo(() => {
    const w = appW + leftMm + rightMm;
    const d = appD + backMm;
    const applianceZoneH = appH + topMm + bottomMm;
    const aboveH = (aboveAppliance !== 'empty' && !isTall) ? 300 : 0;
    const h = isTall ? 2100 : applianceZoneH + aboveH;
    return { w, d, h, applianceZoneH, aboveH };
  }, [appW, appD, appH, leftMm, rightMm, topMm, backMm, bottomMm, aboveAppliance, isTall]);

  // Default housing sizes
  const defaultHousingW = 600;
  const defaultHousingD = 600;
  const defaultHousingH = isTall ? 2100 : 850;

  const wasAutoResized = finalDims.w > defaultHousingW || finalDims.d > defaultHousingD || finalDims.h > defaultHousingH;

  const handleApplianceSelect = (appliance: typeof selectedAppliance) => {
    setSelectedAppliance(appliance);
    setAppW(appliance.defaultW);
    setAppD(appliance.defaultD);
    setAppH(appliance.defaultH);
  };

  const handleConfirm = () => {
    onConfirm({
      clearanceMm: { leftMm, rightMm, topMm, backMm, bottomMm },
      removeDoorAtApplianceZone: removeDoor,
      hasBaseUnderneath: hasBase,
      aboveAppliance,
      shelfCountAbove: aboveAppliance === 'shelf' ? shelfCountAbove : undefined,
      applianceLabel: selectedAppliance.label,
      finalWidthMm: finalDims.w,
      finalDepthMm: finalDims.d,
      finalHeightMm: finalDims.h,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">إعدادات إحاطة الجهاز</h3>
            <p className="text-sm text-zinc-400">
              {isTall ? 'وحدة طولية' : 'وحدة سفلية'} — <span className="text-sky-400">{selectedAppliance.label}</span>
            </p>
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-1.5 mb-5">
          {[1, 2, 3, 4, 5].map(s => (
            <React.Fragment key={s}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= s ? 'bg-amber-600 text-white' : 'bg-zinc-700 text-zinc-500'}`}>{s}</div>
              {s < 5 && <div className={`h-0.5 flex-1 ${step >= s + 1 ? 'bg-amber-600' : 'bg-zinc-700'}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Select Appliance */}
        {step === 1 && (
          <div>
            <h4 className="text-white font-medium mb-1">اختر الجهاز الكهربائي</h4>
            <p className="text-xs text-zinc-500 mb-4">النوع بيحدد المقاسات المبدائية للجهاز</p>
            <div className="space-y-2">
              {KNOWN_APPLIANCES.map(app => (
                <button key={app.id} onClick={() => handleApplianceSelect(app)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-right ${
                    selectedAppliance.id === app.id
                      ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                      : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full border-2 ${selectedAppliance.id === app.id ? 'bg-amber-500 border-amber-500' : 'border-zinc-600'}`} />
                    <span className="font-medium text-sm">{app.label}</span>
                  </div>
                  <span className="text-xs font-mono text-zinc-500">{app.defaultW}×{app.defaultD}×{app.defaultH}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(2)} className="mt-5 w-full px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-xl transition-colors">
              التالي
            </button>
          </div>
        )}

        {/* Step 2: Appliance Dimensions */}
        {step === 2 && (
          <div>
            <h4 className="text-white font-medium mb-1">مقاسات الجهاز</h4>
            <p className="text-xs text-zinc-500 mb-4">عدّل المقاسات لو جهازك مختلف عن المبدائي</p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'العرض (مم)', value: appW, set: setAppW },
                { label: 'العمق (مم)', value: appD, set: setAppD },
                { label: 'الارتفاع (مم)', value: appH, set: setAppH },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-xs text-zinc-400 mb-1">{f.label}</label>
                  <input type="number" value={f.value} onChange={e => f.set(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white font-mono text-center focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
              ))}
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-3 text-xs text-zinc-500">
              💡 المقاسات المبدائية من <span className="text-zinc-400">{selectedAppliance.label}</span>: {selectedAppliance.defaultW}×{selectedAppliance.defaultD}×{selectedAppliance.defaultH}مم
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setStep(1)} className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl transition-colors">السابق</button>
              <button onClick={() => setStep(3)} className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-xl transition-colors">التالي</button>
            </div>
          </div>
        )}

        {/* Step 3: Clearance */}
        {step === 3 && (
          <div>
            <h4 className="text-white font-medium mb-1">مسافات الخلوص (مم)</h4>
            <p className="text-xs text-zinc-500 mb-4">المسافة بين الجهاز والحائط/الجهاز المجاور</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'شمال', value: leftMm, set: setLeftMm },
                { label: 'يمين', value: rightMm, set: setRightMm },
                { label: 'فوق (تهوية)', value: topMm, set: setTopMm },
                { label: 'خلف', value: backMm, set: setBackMm },
                { label: 'تحت', value: bottomMm, set: setBottomMm },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-xs text-zinc-400 mb-1">{f.label}</label>
                  <input type="number" value={f.value} onChange={e => f.set(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white font-mono text-center focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
              ))}
            </div>

            {/* Auto-resize warning */}
            {wasAutoResized && (
              <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-400">
                ⚠️ المقاسات المحسوبة ({finalDims.w}×{finalDims.d}×{finalDims.h}) أكبر من الوحدة المبدائية ({defaultHousingW}×{defaultHousingD}×{defaultHousingH}).
                الوحدة هتتلقّم تلقائياً!
              </div>
            )}

            <div className="mt-3 bg-zinc-800/50 rounded-xl p-3 text-xs space-y-1">
              <div className="flex justify-between text-zinc-400">
                <span>مساحة الجهاز:</span>
                <span className="font-mono text-white">{appW}×{appD}×{appH}مم</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>مساحة الوحدة النهائية:</span>
                <span className="font-mono text-amber-400">{finalDims.w}×{finalDims.d}×{finalDims.h}مم</span>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setStep(2)} className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl transition-colors">السابق</button>
              <button onClick={() => setStep(4)} className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-xl transition-colors">التالي</button>
            </div>
          </div>
        )}

        {/* Step 4: Door & Base + Above Appliance */}
        {step === 4 && (
          <div>
            <h4 className="text-white font-medium mb-3">إعدادات إضافية</h4>

            <div className="space-y-3 mb-5">
              <label className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-xl cursor-pointer hover:bg-zinc-800 transition-colors">
                <div>
                  <div className="text-white font-medium text-sm">إلغاء باب الوحدة في منطقة الجهاز</div>
                  <div className="text-xs text-zinc-500">الجهاز له بابه الأصلي</div>
                </div>
                <input type="checkbox" checked={removeDoor} onChange={e => setRemoveDoor(e.target.checked)}
                  className="w-5 h-5 rounded border-zinc-600 text-amber-600 focus:ring-amber-500" />
              </label>

              <label className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-xl cursor-pointer hover:bg-zinc-800 transition-colors">
                <div>
                  <div className="text-white font-medium text-sm">قاعدة تحت الجهاز</div>
                  <div className="text-xs text-zinc-500">كيك بورد أسفل الوحدة</div>
                </div>
                <input type="checkbox" checked={hasBase} onChange={e => setHasBase(e.target.checked)}
                  className="w-5 h-5 rounded border-zinc-600 text-amber-600 focus:ring-amber-500" />
              </label>
            </div>

            {!isTall && (
              <>
                <h4 className="text-white font-medium mb-2">المساحة فوق الجهاز</h4>
                <div className="space-y-2 mb-3">
                  {[
                    { value: "door" as const, label: "باب", desc: "نغلقها باب" },
                    { value: "drawer" as const, label: "درج", desc: "درج صغير" },
                    { value: "shelf" as const, label: "رف", desc: "رف مفتوح" },
                    { value: "empty" as const, label: "فراغ", desc: "تهوية" },
                  ].map(opt => (
                    <button key={opt.value} onClick={() => setAboveAppliance(opt.value)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-right text-sm ${
                        aboveAppliance === opt.value
                          ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                          : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                      }`}>
                      <div className={`w-2.5 h-2.5 rounded-full border-2 ${aboveAppliance === opt.value ? 'bg-amber-500 border-amber-500' : 'border-zinc-600'}`} />
                      <div>
                        <div className="font-medium">{opt.label}</div>
                        <div className="text-xs opacity-70">{opt.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
                {aboveAppliance === 'shelf' && (
                  <div className="mb-3">
                    <label className="block text-xs text-zinc-400 mb-1">عدد الأرفف فوق</label>
                    <input type="number" value={shelfCountAbove} min={1} max={4}
                      onChange={e => setShelfCountAbove(Math.max(1, Math.min(4, Number(e.target.value) || 1)))}
                      className="w-20 px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white font-mono text-center focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                )}
              </>
            )}

            <div className="flex gap-3 mt-4">
              <button onClick={() => setStep(3)} className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl transition-colors">السابق</button>
              <button onClick={() => setStep(5)} className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-xl transition-colors">التالي</button>
            </div>
          </div>
        )}

        {/* Step 5: Review & Confirm */}
        {step === 5 && (
          <div>
            <h4 className="text-white font-medium mb-3">مراجعة الإعدادات</h4>

            <div className="bg-zinc-800/50 rounded-xl p-4 space-y-1.5 text-sm">
              <div className="text-amber-400 font-medium text-xs mb-2">الجهاز: {selectedAppliance.label}</div>
              <div className="flex justify-between text-zinc-400">
                <span>مقاسات الجهاز:</span>
                <span className="font-mono text-white">{appW}×{appD}×{appH}</span>
              </div>
              <div className="border-t border-zinc-700 my-1.5" />
              <div className="flex justify-between text-zinc-400">
                <span>خلوص شمال/يمين:</span>
                <span className="font-mono text-white">{leftMm} / {rightMm}مم</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>خلوص فوق/تحت:</span>
                <span className="font-mono text-white">{topMm} / {bottomMm}مم</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>خلوص خلف:</span>
                <span className="font-mono text-white">{backMm}مم</span>
              </div>
              <div className="border-t border-zinc-700 my-1.5" />
              <div className="flex justify-between text-zinc-400">
                <span>مقاس الوحدة النهائي:</span>
                <span className="font-mono text-amber-400 font-bold">{finalDims.w}×{finalDims.d}×{finalDims.h}</span>
              </div>
              {wasAutoResized && (
                <div className="text-xs text-amber-500 mt-1">⚠️ تم تكبير الوحدة تلقائياً لتغطية الجهاز</div>
              )}
              <div className="border-t border-zinc-700 my-1.5" />
              <div className="flex justify-between text-zinc-400">
                <span>باب ملغي:</span>
                <span className={removeDoor ? 'text-emerald-400' : 'text-zinc-500'}>{removeDoor ? 'نعم' : 'لا'}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>قاعدة:</span>
                <span className={hasBase ? 'text-emerald-400' : 'text-zinc-500'}>{hasBase ? 'نعم' : 'لا'}</span>
              </div>
              {!isTall && (
                <div className="flex justify-between text-zinc-400">
                  <span>فوق الجهاز:</span>
                  <span className="text-amber-400">
                    {aboveAppliance === 'door' ? 'باب' : aboveAppliance === 'drawer' ? 'درج' : aboveAppliance === 'shelf' ? `رف (${shelfCountAbove})` : 'فراغ'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setStep(4)} className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl transition-colors">السابق</button>
              <button onClick={handleConfirm} className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors">✓ تأكيد الإنشاء</button>
            </div>
          </div>
        )}

        <button onClick={onCancel} className="mt-3 w-full text-center text-sm text-zinc-500 hover:text-zinc-400 transition-colors">إلغاء</button>
      </div>
    </div>
  );
};
