import { KitchenUnit } from '@/types';

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
      // Since canvas Y is down, standard rotation matrix works if we consider the axes
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

/**
 * Checks if two axis-aligned bounding boxes overlap.
 */
export const doBoxesOverlap = (b1: BoundingBox, b2: BoundingBox): boolean => {
  // Allow touching edges (e.g., adjacent units) by using strict inequality `<` or a tiny margin.
  // We use a small epsilon (1mm) to prevent adjacent units from being marked as colliding.
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
export const checkUnitCollision = (
  targetUnit: KitchenUnit, 
  allUnits: KitchenUnit[],
  overrideXMm?: number,
  overrideYMm?: number
): boolean => {
  const targetBoxes = getUnitBoundingBoxes(targetUnit, overrideXMm, overrideYMm);

  for (const other of allUnits) {
    if (other.id === targetUnit.id) continue;
    
    // Ignore wall units colliding with base units? Yes!
    // Wall units are usually on z=1500, base units on z=0.
    // If they are on different elevations, they don't collide.
    const z1 = targetUnit.position.zMm || (targetUnit.type.includes('wall') ? 1500 : (targetUnit.type === 'loft' ? 2200 : 0));
    const z2 = other.position.zMm || (other.type.includes('wall') ? 1500 : (other.type === 'loft' ? 2200 : 0));
    const h1 = targetUnit.dimensions.heightMm;
    const h2 = other.dimensions.heightMm;
    
    // Z-axis overlap check
    const zOverlap = !(z1 + h1 <= z2 || z1 >= z2 + h2);
    if (!zOverlap) continue; // They are safely above/below each other

    const otherBoxes = getUnitBoundingBoxes(other);
    
    for (const b1 of targetBoxes) {
      for (const b2 of otherBoxes) {
        if (doBoxesOverlap(b1, b2)) return true;
      }
    }
  }

  return false;
};
