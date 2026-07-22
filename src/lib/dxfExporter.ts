// ============================================================
// DXF Exporter — AutoCAD R12/LT2 (AC1009) compatible
// Works with: AutoCAD, CorelDRAW, RDWorks, LightBurn, LibreCAD
// Units: millimeters
// ============================================================

export type DxfLayer = "OUTLINE" | "CUT" | "TEXT" | "DIMENSION";

interface DxfPoint {
  x: number;
  y: number;
}

class DxfWriter {
  private lines: string[] = [];
  private layerNames: Set<string> = new Set();

  private readonly LAYER_COLORS: Record<DxfLayer, number> = {
    OUTLINE: 7,  // white
    CUT: 1,      // red
    TEXT: 3,     // green
    DIMENSION: 5, // blue
  };

  private emit(code: number, value: string | number): void {
    this.lines.push(String(code));
    this.lines.push(String(value));
  }

  addLine(
    x1: number, y1: number,
    x2: number, y2: number,
    layer: DxfLayer = "OUTLINE"
  ): void {
    this.layerNames.add(layer);
    this.emit(0, "LINE");
    this.emit(8, layer);
    this.emit(10, x1);
    this.emit(20, y1);
    this.emit(30, 0);
    this.emit(11, x2);
    this.emit(21, y2);
    this.emit(31, 0);
  }

  addLwPolyline(
    points: DxfPoint[],
    closed: boolean = false,
    layer: DxfLayer = "OUTLINE"
  ): void {
    if (points.length < 2) return;
    this.layerNames.add(layer);

    this.emit(0, "LWPOLYLINE");
    this.emit(8, layer);
    this.emit(90, points.length);
    this.emit(70, closed ? 1 : 0);

    for (const pt of points) {
      this.emit(10, pt.x);
      this.emit(20, pt.y);
    }
  }

  addText(
    text: string,
    x: number, y: number,
    height: number = 3,
    layer: DxfLayer = "TEXT"
  ): void {
    this.layerNames.add(layer);
    this.emit(0, "TEXT");
    this.emit(8, layer);
    this.emit(10, x);
    this.emit(20, y);
    this.emit(30, 0);
    this.emit(40, height);
    this.emit(1, text);
    this.emit(72, 0);
  }

  addCircle(
    cx: number, cy: number, radius: number,
    layer: DxfLayer = "CUT"
  ): void {
    this.layerNames.add(layer);
    this.emit(0, "CIRCLE");
    this.emit(8, layer);
    this.emit(10, cx);
    this.emit(20, cy);
    this.emit(30, 0);
    this.emit(40, radius);
  }

  addRectangle(
    x: number, y: number,
    w: number, h: number,
    layer: DxfLayer = "OUTLINE"
  ): void {
    const pts: DxfPoint[] = [
      { x, y },
      { x: x + w, y },
      { x: x + w, y: y + h },
      { x, y: y + h },
    ];
    this.addLwPolyline(pts, true, layer);
  }

  addDimension(
    x1: number, y1: number,
    x2: number, y2: number,
    text: string,
    offset: number = 5,
    layer: DxfLayer = "DIMENSION"
  ): void {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;

    const nx = -dy / len;
    const ny = dx / len;
    const ox = midX + nx * offset;
    const oy = midY + ny * offset;

    this.addLine(x1, y1, x1 + nx * offset, y1 + ny * offset, layer);
    this.addLine(x2, y2, x2 + nx * offset, y2 + ny * offset, layer);
    this.addLine(
      x1 + nx * offset, y1 + ny * offset,
      x2 + nx * offset, y2 + ny * offset,
      layer
    );
    this.addText(text, ox - len / 4, oy + 2, 2.5, layer);
  }

  build(): string {
    const out: string[] = [];

    // --- HEADER SECTION ---
    out.push("0", "SECTION");
    out.push("2", "HEADER");
    out.push("9", "$ACADVER");
    out.push("1", "AC1009");
    out.push("9", "$INSUNITS");
    out.push("70", "4");      // 4 = millimeters
    out.push("9", "$MEASUREMENT");
    out.push("70", "1");      // 1 = metric
    out.push("0", "ENDSEC");

    // --- TABLES SECTION ---
    out.push("0", "SECTION");
    out.push("2", "TABLES");

    // LAYER table
    out.push("0", "TABLE");
    out.push("2", "LAYER");
    out.push("70", String(this.layerNames.size));

    for (const name of this.layerNames) {
      const color = (this.LAYER_COLORS as Record<string, number>)[name] || 7;
      out.push("0", "LAYER");
      out.push("2", name);
      out.push("70", "0");
      out.push("62", String(color));
      out.push("6", "CONTINUOUS");
    }

    out.push("0", "ENDTAB");
    out.push("0", "ENDSEC");

    // --- ENTITIES SECTION ---
    out.push("0", "SECTION");
    out.push("2", "ENTITIES");

    for (const entityLine of this.lines) {
      out.push(entityLine);
    }

    out.push("0", "ENDSEC");

    // --- EOF ---
    out.push("0", "EOF");

    return out.join("\r\n");
  }

  toBlob(): Blob {
    const content = this.build();
    // Use TextEncoder for consistent byte output
    const encoder = new TextEncoder();
    const bytes = encoder.encode(content);
    return new Blob([bytes], { type: "application/dxf" });
  }

  reset(): void {
    this.lines = [];
    this.layerNames.clear();
  }
}

// ============================================================
// Sheet Nesting — Bottom-left bin packing
// ============================================================

interface SheetPiece {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
}

interface PackedPiece extends SheetPiece {
  x: number;
  y: number;
  rotated: boolean;
}

interface PackedSheet {
  pieces: PackedPiece[];
}

function bottomLeftPack(
  pieces: SheetPiece[],
  sheetW: number,
  sheetH: number
): PackedSheet[] {
  const sheets: PackedSheet[] = [];

  const sorted = [...pieces].sort(
    (a, b) => Math.max(b.widthMm, b.heightMm) - Math.max(a.widthMm, a.heightMm)
  );

  interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
  }

  for (const piece of sorted) {
    let placed = false;

    for (const sheet of sheets) {
      const occupied: Rect[] = sheet.pieces.map((p) => ({
        x: p.x,
        y: p.y,
        w: p.rotated ? p.heightMm : p.widthMm,
        h: p.rotated ? p.widthMm : p.heightMm,
      }));

      const positions = generateCandidatePositions(occupied, sheetW, sheetH);

      for (const pos of positions) {
        const pw = piece.widthMm;
        const ph = piece.heightMm;

        if (pw <= sheetW - pos.x && ph <= sheetH - pos.y) {
          if (!collides(pos.x, pos.y, pw, ph, occupied)) {
            sheet.pieces.push({ ...piece, x: pos.x, y: pos.y, rotated: false });
            placed = true;
            break;
          }
        }

        const pw2 = piece.heightMm;
        const ph2 = piece.widthMm;
        if (pw2 <= sheetW - pos.x && ph2 <= sheetH - pos.y) {
          if (!collides(pos.x, pos.y, pw2, ph2, occupied)) {
            sheet.pieces.push({ ...piece, x: pos.x, y: pos.y, rotated: true });
            placed = true;
            break;
          }
        }
      }

      if (placed) break;
    }

    if (!placed) {
      const newSheet: PackedSheet = { pieces: [] };
      if (piece.widthMm <= sheetW && piece.heightMm <= sheetH) {
        newSheet.pieces.push({ ...piece, x: 0, y: 0, rotated: false });
      } else if (piece.heightMm <= sheetW && piece.widthMm <= sheetH) {
        newSheet.pieces.push({ ...piece, x: 0, y: 0, rotated: true });
      }
      sheets.push(newSheet);
    }
  }

  return sheets;
}

function generateCandidatePositions(
  occupied: { x: number; y: number; w: number; h: number }[],
  sheetW: number,
  sheetH: number
): { x: number; y: number }[] {
  const candidates = new Set<string>();
  const results: { x: number; y: number }[] = [];

  candidates.add("0,0");
  results.push({ x: 0, y: 0 });

  for (const r of occupied) {
    const pts = [
      { x: r.x + r.w, y: r.y },
      { x: r.x, y: r.y + r.h },
      { x: r.x + r.w, y: r.y + r.h },
    ];
    for (const p of pts) {
      if (p.x < sheetW && p.y < sheetH) {
        const key = `${p.x},${p.y}`;
        if (!candidates.has(key)) {
          candidates.add(key);
          results.push(p);
        }
      }
    }
  }

  return results;
}

function collides(
  x: number, y: number, w: number, h: number,
  occupied: { x: number; y: number; w: number; h: number }[]
): boolean {
  for (const r of occupied) {
    if (x < r.x + r.w && x + w > r.x && y < r.y + r.h && y + h > r.y) {
      return true;
    }
  }
  return false;
}

// ============================================================
// DXF Generation for Cut Pieces
// ============================================================

interface CutPieceInput {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
}

const SHEET_GAP_MM = 10;
const LABEL_MARGIN = 5;

function generateDxfForPieces(
  pieces: CutPieceInput[],
  sheetWidth: number,
  sheetHeight: number,
  _title?: string
): DxfWriter {
  const writer = new DxfWriter();

  const packed = bottomLeftPack(pieces, sheetWidth, sheetHeight);

  for (let si = 0; si < packed.length; si++) {
    const sheet = packed[si];
    const sheetOffsetX = si * (sheetWidth + SHEET_GAP_MM);

    // Sheet border
    writer.addRectangle(sheetOffsetX, 0, sheetWidth, sheetHeight, "OUTLINE");

    // Sheet label
    if (packed.length > 1) {
      writer.addText(
        `Sheet ${si + 1}`,
        sheetOffsetX + LABEL_MARGIN,
        sheetHeight - 10,
        5,
        "TEXT"
      );
    }

    for (const p of sheet.pieces) {
      const px = sheetOffsetX + p.x;
      const py = p.y;
      const pw = p.rotated ? p.heightMm : p.widthMm;
      const ph = p.rotated ? p.widthMm : p.heightMm;

      // Cut outline (red — CNC cut path)
      writer.addRectangle(px, py, pw, ph, "CUT");

      // Piece name label
      const fontSize = Math.min(pw / 8, ph / 4, 8);
      const labelFontSize = Math.max(fontSize, 3);

      writer.addText(
        p.name,
        px + LABEL_MARGIN,
        py + ph / 2 + labelFontSize / 2,
        labelFontSize,
        "TEXT"
      );

      // Dimensions label
      const dimText = `${p.widthMm.toFixed(0)}x${p.heightMm.toFixed(0)}`;
      const dimFontSize = Math.max(labelFontSize * 0.7, 2.5);
      writer.addText(
        dimText,
        px + LABEL_MARGIN,
        py + ph / 2 - dimFontSize * 1.2,
        dimFontSize,
        "TEXT"
      );

      // Width dimension line (top)
      writer.addDimension(
        px, py + ph,
        px + pw, py + ph,
        `${pw.toFixed(0)}`,
        8,
        "DIMENSION"
      );

      // Height dimension line (right side)
      writer.addDimension(
        px + pw, py,
        px + pw, py + ph,
        `${ph.toFixed(0)}`,
        8,
        "DIMENSION"
      );
    }
  }

  return writer;
}

// ============================================================
// Public API
// ============================================================

export interface PieceForExport {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
}

export function generateCutListDxf(
  pieces: PieceForExport[],
  sheetWidthMm: number = 2440,
  sheetHeightMm: number = 1220,
  title?: string
): Blob {
  const writer = generateDxfForPieces(pieces, sheetWidthMm, sheetHeightMm, title);
  return writer.toBlob();
}

export function downloadDxf(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".dxf") ? filename : `${filename}.dxf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export { DxfWriter, bottomLeftPack };
