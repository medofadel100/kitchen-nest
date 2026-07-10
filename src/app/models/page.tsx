"use client";

import React, { useState } from 'react';
import { Plus, Search, Filter, Box, DoorOpen, Package, Wrench, Refrigerator } from 'lucide-react';
import { ModelCategory } from '@/types';

const MODEL_CATEGORIES: { id: ModelCategory; label: string; icon: any }[] = [
  { id: 'units', label: 'الوحدات', icon: Box },
  { id: 'doors', label: 'الأبواب', icon: DoorOpen },
  { id: 'materials', label: 'الخامات', icon: Package },
  { id: 'accessories', label: 'الإكسسوارات', icon: Wrench },
  { id: 'appliances', label: 'الأجهزة', icon: Refrigerator },
];

export default function ModelsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ModelCategory>('units');
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">الموديلات المخصصة</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-zinc-950 rounded-xl font-bold hover:bg-emerald-400 transition-colors"
          >
            <Plus size={20} />
            إنشاء موديل جديد
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
            <input
              type="text"
              placeholder="بحث في الموديلات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          
          <div className="flex items-center gap-2">
            {MODEL_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-500 text-zinc-950'
                      : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <Icon size={16} />
                  <span className="text-sm font-medium">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Models Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Empty State */}
          <div className="col-span-full flex flex-col items-center justify-center py-20 bg-zinc-900/50 rounded-2xl border border-zinc-800">
            <Box size={64} className="text-zinc-700 mb-4" />
            <h3 className="text-xl font-bold text-zinc-400 mb-2">لا توجد موديلات محفوظة بعد</h3>
            <p className="text-zinc-500 mb-4">ابدأ بإنشاء موديل جديد أو استيراد موديل من مكتبة الموديلات</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-emerald-500 text-zinc-950 rounded-xl font-bold hover:bg-emerald-400 transition-colors"
            >
              إنشاء موديل جديد
            </button>
          </div>
        </div>

        {/* Create Model Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-2xl border border-zinc-800">
              <h2 className="text-2xl font-bold text-white mb-4">إنشاء موديل جديد</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">اسم الموديل</label>
                  <input
                    type="text"
                    placeholder="مثال: دجاجة معدنية فاخرة"
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">الفئة</label>
                  <select className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500">
                    {MODEL_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">الوصف (اختياري)</label>
                  <textarea
                    placeholder="وصف الموديل..."
                    rows={3}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-zinc-300 hover:text-white transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-emerald-500 text-zinc-950 rounded-lg font-bold hover:bg-emerald-400 transition-colors"
                >
                  إنشاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}