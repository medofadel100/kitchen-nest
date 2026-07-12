# KitchenNest — TODO

- [ ] إصلاح باگين تغليف العمود داخل `src/lib/cuttingList.ts`:
  - [ ] تصحيح حساب عرض `boxedWidthMm` ليطابق المساحة الفعلية المتاحة باستخدام `localObsLeft/localObsRight`
  - [ ] منع إضافة لوحين side إضافيين إلا لو فيه كاركاس فعلي (`hasLeftPart/hasRightPart`)
  - [ ] تمرير المتغيرات اللازمة من `obstacleAwareCarcassPieces` لِـ `buildColumnBoxingPieces`
- [ ] تشغيل `scripts/test-core-logic.ts` للتأكد من النتائج

