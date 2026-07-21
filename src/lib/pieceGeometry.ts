import { CutPiece, PanelNotch } from "@/types";

/**
 * Returns polygon vertices for a cut piece (mm coords, origin top-left).
 * Without notch: 4-point rectangle. With notch: 6-point L-shape.
 */
export function getPiecePolygonPoints(
  widthMm: number,
  heightMm: number,
  notch?: PanelNotch
): { x: number; y: number }[] {
  if (!notch) {
    return [
      { x: 0, y: 0 },
      { x: widthMm, y: 0 },
      { x: widthMm, y: heightMm },
      { x: 0, y: heightMm },
    ];
  }

  const { cornerX, cornerY, notchWidthMm, notchDepthMm } = notch;
  const w = widthMm;
  const h = heightMm;
  const nw = Math.max(0, Math.min(notchWidthMm, w));
  const nd = Math.max(0, Math.min(notchDepthMm, h));

  const leftX = cornerX === "left";
  const topY = cornerY === "front";

  if (leftX && topY) {
    return [
      { x: nw, y: 0 },
      { x: w, y: 0 },
      { x: w, y: h },
      { x: 0, y: h },
      { x: 0, y: nd },
      { x: nw, y: nd },
    ];
  }
  if (leftX && !topY) {
    const y1 = h - nd;
    return [
      { x: 0, y: 0 },
      { x: w, y: 0 },
      { x: w, y: h },
      { x: nw, y: h },
      { x: nw, y: y1 },
      { x: 0, y: y1 },
    ];
  }
  if (!leftX && topY) {
    return [
      { x: 0, y: 0 },
      { x: w - nw, y: 0 },
      { x: w - nw, y: nd },
      { x: w, y: nd },
      { x: w, y: h },
      { x: 0, y: h },
    ];
  }
  // right + back
  const y1 = h - nd;
  return [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: y1 },
    { x: w - nw, y: y1 },
    { x: w - nw, y: h },
    { x: 0, y: h },
  ];
}

/**
 * يحسب المساحة الفعلية للقطعة (مم²)
 * لو فيها نوتش (شكل L)، بيخخص مساحة النوتش من المساحة الكلية
 */
export function getPieceActualAreaMm2(widthMm: number, heightMm: number, notch?: PanelNotch): number {
  const totalArea = widthMm * heightMm;
  
  if (!notch) return totalArea;
  
  const { notchWidthMm, notchDepthMm } = notch;
  // مساحة النوتش = عرض النوتش × عمق النوتش
  const notchArea = Math.min(notchWidthMm, widthMm) * Math.min(notchDepthMm, heightMm);
  
  return totalArea - notchArea;
}

/**
 * يحسب أطوال الأضلاع المطلوب شريط الحرف لها (مم)
 * بيخصم الأضلاع اللي فيها نوتش
 */
export function getPieceEdgeLengthsMm(
  widthMm: number,
  heightMm: number,
  edgesToBind?: ("top" | "bottom" | "left" | "right")[],
  notch?: PanelNotch
): { top: number; bottom: number; left: number; right: number } {
  const defaultEdges = { top: widthMm, bottom: widthMm, left: heightMm, right: heightMm };
  
  if (!edgesToBind || edgesToBind.length === 0) {
    // لو مفيش أضلاع محددة، بنحسب المحيط كامل
    return defaultEdges;
  }
  
  if (!notch) {
    return {
      top: edgesToBind.includes("top") ? widthMm : 0,
      bottom: edgesToBind.includes("bottom") ? widthMm : 0,
      left: edgesToBind.includes("left") ? heightMm : 0,
      right: edgesToBind.includes("right") ? heightMm : 0,
    };
  }
  
  // لو فيه نوتش، لازم نحسب الجزء المتبقي من كل ضلع
  const { cornerX, cornerY, notchWidthMm, notchDepthMm } = notch;
  const nw = Math.min(notchWidthMm, widthMm);
  const nd = Math.min(notchDepthMm, heightMm);
  
  let topLen = edgesToBind.includes("top") ? widthMm : 0;
  let bottomLen = edgesToBind.includes("bottom") ? widthMm : 0;
  let leftLen = edgesToBind.includes("left") ? heightMm : 0;
  let rightLen = edgesToBind.includes("right") ? heightMm : 0;
  
  // تعديل الأطوال حسب موقع النوتش
  if (cornerX === "left") {
    if (edgesToBind.includes("top")) topLen = widthMm - nw;
    if (edgesToBind.includes("bottom")) bottomLen = widthMm - nw;
    if (edgesToBind.includes("left")) leftLen = heightMm - nd;
  } else {
    if (edgesToBind.includes("top")) topLen = widthMm - nw;
    if (edgesToBind.includes("bottom")) bottomLen = widthMm - nw;
    if (edgesToBind.includes("right")) rightLen = heightMm - nd;
  }
  
  return {
    top: topLen,
    bottom: bottomLen,
    left: leftLen,
    right: rightLen,
  };
}

export function piecePolygonPointsString(piece: CutPiece, offsetXMm = 0, offsetYMm = 0): string {
  const w = piece.widthMm;
  const h = piece.heightMm;
  return getPiecePolygonPoints(w, h, piece.notch)
    .map((p) => `${offsetXMm + p.x},${offsetYMm + p.y}`)
    .join(" ");
}
