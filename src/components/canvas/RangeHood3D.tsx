"use client";

import { useMemo } from 'react';
import * as THREE from 'three';
import { Box, Cylinder } from '@react-three/drei';

interface RangeHood3DProps {
  type: 'range_hood_hermy' | 'range_hood_island' | 'range_hood_curved' | 'range_hood_wall';
  width: number;
  height: number;
  depth: number;
  config?: {
    hasChimney?: boolean;
    chimneyWidthMm?: number;
    chimneyDepthMm?: number;
    filterType?: 'metal' | 'carbon';
  };
}

const METAL = '#b0b0b0';
const DARK_METAL = '#3a3a3a';
const FILTER_COLOR = '#666666';

export default function RangeHood3D({ type, width, height, depth, config }: RangeHood3DProps) {
  const panelT = 0.006;

  const chimneyW = (config?.chimneyWidthMm || 200) / 1000;
  const chimneyD = (config?.chimneyDepthMm || 200) / 1000;

  const elements = useMemo(() => {
    switch (type) {
      case 'range_hood_hermy':
        return (
          <group>
            {/* Pyramid body */}
            <mesh position={[0, -height / 4, 0]} castShadow>
              <cylinderGeometry args={[width * 0.15, width * 0.45, height * 0.5, 4]} />
              <meshStandardMaterial color={METAL} metalness={0.85} roughness={0.15} />
            </mesh>
            {/* Chimney pipe */}
            {config?.hasChimney !== false && (
              <mesh position={[0, height / 4 + 0.02, 0]} castShadow>
                <cylinderGeometry args={[chimneyW / 2, chimneyW / 2, height * 0.4, 16]} />
                <meshStandardMaterial color={METAL} metalness={0.85} roughness={0.15} />
              </mesh>
            )}
            {/* Filter at bottom */}
            <Box args={[width * 0.8, panelT, depth * 0.8]} position={[0, -height / 2 + panelT / 2, 0]}>
              <meshStandardMaterial color={FILTER_COLOR} metalness={0.6} roughness={0.3} />
            </Box>
            {/* LED strip */}
            <Box args={[width * 0.6, 0.008, 0.008]} position={[0, -height / 2 + 0.02, depth * 0.3]}>
              <meshStandardMaterial color="#FFE4B5" emissive="#FFE4B5" emissiveIntensity={0.6} />
            </Box>
          </group>
        );

      case 'range_hood_island':
        return (
          <group>
            {/* Flat panel body - wider, visible from all sides */}
            <Box args={[width, panelT, depth]} position={[0, 0, 0]} castShadow receiveShadow>
              <meshStandardMaterial color={METAL} metalness={0.8} roughness={0.2} />
            </Box>
            {/* Bottom panel */}
            <Box args={[width, panelT, depth]} position={[0, -height / 2, 0]} castShadow>
              <meshStandardMaterial color={DARK_METAL} metalness={0.7} roughness={0.25} />
            </Box>
            {/* Top panel */}
            <Box args={[width, panelT, depth]} position={[0, height / 2, 0]} castShadow>
              <meshStandardMaterial color={DARK_METAL} metalness={0.7} roughness={0.25} />
            </Box>
            {/* Side panels */}
            <Box args={[panelT, height, depth]} position={[-width / 2, 0, 0]} castShadow>
              <meshStandardMaterial color={METAL} metalness={0.8} roughness={0.2} />
            </Box>
            <Box args={[panelT, height, depth]} position={[width / 2, 0, 0]} castShadow>
              <meshStandardMaterial color={METAL} metalness={0.8} roughness={0.2} />
            </Box>
            {/* Hanging rods */}
            <Cylinder args={[0.008, 0.008, height * 0.6, 8]} position={[-width / 3, height / 2 + height * 0.3, 0]}>
              <meshStandardMaterial color={METAL} metalness={0.9} roughness={0.1} />
            </Cylinder>
            <Cylinder args={[0.008, 0.008, height * 0.6, 8]} position={[width / 3, height / 2 + height * 0.3, 0]}>
              <meshStandardMaterial color={METAL} metalness={0.9} roughness={0.1} />
            </Cylinder>
            {/* Filter */}
            <Box args={[width * 0.8, panelT, depth * 0.8]} position={[0, -height / 2 + panelT, 0]}>
              <meshStandardMaterial color={FILTER_COLOR} metalness={0.6} roughness={0.3} />
            </Box>
            {/* LED */}
            <Box args={[width * 0.6, 0.008, 0.008]} position={[0, -height / 2 + 0.015, depth * 0.3]}>
              <meshStandardMaterial color="#FFE4B5" emissive="#FFE4B5" emissiveIntensity={0.6} />
            </Box>
          </group>
        );

      case 'range_hood_curved':
        return (
          <group>
            {/* Curved glass/metal canopy using arc shape */}
            <mesh position={[0, height * 0.1, 0]} castShadow>
              <torusGeometry args={[width * 0.45, panelT, 8, 16, Math.PI * 0.6]} />
              <meshStandardMaterial
                color={METAL}
                metalness={0.85}
                roughness={0.15}
                transparent
                opacity={0.6}
              />
            </mesh>
            {/* Top plate (flat) */}
            <Box args={[width * 0.5, panelT, depth * 0.7]} position={[0, height / 2, 0]} castShadow>
              <meshStandardMaterial color={DARK_METAL} metalness={0.8} roughness={0.2} />
            </Box>
            {/* Side supports */}
            <Box args={[panelT, height * 0.6, depth * 0.5]} position={[-width * 0.25, height * 0.1, 0]}>
              <meshStandardMaterial color={METAL} metalness={0.8} roughness={0.2} />
            </Box>
            <Box args={[panelT, height * 0.6, depth * 0.5]} position={[width * 0.25, height * 0.1, 0]}>
              <meshStandardMaterial color={METAL} metalness={0.8} roughness={0.2} />
            </Box>
            {/* Filter */}
            <Box args={[width * 0.6, panelT, depth * 0.6]} position={[0, -height / 2 + panelT / 2, 0]}>
              <meshStandardMaterial color={FILTER_COLOR} metalness={0.6} roughness={0.3} />
            </Box>
            {/* LED */}
            <Box args={[width * 0.4, 0.008, 0.008]} position={[0, -height / 2 + 0.015, depth * 0.2]}>
              <meshStandardMaterial color="#FFE4B5" emissive="#FFE4B5" emissiveIntensity={0.6} />
            </Box>
          </group>
        );

      case 'range_hood_wall':
      default:
        return (
          <group>
            {/* Slim wall-mount body */}
            <Box args={[width, height * 0.7, depth * 0.8]} position={[0, -height * 0.1, 0]} castShadow receiveShadow>
              <meshStandardMaterial color={METAL} metalness={0.8} roughness={0.2} />
            </Box>
            {/* Bottom filter area */}
            <Box args={[width * 0.85, panelT, depth * 0.65]} position={[0, -height / 2 + panelT, 0]}>
              <meshStandardMaterial color={FILTER_COLOR} metalness={0.6} roughness={0.3} />
            </Box>
            {/* Top bracket/mounting plate */}
            <Box args={[width * 0.3, height * 0.3, panelT]} position={[0, height / 2 - height * 0.15, -depth / 2 + panelT]}>
              <meshStandardMaterial color={DARK_METAL} metalness={0.7} roughness={0.25} />
            </Box>
            {/* LED strip */}
            <Box args={[width * 0.6, 0.008, 0.008]} position={[0, -height / 2 + 0.015, depth * 0.25]}>
              <meshStandardMaterial color="#FFE4B5" emissive="#FFE4B5" emissiveIntensity={0.6} />
            </Box>
          </group>
        );
    }
  }, [type, width, height, depth, config, chimneyW]);

  return <group>{elements}</group>;
}
