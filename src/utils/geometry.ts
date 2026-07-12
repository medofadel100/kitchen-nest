import { KitchenUnit, Room, RoomFixture, StructuralObstacle } from '@/types';
import { getWallsFromPolygon, getFixtureWorldPosition, getWallContainingPoint } from '@/lib/roomGeometry';

// Represents an axis-aligned bounding box
export interface BoundingBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * Returns an array of bounding boxes for a given unit.
 * A standard unit has 1 box.
 * An L-Shape corner unit has 2 boxes (the two legs).
 * Rotation is factored in (0, 90, 180, 270 degrees).
 */
export const getUnitBoundingBoxes = (
  unit: KitchenUnit,
  overrideXMm?: number,
  overrideYMm?: number
): BoundingBox[] => {
  const w = unit.dimensions.widthMm;
  const d = unit.dimensions.depthMm;
  const x = overrideXMm !== undefined ? overrideXMm : unit.position.xMm;
  const y = overrideYMm !== undefined ? overrideYMm : unit.position.yMm;
  const r = unit.position.rotationDeg || 0;

  const cx = x + w / 2;
  const cy = y + d / 2;

  // Unrotated local coordinates of the boxes relative to the top-left (0,0) of the unit
  let localBoxes = [];

  if (unit.type.startsWith('corner')) {
    // L-Shape
    const leftLegD = unit.dimensions.leftLegCarcassDepthMm || 600;
    const rightLegD = unit.dimensions.rightLegCarcassDepthMm || 600;
    
    // Leg 1 (Back/Right Leg)
    localBoxes.push({ left: 0, top: 0, right: w, bottom: rightLegD });
    // Leg 2 (Side/Left Leg)
    localBoxes.push({ left: 0, top: 0, right: leftLegD, bottom: d });
  } else {
    // Standard rectangle
    localBoxes.push({ left: 0, top: 0, right: w, bottom: d });
  }

  // Convert local boxes to global rotated boxes
  return localBoxes.map(box => {
    // 4 corners relative to the center
    const corners = [
      { lx: box.left - w/2, ly: box.top - d/2 },
      { lx: box.right - w/2, ly: box.top - d/2 },
      { lx: box.right - w/2, ly: box.bottom - d/2 },
      { lx: box.left - w/2, ly: box.bottom - d/2 },
    ];

    // Rotate corners
    const rad = r * (Math.PI / 180);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const rotatedCorners = corners.map(c => {
      // Rotation matrix for 2D
      const rx = c.lx * cos - c.ly * sin;
      const ry = c.lx * sin + c.ly * cos;
      return { x: cx + rx, y: cy + ry };
    });

    // Find min/max for AABB of the rotated box
    const xs = rotatedCorners.map(c => c.x);
    const ys = rotatedCorners.map(c => c.y);

    return {
      left: Math.min(...xs),
      right: Math.max(...xs),
      top: Math.min(...ys),
      bottom: Math.max(...ys),
    };
  });
};

export const snapValueToGrid = (value: number, gridMm = 10): number => {
  return Math.round(value / gridMm) * gridMm;
};

/**
 * Snap a unit to the nearest room wall with proper rotation
 * تلزق الوحدة في أقرب جدار مع ضبط الزاوية
 */
export const snapUnitToRoom = (
  unit: KitchenUnit,
  xMm: number,
  yMm: number,
  room: Room,
  thresholdMm = 80
): { xMm: number; yMm: number } => {
  const boxes = getUnitBoundingBoxes(unit, xMm, yMm);
  let snappedX = xMm;
  let snappedY = yMm;

  for (const box of boxes) {
    if (Math.abs(box.left - 0) < thresholdMm) {
      snappedX += (0 - box.left);
    }
    if (Math.abs(box.top - 0) < thresholdMm) {
      snappedY += (0 - box.top);
    }
    if (Math.abs(box.right - room.widthMm) < thresholdMm) {
      snappedX += (room.widthMm - box.right);
    }
    if (Math.abs(box.bottom - room.lengthMm) < thresholdMm) {
      snappedY += (room.lengthMm - box.bottom);
    }
  }

  return { xMm: snappedX, yMm: snappedY };
};

/**
 * Enhanced snap to room walls - also returns the wall angle for rotation
 * تلزق متقدمة مع إرجاع زاوية الجدار
 */
export const snapUnitToRoomWithAngle = (
  unit: KitchenUnit,
  xMm: number,
  yMm: number,
  room: Room,
  thresholdMm = 80
): { xMm: number; yMm: number; rotationDeg: number } => {
  const walls = getWallsFromPolygon(room.polygonMm);
  let bestWall: { xMm: number; yMm: number; rotationDeg: number } | null = null;
  let minDist = thresholdMm;

  const unitCenterX = xMm + unit.dimensions.widthMm / 2;
  const unitCenterY = yMm + unit.dimensions.depthMm / 2;

  for (const wall of walls) {
    // Calculate distance from unit center to wall
    const dist = pointToLineDistance(
      { xMm: unitCenterX, yMm: unitCenterY },
      wall.startPoint,
      wall.endPoint
    );

    if (dist < minDist) {
      minDist = dist;
      
      // Calculate the wall angle (perpendicular to the wall for the unit to face it)
      const wallAngleDeg = wall.angleDeg;
      
      // Project the unit onto the wall
      const proj = projectPointOnLine(
        { xMm: unitCenterX, yMm: unitCenterY },
        wall.startPoint,
        wall.endPoint
      );

      // Calculate the unit position so its back is against the wall
      const depthMm = unit.dimensions.depthMm;
      const rad = wallAngleDeg * (Math.PI / 180);
      
      // The unit should be placed with its back to the wall
      // For a wall at angle θ, the unit's back face should be at the wall
      // The unit's front face is at the bottom of the rect (depth direction)
      // So we offset by depth perpendicular to the wall
      const perpAngle = wallAngleDeg + 90; // Perpendicular to wall
      const perpRad = perpAngle * (Math.PI / 180);
      
      let newX = proj.xMm - (unit.dimensions.widthMm / 2) * Math.cos(rad) + (depthMm / 2) * Math.cos(perpRad);
      let newY = proj.yMm - (unit.dimensions.widthMm / 2) * Math.sin(rad) + (depthMm / 2) * Math.sin(perpRad);

      // The rotation of the unit should be perpendicular to the wall
      // If wall is horizontal (0°), unit should be 90° (facing up)
      // If wall is vertical (90°), unit should be 0° (facing right)
      const unitRotation = (wallAngleDeg + 90) % 360;

      bestWall = { xMm: newX, yMm: newY, rotationDeg: unitRotation };
    }
  }

  if (bestWall) {
    return bestWall;
  }

  // Fall back to basic snap
  const basicSnap = snapUnitToRoom(unit, xMm, yMm, room, thresholdMm);
  return { ...basicSnap, rotationDeg: unit.position.rotationDeg || 0 };
};

/**
 * Snap a fixture (door/window) to the nearest wall with proper rotation
 * تلزق الباب أو الشباك في أقرب جدار مع ضبط الزاوية
 */
export const snapFixtureToWall = (
  fixture: { xMm: number; yMm: number; widthMm: number; rotationDeg?: number },
  room: Room,
  thresholdMm = 200
): { xMm: number; yMm: number; rotationDeg: number } => {
  const walls = getWallsFromPolygon(room.polygonMm);
  let bestWall: { xMm: number; yMm: number; rotationDeg: number } | null = null;
  let minDist = thresholdMm;

  const fixtureCenterX = fixture.xMm + fixture.widthMm / 2;
  const fixtureCenterY = fixture.yMm;

  for (const wall of walls) {
    const dist = pointToLineDistance(
      { xMm: fixtureCenterX, yMm: fixtureCenterY },
      wall.startPoint,
      wall.endPoint
    );

    if (dist < minDist) {
      minDist = dist;
      
      // Project fixture center onto the wall
      const proj = projectPointOnLine(
        { xMm: fixtureCenterX, yMm: fixtureCenterY },
        wall.startPoint,
        wall.endPoint
      );

      // The fixture should be placed ON the wall
      // Its rotation should match the wall angle
      const newX = proj.xMm - fixture.widthMm / 2;
      const newY = proj.yMm;

      bestWall = { 
        xMm: newX, 
        yMm: newY, 
        rotationDeg: wall.angleDeg 
      };
    }
  }

  if (bestWall) {
    return bestWall;
  }

  return { 
    xMm: fixture.xMm, 
    yMm: fixture.yMm, 
    rotationDeg: fixture.rotationDeg || 0 
  };
};

/**
 * Calculate distance from point to line segment
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
 * Project a point onto a line segment
 */
function projectPointOnLine(
  point: { xMm: number; yMm: number },
  lineStart: { xMm: number; yMm: number },
  lineEnd: { xMm: number; yMm: number }
): { xMm: number; yMm: number } {
  const dx = lineEnd.xMm - lineStart.xMm;
  const dy = lineEnd.yMm - lineStart.yMm;
  const lenSq = dx * dx + dy * dy;
  
  if (lenSq === 0) return lineStart;
  
  const t = ((point.xMm - lineStart.xMm) * dx + (point.yMm - lineStart.yMm) * dy) / lenSq;
  const clampedT = Math.max(0, Math.min(1, t));
  
  return {
    xMm: lineStart.xMm + clampedT * dx,
    yMm: lineStart.yMm + clampedT * dy,
  };
}

export const snapUnitToNeighbors = (
  unit: KitchenUnit,
  xMm: number,
  yMm: number,
  allUnits: KitchenUnit[],
  thresholdMm = 50
): { xMm: number; yMm: number } => {
  let snappedX = xMm;
  let snappedY = yMm;
  const baseBoxes = getUnitBoundingBoxes(unit, xMm, yMm);

  for (const other of allUnits) {
    if (other.id === unit.id) continue;

    const z1 = unit.position.zMm ?? (unit.type.includes('wall') ? 1500 : unit.type === 'loft' ? 2200 : 0);
    const z2 = other.position.zMm ?? (other.type.includes('wall') ? 1500 : other.type === 'loft' ? 2200 : 0);
    const h1 = unit.dimensions.heightMm;
    const h2 = other.dimensions.heightMm;
    const zOverlap = !(z1 + h1 <= z2 || z1 >= z2 + h2);
    if (!zOverlap) continue;

    const otherBoxes = getUnitBoundingBoxes(other);
    for (const myBox of baseBoxes) {
      for (const otherBox of otherBoxes) {
        if (Math.abs(myBox.left - otherBox.right) < thresholdMm) {
          snappedX += otherBox.right - myBox.left;
        }
        if (Math.abs(myBox.right - otherBox.left) < thresholdMm) {
          snappedX += otherBox.left - myBox.right;
        }
        if (Math.abs(myBox.top - otherBox.bottom) < thresholdMm) {
          snappedY += otherBox.bottom - myBox.top;
        }
        if (Math.abs(myBox.bottom - otherBox.top) < thresholdMm) {
          snappedY += otherBox.top - myBox.bottom;
        }
      }
    }
  }

  return { xMm: snappedX, yMm: snappedY };
};

export const clampUnitToRoom = (
  unit: KitchenUnit,
  xMm: number,
  yMm: number,
  room: Room
): { xMm: number; yMm: number } => {
  const boxes = getUnitBoundingBoxes(unit, xMm, yMm);
  let clampedX = xMm;
  let clampedY = yMm;

  for (const box of boxes) {
    if (box.left < 0) clampedX += -box.left;
    if (box.top < 0) clampedY += -box.top;
    if (box.right > room.widthMm) clampedX += room.widthMm - box.right;
    if (box.bottom > room.lengthMm) clampedY += room.lengthMm - box.bottom;
  }

  return { xMm: clampedX, yMm: clampedY };
};

export const isUnitInsideRoom = (
  unit: KitchenUnit,
  xMm: number,
  yMm: number,
  room: Room
): boolean => {
  const boxes = getUnitBoundingBoxes(unit, xMm, yMm);
  return boxes.every(box => box.left >= 0 && box.top >= 0 && box.right <= room.widthMm && box.bottom <= room.lengthMm);
};

const buildOccupancyGrid = (
  room: Room,
  allUnits: KitchenUnit[],
  gridMm: number,
  bufferMm = 0
): { grid: boolean[][]; cols: number; rows: number } => {
  const cols = Math.ceil(room.widthMm / gridMm);
  const rows = Math.ceil(room.lengthMm / gridMm);
  const grid: boolean[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => false));

  const markBox = (box: BoundingBox) => {
    const left = Math.floor((box.left - bufferMm) / gridMm);
    const right = Math.floor((box.right + bufferMm) / gridMm);
    const top = Math.floor((box.top - bufferMm) / gridMm);
    const bottom = Math.floor((box.bottom + bufferMm) / gridMm);

    const x0 = Math.max(0, left);
    const x1 = Math.min(cols - 1, right);
    const y0 = Math.max(0, top);
    const y1 = Math.min(rows - 1, bottom);

    for (let gy = y0; gy <= y1; gy++) {
      for (let gx = x0; gx <= x1; gx++) {
        grid[gy][gx] = true;
      }
    }
  };

  for (const other of allUnits) {
    if (!other) continue;
    const boxes = getUnitBoundingBoxes(other);

    for (const box of boxes) {
      markBox(box);
    }
  }

  return { grid, cols, rows };
};

const isCandidateCellFreeForUnit = (
  unit: KitchenUnit,
  room: Room,
  grid: boolean[][],
  gridMm: number,
  cols: number,
  rows: number,
  xMm: number,
  yMm: number,
  bufferMm = 0
): boolean => {
  if (!room) return false;

  const boxes = getUnitBoundingBoxes(unit, xMm, yMm);

  for (const box of boxes) {
    const left = Math.floor((box.left - bufferMm) / gridMm);
    const right = Math.floor((box.right + bufferMm) / gridMm);
    const top = Math.floor((box.top - bufferMm) / gridMm);
    const bottom = Math.floor((box.bottom + bufferMm) / gridMm);

    const x0 = Math.max(0, left);
    const x1 = Math.min(cols - 1, right);
    const y0 = Math.max(0, top);
    const y1 = Math.min(rows - 1, bottom);

    for (let gy = y0; gy <= y1; gy++) {
      for (let gx = x0; gx <= x1; gx++) {
        if (gx < 0 || gx >= cols || gy < 0 || gy >= rows) return false;
        if (grid[gy][gx]) return false;
      }
    }
  }

  return isUnitInsideRoom(unit, xMm, yMm, room);
};


export const findSmartUnitPlacement = (
  unit: KitchenUnit,
  room: Room,
  allUnits: KitchenUnit[],
  startX: number,
  startY: number,
  gridMm = 50,
  thresholdMm = 80
): { xMm: number; yMm: number } => {
  const candidates: Array<{ xMm: number; yMm: number; score: number }> = [];
  const snappedStartX = snapValueToGrid(startX, gridMm);
  const snappedStartY = snapValueToGrid(startY, gridMm);

  const occupancy = buildOccupancyGrid(room, allUnits, gridMm, 0);

  const addCandidate = (rawX: number, rawY: number) => {
    let xMm = snapValueToGrid(rawX, gridMm);
    let yMm = snapValueToGrid(rawY, gridMm);

    const wallSnap = snapUnitToRoom(unit, xMm, yMm, room, thresholdMm);
    xMm = snapValueToGrid(wallSnap.xMm, gridMm);
    yMm = snapValueToGrid(wallSnap.yMm, gridMm);

    const neighborSnap = snapUnitToNeighbors(unit, xMm, yMm, allUnits, thresholdMm);
    xMm = snapValueToGrid(neighborSnap.xMm, gridMm);
    yMm = snapValueToGrid(neighborSnap.yMm, gridMm);

    const clamped = clampUnitToRoom(unit, xMm, yMm, room);
    if (!isUnitInsideRoom(unit, clamped.xMm, clamped.yMm, room)) return;

    if (!isCandidateCellFreeForUnit(unit, room, occupancy.grid, gridMm, occupancy.cols, occupancy.rows, clamped.xMm, clamped.yMm, 0)) return;

    if (checkUnitCollision(unit, allUnits, clamped.xMm, clamped.yMm)) return;

    const score = Math.hypot(clamped.xMm - snappedStartX, clamped.yMm - snappedStartY);
    candidates.push({ xMm: clamped.xMm, yMm: clamped.yMm, score });
  };

  // 1) First try start-based seeds
  addCandidate(startX, startY);
  addCandidate(snappedStartX, snappedStartY);
  addCandidate(0, snappedStartY);
  addCandidate(room.widthMm - unit.dimensions.widthMm, snappedStartY);
  addCandidate(snappedStartX, 0);
  addCandidate(snappedStartX, room.lengthMm - unit.dimensions.depthMm);
  addCandidate(0, 0);
  addCandidate(room.widthMm - unit.dimensions.widthMm, 0);
  addCandidate(0, room.lengthMm - unit.dimensions.depthMm);
  addCandidate(room.widthMm - unit.dimensions.widthMm, room.lengthMm - unit.dimensions.depthMm);

  // 2) Occupancy-based scan near the start cell
  const centerGX = Math.round(snappedStartX / gridMm);
  const centerGY = Math.round(snappedStartY / gridMm);
  const scanRadiusCells = 8;

  for (let gy = centerGY - scanRadiusCells; gy <= centerGY + scanRadiusCells; gy++) {
    for (let gx = centerGX - scanRadiusCells; gx <= centerGX + scanRadiusCells; gx++) {
      if (gx < 0 || gx >= occupancy.cols || gy < 0 || gy >= occupancy.rows) continue;
      if (occupancy.grid[gy][gx]) continue;

      const xMm = gx * gridMm;
      const yMm = gy * gridMm;
      addCandidate(xMm, yMm);
    }
  }

  // 3) Neighbor-derived candidates
  for (const other of allUnits) {
    if (other.id === unit.id) continue;
    const otherBoxes = getUnitBoundingBoxes(other);
    for (const otherBox of otherBoxes) {
      addCandidate(otherBox.right, otherBox.top);
      addCandidate(otherBox.right, otherBox.bottom - unit.dimensions.depthMm);
      addCandidate(otherBox.left - unit.dimensions.widthMm, otherBox.top);
      addCandidate(otherBox.left - unit.dimensions.widthMm, otherBox.bottom - unit.dimensions.depthMm);
      addCandidate(otherBox.left, otherBox.top);
      addCandidate(otherBox.right - unit.dimensions.widthMm, otherBox.top);
      addCandidate(otherBox.left, otherBox.bottom - unit.dimensions.depthMm);
      addCandidate(otherBox.right - unit.dimensions.widthMm, otherBox.bottom - unit.dimensions.depthMm);
    }
  }

  // 4) Local perturbations
  const radiusSteps = 2;
  for (let dx = -radiusSteps; dx <= radiusSteps; dx += 1) {
    for (let dy = -radiusSteps; dy <= radiusSteps; dy += 1) {
      addCandidate(snappedStartX + dx * gridMm, snappedStartY + dy * gridMm);
    }
  }

  if (candidates.length === 0) {
    return clampUnitToRoom(unit, startX, startY, room);
  }

  candidates.sort((a, b) => a.score - b.score);
  return { xMm: candidates[0].xMm, yMm: candidates[0].yMm };
};


/**
 * Checks if two axis-aligned bounding boxes overlap.
 */
export const doBoxesOverlap = (b1: BoundingBox, b2: BoundingBox): boolean => {
  const EPSILON = 1;
  return !(
    b1.right <= b2.left + EPSILON ||
    b1.left >= b2.right - EPSILON ||
    b1.bottom <= b2.top + EPSILON ||
    b1.top >= b2.bottom - EPSILON
  );
};

/**
 * Checks if a unit overlaps with any unit in a given list.
 */
/**
 * Checks if a unit's bounding box overlaps with any StructuralObstacle in the room.
 * Returns the first overlapping obstacle, or null if none.
 */
export const checkUnitObstacleOverlap = (
  unit: KitchenUnit,
  obstacles: StructuralObstacle[],
  overrideXMm?: number,
  overrideYMm?: number
): StructuralObstacle | null => {
  const boxes = getUnitBoundingBoxes(unit, overrideXMm, overrideYMm);
  const unitLeft = Math.min(...boxes.map(b => b.left));
  const unitRight = Math.max(...boxes.map(b => b.right));
  const unitTop = Math.min(...boxes.map(b => b.top));
  const unitBottom = Math.max(...boxes.map(b => b.bottom));

  for (const obs of obstacles) {
    const obsLeft = obs.xMm;
    const obsRight = obs.xMm + obs.widthMm;
    const obsTop = obs.yMm;
    const obsBottom = obs.yMm + obs.depthMm;
    const overlaps = unitLeft < obsRight && unitRight > obsLeft && unitTop < obsBottom && unitBottom > obsTop;
    if (overlaps) return obs;
  }
  return null;
};

export const checkUnitCollision = (
  targetUnit: KitchenUnit, 
  allUnits: KitchenUnit[],
  overrideXMm?: number,
  overrideYMm?: number
): boolean => {
  const targetBoxes = getUnitBoundingBoxes(targetUnit, overrideXMm, overrideYMm);

  for (const other of allUnits) {
    if (other.id === targetUnit.id) continue;
    
    const z1 = targetUnit.position.zMm || (targetUnit.type.includes('wall') ? 1500 : (targetUnit.type === 'loft' ? 2200 : 0));
    const z2 = other.position.zMm || (other.type.includes('wall') ? 1500 : (other.type === 'loft' ? 2200 : 0));
    const h1 = targetUnit.dimensions.heightMm;
    const h2 = other.dimensions.heightMm;
    
    const zOverlap = !(z1 + h1 <= z2 || z1 >= z2 + h2);
    if (!zOverlap) continue;

    const otherBoxes = getUnitBoundingBoxes(other);
    
    for (const b1 of targetBoxes) {
      for (const b2 of otherBoxes) {
        if (doBoxesOverlap(b1, b2)) return true;
      }
    }
  }

  return false;
};
