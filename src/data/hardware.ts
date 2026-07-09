import { HardwareItem } from "../types";

export const DEFAULT_HARDWARE: HardwareItem[] = [
  // ---------------- مفصلات (Hinges) ----------------
  {
    id: "hinge_blum_soft",
    nameAr: "مفصلة بلوم نمساوي (Soft Close)",
    brand: "Blum",
    category: "hinge",
    price: 180, // سعر القطعة تقريبي
    isPricePlaceholder: true,
  },
  {
    id: "hinge_blum_180",
    nameAr: "مفصلة بلوم 180 درجة (للزوايا)",
    brand: "Blum",
    category: "hinge",
    price: 350,
    isPricePlaceholder: true,
  },
  {
    id: "hinge_salice_soft",
    nameAr: "مفصلة ساليس إيطالي (Soft Close)",
    brand: "Salice",
    category: "hinge",
    price: 150,
    isPricePlaceholder: true,
  },
  {
    id: "hinge_dtc_soft",
    nameAr: "مفصلة DTC صيني (Soft Close)",
    brand: "DTC",
    category: "hinge",
    price: 45,
    isPricePlaceholder: true,
  },
  {
    id: "hinge_samet_soft",
    nameAr: "مفصلة ساميت تركي (Soft Close)",
    brand: "Samet",
    category: "hinge",
    price: 65,
    isPricePlaceholder: true,
  },
  {
    id: "hinge_standard_budget",
    nameAr: "مفصلة عادية (بدون باكم)",
    brand: "Generic",
    category: "hinge",
    price: 25,
    isPricePlaceholder: true,
  },

  // ---------------- سكك أدراج (Drawer Runners) ----------------
  {
    id: "drawer_blum_tandembox",
    nameAr: "سكة أدراج بلوم (Tandembox)",
    brand: "Blum",
    category: "drawer_runner",
    price: 1800, // سعر الطقم للدرج الواحد
    isPricePlaceholder: true,
  },
  {
    id: "drawer_samet_smart_slide",
    nameAr: "سكة ساميت مخفية (Smart Slide)",
    brand: "Samet",
    category: "drawer_runner",
    price: 650,
    isPricePlaceholder: true,
  },
  {
    id: "drawer_dtc_soft",
    nameAr: "سكة DTC باكم مخفية",
    brand: "DTC",
    category: "drawer_runner",
    price: 450,
    isPricePlaceholder: true,
  },
  {
    id: "drawer_standard_telescopic",
    nameAr: "سكة عادية مرحلتين (Telescopic)",
    brand: "Generic",
    category: "drawer_runner",
    price: 120,
    isPricePlaceholder: true,
  },

  // ---------------- مقابض (Handles) ----------------
  {
    id: "handle_gola_profile",
    nameAr: "بروفايل ألومنيوم (Gola)",
    brand: "Generic",
    category: "handle",
    price: 150, // سعر القطعة للوحدة (أو يُحسب بالمتر في المستقبل)
    isPricePlaceholder: true,
  },
  {
    id: "handle_cnc_groove",
    nameAr: "حفر مدمج (CNC Groove)",
    brand: "Custom",
    category: "handle",
    price: 120, // تكلفة تشغيل الماكينة
    isPricePlaceholder: true,
  },
  {
    id: "handle_standard",
    nameAr: "مقبض عادي خارجي (Standard)",
    brand: "Generic",
    category: "handle",
    price: 60,
    isPricePlaceholder: true,
  },
  {
    id: "handle_hidden",
    nameAr: "بدون مقبض (Push-to-open)",
    brand: "Generic",
    category: "handle",
    price: 40,
    isPricePlaceholder: true,
  },

  // ---------------- إضاءة (Lighting) ----------------
  {
    id: "lighting_led_profile_standard",
    nameAr: "بروفايل ليد كامل (شريط + ترانس)",
    brand: "Generic",
    category: "lighting",
    price: 120, // سعر المتر
    isPricePlaceholder: true,
  }
];
