# KitchenNest — Project Context Prompt

## السياق العام

انت بتشتغل على **KitchenNest**: نظام SaaS لورش النجارة/المطابخ في مصر. المستخدم مش عميل نهائي (صاحب بيت)، المستخدم هو **صاحب ورشة نجارة** بيصمم مطبخ لعميله، والنظام لازم يطلعله:
1. رسم للمطبخ (وحدات base/wall/tall/corner/drawer)
2. **Cutting list** دقيق (كل قطعة خشب مطلوبة لكل وحدة)
3. **Nesting** فعلي (توزيع القطع على ألواح الخشب القياسية بأقل هالك)
4. **تسعير** دقيق مبني على عدد الألواح الحقيقي اللي هيتشترى (مش المساحة النظرية)

**الأولوية الأهم في المشروع ده هي دقة الـ cutting list والـ nesting والتسعير** — مش جمال الرسم أو الـ 3D. لو فيه اختيار بين تحسين الرسم أو تحسين دقة التسعير، التسعير يفوز دايمًا.

## الـ Stack

- Next.js 14 (لازم يترفّع لآخر نسخة patched — فيه ثغرة أمنية معروفة في 14.2.5، تأكد من الفيرجن قبل أي deploy)
- TypeScript (strict mode)
- Firebase/Firestore للـ database (نفس الـ pattern المستخدم في مشاريع تانية للمستخدم زي Ramon وRomad Laser)
- Vercel للـ deployment
- Path alias `@/*` بيشاور على `src/*`

## بنية الملفات الحالية (Core Logic — تم بناؤها واختبارها)

```
src/types/index.ts       — كل الـ TypeScript types (Material, KitchenUnit, Appliance, KitchenProject, ProjectCostSummary, CutPiece, NestingResult...)
src/data/materials.ts    — خامات افتراضية بأسعار placeholder (isPricePlaceholder: true) — دول أسعار وهمية للاختبار بس
src/lib/cuttingList.ts   — بيحول KitchenUnit[] لـ CutPiece[] (جانبين، قاعدة، سقف، ظهر، رف، أبواب، واجهات أدراج)
src/lib/nesting.ts       — Guillotine Bin Packing algorithm، بيحسب SAW_KERF_MM (سُمك شفرة المنشار) بين كل قطعتين
src/lib/pricing.ts       — calculateProjectCost() بيربط كل حاجة: cutting list → nesting فعلي → عدد ألواح حقيقي → + edge banding + إكسسوارات + هامش ربح
scripts/test-core-logic.ts — سكريبت تجربة كامل على مطبخ وهمي (7 وحدات)، شغّله بـ: npx tsx scripts/test-core-logic.ts
```

## قواعد مهمة لازم تفهمها قبل أي تعديل

1. **الأسعار في `materials.ts` كلها placeholder وهمية.** متستخدمهاش كمرجع حقيقي ومتفترضش إنها صح. أي تعديل على المنطق لازم يفضل شغال بغض النظر عن الأرقام دي.

2. **سُمك اللوح الافتراضي المستخدم في حسابات `cuttingList.ts` هو 18مم** (`PANEL_THICKNESS_MM`) — لو حد طلب دعم سماكات مختلفة لكل خامة، لازم الرقم ده ياخده من `Material.standardSheet.thicknessMm` بدل القيمة الثابتة.

3. **الـ nesting algorithm نوعه Guillotine** (قصات مستقيمة كاملة من طرف اللوح للطرف) — ده مقصود ومش خطأ، لأنه الوحيد اللي فعليًا قابل للتنفيذ على ماكينة قص حقيقية. متبدلوش بخوارزمية "Maximal Rectangles" أو غيرها إلا لو المستخدم أكد إن ماكينته بتقدر تعمل قصات غير مستقيمة (نادر).

4. **كل خامة بتتحسب nesting على حدة** — القطع من خامات مختلفة متتقفش مع بعض على نفس اللوح. ده مقصود، متحاولش "تحسّن" الأداء بدمجهم.

5. **التسعير النهائي بيعتمد على `sheetsRequired` (عدد صحيح من الألواح) مش المساحة الكسرية.** يعني لو هتحتاج 3.2 لوح، المفروض تدفع تمن 4 ألواح كاملة — ده أهم فرق بين الأداة دي وأي حاسبة "متر × سعر" بسيطة. لو لقيت أي كود بيحسب التكلفة من المساحة مباشرة من غير ما يعدي على nesting الأول، ده باگ.

6. **واجهات الأدراج والأبواب بتتقرب لأقرب مليمتر** (`Math.round`) — الكسور العشرية في المقاسات مش منطقية لتصنيع حقيقي.

## المتبقي (روادماب — بالترتيب)

1. واجهة رسم (Canvas) لإضافة/سحب/تكبير الوحدات — SVG أو Konva.js، مع snap على `STANDARD_WIDTHS_MM`
2. عرض بصري لنتيجة الـ nesting (رسم كل `NestingSheetResult` كمستطيلات SVG فوق شكل اللوح) — ده هيبقى الـ "cutting sheet" القابل للطباعة
3. لوحة إدارة خامات (CRUD) — كل ورشة تدخل مورديها وأسعارها الحقيقية
4. ربط Firestore (collections: workshops, materials, projects, unitTemplates)
5. موديلات 3D للأجهزة الكهربائية مع قفل أبعاد `standardCutoutMm`
6. تصدير PDF (عرض سعر للعميل بدون تفاصيل داخلية + cutting sheet داخلي للورشة)

## لو حصلت مشكلة أو محتاج تعديل

- **قبل أي تعديل في `nesting.ts` أو `pricing.ts`**: شغّل `scripts/test-core-logic.ts` الأول عشان تشوف الوضع الحالي، وشغّله تاني بعد التعديل تتأكد إن الأرقام لسه منطقية (استغلال اللوح utilizationPercent المفروض يكون غالبًا فوق 60-70% لمطبخ متوسط)
- **لو الأسعار طلعت غريبة (عالية أو واطية جدًا)**: أول حاجة تتأكد منها هي إن `isPricePlaceholder` لسه true — يبقى الأرقام مش حقيقية أصلاً
- **لو عايز تضيف نوع وحدة جديد**: ضيفه في `UnitType` (types/index.ts) + `DEFAULT_UNIT_DIMENSIONS` + دالة جديدة في `cuttingList.ts` تحدد قطعه، + سطر في `DEFAULT_ACCESSORY_COST_PER_UNIT` (pricing.ts)
- **لو عايز تضيف خامة جديدة**: ضيفها في `data/materials.ts` بس خليها `isPricePlaceholder: true` لحد ما تتأكد من السعر الحقيقي
- **قبل أي `npm install` أو deploy فعلي**: تأكد إن Next.js اترفّع لآخر نسخة patched (14.2.5 فيها ثغرة أمنية معروفة)

## أسلوب التواصل المفضل

المستخدم مهندس إلكترونيات وواعي تقنيًا (ESP32, PCB, Next.js/Firebase مشاريع تانية شغالة)، بيفضل إجابات مختصرة ومباشرة بأرقام عملية بدل شرح نظري طويل. لو في مشكلة، وضّح السبب التقني بسرعة واقترح الحل، من غير مقدمات.
