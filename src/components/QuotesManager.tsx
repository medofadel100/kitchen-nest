"use client";

import React, { useMemo, useState } from "react";
import { useProjectStore } from "@/store/projectStore";
import { calculateProjectCost } from "@/lib/pricing";
import { DEFAULT_MATERIALS } from "@/data/materials";
import { ProjectQuote, KitchenProject, KitchenUnit } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  FileText,
  Send,
  CheckCircle2,
  XCircle,
  Eye,
  GitCompareArrows,
  Trash2,
  ArrowRight,
  Clock,
  Copy,
  Pencil,
} from "lucide-react";

const VAT_RATE = 0.14;

const statusConfig: Record<
  ProjectQuote["status"],
  { label: string; color: string; bgColor: string; borderColor: string; icon: any }
> = {
  draft: {
    label: "مسودة",
    color: "text-zinc-400",
    bgColor: "bg-zinc-500/10",
    borderColor: "border-zinc-500/30",
    icon: FileText,
  },
  sent: {
    label: "مرسل",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    icon: Send,
  },
  viewed: {
    label: "تمت المشاهدة",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    icon: Eye,
  },
  accepted: {
    label: "مقبول",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    icon: CheckCircle2,
  },
  rejected: {
    label: "مرفوض",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    icon: XCircle,
  },
};

export const QuotesManager = () => {
  const { units, room, projectDetails, setProjectDetails } =
    useProjectStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompareView, setShowCompareView] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [editingQuote, setEditingQuote] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const quotes: ProjectQuote[] = (projectDetails as any)?.quotes || [];
  const activeQuoteId = (projectDetails as any)?.activeQuoteId;

  const materialsById = useMemo(() => {
    const map: Record<string, any> = {};
    for (const m of DEFAULT_MATERIALS) map[m.id] = m;
    return map;
  }, []);

  const getQuotePricing = (quoteUnits: KitchenUnit[], quoteRoom?: any) => {
    const dummyProject: KitchenProject = {
      id: "quote-calc",
      projectName: "quote",
      workshopId: "ws-1",
      clientName: "",
      createdAt: "",
      updatedAt: "",
      status: "design",
      profitMarginPercent: 20,
      includeVat: true,
      room: quoteRoom || room || ({ id: "", name: "", widthMm: 3000, lengthMm: 3000, heightMm: 2800, obstacles: [], polygonMm: [], fixtures: [] } as any),
      appliances: [],
      settings: {} as any,
      payments: [],
      units: quoteUnits,
    };
    return calculateProjectCost(dummyProject, materialsById);
  };

  const handleCreateQuote = (label: string, note?: string) => {
    const quoteId = `q_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const quoteNumber = `عرض ${quotes.length + 1}`;
    const pricing = getQuotePricing(units, room);
    const grandTotal = pricing.grandTotal;
    const grandTotalWithVat = grandTotal * (1 + VAT_RATE);

    const newQuote: ProjectQuote = {
      id: quoteId,
      quoteNumber,
      label,
      units: JSON.parse(JSON.stringify(units)),
      room: room ? JSON.parse(JSON.stringify(room)) : undefined,
      grandTotal,
      grandTotalWithVat,
      status: "draft",
      createdAt: new Date().toISOString(),
      note,
    };

    setProjectDetails({
      ...projectDetails,
      quotes: [...quotes, newQuote],
    } as any);
  };

  const handleUpdateQuoteStatus = (
    quoteId: string,
    status: ProjectQuote["status"]
  ) => {
    const updatedQuotes = quotes.map((q) => {
      if (q.id !== quoteId) return q;
      const updates: Partial<ProjectQuote> = { status };
      if (status === "sent") updates.sentAt = new Date().toISOString();
      if (status === "accepted") updates.acceptedAt = new Date().toISOString();
      return { ...q, ...updates };
    });

    const patch: any = { quotes: updatedQuotes };
    if (status === "accepted") {
      patch.activeQuoteId = quoteId;
      const acceptedQuote = updatedQuotes.find((q) => q.id === quoteId);
      if (acceptedQuote) {
        patch.units = acceptedQuote.units;
        if (acceptedQuote.room) patch.room = acceptedQuote.room;
      }
    }

    setProjectDetails({ ...projectDetails, ...patch });
  };

  const handleDeleteQuote = (quoteId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا العرض؟")) return;
    const updatedQuotes = quotes.filter((q) => q.id !== quoteId);
    const patch: any = { quotes: updatedQuotes };
    if (activeQuoteId === quoteId) patch.activeQuoteId = undefined;
    setProjectDetails({ ...projectDetails, ...patch });
  };

  const handleUpdateLabel = (quoteId: string) => {
    const updatedQuotes = quotes.map((q) =>
      q.id === quoteId ? { ...q, label: editLabel } : q
    );
    setProjectDetails({ ...projectDetails, quotes: updatedQuotes } as any);
    setEditingQuote(null);
  };

  const toggleCompareSelection = (quoteId: string) => {
    setSelectedForCompare((prev) =>
      prev.includes(quoteId)
        ? prev.filter((id) => id !== quoteId)
        : prev.length < 3
          ? [...prev, quoteId]
          : prev
    );
  };

  const comparedQuotes = useMemo(
    () => quotes.filter((q) => selectedForCompare.includes(q.id)),
    [quotes, selectedForCompare]
  );

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar p-8 bg-zinc-950 text-white print:hidden">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto space-y-8 pb-20"
      >
        {/* Header */}
        <div className="flex justify-between items-end border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
              <GitCompareArrows className="text-emerald-500" size={32} />
              العروض المتعددة
            </h1>
            <p className="text-zinc-400">
              {projectDetails?.projectName
                ? `مشروع: ${projectDetails.projectName}`
                : "قارن بين تصميمات مختلفة واختر الأنسب للعميل"}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowCompareView(!showCompareView);
                if (!showCompareView) setSelectedForCompare([]);
              }}
              disabled={selectedForCompare.length < 2}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all border ${
                showCompareView
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                  : selectedForCompare.length >= 2
                    ? "bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800"
                    : "bg-zinc-900/50 border-zinc-800 text-zinc-600 cursor-not-allowed"
              }`}
            >
              <GitCompareArrows size={16} />
              مقارنة ({selectedForCompare.length})
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-bold text-sm hover:bg-emerald-500/30 transition-all"
            >
              <Plus size={16} />
              عرض جديد
            </button>
          </div>
        </div>

        {/* Empty State */}
        {quotes.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
              <FileText size={36} className="text-zinc-600" />
            </div>
            <h2 className="text-xl font-bold text-zinc-300 mb-2">
              لا توجد عروض بعد
            </h2>
            <p className="text-zinc-500 text-sm max-w-md mb-8">
              أنشئ عرض سعر جديد لحفظ التصميم الحالي مع السعر. يمكنك إنشاء عدة
              عروض للمقارنة وإرسالها للعميل.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
            >
              <Plus size={18} />
              إنشاء العرض الأول
            </button>
          </motion.div>
        )}

        {/* Compare View */}
        <AnimatePresence>
          {showCompareView && comparedQuotes.length >= 2 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <GitCompareArrows className="text-amber-400" />
                    جدول المقارنة
                  </h2>
                  <button
                    onClick={() => setShowCompareView(false)}
                    className="text-zinc-500 hover:text-white transition-colors text-sm"
                  >
                    إغلاق
                  </button>
                </div>
                <div className="p-6 overflow-x-auto">
                  <table className="w-full text-right">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="pb-4 font-medium text-zinc-500 text-sm w-48">
                          البند
                        </th>
                        {comparedQuotes.map((q) => (
                          <th
                            key={q.id}
                            className="pb-4 font-bold text-sm px-4 text-center"
                          >
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-emerald-400">
                                {q.quoteNumber}
                              </span>
                              <span className="text-zinc-400 text-xs font-normal">
                                {q.label}
                              </span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      <CompareRow
                        label="عدد الوحدات"
                        values={comparedQuotes.map(
                          (q) => `${q.units.length} وحدة`
                        )}
                      />
                      <CompareRow
                        label="الإجمالي قبل الضريبة"
                        values={comparedQuotes.map((q) =>
                          q.grandTotal.toLocaleString() + " EGP"
                        )}
                        highlight
                      />
                      <CompareRow
                        label="الضريبة (14%)"
                        values={comparedQuotes.map(
                          (q) =>
                            (
                              q.grandTotalWithVat - q.grandTotal
                            ).toLocaleString() + " EGP"
                        )}
                      />
                      <CompareRow
                        label="الإجمالي مع الضريبة"
                        values={comparedQuotes.map(
                          (q) =>
                            q.grandTotalWithVat.toLocaleString() + " EGP"
                        )}
                        highlight
                      />
                      <CompareRow
                        label="الحالة"
                        values={comparedQuotes.map((q) => {
                          const cfg = statusConfig[q.status];
                          return (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${cfg.bgColor} ${cfg.color} ${cfg.borderColor}`}
                            >
                              {cfg.label}
                            </span>
                          );
                        })}
                      />
                      <CompareRow
                        label="ملاحظات"
                        values={comparedQuotes.map(
                          (q) => q.note || "—"
                        )}
                      />
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quotes Grid */}
        {quotes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quotes.map((quote, idx) => {
              const cfg = statusConfig[quote.status];
              const StatusIcon = cfg.icon;
              const isActive = activeQuoteId === quote.id;
              const isSelectedForCompare = selectedForCompare.includes(
                quote.id
              );

              return (
                <motion.div
                  key={quote.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`relative bg-zinc-900/80 border rounded-2xl overflow-hidden transition-all hover:shadow-xl group ${
                    isActive
                      ? "border-emerald-500/50 shadow-emerald-500/10"
                      : isSelectedForCompare
                        ? "border-amber-500/50 shadow-amber-500/10"
                        : "border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  {/* Active badge */}
                  {isActive && (
                    <div className="absolute top-3 left-3 z-10">
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                        <CheckCircle2 size={10} />
                        Aktif
                      </span>
                    </div>
                  )}

                  {/* Compare checkbox */}
                  <button
                    onClick={() => toggleCompareSelection(quote.id)}
                    className={`absolute top-3 right-3 z-10 w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${
                      isSelectedForCompare
                        ? "bg-amber-500 border-amber-500 text-white"
                        : "bg-zinc-800 border-zinc-700 text-zinc-600 hover:border-zinc-500"
                    }`}
                  >
                    {isSelectedForCompare && (
                      <CheckCircle2 size={14} />
                    )}
                  </button>

                  {/* Card content */}
                  <div className="p-6 pt-12">
                    {/* Quote number + label */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-black text-white">
                          {quote.quoteNumber}
                        </span>
                        {editingQuote === quote.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              autoFocus
                              value={editLabel}
                              onChange={(e) => setEditLabel(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  handleUpdateLabel(quote.id);
                                if (e.key === "Escape")
                                  setEditingQuote(null);
                              }}
                              className="bg-zinc-800 border border-zinc-600 rounded-lg px-2 py-0.5 text-xs text-white outline-none w-32"
                            />
                            <button
                              onClick={() => handleUpdateLabel(quote.id)}
                              className="text-emerald-400 text-xs font-bold hover:underline"
                            >
                              حفظ
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingQuote(quote.id);
                              setEditLabel(quote.label);
                            }}
                            className="text-zinc-500 hover:text-zinc-300 transition-colors"
                          >
                            <Pencil size={12} />
                          </button>
                        )}
                      </div>
                      <p className="text-zinc-400 text-sm">{quote.label}</p>
                    </div>

                    {/* Price */}
                    <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800/50 mb-4">
                      <p className="text-xs text-zinc-500 font-bold mb-1">
                        الإجمالي مع الضريبة
                      </p>
                      <p className="text-2xl font-black text-emerald-400 font-mono">
                        {quote.grandTotalWithVat.toLocaleString()}{" "}
                        <span className="text-sm text-emerald-500/50">
                          EGP
                        </span>
                      </p>
                      <p className="text-xs text-zinc-500 mt-1 font-mono">
                        بدون ضريبة: {quote.grandTotal.toLocaleString()} EGP
                      </p>
                    </div>

                    {/* Status badge */}
                    <div className="flex items-center gap-2 mb-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cfg.bgColor} ${cfg.color} ${cfg.borderColor}`}
                      >
                        <StatusIcon size={12} />
                        {cfg.label}
                      </span>
                      <span className="text-[10px] text-zinc-600 font-mono flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(quote.createdAt).toLocaleDateString("ar-EG")}
                      </span>
                    </div>

                    {/* Units count */}
                    <div className="flex items-center gap-1 text-xs text-zinc-500 mb-4">
                      <span className="font-mono text-zinc-300">
                        {quote.units.length}
                      </span>
                      وحدة محفوظة في هذا العرض
                    </div>

                    {/* Note */}
                    {quote.note && (
                      <div className="text-xs text-zinc-400 bg-zinc-800/30 rounded-lg p-3 mb-4 border border-zinc-800/50">
                        {quote.note}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-4 border-t border-zinc-800/50">
                      {quote.status === "draft" && (
                        <button
                          onClick={() =>
                            handleUpdateQuoteStatus(quote.id, "sent")
                          }
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all text-xs font-bold"
                        >
                          <Send size={12} />
                          إرسال
                        </button>
                      )}
                      {(quote.status === "sent" ||
                        quote.status === "viewed") && (
                        <>
                          <button
                            onClick={() =>
                              handleUpdateQuoteStatus(
                                quote.id,
                                "accepted"
                              )
                            }
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all text-xs font-bold"
                          >
                            <CheckCircle2 size={12} />
                            قبول
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateQuoteStatus(
                                quote.id,
                                "rejected"
                              )
                            }
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all text-xs font-bold"
                          >
                            <XCircle size={12} />
                            رفض
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteQuote(quote.id)}
                        className="p-2 rounded-lg bg-zinc-800/50 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all border border-zinc-800"
                        title="حذف العرض"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Create Quote Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateQuoteModal
            quoteNumber={`عرض ${quotes.length + 1}`}
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateQuote}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Subcomponents ---

function CompareRow({
  label,
  values,
  highlight,
}: {
  label: string;
  values: React.ReactNode[];
  highlight?: boolean;
}) {
  return (
    <tr className={highlight ? "bg-zinc-800/20" : ""}>
      <td
        className={`py-3 text-sm ${highlight ? "font-bold text-zinc-200" : "text-zinc-400"}`}
      >
        {label}
      </td>
      {values.map((v, i) => (
        <td
          key={i}
          className={`py-3 text-center px-4 ${highlight ? "font-bold text-emerald-400" : "text-zinc-300"}`}
        >
          {v}
        </td>
      ))}
    </tr>
  );
}

function CreateQuoteModal({
  quoteNumber,
  onClose,
  onCreate,
}: {
  quoteNumber: string;
  onClose: () => void;
  onCreate: (label: string, note?: string) => void;
}) {
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <Plus size={20} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              إنشاء {quoteNumber}
            </h2>
            <p className="text-xs text-zinc-500">
              سيتم حفظ التصميم الحالي مع الأسعار
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-2">
              اسم التصميم *
            </label>
            <input
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="مثال: تصميم مودرن، تصميم كلاسيك..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-2">
              ملاحظات (اختياري)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="أي ملاحظات على هذا العرض..."
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-emerald-500/50 transition-colors resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-zinc-800 text-zinc-400 font-bold text-sm hover:bg-zinc-700 transition-all border border-zinc-700"
          >
            إلغاء
          </button>
          <button
            onClick={() => {
              if (label.trim()) {
                onCreate(label.trim(), note.trim() || undefined);
                onClose();
              }
            }}
            disabled={!label.trim()}
            className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            إنشاء العرض
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
