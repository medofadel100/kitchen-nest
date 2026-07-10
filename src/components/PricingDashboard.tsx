"use client";

import React, { useMemo } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { calculateProjectCost } from '@/lib/pricing';
import { DEFAULT_MATERIALS } from '@/data/materials';
import { projectToCutPiecesByMaterial } from '@/lib/cuttingList';
import { nestPiecesForMaterial } from '@/lib/nesting';
import { motion } from 'framer-motion';
import { Calculator, ShoppingCart, Layers, CircleDollarSign, Package, Printer, FileText } from 'lucide-react';
import { KitchenProject, Material } from '@/types';
import { QuotationPrint } from './print/QuotationPrint';
import { CuttingListPrint } from './print/CuttingListPrint';
import { NestingVisualizerList } from './NestingVisualizer';

export const PricingDashboard = () => {
  const { units, projectDetails } = useProjectStore();

  const materialsById = useMemo(() => {
    const map: Record<string, Material> = {};
    for (const m of DEFAULT_MATERIALS) {
      map[m.id] = m;
    }
    return map;
  }, []);

  const dummyProject: KitchenProject = {
    id: projectDetails?.id || 'temp',
    projectName: projectDetails?.projectName || 'مشروع بدون اسم',
    workshopId: 'ws-1',
    clientName: projectDetails?.clientName || 'بدون اسم',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'design',
    profitMarginPercent: 20,
    room: { id: "dummy", name: "dummy", widthMm: 3000, lengthMm: 3000, heightMm: 2800, obstacles: [], polygonMm: [], fixtures: [] },
    appliances: [],
    settings: {} as any,
    payments: [],
    units: useProjectStore.getState().units,
  };

  const pricingResult = calculateProjectCost(dummyProject, materialsById);
  const piecesByMaterial = projectToCutPiecesByMaterial(units);
  
  // Calculate total sheets by running nesting for all used materials
  let totalSheets = 0;
  let totalUnplacedPieces = 0;
  const nestingDetails: any[] = [];

  Object.entries(piecesByMaterial).forEach(([materialKey, pieces]) => {
    const [materialId] = materialKey.split('__');
    const mat = materialsById[materialId];
    if (mat) {
      const res = nestPiecesForMaterial(pieces, mat);
      totalSheets += res.sheets.length;
      totalUnplacedPieces += (res.unplacedPieces?.length || 0);
      const colorSample = pieces.find(piece => piece.colorHex);
      nestingDetails.push({
        material: mat,
        result: res,
        piecesCount: pieces.length,
        colorHex: colorSample?.colorHex || mat.colorHex,
        colorId: colorSample?.colorId || 'default',
      });
    }
  });

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar p-8 bg-zinc-950 text-white print:hidden">
      <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto space-y-8 pb-20"
        >
        <div className="flex justify-between items-end border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
              <Calculator className="text-emerald-500" size={32} />
              الحسابات والتسعير
            </h1>
            <p className="text-zinc-400">
              {projectDetails?.projectName ? `مشروع: ${projectDetails.projectName}` : 'ملخص التكلفة، تقطيع الألواح، والمستلزمات'}
            </p>
          </div>
          <div className="text-left">
            <p className="text-sm text-zinc-500 font-medium mb-1">التكلفة الإجمالية (تشمل ربح {dummyProject.profitMarginPercent}%)</p>
            <p className="text-4xl font-black text-emerald-400 font-mono">
              {pricingResult.grandTotal.toLocaleString()} <span className="text-lg text-emerald-500/50">EGP</span>
            </p>
          </div>
        </div>

        {/* Print Actions */}
        <div className="flex gap-4">
          <button 
            onClick={() => {
              localStorage.setItem('print_project', JSON.stringify(dummyProject));
              localStorage.setItem('print_pricing', JSON.stringify(pricingResult));
              localStorage.setItem('print_units', JSON.stringify(units));
              window.open('/print/quotation', '_blank');
            }}
            className="flex-1 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-all rounded-2xl p-4 flex items-center justify-center gap-3 group"
          >
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg group-hover:scale-110 transition-transform">
              <FileText size={20} />
            </div>
            <div className="text-right">
              <p className="font-bold text-sm text-white">طباعة عرض السعر (Quotation)</p>
              <p className="text-xs text-zinc-500">نسخة للعميل (إجمالي التكلفة والمواصفات)</p>
            </div>
          </button>
          
          <button 
            onClick={() => {
              localStorage.setItem('print_project', JSON.stringify(dummyProject));
              localStorage.setItem('print_nesting', JSON.stringify(nestingDetails));
              window.open('/print/cutting-list', '_blank');
            }}
            className="flex-1 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-all rounded-2xl p-4 flex items-center justify-center gap-3 group"
          >
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg group-hover:scale-110 transition-transform">
              <Printer size={20} />
            </div>
            <div className="text-right">
              <p className="font-bold text-sm text-white">طباعة تقارير التصنيع (Cutting List)</p>
              <p className="text-xs text-zinc-500">خريطة التقطيع، شريط الحرف، والمقاسات</p>
            </div>
          </button>
        </div>

        {/* Unplaced Pieces Warning */}
        {totalUnplacedPieces > 0 && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-2xl p-4 flex items-center gap-3 text-red-400">
            <div className="bg-red-500/20 p-2 rounded-lg flex-shrink-0">
              <Package size={20} className="text-red-400" />
            </div>
            <div>
              <p className="font-bold text-sm">تنبيه هام: هناك {totalUnplacedPieces} قطعة أكبر من مساحة اللوح!</p>
              <p className="text-xs text-red-400/80 mt-1">يوجد قطع مقاسها يتجاوز حجم اللوح القياسي المتاح لهذه الخامة. يرجى مراجعة مقاسات الوحدات يدوياً وإعادة التقييم.</p>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl"><Package size={24} /></div>
            <div>
              <p className="text-xs text-zinc-500 font-bold mb-1">عدد الوحدات</p>
              <p className="text-xl font-bold">{units.length}</p>
            </div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl"><Layers size={24} /></div>
            <div>
              <p className="text-xs text-zinc-500 font-bold mb-1">إجمالي الألواح المطلوبة</p>
              <p className="text-xl font-bold">
                {totalSheets}
              </p>
            </div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl"><ShoppingCart size={24} /></div>
            <div>
              <p className="text-xs text-zinc-500 font-bold mb-1">تكلفة الإكسسوارات</p>
              <p className="text-xl font-bold font-mono">{pricingResult.totalAccessoriesCost.toLocaleString()} <span className="text-sm">EGP</span></p>
            </div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl"><CircleDollarSign size={24} /></div>
            <div>
              <p className="text-xs text-zinc-500 font-bold mb-1">تكلفة شريط الحرف</p>
              <p className="text-xl font-bold font-mono">{pricingResult.totalEdgeBandingCost.toLocaleString()} <span className="text-sm">EGP</span></p>
            </div>
          </div>
        </div>

        {/* Materials Breakdown */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800 bg-zinc-900/80">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Layers className="text-zinc-400" />
              تفاصيل الخامات (Nesting)
            </h2>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="text-zinc-500 text-sm border-b border-zinc-800">
                    <th className="pb-4 font-medium">اسم الخامة</th>
                    <th className="pb-4 font-medium">القطع</th>
                    <th className="pb-4 font-medium">الألواح المطلوبة</th>
                    <th className="pb-4 font-medium">الهالك (تقريبي)</th>
                    <th className="pb-4 font-medium">تكلفة الخامة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {nestingDetails.map((nest, idx) => {
                    const averageUtilization = nest.result.sheets.reduce((acc: number, sheet: any) => acc + sheet.utilizationPercent, 0) / (nest.result.sheets.length || 1);
                    const wastePercent = Math.max(0, 100 - averageUtilization);
                    const cost = nest.result.sheets.length * nest.material.pricePerSheet;

                    return (
                      <tr key={idx} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-4 font-bold">
                          <div className="flex items-center gap-2">
                            <span>{nest.material.nameAr}</span>
                            {nest.colorHex && (
                              <span className="inline-flex h-3 w-3 rounded-full border border-zinc-700" style={{ backgroundColor: nest.colorHex }} />
                            )}
                          </div>
                        </td>
                        <td className="py-4 font-mono text-zinc-300">{nest.piecesCount}</td>
                        <td className="py-4">
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
                            {nest.result.sheets.length} لوح
                          </span>
                        </td>
                        <td className="py-4">
                          <span className={`text-sm font-bold ${wastePercent > 30 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {wastePercent.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-4 font-mono font-bold text-emerald-400">
                          {cost.toLocaleString()} <span className="text-xs text-emerald-500/50">EGP</span>
                        </td>
                      </tr>
                    );
                  })}
                  {nestingDetails.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-500 text-sm">
                        لا توجد وحدات في المطبخ حالياً لإجراء الحسابات.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Accessories Breakdown */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden mt-8">
          <div className="p-6 border-b border-zinc-800 bg-zinc-900/80">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShoppingCart className="text-zinc-400" />
              تفاصيل الإكسسوارات
            </h2>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="text-zinc-500 text-sm border-b border-zinc-800">
                    <th className="pb-4 font-medium">الوحدة</th>
                    <th className="pb-4 font-medium">البند</th>
                    <th className="pb-4 font-medium">الكمية</th>
                    <th className="pb-4 font-medium">سعر الوحدة</th>
                    <th className="pb-4 font-medium">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {pricingResult.unitBreakdowns.flatMap((u, idx) => 
                    (u.accessoriesDetails || []).map((detail, dIdx) => (
                      <tr key={`${idx}-${dIdx}`} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3 font-bold text-sm">{units.find(x => x.id === u.unitId)?.label || u.unitId}</td>
                        <td className="py-3 text-zinc-300 text-sm">{detail.name}</td>
                        <td className="py-3 font-mono text-zinc-400">{detail.count}</td>
                        <td className="py-3 font-mono text-zinc-400">{detail.unitPrice.toLocaleString()}</td>
                        <td className="py-3 font-mono font-bold text-emerald-400">
                          {detail.total.toLocaleString()} <span className="text-xs text-emerald-500/50">EGP</span>
                        </td>
                      </tr>
                    ))
                  )}
                  {pricingResult.totalAccessoriesCost === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-500 text-sm">
                        لا توجد إكسسوارات مسجلة في هذا المشروع حتى الآن.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex items-start gap-4">
          <CircleDollarSign className="text-emerald-400 shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-emerald-400 mb-1">تنبيه هام بخصوص التسعير</h3>
            <p className="text-sm text-emerald-500/80 leading-relaxed">
              جميع الأسعار المعروضة للخامات حالياً هي أسعار تقريبية (Placeholder). سيتم لاحقاً إضافة لوحة تحكم خاصة للورشة لتحديث الأسعار الفعلية للخامات، الإكسسوارات، ونسب الربح. نظام الـ Nesting المدمج يضمن حساب عدد الألواح الفعلي الذي يجب شراؤه (أعداد صحيحة) وليس بناءً على مساحة المتر المربع النظرية.
            </p>
          </div>
        </div>

        {/* Visual Nesting Maps */}
        <div className="mt-12 space-y-12">
          {nestingDetails.map((nest, idx) => (
            <NestingVisualizerList key={idx} sheets={nest.result.sheets} materialName={nest.material.nameAr} />
          ))}
        </div>
      </motion.div>
    </div>
  );
};
