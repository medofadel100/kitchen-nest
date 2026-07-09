import { KitchenProject, Material, ProjectCostSummary, UnitCostBreakdown } from "@/types";
import { projectToCutPiecesByMaterial } from "./cuttingList";
import { nestPiecesForMaterial } from "./nesting";
import { defaultCountertops } from "../data/countertops";
import { defaultSinks } from "../data/sinks";
import { defaultFaucets } from "../data/faucets";

import { useSettingsStore } from "../store/settingsStore";
import { useProjectStore } from "../store/projectStore";

const DEFAULT_ACCESSORY_COST_PER_UNIT: Record<string, number> = {
  base: 250,        // مفصلات + سكة بسيطة
  wall: 150,
  tall: 450,        // سكة تلاجة/فرن أغلى
  corner_base: 600, // magic corner أو lazy susan
  corner_wall: 150,
  island: 300,
  drawer_unit: 350, // سكك ناعمة لكل درج تقريبًا
};

const CORNER_SOLUTION_PRICES = {
  lazy_susan: 1200,
  magic_corner: 3500,
  none: 0,
};

/**
 * الحساب الأساسي: بياخد كل القطع، يعمل nesting فعلي لكل خامة،
 * وبيحسب "عدد الألواح الحقيقي" اللي هيتشترى - مش مجرد مساحة نظرية
 */
export function calculateProjectCost(
  project: KitchenProject,
  materialsById: Record<string, Material>
): ProjectCostSummary {
  // الحصول على الإكسسوارات من الإعدادات
  const { hardwareItems } = useSettingsStore.getState();
  const { projectSettings } = useProjectStore.getState();

  const piecesByMaterial = projectToCutPiecesByMaterial(project.units);
  const sheetsRequiredByMaterial: Record<string, number> = {};
  let totalMaterialCost = 0;
  let totalEdgeBandingCost = 0;

  for (const [key, pieces] of Object.entries(piecesByMaterial)) {
    // المفتاح = materialId__colorId — نستخرج materialId الحقيقي
    const materialId = key.split('__')[0];
    const material = materialsById[materialId];
    if (!material) continue;

    const nestingResult = nestPiecesForMaterial(pieces, material);
    const sheetsNeeded = nestingResult.sheets.length;
    // نجمع الألواح حسب المادة (قد يكون فيه ألوان متعددة لنفس المادة)
    sheetsRequiredByMaterial[materialId] = (sheetsRequiredByMaterial[materialId] || 0) + sheetsNeeded;

    // تكلفة الخامة = عدد الألواح الفعلي × سعر اللوح (مش المساحة النظرية!)
    totalMaterialCost += sheetsNeeded * material.pricePerSheet;

    // edge banding: بنحسب محيط الأضلاع المطلوبة فقط
    const edgeBandingLengthM = pieces.reduce((sum, p) => {
      let lengthMm = 0;
      if (p.edgesToBind) {
        if (p.edgesToBind.includes("top")) lengthMm += p.widthMm;
        if (p.edgesToBind.includes("bottom")) lengthMm += p.widthMm;
        if (p.edgesToBind.includes("left")) lengthMm += p.heightMm;
        if (p.edgesToBind.includes("right")) lengthMm += p.heightMm;
      } else {
        // لو مفيش، بنحسب المحيط كامل للأمان
        lengthMm = 2 * (p.widthMm + p.heightMm);
      }
      return sum + lengthMm / 1000;
    }, 0);
    totalEdgeBandingCost += edgeBandingLengthM * (material.edgeBandingPricePerMeter ?? 0);
  }

  // تكلفة الإكسسوارات لكل وحدة بناءً على المواصفات الدقيقة
  const unitBreakdowns: UnitCostBreakdown[] = project.units.map((unit) => {
    let accessoriesCost = 0;
    const accessoriesDetails: { name: string; count: number; unitPrice: number; total: number }[] = [];

    if (unit.accessoriesCostOverride) {
      accessoriesCost = unit.accessoriesCostOverride;
      accessoriesDetails.push({ name: 'إكسسوارات (قيمة مخصصة)', count: 1, unitPrice: accessoriesCost, total: accessoriesCost });
    } else {
      // حساب تكلفة المفصلات
      if (unit.doorCount && unit.doorCount > 0) {
        const hingesCount = unit.doorCount * (unit.hingesPerDoor || 2);
        const hingeId = unit.hingeType && unit.hingeType !== 'none' ? unit.hingeType : projectSettings.defaultHingeId;
        const hardware = hardwareItems.find(h => h.id === hingeId);
        const hingePrice = hardware ? hardware.price : 0;
        const hingeName = hardware ? hardware.nameAr : hingeId;
        const hingesCost = hingesCount * hingePrice;
        if (hingesCost > 0) accessoriesDetails.push({ name: `مفصلات (${hingeName})`, count: hingesCount, unitPrice: hingePrice, total: hingesCost });
        accessoriesCost += hingesCost;
      }
      
      // حساب تكلفة المقابض (تشمل مقابض CNC Groove)
      if (unit.handleCount && unit.handleCount > 0) {
        const handleId = unit.handleType && unit.handleType !== 'none' ? unit.handleType : projectSettings.defaultHandleId;
        const hardware = hardwareItems.find(h => h.id === handleId);
        const handlePrice = hardware ? hardware.price : 0;
        const handleName = hardware ? hardware.nameAr : handleId;
        const handlesCost = unit.handleCount * handlePrice;
        if (handlesCost > 0) accessoriesDetails.push({ name: `مقابض (${handleName})`, count: unit.handleCount, unitPrice: handlePrice, total: handlesCost });
        accessoriesCost += handlesCost;
      }
      
      // حساب تكلفة الأدراج (السكك)
      if (unit.drawerCount && unit.drawerCount > 0) {
        const drawerId = projectSettings.defaultDrawerRunnerId;
        const hardware = hardwareItems.find(h => h.id === drawerId);
        const drawerPrice = hardware ? hardware.price : 0;
        const drawerName = hardware ? hardware.nameAr : "سكة أدراج";
        const drawersCost = unit.drawerCount * drawerPrice;
        accessoriesDetails.push({ name: `سكك أدراج (${drawerName})`, count: unit.drawerCount, unitPrice: drawerPrice, total: drawersCost });
        accessoriesCost += drawersCost;
      }

      // حساب تكلفة الليد
      if (unit.hasLedProfile && unit.ledProfileLengthMm) {
        const meters = unit.ledProfileLengthMm / 1000;
        const ledHardware = hardwareItems.find(h => h.category === 'lighting') || hardwareItems.find(h => h.id.includes('lighting'));
        const ledPrice = ledHardware ? ledHardware.price : 0;
        const ledName = ledHardware ? ledHardware.nameAr : 'بروفايل ليد';
        const ledCost = meters * ledPrice;
        accessoriesDetails.push({ name: ledName, count: meters, unitPrice: ledPrice, total: ledCost });
        accessoriesCost += ledCost;
      }

      // حساب حلول الزوايا (الهاردوير الجاهز)
      if (unit.cornerConfig && unit.cornerConfig.internalSolution !== 'none' && unit.cornerConfig.internalSolution !== 'fixed_shelf') {
        const cornerCost = unit.cornerConfig.hardwareCost || 0;
        if (cornerCost > 0) {
          accessoriesDetails.push({ name: `حل زاوية (${unit.cornerConfig.internalSolution})`, count: 1, unitPrice: cornerCost, total: cornerCost });
          accessoriesCost += cornerCost;
        }
      }
    }

    return {
      unitId: unit.id,
      materialAreaM2: 0, // يتحسب تفصيليًا لو مطلوب per-unit breakdown
      materialCost: 0,
      edgeBandingLengthM: 0,
      edgeBandingCost: 0,
      accessoriesCost,
      accessoriesDetails,
      subtotal: accessoriesCost,
    };
  });

  const totalAccessoriesCost = unitBreakdowns.reduce((sum, u) => sum + u.accessoriesCost, 0);

  // حساب تكلفة الكاونترتوب
  let countertopCost = 0;
  if (project.selectedCountertopId && project.countertopLengthM) {
    const countertop = defaultCountertops.find(c => c.id === project.selectedCountertopId);
    if (countertop) countertopCost = countertop.pricePerLinearMeter * project.countertopLengthM;
  }

  // حساب الحوض
  let sinkCost = 0;
  if (project.selectedSinkId) {
    const sink = defaultSinks.find(s => s.id === project.selectedSinkId);
    if (sink) sinkCost = sink.price;
  }

  // حساب الخلاط
  let faucetCost = 0;
  if (project.selectedFaucetId) {
    const faucet = defaultFaucets.find(f => f.id === project.selectedFaucetId);
    if (faucet) faucetCost = faucet.price;
  }

  const subtotalBeforeMargin = totalMaterialCost + totalEdgeBandingCost + totalAccessoriesCost + countertopCost + sinkCost + faucetCost;
  const marginAmount = subtotalBeforeMargin * (project.profitMarginPercent / 100);
  const grandTotal = subtotalBeforeMargin + marginAmount;

  return {
    unitBreakdowns,
    totalMaterialCost,
    totalEdgeBandingCost,
    totalAccessoriesCost,
    countertopCost,
    sinkCost,
    faucetCost,
    subtotalBeforeMargin,
    marginAmount,
    grandTotal,
    sheetsRequiredByMaterial,
  };
}
