"use client";

import React, { useEffect, useState, useRef } from 'react';
import { QrLabelsSheet } from '@/components/print/QrLabelsSheet';
import { KitchenProject, Material, NestingResult, CutPiece } from '@/types';

export default function QrLabelsPrintPage() {
  const [data, setData] = useState<{ pieces: CutPiece[]; materialsById: Record<string, Material> } | null>(null);
  const hasPrinted = useRef(false);

  useEffect(() => {
    if (hasPrinted.current) return;

    try {
      const nestingDetails: { material: Material; result: NestingResult; piecesCount: number }[] =
        JSON.parse(localStorage.getItem('print_nesting') || '[]');

      const allPieces: CutPiece[] = [];
      const materialsById: Record<string, Material> = {};

      nestingDetails.forEach((detail) => {
        materialsById[detail.material.id] = detail.material;
        detail.result.sheets.forEach((sheet) => {
          sheet.placedPieces.forEach((piece) => {
            allPieces.push(piece);
          });
        });
      });

      if (allPieces.length > 0) {
        setData({ pieces: allPieces, materialsById });
        hasPrinted.current = true;
        setTimeout(() => window.print(), 1000);
      }
    } catch (e) {
      console.error('Error loading QR print data:', e);
    }
  }, []);

  if (!data) {
    return <div className="p-8 text-center text-red-600">خطأ: لم يتم العثور على بيانات الطباعة. يرجى المحاولة مرة أخرى.</div>;
  }

  return <QrLabelsSheet pieces={data.pieces} materialsById={data.materialsById} />;
}
