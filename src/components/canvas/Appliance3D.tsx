import React, { useMemo } from 'react';
import { Box, Sphere, Torus } from '@react-three/drei';
import * as THREE from 'three';

type ApplianceType =
  | 'fridge' | 'freezer' | 'oven' | 'electric_oven' | 'microwave'
  | 'stove' | 'dishwasher' | 'washing_machine' | 'dryer' | 'sink';

interface Appliance3DProps {
  type: ApplianceType;
  width: number;
  height: number;
  depth: number;
  variant?: 'standard' | 'premium' | 'compact';
  capacityLiters?: number; // for electric_oven, microwave
}

export const Appliance3D: React.FC<Appliance3DProps> = ({
  type,
  width: w,
  height: h,
  depth: d,
  variant = 'standard',
  capacityLiters,
}) => {

  // ─── FRIDGE ───
  if (type === 'fridge') {
    if (variant === 'compact') {
      return (
        <group>
          <Box args={[w, h, d]} position={[0, 0, 0]} castShadow receiveShadow>
            <meshStandardMaterial color="#e0e7ff" metalness={0.7} roughness={0.25} />
          </Box>
          <Box args={[w - 0.02, h - 0.02, 0.025]} position={[0, 0, d / 2 - 0.0125]} castShadow>
            <meshStandardMaterial color="#f8fafc" metalness={0.8} roughness={0.2} />
          </Box>
          <Box args={[0.018, h * 0.4, 0.02]} position={[-w / 2 + 0.05, 0, d / 2 + 0.015]} castShadow>
            <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.1} />
          </Box>
        </group>
      );
    }
    if (variant === 'premium') {
      return (
        <group>
          <Box args={[w, h, d]} position={[0, 0, 0]} castShadow receiveShadow>
            <meshStandardMaterial color="#f0f9ff" metalness={0.8} roughness={0.2} />
          </Box>
          <Box args={[w * 0.45, h - 0.02, 0.035]} position={[-w * 0.275, 0, d / 2 - 0.0175]} castShadow>
            <meshStandardMaterial color="#e0e7ff" metalness={0.7} roughness={0.15} />
          </Box>
          <Box args={[w * 0.45, h - 0.02, 0.035]} position={[w * 0.275, 0, d / 2 - 0.0175]} castShadow>
            <meshStandardMaterial color="#e0e7ff" metalness={0.7} roughness={0.15} />
          </Box>
          <Box args={[0.015, h - 0.03, 0.04]} position={[0, 0, d / 2 - 0.02]} castShadow>
            <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
          </Box>
          <Box args={[0.018, h * 0.5, 0.02]} position={[-w * 0.4, 0, d / 2 + 0.018]} castShadow>
            <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.1} />
          </Box>
          <Box args={[0.018, h * 0.5, 0.02]} position={[w * 0.4, 0, d / 2 + 0.018]} castShadow>
            <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.1} />
          </Box>
          <Box args={[0.12, 0.18, 0.03]} position={[w * 0.35, h * 0.25, d / 2 + 0.02]} castShadow>
            <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.3} />
          </Box>
        </group>
      );
    }
    // Standard fridge
    return (
      <group>
        <Box args={[w, h, d]} position={[0, 0, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#e0e7ff" metalness={0.7} roughness={0.25} />
        </Box>
        <Box args={[w - 0.02, h * 0.32, 0.035]} position={[0, h * 0.34, d / 2 - 0.0175]} castShadow>
          <meshStandardMaterial color="#e0e7ff" metalness={0.7} roughness={0.15} />
        </Box>
        <Box args={[w - 0.02, h * 0.63, 0.035]} position={[0, -h * 0.185, d / 2 - 0.0175]} castShadow>
          <meshStandardMaterial color="#e0e7ff" metalness={0.7} roughness={0.15} />
        </Box>
        <Box args={[w - 0.02, 0.012, 0.04]} position={[0, h * 0.175, d / 2 - 0.02]} castShadow>
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
        </Box>
        <Box args={[0.018, h * 0.18, 0.02]} position={[-w / 2 + 0.05, h * 0.34, d / 2 + 0.018]} castShadow>
          <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.1} />
        </Box>
        <Box args={[0.018, h * 0.32, 0.02]} position={[-w / 2 + 0.05, -h * 0.185, d / 2 + 0.018]} castShadow>
          <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.1} />
        </Box>
      </group>
    );
  }

  // ─── FREEZER ───
  if (type === 'freezer') {
    return (
      <group>
        <Box args={[w, h, d]} position={[0, 0, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#e0e7ff" metalness={0.7} roughness={0.25} />
        </Box>
        <Box args={[w - 0.02, h - 0.02, 0.035]} position={[0, 0, d / 2 - 0.0175]} castShadow>
          <meshStandardMaterial color="#e0e7ff" metalness={0.7} roughness={0.15} />
        </Box>
        <Box args={[0.018, h * 0.4, 0.02]} position={[-w / 2 + 0.05, 0, d / 2 + 0.018]} castShadow>
          <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.1} />
        </Box>
      </group>
    );
  }

  // ─── STOVE / COOKTOP ───
  if (type === 'stove') {
    return (
      <group>
        <Box args={[w, h, d]} position={[0, 0, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.4} />
        </Box>
        {/* Cooktop surface */}
        <Box args={[w - 0.02, 0.015, d - 0.02]} position={[0, h / 2 - 0.0075, 0]} castShadow>
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
        </Box>
        {/* Burners */}
        {[
          { x: -w * 0.25, z: -d * 0.25, r: 0.08 },
          { x: w * 0.25, z: -d * 0.25, r: 0.1 },
          { x: -w * 0.25, z: d * 0.25, r: 0.1 },
          { x: w * 0.25, z: d * 0.25, r: 0.08 },
        ].map((burner, i) => (
          <group key={i}>
            <Box args={[burner.r * 0.8, 0.008, burner.r * 0.8]} position={[burner.x, h / 2, burner.z]} castShadow>
              <meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.4} />
            </Box>
            <Torus args={[burner.r, 0.006, 8, 32]} position={[burner.x, h / 2 + 0.008, burner.z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.3} />
            </Torus>
            <Box args={[burner.r * 0.25, 0.003, burner.r * 0.25]} position={[burner.x, h / 2 + 0.012, burner.z]} castShadow>
              <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.2} />
            </Box>
          </group>
        ))}
        {/* Control knobs */}
        {[-0.15, -0.05, 0.05, 0.15].map((xPos, i) => (
          <Sphere key={i} args={[0.018, 16, 16]} position={[xPos, h / 2 - 0.025, d / 2 + 0.022]} castShadow>
            <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
          </Sphere>
        ))}
      </group>
    );
  }

  // ─── OVEN (gas) ───
  if (type === 'oven') {
    return (
      <group>
        <Box args={[w, h, d]} position={[0, 0, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.4} />
        </Box>
        {/* Glass door */}
        <Box args={[w - 0.03, h - 0.06, 0.015]} position={[0, 0, d / 2 + 0.0075]} castShadow>
          <meshPhysicalMaterial color="#1e293b" metalness={0.9} roughness={0.1} transparent opacity={0.75} />
        </Box>
        {/* Control panel */}
        <Box args={[w - 0.03, 0.06, 0.015]} position={[0, h / 2 - 0.03, d / 2 + 0.0075]} castShadow>
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
        </Box>
        {/* Display */}
        <Box args={[0.06, 0.02, 0.003]} position={[0, h / 2 - 0.03, d / 2 + 0.012]} castShadow>
          <meshStandardMaterial color="#0f172a" emissive="#3b82f6" emissiveIntensity={0.4} />
        </Box>
        {/* Handle */}
        <Box args={[w - 0.08, 0.015, 0.025]} position={[0, h / 2 - 0.15, d / 2 + 0.02]} castShadow>
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
        </Box>
        {/* Knobs */}
        {[-0.15, 0, 0.15].map((xPos, i) => (
          <Sphere key={i} args={[0.016, 16, 16]} position={[xPos, h / 2 - 0.03, d / 2 + 0.022]} castShadow>
            <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
          </Sphere>
        ))}
      </group>
    );
  }

  // ─── ELECTRIC OVEN (with capacity-based sizing) ───
  if (type === 'electric_oven') {
    // Volume scale: default 60L is ~600x600x600
    const lit = capacityLiters || 60;
    const scale = Math.cbrt(lit / 60);
    const ow = w * Math.min(scale, 1.2);
    const oh = h * Math.min(scale, 1.3);
    const od = d * Math.min(scale, 1.1);

    return (
      <group>
        {/* Main body */}
        <Box args={[ow, oh, od]} position={[0, 0, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#1a1a2e" metalness={0.65} roughness={0.35} />
        </Box>
        {/* Glass door (large, dark tinted) */}
        <Box args={[ow - 0.04, oh * 0.65, 0.015]} position={[0, -oh * 0.05, od / 2 + 0.0075]} castShadow>
          <meshPhysicalMaterial color="#0d1117" metalness={0.95} roughness={0.05} transparent opacity={0.8} />
        </Box>
        {/* Inner chamber glow */}
        <Box args={[ow - 0.08, oh * 0.6, 0.005]} position={[0, -oh * 0.05, od / 2 - 0.01]}>
          <meshStandardMaterial color="#0a0a14" metalness={0.4} roughness={0.6} />
        </Box>
        {/* Heating element glow (bottom) */}
        <Box args={[ow - 0.12, 0.004, od * 0.6]} position={[0, -oh * 0.35, 0]}>
          <meshStandardMaterial color="#ff6b35" emissive="#ff6b35" emissiveIntensity={0.4} transparent opacity={0.7} />
        </Box>
        {/* Heating element glow (top) */}
        <Box args={[ow - 0.12, 0.004, od * 0.6]} position={[0, oh * 0.2, 0]}>
          <meshStandardMaterial color="#ff6b35" emissive="#ff6b35" emissiveIntensity={0.3} transparent opacity={0.5} />
        </Box>
        {/* Control panel (touch) */}
        <Box args={[ow - 0.04, oh * 0.2, 0.018]} position={[0, oh / 2 - oh * 0.1, od / 2 + 0.009]} castShadow>
          <meshStandardMaterial color="#111827" metalness={0.7} roughness={0.3} />
        </Box>
        {/* Touch display */}
        <Box args={[ow * 0.35, oh * 0.08, 0.003]} position={[0, oh / 2 - oh * 0.1, od / 2 + 0.018]} castShadow>
          <meshStandardMaterial color="#1e293b" emissive="#f59e0b" emissiveIntensity={0.5} />
        </Box>
        {/* Handle (sleek bar) */}
        <Box args={[ow * 0.6, 0.012, 0.02]} position={[0, oh / 2 - oh * 0.02, od / 2 + 0.02]} castShadow>
          <meshStandardMaterial color="#a1a1aa" metalness={0.95} roughness={0.05} />
        </Box>
        {/* Capacity label */}
        {lit > 0 && (
          <Box args={[0.04, 0.015, 0.003]} position={[ow / 2 - 0.06, oh / 2 - oh * 0.1, od / 2 + 0.02]}>
            <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.3} />
          </Box>
        )}
      </group>
    );
  }

  // ─── MICROWAVE ───
  if (type === 'microwave') {
    const lit = capacityLiters || 25;
    const scale = Math.cbrt(lit / 25);
    const mw = w * Math.min(scale, 1.3);
    const mh = h * Math.min(scale, 1.2);
    const md = d * Math.min(scale, 1.1);

    return (
      <group>
        {/* Main body */}
        <Box args={[mw, mh, md]} position={[0, 0, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#27272a" metalness={0.6} roughness={0.35} />
        </Box>
        {/* Glass door */}
        <Box args={[mw * 0.65, mh - 0.04, 0.012]} position={[-mw * 0.1, 0, md / 2 + 0.006]} castShadow>
          <meshPhysicalMaterial color="#18181b" metalness={0.9} roughness={0.08} transparent opacity={0.75} />
        </Box>
        {/* Inner light glow */}
        <Box args={[mw * 0.6, mh - 0.08, 0.004]} position={[-mw * 0.1, 0, md / 2 - 0.01]}>
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.3} transparent opacity={0.4} />
        </Box>
        {/* Control panel (right side) */}
        <Box args={[mw * 0.28, mh - 0.04, 0.015]} position={[mw * 0.33, 0, md / 2 + 0.0075]} castShadow>
          <meshStandardMaterial color="#1c1c1e" metalness={0.6} roughness={0.4} />
        </Box>
        {/* Touch buttons */}
        {[0.15, 0.05, -0.05, -0.15].map((yPos, i) => (
          <Box key={i} args={[0.025, 0.025, 0.003]} position={[mw * 0.33, yPos, md / 2 + 0.015]}>
            <meshStandardMaterial color="#3f3f46" metalness={0.5} roughness={0.4} />
          </Box>
        ))}
        {/* Digital display */}
        <Box args={[mw * 0.22, 0.025, 0.003]} position={[mw * 0.33, mh * 0.35, md / 2 + 0.016]}>
          <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={0.6} />
        </Box>
        {/* Door handle (push button) */}
        <Sphere args={[0.012, 16, 16]} position={[mw * 0.12, 0, md / 2 + 0.015]} castShadow>
          <meshStandardMaterial color="#a1a1aa" metalness={0.8} roughness={0.15} />
        </Sphere>
      </group>
    );
  }

  // ─── DISHWASHER ───
  if (type === 'dishwasher') {
    return (
      <group>
        <Box args={[w, h, d]} position={[0, 0, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#e0e7ff" metalness={0.7} roughness={0.25} />
        </Box>
        {/* Front panel */}
        <Box args={[w - 0.02, h - 0.02, 0.02]} position={[0, 0, d / 2 - 0.01]} castShadow>
          <meshStandardMaterial color="#f0f9ff" metalness={0.7} roughness={0.2} />
        </Box>
        {/* Handle (horizontal, recessed) */}
        <Box args={[w * 0.5, 0.018, 0.025]} position={[0, h * 0.15, d / 2 + 0.018]} castShadow>
          <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.1} />
        </Box>
        {/* Control panel */}
        <Box args={[w - 0.04, 0.05, 0.012]} position={[0, h / 2 - 0.025, d / 2 + 0.006]} castShadow>
          <meshStandardMaterial color="#cbd5e1" metalness={0.7} roughness={0.3} />
        </Box>
        {/* LED indicators */}
        {[-0.08, -0.04, 0, 0.04, 0.08].map((xPos, i) => (
          <Box key={i} args={[0.008, 0.008, 0.003]} position={[xPos, h / 2 - 0.025, d / 2 + 0.012]}>
            <meshStandardMaterial
              color={i < 3 ? '#22c55e' : '#94a3b8'}
              emissive={i < 3 ? '#22c55e' : '#000000'}
              emissiveIntensity={i < 3 ? 0.5 : 0}
            />
          </Box>
        ))}
      </group>
    );
  }

  // ─── WASHING MACHINE (circular door, glass, detergent drawer) ───
  if (type === 'washing_machine') {
    const doorRadius = Math.min(w, h) * 0.28;
    return (
      <group>
        <Box args={[w, h, d]} position={[0, 0, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#e0e7ff" metalness={0.7} roughness={0.25} />
        </Box>
        {/* Front panel */}
        <Box args={[w - 0.02, h - 0.02, 0.02]} position={[0, 0, d / 2 - 0.01]} castShadow>
          <meshStandardMaterial color="#f0f9ff" metalness={0.7} roughness={0.2} />
        </Box>
        {/* Circular door frame (ring) */}
        <Torus args={[doorRadius, 0.015, 16, 48]} position={[0, -h * 0.1, d / 2 + 0.006]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.15} />
        </Torus>
        {/* Circular door glass (disc) */}
        <Box args={[doorRadius * 2 - 0.01, 0.008, doorRadius * 2 - 0.01]} position={[0, -h * 0.1, d / 2 + 0.01]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <meshPhysicalMaterial color="#c7d2fe" metalness={0.5} roughness={0.3} transparent opacity={0.45} />
        </Box>
        {/* Inner drum visible through glass */}
        <Box args={[doorRadius * 1.4, 0.005, doorRadius * 1.4]} position={[0, -h * 0.1, d / 2 - 0.005]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.4} />
        </Box>
        {/* Door handle (recessed at top of door) */}
        <Box args={[0.06, 0.012, 0.02]} position={[0, -h * 0.1 + doorRadius + 0.02, d / 2 + 0.018]} castShadow>
          <meshStandardMaterial color="#64748b" metalness={0.85} roughness={0.15} />
        </Box>
        {/* Detergent drawer (top-left) */}
        <Box args={[w * 0.18, 0.04, 0.012]} position={[-w * 0.3, h / 2 - 0.05, d / 2 + 0.006]} castShadow>
          <meshStandardMaterial color="#cbd5e1" metalness={0.6} roughness={0.35} />
        </Box>
        {/* Control panel */}
        <Box args={[w - 0.04, 0.07, 0.012]} position={[0, h / 2 - 0.035, d / 2 + 0.006]} castShadow>
          <meshStandardMaterial color="#cbd5e1" metalness={0.7} roughness={0.3} />
        </Box>
        {/* Program selector knob */}
        <Sphere args={[0.02, 16, 16]} position={[w * 0.25, h / 2 - 0.035, d / 2 + 0.016]} castShadow>
          <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
        </Sphere>
        {/* Display */}
        <Box args={[0.06, 0.02, 0.003]} position={[-w * 0.05, h / 2 - 0.035, d / 2 + 0.012]}>
          <meshStandardMaterial color="#0f172a" emissive="#3b82f6" emissiveIntensity={0.5} />
        </Box>
      </group>
    );
  }

  // ─── DRYER (circular door, no detergent drawer, lint filter) ───
  if (type === 'dryer') {
    const doorRadius = Math.min(w, h) * 0.28;
    return (
      <group>
        <Box args={[w, h, d]} position={[0, 0, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#d4d4d8" metalness={0.7} roughness={0.25} />
        </Box>
        {/* Front panel */}
        <Box args={[w - 0.02, h - 0.02, 0.02]} position={[0, 0, d / 2 - 0.01]} castShadow>
          <meshStandardMaterial color="#e4e4e7" metalness={0.7} roughness={0.2} />
        </Box>
        {/* Circular door frame */}
        <Torus args={[doorRadius, 0.015, 16, 48]} position={[0, -h * 0.1, d / 2 + 0.006]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <meshStandardMaterial color="#a1a1aa" metalness={0.85} roughness={0.15} />
        </Torus>
        {/* Circular door glass */}
        <Box args={[doorRadius * 2 - 0.01, 0.008, doorRadius * 2 - 0.01]} position={[0, -h * 0.1, d / 2 + 0.01]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <meshPhysicalMaterial color="#d4d4d8" metalness={0.5} roughness={0.3} transparent opacity={0.4} />
        </Box>
        {/* Door handle */}
        <Box args={[0.06, 0.012, 0.02]} position={[0, -h * 0.1 + doorRadius + 0.02, d / 2 + 0.018]} castShadow>
          <meshStandardMaterial color="#71717a" metalness={0.85} roughness={0.15} />
        </Box>
        {/* Lint filter (top of door area) */}
        <Box args={[w * 0.5, 0.008, 0.02]} position={[0, h * 0.15, d / 2 + 0.008]} castShadow>
          <meshStandardMaterial color="#a1a1aa" metalness={0.6} roughness={0.4} />
        </Box>
        {/* Control panel */}
        <Box args={[w - 0.04, 0.07, 0.012]} position={[0, h / 2 - 0.035, d / 2 + 0.006]} castShadow>
          <meshStandardMaterial color="#d4d4d8" metalness={0.7} roughness={0.3} />
        </Box>
        {/* Program knob */}
        <Sphere args={[0.02, 16, 16]} position={[w * 0.25, h / 2 - 0.035, d / 2 + 0.016]} castShadow>
          <meshStandardMaterial color="#71717a" metalness={0.8} roughness={0.2} />
        </Sphere>
      </group>
    );
  }

  // ─── SINK ───
  if (type === 'sink') {
    const faucetCurve = useMemo(() => {
      return new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.01, -d * 0.25),
        new THREE.Vector3(0, 0.09, -d * 0.25),
        new THREE.Vector3(0, 0.11, -d * 0.10),
        new THREE.Vector3(0, 0.08, d * 0.02),
      ]);
    }, [d]);

    return (
      <group position={[0, h / 2 + 0.01, 0]}>
        <Box args={[w, 0.015, d]} position={[0, 0.005, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#f8fafc" metalness={0.3} roughness={0.4} />
        </Box>
        <Box args={[w * 0.8, 0.12, d * 0.65]} position={[0, -0.05, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.15} />
        </Box>
        <Box args={[w * 0.7, 0.1, d * 0.55]} position={[0, -0.07, 0]}>
          <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.3} />
        </Box>
        <Box args={[0.025, 0.005, 0.03]} position={[0, -h / 2 - 0.01, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
        </Box>
        <mesh castShadow>
          <tubeGeometry args={[faucetCurve, 20, 0.012, 8, false]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
        </mesh>
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
