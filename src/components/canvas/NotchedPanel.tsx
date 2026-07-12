"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { PanelNotch } from "@/types";
import { getPiecePolygonPoints } from "@/lib/pieceGeometry";

const SCALE_3D = 0.001;

function buildFaceShape(faceWidthMm: number, faceHeightMm: number, notch?: PanelNotch): THREE.Shape {
  const pts = getPiecePolygonPoints(faceWidthMm, faceHeightMm, notch);
  const fw = faceWidthMm * SCALE_3D;
  const fh = faceHeightMm * SCALE_3D;
  const shape = new THREE.Shape();

  pts.forEach((p, i) => {
    const lx = p.x * SCALE_3D - fw / 2;
    const ly = fh / 2 - p.y * SCALE_3D;
    if (i === 0) shape.moveTo(lx, ly);
    else shape.lineTo(lx, ly);
  });
  shape.closePath();
  return shape;
}

export interface NotchedPanelMeshProps {
  faceWidthMm: number;
  faceHeightMm: number;
  thicknessMm: number;
  notch?: PanelNotch;
  position: [number, number, number];
  rotation?: [number, number, number];
  color: string;
  isSelected?: boolean;
}

/**
 * Extruded panel with optional L-shaped notch (6-sided polygon face).
 * Shape is built in local XY; extrusion runs along local +Z before rotation.
 */
export function NotchedPanelMesh({
  faceWidthMm,
  faceHeightMm,
  thicknessMm,
  notch,
  position,
  rotation = [0, 0, 0],
  color,
  isSelected,
}: NotchedPanelMeshProps) {
  const geometry = useMemo(() => {
    const shape = buildFaceShape(faceWidthMm, faceHeightMm, notch);
    const depth = thicknessMm * SCALE_3D;
    const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
    geo.translate(0, 0, -depth / 2);
    return geo;
  }, [faceWidthMm, faceHeightMm, thicknessMm, notch]);

  const matColor = isSelected ? "#f59e0b" : color;

  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow geometry={geometry}>
      <meshStandardMaterial color={matColor} roughness={0.2} metalness={0.05} />
    </mesh>
  );
}

export { SCALE_3D as NOTCHED_PANEL_SCALE };
