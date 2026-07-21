import React from 'react';
import { KitchenProject, Material, NestingResult, PlacedPiece } from '@/types';
import { getPiecePolygonPoints, getPieceActualAreaMm2 } from '@/lib/pieceGeometry';

interface CuttingListPrintProps {
  project: KitchenProject;
  nestingDetails: { material: Material; result: NestingResult; piecesCount: number }[];
}

export const CuttingListPrint = ({ project, nestingDetails }: CuttingListPrintProps) => {
  return (
    <div className="w-full bg-white text-black font-sans min-h-screen" style={{ direction: 'rtl' }}>
      {nestingDetails.map((detail, mIdx) => (
        <React.Fragment key={mIdx}>
          {detail.result.sheets.map((sheet, sIdx) => {
            const sheetW = sheet.sheetSize.widthMm;
            const sheetH = sheet.sheetSize.heightMm;
            
            // Group identical pieces for the table
            const groupedPieces = sheet.placedPieces.reduce((acc, piece) => {
              // Group by size, label, and notch info
              const notchKey = piece.notch ? `_${piece.notch.cornerX}_${piece.notch.cornerY}_${piece.notch.notchWidthMm}x${piece.notch.notchDepthMm}` : '';
              const key = `${piece.widthMm}x${piece.heightMm}${notchKey}_${piece.label}`;
              if (!acc[key]) {
                acc[key] = { ...piece, count: 1 };
              } else {
                acc[key].count += 1;
              }
              return acc;
            }, {} as Record<string, PlacedPiece & { count: number }>);
            
            const partsList = Object.values(groupedPieces);
            // حساب المساحة الفعلية للقطع (مع النوتشات)
            const totalUsedAreaM2 = sheet.placedPieces.reduce((sum, p) => sum + getPieceActualAreaMm2(p.widthMm, p.heightMm, p.notch) / 1_000_000, 0);
            const totalAreaM2 = (sheetW * sheetH) / 1000000;
            const wasteAreaM2 = totalAreaM2 - totalUsedAreaM2;

            return (
              <div key={`${mIdx}-${sIdx}`} className="p-8 page-break-after-always" style={{ pageBreakAfter: 'always' }}>
                
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-zinc-300 pb-4 mb-6">
                  <div>
                      <h1 className="text-2xl font-black mb-1">لوح التقطيع (Cutting Sheet)</h1>
                      <p className="text-zinc-600 font-bold text-lg">{detail.material.nameAr}</p>
                      <p className="text-sm text-zinc-500">مشروع: {project.projectName}</p>
                      {/* Show sheet color info */}
                      <p className="text-sm text-zinc-500 mt-1 flex items-center gap-2">
                        <strong className="text-zinc-700">اللون:</strong>
                        {sheet.colorId && sheet.colorId !== 'default' ? (
                          (() => {
                            const colorObj = detail.material.availableColors?.find(c => c.id === sheet.colorId);
                            return (
                              <span className="inline-flex items-center gap-2">
                                <span className="inline-block h-4 w-8 rounded" style={{ backgroundColor: sheet.colorHex }} />
                                <span>{colorObj?.nameAr || sheet.colorId}</span>
                              </span>
                            );
                          })()
                        ) : (
                          <span className="inline-flex items-center gap-2">
                            <span className="inline-block h-4 w-8 rounded" style={{ backgroundColor: sheet.colorHex }} />
                            <span>افتراضي</span>
                          </span>
                        )}
                      </p>
                    </div>
                  <div className="text-left text-sm bg-zinc-100 p-3 rounded border border-zinc-200">
                    <p><strong>مقاس اللوح:</strong> {sheetW} × {sheetH} مم</p>
                    <p><strong>عدد القطع:</strong> {sheet.placedPieces.length} قطعة</p>
                    <p><strong>المساحة الفعلية:</strong> {totalUsedAreaM2.toFixed(2)} م² ({((totalUsedAreaM2 / totalAreaM2) * 100).toFixed(1)}%)</p>
                    <p><strong>المساحة المهدرة:</strong> {wasteAreaM2.toFixed(2)} م²</p>
                    <p><strong>ترتيب اللوح:</strong> {sIdx + 1} من {detail.result.sheets.length}</p>
                  </div>
                </div>

                {/* Parts Table */}
                <div className="mb-8">
                  <table className="w-full text-sm border-collapse border border-zinc-300 text-center">
                    <thead>
                      <tr className="bg-zinc-200">
                        <th className="border border-zinc-300 p-1.5">العدد</th>
                        <th className="border border-zinc-300 p-1.5">القطعة (Label)</th>
                        <th className="border border-zinc-300 p-1.5">العرض (مم)</th>
                        <th className="border border-zinc-300 p-1.5">الطول (مم)</th>
                        <th className="border border-zinc-300 p-1.5">المساحة الفعلية</th>
                        <th className="border border-zinc-300 p-1.5">شريط الحرف</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partsList.map((part, pIdx) => {
                        const actualArea = getPieceActualAreaMm2(part.widthMm, part.heightMm, part.notch);
                        const hasNotch = !!part.notch;
                        return (
                          <tr key={pIdx} className={hasNotch ? 'bg-amber-50' : ''}>
                            <td className="border border-zinc-300 p-1.5 font-bold">{part.count}</td>
                            <td className="border border-zinc-300 p-1.5 text-right px-3">
                              {part.label}
                              {hasNotch && (
                                <span className="block text-xs text-amber-600 font-bold mt-0.5">
                                  ← فيها فتحة عمود (L-shape)
                                </span>
                              )}
                            </td>
                            <td className="border border-zinc-300 p-1.5 font-mono font-bold">{part.widthMm}</td>
                            <td className="border border-zinc-300 p-1.5 font-mono font-bold">{part.heightMm}</td>
                            <td className="border border-zinc-300 p-1.5 font-mono font-bold text-blue-600">
                              {actualArea.toFixed(0)} مم²
                              {hasNotch && (
                                <span className="block text-xs text-amber-600">
                                  (مخصوم منها {(part.widthMm * part.heightMm - actualArea).toFixed(0)} мм²)
                                </span>
                              )}
                            </td>
                            <td className="border border-zinc-300 p-1.5 text-xs text-red-600">
                              {part.edgesToBind && part.edgesToBind.length > 0 ? part.edgesToBind.join(', ') : 'بدون'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* SVG Visual Nesting */}
                <div className="w-full relative mt-4">
                  {/* We use viewBox so it scales perfectly, maintaining aspect ratio. 
                      We add 100 to width/height for margins to draw dimension lines. */}
                  <svg 
                    viewBox={`-50 -50 ${sheetW + 100} ${sheetH + 100}`} 
                    className="w-full max-h-[600px] bg-white drop-shadow-sm"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <pattern id={`pattern-wood-${mIdx}-${sIdx}`} patternUnits="userSpaceOnUse" width="400" height="400">
                        <rect width="400" height="400" fill="#f8eedc" />
                        <path d="M0 0l400 400M400 0L0 400" stroke="#f0e2ca" strokeWidth="1" fill="none" opacity="0.5"/>
                      </pattern>
                    </defs>

                    {/* Board background */}
                    <rect 
                      x="0" 
                      y="0" 
                      width={sheetW} 
                      height={sheetH} 
                      fill={`url(#pattern-wood-${mIdx}-${sIdx})`}
                      stroke="#8B5A2B" 
                      strokeWidth="4" 
                    />

                    {/* Dimension Line - Top (Width) */}
                    <line x1="0" y1="-20" x2={sheetW} y2="-20" stroke="black" strokeWidth="2" />
                    <line x1="0" y1="-30" x2="0" y2="-10" stroke="black" strokeWidth="2" />
                    <line x1={sheetW} y1="-30" x2={sheetW} y2="-10" stroke="black" strokeWidth="2" />
                    <text x={sheetW / 2} y="-30" fill="black" fontSize="40" fontWeight="bold" textAnchor="middle">{sheetW} mm</text>

                    {/* Dimension Line - Right (Height) */}
                    <line x1={sheetW + 20} y1="0" x2={sheetW + 20} y2={sheetH} stroke="black" strokeWidth="2" />
                    <line x1={sheetW + 10} y1="0" x2={sheetW + 30} y2="0" stroke="black" strokeWidth="2" />
                    <line x1={sheetW + 10} y1={sheetH} x2={sheetW + 30} y2={sheetH} stroke="black" strokeWidth="2" />
                    <text 
                      x={sheetW + 40} 
                      y={sheetH / 2} 
                      fill="black" 
                      fontSize="40" 
                      fontWeight="bold" 
                      textAnchor="middle" 
                      transform={`rotate(90 ${sheetW + 40} ${sheetH / 2})`}
                    >
                      {sheetH} mm
                    </text>

                    {/* Placed Pieces */}
                    {sheet.placedPieces.map((piece, pIdx) => {
                      const w = piece.rotated ? piece.heightMm : piece.widthMm;
                      const h = piece.rotated ? piece.widthMm : piece.heightMm;
                      
                      // Calculate center for text placement
                      const cx = piece.xMm + (w / 2);
                      const cy = piece.yMm + (h / 2);

                      // Text should always flow along the longest dimension
                      const textRotated = h > w;
                      const maxW = textRotated ? h : w;
                      const maxH = textRotated ? w : h;

                      // Approximate text length based on label and dimensions strings
                      const longestStringLength = Math.max(piece.label.length, 12);
                      
                      // Calculate maximum font size that fits both width and height
                      const calculatedFontSize = Math.min(
                        maxW / (0.55 * longestStringLength), 
                        maxH / 2.5
                      );

                      const finalFontSize = Math.max(12, Math.min(calculatedFontSize, 100));
                      const lineSpacing = finalFontSize * 1.2;
                      const textTransform = textRotated ? `rotate(-90 ${cx} ${cy})` : '';

                      const notch = piece.notch;
                      const hasNotch = !!notch;

                      // Default: rect
                      let pieceShape: React.ReactNode = (
                        <rect
                          x={piece.xMm}
                          y={piece.yMm}
                          width={w}
                          height={h}
                          fill="white"
                          stroke="#1f2937"
                          strokeWidth="2"
                          opacity="0.9"
                        />
                      );

                      if (hasNotch) {
                        const polyW = piece.rotated ? piece.heightMm : piece.widthMm;
                        const polyH = piece.rotated ? piece.widthMm : piece.heightMm;
                        const points = getPiecePolygonPoints(polyW, polyH, notch)
                          .map((p) => `${piece.xMm + p.x},${piece.yMm + p.y}`)
                          .join(' ');

                        pieceShape = (
                          <polygon
                            points={points}
                            fill="white"
                            stroke="#1f2937"
                            strokeWidth="2"
                            opacity="0.9"
                          />
                        );
                      }

                      return (
                        <g key={pIdx}>
                          {pieceShape}

                          {/* Inner Label Group */}
                          <g transform={textTransform}>
                            <text 
                              x={cx} 
                              y={cy - (lineSpacing / 2.2)} 
                              fill="#1f2937" 
                              fontSize={finalFontSize} 
                              fontWeight="900" 
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="font-sans"
                            >
                              {piece.label}
                            </text>
                            <text 
                              x={cx} 
                              y={cy + (lineSpacing / 2.2)} 
                              fill="#4b5563" 
                              fontSize={finalFontSize * 0.9} 
                              fontWeight="900" 
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="font-mono tracking-wider"
                            >
                              {piece.widthMm} x {piece.heightMm}
                            </text>
                          </g>
                        </g>
                      );
                    })}

                  </svg>
                </div>
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
};
