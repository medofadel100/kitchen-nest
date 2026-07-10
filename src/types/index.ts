// ============================================================
// KitchenNest - Core Data Types
// نظام تصميم وتسعير المطابخ لورش النجارة
// ============================================================

// ---------- الخامات (Materials) ----------

export type MaterialCategory = "mdf" | "hpl" | "acrylic" | "melamine" | "solid_wood" | "plywood";

export interface MaterialColor {
  id: string;
  nameAr: string;
  colorHex: string;
}

export type BoardType = "mdf" | "hdf" | "chipboard" | "plywood" | "solid_wood" | "melamine_faced" | "acrylic_faced";

export interface StandardSheetSize {
  widthMm: number;   // عرض اللوح
  heightMm: number;  // ارتفاع/طول اللوح
  thicknessMm: number;
}

export interface Material {
  id: string;
  nameAr: string;              // اسم الخامة بالعربي (مثال: "MDF مقاوم رطوبة 18مم")
  nameEn?: string;
  category: MaterialCategory;
  boardType?: BoardType;
  supplierName?: string;       // اسم المورد - يدخله صاحب الورشة
  supplierContact?: string;
  standardSheet: StandardSheetSize;
  // السعر يبقى "افتراضي / تقديري" لحد ما صاحب الورشة يعدل بسعره الحقيقي
  pricePerSheet: number;       // جنيه للوح الكامل
  edgeBandingPricePerMeter?: number; // سعر شريط الحرف بالمتر الطولي
  hasGrainDirection?: boolean; // هل للخامة اتجاه عرق خشب يجب الحفاظ عليه في التقطيع؟
  isPricePlaceholder: boolean; // true = سعر افتراضي لسه محتاج تأكيد
  requiresColorMatching?: boolean; // للمطابقة البصرية للون/الثمرة للوحدات المتجاورة
  wastePercentDefault: number; // نسبة هالك افتراضية (مثلاً 10%)
  colorHex?: string;           // اللون الافتراضي للخامة للعرض في الرسمة
  availableColors?: MaterialColor[]; // ألوان متاحة (للميلامين/الأكريليك/HPL) — فاضية = لون ثابت (MDF)
  updatedAt: string;
}

// ---------- وحدات المطبخ (Kitchen Units) ----------

export type UnitType =
  | "base"        // وحدة أرضية
  | "wall"        // وحدة معلقة
  | "tall"        // وحدة تول (فرن/تلاجة/مخزن)
  | "corner_base" // وحدة ركن أرضية
  | "corner_wall" // وحدة ركن معلقة
  | "corner_tall" // وحدة ركن طولية
  | "island"      // جزيرة
  | "drawer_unit" // وحدة أدراج
  | "loft"        // وحدة قلاب/مستوى ثاني علوي
  | "pantry_pullout" // وحدة مخزن طويلة بالسحاب
  | "open_shelf";    // وحدة مفتوحة

export interface UnitDimensions {
  widthMm: number;
  depthMm: number;
  heightMm: number;
  // أبعاد مخصصة لوحدات الزاوية L-Shape
  leftLegCarcassDepthMm?: number; // عمق الجزء الأيسر (افتراضي يساوي عمق الوحدة الأساسية)
  rightLegCarcassDepthMm?: number; // عمق الجزء الأيمن (يساوي عمق الوحدة الأساسية)
}

// أبعاد قياسية شائعة لكل نوع وحدة (تُستخدم كـ snap points)
export const STANDARD_WIDTHS_MM = [300, 400, 450, 500, 600, 800, 900, 1000, 1200];

export const DEFAULT_UNIT_DIMENSIONS: Record<UnitType, UnitDimensions> = {
  base: { widthMm: 600, depthMm: 600, heightMm: 850 },
  wall: { widthMm: 600, depthMm: 320, heightMm: 700 },
  tall: { widthMm: 600, depthMm: 600, heightMm: 2100 },
  corner_base: { widthMm: 900, depthMm: 900, heightMm: 850 },
  corner_wall: { widthMm: 600, depthMm: 600, heightMm: 700 },
  corner_tall: { widthMm: 900, depthMm: 900, heightMm: 2100 },
  island: { widthMm: 1200, depthMm: 900, heightMm: 850 },
  drawer_unit: { widthMm: 600, depthMm: 600, heightMm: 850 },
  loft: { widthMm: 600, depthMm: 320, heightMm: 400 },
  pantry_pullout: { widthMm: 600, depthMm: 600, heightMm: 2100 },
  open_shelf: { widthMm: 600, depthMm: 320, heightMm: 700 },
};

export type CornerDoorStyle = "diagonal_single" | "bifold_lazy_susan" | "lift_up" | "none";
export type CornerInternalSolution = "fixed_shelf" | "lazy_susan_2tier" | "magic_corner_pullout" | "none";

export interface CornerUnitConfig {
  doorStyle: CornerDoorStyle;
  internalSolution: CornerInternalSolution;
  // للـ lazy susan: قطر الطبق الدوار بالمليمتر (قيمة هاردوير جاهزة، مش محسوبة)
  lazySusanDiameterMm?: number;
  // سعر الهاردوير الجاهز (يُدخل يدويًا من كتالوج مورد، زي الخامات بالظبط)
  hardwareCost: number;
}

// تكوين تقسيم الأبواب والفواصل الخشبية
export type DoorDivisionStyle =
  | "equal"          // تقسيم متساوي بدون فواصل (كل باب جنب التاني)
  | "symmetrical"    // بابين متساويين في المنتصف + فواصل جانبية
  | "asymmetric";    // توزيع حر

export interface DoorConfig {
  count: number;                  // عدد الضلف
  divisionStyle: DoorDivisionStyle;
  // تقسيم الضلف: زى (2+2) ولا (3) ولا (2+1)
  // automatic: لو 4 ابواب و divisionStyle = symmetrical => 2+2 مع فاصل في النص
  panelGroupSizes?: number[];     // مثال: [2, 2] = ضلفتين شمال + ضلفتين يمين, [3] = 3 ضلف متجاورة
  dividerWidthMm?: number;        // عرض الفاصل الخشبي بين المجموعات (افتراضي 50مم)
  dividerColorHex?: string;       // لون الفاصل
}

export type LedPlacement = "external_top" | "external_bottom" | "internal_top" | "internal_bottom" | "both";

export interface LedConfig {
  hasLed: boolean;
  placement: LedPlacement;        // مكان الليد
  externalLengthMm?: number;      // طول الليد الخارجي
  internalLengthMm?: number;      // طول الليد الداخلي (داخل الرفوف)
  colorHex?: string;              // لون الإضاءة (افتراضي أبيض دافئ #FFE4B5)
  brightness?: number;            // شدة الإضاءة 0-1
}

export interface KitchenUnit {
  id: string;
  type: UnitType;
  label?: string;              // اسم اختياري يديه المستخدم
  position: { xMm: number; yMm: number; zMm?: number; rotationDeg: 0 | 90 | 180 | 270 };
  dimensions: UnitDimensions;
  materialId: string;          // الخامة المستخدمة للجسم
  colorHex?: string;           // لون جسم الوحدة (مأخوذ من availableColors للخامة)
  colorId?: string;            // ID اللون المختار من availableColors
  doorMaterialId?: string;     // خامة الأبواب لو مختلفة
  doorColorHex?: string;       // لون الأبواب
  doorColorId?: string;        // ID لون الأبواب
  doorCount: number;
  doorConfig?: DoorConfig;     // تفاصيل تقسيم الأبواب والفواصل
  drawerCount: number;
  shelfCount?: number;         // عدد الأرفف الداخلية
  hingesPerDoor?: number;      // عدد المفصلات في الباب الواحد
  hingeType?: string;          // ID of the selected Hinge from hardware options (or 'none')
  handleType?: string;         // ID of the selected Handle from hardware options (or 'none')
  handleCount?: number;        // عدد المقابض
  hasLedProfile?: boolean;     // هل تحتوي على بروفايل ليد؟
  ledProfileLengthMm?: number; // طول الليد بالملي
  ledConfig?: LedConfig;       // إعدادات الليد المتقدمة
  cornerConfig?: CornerUnitConfig; // موجود فقط لو type = corner_base | corner_wall | tall مع corner
  accessoriesCostOverride?: number; // تكلفة إكسسوارات يدوية لو عايز يظبطها
  isHidden?: boolean;
  // حالة الفتح للعرض 3D (ليست للتخزين)
  _3dDoorOpen?: boolean;       // هل الأبواب مفتوحة حالياً؟
  _3dDrawerOpen?: boolean;     // هل الأدراج مفتوحة حالياً؟
  // خصائص خاصة بوحدة الحوض
  isSinkBase?: boolean;        // وحدة الحوض - بدون أرفف داخلية ومقصي الظهر
  sinkConfig?: {
    hasFalseDrawer?: boolean;  // هل يوجد درج وهمي فوق الباب؟
  };
}

// ---------- عناصر ثابتة في الفراغ (Room Fixtures & Structure) ----------

export type FixtureType =
  | "door" | "window" | "balcony_door"
  | "sink_drain" | "washing_machine_drain" | "dishwasher_drain"
  | "water_supply" | "gas_pipe" | "electrical_outlet";

export interface RoomFixture {
  id: string;
  type: FixtureType;
  xMm: number;
  yMm: number;
  widthMm: number; // للباب أو الشباك العرض
  heightMm: number; // الارتفاع العمودي للنافذة أو الباب نفسه
  zMm: number; // ارتفاع الفتحة من الأرض (مثلا الشباك 1000مم عن الأرض، الباب 0)
  rotationDeg?: number;
  notes?: string;
  isHidden?: boolean;
}

export interface StructuralObstacle {
  id: string;
  type: "column" | "beam";
  xMm: number;
  yMm: number;
  widthMm: number;
  depthMm: number;
  rotationDeg?: number;
  isHidden?: boolean;
}

export interface Room {
  id: string;
  name: string;
  widthMm: number;
  lengthMm: number;
  heightMm: number;
  polygonMm: { xMm: number; yMm: number }[]; // For non-rectangular rooms
  fixtures: RoomFixture[];
  obstacles: StructuralObstacle[];
}

// ---------- الأجهزة الكهربائية (Appliances) ----------

export interface Appliance {
  id: string;
  nameAr: string;
  category: "oven" | "hob" | "hood" | "fridge" | "freezer" | "dishwasher" | "sink" | "microwave" | "washing_machine" | "dryer" | "stove";
  variant?: "standard" | "premium" | "compact"; // For fridges and ovens
  defaultDimensions: UnitDimensions;
  // الفتحة القياسية للتركيب (مهم عند تغيير الحجم عشان يفضل يتركب صح)
  standardCutoutMm?: { widthMm: number; heightMm: number };
  isSizeAdjustable: boolean;
  modelUrl?: string; // مسار موديل 3D (glb/gltf) لو متاح
}

// ---------- الإكسسوارات (Hardware) ----------
export interface HardwareItem {
  id: string;
  nameAr: string;
  brand: string;
  category: 'hinge' | 'drawer_runner' | 'handle' | 'lighting' | 'other';
  price: number;
  isPricePlaceholder?: boolean;
}

// ---------- إعدادات المشروع (Project Settings) ----------
export interface ProjectSettings {
  defaultHingeId: string; // مفصلات المشروع الافتراضية
  defaultDrawerRunnerId: string; // سكك أدراج المشروع الافتراضية
  defaultHandleId: string; // مقابض المشروع الافتراضية
  defaultBaseHeightMm: number;
  defaultBaseDepthMm: number;
  defaultWallElevationMm: number;
  defaultWallHeightMm: number;
  defaultWallDepthMm: number;
  defaultLoftElevationMm: number;
  defaultLoftHeightMm: number;
  defaultLoftDepthMm: number;
  // الخامات والألوان
  defaultMaterialId: string;
  defaultDoorMaterialId: string;
  defaultBaseColor: string;
  defaultWallColor: string;
  defaultTallColor: string;
  defaultLoftColor: string;
  defaultBaseDoorColor?: string;
  defaultWallDoorColor?: string;
  defaultTallDoorColor?: string;
  defaultLoftDoorColor?: string;
  defaultWallMaterialId?: string; // لو الوحدات العلوية خامة مختلفة
  defaultColorHex: string;
  defaultWallColorHex?: string; // لو الوحدات العلوية لون مختلف
}

// ---------- المشروع الكامل ----------

export type PaymentMethod = "cash" | "instapay" | "smart_wallet" | "bank_transfer";

export interface Payment {
  id: string;
  amount: number;
  date: string; // ISO date string or timestamp
  method: PaymentMethod;
  isPaid: boolean;
  receiptUrl?: string; // رابط إيصال الدفع لو موجود
}

export interface Countertop {
  id: string;
  nameAr: string;
  category: "granite_local" | "granite_imported" | "quartz" | "solid_surface";
  colorNameAr: string; // جندولا، أسواني، جالاكسي أسود...
  pricePerLinearMeter: number;
  isPricePlaceholder: boolean;
  originCountry?: string;
}

export interface SinkOption {
  id: string;
  brandName: string; // Franke, Teka, Purity...
  material: "stainless_steel" | "granite_composite" | "ceramic";
  mountType: "under_mount" | "top_mount" | "flush_mount";
  standardCutoutMm: { widthMm: number; heightMm: number };
  price: number;
  isPricePlaceholder: boolean;
}

export interface FaucetOption {
  id: string;
  brandName: string; // Hansgrohe, Grohe, Kludi...
  price: number;
  isPricePlaceholder: boolean;
}

// Filler Panel - لملء الفراغات الصغيرة
export interface FillerPanel {
  id: string;
  parentUnitId: string; // الوحدة اللي جنبها
  widthMm: number; // عادة صغير 20-100مم
  heightMm: number;
  materialId: string; // خامة الأبواب عادة
}

// End Panel - لوح نهاية الوحدة
export interface EndPanel {
  id: string;
  parentUnitId: string;
  heightMm: number;
  depthMm: number;
  materialId: string; // خامة الأبواب - مهم جدًا
}

// Pull-out Pantry Configuration
export interface PulloutConfig {
  basketCount: number; // عادة 4-6 سلال
  basketType: "wire" | "solid";
  hardwareCost: number; // زي الـ lazy susan بالظبط، ده هاردوير جاهز مش خامة
}

export interface KitchenProject {
  id: string;
  projectName: string;
  workshopId: string;
  clientName: string;
  clientPhone?: string;
  projectAddress?: string;
  engineerName?: string;
  projectSource?: "engineering_office" | "direct_client"; // مصدر المشروع
  officeName?: string; // اسم المكتب الهندسي لو المصدر مكتب
  createdAt: string;
  updatedAt: string;
  status: "design" | "client_review" | "approved" | "in_production" | "installed";
  room: Room;
  units: KitchenUnit[];
  appliances: { applianceId: string; position: { xMm: number; yMm: number }; customDimensions?: UnitDimensions }[];
  profitMarginPercent: number; // هامش الربح المستخدم في التسعير

  selectedCountertopId?: string;
  selectedSinkId?: string;
  selectedFaucetId?: string;
  countertopLengthM?: number; // الطول المقدر للرخام/الكوارتز

  settings: ProjectSettings; // إعدادات المشروع القياسية

  // بيانات مادية وجدولة
  deliveryDate?: string; // تاريخ التسليم المتوقع
  payments: Payment[]; // جدول الدفعات

  // Filler panels and end panels
  fillerPanels?: FillerPanel[];
  endPanels?: EndPanel[];
}

// ---------- التسعير (Pricing) ----------

export interface UnitCostBreakdown {
  unitId: string;
  materialAreaM2: number;
  materialCost: number;
  edgeBandingLengthM: number;
  edgeBandingCost: number;
  accessoriesCost: number;
  accessoriesDetails?: {
    name: string;
    count: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
}

export interface ProjectCostSummary {
  unitBreakdowns: UnitCostBreakdown[];
  totalMaterialCost: number;
  totalEdgeBandingCost: number;
  totalAccessoriesCost: number;
  countertopCost: number;
  sinkCost: number;
  faucetCost: number;
  subtotalBeforeMargin: number;
  marginAmount: number;
  grandTotal: number;
  // نتيجة الـ nesting - عدد الألواح الفعلي المطلوب لكل خامة
  sheetsRequiredByMaterial: Record<string, number>;
}

// ---------- Nesting ----------

export interface CutPiece {
  id: string;           // مرجع للوحدة والجزء (مثال: unit_1_side_left)
  widthMm: number;
  heightMm: number;
  materialId: string;
  colorId: string;      // اللون — الـ nesting يفصل قطع الألوان المختلفة على ألواح منفصلة
  colorHex: string;     // اللون الفعلي للعرض البصري
  label: string;
  canRotate: boolean;
  visualGroupId?: string; // لجمع القطع المتجاورة بنفس اللون/الثمرة
  edgesToBind?: ("top" | "bottom" | "left" | "right")[];
}

export interface PlacedPiece extends CutPiece {
  xMm: number;
  yMm: number;
  rotated: boolean;
}

export interface NestingSheetResult {
  sheetIndex: number;
  materialId: string;
  colorId: string;      // اللون المخصص لهذا اللوح
  colorHex: string;     // اللون للعرض البصري
  sheetSize: StandardSheetSize;
  placedPieces: PlacedPiece[];
  usedAreaM2: number;
  wasteAreaM2: number;
  utilizationPercent: number;
}

export interface NestingResult {
  materialId: string;
  sheets: NestingSheetResult[];
  unplacedPieces: CutPiece[]; // لو حصل خطأ ومفيش مكان لقطعة (نادر لو المقاسات منطقية)
}

// ---------- ????????? ????????? (Roles & HR) ----------

export type UserRole = 'admin' | 'manager' | 'designer' | 'accountant' | 'technician';

export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
  workshopId: string;
  name?: string;
  employeeId?: string; // ??? ??? ????? ???? ????
}

export type SalaryType = 'daily' | 'weekly' | 'monthly';

export interface EmployeeTransaction {
  id: string;
  type: 'advance' | 'deduction' | 'bonus' | 'overtime';
  amount: number;
  date: string;
  note?: string;
}

export interface Employee {
  id: string;
  workshopId: string;
  name: string;
  jobTitle: string;
  hasSystemAccess: boolean; // ?? ???? ?????
  userId?: string;          // uid ?? ??? ?? ????
  salaryType: SalaryType;
  baseSalary: number;
  transactions: EmployeeTransaction[];
  createdAt: string;
}

// ---------- المخزن (Inventory) ----------

export interface InventoryTransaction {
  id: string;
  type: 'in' | 'out'; // in = إضافة رصيد (شراء), out = خصم (لمشروع أو هالك)
  quantity: number;
  date: string;
  projectId?: string; // إذا كان الخصم بسبب مشروع معين
  note?: string;
}

export interface InventoryItem {
  id: string; // نفس الـ id الخاص بالخامة (Material) أو الإكسسوار (Hardware)
  workshopId: string;
  itemType: 'material' | 'hardware';
  nameAr: string; // لسهولة العرض في الجدول دون الحاجة لـ join
  quantityInStock: number; // لو خامة هيكون عدد الألواح، لو إكسسوار هيكون بالعدد أو المتر
  transactions: InventoryTransaction[];
  updatedAt: string;
}