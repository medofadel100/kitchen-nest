import React from 'react';
import { Box, Cylinder, Sphere, Torus } from '@react-three/drei';

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
      // Compact fridge (under counter)
      return (
        <group>
          {/* Main Body */}
          <Box args={[w, h, d]} castShadow receiveShadow>
            <meshStandardMaterial color="#f1f5f9" metalness={0.6} roughness={0.3} />
          </Box>
          {/* Door */}
          <Box args={[w - 0.02, h - 0.02, 0.03]} position={[0, 0, d / 2 - 0.015]} castShadow>
            <meshStandardMaterial color="#e2e8f0" metalness={0.7} roughness={0.2} />
          </Box>
          {/* Handle */}
          <Box args={[0.015, h * 0.5, 0.02]} position={[-w / 2 + 0.04, 0, d / 2 + 0.02]} castShadow>
            <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.1} />
          </Box>
        </group>
      );
    }
    
    if (variant === 'premium') {
      // Premium side-by-side fridge
      return (
        <group>
          {/* Main Body */}
          <Box args={[w, h, d]} castShadow receiveShadow>
            <meshStandardMaterial color="#f8fafc" metalness={0.8} roughness={0.2} />
          </Box>
          {/* Left Door (Freezer) */}
          <Box args={[w * 0.45, h - 0.02, 0.04]} position={[-w * 0.275, 0, d / 2 - 0.02]} castShadow>
            <meshStandardMaterial color="#e2e8f0" metalness={0.7} roughness={0.15} />
          </Box>
          {/* Right Door (Fridge) */}
          <Box args={[w * 0.45, h - 0.02, 0.04]} position={[w * 0.275, 0, d / 2 - 0.02]} castShadow>
            <meshStandardMaterial color="#e2e8f0" metalness={0.7} roughness={0.15} />
          </Box>
          {/* Center Divider */}
          <Box args={[0.02, h - 0.04, 0.045]} position={[0, 0, d / 2 - 0.02]} castShadow>
            <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
          </Box>
          {/* Left Handle */}
          <Box args={[0.02, h * 0.6, 0.03]} position={[-w * 0.4, 0, d / 2 + 0.025]} castShadow>
            <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
          </Box>
          {/* Right Handle */}
          <Box args={[0.02, h * 0.6, 0.03]} position={[w * 0.4, 0, d / 2 + 0.025]} castShadow>
            <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
          </Box>
          {/* Water Dispenser */}
          <Box args={[0.15, 0.2, 0.05]} position={[w * 0.35, h * 0.2, d / 2 + 0.01]} castShadow>
            <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.3} />
          </Box>
        </group>
      );
    }
    
    // Standard fridge (top freezer)
    return (
      <group>
        {/* Main Body */}
        <Box args={[w, h, d]} castShadow receiveShadow>
          <meshStandardMaterial color="#f1f5f9" metalness={0.6} roughness={0.3} />
        </Box>
        {/* Top Freezer Door */}
        <Box args={[w - 0.02, h * 0.3, 0.04]} position={[0, h * 0.35, d / 2 - 0.02]} castShadow>
          <meshStandardMaterial color="#e2e8f0" metalness={0.7} roughness={0.15} />
        </Box>
        {/* Bottom Fridge Door */}
        <Box args={[w - 0.02, h * 0.65, 0.04]} position={[0, -h * 0.175, d / 2 - 0.02]} castShadow>
          <meshStandardMaterial color="#e2e8f0" metalness={0.7} roughness={0.15} />
        </Box>
        {/* Divider */}
        <Box args={[w - 0.02, 0.01, 0.045]} position={[0, h * 0.175, d / 2 - 0.02]} castShadow>
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
        </Box>
        {/* Top Handle */}
        <Box args={[0.02, h * 0.2, 0.03]} position={[-w / 2 + 0.05, h * 0.35, d / 2 + 0.015]} castShadow>
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
        </Box>
        {/* Bottom Handle */}
        <Box args={[0.02, h * 0.35, 0.03]} position={[-w / 2 + 0.05, -h * 0.175, d / 2 + 0.015]} castShadow>
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
        </Box>
      </group>
    );
  }

  // Freezer (separate unit)
  if (type === 'freezer') {
    return (
      <group>
        {/* Main Body */}
        <Box args={[w, h, d]} castShadow receiveShadow>
          <meshStandardMaterial color="#f1f5f9" metalness={0.6} roughness={0.3} />
        </Box>
        {/* Door */}
        <Box args={[w - 0.02, h - 0.02, 0.04]} position={[0, 0, d / 2 - 0.02]} castShadow>
          <meshStandardMaterial color="#e2e8f0" metalness={0.7} roughness={0.15} />
        </Box>
        {/* Handle */}
        <Box args={[0.02, h * 0.5, 0.03]} position={[-w / 2 + 0.05, 0, d / 2 + 0.02]} castShadow>
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
        </Box>
        {/* Ice Dispenser */}
        <Box args={[0.12, 0.15, 0.04]} position={[w * 0.35, h * 0.2, d / 2 + 0.01]} castShadow>
          <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.3} />
        </Box>
      </group>
    );
  }

  // Oven variants
  if (type === 'oven') {
    if (variant === 'compact') {
      // Compact countertop oven
      return (
        <group>
          {/* Body */}
          <Box args={[w, h, d]} castShadow receiveShadow>
            <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.5} />
          </Box>
          {/* Glass Door */}
          <Box args={[w - 0.04, h - 0.08, 0.015]} position={[0, -0.02, d / 2 + 0.008]} castShadow>
            <meshPhysicalMaterial color="#0f172a" metalness={0.9} roughness={0.1} transparent opacity={0.85} />
          </Box>
          {/* Inner Light */}
          <Box args={[w - 0.08, h - 0.12, 0.01]} position={[0, -0.02, d / 2 - 0.04]}>
            <meshBasicMaterial color="#fbbf24" />
          </Box>
          {/* Handle */}
          <Box args={[w - 0.08, 0.015, 0.025]} position={[0, h / 2 - 0.05, d / 2 + 0.02]} castShadow>
            <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
          </Box>
          {/* Knobs */}
          {[0.3, 0.1, -0.1, -0.3].map((yPos, i) => (
            <Cylinder 
              key={i}
              args={[0.015, 0.015, 0.02, 16]} 
              position={[w / 2 - 0.04, yPos, d / 2 + 0.02]} 
              rotation={[Math.PI / 2, 0, 0]} 
              castShadow
            >
              <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
            </Cylinder>
          ))}
        </group>
      );
    }
    
    // Standard built-in oven
    return (
      <group>
        {/* Body */}
        <Box args={[w, h, d]} castShadow receiveShadow>
          <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.5} />
        </Box>
        {/* Glass Door */}
        <Box args={[w - 0.04, h - 0.12, 0.02]} position={[0, -0.03, d / 2 + 0.01]} castShadow>
          <meshPhysicalMaterial color="#0f172a" metalness={0.9} roughness={0.1} transparent opacity={0.9} />
        </Box>
        {/* Inner Light / Grill */}
        <Box args={[w - 0.1, h - 0.18, 0.01]} position={[0, -0.03, d / 2 - 0.06]}>
          <meshBasicMaterial color="#f59e0b" />
        </Box>
        {/* Top Control Panel */}
        <Box args={[w - 0.04, 0.08, 0.02]} position={[0, h / 2 - 0.05, d / 2 + 0.01]} castShadow>
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
        </Box>
        {/* Display */}
        <Box args={[0.08, 0.025, 0.005]} position={[0, h / 2 - 0.05, d / 2 + 0.02]} castShadow>
          <meshStandardMaterial color="#0f172a" emissive="#3b82f6" emissiveIntensity={0.5} />
        </Box>
        {/* Knobs */}
        {[-0.25, -0.15, 0.15, 0.25].map((yPos, i) => (
          <Cylinder 
            key={i}
            args={[0.018, 0.018, 0.025, 16]} 
            position={[w / 2 - 0.08, yPos, d / 2 + 0.025]} 
            rotation={[Math.PI / 2, 0, 0]} 
            castShadow
          >
            <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
          </Cylinder>
        ))}
        {/* Handle */}
        <Box args={[w - 0.1, 0.02, 0.035]} position={[0, h / 2 - 0.12, d / 2 + 0.035]} castShadow>
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
        </Box>
      </group>
    );
  }

  // Stove/Cooktop
  if (type === 'stove') {
    return (
      <group>
        {/* Main Body */}
        <Box args={[w, h, d]} castShadow receiveShadow>
          <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.5} />
        </Box>
        {/* Cooktop Surface */}
        <Box args={[w - 0.02, 0.01, d - 0.02]} position={[0, h / 2 - 0.01, 0]} castShadow>
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
            {/* Burner Ring */}
            <Torus args={[burner.r, 0.008, 8, 32]} position={[burner.x, h / 2, burner.z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
            </Torus>
            {/* Burner Center */}
            <Cylinder args={[burner.r * 0.3, burner.r * 0.3, 0.005, 16]} position={[burner.x, h / 2 + 0.005, burner.z]} castShadow>
              <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
            </Cylinder>
          </group>
        ))}
        {/* Control Panel */}
        <Box args={[w - 0.04, 0.06, 0.02]} position={[0, h / 2 - 0.04, d / 2 + 0.01]} castShadow>
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
        </Box>
        {/* Knobs */}
        {[-0.2, -0.07, 0.07, 0.2].map((xPos, i) => (
          <Cylinder 
            key={i}
            args={[0.015, 0.015, 0.02, 16]} 
            position={[xPos, h / 2 - 0.04, d / 2 + 0.025]} 
            rotation={[0, 0, 0]} 
            castShadow
          >
            <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
          </Cylinder>
        ))}
      </group>
    );
  }

  // Dishwasher
  if (type === 'dishwasher') {
    return (
      <group>
        {/* Main Body */}
        <Box args={[w, h, d]} castShadow receiveShadow>
          <meshStandardMaterial color="#f1f5f9" metalness={0.6} roughness={0.3} />
        </Box>
        {/* Front Panel */}
        <Box args={[w - 0.02, h - 0.02, 0.02]} position={[0, 0, d / 2 - 0.01]} castShadow>
          <meshStandardMaterial color="#e2e8f0" metalness={0.7} roughness={0.2} />
        </Box>
        {/* Handle */}
        <Box args={[w * 0.6, 0.015, 0.025]} position={[0, h * 0.2, d / 2 + 0.015]} castShadow>
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
        </Box>
        {/* Control Panel */}
        <Box args={[w - 0.04, 0.05, 0.015]} position={[0, h / 2 - 0.04, d / 2 + 0.005]} castShadow>
          <meshStandardMaterial color="#cbd5e1" metalness={0.7} roughness={0.3} />
        </Box>
      </group>
    );
  }

  // Washing Machine
  if (type === 'washing_machine') {
    return (
      <group>
        {/* Main Body */}
        <Box args={[w, h, d]} castShadow receiveShadow>
          <meshStandardMaterial color="#f1f5f9" metalness={0.6} roughness={0.3} />
        </Box>
        {/* Front Panel */}
        <Box args={[w - 0.02, h - 0.02, 0.02]} position={[0, 0, d / 2 - 0.01]} castShadow>
          <meshStandardMaterial color="#e2e8f0" metalness={0.7} roughness={0.2} />
        </Box>
        {/* Door (Circular) */}
        <Cylinder args={[w * 0.35, w * 0.35, 0.015, 32]} position={[0, -h * 0.15, d / 2 + 0.005]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
        </Cylinder>
        {/* Door Inner Ring */}
        <Torus args={[w * 0.3, 0.008, 8, 32]} position={[0, -h * 0.15, d / 2 + 0.015]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
        </Torus>
        {/* Control Panel */}
        <Box args={[w - 0.04, 0.08, 0.015]} position={[0, h / 2 - 0.05, d / 2 + 0.005]} castShadow>
          <meshStandardMaterial color="#cbd5e1" metalness={0.7} roughness={0.3} />
        </Box>
        {/* Display */}
        <Box args={[0.06, 0.025, 0.005]} position={[0, h / 2 - 0.05, d / 2 + 0.015]} castShadow>
          <meshStandardMaterial color="#0f172a" emissive="#3b82f6" emissiveIntensity={0.5} />
        </Box>
      </group>
    );
  }

  // Dryer
  if (type === 'dryer') {
    return (
      <group>
        {/* Main Body */}
        <Box args={[w, h, d]} castShadow receiveShadow>
          <meshStandardMaterial color="#f1f5f9" metalness={0.6} roughness={0.3} />
        </Box>
        {/* Front Panel */}
        <Box args={[w - 0.02, h - 0.02, 0.02]} position={[0, 0, d / 2 - 0.01]} castShadow>
          <meshStandardMaterial color="#e2e8f0" metalness={0.7} roughness={0.2} />
        </Box>
        {/* Door (Circular) */}
        <Cylinder args={[w * 0.35, w * 0.35, 0.015, 32]} position={[0, -h * 0.15, d / 2 + 0.005]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
        </Cylinder>
        {/* Lint Filter (visible at top of door) */}
        <Box args={[w * 0.5, 0.01, 0.02]} position={[0, h * 0.15, d / 2 + 0.005]} castShadow>
          <meshStandardMaterial color="#94a3b8" metalness={0.5} roughness={0.5} />
        </Box>
        {/* Control Panel */}
        <Box args={[w - 0.04, 0.08, 0.015]} position={[0, h / 2 - 0.05, d / 2 + 0.005]} castShadow>
          <meshStandardMaterial color="#cbd5e1" metalness={0.7} roughness={0.3} />
        </Box>
      </group>
    );
  }

  // Sink
  if (type === 'sink') {
    return (
      <group position={[0, h / 2 + 0.02, 0]}>
        {/* Sink Basin - Single Bowl */}
        <Box args={[w * 0.85, 0.15, d * 0.7]} position={[0, -0.05, 0]} castShadow>
          <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.2} />
        </Box>
        {/* Basin Inner (darker) */}
        <Box args={[w * 0.75, 0.12, d * 0.6]} position={[0, -0.08, 0]}>
          <meshStandardMaterial color="#64748b" metalness={0.5} roughness={0.5} />
        </Box>
        {/* Faucet Base */}
        <Cylinder args={[0.025, 0.03, 0.12, 16]} position={[0, 0.02, -d * 0.3]} castShadow>
          <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
        </Cylinder>
        {/* Faucet Pipe */}
        <Cylinder args={[0.012, 0.012, 0.18, 16]} position={[0, 0.12, -d * 0.2]} rotation={[0.3, 0, 0]} castShadow>
          <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
        </Cylinder>
        {/* Faucet Spout */}
        <Cylinder args={[0.015, 0.015, 0.08, 16]} position={[0, 0.2, -d * 0.12]} rotation={[0.8, 0, 0]} castShadow>
          <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
        </Cylinder>
      </group>
    );
  }

  return null;
};