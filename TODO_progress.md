# TODO_progress.md

## 1) Update share UI (model + price + delivery)
- [x] Add price block to `src/app/share/[id]/page.tsx`. (done)
- [x] Use new safe pricing fields from `/api/share/[shareToken]`. (done)

## 2) Update share API to return safe price fields
- [x] Modify `src/app/api/share/[shareToken]/route.ts` to include safe single value (grand total شاملة VAT).

## 3) Fix missing/hidden AR activation
- [x] Fix `model-viewer` script loading — moved from async `<script>` tag to dynamic `useEffect` loading with proper readiness state.
- [x] Add loading spinner while `model-viewer` component initializes.
- [x] Added `modelViewerReady` state to prevent rendering before web component is registered.

## 4) Make share mode fully readOnly (no transform / no context menu / no open doors)
- [x] In `src/components/canvas/KitchenCanvas3D.tsx`:
  - Blocked contextMenu creation entirely when `readOnly=true` for obstacles and fixtures.
  - Allowed door open/close interaction in readOnly mode (click on unit shows context menu with open/close door option only).
  - All other operations (duplicate, hide, edit dimensions, delete) are hidden in readOnly mode.
- [x] Added helpful instruction text in share page info card about clicking units to open doors.

## 6) Fix cutting list notch area calculation
- [x] Add `getPieceActualAreaMm2()` function in `pieceGeometry.ts` to calculate actual area of L-shaped pieces (subtracting notch area).
- [x] Add `getPieceEdgeLengthsMm()` function in `pieceGeometry.ts` to calculate actual edge lengths for pieces with notches.
- [x] Update `nesting.ts` to use actual piece area for waste calculation and sorting strategies.
- [x] Update `CuttingListPrint.tsx` to show notch info, actual area, and deducted area in the table.
- [x] Update `pricing.ts` to use actual edge lengths for edge banding calculation.
- [x] TypeScript check passed (zero errors).
- [x] Production build succeeded.

