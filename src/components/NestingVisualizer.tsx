import React from 'react';
import { NestingSheetResult } from '@/types';
import { Layers } from 'lucide-react';

interface Props {
  sheet: NestingSheetResult;
}

export const NestingVisualizer = ({ sheet }: Props) => {
  // We need to render the sheet proportionally.
  // Let's use a percentage-based approach for responsive scaling.
  
  const w = sheet.sheetSize.widthMm;
  const h = sheet.sheetSize.heightMm;

  // The container will scale to 100% width, maintaining the aspect ratio of the sheet.
  // aspect ratio = height / width
  const aspectRatio = h / w;

  return (
    <div className="w-full bg-zinc-950 border-2 border-zinc-700 rounded-xl overflow-hidden relative shadow-inner" style={{ paddingBottom: `${aspectRatio * 100}%` }}>
      {/* Background (Wood texture or plain color) */}
      <div className="absolute inset-0 bg-[#e6c287]/10" />

      {/* Rulers / Dimensions */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-zinc-500 font-mono font-bold">
        {w} mm
      </div>
      <div className="absolute top-1/2 -left-8 -translate-y-1/2 -rotate-90 text-xs text-zinc-500 font-mono font-bold">
        {h} mm
      </div>
      
      {/* Placed Pieces */}
      {sheet.placedPieces.map((piece, idx) => {
        // Calculate percentages based on the board size
        const leftPercent = (piece.xMm / w) * 100;
        const topPercent = (piece.yMm / h) * 100;
        
        // Note: if the piece was rotated during placement, the nesting algorithm 
        // usually swaps width/height of the piece. Wait, in PlacedPiece, the `rotated` flag is set.
        // If the algorithm swapped width/height in the `placedPiece` object itself before saving,
        // then piece.widthMm is already the *actual* rendered width. Let's assume piece dimensions are final rendered dimensions.
        // Let's check `nesting.ts` to be sure, but standard is that `piece.widthMm` represents the bounds.
        // Actually, we'll just use piece.widthMm and piece.heightMm directly as they are.
        
        // However, if the algorithm relies on the `rotated` flag to swap them at render time:
        const renderedWidth = piece.rotated ? piece.heightMm : piece.widthMm;
        const renderedHeight = piece.rotated ? piece.widthMm : piece.heightMm;

        const widthPercent = (renderedWidth / w) * 100;
        const heightPercent = (renderedHeight / h) * 100;

        // Generate a random-ish color based on the visualGroupId or label, or just use a nice amber.
        const hash = piece.label.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const hue = 30 + (hash % 40); // Wooden/Amber hues (30 to 70)
        
        return (
          <div 
            key={`${piece.id}-${idx}`}
            className="absolute border border-black/80 flex items-center justify-center overflow-hidden shadow-sm transition-transform hover:scale-[1.02] hover:z-10"
            style={{
              left: `${leftPercent}%`,
              top: `${topPercent}%`,
              width: `${widthPercent}%`,
              height: `${heightPercent}%`,
              backgroundColor: `hsl(${hue}, 60%, 40%)`,
            }}
            title={`${piece.label} (${renderedWidth}x${renderedHeight}mm)`}
          >
            {/* Grain Direction Indicator (if applicable, typically long side) */}
            <div className="absolute inset-0 opacity-10 bg-[url('/wood-grain.png')] bg-cover mix-blend-overlay pointer-events-none" 
                 style={{ transform: piece.rotated ? 'rotate(90deg)' : 'none' }} />
            
            <div className="flex flex-col items-center justify-center text-center p-0.5">
              <span className="text-[0.55rem] leading-tight md:text-xs font-bold text-white/90 drop-shadow-md truncate w-full px-1">
                {piece.label.split(' - ')[1] || piece.label}
              </span>
              {(widthPercent > 10 && heightPercent > 10) && (
                <span className="text-[0.45rem] md:text-[0.65rem] text-white/70 font-mono font-bold">
                  {renderedWidth}x{renderedHeight}
                </span>
              )}
            </div>
          </div>
        );
      })}
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
