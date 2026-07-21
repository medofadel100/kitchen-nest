"use client";

import { useThree } from "@react-three/fiber";
import { forwardRef, useImperativeHandle } from "react";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import * as THREE from "three";

export interface SceneExporterHandle {
  exportGLB: (unitsOnly?: boolean) => Promise<Blob>;
}

const SKIP_TYPES = new Set([
  "GridHelper",
  "LineSegments",
  "Line",
  "Points",
]);

function shouldSkipObject(obj: THREE.Object3D): boolean {
  if (SKIP_TYPES.has(obj.type)) return true;
  if (obj instanceof THREE.Light) return true;
  if (obj instanceof THREE.Camera) return true;
  if (obj instanceof THREE.Audio) return true;
  if ((obj as any).isGrid) return true;
  const name = (obj.name || "").toLowerCase();
  if (name.startsWith("grid") || name === "orbitcontrols") return true;
  return false;
}

function cloneSceneUnitsOnly(scene: THREE.Scene): THREE.Scene {
  const clone = new THREE.Scene();
  clone.background = new THREE.Color("#18181b");

  scene.traverse((child) => {
    if (
      child.userData?.type === "unit" ||
      child.userData?.type === "obstacle"
    ) {
      const cloned = child.clone(true);
      clone.add(cloned);
    }
  });

  // If nothing was tagged, fall back to cloning everything non-skip
  if (clone.children.length === 0) {
    scene.traverse((child) => {
      if (child === scene) return;
      if (child instanceof THREE.Mesh || child instanceof THREE.Group) {
        if (!shouldSkipObject(child)) {
          clone.add(child.clone(true));
        }
      }
    });
  }

  return clone;
}

function cloneSceneClean(scene: THREE.Scene): THREE.Scene {
  const clone = new THREE.Scene();
  clone.background = new THREE.Color("#18181b");

  scene.children.forEach((child) => {
    if (!shouldSkipObject(child)) {
      clone.add(child.clone(true));
    }
  });

  return clone;
}

export const SceneExporter = forwardRef<SceneExporterHandle>(function SceneExporter(_, ref) {
  const { scene } = useThree();

  useImperativeHandle(ref, () => ({
    exportGLB: (unitsOnly = false): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        try {
          const exportScene = unitsOnly
            ? cloneSceneUnitsOnly(scene)
            : cloneSceneClean(scene);

          const exporter = new GLTFExporter();
          exporter.parse(
            exportScene,
            (result) => {
              const blob = new Blob([result as ArrayBuffer], {
                type: "model/gltf-binary",
              });
              resolve(blob);
            },
            (error) => {
              console.error("GLTFExporter error:", error);
              reject(error);
            },
            {
              binary: true,
              trs: false,
              onlyVisible: true,
              maxTextureSize: 1024,
            }
          );
        } catch (err) {
          console.error("GLB export setup error:", err);
          reject(err);
        }
      });
    },
  }));

  return null;
});
