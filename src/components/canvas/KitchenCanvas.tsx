import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Circle, Text, Group } from 'react-konva';
import { useProjectStore } from '@/store/projectStore';
import { DraggableUnit } from './DraggableUnit';
import { formatMeasurement } from '@/utils/measurements';
import Konva from 'konva';
import { Copy, EyeOff, Edit2, Trash2 } from 'lucide-react';
import { HistoryPanel } from '../HistoryPanel';
import { SplashLoader } from '../SplashLoader';


export const KitchenCanvas = () => {
  const { units, selectElement, room, activeTool, setActiveTool, addRoomObstacle, addRoomFixture, displayUnit, duplicateElement, toggleElementVisibility, isSnappingEnabled } = useProjectStore();
  const { historyVisible } = useProjectStore();
  const stageRef = useRef<Konva.Stage>(null);
  
  const [isMounted, setIsMounted] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  const [measureStart, setMeasureStart] = useState<{ x: number, y: number } | null>(null);
  const [measureCurrent, setMeasureCurrent] = useState<{ x: number, y: number } | null>(null);
  
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, id: string, type: 'unit' | 'fixture' | 'obstacle' } | null>(null);

  const CANVAS_WIDTH = 1200;
  const CANVAS_HEIGHT = 800;
  const SCALE = 0.1; // 1px = 10mm

  // ---------- ALL HOOKS MUST BE BEFORE ANY EARLY RETURN ----------

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

      const { selectedElement, deleteUnit, deleteRoomFixture, deleteRoomObstacle, selectElement, updateUnitPosition, updateRoomFixture, updateRoomObstacle, units, room } = useProjectStore.getState();

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

  // Hide splash after a short delay so the first render has time to paint.
  useEffect(() => {
    if (!room) return;
    const t = window.setTimeout(() => setShowSplash(false), 450);
    return () => window.clearTimeout(t);
  }, [room]);

  // ---------- EARLY RETURN AFTER ALL HOOKS ----------

  if (!isMounted) return <div className="w-full h-full bg-zinc-900/50 animate-pulse rounded-3xl"></div>;

  // Background Grid
  const gridSizePx = 50;
  const gridLines = [];
  for (let i = 0; i < CANVAS_WIDTH / gridSizePx; i++) {
    gridLines.push(
      <Line
        key={`v-${i}`}
        points={[Math.round(i * gridSizePx) + 0.5, 0, Math.round(i * gridSizePx) + 0.5, CANVAS_HEIGHT]}
        stroke="#27272a" // zinc-800
        strokeWidth={1}
      />
    );
  }
  for (let j = 0; j < CANVAS_HEIGHT / gridSizePx; j++) {
    gridLines.push(
      <Line
        key={`h-${j}`}
        points={[0, Math.round(j * gridSizePx) + 0.5, CANVAS_WIDTH, Math.round(j * gridSizePx) + 0.5]}
        stroke="#27272a" // zinc-800
        strokeWidth={1}
      />
    );
  }

  // Center room in canvas
  const offsetX = room ? (CANVAS_WIDTH - room.widthMm * SCALE) / 2 : 0;
  const offsetY = room ? (CANVAS_HEIGHT - room.lengthMm * SCALE) / 2 : 0;

  const getPointerPositionMm = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return { xMm: 0, yMm: 0 };
    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return { xMm: 0, yMm: 0 };

    // Convert pixel to mm relative to room offset
    const xMm = (pointerPosition.x - offsetX) / SCALE;
    const yMm = (pointerPosition.y - offsetY) / SCALE;
    return { xMm, yMm };
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
  };

  const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (activeTool === 'measure' && measureStart) {
      const { xMm, yMm } = getPointerPositionMm(e);
      setMeasureCurrent({ x: xMm, y: yMm });
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
    <div className="w-full h-full bg-transparent overflow-auto relative">
      {showSplash && <SplashLoader />}
      <Stage

        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
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
            {/* Floor */}
            <Rect 
              x={0} 
              y={0} 
              width={room.widthMm * SCALE} 
              height={room.lengthMm * SCALE} 
              fill="rgba(39, 39, 42, 0.3)" 
            />
            
            {/* Walls */}
            <Line
              points={[
                0, 0, 
                room.widthMm * SCALE, 0, 
                room.widthMm * SCALE, room.lengthMm * SCALE, 
                0, room.lengthMm * SCALE, 
                0, 0
              ]}
              stroke="#10b981"
              strokeWidth={4}
              closed
            />

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
                    fill={useProjectStore.getState().selectedElement?.id === fix.id ? "#bae6fd" : (fix.type === 'door' ? "#38bdf8" : "#818cf8")}
                    stroke={useProjectStore.getState().selectedElement?.id === fix.id ? "#ffffff" : "transparent"}
                    strokeWidth={useProjectStore.getState().selectedElement?.id === fix.id ? 2 : 0}
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
                      const SNAP_THRESHOLD = 300;
                      let newXMm = (e.target.x() - w/2) / SCALE;
                      let newYMm = (e.target.y() - d/2) / SCALE;

                      if (isSnappingEnabled) {
                        newXMm = Math.round(newXMm / GRID_SNAP_MM) * GRID_SNAP_MM;
                        newYMm = Math.round(newYMm / GRID_SNAP_MM) * GRID_SNAP_MM;

                        // Wall Snapping
                        if (room) {
                          if (newXMm < SNAP_THRESHOLD) newXMm = 0;
                          else if (newXMm + fix.widthMm > room.widthMm - SNAP_THRESHOLD) newXMm = room.widthMm - fix.widthMm;

                          if (newYMm < SNAP_THRESHOLD) newYMm = 0;
                          else if (newYMm + 100 > room.lengthMm - SNAP_THRESHOLD) newYMm = room.lengthMm - 100;
                        }
                      }

                      useProjectStore.getState().updateRoomFixture(fix.id, { xMm: newXMm, yMm: newYMm });
                      e.target.position({ x: (newXMm * SCALE) + w/2, y: (newYMm * SCALE) + d/2 });
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
                <Text
                  x={(measureStart.x + measureCurrent.x) / 2 * SCALE}
                  y={(measureStart.y + measureCurrent.y) / 2 * SCALE - 20}
                  text={formatMeasurement(Math.hypot(measureCurrent.x - measureStart.x, measureCurrent.y - measureStart.y), displayUnit)}
                  fill="#fcd34d"
                  fontSize={14}
                  fontStyle="bold"
                  align="center"
                  background="#000" // Konva doesn't support Text background directly, but text will be clear enough
                />
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

      {/* Custom Context Menu Overlay */}
      {contextMenu && (
        <div 
          className="absolute z-50 bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-xl shadow-2xl py-2 w-48 text-sm"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()} // Prevent closing immediately
        >
          <button 
            className="w-full text-left px-4 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2 transition-colors"
            onClick={() => { toggleElementVisibility(contextMenu.id, contextMenu.type); setContextMenu(null); }}
          >
            <EyeOff size={16} />
            إخفاء / إظهار
          </button>
          <button 
            className="w-full text-left px-4 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2 transition-colors"
            onClick={() => { duplicateElement(contextMenu.id, contextMenu.type); setContextMenu(null); }}
          >
            <Copy size={16} />
            تكرار (Copy)
          </button>
          <button 
            className="w-full text-left px-4 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2 transition-colors"
            onClick={() => { selectElement(contextMenu.id, contextMenu.type); setContextMenu(null); }}
          >
            <Edit2 size={16} />
            تعديل المقاسات
          </button>
          <div className="my-1 border-t border-zinc-800"></div>
          <button 
            className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2 transition-colors"
            onClick={() => {
              if (contextMenu.type === 'unit') useProjectStore.getState().deleteUnit(contextMenu.id);
              if (contextMenu.type === 'fixture') useProjectStore.getState().deleteRoomFixture(contextMenu.id);
              if (contextMenu.type === 'obstacle') useProjectStore.getState().deleteRoomObstacle(contextMenu.id);
              setContextMenu(null);
            }}
          >
            <Trash2 size={16} />
            حذف (Delete)
          </button>
        </div>
      )}
    </div>
  );
};