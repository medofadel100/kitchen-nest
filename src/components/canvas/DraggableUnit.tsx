"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Group, Rect, Text, Line, Transformer } from 'react-konva';
import { KitchenUnit } from '@/types';
import { useProjectStore } from '@/store/projectStore';
import { getUnitBoundingBoxes, checkUnitCollision } from '@/utils/geometry';
import Konva from 'konva';

interface DraggableUnitProps {
  unit: KitchenUnit;
  onContextMenu?: (e: Konva.KonvaEventObject<PointerEvent>, id: string, type: 'unit') => void;
}

// ألوان تمييزية حسب نوع الوحدة للـ Top-down view
const getUnitColor = (type: string) => {
  switch (type) {
    case 'base': return '#3b82f6'; // أزرق
    case 'wall': return '#10b981'; // أخضر
    case 'tall': return '#8b5cf6'; // بنفسجي
    case 'drawer_unit': return '#f59e0b'; // برتقالي
    case 'corner_base': return '#6366f1';
    case 'corner_wall': return '#34d399';
    case 'corner_tall': return '#d946ef'; // fuchsia-500
    case 'island': return '#ec4899';
    default: return '#9ca3af'; // رمادي
  }
};

export const DraggableUnit: React.FC<DraggableUnitProps> = ({ unit, onContextMenu }) => {
  const { updateUnitPosition, selectElement, selectedElements, room, units, isSnappingEnabled } = useProjectStore();
  const isSelected = selectedElements?.some(e => e.id === unit.id);
  const { activeTool } = useProjectStore();
  
  const groupRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && activeTool === 'select' && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, activeTool]);

  // نقسم الأبعاد على 10 لرسمها بالبكسل (كل 10 مليمتر = 1 بكسل للتصغير)
  const SCALE = 0.1;
  const widthPx = unit.dimensions.widthMm * SCALE;
  const depthPx = unit.dimensions.depthMm * SCALE;
  const xPx = unit.position.xMm * SCALE;
  const yPx = unit.position.yMm * SCALE;

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const SNAP_THRESHOLD_MM = 50; 
    const GRID_SNAP_MM = 10; 

    const newXPx = e.target.x();
    const newYPx = e.target.y();
    
    let newXMm = (newXPx - widthPx/2) / SCALE;
    let newYMm = (newYPx - depthPx/2) / SCALE;

    // Save old position in case of collision
    const oldXMm = unit.position.xMm;
    const oldYMm = unit.position.yMm;

    // Get true bounding box of this unit to use for snapping bounds
    let currentRotation = unit.position.rotationDeg || 0;

    // Auto-rotation for corner units when near room corners
    if (room && unit.type.startsWith('corner')) {
      const distTopLeft = Math.hypot(newXMm, newYMm);
      const distTopRight = Math.hypot(room.widthMm - newXMm, newYMm);
      const distBottomLeft = Math.hypot(newXMm, room.lengthMm - newYMm);
      const distBottomRight = Math.hypot(room.widthMm - newXMm, room.lengthMm - newYMm);
      
      const minDist = Math.min(distTopLeft, distTopRight, distBottomLeft, distBottomRight);
      
      // If within 1.5 meters of a corner, snap rotation
      if (minDist < 1500) { 
        if (minDist === distTopLeft) currentRotation = 0;
        else if (minDist === distTopRight) currentRotation = 90;
        else if (minDist === distBottomRight) currentRotation = 180;
        else if (minDist === distBottomLeft) currentRotation = 270;
      }
    }

    const testUnit = { ...unit, position: { ...unit.position, rotationDeg: currentRotation as any } };
    const myBoxes = getUnitBoundingBoxes(testUnit, newXMm, newYMm);
    const myLeft = Math.min(...myBoxes.map(b => b.left));
    const myRight = Math.max(...myBoxes.map(b => b.right));
    const myTop = Math.min(...myBoxes.map(b => b.top));
    const myBottom = Math.max(...myBoxes.map(b => b.bottom));

    const unitWidth = myRight - myLeft;
    const unitDepth = myBottom - myTop;

    // Snapping logic (Grid)
    if (isSnappingEnabled) {
      newXMm = Math.round(newXMm / GRID_SNAP_MM) * GRID_SNAP_MM;
      newYMm = Math.round(newYMm / GRID_SNAP_MM) * GRID_SNAP_MM;

      // Magnetic Snapping logic
      let snappedX = false;
      let snappedY = false;

      // 1. Snap to other units
      for (const other of units) {
        if (other.id === unit.id) continue;
        
        // Only snap if they are on the same elevation
        const z1 = unit.position.zMm || (unit.type.includes('wall') ? 1500 : (unit.type === 'loft' ? 2200 : 0));
        const z2 = other.position.zMm || (other.type.includes('wall') ? 1500 : (other.type === 'loft' ? 2200 : 0));
        const zOverlap = !(z1 + unit.dimensions.heightMm <= z2 || z1 >= z2 + other.dimensions.heightMm);
        if (!zOverlap) continue;

        const otherBoxes = getUnitBoundingBoxes(other);
        
        for (const otherBox of otherBoxes) {
          const otherLeft = otherBox.left;
          const otherRight = otherBox.right;
          const otherTop = otherBox.top;
          const otherBottom = otherBox.bottom;

          // Snap X
          if (!snappedX) {
            if (Math.abs(myLeft - otherRight) < SNAP_THRESHOLD_MM) { newXMm += (otherRight - myLeft); snappedX = true; }
            else if (Math.abs(myRight - otherLeft) < SNAP_THRESHOLD_MM) { newXMm += (otherLeft - myRight); snappedX = true; }
            else if (Math.abs(myLeft - otherLeft) < SNAP_THRESHOLD_MM) { newXMm += (otherLeft - myLeft); snappedX = true; }
            else if (Math.abs(myRight - otherRight) < SNAP_THRESHOLD_MM) { newXMm += (otherRight - myRight); snappedX = true; }
          }

          // Snap Y
          if (!snappedY) {
            if (Math.abs(myTop - otherBottom) < SNAP_THRESHOLD_MM) { newYMm += (otherBottom - myTop); snappedY = true; }
            else if (Math.abs(myBottom - otherTop) < SNAP_THRESHOLD_MM) { newYMm += (otherTop - myBottom); snappedY = true; }
            else if (Math.abs(myTop - otherTop) < SNAP_THRESHOLD_MM) { newYMm += (otherTop - myTop); snappedY = true; }
            else if (Math.abs(myBottom - otherBottom) < SNAP_THRESHOLD_MM) { newYMm += (otherBottom - myBottom); snappedY = true; }
          }
        }
      }

      // Re-calculate myBoxes after object snap to use for wall snapping
      const updatedBoxes = getUnitBoundingBoxes(unit, newXMm, newYMm);
      const updatedLeft = Math.min(...updatedBoxes.map(b => b.left));
      const updatedRight = Math.max(...updatedBoxes.map(b => b.right));
      const updatedTop = Math.min(...updatedBoxes.map(b => b.top));
      const updatedBottom = Math.max(...updatedBoxes.map(b => b.bottom));

      // 2. Snap to Room Walls (highest priority for bounds)
      if (room) {
        if (Math.abs(updatedLeft) < SNAP_THRESHOLD_MM) { newXMm += (0 - updatedLeft); }
        if (Math.abs(updatedTop) < SNAP_THRESHOLD_MM) { newYMm += (0 - updatedTop); }
        
        if (Math.abs(updatedRight - room.widthMm) < SNAP_THRESHOLD_MM) {
          newXMm += (room.widthMm - updatedRight);
        }
        if (Math.abs(updatedBottom - room.lengthMm) < SNAP_THRESHOLD_MM) {
          newYMm += (room.lengthMm - updatedBottom);
        }
      }
    }

    // Hard Boundary constraints
    if (room) {
      const finalBoxes = getUnitBoundingBoxes(unit, newXMm, newYMm);
      const finalLeft = Math.min(...finalBoxes.map(b => b.left));
      const finalRight = Math.max(...finalBoxes.map(b => b.right));
      const finalTop = Math.min(...finalBoxes.map(b => b.top));
      const finalBottom = Math.max(...finalBoxes.map(b => b.bottom));

      if (finalLeft < 0) newXMm += (0 - finalLeft);
      if (finalTop < 0) newYMm += (0 - finalTop);
      if (finalRight > room.widthMm) newXMm += (room.widthMm - finalRight);
      if (finalBottom > room.lengthMm) newYMm += (room.lengthMm - finalBottom);
    }

    const finalTestUnit = { ...unit, position: { ...unit.position, rotationDeg: currentRotation as any } };
    
    // 3. Collision Avoidance Check
    let hasCollision = checkUnitCollision(finalTestUnit, units, newXMm, newYMm);

    if (hasCollision) {
      // Revert to old position
      newXMm = oldXMm;
      newYMm = oldYMm;
      currentRotation = unit.position.rotationDeg || 0; // Revert rotation too
      // Optional: Visual feedback could be added here (e.g. flashing red)
      console.warn("Collision detected! Reverting position.");
    }

    updateUnitPosition(unit.id, newXMm, newYMm, unit.position.zMm, currentRotation as any);

    // إعادة العنصر لمكانه الـ snapped أو الـ reverted في الـ UI فوراً
    e.target.position({ x: (newXMm * SCALE) + widthPx/2, y: (newYMm * SCALE) + depthPx/2 });
    e.target.rotation(currentRotation);
  };

  const unitColor = getUnitColor(unit.type);

  // تحديث الطبقة عشان الوحدة المحددة تظهر فوق الباقي
  useEffect(() => {
    if (isSelected && groupRef.current) {
      groupRef.current.moveToTop();
    }
  }, [isSelected]);

  const handleTransformEnd = () => {
    const node = groupRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    const newWidthMm = unit.dimensions.widthMm * scaleX;
    const newDepthMm = unit.dimensions.depthMm * scaleY;

    // Calculate new position based on the center of the node
    const newLeftPx = node.x() - (widthPx * scaleX) / 2;
    const newTopPx = node.y() - (depthPx * scaleY) / 2;

    const newXMm = newLeftPx / SCALE;
    const newYMm = newTopPx / SCALE;

    useProjectStore.getState().updateUnitDimensions(unit.id, Math.round(newWidthMm), Math.round(newDepthMm), unit.dimensions.heightMm);
    useProjectStore.getState().updateUnitPosition(unit.id, Math.round(newXMm), Math.round(newYMm), unit.position.zMm, unit.position.rotationDeg);
  };

  return (
    <React.Fragment>
      <Group
        x={xPx + widthPx/2}
        y={yPx + depthPx/2}
        offsetX={widthPx/2}
        offsetY={depthPx/2}
        rotation={unit.position.rotationDeg || 0}
        draggable
        ref={groupRef}
        onDragStart={(e) => selectElement(unit.id, 'unit', (e.evt as MouseEvent).shiftKey || false)}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        onClick={(e) => { e.cancelBubble = true; selectElement(unit.id, 'unit', (e.evt as MouseEvent).shiftKey || false); }}
        onTap={(e) => { e.cancelBubble = true; selectElement(unit.id, 'unit', (e.evt as MouseEvent).shiftKey || false); }}
        onContextMenu={(e) => { e.cancelBubble = true; onContextMenu?.(e, unit.id, 'unit'); }}
      >
      {unit.type.startsWith('corner') ? (
        <Line
          points={[
            0, 0,
            widthPx, 0,
            widthPx, (unit.dimensions.rightLegCarcassDepthMm || 600) * SCALE,
            (unit.dimensions.leftLegCarcassDepthMm || 600) * SCALE, (unit.dimensions.rightLegCarcassDepthMm || 600) * SCALE,
            (unit.dimensions.leftLegCarcassDepthMm || 600) * SCALE, depthPx,
            0, depthPx
          ]}
          fill={isSelected ? `${unitColor}aa` : `${unitColor}88`}
          stroke={isSelected ? '#1e3a8a' : unitColor}
          strokeWidth={isSelected ? 3 : 1}
          closed={true}
          lineJoin="round"
          shadowColor="black"
          shadowBlur={isSelected ? 10 : 2}
          shadowOpacity={isSelected ? 0.3 : 0.1}
          shadowOffset={{ x: 2, y: 2 }}
        />
      ) : (
        <Rect
          width={widthPx}
          height={depthPx}
          fill={isSelected ? `${unitColor}aa` : `${unitColor}88`}
          stroke={isSelected ? '#1e3a8a' : unitColor}
          strokeWidth={isSelected ? 3 : 1}
          cornerRadius={2}
          shadowColor="black"
          shadowBlur={isSelected ? 10 : 2}
          shadowOpacity={isSelected ? 0.3 : 0.1}
          shadowOffset={{ x: 2, y: 2 }}
        />
      )}
      {/* نص يوضح مقاس واسم الوحدة */}
      <Text
        text={`${unit.type}\n${unit.dimensions.widthMm}x${unit.dimensions.depthMm}`}
        width={widthPx}
        height={depthPx}
        align="center"
        verticalAlign="middle"
        fontSize={12}
        fill="#1e293b"
        padding={5}
        fontStyle="bold"
      />
      {/* مؤشر الواجهة (الباب) */}
      {!unit.type.startsWith('corner') && (
        <Rect
          x={0}
          y={depthPx - 4}
          width={widthPx}
          height={4}
          fill={isSelected ? '#1e40af' : '#475569'}
          cornerRadius={[0, 0, 2, 2]}
        />
      )}
    </Group>
    {isSelected && activeTool === 'select' && (
      <Transformer
        ref={trRef}
        boundBoxFunc={(oldBox, newBox) => {
          // Limit minimum size to 150mm
          if (newBox.width < 150 * SCALE || newBox.height < 150 * SCALE) {
            return oldBox;
          }
          return newBox;
        }}
        keepRatio={false}
        enabledAnchors={['middle-left', 'middle-right', 'top-center', 'bottom-center']}
      />
    )}
    </React.Fragment>
  );
};
