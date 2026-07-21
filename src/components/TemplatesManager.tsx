"use client";

import React, { useEffect, useState } from 'react';
import { KitchenTemplate } from '@/types';
import { getTemplates, createTemplate, deleteTemplate } from '@/lib/firebase/templates';
import { useProjectStore } from '@/store/projectStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, Plus, Trash2, Copy, X, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoadTemplate: (template: KitchenTemplate) => void;
}

export const TemplatesManager = ({ isOpen, onClose, onLoadTemplate }: Props) => {
  const [templates, setTemplates] = useState<KitchenTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const { room, units, projectSettings, projectDetails } = useProjectStore();

  useEffect(() => {
    if (isOpen) loadTemplates();
  }, [isOpen]);

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

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      await createTemplate({
        workshopId: 'default_workshop',
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
      setTemplateName('');
      setShowSaveForm(false);
      await loadTemplates();
    } catch (err) {
      alert('حدث خطأ أثناء حفظ القالب.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف القالب "${name}"؟`)) return;
    try {
      await deleteTemplate(id);
      await loadTemplates();
    } catch (err) {
      alert('حدث خطأ أثناء الحذف.');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <Bookmark size={22} className="text-amber-400" />
              <h2 className="text-lg font-bold text-white">قوالب التصميم</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Save current as template */}
            <div className="border border-zinc-800 rounded-xl p-4">
              {!showSaveForm ? (
                <button
                  onClick={() => setShowSaveForm(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-sm hover:bg-amber-500/20 transition-colors"
                >
                  <Plus size={16} />
                  حفظ التصميم الحالي كقالب
                </button>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="اسم القالب (مثلاً: مطبخ مودرن 3x4)"
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-amber-500/50"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveTemplate}
                      disabled={saving || !templateName.trim()}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-400 transition-colors disabled:opacity-50"
                    >
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Bookmark size={14} />}
                      {saving ? 'جاري الحفظ...' : 'حفظ'}
                    </button>
                    <button
                      onClick={() => { setShowSaveForm(false); setTemplateName(''); }}
                      className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-sm hover:bg-zinc-700 transition-colors"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Templates list */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-amber-400" />
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-sm">
                لا توجد قوالب محفوظة بعد
              </div>
            ) : (
              <div className="space-y-2">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-zinc-800/50 border border-zinc-800 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white text-sm truncate">{tpl.templateName}</h4>
                      <p className="text-xs text-zinc-500 mt-1">
                        {tpl.units.length} وحدة · {new Date(tpl.createdAt).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mr-3">
                      <button
                        onClick={() => onLoadTemplate(tpl)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors"
                      >
                        <Copy size={12} />
                        تحميل
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(tpl.id, tpl.templateName)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
