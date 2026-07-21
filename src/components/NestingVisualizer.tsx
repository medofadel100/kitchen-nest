import React from 'react';
import { NestingSheetResult } from '@/types';
import { Layers } from 'lucide-react';
import { getPiecePolygonPoints } from '@/lib/pieceGeometry';

interface Props {
  sheet: NestingSheetResult;
}

export const NestingVisualizer = ({ sheet }: Props) => {
  const w = sheet.sheetSize.widthMm;
  const h = sheet.sheetSize.heightMm;
  const aspectRatio = h / w;

  return (
    <div className="w-full bg-zinc-950 border-2 border-zinc-700 rounded-xl overflow-hidden relative shadow-inner" style={{ paddingBottom: `${aspectRatio * 100}%` }}>
      <div className="absolute inset-0 bg-[#e6c287]/10" />

      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-zinc-500 font-mono font-bold">
        {w} mm
      </div>
      <div className="absolute top-1/2 -left-8 -translate-y-1/2 -rotate-90 text-xs text-zinc-500 font-mono font-bold">
        {h} mm
      </div>

      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        {sheet.placedPieces.map((piece, idx) => {
          const renderedWidth = piece.rotated ? piece.heightMm : piece.widthMm;
          const renderedHeight = piece.rotated ? piece.widthMm : piece.heightMm;

          const hash = piece.label.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const hue = 30 + (hash % 40);
          const fillColor = `hsl(${hue}, 60%, 40%)`;

          const notch = piece.notch;
          if (notch) {
            const polyW = renderedWidth;
            const polyH = renderedHeight;
            const points = getPiecePolygonPoints(polyW, polyH, notch)
              .map((p) => `${piece.xMm + p.x},${piece.yMm + p.y}`)
              .join(' ');
            return (
              <g key={`${piece.id}-${idx}`}>
                <polygon
                  points={points}
                  fill={fillColor}
                  stroke="rgba(0,0,0,0.3)"
                  strokeWidth="1"
                />
                <text
                  x={piece.xMm + polyW / 2}
                  y={piece.yMm + polyH / 2}
                  fill="white"
                  fontSize={Math.min(polyW, polyH) * 0.12}
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ pointerEvents: 'none' }}
                >
                  {piece.label.split(' - ')[1] || piece.label}
                </text>
              </g>
            );
          }

          return (
            <g key={`${piece.id}-${idx}`}>
              <rect
                x={piece.xMm}
                y={piece.yMm}
                width={renderedWidth}
                height={renderedHeight}
                fill={fillColor}
                stroke="rgba(0,0,0,0.3)"
                strokeWidth="1"
              />
              <text
                x={piece.xMm + renderedWidth / 2}
                y={piece.yMm + renderedHeight / 2}
                fill="white"
                fontSize={Math.min(renderedWidth, renderedHeight) * 0.12}
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ pointerEvents: 'none' }}
              >
                {piece.label.split(' - ')[1] || piece.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export const NestingVisualizerList = ({ sheets, materialName }: { sheets: NestingSheetResult[], materialName: string }) => {
  if (!sheets || sheets.length === 0) return null;

  return (
    <div className="space-y-8 bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
      <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
        <Layers className="text-amber-500" />
        خريطة تقطيع: {materialName}
        <span className="text-sm font-normal text-zinc-500 bg-zinc-800 px-3 py-1 rounded-full">
          الإجمالي: {sheets.length} ألواح
        </span>
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-16">
        {sheets.map((sheet, idx) => (
          <div key={idx} className="flex flex-col">
            <div className="flex justify-between items-end mb-4">
              <h4 className="font-bold text-zinc-300">اللوح رقم #{sheet.sheetIndex}</h4>
              <div className="flex gap-4 text-xs font-mono">
                <span className="text-emerald-400">استخدام: {Math.round(sheet.utilizationPercent)}%</span>
                <span className="text-red-400">هالك: {Math.round(100 - sheet.utilizationPercent)}%</span>
              </div>
            </div>
            
            <div className="relative pt-6 pl-8">
              <NestingVisualizer sheet={sheet} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
