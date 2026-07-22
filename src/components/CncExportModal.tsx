import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  X,
  Layers,
  ChevronDown,
  FileText,
  AlertCircle,
} from "lucide-react";
import {
  CutPiece,
  Material,
} from "@/types";
import {
  generateCutListDxf,
  downloadDxf,
  PieceForExport,
} from "@/lib/dxfExporter";

interface CncExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  pieces: CutPiece[];
  materialsById: Record<string, Material>;
}

const CncExportModal: React.FC<CncExportModalProps> = ({
  isOpen,
  onClose,
  pieces,
  materialsById,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const groupedByMaterial = useMemo(() => {
    const map = new Map<string, CutPiece[]>();
    for (const piece of pieces) {
      const list = map.get(piece.materialId) || [];
      list.push(piece);
      map.set(piece.materialId, list);
    }
    return map;
  }, [pieces]);

  const materialEntries = useMemo(
    () =>
      Array.from(groupedByMaterial.entries()).map(([materialId, matPieces]) => ({
        materialId,
        material: materialsById[materialId],
        pieces: matPieces,
        totalAreaM2:
          matPieces.reduce(
            (sum, p) => sum + (p.widthMm * p.heightMm) / 1_000_000,
            0
          ),
        sheetCount: calcSheetCount(matPieces, materialsById[materialId]),
      })),
    [groupedByMaterial, materialsById]
  );

  const exportAll = () => {
    setExporting(true);
    try {
      for (const entry of materialEntries) {
        const sheetW = entry.material?.standardSheet.widthMm ?? 2440;
        const sheetH = entry.material?.standardSheet.heightMm ?? 1220;
        const matName = entry.material?.nameAr ?? entry.materialId;
        const dxfPieces: PieceForExport[] = entry.pieces.map((p) => ({
          id: p.id,
          name: p.label,
          widthMm: p.widthMm,
          heightMm: p.heightMm,
        }));

        const blob = generateCutListDxf(dxfPieces, sheetW, sheetH, matName);
        downloadDxf(blob, `CNC_${matName.replace(/\s+/g, "_")}_${Date.now()}.dxf`);
      }
    } finally {
      setExporting(false);
      setDropdownOpen(false);
    }
  };

  const exportSingleMaterial = (entry: (typeof materialEntries)[0]) => {
    setExporting(true);
    try {
      const sheetW = entry.material?.standardSheet.widthMm ?? 2440;
      const sheetH = entry.material?.standardSheet.heightMm ?? 1220;
      const matName = entry.material?.nameAr ?? entry.materialId;
      const dxfPieces: PieceForExport[] = entry.pieces.map((p) => ({
        id: p.id,
        name: p.label,
        widthMm: p.widthMm,
        heightMm: p.heightMm,
      }));

      const blob = generateCutListDxf(dxfPieces, sheetW, sheetH, matName);
      downloadDxf(blob, `CNC_${matName.replace(/\s+/g, "_")}_${Date.now()}.dxf`);
    } finally {
      setExporting(false);
      setDropdownOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      dir="rtl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <Layers className="text-emerald-400" size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">
                تصدير DXF للـ CNC
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                تخطيط القطع على ألواح {materialEntries[0]?.material?.standardSheet.widthMm ?? 2440}×{materialEntries[0]?.material?.standardSheet.heightMm ?? 1220} مم
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
          >
            <X size={18} className="text-zinc-400" />
          </button>
        </div>

        {/* Summary bar */}
        <div className="flex items-center gap-4 bg-zinc-950/60 border border-zinc-800/60 rounded-2xl px-5 py-3 mb-5">
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-zinc-500" />
            <span className="text-sm text-zinc-400">
              <span className="text-white font-bold">{pieces.length}</span> قطعة
            </span>
          </div>
          <div className="w-px h-4 bg-zinc-800" />
          <div className="flex items-center gap-2">
            <Layers size={15} className="text-zinc-500" />
            <span className="text-sm text-zinc-400">
              <span className="text-white font-bold">{materialEntries.length}</span> خامة
            </span>
          </div>
          <div className="w-px h-4 bg-zinc-800" />
          <div className="text-sm text-zinc-400">
            <span className="text-white font-bold">
              {materialEntries.reduce((s, e) => s + e.sheetCount, 0)}
            </span>{" "}
            لوح مطلوب
          </div>
        </div>

        {/* Pieces grouped by material */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {materialEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
              <AlertCircle size={36} className="mb-3 opacity-50" />
              <p className="text-sm">لا توجد قطع للتصدير</p>
            </div>
          ) : (
            materialEntries.map((entry) => (
              <div
                key={entry.materialId}
                className="bg-zinc-950/50 border border-zinc-800/50 rounded-2xl overflow-hidden"
              >
                {/* Material header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800/50 bg-zinc-800/20">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full border border-zinc-700"
                      style={{
                        backgroundColor:
                          entry.material?.colorHex || "#71717a",
                      }}
                    />
                    <span className="text-sm font-bold text-white">
                      {entry.material?.nameAr ?? entry.materialId}
                    </span>
                    <span className="text-xs text-zinc-500 bg-zinc-800/60 px-2 py-0.5 rounded-lg">
                      {entry.material?.standardSheet.thicknessMm ?? "—"}مم
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span>
                      {entry.pieces.length} قطعة
                    </span>
                    <span>•</span>
                    <span>{entry.sheetCount} لوح</span>
                    <span>•</span>
                    <span>{entry.totalAreaM2.toFixed(2)} م²</span>
                  </div>
                </div>

                {/* Pieces table */}
                <div className="divide-y divide-zinc-800/30">
                  {entry.pieces.map((piece) => (
                    <div
                      key={piece.id}
                      className="flex items-center justify-between px-5 py-2.5 hover:bg-zinc-800/20 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 shrink-0" />
                        <span className="text-sm text-zinc-300 truncate">
                          {piece.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-xs text-zinc-500 bg-zinc-800/40 px-2 py-0.5 rounded-md font-mono">
                          {piece.widthMm}×{piece.heightMm}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Export single material button */}
                <div className="px-5 py-3 border-t border-zinc-800/30">
                  <button
                    onClick={() => exportSingleMaterial(entry)}
                    disabled={exporting}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition-colors disabled:opacity-40"
                  >
                    تصدير {entry.material?.nameAr ?? "هذه الخامة"} كملف DXF
                    منفصل ←
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Export buttons */}
        {materialEntries.length > 0 && (
          <div className="flex gap-3 mt-5 pt-5 border-t border-zinc-800/50">
            <div className="relative flex-1">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                disabled={exporting}
                className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-50"
              >
                <Download size={18} />
                تصدير حسب الخامة
                <ChevronDown
                  size={16}
                  className={`transition-transform ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute bottom-full mb-2 left-0 right-0 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden shadow-xl z-10"
                  >
                    {materialEntries.map((entry) => (
                      <button
                        key={entry.materialId}
                        onClick={() => exportSingleMaterial(entry)}
                        className="w-full flex items-center justify-between px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors text-right"
                      >
                        <span>{entry.material?.nameAr ?? entry.materialId}</span>
                        <span className="text-xs text-zinc-500">
                          {entry.sheetCount} لوح
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={exportAll}
              disabled={exporting}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 py-3 rounded-xl font-bold transition-colors disabled:opacity-50"
            >
              <Download size={18} />
              {exporting ? "جاري التصدير..." : "تصدير الكل"}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

function calcSheetCount(pieces: CutPiece[], material?: Material): number {
  if (pieces.length === 0) return 0;
  const sheetW = material?.standardSheet.widthMm ?? 2440;
  const sheetH = material?.standardSheet.heightMm ?? 1220;
  const sheetArea = (sheetW * sheetH) / 1_000_000;
  const totalArea = pieces.reduce(
    (sum, p) => sum + (p.widthMm * p.heightMm) / 1_000_000,
    0
  );
  return Math.ceil(totalArea / (sheetArea * 0.85));
}

export default CncExportModal;
