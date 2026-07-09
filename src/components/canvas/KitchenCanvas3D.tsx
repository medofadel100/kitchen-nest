"use client";

import React, { useMemo, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, Box, Text, TransformControls } from '@react-three/drei';
import { useProjectStore } from '@/store/projectStore';
import { formatMeasurement } from '@/utils/measurements';
import * as THREE from 'three';
import { Move, Scaling, RefreshCw, Copy, EyeOff, Edit2, Trash2 } from 'lucide-react';
import { Appliance3D } from './Appliance3D';

export const KitchenCanvas3D = ({ readOnly = false }: { readOnly?: boolean }) => {
  const { units, room, displayUnit, selectedElement, selectElement, updateUnitPosition, updateUnitDimensions, duplicateElement, toggleElementVisibility, deleteUnit, deleteRoomFixture, deleteRoomObstacle } = useProjectStore();
  const [transformMode, setTransformMode] = useState<'translate' | 'scale'>('translate');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, id: string, type: 'unit' | 'fixture' | 'obstacle' } | null>(null);
  const orbitRef = useRef<any>(null);

  const SCALE_3D = 0.001; 

  const roomWidthM = room ? room.widthMm * SCALE_3D : 5;
  const roomLengthM = room ? room.lengthMm * SCALE_3D : 5;
  const roomHeightM = room ? room.heightMm * SCALE_3D : 2.8;

  const resetCamera = () => {
    if (orbitRef.current) {
      orbitRef.current.reset();
    }
  };

  // Helper to create walls
  const createWallShape = (width: number, extendLeft: boolean, extendRight: boolean, fixtures: any[], filterHole: (fix: any) => boolean, mapFx: (fix: any) => number) => {
    const shape = new THREE.Shape();
    const startX = extendLeft ? -0.1 : 0;
    const endX = width + (extendRight ? 0.1 : 0);
    
    shape.moveTo(startX, 0);
    shape.lineTo(endX, 0);
    shape.lineTo(endX, roomHeightM);
    shape.lineTo(startX, roomHeightM);
    shape.lineTo(startX, 0);

    fixtures?.filter(f => !f.isHidden).forEach(fix => {
      if (filterHole(fix)) {
         const fw = fix.widthMm * SCALE_3D;
         const fh = fix.heightMm * SCALE_3D;
         const fz = fix.zMm * SCALE_3D; 
         const fx = mapFx(fix) * SCALE_3D;
         
         const hole = new THREE.Path();
         hole.moveTo(fx, fz);
         hole.lineTo(fx + fw, fz);
         hole.lineTo(fx + fw, fz + fh);
         hole.lineTo(fx, fz + fh);
         hole.lineTo(fx, fz);
         shape.holes.push(hole);
      }
    });
    return shape;
  };

  const backWallShape = useMemo(() => createWallShape(roomWidthM, true, true, room?.fixtures || [], f => f.yMm < 150, f => f.xMm), [room, roomWidthM, roomHeightM, SCALE_3D]);
  const frontWallShape = useMemo(() => createWallShape(roomWidthM, true, true, room?.fixtures || [], f => f.yMm > room!.lengthMm - 150, f => f.xMm), [room, roomWidthM, roomHeightM, SCALE_3D]);
  const leftWallShape = useMemo(() => createWallShape(roomLengthM, false, false, room?.fixtures || [], f => f.xMm < 150, f => f.yMm), [room, roomLengthM, roomHeightM, SCALE_3D]);
  const rightWallShape = useMemo(() => createWallShape(roomLengthM, false, false, room?.fixtures || [], f => f.xMm > room!.widthMm - 150, f => f.yMm), [room, roomLengthM, roomHeightM, SCALE_3D]);

  // لإغلاق القائمة عند الضغط في أي مكان
  const handlePointerMissed = () => {
    selectElement(null);
    setContextMenu(null);
  };

  return (
    <div 
      className="w-full h-full relative bg-zinc-900"
      onContextMenu={(e) => e.preventDefault()}
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
        camera={{ position: [0, roomHeightM + 2, roomLengthM + 2], fov: 50 }}
        onPointerMissed={handlePointerMissed}
      >
        <color attach="background" args={['#18181b']} />
        <fog attach="fog" args={['#18181b', 8, 25]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <Environment preset="apartment" background={false} />
        
        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[roomWidthM / 2, 0, roomLengthM / 2]} receiveShadow>
          <planeGeometry args={[roomWidthM, roomLengthM]} />
          <meshStandardMaterial color="#27272a" />
        </mesh>

        {/* Solid Walls (Back and Left) */}
        <mesh position={[0, 0, -0.1]} castShadow receiveShadow>
          <extrudeGeometry args={[backWallShape, { depth: 0.1, bevelEnabled: false }]} />
          <meshStandardMaterial color="#e4e4e7" />
        </mesh>

        <mesh position={[-0.1, 0, 0]} rotation={[0, -Math.PI / 2, 0]} castShadow receiveShadow>
          <extrudeGeometry args={[leftWallShape, { depth: 0.1, bevelEnabled: false }]} />
          <meshStandardMaterial color="#e4e4e7" />
        </mesh>

        {/* Transparent Walls (Front and Right) */}
        <mesh position={[0, 0, roomLengthM]} castShadow receiveShadow>
          <extrudeGeometry args={[frontWallShape, { depth: 0.1, bevelEnabled: false }]} />
          <meshStandardMaterial color="#e4e4e7" transparent opacity={0.2} depthWrite={false} />
        </mesh>

        <mesh position={[roomWidthM, 0, 0]} rotation={[0, -Math.PI / 2, 0]} castShadow receiveShadow>
          <extrudeGeometry args={[rightWallShape, { depth: 0.1, bevelEnabled: false }]} />
          <meshStandardMaterial color="#e4e4e7" transparent opacity={0.2} depthWrite={false} />
        </mesh>

        {/* Kitchen Units */}
        {units.filter(u => !u.isHidden).map((unit) => {
          const w = unit.dimensions.widthMm * SCALE_3D;
          const h = unit.dimensions.heightMm * SCALE_3D;
          const d = unit.dimensions.depthMm * SCALE_3D;
          
          const elevationMm = unit.position.zMm ?? (unit.type === 'wall' ? 1500 : 0); 
          
          const xPos = (unit.position.xMm * SCALE_3D) + (w / 2);
          const yPos = (elevationMm * SCALE_3D) + (h / 2);
          const zPos = (unit.position.yMm * SCALE_3D) + (d / 2);

          let color = '#3b82f6'; 
          if (unit.type === 'wall') color = '#10b981'; 
          if (unit.type === 'tall') color = '#8b5cf6'; 
          if (unit.type === 'loft') color = '#6366f1'; 
          
          const rotationRad = (unit.position.rotationDeg || 0) * (Math.PI / -180);
          const isSelected = useProjectStore.getState().selectedElements.some(e => e.id === unit.id);
          const isPrimarySelected = selectedElement?.id === unit.id;

          const isFridge = unit.label?.includes('ثلاجة') || unit.label?.toLowerCase().includes('fridge');
          const isOven = unit.label?.includes('فرن') || unit.label?.toLowerCase().includes('oven') || unit.label?.includes('بوتاجاز');
          const isSink = unit.label?.includes('حوض') || unit.label?.toLowerCase().includes('sink');

          const unitContent = (
            <group 
              onClick={(e) => { 
                if (readOnly) return;
                e.stopPropagation(); selectElement(unit.id, 'unit', e.shiftKey); setContextMenu(null); 
              }}
              onContextMenu={(e) => {
                if (readOnly) return;
                e.stopPropagation();
                selectElement(unit.id, 'unit', e.shiftKey);
                setContextMenu({ x: e.clientX, y: e.clientY, id: unit.id, type: 'unit' });
              }}
            >
              {/* Main Carcass */}
              {isFridge ? (
                <Appliance3D type="fridge" width={w} height={h} depth={d} />
              ) : isOven ? (
                <Appliance3D type="oven" width={w} height={h} depth={d} />
              ) : isSink ? (
                <group>
                  {/* Render the standard base carcass but with a sink on top */}
                  <Box args={[w, h, d]} position={[0, 0, 0]} castShadow receiveShadow>
                    <meshStandardMaterial color={isSelected ? '#f59e0b' : color} roughness={0.2} />
                  </Box>
                  <Appliance3D type="sink" width={w} height={h} depth={d} />
                </group>
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
              ) : (
                <>
                  <Box args={[w, h, d]} castShadow receiveShadow>
                    <meshStandardMaterial color={isSelected ? '#f59e0b' : color} roughness={0.2} metalness={0.05} />
                  </Box>
                  <Box args={[w, h, d]}>
                    <meshBasicMaterial color={isSelected ? '#000000' : '#ffffff'} wireframe />
                  </Box>
                </>
              )}
              
              {/* 3D Details: Doors, Drawers, Countertop */}
              {(() => {
                if (isFridge || isOven) return null; // Skip doors/drawers/countertop for full appliances

                const details = [];
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
                        <Appliance3D type="sink" width={w} height={0.01} depth={d} />
                      </group>
                    );
                  }
                }

                const drawerH = 0.2; 
                let doorsYStart = -h/2 + (unit.type === 'base' || unit.type === 'tall' || unit.type === 'corner_base' || unit.type === 'corner_tall' ? 0.1 : 0); // Account for plinth
                let doorsHeight = h - (unit.type === 'base' || unit.type === 'tall' || unit.type === 'corner_base' || unit.type === 'corner_tall' ? 0.1 : 0);

                // Drawers
                if (unit.drawerCount && unit.drawerCount > 0) {
                  const actualDrawerH = unit.type === 'drawer_unit' ? doorsHeight / unit.drawerCount : drawerH;
                  for(let i=0; i<unit.drawerCount; i++) {
                    const yPos = (h/2) - (actualDrawerH / 2) - (i * actualDrawerH);
                    details.push(
                      <group key={`drawer-${i}`} position={[0, yPos, frontZ]}>
                        <Box args={[w - 0.004, actualDrawerH - 0.004, doorT]} castShadow>
                          <meshStandardMaterial color={isSelected ? '#fcd34d' : '#e2e8f0'} roughness={0.3} />
                        </Box>
                        <Box args={[w * 0.4, 0.02, 0.015]} position={[0, 0, doorT/2 + 0.007]} castShadow>
                          <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
                        </Box>
                      </group>
                    );
                  }
                  doorsHeight -= (unit.drawerCount * actualDrawerH);
                }

                // Doors for normal units
                if (!unit.type.startsWith('corner') && unit.doorCount && unit.doorCount > 0 && doorsHeight > 0) {
                  const doorW = w / unit.doorCount;
                  const startX = -w/2 + doorW/2;
                  for(let i=0; i<unit.doorCount; i++) {
                    details.push(
                      <group key={`door-${i}`} position={[startX + (i * doorW), doorsYStart + doorsHeight/2, frontZ]}>
                        <Box args={[doorW - 0.004, doorsHeight - 0.004, doorT]} castShadow>
                          <meshStandardMaterial color={isSelected ? '#fcd34d' : '#f1f5f9'} roughness={0.3} />
                        </Box>
                        <Box args={[0.015, doorsHeight * 0.3, 0.02]} position={[(i%2===0 ? doorW/2 - 0.05 : -doorW/2 + 0.05), 0, doorT/2 + 0.01]} castShadow>
                          <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
                        </Box>
                      </group>
                    );
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
                        <meshStandardMaterial color={isSelected ? '#fcd34d' : '#f1f5f9'} roughness={0.3} />
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
                        <meshStandardMaterial color={isSelected ? '#fcd34d' : '#f1f5f9'} roughness={0.3} />
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
                      <meshStandardMaterial color="#1e293b" />
                    </Box>
                  );
                } else if (unit.type === 'corner_base' || unit.type === 'corner_tall') {
                  const leftD = (unit.dimensions.leftLegCarcassDepthMm || 600) * SCALE_3D;
                  const rightD = (unit.dimensions.rightLegCarcassDepthMm || 600) * SCALE_3D;
                  details.push(
                    <group key="plinth" position={[0, -h/2 + plinthH/2, 0]}>
                      <Box args={[w - 0.02, plinthH, rightD - 0.05]} position={[0, 0, -d/2 + rightD/2 - 0.025]} castShadow>
                        <meshStandardMaterial color="#1e293b" />
                      </Box>
                      <Box args={[leftD - 0.05, plinthH, d - 0.02]} position={[-w/2 + leftD/2 - 0.025, 0, 0]} castShadow>
                        <meshStandardMaterial color="#1e293b" />
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
                {formatMeasurement(unit.dimensions.widthMm, displayUnit, false)} x {formatMeasurement(unit.dimensions.heightMm, displayUnit, false)}
              </Text>
            </group>
          );

          if (isPrimarySelected) {
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
            <group key={unit.id} position={[xPos, yPos, zPos]} rotation={[0, rotationRad, 0]}>
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
              onClick={(e) => { e.stopPropagation(); selectElement(obs.id, 'obstacle', e.shiftKey); setContextMenu(null); }}
              onContextMenu={(e) => {
                e.stopPropagation();
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
                onClick={(e) => { e.stopPropagation(); selectElement(fix.id, 'fixture', e.shiftKey); setContextMenu(null); }}
                onContextMenu={(e) => {
                  e.stopPropagation();
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
          target={[roomWidthM / 2, 1, roomLengthM / 2]} 
          enableDamping
          dampingFactor={0.08}
          minDistance={1.5}
          maxDistance={roomLengthM + roomWidthM}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minPolarAngle={0.1}
        />
        <Grid infiniteGrid fadeDistance={20} sectionColor="#10b981" cellColor="#3f3f46" />
      </Canvas>

      {/* Context Menu HTML Overlay */}
      {contextMenu && (
        <div 
          className="absolute z-50 bg-zinc-900 border border-zinc-700 shadow-2xl rounded-xl py-2 w-48 text-right overflow-hidden backdrop-blur-xl"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
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
        </div>
      )}
    </div>
  );
};
