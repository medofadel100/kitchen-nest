import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Line, Rect, Circle, Text, Group } from 'react-konva';
import { useProjectStore } from '@/store/projectStore';
import { DraggableUnit } from './DraggableUnit';
import { formatMeasurement } from '@/utils/measurements';
import Konva from 'konva';
import { Copy, EyeOff, Edit2, Trash2, Refrigerator } from 'lucide-react';
import { HistoryPanel } from '../HistoryPanel';
import { SplashLoader } from '../SplashLoader';
import { getWallsFromPolygon, snapToOrtho, pointAtDistance, MIN_ROOM_POLYGON_VERTICES, getFixtureWorldPosition } from '@/lib/roomGeometry';
import { snapFixtureToWall, snapUnitToRoomWithAngle, checkUnitObstacleOverlap } from '@/utils/geometry';
import { ObstacleClearanceDialog } from '../ObstacleClearanceDialog';
import { ApplianceHousingWizard } from '../ApplianceHousingWizard';
import { StructuralObstacle, KitchenUnit } from '@/types';


const CLOSE_THRESHOLD_MM = 50;
import { convertMmToDisplayUnit, convertDisplayUnitToMm } from '@/utils/measurements';


export const KitchenCanvas = () => {
  const { units, selectElement, room, activeTool, setActiveTool, addRoomObstacle, addRoomFixture, addRoomPolygonPoint, displayUnit, duplicateElement, toggleElementVisibility, isSnappingEnabled, visibleWalls, roomPolygonPoints, isOrthoMode, updateRoomWallLength, setRoomPolygon, setRoomPolygonPoints, updateRoomPolygonPoint, removeLastRoomPolygonPoint, finishRoomPolygonDrawing } = useProjectStore();
  const { historyVisible } = useProjectStore();
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isMounted, setIsMounted] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [stageSize, setStageSize] = useState({ width: 1200, height: 800 });

  const [measureStart, setMeasureStart] = useState<{ x: number, y: number } | null>(null);
  const [measureCurrent, setMeasureCurrent] = useState<{ x: number, y: number } | null>(null);
  const [polygonPreviewPoint, setPolygonPreviewPoint] = useState<{ xMm: number; yMm: number } | null>(null);
  const [editingWallId, setEditingWallId] = useState<string | null>(null);
  const [wallEditValue, setWallEditValue] = useState('');
  const [wallEditScreenPos, setWallEditScreenPos] = useState<{ x: number; y: number } | null>(null);
  const [typedLengthInput, setTypedLengthInput] = useState('');
  const [draggingWallIndex, setDraggingWallIndex] = useState<number | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ xMm: number; yMm: number } | null>(null);
  
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, id: string, type: 'unit' | 'fixture' | 'obstacle' | 'wall' | 'vertex' } | null>(null);
  const [obstacleDialog, setObstacleDialog] = useState<{ unitId: string; obstacle: StructuralObstacle } | null>(null);
  const [applianceWizard, setApplianceWizard] = useState<{ unitId: string } | null>(null);
  const [selectedWallIndex, setSelectedWallIndex] = useState<number | null>(null);
  const [selectedVertexIndex, setSelectedVertexIndex] = useState<number | null>(null);

  const typedLengthRef = useRef('');
  typedLengthRef.current = typedLengthInput;
  const polygonPreviewRef = useRef<{ xMm: number; yMm: number } | null>(null);

  const SCALE = 0.1; // 1px = 10mm

  // ---------- ALL HOOKS MUST BE BEFORE ANY EARLY RETURN ----------

  // Responsive Stage size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Close context menu on click anywhere
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    setIsMounted(true);

    const handleKeyDown = (e: KeyboardEvent) => {
      const state = useProjectStore.getState();

      const { undo, redo } = useProjectStore.getState();

      if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) {

        e.preventDefault();
        undo();
        return;
      }

      if (e.ctrlKey && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        redo();
        return;
      }
      // Ignore if typing in an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      const {
        selectedElement, deleteUnit, deleteRoomFixture, deleteRoomObstacle, selectElement,
        updateUnitPosition, updateRoomFixture, updateRoomObstacle, units, room,
        activeTool: currentTool, roomPolygonPoints: polyPts, setActiveTool: setTool,
        setRoomPolygonPoints: setPolyPts, removeLastRoomPolygonPoint: removeLastPt,
        addRoomPolygonPoint: addPolyPt, finishRoomPolygonDrawing: finishPoly,
      } = useProjectStore.getState();

      // --- Polygon drawing shortcuts ---
      if (currentTool === 'polygon') {
        if (e.key === 'Escape') {
          e.preventDefault();
          if (typedLengthRef.current) {
            setTypedLengthInput('');
          } else {
            finishPoly();
            polygonPreviewRef.current = null;
            setPolygonPreviewPoint(null);
            setTypedLengthInput('');
          }
          return;
        }

        if (e.key === 'Backspace' || e.key === 'Delete') {
          e.preventDefault();
          if (typedLengthRef.current.length > 0) {
            setTypedLengthInput((v) => v.slice(0, -1));
          } else if (polyPts.length > 0) {
            removeLastPt();
            polygonPreviewRef.current = null;
          }
          return;
        }

        if (e.key === 'Enter' && typedLengthRef.current && polyPts.length > 0) {
          e.preventDefault();
          const preview = polygonPreviewRef.current;
          const lenMm = convertDisplayUnitToMm(Number(typedLengthRef.current), displayUnit);
          if (lenMm > 0 && preview) {
            addPolyPt({ xMm: preview.xMm, yMm: preview.yMm });
            setTypedLengthInput('');
          }
          return;
        }

        if (/^[0-9.]$/.test(e.key)) {
          e.preventDefault();
          setTypedLengthInput((v) => v + e.key);
          return;
        }

        return; // Don't process other shortcuts while drawing
      }

      if (e.key === 'Escape') {
        selectElement(null);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!selectedElement) return;
        if (selectedElement.type === 'unit') deleteUnit(selectedElement.id);
        if (selectedElement.type === 'fixture') deleteRoomFixture(selectedElement.id);
        if (selectedElement.type === 'obstacle') deleteRoomObstacle(selectedElement.id);
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (!selectedElement) return;
        e.preventDefault(); // Prevent scrolling

        const step = e.shiftKey ? 100 : 10; // 100mm (10cm) with Shift, 10mm (1cm) without
        let dx = 0;
        let dy = 0;

        if (e.key === 'ArrowUp') dy = -step;
        if (e.key === 'ArrowDown') dy = step;
        if (e.key === 'ArrowLeft') dx = -step;
        if (e.key === 'ArrowRight') dx = step;

        if (selectedElement.type === 'unit') {
          const unit = units.find(u => u.id === selectedElement.id);
          if (unit) {
            updateUnitPosition(unit.id, unit.position.xMm + dx, unit.position.yMm + dy, unit.position.zMm, unit.position.rotationDeg);
          }
        } else if (selectedElement.type === 'fixture') {
          const fixture = room?.fixtures.find(f => f.id === selectedElement.id);
          if (fixture) {
            updateRoomFixture(fixture.id, { xMm: fixture.xMm + dx, yMm: fixture.yMm + dy });
          }
        } else if (selectedElement.type === 'obstacle') {
          const obstacle = room?.obstacles.find(o => o.id === selectedElement.id);
          if (obstacle) {
            updateRoomObstacle(obstacle.id, { xMm: obstacle.xMm + dx, yMm: obstacle.yMm + dy });
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Clear typed length when leaving polygon tool
  useEffect(() => {
    if (activeTool !== 'polygon') {
      setTypedLengthInput('');
    }
  }, [activeTool]);

  // Hide splash after a short delay so the first render has time to paint.
  useEffect(() => {
    if (!room) return;
    const t = window.setTimeout(() => setShowSplash(false), 450);
    return () => window.clearTimeout(t);
  }, [room]);

  // 🏗️ الكشف التلقائي عن التقاطع مع الأعمدة عند إضافة أو تحريك وحدات
  useEffect(() => {
    if (!room || !units.length) return;
    // افحص كل وحدة ليس لديها obstacleFit مسبق
    for (const unit of units) {
      if (unit.obstacleFit) continue; // Skip those already configured
      const overlapping = checkUnitObstacleOverlap(unit, room.obstacles);
      if (overlapping) {
        setObstacleDialog({ unitId: unit.id, obstacle: overlapping });
        break; // Show one dialog at a time
      }
    }
  }, [units, room]);

  // 🏗️ كشف التقاطع التلقائي عند إضافة أو تحريك وحدة
  const detectAndHandleObstacleOverlap = useCallback((unit: KitchenUnit) => {
    if (!room || !unit) return;
    const overlapping = checkUnitObstacleOverlap(unit, room.obstacles);
    if (overlapping) {
      setObstacleDialog({ unitId: unit.id, obstacle: overlapping });
    }
  }, [room]);

  // معالجة تأكيد المسافة من نافذة الخلوص
  const handleObstacleClearanceConfirm = useCallback((clearanceMm: number) => {
    if (!obstacleDialog) return;
    const { unitId, obstacle } = obstacleDialog;
    const state = useProjectStore.getState();
    const unit = state.units.find(u => u.id === unitId);
    if (unit) {
      state.updateUnitDetails(unitId, {
        obstacleFit: {
          obstacleId: obstacle.id,
          clearanceMm,
        },
      });
    }
    setObstacleDialog(null);
  }, [obstacleDialog]);

  // معالجة تأكيد إعدادات إحاطة الجهاز
  const handleApplianceHousingConfirm = useCallback((config: {
    clearanceMm: { leftMm: number; rightMm: number; topMm: number; backMm: number };
    removeDoorAtApplianceZone: boolean;
    hasBaseUnderneath: boolean;
  }) => {
    if (!applianceWizard) return;
    const state = useProjectStore.getState();
    state.updateUnitDetails(applianceWizard.unitId, {
      applianceHousingConfig: {
        applianceId: `app_${Date.now()}`, // مؤقت لحين ربط الأجهزة الفعلية
        ...config,
      },
    });
    setApplianceWizard(null);
  }, [applianceWizard]);

  // ---------- EARLY RETURN AFTER ALL HOOKS ----------

  if (!isMounted) return <div className="w-full h-full bg-zinc-900/50 animate-pulse rounded-3xl"></div>;

  // Background Grid
  const gridSizePx = 50;
  const gridLines = [];
  for (let i = 0; i < stageSize.width / gridSizePx; i++) {
    gridLines.push(
      <Line
        key={`v-${i}`}
        points={[Math.round(i * gridSizePx) + 0.5, 0, Math.round(i * gridSizePx) + 0.5, stageSize.height]}
        stroke="#27272a" // zinc-800
        strokeWidth={1}
      />
    );
  }
  for (let j = 0; j < stageSize.height / gridSizePx; j++) {
    gridLines.push(
      <Line
        key={`h-${j}`}
        points={[0, Math.round(j * gridSizePx) + 0.5, stageSize.width, Math.round(j * gridSizePx) + 0.5]}
        stroke="#27272a" // zinc-800
        strokeWidth={1}
      />
    );
  }

  // Center room in canvas
  const offsetX = room ? (stageSize.width - room.widthMm * SCALE) / 2 : 0;
  const offsetY = room ? (stageSize.height - room.lengthMm * SCALE) / 2 : 0;

  const getPointerPositionMm = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return { xMm: 0, yMm: 0 };
    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return { xMm: 0, yMm: 0 };

    // FIX: Account for stage scale and position (zoom/pan)
    const stageScale = stage.scaleX();
    const correctedX = (pointerPosition.x - stage.x()) / stageScale;
    const correctedY = (pointerPosition.y - stage.y()) / stageScale;

    // Convert pixel to mm relative to room offset
    const xMm = (correctedX - offsetX) / SCALE;
    const yMm = (correctedY - offsetY) / SCALE;
    return { xMm, yMm };
  };

  const computePreviewPoint = (mouseMm: { xMm: number; yMm: number }) => {
    if (roomPolygonPoints.length === 0) return mouseMm;

    // Snap to first point when closing the shape
    if (roomPolygonPoints.length >= MIN_ROOM_POLYGON_VERTICES) {
      const first = roomPolygonPoints[0];
      const distToFirst = Math.hypot(mouseMm.xMm - first.xMm, mouseMm.yMm - first.yMm);
      if (distToFirst < CLOSE_THRESHOLD_MM) {
        return { xMm: first.xMm, yMm: first.yMm };
      }
    }

    const last = roomPolygonPoints[roomPolygonPoints.length - 1];
    if (typedLengthInput) {
      const lenMm = convertDisplayUnitToMm(Number(typedLengthInput), displayUnit);
      if (lenMm > 0) {
        return pointAtDistance(last, mouseMm, lenMm, isOrthoMode);
      }
    }
    return isOrthoMode ? snapToOrtho(last, mouseMm) : mouseMm;
  };

  const isSnappedToClose =
    activeTool === 'polygon' &&
    roomPolygonPoints.length >= MIN_ROOM_POLYGON_VERTICES &&
    polygonPreviewPoint !== null &&
    Math.hypot(
      polygonPreviewPoint.xMm - roomPolygonPoints[0].xMm,
      polygonPreviewPoint.yMm - roomPolygonPoints[0].yMm
    ) < 1;

  const handleFinishPolygonDrawing = () => {
    finishRoomPolygonDrawing();
    setPolygonPreviewPoint(null);
    polygonPreviewRef.current = null;
    setTypedLengthInput('');
  };

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const { xMm, yMm } = getPointerPositionMm(e);

    if (activeTool === 'select') {
      const clickedOnEmpty = e.target === e.target.getStage();
      if (clickedOnEmpty) {
        selectElement(null);
        setContextMenu(null);
      }
    } 
    else if (activeTool === 'measure') {
      setMeasureStart({ x: xMm, y: yMm });
      setMeasureCurrent({ x: xMm, y: yMm });
    }
    else if (activeTool === 'column') {
      // Default column size 300x300mm
      addRoomObstacle('column', xMm, yMm, 300, 300);
      setActiveTool('select');
    }
    else if (activeTool === 'door') {
      // Default door width 900mm
      addRoomFixture('door', xMm, yMm, 900);
      setActiveTool('select');
    }
    else if (activeTool === 'window') {
      // Default window width 1200mm
      addRoomFixture('window', xMm, yMm, 1200);
      setActiveTool('select');
    }
    else if (activeTool === 'polygon') {
      // Ignore clicks on vertex handles (drag instead)
      if ((e.target as Konva.Node).getClassName?.() === 'Circle') return;

      let clickX = xMm;
      let clickY = yMm;

      if (roomPolygonPoints.length > 0) {
        const preview = computePreviewPoint({ xMm, yMm });
        clickX = preview.xMm;
        clickY = preview.yMm;
      }

      // Close shape ONLY when explicitly clicking near the first point AND user has at least 3 points
      // Don't auto-complete - user must intentionally close the shape
      if (roomPolygonPoints.length >= 3) {
        const firstPoint = roomPolygonPoints[0];
        const dist = Math.hypot(clickX - firstPoint.xMm, clickY - firstPoint.yMm);
        if (dist < CLOSE_THRESHOLD_MM) {
          handleFinishPolygonDrawing();
          return;
        }
      }

      addRoomPolygonPoint({ xMm: clickX, yMm: clickY });
      setTypedLengthInput('');
    }
  };

  // Prefer in-progress polygon points while drawing; fall back to saved polygon
  const displayPolygonPoints = roomPolygonPoints.length > 0
    ? roomPolygonPoints
    : (room?.polygonMm ?? []);

  const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (activeTool === 'measure' && measureStart) {
      const { xMm, yMm } = getPointerPositionMm(e);
      setMeasureCurrent({ x: xMm, y: yMm });
    }
    
    // Rubber-band guide line for polygon drawing
    if (activeTool === 'polygon' && roomPolygonPoints.length > 0) {
      const { xMm, yMm } = getPointerPositionMm(e);
      const preview = computePreviewPoint({ xMm, yMm });
      polygonPreviewRef.current = preview;
      setPolygonPreviewPoint(preview);
    } else if (activeTool !== 'polygon') {
      polygonPreviewRef.current = null;
      setPolygonPreviewPoint(null);
    }
  };

  const handleStageMouseUp = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {

    if (activeTool === 'measure') {
      // Keep the measure line visible until they click again, or clear it if they release near start
      if (measureStart && measureCurrent) {
        const dist = Math.hypot(measureCurrent.x - measureStart.x, measureCurrent.y - measureStart.y);
        if (dist < 50) {
          setMeasureStart(null);
          setMeasureCurrent(null);
        }
      }
    }
  };

  const handleContextMenu = (e: Konva.KonvaEventObject<PointerEvent>, id: string, type: 'unit' | 'fixture' | 'obstacle') => {
    e.evt.preventDefault();
    selectElement(id, type);
    const pointerPos = stageRef.current?.getPointerPosition();
    if (pointerPos) {
      setContextMenu({ x: pointerPos.x, y: pointerPos.y, id, type });
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-transparent overflow-auto relative">
      {showSplash && <SplashLoader />}
      <Stage

        width={stageSize.width}
        height={stageSize.height}
        ref={stageRef}
        draggable={false}
        onWheel={(e) => {
          e.evt.preventDefault();
          const stage = stageRef.current;
          if (!stage) return;
          const pointer = stage.getPointerPosition();
          if (!pointer) return;

          const oldScale = stage.scaleX();
          const direction = e.evt.deltaY > 0 ? -1 : 1;
          const zoomFactor = direction > 0 ? 1.06 : 0.94;
          const newScale = Math.max(0.5, Math.min(3, oldScale * zoomFactor));

          // zoom around pointer
          const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
          };

          const newPos = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
          };

          stage.scale({ x: newScale, y: newScale });
          stage.position({ x: newPos.x, y: newPos.y });
          stage.batchDraw();
        }}

        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onTouchStart={handleStageMouseDown}
        onTouchMove={handleStageMouseMove}
        onTouchEnd={handleStageMouseUp}
        className={activeTool !== 'select' ? 'cursor-crosshair' : ''}
      >
        <Layer listening={false}>
          {gridLines}
        </Layer>
        
        {/* Room Layer */}
        {room && (
          <Layer x={offsetX} y={offsetY}>
            {/* Floor - drawn from polygonMm for non-rectangular rooms */}
            {displayPolygonPoints.length >= 3 && (
              <Line
                points={displayPolygonPoints.flatMap(p => [p.xMm * SCALE, p.yMm * SCALE])}
                closed
                fill="rgba(39, 39, 42, 0.3)"
                stroke="rgba(39, 39, 42, 0.5)"
              />
            )}
            
            {/* Walls - drawn from polygonMm (non-rectangular support) */}
            {(() => {
              const walls = getWallsFromPolygon(displayPolygonPoints);
              return walls.map((wall, idx) => {
                const isBackWall = idx === 0;
                const isRightWall = idx === 1;
                const isFrontWall = idx === 2;
                const isLeftWall = idx === 3;
                
                const isVisible = 
                  (isBackWall && visibleWalls.back) ||
                  (isRightWall && visibleWalls.right) ||
                  (isFrontWall && visibleWalls.front) ||
                  (isLeftWall && visibleWalls.left) ||
                  (displayPolygonPoints.length > 4);
                
                if (!isVisible) return null;
                
                const midX = ((wall.startPoint.xMm + wall.endPoint.xMm) / 2) * SCALE;
                const midY = ((wall.startPoint.yMm + wall.endPoint.yMm) / 2) * SCALE;
                const showLengthLabel = room.polygonMm && room.polygonMm.length >= 3 && activeTool === 'select';

                return (
                  <React.Fragment key={`wall-${idx}`}>
                    <Line
                      points={[
                        wall.startPoint.xMm * SCALE,
                        wall.startPoint.yMm * SCALE,
                        wall.endPoint.xMm * SCALE,
                        wall.endPoint.yMm * SCALE
                      ]}
                      stroke="#10b981"
                      strokeWidth={4}
                      draggable={activeTool === 'select' && room.polygonMm && room.polygonMm.length > 0}
                      onMouseDown={(e) => {
                        if (activeTool === 'select') {
                          e.cancelBubble = true;
                          setDraggingWallIndex(idx);
                          setDragStartPos({ xMm: wall.startPoint.xMm, yMm: wall.startPoint.yMm });
                        }
                      }}
                      onDragStart={(e) => {
                        if (activeTool === 'select') {
                          e.cancelBubble = true;
                          setDraggingWallIndex(idx);
                          setDragStartPos({ xMm: wall.startPoint.xMm, yMm: wall.startPoint.yMm });
                        }
                      }}
                      onContextMenu={(e) => {
                        if (activeTool === 'select') {
                          e.evt.preventDefault();
                          const stage = stageRef.current;
                          if (!stage) return;
                          const transform = stage.getAbsoluteTransform().copy();
                          const stagePos = stage.position();
                          const scale = stage.scaleX();
                          const pointerPos = stage.getPointerPosition();
                          if (pointerPos) {
                            setContextMenu({
                              x: pointerPos.x,
                              y: pointerPos.y,
                              id: `wall-${idx}`,
                              type: 'wall'
                            });
                            setSelectedWallIndex(idx);
                          }
                        }
                      }}
                      onDragMove={(e) => {
                        if (draggingWallIndex === idx && dragStartPos) {
                          const dx = (e.target.x() - offsetX) / SCALE - dragStartPos.xMm;
                          const dy = (e.target.y() - offsetY) / SCALE - dragStartPos.yMm;
                          
                          // Move both start and end points of the wall
                          const newStartX = wall.startPoint.xMm + dx;
                          const newStartY = wall.startPoint.yMm + dy;
                          const newEndX = wall.endPoint.xMm + dx;
                          const newEndY = wall.endPoint.yMm + dy;
                          
                          // Update the polygon points
                          const startIndex = idx;
                          const endIndex = (idx + 1) % displayPolygonPoints.length;
                          
                          if (room?.polygonMm) {
                            const newPolygon = [...room.polygonMm];
                            newPolygon[startIndex] = { xMm: newStartX, yMm: newStartY };
                            newPolygon[endIndex] = { xMm: newEndX, yMm: newEndY };
                            useProjectStore.getState().setRoomPolygon(newPolygon);
                          }
                        }
                      }}
                      onDragEnd={(e) => {
                        if (draggingWallIndex === idx) {
                          setDraggingWallIndex(null);
                          setDragStartPos(null);
                          // Commit snapshot after wall drag
                          useProjectStore.getState().commitSnapshot({
                            kind: 'move',
                            label: 'Move Wall',
                            elementType: 'room',
                          });
                        }
                      }}
                    />
                    {showLengthLabel && (
                      <Text
                        x={midX}
                        y={midY - 12}
                        text={formatMeasurement(wall.lengthMm, displayUnit)}
                        fill={editingWallId === wall.id ? '#f59e0b' : '#6ee7b7'}
                        fontSize={12}
                        fontStyle="bold"
                        align="center"
                        onClick={(e) => {
                          e.cancelBubble = true;
                          const stage = stageRef.current;
                          if (!stage) return;
                          const transform = stage.getAbsoluteTransform().copy();
                          const screenPos = transform.point({ x: midX + offsetX, y: midY + offsetY });
                          setEditingWallId(wall.id);
                          setWallEditValue(String(convertMmToDisplayUnit(wall.lengthMm, displayUnit)));
                          setWallEditScreenPos({ x: screenPos.x, y: screenPos.y });
                        }}
                        onTap={(e) => {
                          e.cancelBubble = true;
                        }}
                      />
                    )}
                  </React.Fragment>
                );
              });
            })()}

            {/* Polygon Points - draggable during drawing and after save */}
            {displayPolygonPoints.map((point, idx) => {
              const canDrag = activeTool === 'polygon' || (activeTool === 'select' && room.polygonMm && room.polygonMm.length > 0);
              const isFirstClosable = activeTool === 'polygon' && idx === 0 && roomPolygonPoints.length >= MIN_ROOM_POLYGON_VERTICES;
              return (
                <Circle
                  key={`poly-${idx}`}
                  x={point.xMm * SCALE}
                  y={point.yMm * SCALE}
                  radius={isFirstClosable ? 9 : 6}
                  fill={isFirstClosable ? '#10b981' : '#f59e0b'}
                  stroke="#ffffff"
                  strokeWidth={2}
                  draggable={canDrag}
                  onMouseDown={(e) => { e.cancelBubble = true; }}
                  onContextMenu={(e) => {
                    if (activeTool === 'select' && room?.polygonMm) {
                      e.evt.preventDefault();
                      const stage = stageRef.current;
                      if (!stage) return;
                      const pointerPos = stage.getPointerPosition();
                      if (pointerPos) {
                        setContextMenu({
                          x: pointerPos.x,
                          y: pointerPos.y,
                          id: `vertex-${idx}`,
                          type: 'vertex'
                        });
                        setSelectedVertexIndex(idx);
                      }
                    }
                  }}
                  onDragMove={(e) => {
                    const GRID_SNAP_MM = 50;
                    let newXMm = e.target.x() / SCALE;
                    let newYMm = e.target.y() / SCALE;

                    if (isSnappingEnabled) {
                      newXMm = Math.round(newXMm / GRID_SNAP_MM) * GRID_SNAP_MM;
                      newYMm = Math.round(newYMm / GRID_SNAP_MM) * GRID_SNAP_MM;
                    }

                    if (activeTool === 'polygon') {
                      updateRoomPolygonPoint(idx, newXMm, newYMm);
                    } else if (room?.polygonMm) {
                      // Real-time update for wall stretching during drag
                      const newPolygon = [...room.polygonMm];
                      newPolygon[idx] = { xMm: newXMm, yMm: newYMm };
                      useProjectStore.getState().setRoomPolygon(newPolygon);
                    }
                  }}
                  onDragEnd={(e) => {
                    const GRID_SNAP_MM = 50;
                    let newXMm = e.target.x() / SCALE;
                    let newYMm = e.target.y() / SCALE;

                    if (isSnappingEnabled) {
                      newXMm = Math.round(newXMm / GRID_SNAP_MM) * GRID_SNAP_MM;
                      newYMm = Math.round(newYMm / GRID_SNAP_MM) * GRID_SNAP_MM;
                    }

                    if (activeTool === 'polygon') {
                      updateRoomPolygonPoint(idx, newXMm, newYMm);
                    } else if (room?.polygonMm) {
                      // Commit snapshot after corner drag
                      useProjectStore.getState().updateRoomVertex(idx, newXMm, newYMm);
                      useProjectStore.getState().commitSnapshot({
                        kind: 'move',
                        label: 'Move Corner Point',
                        elementType: 'room',
                      });
                    }
                  }}
                />
              );
            })}

            {/* Segment labels on already-drawn walls during polygon mode */}
            {activeTool === 'polygon' && roomPolygonPoints.length > 1 && roomPolygonPoints.map((pt, idx) => {
              if (idx === 0) return null;
              const prev = roomPolygonPoints[idx - 1];
              const dx = pt.xMm - prev.xMm;
              const dy = pt.yMm - prev.yMm;
              const dist = Math.hypot(dx, dy);
              const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);
              return (
                <Text
                  key={`drawn-seg-${idx}`}
                  x={((prev.xMm + pt.xMm) / 2) * SCALE}
                  y={((prev.yMm + pt.yMm) / 2) * SCALE - 12}
                  text={`${formatMeasurement(dist, displayUnit)} | ${angleDeg | 0}°`}
                  fill="#fcd34d"
                  fontSize={12}
                  fontStyle="bold"
                  align="center"
                />
              );
            })}
            
            {/* Show polygon outline when in polygon mode or when room has custom shape */}
            {roomPolygonPoints.length > 1 && (
              <Line
                points={roomPolygonPoints.flatMap(p => [p.xMm * SCALE, p.yMm * SCALE])}
                stroke="#f59e0b"
                strokeWidth={2}
                dash={[5, 5]}
              />
            )}
            
            {/* Show room polygon outline for non-rectangular rooms */}
            {room.polygonMm && room.polygonMm.length > 4 && (
              <Line
                points={room.polygonMm.flatMap(p => [p.xMm * SCALE, p.yMm * SCALE])}
                stroke="#f59e0b"
                strokeWidth={1}
                dash={[3, 3]}
              />
            )}

            {/* Rubber-band guide line during polygon drawing */}
            {activeTool === 'polygon' && roomPolygonPoints.length > 0 && polygonPreviewPoint && (() => {
              const last = roomPolygonPoints[roomPolygonPoints.length - 1];
              const dx = polygonPreviewPoint.xMm - last.xMm;
              const dy = polygonPreviewPoint.yMm - last.yMm;
              const distMm = Math.hypot(dx, dy);
              const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);
              const labelText = isSnappedToClose
                ? '✓ إغلاق الشكل'
                : typedLengthInput
                  ? `${typedLengthInput} ${displayUnit}|`
                  : `${formatMeasurement(distMm, displayUnit)} | ${angleDeg | 0}°`;
              return (
                <React.Fragment>
                  <Line
                    points={[
                      last.xMm * SCALE,
                      last.yMm * SCALE,
                      polygonPreviewPoint.xMm * SCALE,
                      polygonPreviewPoint.yMm * SCALE
                    ]}
                    stroke={isSnappedToClose ? '#10b981' : typedLengthInput ? '#38bdf8' : '#f59e0b'}
                    strokeWidth={isSnappedToClose ? 3 : typedLengthInput ? 3 : 2}
                    dash={isSnappedToClose ? undefined : [6, 4]}
                  />
                  <Text
                    x={((last.xMm + polygonPreviewPoint.xMm) / 2) * SCALE}
                    y={((last.yMm + polygonPreviewPoint.yMm) / 2) * SCALE - 18}
                    text={labelText}
                    fill={isSnappedToClose ? '#6ee7b7' : typedLengthInput ? '#7dd3fc' : '#fcd34d'}
                    fontSize={13}
                    fontStyle="bold"
                  />
                </React.Fragment>
              );
            })()}

            {/* Obstacles (Columns) */}
            {room.obstacles.map(obs => {
              const w = obs.widthMm * SCALE;
              const d = obs.depthMm * SCALE;
              return (
                <Rect
                  key={obs.id}
                  opacity={obs.isHidden ? 0.3 : 1}
                  x={(obs.xMm * SCALE) + w/2}
                  y={(obs.yMm * SCALE) + d/2}
                  offsetX={w/2}
                  offsetY={d/2}
                  width={w}
                  height={d}
                  rotation={obs.rotationDeg || 0}
                  fill={useProjectStore.getState().selectedElement?.id === obs.id ? "#f87171" : "#ef4444"}
                  stroke={useProjectStore.getState().selectedElement?.id === obs.id ? "#ffffff" : "#b91c1c"}
                  strokeWidth={useProjectStore.getState().selectedElement?.id === obs.id ? 3 : 2}
                  draggable={activeTool === 'select'}
                  onClick={(e) => {
                    e.cancelBubble = true;
                    useProjectStore.getState().selectElement(obs.id, 'obstacle');
                  }}
                  onContextMenu={(e) => {
                    e.cancelBubble = true;
                    handleContextMenu(e, obs.id, 'obstacle');
                  }}
                  onTap={(e) => {
                    e.cancelBubble = true;
                    useProjectStore.getState().selectElement(obs.id, 'obstacle');
                  }}
                  onDragEnd={(e) => {
                    const GRID_SNAP_MM = 50;
                    const SNAP_THRESHOLD = 150;
                    let newXMm = (e.target.x() - w/2) / SCALE;
                    let newYMm = (e.target.y() - d/2) / SCALE;

                    if (isSnappingEnabled) {
                      newXMm = Math.round(newXMm / GRID_SNAP_MM) * GRID_SNAP_MM;
                      newYMm = Math.round(newYMm / GRID_SNAP_MM) * GRID_SNAP_MM;

                      // Wall Snapping
                      if (room) {
                        if (newXMm < SNAP_THRESHOLD) newXMm = 0;
                        else if (newXMm + obs.widthMm > room.widthMm - SNAP_THRESHOLD) newXMm = room.widthMm - obs.widthMm;

                        if (newYMm < SNAP_THRESHOLD) newYMm = 0;
                        else if (newYMm + obs.depthMm > room.lengthMm - SNAP_THRESHOLD) newYMm = room.lengthMm - obs.depthMm;
                      }
                    }

                    useProjectStore.getState().updateRoomObstacle(obs.id, { xMm: newXMm, yMm: newYMm });
                    e.target.position({ x: (newXMm * SCALE) + w/2, y: (newYMm * SCALE) + d/2 });
                  }}
                />
              );
            })}

             {/* Fixtures (Doors/Windows) */}
             {room.fixtures.map(fix => {
               if (fix.type === 'door' || fix.type === 'window') {
                 const w = fix.widthMm * SCALE;
                 const d = 10; // 100mm thickness for doors/windows to match wall
                 
                 // Use custom colors if available, otherwise use defaults
                 const isSelected = useProjectStore.getState().selectedElement?.id === fix.id;
                 const fillColor = fix.isTransparent 
                   ? 'rgba(255,255,255,0.1)' // Transparent door (empty opening)
                   : fix.type === 'door' 
                     ? (fix.doorColorHex || fix.frameColorHex || '#38bdf8')
                     : (fix.sashColorHex || fix.frameColorHex || '#818cf8');
                 
                 return (
                   <Rect
                     key={fix.id}
                     opacity={fix.isHidden ? 0.3 : 1}
                     x={(fix.xMm * SCALE) + w/2}
                     y={(fix.yMm * SCALE) + d/2}
                     offsetX={w/2}
                     offsetY={d/2}
                     width={w}
                     height={d}
                     rotation={fix.rotationDeg || 0}
                     fill={isSelected ? "#bae6fd" : fillColor}
                     stroke={isSelected ? "#ffffff" : "transparent"}
                     strokeWidth={isSelected ? 2 : 0}
                     cornerRadius={2}
                     draggable={activeTool === 'select'}
                     onClick={(e) => {
                       e.cancelBubble = true;
                       useProjectStore.getState().selectElement(fix.id, 'fixture');
                     }}
                     onContextMenu={(e) => {
                       e.cancelBubble = true;
                       handleContextMenu(e, fix.id, 'fixture');
                     }}
                     onTap={(e) => {
                       e.cancelBubble = true;
                       useProjectStore.getState().selectElement(fix.id, 'fixture');
                     }}
                      onDragEnd={(e) => {
                        const GRID_SNAP_MM = 50;
                        let newXMm = (e.target.x() - w/2) / SCALE;
                        let newYMm = (e.target.y() - d/2) / SCALE;
                        let newRotation = fix.rotationDeg || 0;

                        if (isSnappingEnabled && room) {
                          // Use proper wall snapping for fixtures
                          const snapResult = snapFixtureToWall(
                            { xMm: newXMm, yMm: newYMm, widthMm: fix.widthMm, rotationDeg: fix.rotationDeg },
                            room,
                            200
                          );
                          newXMm = snapResult.xMm;
                          newYMm = snapResult.yMm;
                          newRotation = snapResult.rotationDeg;
                        } else {
                          newXMm = Math.round(newXMm / GRID_SNAP_MM) * GRID_SNAP_MM;
                          newYMm = Math.round(newYMm / GRID_SNAP_MM) * GRID_SNAP_MM;
                        }

                        useProjectStore.getState().updateRoomFixture(fix.id, { xMm: newXMm, yMm: newYMm, rotationDeg: newRotation });
                        e.target.position({ x: (newXMm * SCALE) + w/2, y: (newYMm * SCALE) + d/2 });
                        e.target.rotation(newRotation);
                      }}
                   />
                 );
               }
               return null;
             })}

            {/* Measuring Tool Line */}
            {activeTool === 'measure' && measureStart && measureCurrent && (
              <React.Fragment>
                <Line
                  points={[
                    measureStart.x * SCALE, measureStart.y * SCALE,
                    measureCurrent.x * SCALE, measureCurrent.y * SCALE
                  ]}
                  stroke="#f59e0b" // amber-500
                  strokeWidth={2}
                  dash={[5, 5]}
                />
                <Circle x={measureStart.x * SCALE} y={measureStart.y * SCALE} radius={4} fill="#f59e0b" />
                <Circle x={measureCurrent.x * SCALE} y={measureCurrent.y * SCALE} radius={4} fill="#f59e0b" />
                {/* Background rect for distance label */}
                {(() => {
                  const dist = Math.hypot(measureCurrent.x - measureStart.x, measureCurrent.y - measureStart.y);
                  const dx = Math.abs(measureCurrent.x - measureStart.x);
                  const dy = Math.abs(measureCurrent.y - measureStart.y);
                  const angle = Math.atan2(measureCurrent.y - measureStart.y, measureCurrent.x - measureStart.x) * (180 / Math.PI);
                  const midX = (measureStart.x + measureCurrent.x) / 2 * SCALE;
                  const midY = (measureStart.y + measureCurrent.y) / 2 * SCALE;
                  const mainText = formatMeasurement(dist, displayUnit);
                  const detailText = `${formatMeasurement(dx, displayUnit)} × ${formatMeasurement(dy, displayUnit)}`;
                  const angleText = `${Math.abs(angle).toFixed(1)}°`;
                  const bgW = 160;
                  const bgH = 48;
                  return (
                    <Group x={midX - bgW / 2} y={midY - bgH - 8}>
                      <Rect width={bgW} height={bgH} cornerRadius={6} fill="rgba(0,0,0,0.85)" stroke="#f59e0b" strokeWidth={1} />
                      <Text x={bgW / 2} y={6} text={mainText} fill="#fcd34d" fontSize={14} fontStyle="bold" align="center" width={bgW} />
                      <Text x={bgW / 2} y={24} text={`${detailText}  ·  ${angleText}`} fill="#a1a1aa" fontSize={10} align="center" width={bgW} />
                    </Group>
                  );
                })()}
              </React.Fragment>
            )}
          </Layer>
        )}
        
        <Layer x={offsetX} y={offsetY}>
          {/* Units */}
          {units.map((unit) => (
            <Group key={unit.id} opacity={unit.isHidden ? 0.3 : 1}>
              <DraggableUnit unit={unit} onContextMenu={handleContextMenu} />
            </Group>
          ))}
        </Layer>
      </Stage>

      <HistoryPanel />

      {/* Polygon drawing hints */}
      {activeTool === 'polygon' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-xl px-4 py-2 text-xs text-zinc-400 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 shadow-xl pointer-events-none">
          <span><kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-300">Esc</kbd> إنهاء وحفظ</span>
          <span><kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-300">Del</kbd> حذف آخر ضلع</span>
          <span><kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-300">123</kbd> طول + Enter</span>
          <span className="text-emerald-400">قرّب من النقطة الأولى للإغلاق</span>
          {isOrthoMode && <span className="text-sky-400">زوايا قايمة ✓</span>}
        </div>
      )}

      {/* Measure tool hints */}
      {activeTool === 'measure' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-xl px-4 py-2 text-xs text-zinc-400 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 shadow-xl pointer-events-none">
          <span className="text-amber-400">اضغط واسحب لقياس المسافة</span>
          <span>يظهر: المسافة · الأفقي × الرأسي · الزاوية</span>
        </div>
      )}

      {/* Wall length inline editor overlay */}
      {editingWallId && wallEditScreenPos && (
        <div
          className="absolute z-50"
          style={{ top: wallEditScreenPos.y - 16, left: wallEditScreenPos.x - 40 }}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            autoFocus
            type="number"
            value={wallEditValue}
            onChange={(e) => setWallEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const walls = room ? getWallsFromPolygon(room.polygonMm) : [];
                const wallIndex = walls.findIndex((w) => w.id === editingWallId);
                if (wallIndex >= 0) {
                  const newLengthMm = convertDisplayUnitToMm(Number(wallEditValue), displayUnit);
                  if (newLengthMm > 0) updateRoomWallLength(wallIndex, newLengthMm);
                }
                setEditingWallId(null);
                setWallEditScreenPos(null);
              } else if (e.key === 'Escape') {
                setEditingWallId(null);
                setWallEditScreenPos(null);
              }
            }}
            onBlur={() => {
              setEditingWallId(null);
              setWallEditScreenPos(null);
            }}
            className="w-20 px-2 py-1 bg-zinc-900 border border-amber-500/50 text-white font-mono text-sm rounded-lg shadow-xl outline-none"
          />
          <span className="text-[10px] text-zinc-500 ml-1">{displayUnit}</span>
        </div>
      )}

      {/* Custom Context Menu Overlay */}
      {contextMenu && (
        <div 
          className="absolute z-50 bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-xl shadow-2xl py-2 w-48 text-sm"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()} // Prevent closing immediately
        >
          {/* Show unit/fixture/obstacle specific options */}
          {contextMenu.type !== 'wall' && contextMenu.type !== 'vertex' && (
            <>
              <button 
                className="w-full text-left px-4 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2 transition-colors"
                onClick={() => { toggleElementVisibility(contextMenu.id, contextMenu.type as 'unit' | 'fixture' | 'obstacle'); setContextMenu(null); }}
              >
                <EyeOff size={16} />
                إخفاء / إظهار
              </button>
              <button 
                className="w-full text-left px-4 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2 transition-colors"
                onClick={() => { duplicateElement(contextMenu.id, contextMenu.type as 'unit' | 'fixture' | 'obstacle'); setContextMenu(null); }}
              >
                <Copy size={16} />
                تكرار (Copy)
              </button>
              <div className="my-1 border-t border-zinc-800"></div>
            </>
          )}
          
          {/* Delete option for all types */}
          <button 
            className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2 transition-colors"
            onClick={() => {
              if (contextMenu.type === 'wall' && selectedWallIndex !== null && room?.polygonMm) {
                // Delete wall by removing the end vertex
                const newPolygon = [...room.polygonMm];
                const endIndex = (selectedWallIndex + 1) % newPolygon.length;
                newPolygon.splice(endIndex, 1);
                if (newPolygon.length >= 2) {
                  useProjectStore.getState().setRoomPolygon(newPolygon);
                  useProjectStore.getState().commitSnapshot({
                    kind: 'move',
                    label: 'Delete Wall',
                    elementType: 'room',
                  });
                }
              } else if (contextMenu.type === 'vertex' && selectedVertexIndex !== null && room?.polygonMm) {
                // Delete vertex
                const newPolygon = [...room.polygonMm];
                if (newPolygon.length > 3) {
                  newPolygon.splice(selectedVertexIndex, 1);
                  useProjectStore.getState().setRoomPolygon(newPolygon);
                  useProjectStore.getState().commitSnapshot({
                    kind: 'move',
                    label: 'Delete Vertex',
                    elementType: 'room',
                  });
                }
              } else if (contextMenu.type === 'unit') {
                useProjectStore.getState().deleteUnit(contextMenu.id);
              } else if (contextMenu.type === 'fixture') {
                useProjectStore.getState().deleteRoomFixture(contextMenu.id);
              } else if (contextMenu.type === 'obstacle') {
                useProjectStore.getState().deleteRoomObstacle(contextMenu.id);
              }
              setContextMenu(null);
              setSelectedWallIndex(null);
              setSelectedVertexIndex(null);
            }}
          >
            <Trash2 size={16} />
            حذف (Delete)
          </button>
          
          {/* Select option for unit/fixture/obstacle */}
          {contextMenu.type !== 'wall' && contextMenu.type !== 'vertex' && (
            <button 
              className="w-full text-left px-4 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2 transition-colors"
              onClick={() => { selectElement(contextMenu.id, contextMenu.type as 'unit' | 'fixture' | 'obstacle'); setContextMenu(null); }}
            >
              <Edit2 size={16} />
              تعديل المقاسات
            </button>
          )}
        </div>
      )}

      {/* 🏗️ Obstacle Clearance Dialog */}
      {obstacleDialog && (
        <ObstacleClearanceDialog
          obstacle={obstacleDialog.obstacle}
          onConfirm={handleObstacleClearanceConfirm}
          onCancel={() => setObstacleDialog(null)}
        />
      )}

      {/* 🏗️ Appliance Housing Wizard */}
      {applianceWizard && (
        <ApplianceHousingWizard
          applianceName="الجهاز المحدد"
          onConfirm={handleApplianceHousingConfirm}
          onCancel={() => setApplianceWizard(null)}
        />
      )}
    </div>
  );
};
