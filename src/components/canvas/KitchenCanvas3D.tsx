"use client";

import React, { useMemo, useState, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Box, Text, TransformControls } from '@react-three/drei';
import { useProjectStore } from '@/store/projectStore';
import { formatMeasurement } from '@/utils/measurements';
import * as THREE from 'three';
import { Move, Scaling, RefreshCw, Copy, EyeOff, Edit2, Trash2 } from 'lucide-react';
import { Appliance3D } from './Appliance3D';
import { getWallsFromPolygon, getPolygonBoundingBox } from '@/lib/roomGeometry';
import { RoomWall } from '@/types';
import { SceneExporter, SceneExporterHandle } from './SceneExporter';
import { NotchedPanelMesh } from './NotchedPanel';
import { PanelNotch } from '@/types';

export const KitchenCanvas3D = ({
  readOnly = false,
  exporterRef,
}: {
  readOnly?: boolean;
  exporterRef?: React.RefObject<SceneExporterHandle>;
}) => {
  const { units, room, displayUnit, selectedElement, selectElement, updateUnitPosition, updateUnitDimensions, duplicateElement, toggleElementVisibility, deleteUnit, deleteRoomFixture, deleteRoomObstacle, visibleWalls } = useProjectStore();
  const [transformMode, setTransformMode] = useState<'translate' | 'scale'>('translate');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, id: string, type: 'unit' | 'fixture' | 'obstacle' } | null>(null);
  const orbitRef = useRef<any>(null);
  const [contextLost, setContextLost] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);

  const SCALE_3D = 0.001; 

  const roomBBox = useMemo(() => {
    if (room?.polygonMm?.length) return getPolygonBoundingBox(room.polygonMm);
    return { minX: 0, minY: 0, maxX: room?.widthMm ?? 5000, maxY: room?.lengthMm ?? 5000, width: room?.widthMm ?? 5000, height: room?.lengthMm ?? 5000 };
  }, [room]);

  const roomWidthM = roomBBox.width * SCALE_3D;
  const roomLengthM = roomBBox.height * SCALE_3D;
  const roomCenterX = (roomBBox.minX + roomBBox.maxX) / 2 * SCALE_3D;
  const roomCenterZ = (roomBBox.minY + roomBBox.maxY) / 2 * SCALE_3D;
  const roomHeightM = room ? room.heightMm * SCALE_3D : 2.8;

  const resetCamera = () => {
    if (orbitRef.current) {
      orbitRef.current.reset();
    }
  };

  // Helper to create wall shape from RoomWall with fixture holes
  const createWallShapeForWall = (wall: RoomWall, fixtures: any[]) => {
    const wallLengthM = wall.lengthMm * SCALE_3D;
    const shape = new THREE.Shape();

    shape.moveTo(0, 0);
    shape.lineTo(wallLengthM, 0);
    shape.lineTo(wallLengthM, roomHeightM);
    shape.lineTo(0, roomHeightM);
    shape.lineTo(0, 0);

    const angleRad = wall.angleDeg * (Math.PI / 180);
    const cosA = Math.cos(angleRad);
    const sinA = Math.sin(angleRad);

    fixtures
      ?.filter((f) => !f.isHidden && (f.type === 'door' || f.type === 'window'))
      .forEach((fix) => {
        // fix.xMm/fix.yMm = fixture LEFT EDGE in world coords.
        // Project the fixture CENTER onto the wall direction.
        const centerWorldX = fix.xMm + fix.widthMm / 2;
        const centerWorldY = fix.yMm;
        const fx = centerWorldX - wall.startPoint.xMm;
        const fy = centerWorldY - wall.startPoint.yMm;
        const alongWall = fx * cosA + fy * sinA;
        const perpDist = Math.abs(-fx * sinA + fy * cosA);

        if (perpDist < 200 && alongWall >= 0 && alongWall <= wall.lengthMm) {
          const fw = fix.widthMm * SCALE_3D;
          const fh = fix.heightMm * SCALE_3D;
          const fz = fix.zMm * SCALE_3D;
          // Clamp so the hole stays fully inside the wall bounds
          const fxPos = Math.max(0, Math.min(wallLengthM - fw, alongWall * SCALE_3D - fw / 2));

          const hole = new THREE.Path();
          hole.moveTo(fxPos, fz);
          hole.lineTo(fxPos + fw, fz);
          hole.lineTo(fxPos + fw, fz + fh);
          hole.lineTo(fxPos, fz + fh);
          hole.lineTo(fxPos, fz);
          shape.holes.push(hole);
        }
      });

    return shape;
  };

  // Memoized wall mesh to prevent recreating extrudeGeometry on every render
  const WallMesh = ({
    wall,
    idx,
    visible,
    transparent,
  }: {
    wall: RoomWall;
    idx: number;
    visible: boolean;
    transparent: boolean;
  }) => {
    const fixtures = room?.fixtures || [];

    const wallShape = useMemo(
      () => createWallShapeForWall(wall, fixtures),
      // createWallShapeForWall depends on: SCALE_3D, roomHeightM
      // and on wall + fixtures contents.
      [wall, fixtures, roomHeightM]
    );

    const extrudeArgs = useMemo(
      () => [wallShape, { depth: 0.1, bevelEnabled: false }] as const,
      [wallShape]
    );

    const xPos = wall.startPoint.xMm * SCALE_3D;
    const zPos = wall.startPoint.yMm * SCALE_3D;
    const angleRad = wall.angleDeg * (Math.PI / 180);

    if (!visible) return null;

    return (
      <mesh
        position={[xPos, 0, zPos]}
        rotation={[0, -angleRad, 0]}
        castShadow
        receiveShadow
      >
        <extrudeGeometry args={extrudeArgs as any} />
        <meshStandardMaterial
          color="#f0ece4"
          roughness={0.85}
          metalness={0.0}
          transparent={transparent}
          opacity={transparent ? 0.25 : 1}
          depthWrite={!transparent}
          envMapIntensity={0.3}
        />
      </mesh>
    );
  };

  // Get walls from polygon for non-rectangular room support
  const roomWalls = useMemo(() => {
    if (room && room.polygonMm && room.polygonMm.length >= 3) {
      return getWallsFromPolygon(room.polygonMm);
    }
    return [];
  }, [room]);

  // Floor shape from polygon
  // Negate Y so that after -90° X rotation the floor lies in +Z (inside the room)
  const floorShape = useMemo(() => {
    if (!room?.polygonMm?.length) return null;
    const shape = new THREE.Shape();
    room.polygonMm.forEach((p, i) => {
      const x = p.xMm * SCALE_3D;
      const y = -p.yMm * SCALE_3D;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    });
    shape.closePath();
    return shape;
  }, [room, SCALE_3D]);

  // لإغلاق القائمة عند الضغط في أي مكان
  const handlePointerMissed = () => {
    if (!readOnly) selectElement(null);
    setContextMenu(null);
  };

  return (
    <div 
      className="w-full h-full relative bg-zinc-900"
      onContextMenu={(e) => {
        e.preventDefault();
        if (readOnly) setContextMenu(null);
      }}
      onClick={() => setContextMenu(null)}
    >
      
      {/* Overlay UI for Transform Controls */}
      {selectedElement?.type === 'unit' && !readOnly && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 p-2 rounded-2xl shadow-2xl">
          <button 
            onClick={() => setTransformMode('translate')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${transformMode === 'translate' ? 'bg-emerald-500 text-zinc-950' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
          >
            <Move size={16} /> تحريك
          </button>
          <button 
            onClick={() => setTransformMode('scale')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${transformMode === 'scale' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
          >
            <Scaling size={16} /> تغيير المقاس (Stretch)
          </button>
          <div className="w-px h-6 bg-zinc-800 mx-2"></div>
          <button 
            onClick={resetCamera}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
          >
            <RefreshCw size={16} /> إعادة الكاميرا
          </button>
        </div>
      )}

      <Canvas 
        key={canvasKey}
        camera={{ position: [roomCenterX, roomHeightM + 2, roomCenterZ + roomLengthM + 2], fov: 50 }}
        onPointerMissed={handlePointerMissed}
        shadows
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0, outputColorSpace: THREE.SRGBColorSpace, powerPreference: 'default' }}
        dpr={[1, 1]}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            console.warn('WebGL context lost — will recover');
            setContextLost(true);
          });
          gl.domElement.addEventListener('webglcontextrestored', () => {
            console.info('WebGL context restored');
            setContextLost(false);
          });
        }}
      >
        <color attach="background" args={['#1a1a2e']} />

        {/* Single key light with moderate shadow map */}
        <directionalLight
          position={[8, 12, 6]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-far={30}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
          shadow-bias={-0.001}
          color="#fff5e6"
        />
        <ambientLight intensity={0.35} />
        <hemisphereLight args={['#b0c4de', '#5a5040', 0.4]} />
        
        {/* Floor from polygon */}
        {floorShape && (
          <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
              <shapeGeometry args={[floorShape]} />
              <meshStandardMaterial
                color="#2a2a2a"
                roughness={0.85}
                metalness={0.05}
              />
            </mesh>
            {/* Floor edge outline */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
              <shapeGeometry args={[floorShape]} />
              <meshBasicMaterial color="#3f3f46" wireframe />
            </mesh>
          </group>
        )}

        {/* Walls from polygonMm */}
        {roomWalls.map((wall, idx) => {
          // Determine wall visibility based on visibleWalls state
          // For rectangular rooms: idx 0 = back, 1 = right, 2 = front, 3 = left
          // For non-rectangular rooms, show all walls by default
          const isBackWall = idx === 0;
          const isRightWall = idx === 1;
          const isFrontWall = idx === 2;
          const isLeftWall = idx === 3;

          // For non-rectangular rooms (more than 4 walls), always show all walls
          const isNonRectangular = roomWalls.length > 4;

          const isVisible =
            isNonRectangular ||
            (isBackWall && visibleWalls.back) ||
            (isRightWall && visibleWalls.right) ||
            (isFrontWall && visibleWalls.front) ||
            (isLeftWall && visibleWalls.left);

          // Only make walls transparent if they are explicitly hidden
          // For rectangular rooms: front and left walls can be transparent when hidden
          const isTransparent = !isNonRectangular && (
            (isFrontWall && !visibleWalls.front) ||
            (isLeftWall && !visibleWalls.left)
          );

          return (
            <WallMesh
              key={wall.id}
              wall={wall}
              idx={idx}
              visible={isVisible}
              transparent={isTransparent}
            />
          );
        })}

        {/* Kitchen Units */}
        {units.filter(u => !u.isHidden).map((unit) => {
          const w = unit.dimensions.widthMm * SCALE_3D;
          const h = unit.dimensions.heightMm * SCALE_3D;
          const d = unit.dimensions.depthMm * SCALE_3D;
          
          const elevationMm = unit.position.zMm ?? (unit.type === 'wall' ? 1500 : 0); 
          
          const xPos = (unit.position.xMm * SCALE_3D) + (w / 2);
          const yPos = (elevationMm * SCALE_3D) + (h / 2);
          const zPos = (unit.position.yMm * SCALE_3D) + (d / 2);

          // اللون من بيانات الوحدة مباشرة — اللون المختار من الـ palette
          const bodyColor = unit.colorHex || '#D4B896';
          const doorColor = unit.doorColorHex || bodyColor;
          const color = bodyColor;
          
          const rotationRad = (unit.position.rotationDeg || 0) * (Math.PI / -180);
          const isSelected = useProjectStore.getState().selectedElements.some(e => e.id === unit.id);
          const isPrimarySelected = selectedElement?.id === unit.id;

          const isFridge = unit.label?.includes('ثلاجة') || unit.label?.toLowerCase().includes('fridge');
          const isFreezer = unit.label?.includes('فريزر') || unit.label?.toLowerCase().includes('freezer');
          const isOven = unit.label?.includes('فرن') || unit.label?.toLowerCase().includes('oven') || unit.label?.includes('بوتاجاز');
          const isStove = unit.label?.includes('بوتاجاز') || unit.label?.toLowerCase().includes('stove') || unit.label?.toLowerCase().includes('hob');
          const isDishwasher = unit.label?.includes('غسالة أطباق') || unit.label?.toLowerCase().includes('dishwasher');
          const isWashingMachine = unit.label?.includes('غسالة ملابس') || unit.label?.toLowerCase().includes('washing_machine');
          const isDryer = unit.label?.includes('مجفف') || unit.label?.toLowerCase().includes('dryer');
          const isSink = unit.label?.includes('حوض') || unit.label?.toLowerCase().includes('sink');

          // Detect variant from label (premium, compact, standard)
          const getVariant = (): 'standard' | 'premium' | 'compact' => {
            const label = unit.label?.toLowerCase() || '';
            if (label.includes('premium') || label.includes('بريميوم') || label.includes('فاخرة')) return 'premium';
            if (label.includes('compact') || label.includes('كومباكت') || label.includes('مدمج')) return 'compact';
            return 'standard';
          };
          const applianceVariant = (isFridge || isOven) ? getVariant() : undefined;

          const unitContent = (
            <group 
              onClick={(e) => {
                e.stopPropagation();
                if (readOnly) {
                  // في وضع العرض: السماح بفتح/إغلاق الأبواب بس
                  const hasDoors = unit.doorCount && unit.doorCount > 0;
                  const hasDrawers = unit.drawerCount && unit.drawerCount > 0;
                  if (hasDoors || hasDrawers) {
                    setContextMenu({ x: e.clientX, y: e.clientY, id: unit.id, type: 'unit' });
                  }
                  return;
                }
                selectElement(unit.id, 'unit', e.shiftKey);
                setContextMenu(null);
              }}
              onContextMenu={(e) => {
                e.stopPropagation();
                if (readOnly) {
                  // في وضع العرض: السماح بفتح/إغلاق الأبواب بس
                  const hasDoors = unit.doorCount && unit.doorCount > 0;
                  const hasDrawers = unit.drawerCount && unit.drawerCount > 0;
                  if (hasDoors || hasDrawers) {
                    setContextMenu({ x: e.clientX, y: e.clientY, id: unit.id, type: 'unit' });
                  }
                  return;
                }
                selectElement(unit.id, 'unit', e.shiftKey);
                setContextMenu({ x: e.clientX, y: e.clientY, id: unit.id, type: 'unit' });
              }}
            >
              {/* Main Carcass */}
              {isFridge ? (
                <Appliance3D type="fridge" width={w} height={h} depth={d} variant={applianceVariant} />
              ) : isFreezer ? (
                <Appliance3D type="freezer" width={w} height={h} depth={d} />
              ) : isOven ? (
                <Appliance3D type="oven" width={w} height={h} depth={d} variant={applianceVariant} />
              ) : isStove ? (
                <Appliance3D type="stove" width={w} height={h} depth={d} />
              ) : isDishwasher ? (
                <Appliance3D type="dishwasher" width={w} height={h} depth={d} />
              ) : isWashingMachine ? (
                <Appliance3D type="washing_machine" width={w} height={h} depth={d} />
              ) : isDryer ? (
                <Appliance3D type="dryer" width={w} height={h} depth={d} />
              ) : unit.type.startsWith('corner') ? (
                <group>
                  {/* Back Wall (along X) */}
                  <Box args={[w, h, 0.018]} position={[0, 0, -d/2 + 0.009]} castShadow receiveShadow>
                    <meshStandardMaterial color={isSelected ? '#f59e0b' : color} roughness={0.2} />
                  </Box>
                  {/* Left Wall (along Z) */}
                  <Box args={[0.018, h, d - 0.018]} position={[-w/2 + 0.009, 0, 0.009]} castShadow receiveShadow>
                    <meshStandardMaterial color={isSelected ? '#f59e0b' : color} roughness={0.2} />
                  </Box>
                  {/* Right Leg Side Panel */}
                  <Box args={[0.018, h, ((unit.dimensions.rightLegCarcassDepthMm || 600) * SCALE_3D) - 0.018]} position={[w/2 - 0.009, 0, -d/2 + 0.009 + ((unit.dimensions.rightLegCarcassDepthMm || 600) * SCALE_3D)/2]} castShadow receiveShadow>
                    <meshStandardMaterial color={isSelected ? '#f59e0b' : color} roughness={0.2} />
                  </Box>
                  {/* Left Leg Front Panel */}
                  <Box args={[((unit.dimensions.leftLegCarcassDepthMm || 600) * SCALE_3D) - 0.018, h, 0.018]} position={[-w/2 + 0.009 + ((unit.dimensions.leftLegCarcassDepthMm || 600) * SCALE_3D)/2, 0, d/2 - 0.009]} castShadow receiveShadow>
                    <meshStandardMaterial color={isSelected ? '#f59e0b' : color} roughness={0.2} />
                  </Box>
                  
                  {/* Internal Shelves Rendering */}
                  {unit.cornerConfig?.internalSolution === 'lazy_susan_2tier' ? (
                    <group position={[
                      -w/2 + ((unit.cornerConfig.lazySusanDiameterMm || 750) * SCALE_3D)/2 + 0.02, 
                      0, 
                      -d/2 + ((unit.cornerConfig.lazySusanDiameterMm || 750) * SCALE_3D)/2 + 0.02
                    ]}>
                      {/* Center Pole */}
                      <mesh castShadow position={[0, 0, 0]}>
                        <cylinderGeometry args={[0.015, 0.015, h - 0.04, 16]} />
                        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
                      </mesh>
                      {/* Top Shelf */}
                      <mesh position={[0, h * 0.15, 0]} rotation={[0, Math.PI/2, 0]} castShadow>
                        <cylinderGeometry args={[((unit.cornerConfig.lazySusanDiameterMm || 750) * SCALE_3D)/2, ((unit.cornerConfig.lazySusanDiameterMm || 750) * SCALE_3D)/2, 0.018, 32, 1, false, 0, Math.PI * 1.5]} />
                        <meshStandardMaterial color="#f8fafc" roughness={0.1} />
                      </mesh>
                      {/* Bottom Shelf */}
                      <mesh position={[0, -h * 0.25, 0]} rotation={[0, Math.PI/2, 0]} castShadow>
                        <cylinderGeometry args={[((unit.cornerConfig.lazySusanDiameterMm || 750) * SCALE_3D)/2, ((unit.cornerConfig.lazySusanDiameterMm || 750) * SCALE_3D)/2, 0.018, 32, 1, false, 0, Math.PI * 1.5]} />
                        <meshStandardMaterial color="#f8fafc" roughness={0.1} />
                      </mesh>
                    </group>
                  ) : (
                    <group>
                      {Array.from({ length: unit.shelfCount || (unit.type.includes('wall') ? 2 : 1) }).map((_, i, arr) => {
                        const spacing = h / (arr.length + 1);
                        const yPos = -h/2 + spacing * (i + 1);
                        const leftD = (unit.dimensions.leftLegCarcassDepthMm || 600) * SCALE_3D;
                        const rightD = (unit.dimensions.rightLegCarcassDepthMm || 600) * SCALE_3D;
                        
                        return (
                          <group key={`shelf-${i}`} position={[0, yPos, 0]}>
                            {/* Left Leg Shelf Part */}
                            <Box args={[leftD - 0.018, 0.018, d - 0.036]} position={[-w/2 + leftD/2 + 0.009, 0, 0]} castShadow receiveShadow>
                              <meshStandardMaterial color="#f8fafc" roughness={0.2} />
                            </Box>
                            {/* Right Leg Shelf Part */}
                            <Box args={[w - leftD - 0.018, 0.018, rightD - 0.036]} position={[(leftD - 0.018)/2, 0, -d/2 + rightD/2]} castShadow receiveShadow>
                              <meshStandardMaterial color="#f8fafc" roughness={0.2} />
                            </Box>
                          </group>
                        )
                      })}
                    </group>
                  )}
                </group>
              ) : unit.obstacleFit && room?.obstacles ? (
                /* Obstacle-aware carcass — single panels with L-shaped notch */
                (() => {
                  const obstacle = room.obstacles.find(o => o.id === unit.obstacleFit!.obstacleId);
                  if (!obstacle) {
                    return (
                      <group>
                        <Box args={[0.018, h, d]} position={[-w/2 + 0.009, 0, 0]} castShadow receiveShadow>
                          <meshStandardMaterial color={isSelected ? '#f59e0b' : color} roughness={0.2} metalness={0.05} />
                        </Box>
                        <Box args={[0.018, h, d]} position={[w/2 - 0.009, 0, 0]} castShadow receiveShadow>
                          <meshStandardMaterial color={isSelected ? '#f59e0b' : color} roughness={0.2} metalness={0.05} />
                        </Box>
                        <Box args={[w - 0.036, 0.018, d]} position={[0, h/2 - 0.009, 0]} castShadow receiveShadow>
                          <meshStandardMaterial color={isSelected ? '#f59e0b' : color} roughness={0.2} metalness={0.05} />
                        </Box>
                        <Box args={[w - 0.036, 0.018, d]} position={[0, -h/2 + 0.009, 0]} castShadow receiveShadow>
                          <meshStandardMaterial color={isSelected ? '#f59e0b' : color} roughness={0.2} metalness={0.05} />
                        </Box>
                        <Box args={[w - 0.036, h - 0.036, 0.018]} position={[0, 0, -d/2 + 0.009]} castShadow receiveShadow>
                          <meshStandardMaterial color={isSelected ? '#f59e0b' : color} roughness={0.2} metalness={0.05} />
                        </Box>
                        <Box args={[w, h, d]}>
                          <meshBasicMaterial color={isSelected ? '#000000' : '#ffffff'} wireframe />
                        </Box>
                      </group>
                    );
                  }

                  const clearanceMm = unit.obstacleFit!.clearanceMm || 0;
                  const PT = 18;
                  const widthMm = unit.dimensions.widthMm;
                  const depthMm = unit.dimensions.depthMm;
                  const heightMm = unit.dimensions.heightMm;
                  const innerWidthMm = widthMm - 2 * PT;

                  const localObsLeft = obstacle.xMm - unit.position.xMm - clearanceMm;
                  const localObsRight = obstacle.xMm + obstacle.widthMm - unit.position.xMm + clearanceMm;
                  const isNearRightEdge = localObsRight >= widthMm;
                  const columnSide: "left" | "right" = isNearRightEdge ? "right" : "left";
                  const notchWidth = Math.min(localObsRight, widthMm) - Math.max(localObsLeft, 0);
                  const notchDepth = obstacle.depthMm + clearanceMm;

                  const horizontalNotch: PanelNotch = {
                    cornerX: columnSide,
                    cornerY: "back",
                    notchWidthMm: notchWidth,
                    notchDepthMm: notchDepth,
                  };
                  const backNotch: PanelNotch = { ...horizontalNotch };
                  const sideNotch = (side: "left" | "right"): PanelNotch | undefined => {
                    if (side !== columnSide) return undefined;
                    return {
                      cornerX: side === "left" ? "left" : "right",
                      cornerY: "back",
                      notchWidthMm: notchDepth,
                      notchDepthMm: notchWidth,
                    };
                  };

                  const shelfCount = unit.shelfCount || 0;
                  const shelfDepthMm = depthMm - 20;
                  const shelfElements: React.ReactNode[] = [];
                  for (let si = 0; si < shelfCount; si++) {
                    const spacing = h / (shelfCount + 1);
                    const shelfY = -h / 2 + spacing * (si + 1);
                    shelfElements.push(
                      <NotchedPanelMesh
                        key={`obs-shelf-${si}`}
                        faceWidthMm={innerWidthMm}
                        faceHeightMm={shelfDepthMm}
                        thicknessMm={16}
                        notch={horizontalNotch}
                        position={[0, shelfY, 0]}
                        rotation={[-Math.PI / 2, 0, 0]}
                        color={color}
                        isSelected={isSelected}
                      />
                    );
                  }

                  return (
                    <group>
                      <NotchedPanelMesh
                        faceWidthMm={depthMm}
                        faceHeightMm={heightMm}
                        thicknessMm={PT}
                        notch={sideNotch("left")}
                        position={[-w / 2 + PT * SCALE_3D / 2, 0, 0]}
                        rotation={[0, Math.PI / 2, 0]}
                        color={color}
                        isSelected={isSelected}
                      />
                      <NotchedPanelMesh
                        faceWidthMm={depthMm}
                        faceHeightMm={heightMm}
                        thicknessMm={PT}
                        notch={sideNotch("right")}
                        position={[w / 2 - PT * SCALE_3D / 2, 0, 0]}
                        rotation={[0, -Math.PI / 2, 0]}
                        color={color}
                        isSelected={isSelected}
                      />
                      <NotchedPanelMesh
                        faceWidthMm={innerWidthMm}
                        faceHeightMm={depthMm}
                        thicknessMm={PT}
                        notch={horizontalNotch}
                        position={[0, h / 2 - PT * SCALE_3D / 2, 0]}
                        rotation={[-Math.PI / 2, 0, 0]}
                        color={color}
                        isSelected={isSelected}
                      />
                      <NotchedPanelMesh
                        faceWidthMm={innerWidthMm}
                        faceHeightMm={depthMm}
                        thicknessMm={PT}
                        notch={horizontalNotch}
                        position={[0, -h / 2 + PT * SCALE_3D / 2, 0]}
                        rotation={[-Math.PI / 2, 0, 0]}
                        color={color}
                        isSelected={isSelected}
                      />
                      <NotchedPanelMesh
                        faceWidthMm={innerWidthMm}
                        faceHeightMm={heightMm}
                        thicknessMm={PT}
                        notch={backNotch}
                        position={[0, 0, -d / 2 + PT * SCALE_3D / 2]}
                        color={color}
                        isSelected={isSelected}
                      />
                      {shelfElements}
                      
                      {/* أغطية الوفوهات الداخلية للعمود بالخشب — كل وجة جوه الوحدة تتغطى */}
                      {(() => {
                        const PT = 0.018;
                        const coverH = h;
                        const obsLocalX = (obstacle.xMm - unit.position.xMm) * SCALE_3D - w / 2;
                        const obsLocalY = (obstacle.yMm - unit.position.yMm) * SCALE_3D - d / 2;
                        const obsLocalRight = (obstacle.xMm + obstacle.widthMm - unit.position.xMm) * SCALE_3D - w / 2;
                        const obsLocalFront = (obstacle.yMm + obstacle.depthMm - unit.position.yMm) * SCALE_3D - d / 2;
                        const obsCenterX = (obsLocalX + obsLocalRight) / 2;
                        const obsWidth3D = obsLocalRight - obsLocalX;

                        // Clamp Z range to unit boundaries — cover only the part inside the unit
                        const clampedBack = Math.max(obsLocalY, -d / 2);
                        const clampedFront = Math.min(obsLocalFront, d / 2);
                        const clampedDepth = Math.max(0, clampedFront - clampedBack);
                        const clampedCenterZ = (clampedBack + clampedFront) / 2;

                        // Clamp X range for front/back covers
                        const clampedLeft = Math.max(obsLocalX, -w / 2);
                        const clampedRight = Math.min(obsLocalRight, w / 2);
                        const clampedWidth = Math.max(0, clampedRight - clampedLeft);
                        const clampedCenterX = (clampedLeft + clampedRight) / 2;

                        const covers: React.ReactNode[] = [];

                        // 1. الوجه الأيسر للعمود — غطاء على الجهة الشمال (x = obsLocalX)
                        if (obstacle.xMm > unit.position.xMm + clearanceMm) {
                          covers.push(
                            <Box key="col_cover_left" args={[PT, coverH, clampedDepth]} position={[obsLocalX - PT / 2, 0, clampedCenterZ]} castShadow receiveShadow>
                              <meshStandardMaterial color={color} roughness={0.2} metalness={0.05} />
                            </Box>
                          );
                        }

                        // 2. الوجه الأيمن للعمود — غطاء على الجهة اليمنى (x = obsLocalRight)
                        if (obstacle.xMm + obstacle.widthMm < unit.position.xMm + widthMm - clearanceMm) {
                          covers.push(
                            <Box key="col_cover_right" args={[PT, coverH, clampedDepth]} position={[obsLocalRight + PT / 2, 0, clampedCenterZ]} castShadow receiveShadow>
                              <meshStandardMaterial color={color} roughness={0.2} metalness={0.05} />
                            </Box>
                          );
                        }

                        // 3. الوجه الأمامي للعمود — غطاء على الجهة الأمامية (z = obsLocalFront)
                        if (obstacle.yMm + obstacle.depthMm < unit.position.yMm + depthMm - clearanceMm) {
                          covers.push(
                            <Box key="col_cover_front" args={[clampedWidth, coverH, PT]} position={[clampedCenterX, 0, obsLocalFront + PT / 2]} castShadow receiveShadow>
                              <meshStandardMaterial color={color} roughness={0.2} metalness={0.05} />
                            </Box>
                          );
                        }

                        // 4. الوجه الخلفي للعمود — غطاء على الجهة الخلفية (z = obsLocalY)
                        if (obstacle.yMm > unit.position.yMm + clearanceMm) {
                          covers.push(
                            <Box key="col_cover_back" args={[clampedWidth, coverH, PT]} position={[clampedCenterX, 0, obsLocalY - PT / 2]} castShadow receiveShadow>
                              <meshStandardMaterial color={color} roughness={0.2} metalness={0.05} />
                            </Box>
                          );
                        }

                        return <>{covers}</>;
                      })()}
                      
                      <Box args={[w, h, d]}>
                        <meshBasicMaterial color={isSelected ? '#000000' : '#ffffff'} wireframe />
                      </Box>
                    </group>
                  );
                })()
              ) : (
                <>
                  {/* Hollow Carcass - built from 5 panels like corner units */}
                  <group>
                    {/* Left Side Panel */}
                    <Box args={[0.018, h, d]} position={[-w/2 + 0.009, 0, 0]} castShadow receiveShadow>
                      <meshStandardMaterial color={isSelected ? '#f59e0b' : color} roughness={0.35} metalness={0.02} envMapIntensity={0.5} />
                    </Box>
                    {/* Right Side Panel */}
                    <Box args={[0.018, h, d]} position={[w/2 - 0.009, 0, 0]} castShadow receiveShadow>
                      <meshStandardMaterial color={isSelected ? '#f59e0b' : color} roughness={0.35} metalness={0.02} envMapIntensity={0.5} />
                    </Box>
                    {/* Top Panel */}
                    <Box args={[w - 0.036, 0.018, d]} position={[0, h/2 - 0.009, 0]} castShadow receiveShadow>
                      <meshStandardMaterial color={isSelected ? '#f59e0b' : color} roughness={0.35} metalness={0.02} envMapIntensity={0.5} />
                    </Box>
                    {/* Bottom Panel */}
                    <Box args={[w - 0.036, 0.018, d]} position={[0, -h/2 + 0.009, 0]} castShadow receiveShadow>
                      <meshStandardMaterial color={isSelected ? '#f59e0b' : color} roughness={0.35} metalness={0.02} envMapIntensity={0.5} />
                    </Box>
                    {/* Back Panel */}
                    <Box args={[w - 0.036, h - 0.036, 0.018]} position={[0, 0, -d/2 + 0.009]} castShadow receiveShadow>
                      <meshStandardMaterial color={isSelected ? '#f59e0b' : color} roughness={0.5} metalness={0.0} envMapIntensity={0.2} />
                    </Box>
                  </group>
                  <Box args={[w, h, d]}>
                    <meshBasicMaterial color={isSelected ? '#000000' : '#ffffff'} wireframe />
                  </Box>
                </>
              )}
              
               {/* LED Lighting Effect */}
              {(() => {
                const ledCfg = unit.ledConfig;
                if (!ledCfg?.hasLed) return null;
                const ledDetails: any[] = [];
                const ledBrightness = ledCfg.brightness || 0.8;
                const ledColor = new THREE.Color(ledCfg.colorHex || '#FFE4B5');
                const ledIntensity = ledBrightness * 0.5; // Scale for scene lighting
                
                const addExternalLed = (posY: number, label: string) => {
                  // A long thin emissive box at the front edge
                  const extLen = (ledCfg.externalLengthMm || unit.dimensions.widthMm) * SCALE_3D;
                  ledDetails.push(
                    <group key={`led-ext-${label}`} position={[0, posY, d/2 + 0.002]}>
                      <Box args={[extLen, 0.005, 0.008]}>
                        <meshStandardMaterial 
                          color={ledColor} 
                          emissive={ledColor} 
                          emissiveIntensity={ledBrightness * 0.8}
                          transparent 
                          opacity={0.9}
                        />
                      </Box>
                      {/* Point light to illuminate the area */}
                      <pointLight 
                        position={[0, 0, 0.03]} 
                        color={ledColor} 
                        intensity={ledIntensity} 
                        distance={0.5} 
                        decay={2}
                      />
                    </group>
                  );
                };

                const addInternalLed = (shelfIndex: number, posY: number) => {
                  const intLen = (ledCfg.internalLengthMm || unit.dimensions.widthMm) / ((unit.shelfCount || 1)) * SCALE_3D;
                  ledDetails.push(
                    <group key={`led-int-${shelfIndex}`} position={[0, posY, -d/2 + 0.01]}>
                      <Box args={[intLen, 0.005, 0.008]}>
                        <meshStandardMaterial 
                          color={ledColor}
                          emissive={ledColor}
                          emissiveIntensity={ledBrightness * 0.6}
                          transparent
                          opacity={0.7}
                        />
                      </Box>
                    </group>
                  );
                };

                const placement = ledCfg.placement || 'external_top';
                if (placement === 'external_top' || placement === 'both') {
                  addExternalLed(h/2 - 0.01, 'top');
                }
                if (placement === 'external_bottom' || placement === 'both') {
                  addExternalLed(-h/2 + 0.01, 'bottom');
                }
                if (placement === 'internal_top' || placement === 'internal_bottom' || placement === 'both') {
                  const shelfCnt = unit.shelfCount || 1;
                  for (let s = 0; s < shelfCnt; s++) {
                    const spacing = h / (shelfCnt + 1);
                    const shelfY = -h/2 + spacing * (s + 1);
                    if (placement === 'internal_top' || placement === 'both') {
                      addInternalLed(s, shelfY + 0.01); // above shelf
                    }
                    if (placement === 'internal_bottom') {
                      addInternalLed(s, shelfY - 0.01); // below shelf
                    }
                  }
                }
                return ledDetails;
              })()}

               {/* 3D Details: Doors, Drawers, Countertop */}
              {(() => {
                if (isFridge || isOven) return null; // Skip doors/drawers/countertop for full appliances
                // Note: keep this IIFE stable; any bracket mismatch breaks TS/JSX parsing.


                const details: any[] = [];
                const doorT = 0.018; // 18mm thickness
                const frontZ = d / 2 + doorT / 2;
                
                // Countertop for base/drawer units
                if (unit.type === 'base' || unit.type === 'drawer_unit' || unit.type === 'corner_base') {
                  const counterT = 0.04; // 40mm
                  if (unit.type === 'corner_base') {
                     details.push(
                       <group key="counter" position={[0, h/2 + counterT/2, 0]}>
                         <Box args={[w + 0.02, counterT, (unit.dimensions.rightLegCarcassDepthMm || 600) * SCALE_3D + 0.02]} position={[0, 0, -d/2 + ((unit.dimensions.rightLegCarcassDepthMm || 600) * SCALE_3D)/2 - 0.01]} castShadow>
                           <meshStandardMaterial color="#f8fafc" roughness={0.1} />
                         </Box>
                         <Box args={[(unit.dimensions.leftLegCarcassDepthMm || 600) * SCALE_3D + 0.02, counterT, d + 0.02]} position={[-w/2 + ((unit.dimensions.leftLegCarcassDepthMm || 600) * SCALE_3D)/2 - 0.01, 0, 0.01]} castShadow>
                           <meshStandardMaterial color="#f8fafc" roughness={0.1} />
                         </Box>
                       </group>
                     );
                  } else {
                    details.push(
                      <Box key="counter" args={[w + 0.02, counterT, d + 0.02]} position={[0, h/2 + counterT/2, 0.01]} castShadow>
                        <meshStandardMaterial color="#f8fafc" roughness={0.1} />
                      </Box>
                    );
                  }

                  if (isSink) {
                    details.push(
                      <group key="sink-group" position={[0, h/2 + counterT, 0.01]}>
                        <Appliance3D type="sink" width={w} height={0.15} depth={d} />
                      </group>
                    );
                  }
                }

                const drawerH = 0.2; 
                let doorsYStart = -h/2 + (unit.type === 'base' || unit.type === 'tall' || unit.type === 'corner_base' || unit.type === 'corner_tall' ? 0.1 : 0); // Account for plinth
                let doorsHeight = h - (unit.type === 'base' || unit.type === 'tall' || unit.type === 'corner_base' || unit.type === 'corner_tall' ? 0.1 : 0);

                // Drawers with realistic open/close animation
                if (unit.drawerCount && unit.drawerCount > 0) {
                  const actualDrawerH = unit.type === 'drawer_unit' ? doorsHeight / unit.drawerCount : drawerH;
                  for(let i=0; i<unit.drawerCount; i++) {
                    const yPos = (h/2) - (actualDrawerH / 2) - (i * actualDrawerH);
                    const isOpen = unit._3dDrawerOpen;
                    const openOffset = isOpen ? 0.15 : 0; // Pull out 150mm when open
                    
                    // Drawer sides/box (visible when open)
                    const drawerBoxH = actualDrawerH - 0.02;
                    const drawerBoxD = isOpen ? 0.15 : 0.18;
                    
                    details.push(
                      <group key={`drawer-${i}`}>
                        <group position={[0, yPos, frontZ + (isOpen ? openOffset : 0)]}>
                          {/* Drawer Front Panel */}
                          <Box args={[w - 0.004, actualDrawerH - 0.004, 0.016]} castShadow>
                            <meshStandardMaterial color={isSelected ? '#fcd34d' : doorColor} roughness={0.28} metalness={0.01} envMapIntensity={0.5} />
                          </Box>
                          {/* Drawer Handle (profile/bar handle) */}
                          <Box args={[w * 0.35, 0.015, 0.012]} position={[0, -(actualDrawerH/2) + 0.02, 0.012]} castShadow>
                            <meshStandardMaterial color="#a8a29e" metalness={0.9} roughness={0.1} envMapIntensity={1.2} />
                          </Box>
                          {/* Drawer sides (visible when open) */}
                          {isOpen && (
                            <>
                              {/* Drawer left side */}
                              <Box args={[0.012, drawerBoxH, drawerBoxD]} position={[-w/2 + 0.008, 0, -drawerBoxD/2]} castShadow>
                                <meshStandardMaterial color="#d4d4d8" roughness={0.4} />
                              </Box>
                              {/* Drawer right side */}
                              <Box args={[0.012, drawerBoxH, drawerBoxD]} position={[w/2 - 0.008, 0, -drawerBoxD/2]} castShadow>
                                <meshStandardMaterial color="#d4d4d8" roughness={0.4} />
                              </Box>
                              {/* Drawer bottom */}
                              <Box args={[w - 0.024, 0.006, drawerBoxD]} position={[0, -drawerBoxH/2, -drawerBoxD/2]} castShadow>
                                <meshStandardMaterial color="#a1a1aa" roughness={0.5} />
                              </Box>
                              {/* Drawer back */}
                              <Box args={[w - 0.024, drawerBoxH, 0.006]} position={[0, 0, -drawerBoxD]} castShadow>
                                <meshStandardMaterial color="#a1a1aa" roughness={0.5} />
                              </Box>
                              {/* Drawer Runner Rails (full extension slides) */}
                              {i === 0 && (
                                <>
                                  <Box args={[0.008, 0.01, openOffset + 0.05]} position={[-w/2 + 0.015, -drawerBoxH/2 + 0.005, -(openOffset + 0.05)/2]} castShadow>
                                    <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.1} />
                                  </Box>
                                  <Box args={[0.008, 0.01, openOffset + 0.05]} position={[w/2 - 0.015, -drawerBoxH/2 + 0.005, -(openOffset + 0.05)/2]} castShadow>
                                    <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.1} />
                                  </Box>
                                </>
                              )}
                            </>
                          )}
                        </group>
                      </group>
                    );
                  }
                  doorsHeight -= (unit.drawerCount * actualDrawerH);
                }

                // Fixed hinges (carcass leaf + pin) — rendered outside rotation group so they stay attached to side panel
                const renderFixedHinges = (hingeYStart: number, hingeH: number, hingeCount: number, doorW: number, hingeSide: 'left' | 'right') => {
                  if (!hingeCount || hingeCount === 0) return null;
                  const spacing = hingeH / (hingeCount + 1);
                  const side = hingeSide === 'left' ? -1 : 1;
                  return Array.from({ length: hingeCount }).map((_, hi) => {
                    const hingeY = hingeYStart - hingeH/2 + spacing * (hi + 1);
                    // Outer face of side panel = z=d/2 in unit coords = z=-doorT/2 in door group coords
                    const hingeZ = -doorT / 2;
                    return (
                      <group key={`fixed-hinge-${hi}`}>
                        <Box args={[0.008, 0.022, 0.014]} position={[side * 0.001, hingeY, hingeZ]} castShadow>
                          <meshStandardMaterial color="#78716c" metalness={0.7} roughness={0.3} />
                        </Box>
                        <group position={[0, hingeY, hingeZ]} rotation={[0, 0, Math.PI/2]}>
                          <mesh castShadow>
                            <cylinderGeometry args={[0.003, 0.003, 0.022, 8]} />
                            <meshStandardMaterial color="#a8a29e" metalness={0.9} roughness={0.1} />
                          </mesh>
                        </group>
                      </group>
                    );
                  });
                };

                // Door-side hinge leaf — rendered inside rotation group so it moves with the door
                const renderDoorHinges = (hingeYStart: number, hingeH: number, hingeCount: number, doorW: number, hingeSide: 'left' | 'right') => {
                  if (!hingeCount || hingeCount === 0 || !unit._3dDoorOpen) return null;
                  const spacing = hingeH / (hingeCount + 1);
                  const side = hingeSide === 'left' ? -1 : 1;
                  return Array.from({ length: hingeCount }).map((_, hi) => {
                    const hingeY = hingeYStart - hingeH/2 + spacing * (hi + 1);
                    const hingeZ = -doorT / 2;
                    return (
                      <group key={`door-hinge-${hi}`}>
                        <mesh position={[side * (doorW/2 + 0.004), hingeY, hingeZ + 0.01]} rotation={[0, side * 1.2, 0]} castShadow>
                          <boxGeometry args={[0.006, 0.018, 0.014]} />
                          <meshStandardMaterial color="#57534e" metalness={0.6} roughness={0.4} />
                        </mesh>
                      </group>
                    );
                  });
                };

                // Internal shelves (visible when doors open)
                const renderShelves = () => {
                  const shelfCnt = unit.shelfCount || 0;
                  if (shelfCnt === 0) return null;
                  const shelfT = 0.016; // 16mm shelf thickness
                  const innerW = w - 0.036; // minus 2 side panels (18mm each)
                  const innerD = d - 0.036;
                  const shelves: any[] = [];
                  for (let si = 0; si < shelfCnt; si++) {
                    const spacing = h / (shelfCnt + 1);
                    const shelfY = -h/2 + spacing * (si + 1);
                    shelves.push(
                      <group key={`shelf-${si}`}>
                        {/* Shelf board */}
                        <Box args={[innerW, shelfT, innerD]} position={[0, shelfY, 0]} castShadow>
                          <meshStandardMaterial color="#e4e4e7" roughness={0.5} />
                        </Box>
                        {/* Shelf front edge banding */}
                        <Box args={[innerW, shelfT + 0.002, 0.002]} position={[0, shelfY, d/2 - 0.002]} castShadow>
                          <meshStandardMaterial color="#d4d4d8" roughness={0.3} />
                        </Box>
                      </group>
                    );
                  }
                  return shelves;
                };

                // Interior back panel texture (visible when doors open)
                const renderInterior = () => {
                  return (
                    <group key="interior">
                      {/* Back wall of carcass */}
                      <Box args={[w - 0.004, h - 0.004, 0.003]} position={[0, 0, -d/2 + 0.005]}>
                        <meshStandardMaterial color="#f5f5f4" roughness={0.7} envMapIntensity={0.2} />
                      </Box>
                      {/* Side panels interior */}
                      <Box args={[0.003, h - 0.004, d - 0.01]} position={[-w/2 + 0.005, 0, 0]}>
                        <meshStandardMaterial color="#e7e5e4" roughness={0.6} envMapIntensity={0.2} />
                      </Box>
                      <Box args={[0.003, h - 0.004, d - 0.01]} position={[w/2 - 0.005, 0, 0]}>
                        <meshStandardMaterial color="#e7e5e4" roughness={0.6} envMapIntensity={0.2} />
                      </Box>
                    </group>
                  );
                };

                // Render a single door with realistic opening mechanism
                const renderDoor = (key: string, doorCenterX: number, doorW: number, isRightSide: boolean, doorIndex: number) => {
                  const isOpen = unit._3dDoorOpen;
                  const doorOpenAngle = isOpen ? 1.4 : 0; // ~80 degrees
                  // Door hinge is on the left edge for left-side doors, right edge for right-side
                  const hingeSide = isRightSide ? 'right' : 'left';
                  const pivotPos = hingeSide === 'left' ? -doorW/2 : doorW/2;
                  // Handle position: on the opening side (opposite to hinge)
                  const handleX = hingeSide === 'left' ? doorW/2 - 0.04 : -doorW/2 + 0.04;
                  const handleZ = doorT/2 + 0.008;
                  
                  // Door frame dimensions
                  const frameOverlay = 0.025; // 25mm frame overlay
                  const frameDepth = 0.012; // 12mm frame depth
                  const panelInset = 0.012; // 12mm inset
                  
                  // Determine handle style based on door position and type
                  const isEvenDoor = doorIndex % 2 === 0;
                  
                  return (
                    <group key={key}>
                      <group position={[doorCenterX, doorsYStart + doorsHeight/2, frontZ]}>
                        <group position={[pivotPos, 0, 0]}>
                          {renderFixedHinges(doorsHeight/2, doorsHeight, unit.hingesPerDoor || 2, doorW, hingeSide)}
                          <group rotation={[0, hingeSide === 'left' ? -doorOpenAngle : doorOpenAngle, 0]}>
                            <group position={[-pivotPos, 0, 0]}>
                              {/* Door Frame - Stiles and Rails */}
                              {/* Left stile */}
                              <Box args={[frameOverlay, doorsHeight, frameDepth]} position={[-doorW/2 + frameOverlay/2, 0, doorT/2 - frameDepth/2]} castShadow>
                                <meshStandardMaterial color={isSelected ? '#fcd34d' : doorColor} roughness={0.28} metalness={0.01} envMapIntensity={0.6} />
                              </Box>
                              {/* Right stile */}
                              <Box args={[frameOverlay, doorsHeight, frameDepth]} position={[doorW/2 - frameOverlay/2, 0, doorT/2 - frameDepth/2]} castShadow>
                                <meshStandardMaterial color={isSelected ? '#fcd34d' : doorColor} roughness={0.28} metalness={0.01} envMapIntensity={0.6} />
                              </Box>
                              {/* Top rail */}
                              <Box args={[doorW - frameOverlay * 2, frameOverlay, frameDepth]} position={[0, doorsHeight/2 - frameOverlay/2, doorT/2 - frameDepth/2]} castShadow>
                                <meshStandardMaterial color={isSelected ? '#fcd34d' : doorColor} roughness={0.28} metalness={0.01} envMapIntensity={0.6} />
                              </Box>
                              {/* Bottom rail */}
                              <Box args={[doorW - frameOverlay * 2, frameOverlay, frameDepth]} position={[0, -doorsHeight/2 + frameOverlay/2, doorT/2 - frameDepth/2]} castShadow>
                                <meshStandardMaterial color={isSelected ? '#fcd34d' : doorColor} roughness={0.28} metalness={0.01} envMapIntensity={0.6} />
                              </Box>
                              
                              {/* Door Panel (inset) - with slight bevel effect */}
                              <Box args={[doorW - frameOverlay * 2 - panelInset * 2, doorsHeight - frameOverlay * 2 - panelInset * 2, 0.006]} position={[0, 0, doorT/2 - 0.001]} castShadow>
                                <meshStandardMaterial color={isSelected ? '#fcd34d' : doorColor} roughness={0.35} metalness={0.01} envMapIntensity={0.5} />
                              </Box>
                              
                              {/* Door seal/gasket (visible when closed) */}
                              {!isOpen && (
                                <Box args={[doorW - 0.006, doorsHeight - 0.006, 0.003]} position={[0, 0, doorT/2 + 0.001]}>
                                  <meshStandardMaterial color="#1e293b" roughness={0.9} />
                                </Box>
                              )}
                              
                              {/* Door Handle - positioned correctly based on hinge side */}
                              {unit.handleType === 'profile' || unit.handleType === 'gola' ? (
                                /* Profile/Gola handle - long recessed handle on opening side */
                                <group position={[handleX, 0, doorT/2 + 0.002]}>
                                  <Box args={[0.003, doorsHeight * 0.3, 0.015]} castShadow>
                                    <meshStandardMaterial color="#57534e" metalness={0.85} roughness={0.15} envMapIntensity={1.2} />
                                  </Box>
                                </group>
                              ) : unit.handleType === 'knob' ? (
                                /* Knob handle - small round handle on opening side */
                                <group position={[handleX, doorsHeight * 0.25, doorT/2 + 0.01]}>
                                  <mesh castShadow>
                                    <sphereGeometry args={[0.012, 16, 16]} />
                                    <meshStandardMaterial color="#a8a29e" metalness={0.9} roughness={0.1} envMapIntensity={1.5} />
                                  </mesh>
                                </group>
                              ) : unit.handleType === 'cnc_groove' ? (
                                /* CNC groove - horizontal slot at top and bottom on opening side */
                                <>
                                  <Box args={[0.04, 0.008, 0.003]} position={[handleX, doorsHeight * 0.3, doorT/2 + 0.001]} castShadow>
                                    <meshStandardMaterial color="#57534e" metalness={0.7} roughness={0.25} envMapIntensity={0.8} />
                                  </Box>
                                  <Box args={[0.04, 0.008, 0.003]} position={[handleX, -doorsHeight * 0.3, doorT/2 + 0.001]} castShadow>
                                    <meshStandardMaterial color="#57534e" metalness={0.7} roughness={0.25} envMapIntensity={0.8} />
                                  </Box>
                                </>
                              ) : (
                                /* Standard bar handle - vertical bar on opening side */
                                <group position={[handleX, 0, handleZ]}>
                                  {/* Handle bar */}
                                  <Box args={[0.008, doorsHeight * 0.35, 0.006]} castShadow>
                                    <meshStandardMaterial color="#a8a29e" metalness={0.9} roughness={0.1} envMapIntensity={1.5} />
                                  </Box>
                                  {/* Handle base plate (top) */}
                                  <Box args={[0.014, 0.02, 0.01]} position={[0, doorsHeight * 0.175, -0.002]} castShadow>
                                    <meshStandardMaterial color="#78716c" metalness={0.85} roughness={0.15} envMapIntensity={1.0} />
                                  </Box>
                                  {/* Handle base plate (bottom) */}
                                  <Box args={[0.014, 0.02, 0.01]} position={[0, -doorsHeight * 0.175, -0.002]} castShadow>
                                    <meshStandardMaterial color="#78716c" metalness={0.85} roughness={0.15} envMapIntensity={1.0} />
                                  </Box>
                                </group>
                              )}
                              
                              {/* Hinges - positioned on hinge side */}
                              {renderDoorHinges(doorsHeight/2, doorsHeight, unit.hingesPerDoor || 2, doorW, hingeSide)}
                            </group>
                          </group>
                        </group>
                      </group>
                    </group>
                  );
                };

                // Main door rendering logic
                if (!unit.type.startsWith('corner') && unit.doorCount && unit.doorCount > 0 && doorsHeight > 0) {
                  const doorCfg = unit.doorConfig;
                  const divStyle = doorCfg?.divisionStyle || 'equal';
                  const divWidthMm = doorCfg?.dividerWidthMm || 50;
                  const dividerW = divWidthMm * SCALE_3D;

                  // Show interior and shelves when doors are open
                  if (unit._3dDoorOpen) {
                    details.push(renderInterior());
                    const shelfEls = renderShelves();
                    if (shelfEls) details.push(...shelfEls);
                  }

                  if (divStyle === 'symmetrical' && unit.doorCount >= 4) {
                    // Symmetrical: two groups separated by a fixed divider strip
                    // Left group: doors open from right to left (hinge on right)
                    // Right group: doors open from left to right (hinge on left)
                    const panelGroups = doorCfg?.panelGroupSizes || [Math.floor(unit.doorCount / 2), Math.ceil(unit.doorCount / 2)];
                    const totalDoorArea = w - dividerW;
                    let currentX = -w/2;
                    
                    panelGroups.forEach((groupSize: number, gi: number) => {
                      const groupW = (totalDoorArea * groupSize) / unit.doorCount;
                      const doorW = groupW / groupSize;
                      const isRightGroup = gi === 1;
                      
                      for (let di = 0; di < groupSize; di++) {
                        const doorIdx = panelGroups.slice(0, gi).reduce((a, b) => a + b, 0) + di;
                        const doorCenterX = currentX + doorW/2 + di * doorW;
                        
                        // In left group: all doors hinge on right (open leftward)
                        // In right group: all doors hinge on left (open rightward)
                        const isRightSide = isRightGroup;
                        
                        details.push(renderDoor(`door-${gi}-${di}`, doorCenterX, doorW, isRightSide, doorIdx));
                      }
                      currentX += groupW;
                      
                      // Divider strip
                      if (gi < panelGroups.length - 1) {
                        details.push(
                          <Box key={`divider-${gi}`} args={[dividerW, doorsHeight, doorT + 0.003]} position={[currentX + dividerW/2, doorsYStart + doorsHeight/2, frontZ]} castShadow>
                            <meshStandardMaterial color={doorCfg?.dividerColorHex || unit.colorHex || '#D4B896'} roughness={0.4} />
                          </Box>
                        );
                        currentX += dividerW;
                      }
                    });
                  } else {
                    // Equal division: alternating hinge sides for realistic opening
                    // Odd doors (1st, 3rd, 5th...) hinge on left, open rightward
                    // Even doors (2nd, 4th, 6th...) hinge on right, open leftward
                    const doorW = w / unit.doorCount;
                    const startX = -w/2 + doorW/2;
                    for(let i=0; i<unit.doorCount; i++) {
                      const doorX = startX + (i * doorW);
                      const isRightSide = i % 2 === 1; // Even index = left hinge, Odd index = right hinge
                      details.push(renderDoor(`door-${i}`, doorX, doorW, isRightSide, i));
                    }
                  }
                }

                // Doors for L-Shape Corner Units
                if (unit.type.startsWith('corner') && doorsHeight > 0) {
                  const leftD = (unit.dimensions.leftLegCarcassDepthMm || 600) * SCALE_3D;
                  const rightD = (unit.dimensions.rightLegCarcassDepthMm || 600) * SCALE_3D;
                  
                  // Door on the right leg's front face
                  const rightDoorW = w - leftD;
                  details.push(
                    <group key="corner-door-right" position={[leftD/2, doorsYStart + doorsHeight/2, -d/2 + rightD + doorT/2]}>
                      <Box args={[rightDoorW - 0.004, doorsHeight - 0.004, doorT]} castShadow>
                        <meshStandardMaterial color={isSelected ? '#fcd34d' : doorColor} roughness={0.3} />
                      </Box>
                      {/* Handle */}
                      <Box args={[0.015, doorsHeight * 0.3, 0.02]} position={[-rightDoorW/2 + 0.05, 0, doorT/2 + 0.01]} castShadow>
                        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
                      </Box>
                    </group>
                  );

                  // Door on the left leg's side face (rotated 90 degrees)
                  const leftDoorW = d - rightD;
                  details.push(
                    <group key="corner-door-left" position={[-w/2 + leftD + doorT/2, doorsYStart + doorsHeight/2, rightD/2]}>
                      <Box args={[doorT, doorsHeight - 0.004, leftDoorW - 0.004]} castShadow>
                        <meshStandardMaterial color={isSelected ? '#fcd34d' : doorColor} roughness={0.3} />
                      </Box>
                      {/* Handle */}
                      <Box args={[0.02, doorsHeight * 0.3, 0.015]} position={[doorT/2 + 0.01, 0, -leftDoorW/2 + 0.05]} castShadow>
                        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
                      </Box>
                    </group>
                  );
                }

                // Plinth (Baseboard)
                const plinthH = 0.1; // 100mm
                if (unit.type === 'base' || unit.type === 'tall' || unit.type === 'drawer_unit') {
                  details.push(
                    <Box key="plinth" args={[w - 0.02, plinthH, d - 0.05]} position={[0, -h/2 + plinthH/2, -0.02]} castShadow>
                      <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.05} />
                    </Box>
                  );
                } else if (unit.type === 'corner_base' || unit.type === 'corner_tall') {
                  const leftD = (unit.dimensions.leftLegCarcassDepthMm || 600) * SCALE_3D;
                  const rightD = (unit.dimensions.rightLegCarcassDepthMm || 600) * SCALE_3D;
                  details.push(
                    <group key="plinth" position={[0, -h/2 + plinthH/2, 0]}>
                      <Box args={[w - 0.02, plinthH, rightD - 0.05]} position={[0, 0, -d/2 + rightD/2 - 0.025]} castShadow>
                        <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.05} />
                      </Box>
                      <Box args={[leftD - 0.05, plinthH, d - 0.02]} position={[-w/2 + leftD/2 - 0.025, 0, 0]} castShadow>
                        <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.05} />
                      </Box>
                    </group>
                  );
                }

                return details;
              })()}

              <Text
                position={[0, h/2 + 0.1, 0]}
                fontSize={0.15}
                color={isSelected ? '#f59e0b' : 'white'}
                anchorX="center"
                anchorY="middle"
              >
                {formatMeasurement(unit.dimensions.widthMm, displayUnit || 'mm', false)} x {formatMeasurement(unit.dimensions.heightMm, displayUnit || 'mm', false)}
              </Text>
            </group>
          );

          if (isPrimarySelected && !readOnly) {
            return (
              <TransformControls
                key={unit.id}
                mode={transformMode}
                position={[xPos, yPos, zPos]}
                rotation={[0, rotationRad, 0]}
                // @ts-ignore
                onDraggingChanged={(e: any) => {
                  if (orbitRef.current) {
                    orbitRef.current.enabled = !e.value;
                  }
                }}
                onMouseUp={(e: any) => {
                  if (!e || !e.target || !e.target.object || readOnly) return;
                  const obj = e.target.object as THREE.Object3D;
                  
                  if (transformMode === 'translate') {
                    const newXMm = (obj.position.x - (w / 2)) / SCALE_3D;
                    const newZMm = (obj.position.y - (h / 2)) / SCALE_3D; // Elevation
                    const newYMm = (obj.position.z - (d / 2)) / SCALE_3D;
                    
                    updateUnitPosition(unit.id, Math.round(newXMm), Math.round(newYMm), Math.round(newZMm), unit.position.rotationDeg);
                  } else if (transformMode === 'scale') {
                    const sx = obj.scale.x;
                    const sy = obj.scale.y;
                    const sz = obj.scale.z;
                    
                    const newWidthMm = unit.dimensions.widthMm * sx;
                    const newHeightMm = unit.dimensions.heightMm * sy;
                    const newDepthMm = unit.dimensions.depthMm * sz;
                    
                    // Reset scale to 1 because we explicitly change the dimensions box
                    obj.scale.set(1, 1, 1);
                    
                    updateUnitDimensions(unit.id, Math.round(newWidthMm), Math.round(newDepthMm), Math.round(newHeightMm));
                  }
                }}
              >
                {unitContent}
              </TransformControls>
            );
          }

          return (
            <group key={unit.id} position={[xPos, yPos, zPos]} rotation={[0, rotationRad, 0]} userData={{ type: "unit" }}>
              {unitContent}
            </group>
          );
        })}

        {/* Obstacles (Columns) */}
        {room?.obstacles.filter(o => !o.isHidden).map((obs) => {
          const w = obs.widthMm * SCALE_3D;
          const h = roomHeightM; 
          const d = obs.depthMm * SCALE_3D;
          const xPos = (obs.xMm * SCALE_3D) + (w / 2);
          const zPos = (obs.yMm * SCALE_3D) + (d / 2);
          const rotationRad = (obs.rotationDeg || 0) * (Math.PI / -180);

          return (
            <group
              key={obs.id}
              onClick={(e) => { e.stopPropagation(); if (readOnly) return; selectElement(obs.id, 'obstacle', e.shiftKey); setContextMenu(null); }}
              onContextMenu={(e) => {
                e.stopPropagation();
                if (readOnly) return;
                selectElement(obs.id, 'obstacle', e.shiftKey);
                setContextMenu({ x: e.clientX, y: e.clientY, id: obs.id, type: 'obstacle' });
              }}
            >
              <Box args={[w, h, d]} position={[xPos, h/2, zPos]} rotation={[0, rotationRad, 0]} castShadow>
                <meshStandardMaterial color={useProjectStore.getState().selectedElements.some(e => e.id === obs.id) ? '#f59e0b' : '#ef4444'} />
              </Box>
            </group>
          );
        })}

        {/* Fixtures (Doors/Windows) */}
        {room?.fixtures.filter(f => !f.isHidden).map((fix) => {
          if (fix.type === 'door' || fix.type === 'window') {
            const w = fix.widthMm * SCALE_3D;
            const h = fix.heightMm * SCALE_3D;
            const d = 0.1; 
            const elevationMm = fix.zMm;
            
            const xPos = (fix.xMm * SCALE_3D) + (w / 2);
            const yPos = (elevationMm * SCALE_3D) + (h / 2);
            const zPos = (fix.yMm * SCALE_3D) + (d / 2);
            const rotationRad = (fix.rotationDeg || 0) * (Math.PI / -180);

              return (
              <group 
                key={fix.id} 
                position={[xPos, yPos, zPos]} 
                rotation={[0, rotationRad, 0]}
                onClick={(e) => { e.stopPropagation(); if (readOnly) return; selectElement(fix.id, 'fixture', e.shiftKey); setContextMenu(null); }}
                onContextMenu={(e) => {
                  e.stopPropagation();
                  if (readOnly) return;
                  selectElement(fix.id, 'fixture', e.shiftKey);
                  setContextMenu({ x: e.clientX, y: e.clientY, id: fix.id, type: 'fixture' });
                }}
              >
                <Box args={[w, h, d]} castShadow receiveShadow>
                  <meshStandardMaterial color={useProjectStore.getState().selectedElements.some(e => e.id === fix.id) ? "#f59e0b" : (fix.type === 'door' ? "#38bdf8" : "#818cf8")} transparent opacity={0.4} />
                </Box>
                <Box args={[w, h, d]}>
                  <meshBasicMaterial color={useProjectStore.getState().selectedElements.some(e => e.id === fix.id) ? "#f59e0b" : (fix.type === 'door' ? "#38bdf8" : "#818cf8")} wireframe />
                </Box>
              </group>
            );
          }
          return null;
        })}

        <OrbitControls 
          ref={orbitRef} 
          makeDefault 
          target={[roomCenterX, roomHeightM / 2, roomCenterZ]} 
          enableDamping
          dampingFactor={0.08}
          enableZoom
          minDistance={1.5}
          maxDistance={Math.max(roomLengthM, roomWidthM) * 2}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minPolarAngle={0.1}
          zoomSpeed={0.9}
        />
        <SceneExporter ref={exporterRef ?? null} />
        <Grid infiniteGrid fadeDistance={20} fadeStrength={1.5} sectionColor="#2563eb" cellColor="#27272a" sectionSize={1} cellSize={0.25} position={[0, -0.001, 0]} />
      </Canvas>

      {contextLost && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/90 z-40">
          <div className="text-center">
            <p className="text-white text-lg mb-4">حدث مشكلة في الرسوم ثلاثية الأبعاد</p>
            <button
              onClick={() => { setContextLost(false); setCanvasKey(k => k + 1); }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      )}

      {/* Context Menu HTML Overlay */}
      {contextMenu && (
        <div 
          className="absolute z-50 bg-zinc-900 border border-zinc-700 shadow-2xl rounded-xl py-2 w-52 text-right overflow-hidden backdrop-blur-xl"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.type === 'unit' && (
            <button
              onClick={() => {
                const store = useProjectStore.getState();
                const targetUnit = store.units.find(u => u.id === contextMenu.id);
                if (targetUnit) {
                  const updatedUnits = store.units.map(u => u.id === contextMenu.id ? { ...u, _3dDoorOpen: !u._3dDoorOpen } : u);
                  useProjectStore.setState({ units: updatedUnits });
                }
                setContextMenu(null);
              }}
              className="w-full px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center justify-end gap-3 transition-colors"
            >
              {(() => {
                const targetUnit = useProjectStore.getState().units.find(u => u.id === contextMenu.id);
                return targetUnit?._3dDoorOpen ? '🔒 إغلاق الأبواب' : '🔓 فتح الأبواب';
              })()} 
              <EyeOff size={16} />
            </button>
          )}

          {!readOnly && (
            <>
              <button
                onClick={() => {
                  duplicateElement(contextMenu.id, contextMenu.type);
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center justify-end gap-3 transition-colors"
              >
                تكرار (Copy) <Copy size={16} />
              </button>
              
              <button
                onClick={() => {
                  toggleElementVisibility(contextMenu.id, contextMenu.type);
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center justify-end gap-3 transition-colors"
              >
                إخفاء / إظهار <EyeOff size={16} />
              </button>
              
              <button
                onClick={() => {
                  selectElement(contextMenu.id, contextMenu.type);
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center justify-end gap-3 transition-colors"
              >
                تعديل المقاسات <Edit2 size={16} />
              </button>
              
              <div className="h-px bg-zinc-800 my-1"></div>
              
              <button
                onClick={() => {
                  if (contextMenu.type === 'unit') deleteUnit(contextMenu.id);
                  else if (contextMenu.type === 'fixture') deleteRoomFixture(contextMenu.id);
                  else if (contextMenu.type === 'obstacle') deleteRoomObstacle(contextMenu.id);
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2 text-sm text-red-400 hover:bg-red-950/30 hover:text-red-300 flex items-center justify-end gap-3 transition-colors"
              >
                حذف <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
