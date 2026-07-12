"use client";

import { useThree } from "@react-three/fiber";
import { forwardRef, useImperativeHandle } from "react";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

export interface SceneExporterHandle {
  exportGLB: () => Promise<Blob>;
}

/**
 * كومبوننت داخلي تحت <Canvas> — بيستخدم useThree() للوصول للـ scene
 * ويعرض exportGLB() للخارج عن طريق ref
 * الاستخدام:
 *   const exporterRef = useRef<SceneExporterHandle>(null);
 *   // داخل Canvas: <SceneExporter ref={exporterRef} />
 *   // خارج: const blob = await exporterRef.current.exportGLB();
 */
export const SceneExporter = forwardRef<SceneExporterHandle>(function SceneExporter(_, ref) {
  const { scene } = useThree();

  useImperativeHandle(ref, () => ({
    exportGLB: (): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        const exporter = new GLTFExporter();
        exporter.parse(
          scene,
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
            binary: true,       // .glb مش .gltf
            trs: false,         // matrix decomposition
            onlyVisible: true,  // مش نصدّر الـ wireframes الخفية
            maxTextureSize: 1024,
          }
        );
      });
    },
  }));

  return null; // مش بيعمل render لأي حاجة — هدفه تمرير الـ ref بس
});
