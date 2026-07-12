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

export function piecePolygonPointsString(piece: CutPiece, offsetXMm = 0, offsetYMm = 0): string {
  const w = piece.widthMm;
  const h = piece.heightMm;
  return getPiecePolygonPoints(w, h, piece.notch)
    .map((p) => `${offsetXMm + p.x},${offsetYMm + p.y}`)
    .join(" ");
}
