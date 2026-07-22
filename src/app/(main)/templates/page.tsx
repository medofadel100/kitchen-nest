"use client";

import React, { useEffect, useState } from "react";
import { KitchenTemplate } from "@/types";
import { getTemplates, createTemplate, deleteTemplate } from "@/lib/firebase/templates";
import { useProjectStore } from "@/store/projectStore";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Bookmark, Plus, Trash2, Copy, Loader2, LayoutGrid,
  Box, Calendar, Layers, ArrowLeft
} from "lucide-react";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<KitchenTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const router = useRouter();
  const { room, units, projectSettings, projectDetails, loadProjectData } = useProjectStore();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await getTemplates();
      setTemplates(data);
    } catch (err) {
      console.error("Failed to load templates:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCurrent = async () => {
    if (!templateName.trim()) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      await createTemplate({
        workshopId: "default_workshop",
        templateName: templateName.trim(),
        room: room!,
        units,
        appliances: projectDetails?.appliances || [],
        selectedCountertopId: projectDetails?.selectedCountertopId,
        selectedSinkId: projectDetails?.selectedSinkId,
        selectedFaucetId: projectDetails?.selectedFaucetId,
        settings: projectSettings,
        fillerPanels: projectDetails?.fillerPanels,
        endPanels: projectDetails?.endPanels,
        createdAt: now,
        updatedAt: now,
      });
      setTemplateName("");
      setShowCreateForm(false);
      await loadTemplates();
    } catch (err) {
      alert("حدث خطأ أثناء حفظ القالب.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف القالب "${name}"؟`)) return;
    try {
      await deleteTemplate(id);
      await loadTemplates();
    } catch {
      alert("حدث خطأ أثناء الحذف.");
    }
  };

  const handleLoadTemplate = (tpl: KitchenTemplate) => {
    loadProjectData({
      ...tpl,
      projectName: "",
      workshopId: "default_workshop",
      clientName: "",
      status: "design",
      profitMarginPercent: 30,
      payments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);
    router.push("/projects/new");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-black flex items-center gap-3">
                <Bookmark className="text-amber-400" size={32} />
                قوالب التصميم
              </h1>
              <p className="text-zinc-400 mt-1">
                احفظ تصاميمك كقوالب لاستعادتها في مشاريع جديدة
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all"
          >
            <Plus size={18} />
            حفظ التصميم الحالي كقالب
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-amber-500/30 rounded-2xl p-6"
          >
            <h3 className="font-bold text-amber-400 mb-4">حفظ التصميم الحالي كقالب جديد</h3>
            <div className="flex gap-4">
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="اسم القالب (مثلاً: مطبخ مودرن 3x4)"
                className="flex-1 px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-amber-500/50"
                autoFocus
              />
              <button
                onClick={handleSaveCurrent}
                disabled={saving || !templateName.trim()}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 text-zinc-950 font-bold hover:bg-amber-400 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Bookmark size={16} />}
                {saving ? "جاري الحفظ..." : "حفظ"}
              </button>
              <button
                onClick={() => { setShowCreateForm(false); setTemplateName(""); }}
                className="px-6 py-3 rounded-xl bg-zinc-800 text-zinc-300 font-bold hover:bg-zinc-700 transition-colors"
              >
                إلغاء
              </button>
            </div>
            <p className="text-xs text-zinc-500 mt-3">
              سيتم حفظ الغرفة الحالية + جميع الوحدات والإعدادات كقالب
            </p>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl"><Bookmark size={24} /></div>
            <div>
              <p className="text-xs text-zinc-500 font-bold mb-1">إجمالي القوالب</p>
              <p className="text-2xl font-bold">{templates.length}</p>
            </div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl"><Box size={24} /></div>
            <div>
              <p className="text-xs text-zinc-500 font-bold mb-1">آخر قالب</p>
              <p className="text-sm font-bold truncate">
                {templates.length > 0 ? templates[0].templateName : "لا يوجد"}
              </p>
            </div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl"><Layers size={24} /></div>
            <div>
              <p className="text-xs text-zinc-500 font-bold mb-1">ال_units الحالية</p>
              <p className="text-2xl font-bold">{units.length}</p>
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-amber-400" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/30 border border-zinc-800 rounded-3xl">
            <LayoutGrid size={48} className="text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 text-lg font-bold">لا توجد قوالب محفوظة</p>
            <p className="text-zinc-600 text-sm mt-2">ابدأ بحفظ تصميمك الحالي كقالب لاستعادته لاحقاً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((tpl) => (
              <motion.div
                key={tpl.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                    <Bookmark size={24} />
                  </div>
                  <button
                    onClick={() => handleDelete(tpl.id, tpl.templateName)}
                    className="p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <h3 className="font-bold text-lg text-white mb-2">{tpl.templateName}</h3>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Box size={14} />
                    <span>{tpl.units.length} وحدة</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Calendar size={14} />
                    <span>{new Date(tpl.createdAt).toLocaleDateString("ar-EG")}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleLoadTemplate(tpl)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm hover:bg-emerald-500/20 transition-colors"
                >
                  <Copy size={14} />
                  تحميل القالب
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
