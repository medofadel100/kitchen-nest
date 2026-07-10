import React, { useMemo } from 'react';
import { Box, Sphere, Torus } from '@react-three/drei';
import * as THREE from 'three';

interface Appliance3DProps {
  type: 'fridge' | 'oven' | 'sink' | 'dishwasher' | 'washing_machine' | 'dryer' | 'freezer' | 'stove';
  width: number;
  height: number;
  depth: number;
  variant?: 'standard' | 'premium' | 'compact';
}

export const Appliance3D: React.FC<Appliance3DProps> = ({ 
  type, 
  width: w, 
  height: h, 
  depth: d,
  variant = 'standard'
}) => {
  // Fridge variants
  if (type === 'fridge') {
    if (variant === 'compact') {
      // Compact fridge (under counter) - more realistic
      return (
        <group>
          {/* Main Body - positioned at back */}
          <Box args={[w, h, d]} position={[0, 0, 0]} castShadow receiveShadow>
            <meshStandardMaterial color="#e0e7ff" metalness={0.7} roughness={0.25} />
          </Box>
          {/* Door - positioned at front face */}
          <Box args={[w - 0.02, h - 0.02, 0.025]} position={[0, 0, d / 2 - 0.0125]} castShadow>
            <meshStandardMaterial color="#f8fafc" metalness={0.8} roughness={0.2} />
          </Box>
          {/* Handle - vertical bar style */}
          <Box args={[0.018, h * 0.4, 0.02]} position={[-w / 2 + 0.05, 0, d / 2 + 0.015]} castShadow>
            <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.1} />
          </Box>
          {/* Top hinge */}
          <Box args={[0.015, 0.015, 0.025]} position={[-w / 2 + 0.05, h / 2 - 0.02, d / 2 - 0.005]} castShadow>
            <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
          </Box>
          {/* Bottom hinge */}
          <Box args={[0.015, 0.015, 0.025]} position={[-w / 2 + 0.05, -h / 2 + 0.02, d / 2 - 0.005]} castShadow>
            <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
          </Box>
        </group>
      );
    }
    
    if (variant === 'premium') {
      // Premium side-by-side fridge - more realistic
      return (
        <group>
          {/* Main Body - positioned at back */}
          <Box args={[w, h, d]} position={[0, 0, 0]} castShadow receiveShadow>
            <meshStandardMaterial color="#f0f9ff" metalness={0.8} roughness={0.2} />
          </Box>
          {/* Left Door (Freezer) - positioned at front */}
          <Box args={[w * 0.45, h - 0.02, 0.035]} position={[-w * 0.275, 0, d / 2 - 0.0175]} castShadow>
            <meshStandardMaterial color="#e0e7ff" metalness={0.7} roughness={0.15} />
          </Box>
          {/* Right Door (Fridge) - positioned at front */}
          <Box args={[w * 0.45, h - 0.02, 0.035]} position={[w * 0.275, 0, d / 2 - 0.0175]} castShadow>
            <meshStandardMaterial color="#e0e7ff" metalness={0.7} roughness={0.15} />
          </Box>
          {/* Center Divider - at front */}
          <Box args={[0.015, h - 0.03, 0.04]} position={[0, 0, d / 2 - 0.02]} castShadow>
            <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
          </Box>
          {/* Left Handle - vertical bar */}
          <Box args={[0.018, h * 0.5, 0.02]} position={[-w * 0.4, 0, d / 2 + 0.018]} castShadow>
            <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.1} />
          </Box>
          {/* Right Handle - vertical bar */}
          <Box args={[0.018, h * 0.5, 0.02]} position={[w * 0.4, 0, d / 2 + 0.018]} castShadow>
            <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.1} />
          </Box>
          {/* Water Dispenser - on right door */}
          <Box args={[0.12, 0.18, 0.03]} position={[w * 0.35, h * 0.25, d / 2 + 0.02]} castShadow>
            <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.3} />
          </Box>
          {/* Ice dispenser button */}
          <Sphere args={[0.012, 16, 16]} position={[w * 0.35, h * 0.15, d / 2 + 0.035]} castShadow>
            <meshStandardMaterial color="#3b82f6" metalness={0.7} roughness={0.3} />
          </Sphere>
        </group>
      );
    }
    
    // Standard fridge (top freezer) - more realistic
    return (
      <group>
        {/* Main Body - positioned at back */}
        <Box args={[w, h, d]} position={[0, 0, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#e0e7ff" metalness={0.7} roughness={0.25} />
        </Box>
        {/* Top Freezer Door - positioned at front */}
        <Box args={[w - 0.02, h * 0.32, 0.035]} position={[0, h * 0.34, d / 2 - 0.0175]} castShadow>
          <meshStandardMaterial color="#e0e7ff" metalness={0.7} roughness={0.15} />
        </Box>
        {/* Bottom Fridge Door - positioned at front */}
        <Box args={[w - 0.02, h * 0.63, 0.035]} position={[0, -h * 0.185, d / 2 - 0.0175]} castShadow>
          <meshStandardMaterial color="#e0e7ff" metalness={0.7} roughness={0.15} />
        </Box>
        {/* Divider - at front */}
        <Box args={[w - 0.02, 0.012, 0.04]} position={[0, h * 0.175, d / 2 - 0.02]} castShadow>
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
        </Box>
        {/* Top Handle - vertical bar */}
        <Box args={[0.018, h * 0.18, 0.02]} position={[-w / 2 + 0.05, h * 0.34, d / 2 + 0.018]} castShadow>
          <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.1} />
        </Box>
        {/* Bottom Handle - vertical bar */}
        <Box args={[0.018, h * 0.32, 0.02]} position={[-w / 2 + 0.05, -h * 0.185, d / 2 + 0.018]} castShadow>
          <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.1} />
        </Box>
      </group>
    );
  }

  // Freezer (separate unit) - more realistic
  if (type === 'freezer') {
    return (
      <group>
        {/* Main Body - positioned at back */}
        <Box args={[w, h, d]} position={[0, 0, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#e0e7ff" metalness={0.7} roughness={0.25} />
        </Box>
        {/* Door - positioned at front */}
        <Box args={[w - 0.02, h - 0.02, 0.035]} position={[0, 0, d / 2 - 0.0175]} castShadow>
          <meshStandardMaterial color="#e0e7ff" metalness={0.7} roughness={0.15} />
        </Box>
        {/* Handle - vertical bar */}
        <Box args={[0.018, h * 0.4, 0.02]} position={[-w / 2 + 0.05, 0, d / 2 + 0.018]} castShadow>
          <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.1} />
        </Box>
        {/* Ice Dispenser - at front */}
        <Box args={[0.1, 0.12, 0.03]} position={[w * 0.3, h * 0.15, d / 2 + 0.02]} castShadow>
          <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.3} />
        </Box>
      </group>
    );
  }

  // Oven variants
  if (type === 'oven') {
    if (variant === 'compact') {
      // Compact countertop oven - more realistic
      return (
        <group>
          {/* Body - positioned at back */}
          <Box args={[w, h, d]} position={[0, 0, 0]} castShadow receiveShadow>
            <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.4} />
          </Box>
          {/* Glass Door - at front */}
          <Box args={[w - 0.03, h - 0.06, 0.012]} position={[0, 0, d / 2 + 0.006]} castShadow>
            <meshPhysicalMaterial color="#0f172a" metalness={0.9} roughness={0.1} transparent opacity={0.7} />
          </Box>
          {/* Inner Chamber - darker */}
          <Box args={[w - 0.06, h - 0.1, 0.008]} position={[0, 0, d / 2 - 0.025]}>
            <meshStandardMaterial color="#020617" metalness={0.5} roughness={0.6} />
          </Box>
          {/* Heating elements - visible at bottom */}
          <Box args={[w - 0.1, 0.005, d - 0.05]} position={[0, -h / 2 + 0.02, 0]}>
            <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.3} />
          </Box>
          {/* Handle - horizontal bar */}
          <Box args={[w - 0.06, 0.012, 0.02]} position={[0, h / 2 - 0.04, d / 2 + 0.015]} castShadow>
            <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
          </Box>
          {/* Knobs */}
          {[0.2, 0, -0.2].map((yPos, i) => (
            <Sphere 
              key={i}
              args={[0.014, 16, 16]} 
              position={[w / 2 - 0.035, yPos, d / 2 + 0.022]} 
              castShadow
            >
              <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
            </Sphere>
          ))}
        </group>
      );
    }
    
    // Standard built-in oven - more realistic
    return (
      <group>
        {/* Body - positioned at back */}
        <Box args={[w, h, d]} position={[0, 0, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.4} />
        </Box>
        {/* Glass Door - at front */}
        <Box args={[w - 0.03, h - 0.06, 0.015]} position={[0, 0, d / 2 + 0.0075]} castShadow>
          <meshPhysicalMaterial color="#0f172a" metalness={0.9} roughness={0.1} transparent opacity={0.75} />
        </Box>
        {/* Inner Chamber - darker with visible racks */}
        <Box args={[w - 0.08, h - 0.12, 0.008]} position={[0, 0, d / 2 - 0.03]}>
          <meshStandardMaterial color="#020617" metalness={0.5} roughness={0.6} />
        </Box>
        {/* Top Control Panel - at front */}
        <Box args={[w - 0.03, 0.06, 0.015]} position={[0, h / 2 - 0.03, d / 2 + 0.0075]} castShadow>
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
        </Box>
        {/* Display - on control panel */}
        <Box args={[0.06, 0.02, 0.003]} position={[0, h / 2 - 0.03, d / 2 + 0.012]} castShadow>
          <meshStandardMaterial color="#0f172a" emissive="#3b82f6" emissiveIntensity={0.4} />
        </Box>
        {/* Knobs - on control panel */}
        {[-0.15, 0, 0.15].map((yPos, i) => (
          <Sphere 
            key={i}
            args={[0.016, 16, 16]} 
            position={[w / 2 - 0.04, yPos, d / 2 + 0.022]} 
            castShadow
          >
            <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
          </Sphere>
        ))}
        {/* Handle - horizontal bar below door */}
        <Box args={[w - 0.08, 0.015, 0.025]} position={[0, h / 2 - 0.15, d / 2 + 0.02]} castShadow>
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
        </Box>
      </group>
    );
  }

  // Stove/Cooktop - more realistic
  if (type === 'stove') {
    return (
      <group>
        {/* Main Body - positioned at back */}
        <Box args={[w, h, d]} position={[0, 0, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.4} />
        </Box>
        {/* Cooktop Surface - at top front */}
        <Box args={[w - 0.02, 0.015, d - 0.02]} position={[0, h / 2 - 0.0075, 0]} castShadow>
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
        </Box>
        {/* Burner Controls - at front */}
        <Box args={[w - 0.04, 0.05, 0.015]} position={[0, h / 2 - 0.025, d / 2 + 0.0075]} castShadow>
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
        </Box>
        {/* Burners - with more realistic design */}
        {[
          { x: -w * 0.25, z: -d * 0.25, r: 0.08, color: '#64748b' },
          { x: w * 0.25, z: -d * 0.25, r: 0.1, color: '#475569' },
          { x: -w * 0.25, z: d * 0.25, r: 0.1, color: '#475569' },
          { x: w * 0.25, z: d * 0.25, r: 0.08, color: '#64748b' },
        ].map((burner, i) => (
          <group key={i}>
            {/* Burner Base */}
            <Box args={[burner.r * 0.8, 0.008, burner.r * 0.8]} position={[burner.x, h / 2, burner.z]} castShadow>
              <meshStandardMaterial color={burner.color} metalness={0.6} roughness={0.4} />
            </Box>
            {/* Burner Ring */}
            <Torus args={[burner.r, 0.006, 8, 32]} position={[burner.x, h / 2 + 0.008, burner.z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.3} />
            </Torus>
            {/* Burner Center */}
            <Box args={[burner.r * 0.25, 0.003, burner.r * 0.25]} position={[burner.x, h / 2 + 0.012, burner.z]} castShadow>
              <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.2} />
            </Box>
          </group>
        ))}
        {/* Control Knobs - on control panel */}
        {[-0.15, -0.05, 0.05, 0.15].map((xPos, i) => (
          <Sphere 
            key={i}
            args={[0.018, 16, 16]} 
            position={[xPos, h / 2 - 0.025, d / 2 + 0.022]} 
            castShadow
          >
            <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
          </Sphere>
        ))}
      </group>
    );
  }

  // Dishwasher - more realistic
  if (type === 'dishwasher') {
    return (
      <group>
        {/* Main Body - positioned at back */}
        <Box args={[w, h, d]} position={[0, 0, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#e0e7ff" metalness={0.7} roughness={0.25} />
        </Box>
        {/* Front Panel - at front */}
        <Box args={[w - 0.02, h - 0.02, 0.02]} position={[0, 0, d / 2 - 0.01]} castShadow>
          <meshStandardMaterial color="#f0f9ff" metalness={0.7} roughness={0.2} />
        </Box>
        {/* Handle - horizontal bar */}
        <Box args={[w * 0.5, 0.018, 0.025]} position={[0, h * 0.15, d / 2 + 0.018]} castShadow>
          <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.1} />
        </Box>
        {/* Control Panel - at top front */}
        <Box args={[w - 0.04, 0.05, 0.012]} position={[0, h / 2 - 0.025, d / 2 + 0.006]} castShadow>
          <meshStandardMaterial color="#cbd5e1" metalness={0.7} roughness={0.3} />
        </Box>
        {/* LED indicator */}
        <Box args={[0.04, 0.015, 0.003]} position={[0, h / 2 - 0.025, d / 2 + 0.012]}>
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.5} />
        </Box>
      </group>
    );
  }

  // Washing Machine - more realistic
  if (type === 'washing_machine') {
    return (
      <group>
        {/* Main Body - positioned at back */}
        <Box args={[w, h, d]} position={[0, 0, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#e0e7ff" metalness={0.7} roughness={0.25} />
        </Box>
        {/* Front Panel - at front */}
        <Box args={[w - 0.02, h - 0.02, 0.02]} position={[0, 0, d / 2 - 0.01]} castShadow>
          <meshStandardMaterial color="#f0f9ff" metalness={0.7} roughness={0.2} />
        </Box>
        {/* Door (Circular) - at front */}
        <Box args={[w * 0.32, 0.012, w * 0.32]} position={[0, -h * 0.15, d / 2 + 0.006]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
        </Box>
        {/* Door Glass - transparent */}
        <Box args={[w * 0.3, 0.008, w * 0.3]} position={[0, -h * 0.15, d / 2 + 0.01]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <meshPhysicalMaterial color="#e0e7ff" metalness={0.6} roughness={0.3} transparent opacity={0.4} />
        </Box>
        {/* Door Handle */}
        <Box args={[0.025, 0.025, 0.02]} position={[0, -h * 0.15, d / 2 + 0.025]} castShadow>
          <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
        </Box>
        {/* Control Panel - at top front */}
        <Box args={[w - 0.04, 0.07, 0.012]} position={[0, h / 2 - 0.035, d / 2 + 0.006]} castShadow>
          <meshStandardMaterial color="#cbd5e1" metalness={0.7} roughness={0.3} />
        </Box>
        {/* Display */}
        <Box args={[0.05, 0.02, 0.003]} position={[0, h / 2 - 0.035, d / 2 + 0.012]} castShadow>
          <meshStandardMaterial color="#0f172a" emissive="#3b82f6" emissiveIntensity={0.5} />
        </Box>
      </group>
    );
  }

  // Dryer - more realistic
  if (type === 'dryer') {
    return (
      <group>
        {/* Main Body - positioned at back */}
        <Box args={[w, h, d]} position={[0, 0, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#e0e7ff" metalness={0.7} roughness={0.25} />
        </Box>
        {/* Front Panel - at front */}
        <Box args={[w - 0.02, h - 0.02, 0.02]} position={[0, 0, d / 2 - 0.01]} castShadow>
          <meshStandardMaterial color="#f0f9ff" metalness={0.7} roughness={0.2} />
        </Box>
        {/* Door (Circular) - at front */}
        <Box args={[w * 0.32, 0.012, w * 0.32]} position={[0, -h * 0.15, d / 2 + 0.006]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
        </Box>
        {/* Lint Filter - visible at top of door */}
        <Box args={[w * 0.45, 0.008, 0.015]} position={[0, h * 0.12, d / 2 + 0.008]} castShadow>
          <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.4} />
        </Box>
        {/* Control Panel - at top front */}
        <Box args={[w - 0.04, 0.07, 0.012]} position={[0, h / 2 - 0.035, d / 2 + 0.006]} castShadow>
          <meshStandardMaterial color="#cbd5e1" metalness={0.7} roughness={0.3} />
        </Box>
      </group>
    );
  }

  // Sink - improved realistic model with proper faucet using TubeGeometry
  if (type === 'sink') {
    // Create faucet curve using CatmullRomCurve3
    const faucetCurve = useMemo(() => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.01, -d * 0.25),   // Base
        new THREE.Vector3(0, 0.09, -d * 0.25),   // Start curve up
        new THREE.Vector3(0, 0.11, -d * 0.10),   // Curve over basin
        new THREE.Vector3(0, 0.08, d * 0.02),    // End over basin
      ]);
      return curve;
    }, [d]);

    return (
      <group position={[0, h / 2 + 0.01, 0]}>
        {/* Sink Countertop - stone/granite look */}
        <Box args={[w, 0.015, d]} position={[0, 0.005, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#f8fafc" metalness={0.3} roughness={0.4} />
        </Box>
        {/* Sink Basin - Single Bowl - stainless steel */}
        <Box args={[w * 0.8, 0.12, d * 0.65]} position={[0, -0.05, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.15} />
        </Box>
        {/* Basin Inner - darker stainless steel */}
        <Box args={[w * 0.7, 0.1, d * 0.55]} position={[0, -0.07, 0]}>
          <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.3} />
        </Box>
        {/* Drain - at bottom center */}
        <Box args={[0.025, 0.005, 0.03]} position={[0, -h / 2 - 0.01, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
        </Box>
        
        {/* Faucet using TubeGeometry - connected from base to aerator */}
        <mesh castShadow>
          <tubeGeometry args={[faucetCurve, 20, 0.012, 8, false]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
        </mesh>
        
        {/* Faucet Aerator - at the exact end of the curve */}
        {(() => {
          const endPoint = faucetCurve.getPoint(1);
          return (
            <Sphere args={[0.01, 16, 16]} position={[endPoint.x, endPoint.y, endPoint.z]} castShadow>
              <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
            </Sphere>
          );
        })()}
      </group>
    );
  }

  return null;
};