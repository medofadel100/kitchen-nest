import { CutPiece, PlacedPiece, NestingSheetResult, NestingResult, StandardSheetSize, Material } from "@/types";

const SAW_KERF_MM = 4; // سُمك شفرة المنشار

interface FreeRect {
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
}

function splitFreeRect(free: FreeRect, placed: { widthMm: number; heightMm: number }): FreeRect[] {
  const results: FreeRect[] = [];
  const rightWidth = free.widthMm - placed.widthMm - SAW_KERF_MM;
  const bottomHeight = free.heightMm - placed.heightMm - SAW_KERF_MM;

  const vSplitRightArea = rightWidth * free.heightMm;
  const vSplitBottomArea = placed.widthMm * bottomHeight;
  const maxVArea = Math.max(vSplitRightArea, vSplitBottomArea);

  const hSplitRightArea = rightWidth * placed.heightMm;
  const hSplitBottomArea = free.widthMm * bottomHeight;
  const maxHArea = Math.max(hSplitRightArea, hSplitBottomArea);

  if (maxVArea > maxHArea) {
    if (rightWidth > 0) {
      results.push({ xMm: free.xMm + placed.widthMm + SAW_KERF_MM, yMm: free.yMm, widthMm: rightWidth, heightMm: free.heightMm });
    }
    if (bottomHeight > 0) {
      results.push({ xMm: free.xMm, yMm: free.yMm + placed.heightMm + SAW_KERF_MM, widthMm: placed.widthMm, heightMm: bottomHeight });
    }
  } else {
    if (rightWidth > 0) {
      results.push({ xMm: free.xMm + placed.widthMm + SAW_KERF_MM, yMm: free.yMm, widthMm: rightWidth, heightMm: placed.heightMm });
    }
    if (bottomHeight > 0) {
      results.push({ xMm: free.xMm, yMm: free.yMm + placed.heightMm + SAW_KERF_MM, widthMm: free.widthMm, heightMm: bottomHeight });
    }
  }

  return results;
}

function packOneSheet(
  sortedPieces: CutPiece[],
  sheetSize: StandardSheetSize
): { placed: PlacedPiece[]; remaining: CutPiece[] } {
  let freeRects: FreeRect[] = [{ xMm: 0, yMm: 0, widthMm: sheetSize.widthMm, heightMm: sheetSize.heightMm }];
  const placed: PlacedPiece[] = [];
  const remaining: CutPiece[] = [];

  for (const piece of sortedPieces) {
    let bestRectIndex = -1;
    let bestRotated = false;
    let bestWaste = Infinity;

    for (let i = 0; i < freeRects.length; i++) {
      const rect = freeRects[i];
      if (piece.widthMm <= rect.widthMm && piece.heightMm <= rect.heightMm) {
        const waste = rect.widthMm * rect.heightMm - piece.widthMm * piece.heightMm;
        if (waste < bestWaste) {
          bestWaste = waste;
          bestRectIndex = i;
          bestRotated = false;
        }
      }
      if (piece.canRotate && piece.heightMm <= rect.widthMm && piece.widthMm <= rect.heightMm) {
        const waste = rect.widthMm * rect.heightMm - piece.widthMm * piece.heightMm;
        if (waste < bestWaste) {
          bestWaste = waste;
          bestRectIndex = i;
          bestRotated = true;
        }
      }
    }

    if (bestRectIndex === -1) {
      remaining.push(piece);
      continue;
    }

    const rect = freeRects[bestRectIndex];
    const placedWidth = bestRotated ? piece.heightMm : piece.widthMm;
    const placedHeight = bestRotated ? piece.widthMm : piece.heightMm;

    placed.push({
      ...piece,
      xMm: rect.xMm,
      yMm: rect.yMm,
      rotated: bestRotated,
    });

    const newFree = splitFreeRect(rect, { widthMm: placedWidth, heightMm: placedHeight });
    freeRects.splice(bestRectIndex, 1, ...newFree);
  }

  return { placed, remaining };
}

type SortStrategy = (a: CutPiece, b: CutPiece) => number;

const STRATEGIES: SortStrategy[] = [
  (a, b) => (b.widthMm * b.heightMm) - (a.widthMm * a.heightMm), // بالمساحة
  (a, b) => b.heightMm - a.heightMm, // بالطول
  (a, b) => b.widthMm - a.widthMm, // بالعرض
  (a, b) => Math.max(b.widthMm, b.heightMm) - Math.max(a.widthMm, a.heightMm), // بأطول ضلع
];

function applySortingStrategy(pieces: CutPiece[], strategy: SortStrategy, requiresColorMatching: boolean): CutPiece[] {
  if (requiresColorMatching) {
    const groups: Record<string, CutPiece[]> = {};
    const noGroup: CutPiece[] = [];
    
    pieces.forEach(p => {
      if (p.visualGroupId) {
        if (!groups[p.visualGroupId]) groups[p.visualGroupId] = [];
        groups[p.visualGroupId].push(p);
      } else {
        noGroup.push(p);
      }
    });

    // رتب القطع داخل كل مجموعة
    Object.values(groups).forEach(g => g.sort(strategy));
    noGroup.sort(strategy);

    // رتب المجموعات نفسها بالمساحة الكلية للمجموعة (من الأكبر للأصغر)
    const sortedGroups = Object.values(groups).sort((a, b) => {
      const areaA = a.reduce((sum, p) => sum + p.widthMm * p.heightMm, 0);
      const areaB = b.reduce((sum, p) => sum + p.widthMm * p.heightMm, 0);
      return areaB - areaA;
    });

    return [...sortedGroups.flat(), ...noGroup];
  } else {
    return [...pieces].sort(strategy);
  }
}

function calculateNestingWithStrategy(pieces: CutPiece[], material: Material, strategy: SortStrategy): NestingResult {
  const sheets: NestingSheetResult[] = [];
  
  // نعيد تقييم القطع لمنع الدوران لو الخامة ليها اتجاه عرق
  let remainingPieces = pieces.map(p => ({
    ...p,
    canRotate: material.hasGrainDirection ? false : p.canRotate
  }));

  // نطبق استراتيجية الترتيب
  remainingPieces = applySortingStrategy(remainingPieces, strategy, material.requiresColorMatching || false);

  let sheetIndex = 0;
  const maxSheets = 200;

  while (remainingPieces.length > 0 && sheetIndex < maxSheets) {
    const { placed, remaining } = packOneSheet(remainingPieces, material.standardSheet);

    if (placed.length === 0) {
      break; // القطعة المتبقية أكبر من اللوح!
    }

    const sheetAreaM2 = (material.standardSheet.widthMm * material.standardSheet.heightMm) / 1_000_000;
    const usedAreaM2 = placed.reduce((sum, p) => sum + (p.widthMm * p.heightMm) / 1_000_000, 0);
    const firstPiece = placed[0];

    sheets.push({
      sheetIndex,
      materialId: material.id,
      colorId: firstPiece?.colorId || 'default',
      colorHex: firstPiece?.colorHex || material.colorHex || '#D4B896',
      sheetSize: material.standardSheet,
      placedPieces: placed,
      usedAreaM2,
      wasteAreaM2: sheetAreaM2 - usedAreaM2,
      utilizationPercent: (usedAreaM2 / sheetAreaM2) * 100,
    });

    remainingPieces = remaining;
    sheetIndex++;
  }

  return {
    materialId: material.id,
    sheets,
    unplacedPieces: remainingPieces,
  };
}

export function nestPiecesForMaterial(pieces: CutPiece[], material: Material): NestingResult {
  let bestResult: NestingResult | null = null;

  // نجرب كل استراتيجيات الترتيب ونختار الأقل في عدد الألواح ثم الأعلى استغلالًا
  for (const strategy of STRATEGIES) {
    const result = calculateNestingWithStrategy(pieces, material, strategy);
    
    if (!bestResult) {
      bestResult = result;
      continue;
    }

    const currentSheetsCount = result.sheets.length;
    const bestSheetsCount = bestResult.sheets.length;

    if (currentSheetsCount < bestSheetsCount) {
      bestResult = result;
    } else if (currentSheetsCount === bestSheetsCount) {
      // Tie breaker: Average utilization
      const currentAvgUtil = result.sheets.reduce((sum, s) => sum + s.utilizationPercent, 0) / currentSheetsCount || 0;
      const bestAvgUtil = bestResult.sheets.reduce((sum, s) => sum + s.utilizationPercent, 0) / bestSheetsCount || 0;
      
      if (currentAvgUtil > bestAvgUtil) {
        bestResult = result;
      }
    }
  }

  return bestResult!;
}
