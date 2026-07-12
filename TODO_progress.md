# TODO_progress.md

## 1) Update share UI (model + price + delivery)
- [x] Add price block to `src/app/share/[id]/page.tsx`. (done)
- [x] Use new safe pricing fields from `/api/share/[shareToken]`. (done)

## 2) Update share API to return safe price fields
- [x] Modify `src/app/api/share/[shareToken]/route.ts` to include safe single value (grand total شاملة VAT).

## 3) Fix missing/hidden AR activation
- [ ] Ensure AR button is visible on mobile (remove `hidden md:block` assumptions / add mobile placement).
- [ ] Confirm `model-viewer` slot `ar-button` works reliably.

## 4) Make share mode fully readOnly (no transform / no context menu / no open doors)
- [ ] In `src/components/canvas/KitchenCanvas3D.tsx`, block contextMenu creation and interactions entirely when `readOnly=true`.

## 5) Verify build
- [ ] Run typecheck + tests / start dev build if needed.

