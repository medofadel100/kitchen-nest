import React from 'react';
import { Box, Cylinder } from '@react-three/drei';

interface Appliance3DProps {
  type: 'fridge' | 'oven' | 'sink';
  width: number;
  height: number;
  depth: number;
}

export const Appliance3D: React.FC<Appliance3DProps> = ({ type, width: w, height: h, depth: d }) => {
  if (type === 'fridge') {
    return (
      <group>
        {/* Main Body */}
        <Box args={[w - 0.02, h - 0.02, d - 0.04]} position={[0, 0, -0.01]} castShadow receiveShadow>
          <meshStandardMaterial color="#e2e8f0" metalness={0.7} roughness={0.2} />
        </Box>
        {/* Top Door */}
        <Box args={[w, h * 0.65, 0.04]} position={[0, h * 0.175, d / 2 - 0.02]} castShadow>
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.15} />
        </Box>
        {/* Bottom Door */}
        <Box args={[w, h * 0.33, 0.04]} position={[0, -h * 0.325, d / 2 - 0.02]} castShadow>
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.15} />
        </Box>
        {/* Handles */}
        <Box args={[0.02, h * 0.4, 0.03]} position={[-w / 2 + 0.06, h * 0.1, d / 2 + 0.015]} castShadow>
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
        </Box>
        <Box args={[0.02, h * 0.2, 0.03]} position={[-w / 2 + 0.06, -h * 0.25, d / 2 + 0.015]} castShadow>
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
        </Box>
      </group>
    );
  }

  if (type === 'oven') {
    return (
      <group>
        {/* Oven Body Wrapper (Built-in) */}
        <Box args={[w, h, d]} castShadow receiveShadow>
          <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.5} />
        </Box>
        {/* Glass Front */}
        <Box args={[w - 0.04, h - 0.15, 0.02]} position={[0, -0.05, d / 2 + 0.01]} castShadow>
          <meshPhysicalMaterial color="#0f172a" metalness={0.9} roughness={0.1} transparent opacity={0.9} />
        </Box>
        {/* Inner Light / Grill (Visible through glass) */}
        <Box args={[w - 0.1, h - 0.2, 0.01]} position={[0, -0.05, d / 2 - 0.05]}>
          <meshBasicMaterial color="#f59e0b" />
        </Box>
        {/* Top Control Panel */}
        <Box args={[w - 0.04, 0.1, 0.02]} position={[0, h / 2 - 0.06, d / 2 + 0.01]} castShadow>
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
        </Box>
        {/* Knobs */}
        <Cylinder args={[0.02, 0.02, 0.02, 16]} position={[-w / 2 + 0.1, h / 2 - 0.06, d / 2 + 0.025]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
        </Cylinder>
        <Cylinder args={[0.02, 0.02, 0.02, 16]} position={[-w / 2 + 0.16, h / 2 - 0.06, d / 2 + 0.025]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
        </Cylinder>
        <Cylinder args={[0.02, 0.02, 0.02, 16]} position={[w / 2 - 0.1, h / 2 - 0.06, d / 2 + 0.025]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
        </Cylinder>
        {/* Handle */}
        <Box args={[w - 0.1, 0.02, 0.03]} position={[0, h / 2 - 0.15, d / 2 + 0.035]} castShadow>
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
        </Box>
      </group>
    );
  }

  if (type === 'sink') {
    return (
      <group position={[0, h / 2 + 0.02, 0]}>
        {/* Sink Basin */}
        <Box args={[w * 0.8, 0.01, d * 0.7]} position={[0, 0, 0]} castShadow>
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
        </Box>
        {/* Hole (Mocked with a dark inner box) */}
        <Box args={[w * 0.7, 0.2, d * 0.6]} position={[0, -0.1, 0]}>
          <meshStandardMaterial color="#64748b" metalness={0.5} roughness={0.5} />
        </Box>
        {/* Faucet Base */}
        <Cylinder args={[0.02, 0.02, 0.1, 16]} position={[0, 0.05, -d * 0.25]} castShadow>
          <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
        </Cylinder>
        {/* Faucet Pipe */}
        <Cylinder args={[0.01, 0.01, 0.15, 16]} position={[0, 0.1, -d * 0.15]} rotation={[Math.PI / 4, 0, 0]} castShadow>
          <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
        </Cylinder>
      </group>
    );
  }

  return null;
};
