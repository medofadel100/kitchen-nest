import React from 'react';
import { KitchenProject, KitchenUnit, ProjectCostSummary } from '@/types';
import { DEFAULT_MATERIALS } from '@/data/materials';
import { DEFAULT_HARDWARE } from '@/data/hardware';

interface QuotationPrintProps {
  project: KitchenProject;
  pricingResult: ProjectCostSummary;
  units: KitchenUnit[];
}

export const QuotationPrint = ({ project, pricingResult, units }: QuotationPrintProps) => {
  // Helpers to get names from IDs
  const getMaterialName = (id?: string) => {
    if (!id) return 'غير محدد';
    const mat = DEFAULT_MATERIALS.find(m => m.id === id);
    return mat ? mat.nameAr : id;
  };

  const getHardwareName = (id?: string) => {
    if (!id || id === 'none') return 'غير محدد / بدون';
    const hw = DEFAULT_HARDWARE.find(h => h.id === id);
    return hw ? hw.nameAr : id;
  };

  // Safe destructuring of settings
  const settings = project.settings || {};

  return (
    <div className="w-full bg-white text-black p-10 mx-auto max-w-4xl min-h-screen font-sans" style={{ direction: 'rtl' }}>
      
      {/* Header section */}
      <div className="flex justify-between items-start border-b-4 border-emerald-600 pb-6 mb-8">
        <div>
          <h1 className="text-4xl font-black text-emerald-700 mb-2 tracking-tight">عرض سعر مطبخ</h1>
          <p className="text-zinc-600 font-bold text-xl">مشروع: {project.projectName || 'بدون اسم'}</p>
        </div>
        <div className="text-left bg-zinc-50 p-4 rounded-xl border border-zinc-200">
          <p className="font-bold text-zinc-800 text-lg mb-1">العميل: <span className="text-emerald-700">{project.clientName || 'بدون اسم'}</span></p>
          <p className="text-sm text-zinc-600 mb-1">رقم الهاتف: <span dir="ltr">{project.clientPhone || 'غير مدرج'}</span></p>
          <p className="text-sm text-zinc-600 mb-1">التاريخ: {new Date().toLocaleDateString('ar-EG')}</p>
          <p className="text-sm text-zinc-500">المرجع: PRJ-{project.id?.substring(0,6) || '0001'}</p>
        </div>
      </div>

      {/* Intro text */}
      <div className="mb-8 text-lg text-zinc-700 leading-relaxed">
        <p>عزيزي العميل <strong>{project.clientName}</strong>،</p>
        <p>بناءً على طلبكم والتصميم المبدئي المتفق عليه، يسعدنا أن نقدم لكم عرض السعر التالي لتوريد وتركيب المطبخ بالمواصفات الفنية الموضحة أدناه.</p>
      </div>

      {/* Technical Specifications */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-4 text-emerald-800 border-b-2 border-emerald-100 pb-2">المواصفات الفنية للخامات والإكسسوارات</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-zinc-800">
          <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-100">
            <span className="block text-sm text-zinc-500 mb-1">خامة الشاسيه (البدن الداخلي)</span>
            <span className="font-bold text-lg">{getMaterialName(settings.defaultMaterialId)}</span>
          </div>
          <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-100">
            <span className="block text-sm text-zinc-500 mb-1">خامة الدرف (الأبواب الخارجية)</span>
            <span className="font-bold text-lg">{getMaterialName(settings.defaultDoorMaterialId)}</span>
          </div>
          <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-100">
            <span className="block text-sm text-zinc-500 mb-1">المفصلات</span>
            <span className="font-bold">{getHardwareName(settings.defaultHingeId)}</span>
          </div>
          <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-100">
            <span className="block text-sm text-zinc-500 mb-1">مجرى الأدراج</span>
            <span className="font-bold">{getHardwareName(settings.defaultDrawerRunnerId)}</span>
          </div>
        </div>
      </div>

      {/* Units Summary */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-4 text-emerald-800 border-b-2 border-emerald-100 pb-2">تفاصيل المطبخ والوحدات</h2>
        <table className="w-full text-right border-collapse text-zinc-800 border border-zinc-200">
          <thead>
            <tr className="bg-zinc-100">
              <th className="p-3 border-b border-zinc-300 font-bold">القسم</th>
              <th className="p-3 border-b border-zinc-300 font-bold">عدد الوحدات</th>
              <th className="p-3 border-b border-zinc-300 font-bold">ملاحظات القياس</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-zinc-100">
              <td className="p-3 font-semibold">الوحدات السفلية (Base Units)</td>
              <td className="p-3 font-bold text-emerald-700">{units.filter(u => ['base', 'corner_base', 'drawer_unit'].includes(u.type)).length}</td>
              <td className="p-3 text-sm text-zinc-500">تشمل وحدات الأدراج والأركان</td>
            </tr>
            <tr className="border-b border-zinc-100">
              <td className="p-3 font-semibold">الوحدات العلوية (Wall Units)</td>
              <td className="p-3 font-bold text-emerald-700">{units.filter(u => ['wall', 'corner_wall', 'loft'].includes(u.type)).length}</td>
              <td className="p-3 text-sm text-zinc-500">تشمل الوحدات القلابة</td>
            </tr>
            <tr className="border-b border-zinc-100">
              <td className="p-3 font-semibold">الوحدات الطولية (Tall Units)</td>
              <td className="p-3 font-bold text-emerald-700">{units.filter(u => ['tall', 'corner_tall'].includes(u.type)).length}</td>
              <td className="p-3 text-sm text-zinc-500">للتخزين أو الأجهزة المدمجة</td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="bg-zinc-50 font-bold">
              <td className="p-3">إجمالي الوحدات</td>
              <td colSpan={2} className="p-3 text-lg">{units.length} وحدة متكاملة</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Pricing Table (Customer Facing) */}
      <div className="mb-12 page-break-inside-avoid">
        <h2 className="text-2xl font-bold mb-4 text-emerald-800 border-b-2 border-emerald-100 pb-2">التكلفة الإجمالية وجدول الدفعات</h2>
        
        <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl flex justify-between items-center mb-6">
          <div>
            <span className="block text-emerald-800 font-bold text-xl mb-1">إجمالي تكلفة المطبخ</span>
            <span className="text-sm text-emerald-600">شامل التصنيع، الخامات، الإكسسوارات الموضحة والتركيب</span>
          </div>
          <span className="text-4xl font-black font-mono text-emerald-700">{pricingResult.grandTotal.toLocaleString()} ج.م</span>
        </div>

        {/* Payments Schedule */}
        <div className="grid grid-cols-3 gap-4">
          <div className="border border-zinc-200 rounded-xl p-4 text-center bg-zinc-50">
            <span className="block text-sm text-zinc-500 mb-1">الدفعة الأولى (تعاقد)</span>
            <span className="block text-xl font-bold text-zinc-800">{(pricingResult.grandTotal * 0.5).toLocaleString()} ج.م</span>
            <span className="block text-xs font-bold text-emerald-600 mt-1">50% من الإجمالي</span>
          </div>
          <div className="border border-zinc-200 rounded-xl p-4 text-center bg-zinc-50">
            <span className="block text-sm text-zinc-500 mb-1">الدفعة الثانية (عند التسليم)</span>
            <span className="block text-xl font-bold text-zinc-800">{(pricingResult.grandTotal * 0.4).toLocaleString()} ج.م</span>
            <span className="block text-xs font-bold text-emerald-600 mt-1">40% من الإجمالي</span>
          </div>
          <div className="border border-zinc-200 rounded-xl p-4 text-center bg-zinc-50">
            <span className="block text-sm text-zinc-500 mb-1">الدفعة الأخيرة (بعد التركيب)</span>
            <span className="block text-xl font-bold text-zinc-800">{(pricingResult.grandTotal * 0.1).toLocaleString()} ج.م</span>
            <span className="block text-xs font-bold text-emerald-600 mt-1">10% من الإجمالي</span>
          </div>
        </div>
      </div>

      {/* Footer / Signatures */}
      <div className="mt-16 pt-8 border-t-2 border-zinc-200 flex justify-between text-zinc-800">
        <div className="text-center w-1/3">
          <p className="font-bold mb-8">اعتماد وتوقيع العميل</p>
          <p className="text-zinc-400">.....................................................</p>
        </div>
        <div className="text-center w-1/3">
          <p className="font-bold mb-8">إدارة الورشة / المهندس المسئول</p>
          <p className="text-zinc-400">.....................................................</p>
        </div>
      </div>
      
      <div className="text-center mt-12 text-xs text-zinc-400">
        تم استخراج وعمل حسابات هذا العرض آلياً بواسطة نظام KitchenNest ©
      </div>

    </div>
  );
};
