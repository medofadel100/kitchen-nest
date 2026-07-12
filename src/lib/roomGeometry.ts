// ============================================================
// Room Geometry Utilities - Non-Rectangular Room Support
// دعم الغرف غير المستطيلة
// ============================================================

import { RoomWall } from '@/types';

/**
 * Convert polygon points to RoomWall array
 * تحويل نقاط المضلع إلى مصفوفة الحيطان
 * @param polygonMm - Array of polygon points
 * @param closed - Whether to close the shape (default: true)
 */
export function getWallsFromPolygon(polygonMm: { xMm: number; yMm: number }[], closed: boolean = true): RoomWall[] {
  const walls: RoomWall[] = [];
  const count = closed ? polygonMm.length : polygonMm.length - 1;
  
  for (let i = 0; i < count; i++) {
    const start = polygonMm[i];
    const end = closed ? polygonMm[(i + 1) % polygonMm.length] : polygonMm[i + 1];
    const lengthMm = Math.hypot(end.xMm - start.xMm, end.yMm - start.yMm);
    const angleDeg = Math.atan2(end.yMm - start.yMm, end.xMm - start.xMm) * (180 / Math.PI);
    walls.push({
      id: `wall_${i}`,
      startPoint: start,
      endPoint: end,
      lengthMm,
      angleDeg,
    });
  }
  return walls;
}

/**
 * Convert wall list to polygon points
 * تحويل قائمة الحيطان إلى نقاط المضلع
 * 
 * @param walls - Array of { lengthMm, angleDeg } where angleDeg is the turn angle from the previous wall
 * @returns Array of polygon points starting from (0,0)
 */
export function wallListToPolygon(walls: { lengthMm: number; angleDeg: number }[]): { xMm: number; yMm: number }[] {
  const points = [{ xMm: 0, yMm: 0 }];
  let currentAngle = 0;
  for (const wall of walls) {
    currentAngle += wall.angleDeg;
    const rad = currentAngle * (Math.PI / 180);
    const last = points[points.length - 1];
    points.push({
      xMm: last.xMm + wall.lengthMm * Math.cos(rad),
      yMm: last.yMm + wall.lengthMm * Math.sin(rad),
    });
  }
  return points;
}

/**
 * Calculate the bounding box of a polygon
 * حساب مربع الحدود للمضلع
 */
export function getPolygonBoundingBox(polygonMm: { xMm: number; yMm: number }[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (polygonMm.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  const xs = polygonMm.map(p => p.xMm);
  const ys = polygonMm.map(p => p.yMm);
  
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Snap angle to common angles (90, 45, 135, 180, etc.)
 * تصحيح الزاوية للزوايا الشائعة
 */
export function snapAngleToCommon(angleDeg: number, thresholdDeg: number = 10): number {
  const commonAngles = [0, 45, 90, 135, 180, -45, -90, -135, -180];
  
  for (const common of commonAngles) {
    if (Math.abs(angleDeg - common) <= thresholdDeg) {
      return common;
    }
  }
  
  // Also check for angles close to 0/180 (straight line)
  if (Math.abs(Math.abs(angleDeg) - 180) <= thresholdDeg) {
    return angleDeg > 0 ? 180 : -180;
  }
  
  return angleDeg;
}

/**
 * Check if polygon is closed (first and last points are close)
 * التحقق من أن المضلع مغلق
 */
export function isPolygonClosed(polygonMm: { xMm: number; yMm: number }[], thresholdMm: number = 50): boolean {
  if (polygonMm.length < 3) return false;
  
  const first = polygonMm[0];
  const last = polygonMm[polygonMm.length - 1];
  const dist = Math.hypot(last.xMm - first.xMm, last.yMm - first.yMm);
  
  return dist < thresholdMm;
}

/**
 * Get the world position of a fixture from wallId and positionAlongWall
 * الحصول على الموضع العالمي للفتحة من wallId و positionAlongWall
 */
export function getFixtureWorldPosition(
  wall: RoomWall,
  positionAlongWallMm: number,
  widthMm: number
): { xMm: number; yMm: number; rotationDeg: number } {
  const rad = wall.angleDeg * (Math.PI / 180);
  const xMm = wall.startPoint.xMm + positionAlongWallMm * Math.cos(rad);
  const yMm = wall.startPoint.yMm + positionAlongWallMm * Math.sin(rad);
  
  return {
    xMm,
    yMm,
    rotationDeg: wall.angleDeg,
  };
}

/**
 * Get the wall that contains a point (for placing fixtures)
 * الحصول على الحيطة التي تحتوي على نقطة (لوضع الفتحات)
 */
export function getWallContainingPoint(
  point: { xMm: number; yMm: number },
  walls: RoomWall[],
  thresholdMm: number = 100
): RoomWall | null {
  for (const wall of walls) {
    const dist = pointToLineDistance(point, wall.startPoint, wall.endPoint);
    if (dist < thresholdMm) {
      return wall;
    }
  }
  return null;
}

/**
 * Calculate distance from point to line segment
 * حساب المسافة من النقطة إلى خط
 */
function pointToLineDistance(
  point: { xMm: number; yMm: number },
  lineStart: { xMm: number; yMm: number },
  lineEnd: { xMm: number; yMm: number }
): number {
  const A = point.xMm - lineStart.xMm;
  const B = point.yMm - lineStart.yMm;
  const C = lineEnd.xMm - lineStart.xMm;
  const D = lineEnd.yMm - lineStart.yMm;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = lineStart.xMm;
    yy = lineStart.yMm;
  } else if (param > 1) {
    xx = lineEnd.xMm;
    yy = lineEnd.yMm;
  } else {
    xx = lineStart.xMm + param * C;
    yy = lineStart.yMm + param * D;
  }

  const dx = point.xMm - xx;
  const dy = point.yMm - yy;
  
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Snap a point to ortho (90°) angles relative to a reference point
 */
export function pointAtDistance(
  from: { xMm: number; yMm: number },
  to: { xMm: number; yMm: number },
  distanceMm: number,
  ortho: boolean
): { xMm: number; yMm: number } {
  const target = ortho ? snapToOrtho(from, to) : to;
  const dx = target.xMm - from.xMm;
  const dy = target.yMm - from.yMm;
  const angle = Math.atan2(dy, dx);
  return {
    xMm: from.xMm + distanceMm * Math.cos(angle),
    yMm: from.yMm + distanceMm * Math.sin(angle),
  };
}

/** Minimum vertices required to close a room polygon */
export const MIN_ROOM_POLYGON_VERTICES = 4;

export function snapToOrtho(
  fromPoint: { xMm: number; yMm: number },
  toPoint: { xMm: number; yMm: number }
): { xMm: number; yMm: number } {
  const dx = toPoint.xMm - fromPoint.xMm;
  const dy = toPoint.yMm - fromPoint.yMm;
  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  const snappedAngle = Math.round(angle / (Math.PI / 2)) * (Math.PI / 2);
  return {
    xMm: fromPoint.xMm + dist * Math.cos(snappedAngle),
    yMm: fromPoint.yMm + dist * Math.sin(snappedAngle),
  };
}

/**
 * Generate a rectangular room polygon from width and length
 */
export function quickRectangle(widthMm: number, lengthMm: number): { xMm: number; yMm: number }[] {
  return [
    { xMm: 0, yMm: 0 },
    { xMm: widthMm, yMm: 0 },
    { xMm: widthMm, yMm: lengthMm },
    { xMm: 0, yMm: lengthMm },
  ];
}

/**
 * Update a single wall's length by moving its end vertex
 */
export function updateWallLengthInPolygon(
  polygonMm: { xMm: number; yMm: number }[],
  wallIndex: number,
  newLengthMm: number
): { xMm: number; yMm: number }[] {
  const walls = getWallsFromPolygon(polygonMm);
  if (wallIndex < 0 || wallIndex >= walls.length) return polygonMm;

  const wall = walls[wallIndex];
  const angleRad = wall.angleDeg * (Math.PI / 180);
  const endIndex = (wallIndex + 1) % polygonMm.length;
  const newPolygon = polygonMm.map((p) => ({ ...p }));

  newPolygon[endIndex] = {
    xMm: wall.startPoint.xMm + newLengthMm * Math.cos(angleRad),
    yMm: wall.startPoint.yMm + newLengthMm * Math.sin(angleRad),
  };

  return newPolygon;
}