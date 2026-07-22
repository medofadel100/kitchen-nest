"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { CutPiece, Material } from "@/types";

interface QrPieceLabelProps {
  piece: CutPiece;
  material?: Material;
}

export const QrPieceLabel = ({ piece, material }: QrPieceLabelProps) => {
  const [qrSvg, setQrSvg] = useState<string>("");

  useEffect(() => {
    const payload = `KN-${piece.id}-${piece.materialId}-${piece.widthMm}x${piece.heightMm}`;
    QRCode.toString(payload, { type: "svg", width: 160, margin: 1 }, (err, svg) => {
      if (!err) setQrSvg(svg);
    });
  }, [piece]);

  return (
    <div
      className="flex flex-col items-center justify-between border border-zinc-300 rounded-lg bg-white text-black p-2"
      style={{ width: "60mm", height: "80mm", direction: "rtl" }}
    >
      <div className="flex-1 flex items-center justify-center w-full">
        {qrSvg ? (
          <div dangerouslySetInnerHTML={{ __html: qrSvg }} className="w-[50mm] h-[50mm] flex items-center justify-center" />
        ) : (
          <div className="w-[50mm] h-[50mm] bg-zinc-100 animate-pulse rounded" />
        )}
      </div>
      <div className="w-full text-center border-t border-zinc-200 pt-1 mt-1">
        <p className="text-xs font-bold leading-tight truncate">{piece.label}</p>
        <p className="text-[10px] font-mono text-zinc-600">
          {piece.widthMm} × {piece.heightMm} مم
        </p>
        {material && (
          <p className="text-[10px] text-zinc-500 truncate">{material.nameAr}</p>
        )}
      </div>
    </div>
  );
};
