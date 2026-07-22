"use client";

import React from "react";
import { CutPiece, Material } from "@/types";
import { QrPieceLabel } from "../QrPieceLabel";
import { Printer } from "lucide-react";

interface QrLabelsSheetProps {
  pieces: CutPiece[];
  materialsById: Record<string, Material>;
}

export const QrLabelsSheet = ({ pieces, materialsById }: QrLabelsSheetProps) => {
  const handlePrint = () => window.print();

  return (
    <div className="bg-zinc-950 text-white min-h-screen p-6">
      <button
        onClick={handlePrint}
        className="no-print mb-4 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold transition-colors"
      >
        <Printer size={18} />
        طباعة الملصقات
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 print:gap-2 print:bg-white">
        {pieces.map((piece) => (
          <QrPieceLabel
            key={piece.id}
            piece={piece}
            material={materialsById[piece.materialId]}
          />
        ))}
      </div>

      {pieces.length === 0 && (
        <p className="text-zinc-500 text-center mt-12">لا توجد قطع لطباعة ملصقاتها.</p>
      )}
    </div>
  );
};
