import { KitchenUnit, CutPiece, UnitType } from "@/types";

// قواعد بناء جسم كل نوع وحدة: كام قطعة، وأبعادها بالنسبة لأبعاد الوحدة الكلية
// دي قواعد نجارة قياسية مبسطة - قابلة للتفصيل أكتر لاحقًا (مثلاً سمك الخشب المستخدم في الحسبة)

const PANEL_THICKNESS_MM = 18; // سمك اللوح الافتراضي المستخدم في خصم الأبعاد

function basicCarcassPieces(unit: KitchenUnit, label: string): CutPiece[] {
  const { widthMm, depthMm, heightMm } = unit.dimensions;
  const colorId = unit.colorId || 'default';
  const colorHex = unit.colorHex || '#D4B896';
  const pieces: CutPiece[] = [];

  // جانبين (يمين ويسار) - بعمق الوحدة وارتفاعها
  pieces.push({
    id: `${unit.id}_side_left`,
    widthMm: depthMm,
    heightMm: heightMm,
    materialId: unit.materialId,
    colorId,
    colorHex,
    label: `${label} - جانب شمال`,
    canRotate: true, // will be overridden in nesting.ts if material has grain
    edgesToBind: ["left", "bottom"], // الأمامي والسفلي
  });
  pieces.push({
    id: `${unit.id}_side_right`,
    widthMm: depthMm,
    heightMm: heightMm,
    materialId: unit.materialId,
    colorId,
    colorHex,
    label: `${label} - جانب يمين`,
    canRotate: true,
    edgesToBind: ["left", "bottom"],
  });

  // قاعدة وسقف (بعرض الوحدة مطروح منه سمك الجانبين)
  const innerWidth = widthMm - 2 * PANEL_THICKNESS_MM;
  pieces.push({
    id: `${unit.id}_base`,
    widthMm: innerWidth,
    heightMm: depthMm,
    materialId: unit.materialId,
    colorId,
    colorHex,
    label: `${label} - قاعدة`,
    canRotate: true,
    edgesToBind: ["bottom"], // الأمامي فقط
  });
  pieces.push({
    id: `${unit.id}_top`,
    widthMm: innerWidth,
    heightMm: depthMm,
    materialId: unit.materialId,
    colorId,
    colorHex,
    label: `${label} - سقف`,
    canRotate: true,
    edgesToBind: ["bottom"],
  });

  // ظهر (عادة أرق، بس هنحسبه من نفس الخامة لتبسيط الـ MVP)
  pieces.push({
    id: `${unit.id}_back`,
    widthMm: innerWidth,
    heightMm: heightMm,
    materialId: unit.materialId,
    colorId,
    colorHex,
    label: `${label} - ظهر`,
    canRotate: true,
    edgesToBind: [],
  });

  // أرفف (عدد حسب خصائص الوحدة)
  const shelfCount = unit.shelfCount || 0;
  if (shelfCount > 0) {
    for (let i = 0; i < shelfCount; i++) {
      pieces.push({
        id: `${unit.id}_shelf_${i + 1}`,
        widthMm: innerWidth,
        heightMm: depthMm - 20, // خصم بسيط لسهولة التركيب
        materialId: unit.materialId,
        colorId,
        colorHex,
        label: `${label} - رف ${i + 1}`,
        canRotate: true,
        edgesToBind: ["bottom"], // الأمامي فقط
      });
    }
  }

  return pieces;
}

function cornerCarcassPieces(unit: KitchenUnit, label: string): CutPiece[] {
  const { widthMm, depthMm, heightMm, leftLegCarcassDepthMm, rightLegCarcassDepthMm } = unit.dimensions;
  const colorId = unit.colorId || 'default';
  const colorHex = unit.colorHex || '#D4B896';
  const leftD = leftLegCarcassDepthMm || 600;
  const rightD = rightLegCarcassDepthMm || 600;
  const pieces: CutPiece[] = [];

  // الجوانب الخلفية (Back sides) اللي بتركب على الحيطة
  pieces.push({
    id: `${unit.id}_back_left`, widthMm: leftD, heightMm: heightMm,
    materialId: unit.materialId, colorId, colorHex, label: `${label} - جانب خلفي يسار`, canRotate: true,
    edgesToBind: ["left", "bottom"],
  });
  pieces.push({
    id: `${unit.id}_back_right`, widthMm: rightD, heightMm: heightMm,
    materialId: unit.materialId, colorId, colorHex, label: `${label} - جانب خلفي يمين`, canRotate: true,
    edgesToBind: ["left", "bottom"],
  });

  // قاعدتين متقاطعتين (Base) وسقفين (Top) للـ L-Shape
  // عشان نعمل حرف L لازم نقطعها لحتتين: حتة كاملة للعرض، وحتة تكمل العمق
  const baseWidth1 = widthMm - 2 * PANEL_THICKNESS_MM;
  const baseDepth1 = rightD - 2 * PANEL_THICKNESS_MM;
  const baseWidth2 = leftD - 2 * PANEL_THICKNESS_MM;
  const baseDepth2 = depthMm - rightD; // الجزء الباقي من العمق

  // Base
  pieces.push({ id: `${unit.id}_base_1`, widthMm: baseWidth1, heightMm: baseDepth1, materialId: unit.materialId, colorId, colorHex, label: `${label} - قاعدة يمين`, canRotate: true, edgesToBind: ["bottom"] });
  pieces.push({ id: `${unit.id}_base_2`, widthMm: baseWidth2, heightMm: baseDepth2, materialId: unit.materialId, colorId, colorHex, label: `${label} - قاعدة يسار`, canRotate: true, edgesToBind: ["bottom"] });
  
  // Top
  pieces.push({ id: `${unit.id}_top_1`, widthMm: baseWidth1, heightMm: baseDepth1, materialId: unit.materialId, colorId, colorHex, label: `${label} - سقف يمين`, canRotate: true, edgesToBind: ["bottom"] });
  pieces.push({ id: `${unit.id}_top_2`, widthMm: baseWidth2, heightMm: baseDepth2, materialId: unit.materialId, colorId, colorHex, label: `${label} - سقف يسار`, canRotate: true, edgesToBind: ["bottom"] });

  // الأرفف الخشبية فقط إذا لم يكن هناك حل داخلي جاهز
  const internalSolution = unit.cornerConfig?.internalSolution || "fixed_shelf";
  if (internalSolution === "fixed_shelf") {
    const shelfCount = unit.shelfCount || 0;
    for (let i = 0; i < shelfCount; i++) {
      pieces.push({ id: `${unit.id}_shelf_1_${i}`, widthMm: baseWidth1 - 2, heightMm: baseDepth1 - 2, materialId: unit.materialId, colorId, colorHex, label: `${label} - رف يمين ${i + 1}`, canRotate: true, edgesToBind: ["bottom"] });
      pieces.push({ id: `${unit.id}_shelf_2_${i}`, widthMm: baseWidth2 - 2, heightMm: baseDepth2 - 2, materialId: unit.materialId, colorId, colorHex, label: `${label} - رف يسار ${i + 1}`, canRotate: true, edgesToBind: ["bottom"] });
    }
  }

  return pieces;
}

function doorPieces(unit: KitchenUnit, label: string, visualGroupId?: string): CutPiece[] {
  if (unit.doorCount === 0) return [];
  const doorMaterial = unit.doorMaterialId ?? unit.materialId;
  const colorId = unit.doorColorId || unit.colorId || 'default';
  const colorHex = unit.doorColorHex || unit.colorHex || '#D4B896';
  const doorWidth = unit.dimensions.widthMm / unit.doorCount - 4; // خصم فرزات بسيطة
  const pieces: CutPiece[] = [];
  for (let i = 0; i < unit.doorCount; i++) {
    pieces.push({
      id: `${unit.id}_door_${i + 1}`,
      widthMm: doorWidth,
      heightMm: unit.dimensions.heightMm - 4,
      materialId: doorMaterial,
      colorId,
      colorHex,
      label: `${label} - باب ${i + 1}`,
      canRotate: true,
      visualGroupId,
      edgesToBind: ["top", "bottom", "left", "right"], // شريط من 4 اتجاهات
    });
  }
  return pieces;
}

function drawerFrontPieces(unit: KitchenUnit, label: string, visualGroupId?: string): CutPiece[] {
  if (unit.drawerCount === 0) return [];
  const doorMaterial = unit.doorMaterialId ?? unit.materialId;
  const colorId = unit.doorColorId || unit.colorId || 'default';
  const colorHex = unit.doorColorHex || unit.colorHex || '#D4B896';
  const frontHeight = Math.round(unit.dimensions.heightMm / unit.drawerCount - 4);
  const pieces: CutPiece[] = [];
  for (let i = 0; i < unit.drawerCount; i++) {
    pieces.push({
      id: `${unit.id}_drawer_front_${i + 1}`,
      widthMm: unit.dimensions.widthMm - 4,
      heightMm: frontHeight,
      materialId: doorMaterial,
      colorId,
      colorHex,
      label: `${label} - واجهة درج ${i + 1}`,
      canRotate: true,
      visualGroupId,
      edgesToBind: ["top", "bottom", "left", "right"],
    });
  }
  return pieces;
}

function cornerDoorPieces(unit: KitchenUnit, label: string, visualGroupId?: string): CutPiece[] {
  const doorMaterial = unit.doorMaterialId ?? unit.materialId;
  const colorId = unit.doorColorId || unit.colorId || 'default';
  const colorHex = unit.doorColorHex || unit.colorHex || '#D4B896';
  const pieces: CutPiece[] = [];
  
  const doorStyle = unit.cornerConfig?.doorStyle || "bifold_lazy_susan";
  if (doorStyle === "none") return pieces;

  const { widthMm, depthMm, heightMm, leftLegCarcassDepthMm, rightLegCarcassDepthMm } = unit.dimensions;
  const leftD = leftLegCarcassDepthMm || 600;
  const rightD = rightLegCarcassDepthMm || 600;
  
  const doorHeight = heightMm - 4; // خصم بسيط

  if (doorStyle === "bifold_lazy_susan") {
    // ضلفتين متصلتين
    const door1Width = widthMm - leftD - 2; // خصم فرزات
    const door2Width = depthMm - rightD - 2;
    pieces.push({ id: `${unit.id}_corner_door_1`, widthMm: door1Width, heightMm: doorHeight, materialId: doorMaterial, colorId, colorHex, label: `${label} - باب يمين (مطوي)`, canRotate: true, visualGroupId, edgesToBind: ["top", "bottom", "left", "right"] });
    pieces.push({ id: `${unit.id}_corner_door_2`, widthMm: door2Width, heightMm: doorHeight, materialId: doorMaterial, colorId, colorHex, label: `${label} - باب يسار (مطوي)`, canRotate: true, visualGroupId, edgesToBind: ["top", "bottom", "left", "right"] });
  } else if (doorStyle === "diagonal_single") {
    // ضلفة واحدة مشطوفة
    const door1Width = widthMm - leftD;
    const door2Width = depthMm - rightD;
    // طول الوتر
    const diagonalWidth = Math.round(Math.hypot(door1Width, door2Width)) - 4;
    pieces.push({ id: `${unit.id}_corner_door_diag`, widthMm: diagonalWidth, heightMm: doorHeight, materialId: doorMaterial, colorId, colorHex, label: `${label} - باب قطري`, canRotate: true, visualGroupId, edgesToBind: ["top", "bottom", "left", "right"] });
  }

  return pieces;
}

/**
 * يحول وحدة مطبخ واحدة لكل قطع الخشب المطلوبة لتصنيعها
 */
export function unitToCutPieces(unit: KitchenUnit): CutPiece[] {
  const label = unit.label ?? unitTypeLabelAr(unit.type);
  const visualGroupId = `vg_doors_${unit.type}`;
  
  if (unit.type.startsWith('corner')) {
    return [
      ...cornerCarcassPieces(unit, label),
      ...cornerDoorPieces(unit, label, visualGroupId),
      ...drawerFrontPieces(unit, label, visualGroupId),
    ];
  }

  return [
    ...basicCarcassPieces(unit, label),
    ...doorPieces(unit, label, visualGroupId),
    ...drawerFrontPieces(unit, label, visualGroupId),
  ];
}

/**
 * يحول كل وحدات المشروع لقايمة قطع كاملة، مقسّمة حسب الخامة واللون معاً
 * (كل خامة + لون لازم يكون على ألواح منفصلة — الأخضر مع الأخضر، الأبيض مع الأبيض)
 */
export function projectToCutPiecesByMaterial(units: KitchenUnit[]): Record<string, CutPiece[]> {
  const grouped: Record<string, CutPiece[]> = {};
  for (const unit of units) {
    const pieces = unitToCutPieces(unit);
    for (const piece of pieces) {
      // المفتاح = materialId + colorId عشان الألوان المختلفة تكون على ألواح منفصلة
      const key = `${piece.materialId}__${piece.colorId}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(piece);
    }
  }
  return grouped;
}

function unitTypeLabelAr(type: UnitType): string {
  const unitTypeLabels: Record<UnitType, string> = {
    base: "أرضية",
    wall: "علوية",
    tall: "طولية",
    corner_base: "ركنية أرضية",
    corner_wall: "ركنية علوية",
    corner_tall: "ركنية طولية",
    island: "جزيرة",
    drawer_unit: "أدراج",
    loft: "قلاب",
  };
  return unitTypeLabels[type];
}
