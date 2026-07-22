import assert from "node:assert/strict";
import { DEFAULT_MATERIALS } from "../src/data/materials";
import { KitchenProject, KitchenUnit } from "../src/types";
import { calculateProjectCost } from "../src/lib/pricing";
import { projectToCutPiecesByMaterial } from "../src/lib/cuttingList";
import { nestPiecesForMaterial } from "../src/lib/nesting";
import { checkUnitCollision, findSmartUnitPlacement, isUnitInsideRoom } from "../src/utils/geometry";

const verifyPlacementAvoidsRoomObstacles = () => {
  const room = {
    id: "room-obstacles",
    name: "Room with column",
    widthMm: 3000,
    lengthMm: 3000,
    heightMm: 2800,
    polygonMm: [],
    fixtures: [],
    obstacles: [{ id: "col1", type: "column" as const, xMm: 600, yMm: 0, widthMm: 600, depthMm: 600 }],
  };

  const existingUnit: KitchenUnit = {
    id: "existing",
    type: "base",
    position: { xMm: 0, yMm: 600, rotationDeg: 0 },
    dimensions: { widthMm: 600, depthMm: 600, heightMm: 850 },
    materialId: "mdf_18_moisture_resistant",
    doorCount: 1,
    drawerCount: 0,
  };

  const newUnit: KitchenUnit = {
    id: "new",
    type: "base",
    position: { xMm: 0, yMm: 0, rotationDeg: 0 },
    dimensions: { widthMm: 600, depthMm: 600, heightMm: 850 },
    materialId: "mdf_18_moisture_resistant",
    doorCount: 1,
    drawerCount: 0,
  };

  const placement = findSmartUnitPlacement(newUnit, room as any, [existingUnit], 0, 0, 50, 80);

  assert.ok(isUnitInsideRoom(newUnit, placement.xMm, placement.yMm, room as any), "Placement should stay inside the room");
  assert.equal(checkUnitCollision(newUnit, [existingUnit], placement.xMm, placement.yMm), false, "Placement should avoid overlapping existing units");
  assert.equal(placement.xMm === 0 && placement.yMm === 0, false, "Placement should not return the blocked origin cell");
  console.log("✅ Geometry regression test passed: placement avoids room obstacles");
};

verifyPlacementAvoidsRoomObstacles();

// مطبخ تجريبي بسيط: 4 وحدات أرضية + 3 معلقة + وحدة تول للفرن
const units: KitchenUnit[] = [
  { id: "u1", type: "base", position: { xMm: 0, yMm: 0, rotationDeg: 0 }, dimensions: { widthMm: 600, depthMm: 600, heightMm: 850 }, materialId: "mdf_18_moisture_resistant", doorCount: 1, drawerCount: 0 },
  { id: "u2", type: "base", position: { xMm: 600, yMm: 0, rotationDeg: 0 }, dimensions: { widthMm: 800, depthMm: 600, heightMm: 850 }, materialId: "mdf_18_moisture_resistant", doorCount: 2, drawerCount: 0 },
  { id: "u3", type: "drawer_unit", position: { xMm: 1400, yMm: 0, rotationDeg: 0 }, dimensions: { widthMm: 600, depthMm: 600, heightMm: 850 }, materialId: "mdf_18_moisture_resistant", doorCount: 0, drawerCount: 3 },
  { id: "u4", type: "tall", position: { xMm: 2000, yMm: 0, rotationDeg: 0 }, dimensions: { widthMm: 600, depthMm: 600, heightMm: 2100 }, materialId: "mdf_18_moisture_resistant", doorCount: 2, drawerCount: 0 },
  { id: "u_corner", type: "corner_base", position: { xMm: 2600, yMm: 0, rotationDeg: 0 }, dimensions: { widthMm: 900, depthMm: 900, heightMm: 850, leftLegCarcassDepthMm: 600, rightLegCarcassDepthMm: 600 }, materialId: "mdf_18_moisture_resistant", doorCount: 0, drawerCount: 0, cornerConfig: { doorStyle: "bifold_lazy_susan", internalSolution: "lazy_susan_2tier", lazySusanDiameterMm: 750, hardwareCost: 1500 } },
  { id: "u5", type: "wall", position: { xMm: 0, yMm: 1500, rotationDeg: 0 }, dimensions: { widthMm: 600, depthMm: 320, heightMm: 700 }, materialId: "mdf_18_standard", doorCount: 1, drawerCount: 0 },
  { id: "u6", type: "wall", position: { xMm: 600, yMm: 1500, rotationDeg: 0 }, dimensions: { widthMm: 800, depthMm: 320, heightMm: 700 }, materialId: "mdf_18_standard", doorCount: 2, drawerCount: 0 },
  { id: "u7", type: "wall", position: { xMm: 1400, yMm: 1500, rotationDeg: 0 }, dimensions: { widthMm: 600, depthMm: 320, heightMm: 700 }, materialId: "mdf_18_standard", doorCount: 1, drawerCount: 0 },
];

const project: KitchenProject = {
  id: "test-proj",
  projectName: "Test Project",
  workshopId: "test-workshop",
  clientName: "Test Client",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  status: "design",
  // IMPORTANT: pricing.ts يعتمد على useSettingsStore.getState().projectSettings
  // فهنحط settings default للمطلوب (أو نخليها default من store)
  settings: { defaultMaterialId: "mdf_18_standard_nfb" } as any,
  payments: [],
  room: { id: "room1", name: "مطبخ", widthMm: 3000, lengthMm: 3000, heightMm: 2800, obstacles: [], polygonMm: [], fixtures: [] },
  units,
  appliances: [],
  profitMarginPercent: 25,
  includeVat: true,
};

const materialsById = Object.fromEntries(DEFAULT_MATERIALS.map((m) => [m.id, m]));

console.log("========== 1) Cutting List ==========");
const piecesByMaterial = projectToCutPiecesByMaterial(units);
for (const [materialId, pieces] of Object.entries(piecesByMaterial)) {
  const mat = materialsById[materialId];
  if (!mat) {
    console.log(`\nالخامة: ${materialId} — ⚠️ غير موجودة في DEFAULT_MATERIALS — عدد القطع: ${pieces.length}`);
    continue;
  }

  console.log(`\nالخامة: ${mat.nameAr} — عدد القطع: ${pieces.length}`);
  pieces.forEach((p) =>
    console.log(`  - ${p.label}: ${p.widthMm}×${p.heightMm}مم`)
  );
}

console.log("\n========== 2) Nesting (توزيع القطع على الألواح) ==========");
for (const [materialId, pieces] of Object.entries(piecesByMaterial)) {
  const material = materialsById[materialId];

  if (!material) {
    console.log(`\nالخامة: ${materialId} — ⚠️ غير موجودة في DEFAULT_MATERIALS. تخطي nesting.`);
    continue;
  }

  const result = nestPiecesForMaterial(pieces, material);
  console.log(`\nالخامة: ${material.nameAr}`);
  console.log(`عدد الألواح المطلوبة: ${result.sheets.length}`);

  result.sheets.forEach((s) =>
    console.log(`  لوح #${s.sheetIndex + 1}: استغلال ${s.utilizationPercent.toFixed(1)}% (${s.placedPieces.length} قطعة)`)
  );

  if (result.unplacedPieces.length > 0) {
    console.log(`  ⚠️ قطع لم يتم وضعها: ${result.unplacedPieces.length}`);
  }
}

console.log("\n========== 3) التسعير الكامل ==========");
const cost = calculateProjectCost(project, materialsById);
console.log(`عدد الألواح المطلوبة لكل خامة:`, cost.sheetsRequiredByMaterial);
console.log(`تكلفة الخامات: ${cost.totalMaterialCost.toFixed(0)} جنيه`);
console.log(`تكلفة شريط الحرف: ${cost.totalEdgeBandingCost.toFixed(0)} جنيه`);
console.log(`تكلفة الإكسسوارات: ${cost.totalAccessoriesCost.toFixed(0)} جنيه`);
console.log(`الإجمالي قبل الهامش: ${cost.subtotalBeforeMargin.toFixed(0)} جنيه`);
console.log(`هامش الربح (${project.profitMarginPercent}%): ${cost.marginAmount.toFixed(0)} جنيه`);
console.log(`\n>>> السعر النهائي للعميل: ${cost.grandTotal.toFixed(0)} جنيه <<<`);

