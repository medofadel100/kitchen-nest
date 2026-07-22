import { KitchenUnit, CutPiece, UnitType, StructuralObstacle, PanelNotch } from "@/types";

// قواعد بناء جسم كل نوع وحدة: كام قطعة، وأبعادها بالنسبة لأبعاد الوحدة الكلية
// دي قواعد نجارة قياسية مبسطة - قابلة للتفصيل أكتر لاحقًا (مثلاً سمك الخشب المستخدم في الحسبة)

const PANEL_THICKNESS_MM = 18; // سمك اللوح الافتراضي المستخدم في خصم الأبعاد

function basicCarcassPieces(unit: KitchenUnit, label: string): CutPiece[] {
  const { widthMm, depthMm, heightMm } = unit.dimensions;
  const colorId = unit.colorId || 'default';
  const colorHex = unit.colorHex || '#D4B896';
  const pieces: CutPiece[] = [];

  // Handle sink base unit - no shelves, cut back panel for plumbing
  if (unit.isSinkBase) {
    // جانبين (يمين ويسار) - بعمق الوحدة وارتفاعها
    pieces.push({
      id: `${unit.id}_side_left`,
      widthMm: depthMm,
      heightMm: heightMm,
      materialId: unit.materialId,
      colorId,
      colorHex,
      label: `${label} - جانب شمال`,
      canRotate: true,
      edgesToBind: ["left", "bottom"],
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
      edgesToBind: ["bottom"],
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

    // ظهر مقطوع (نصف الارتفاع فقط لمرور المواسير)
    const backHeight = Math.round(heightMm * 0.6);
    pieces.push({
      id: `${unit.id}_back`,
      widthMm: innerWidth,
      heightMm: backHeight,
      materialId: unit.materialId,
      colorId,
      colorHex,
      label: `${label} - ظهر (مقطوع)`,
      canRotate: true,
      edgesToBind: [],
    });

    // ⛔ لا أرفف داخلية في وحدة الحوض
    return pieces;
  }

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
 * يبني قطع الكاركاس حول عائق إنشائي (عمود)
 * القطعة الواحدة تكون بشكلها الأصلي، لكن الزاوية اللي بيحتلها العمود تتقرض (Notch)
 * 
 * الحساب الصحيح الموحّد:
 *   localObsLeft/Right  = حدود منطقة الاستبعاد بالنسبة لبداية الوحدة (0..widthMm)
 *   PT                  = PANEL_THICKNESS_MM (سُمك الجانب — يُطرح مرة واحدة بس)
 *   obsExcludeLeft/Right= حدود منطقة الاستبعاد داخل الفضاء الداخلي (0..innerWidth)
 *   notchWidth          = عرض الجزء المقروض (منطقة الاستبعاد)
 *   notchDepth          = عمق التغرغر (عمق العمود + الخلوص)
 */
function obstacleAwareCarcassPieces(
  unit: KitchenUnit,
  obstacle: StructuralObstacle,
  clearanceMm: number,
  label: string
): CutPiece[] {
  const { widthMm, depthMm, heightMm } = unit.dimensions;
  const colorId = unit.colorId || 'default';
  const colorHex = unit.colorHex || '#D4B896';
  const pieces: CutPiece[] = [];

  // موضع حافتي منطقة الاستبعاد بالنسبة لبداية الوحدة المحلية (0..widthMm)
  const localObsLeft  = obstacle.xMm - unit.position.xMm - clearanceMm;
  const localObsRight = obstacle.xMm + obstacle.widthMm - unit.position.xMm + clearanceMm;

  // تحديد الزاوية: هل العمود لاصق يمين ولا شمال الوحدة؟
  const isNearRightEdge = localObsRight >= widthMm;

  // حساب عرض النوتش (منطقة الاستبعاد)
  const notchWidth = Math.min(localObsRight, widthMm) - Math.max(localObsLeft, 0);
  
  // حساب عمق النوتش (عمق العمود + الخلوص)
  const notchDepth = obstacle.depthMm + clearanceMm;

  // جهة العمود: يسار أو يمين الوحدة
  const columnSide: "left" | "right" = isNearRightEdge ? "right" : "left";

  const sidePanelNotch = (side: "left" | "right"): PanelNotch | undefined => {
    if (side !== columnSide) return undefined;
    return {
      cornerX: side === "left" ? "left" : "right",
      cornerY: "back",
      notchWidthMm: notchDepth,
      notchDepthMm: notchWidth,
    };
  };

  // --- الجانبان: قطعتان كاملتان، النوتش على الجانب المتأثر فقط ---
  pieces.push({
    id: `${unit.id}_side_left`,
    widthMm: depthMm,
    heightMm: heightMm,
    materialId: unit.materialId,
    colorId,
    colorHex,
    label: `${label} - جانب شمال${columnSide === "left" ? " (بها فتحة عمود)" : ""}`,
    canRotate: false,
    edgesToBind: ["left", "bottom"],
    notch: sidePanelNotch("left"),
  });
  pieces.push({
    id: `${unit.id}_side_right`,
    widthMm: depthMm,
    heightMm: heightMm,
    materialId: unit.materialId,
    colorId,
    colorHex,
    label: `${label} - جانب يمين${columnSide === "right" ? " (بها فتحة عمود)" : ""}`,
    canRotate: false,
    edgesToBind: ["left", "bottom"],
    notch: sidePanelNotch("right"),
  });

  // --- القاعدة والسقف (قطعة واحدة + notch) ---
  const innerWidth = widthMm - 2 * PANEL_THICKNESS_MM;
  
  // القاعدة: قطعة واحدة بعرضها الأصلي، لكن فيها نوتش
  const horizontalNotch: PanelNotch = {
    cornerX: columnSide,
    cornerY: "back",
    notchWidthMm: notchWidth,
    notchDepthMm: notchDepth,
  };
  
  pieces.push({
    id: `${unit.id}_base`,
    widthMm: innerWidth,
    heightMm: depthMm,
    materialId: unit.materialId,
    colorId,
    colorHex,
    label: `${label} - قاعدة (بها فتحة عمود)`,
    canRotate: false, // القطعة بها نوتش، متلفش عشوائي
    edgesToBind: ["bottom"],
    notch: horizontalNotch,
  });

  // السقف: نفس المنطق بالظبط
  pieces.push({
    id: `${unit.id}_top`,
    widthMm: innerWidth,
    heightMm: depthMm,
    materialId: unit.materialId,
    colorId,
    colorHex,
    label: `${label} - سقف (بها فتحة عمود)`,
    canRotate: false,
    edgesToBind: ["bottom"],
    notch: horizontalNotch,
  });

  // --- الظهر (عمودي): النوتش على بعد الارتفاع (cornerY) وليس العمق الكامل ---
  const backNotch: PanelNotch = {
    cornerX: columnSide,
    cornerY: "back",
    notchWidthMm: notchWidth,
    notchDepthMm: notchDepth,
  };
  
  pieces.push({
    id: `${unit.id}_back`,
    widthMm: innerWidth,
    heightMm: heightMm,
    materialId: unit.materialId,
    colorId,
    colorHex,
    label: `${label} - ظهر (بها فتحة عمود)`,
    canRotate: false,
    edgesToBind: [],
    notch: backNotch,
  });

  // --- الأرفف (لو بتقع في نفس منسوب العمود) ---
  const shelfCount = unit.shelfCount || 0;
  for (let i = 0; i < shelfCount; i++) {
    // الرف عمودي: النوتش يبقى في الخلف (cornerY: back)
    const shelfNotch: PanelNotch = {
      cornerX: columnSide,
      cornerY: "back",
      notchWidthMm: notchWidth,
      notchDepthMm: notchDepth,
    };
    
    pieces.push({
      id: `${unit.id}_shelf_${i + 1}`,
      widthMm: innerWidth,
      heightMm: depthMm - 20,
      materialId: unit.materialId,
      colorId,
      colorHex,
      label: `${label} - رف ${i + 1} (بها فتحة عمود)`,
      canRotate: false,
      edgesToBind: ["bottom"],
      notch: shelfNotch,
    });
  }

  // --- تغطية كل الوفوهات الداخلية للعمود بالخشب ---
  // المبدأ: كل وجة من وجوه العمود اللي جوه الوحدة لازم يتغطى بالخشب
  // عشان الوحدة تكون محكمة من جوه ومفيش خرسانة باينة
  //
  // أمثلة:
  //   - عمود عند يمين الوحدة: وجه واحد (شمال) ← غطاء واحد
  //   - عمود عند زاوية يمين-خلف: ووجهين (شمال + أمامي) ← غطاءين
  //   - عمود في منتصف الظهر: تلات وجوه (شمال + يمين + أمامي) ← 3 أغطية
  //   - عمود في النص تماماً: 4 وجوه ← 4 أغطية

  const coverHeight = heightMm;
  const unitLeft = unit.position.xMm;
  const unitRight = unit.position.xMm + widthMm;
  const unitBack = unit.position.yMm;
  const unitFront = unit.position.yMm + depthMm;

  const obsLeft = obstacle.xMm;
  const obsRight = obstacle.xMm + obstacle.widthMm;
  const obsBack = obstacle.yMm;
  const obsFront = obstacle.yMm + obstacle.depthMm;

  let coverIndex = 0;

  // 1. الوجه الأيسر للعمود (x = obsLeft) — لو جوه الوحدة
  if (obsLeft > unitLeft + clearanceMm) {
    coverIndex++;
    pieces.push({
      id: `${unit.id}_column_cover_${coverIndex}`,
      widthMm: obstacle.depthMm + clearanceMm,
      heightMm: coverHeight,
      materialId: unit.materialId,
      colorId,
      colorHex,
      label: `${label} - غطاء عمود (وجه شمال)`,
      canRotate: false,
      edgesToBind: ["top", "bottom", "left", "right"],
    });
  }

  // 2. الوجه الأيمن للعمود (x = obsRight) — لو جوه الوحدة
  if (obsRight < unitRight - clearanceMm) {
    coverIndex++;
    pieces.push({
      id: `${unit.id}_column_cover_${coverIndex}`,
      widthMm: obstacle.depthMm + clearanceMm,
      heightMm: coverHeight,
      materialId: unit.materialId,
      colorId,
      colorHex,
      label: `${label} - غطاء عمود (وجه يمين)`,
      canRotate: false,
      edgesToBind: ["top", "bottom", "left", "right"],
    });
  }

  // 3. الوجه الأمامي للعمود (y = obsFront) — لو جوه الوحدة
  if (obsFront < unitFront - clearanceMm) {
    coverIndex++;
    pieces.push({
      id: `${unit.id}_column_cover_${coverIndex}`,
      widthMm: obstacle.widthMm + 2 * clearanceMm,
      heightMm: coverHeight,
      materialId: unit.materialId,
      colorId,
      colorHex,
      label: `${label} - غطاء عمود (وجه أمامي)`,
      canRotate: false,
      edgesToBind: ["top", "bottom", "left", "right"],
    });
  }

  // 4. الوجه الخلفي للعمود (y = obsBack) — لو جوه الوحدة
  if (obsBack > unitBack + clearanceMm) {
    coverIndex++;
    pieces.push({
      id: `${unit.id}_column_cover_${coverIndex}`,
      widthMm: obstacle.widthMm + 2 * clearanceMm,
      heightMm: coverHeight,
      materialId: unit.materialId,
      colorId,
      colorHex,
      label: `${label} - غطاء عمود (وجه خلفي)`,
      canRotate: false,
      edgesToBind: ["top", "bottom", "left", "right"],
    });
  }

  return pieces;
}


/**
 * يبني قطع الكاركاس لوحدة إحاطة جهاز (زي التلاجة)
 * بيعمل تجويف للجهاز جوه الوحدة
 */
function applianceHousingCarcassPieces(
  unit: KitchenUnit,
  applianceHeightMm: number,
  config: NonNullable<KitchenUnit['applianceHousingConfig']>,
  label: string
): CutPiece[] {
  const { widthMm, depthMm, heightMm } = unit.dimensions;
  const colorId = unit.colorId || 'default';
  const colorHex = unit.colorHex || '#D4B896';
  const pieces: CutPiece[] = [];

  const { clearanceMm, hasBaseUnderneath } = config;

  // حساب أبعاد التجويف الداخلي للجهاز
  const cavityWidth = widthMm - clearanceMm.leftMm - clearanceMm.rightMm;
  const cavityDepth = depthMm - clearanceMm.backMm;
  const cavityTop = heightMm - clearanceMm.topMm - applianceHeightMm;

  // --- الجانبين (يمين ويسار) ---
  // الجانب الأيسر: بعرض كامل
  pieces.push({
    id: `${unit.id}_side_left`,
    widthMm: depthMm,
    heightMm: heightMm,
    materialId: unit.materialId,
    colorId, colorHex,
    label: `${label} - جانب شمال`,
    canRotate: true,
    edgesToBind: ["left", "bottom"],
  });
  // الجانب الأيمن
  pieces.push({
    id: `${unit.id}_side_right`,
    widthMm: depthMm,
    heightMm: heightMm,
    materialId: unit.materialId,
    colorId, colorHex,
    label: `${label} - جانب يمين`,
    canRotate: true,
    edgesToBind: ["left", "bottom"],
  });

  // --- القاعدة ---
  const innerWidth = widthMm - 2 * PANEL_THICKNESS_MM;
  if (hasBaseUnderneath) {
    // قاعدة كاملة تحت الجهاز
    pieces.push({
      id: `${unit.id}_base`,
      widthMm: innerWidth,
      heightMm: depthMm,
      materialId: unit.materialId,
      colorId, colorHex,
      label: `${label} - قاعدة`,
      canRotate: true,
      edgesToBind: ["bottom"],
    });
  }

  // --- السقف (فوق الجهاز) ---
  pieces.push({
    id: `${unit.id}_top`,
    widthMm: innerWidth,
    heightMm: depthMm,
    materialId: unit.materialId,
    colorId, colorHex,
    label: `${label} - سقف`,
    canRotate: true,
    edgesToBind: ["bottom"],
  });

  // --- الظهر (مقطوع في منطقة الجهاز للتهوية) ---
  // الظهر العلوي (فوق الجهاز)
  if (cavityTop > 0) {
    pieces.push({
      id: `${unit.id}_back_upper`,
      widthMm: innerWidth,
      heightMm: cavityTop,
      materialId: unit.materialId,
      colorId, colorHex,
      label: `${label} - ظهر علوي`,
      canRotate: true,
      edgesToBind: [],
    });
  }
  // الظهر السفلي (تحت الجهاز)
  const lowerBackHeight = hasBaseUnderneath ? PANEL_THICKNESS_MM : 0;
  if (lowerBackHeight > 0) {
    pieces.push({
      id: `${unit.id}_back_lower`,
      widthMm: innerWidth,
      heightMm: lowerBackHeight,
      materialId: unit.materialId,
      colorId, colorHex,
      label: `${label} - ظهر سفلي`,
      canRotate: true,
      edgesToBind: [],
    });
  }

  // --- الأرفف (فوق الجهاز فقط) ---
  const shelfCount = unit.shelfCount || 0;
  if (shelfCount > 0 && cavityTop > 100) {
    // الأرفف تكون في المساحة الفاضية فوق الجهاز
    const shelfSpace = cavityTop - 40; // خصم بسيط
    const shelfH = Math.min(depthMm - 20, shelfSpace / (shelfCount + 1));
    for (let i = 0; i < shelfCount; i++) {
      pieces.push({
        id: `${unit.id}_shelf_${i + 1}`,
        widthMm: innerWidth,
        heightMm: shelfH,
        materialId: unit.materialId,
        colorId, colorHex,
        label: `${label} - رف ${i + 1}`,
        canRotate: true,
        edgesToBind: ["bottom"],
      });
    }
  }

  return pieces;
}

/**
 * يحول وحدة مطبخ واحدة لكل قطع الخشب المطلوبة لتصنيعها
 * مع مراعاة العوائق الإنشائية وإعدادات إحاطة الأجهزة
 */
export function unitToCutPieces(
  unit: KitchenUnit,
  obstacles?: StructuralObstacle[],
  applianceHeightMm?: number
): CutPiece[] {
  const label = unit.label ?? unitTypeLabelAr(unit.type);
  const visualGroupId = `vg_doors_${unit.type}`;
  
  // 🏗️ إذا كانت الوحدة فيها تكيف مع عائق إنشائي
  if (unit.obstacleFit && obstacles) {
    const obstacle = obstacles.find(o => o.id === unit.obstacleFit!.obstacleId);
    if (obstacle) {
      return [
        ...obstacleAwareCarcassPieces(unit, obstacle, unit.obstacleFit.clearanceMm, label),
        ...doorPieces(unit, label, visualGroupId),
        ...drawerFrontPieces(unit, label, visualGroupId),
      ];
    }
  }

  // 🏗️ إذا كانت الوحدة فيها إعدادات إحاطة جهاز
  if (unit.applianceHousingConfig) {
    const appHeight = applianceHeightMm || unit.dimensions.heightMm * 0.7; // افتراضي 70% من ارتفاع الوحدة
    return [
      ...applianceHousingCarcassPieces(unit, appHeight, unit.applianceHousingConfig, label),
      ...(unit.applianceHousingConfig.removeDoorAtApplianceZone
        ? [] // لا أبواب في منطقة الجهاز
        : doorPieces(unit, label, visualGroupId)
      ),
      ...drawerFrontPieces(unit, label, visualGroupId),
    ];
  }

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
export function projectToCutPiecesByMaterial(
  units: KitchenUnit[],
  obstacles?: StructuralObstacle[],
  applianceHeights?: Record<string, number>
): Record<string, CutPiece[]> {
  const grouped: Record<string, CutPiece[]> = {};
  for (const unit of units) {
    const appHeight = applianceHeights?.[unit.id];
    const pieces = unitToCutPieces(unit, obstacles, appHeight);
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
    corner_loft: "ركن قلاب",
    pantry_pullout: "مخزن سحب",
    base_appliance_housing: "هوسنج جهاز سفلي",
    tall_appliance_housing: "هوسنج جهاز طولي",
    range_hood_hermy: "شفاط هرمي",
    range_hood_island: "شفاط جزيرة",
    range_hood_curved: "شفاط كيرف",
    range_hood_wall: "شفاط معلق",
    open_shelf: "رف مفتوح",
  };
  return unitTypeLabels[type];
}