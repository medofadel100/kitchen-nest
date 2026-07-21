"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';
import { InventoryItem } from '@/types';
import { getInventory, addStock } from '@/lib/firebase/inventory';
import { useSettingsStore } from '@/store/settingsStore';
import { Package, Plus, Layers, Wrench, Search, History, AlertTriangle, TrendingDown, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function InventoryPage() {
  const { appUser } = useAuth();
  const { materials, hardwareItems } = useSettingsStore();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'material' | 'hardware'>('material');
  
  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  const [addNote, setAddNote] = useState('');

  useEffect(() => {
    if (appUser?.workshopId) {
      loadInventory();
    }
  }, [appUser]);

  const loadInventory = async () => {
    setLoading(true);
    const data = await getInventory(appUser!.workshopId);
    setInventory(data);
    setLoading(false);
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || quantityToAdd <= 0) return;

    let nameAr = '';
    if (activeTab === 'material') {
      nameAr = materials.find(m => m.id === selectedItemId)?.nameAr || '';
    } else {
      nameAr = hardwareItems.find(h => h.id === selectedItemId)?.nameAr || '';
    }

    await addStock(appUser!.workshopId, selectedItemId, activeTab, nameAr, quantityToAdd, addNote);
    
    setIsAddModalOpen(false);
    setSelectedItemId('');
    setQuantityToAdd(1);
    setAddNote('');
    loadInventory();
  };

  // Combine Settings items with Inventory balances
  const getDisplayItems = () => {
    if (activeTab === 'material') {
      return materials.map(mat => {
        const invItem = inventory.find(i => i.id === mat.id);
        return {
          id: mat.id,
          nameAr: mat.nameAr,
          category: mat.category,
          quantityInStock: invItem?.quantityInStock || 0,
          unit: 'لوح'
        };
      }).filter(i => i.nameAr.includes(search));
    } else {
      return hardwareItems.map(hw => {
        const invItem = inventory.find(i => i.id === hw.id);
        return {
          id: hw.id,
          nameAr: hw.nameAr,
          category: hw.category,
          quantityInStock: invItem?.quantityInStock || 0,
          unit: 'قطعة'
        };
      }).filter(i => i.nameAr.includes(search));
    }
  };

  const displayItems = getDisplayItems();

  return (
    <RoleGuard allowedRoles={['admin', 'manager', 'accountant']} fallback={
      <div className="flex items-center justify-center h-full w-full bg-zinc-950 p-4">
        <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl text-center max-w-md">
          <h2 className="text-xl font-bold text-red-400 mb-2">عفواً، لا تملك صلاحية</h2>
          <p className="text-red-300/80">صفحة المخزن مخصصة للمديرين والمحاسبين فقط.</p>
        </div>
      </div>
    }>
      <div className="flex flex-col h-full bg-zinc-950 text-white p-8 overflow-y-auto" dir="rtl">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center">
                <Package size={24} />
              </div>
              المخزن (Inventory)
            </h1>
            <p className="text-zinc-500 mt-2">إدارة أرصدة الخامات والإكسسوارات للورشة.</p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 px-6 py-3 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)]"
          >
            <Plus size={20} />
            إضافة فاتورة شراء (إدخال للمخزن)
          </button>
        </div>

        {/* Tabs & Search */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
          <div className="flex gap-2 bg-zinc-900/50 p-1.5 rounded-2xl w-fit border border-zinc-800/80">
            <button 
              onClick={() => setActiveTab('material')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all text-sm ${activeTab === 'material' ? 'bg-amber-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'}`}
            >
              <Layers size={18} />
              <span>ألواح الخشب</span>
            </button>
            <button 
              onClick={() => setActiveTab('hardware')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all text-sm ${activeTab === 'hardware' ? 'bg-amber-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'}`}
            >
              <Wrench size={18} />
              <span>الإكسسوارات</span>
            </button>
          </div>

          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-zinc-500">
              <Search size={18} />
            </div>
            <input 
              type="text" 
              placeholder="ابحث عن صنف في المخزن..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pr-11 pl-4 focus:outline-none focus:border-amber-500 transition-colors text-white"
            />
          </div>
        </div>

        {/* Inventory Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <Package size={20} />
                  </div>
                  <span className="text-zinc-400 text-sm font-bold">إجمالي الأصناف</span>
                </div>
                <div className="text-3xl font-black text-white">{displayItems.length}</div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
                    <AlertTriangle size={20} />
                  </div>
                  <span className="text-zinc-400 text-sm font-bold">أصناف نفدت (0)</span>
                </div>
                <div className="text-3xl font-black text-red-400">{displayItems.filter(i => i.quantityInStock === 0).length}</div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                    <TrendingDown size={20} />
                  </div>
                  <span className="text-zinc-400 text-sm font-bold">أصناف قرب النفاد (≤3)</span>
                </div>
                <div className="text-3xl font-black text-orange-400">{displayItems.filter(i => i.quantityInStock > 0 && i.quantityInStock <= 3).length}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayItems.map(item => (
                <div key={item.id} className={`bg-zinc-900 border rounded-2xl p-5 hover:border-amber-500/50 transition-colors ${
                  item.quantityInStock === 0 ? 'border-red-500/30 bg-red-500/5' :
                  item.quantityInStock <= 3 ? 'border-orange-500/30 bg-orange-500/5' :
                  'border-zinc-800'
                }`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      item.quantityInStock === 0 ? 'bg-red-500/10 text-red-400' :
                      item.quantityInStock <= 3 ? 'bg-orange-500/10 text-orange-400' :
                      'bg-zinc-800 text-zinc-400'
                    }`}>
                      {item.quantityInStock === 0 ? <AlertTriangle size={20} /> :
                       item.quantityInStock <= 3 ? <TrendingDown size={20} /> :
                       (activeTab === 'material' ? <Layers size={20} /> : <Wrench size={20} />)}
                    </div>
                    <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded-md">{item.category}</span>
                  </div>
                  <h3 className="font-bold text-white mb-4 line-clamp-1">{item.nameAr}</h3>
                  
                  <div className="flex justify-between items-end border-t border-zinc-800/50 pt-4">
                    <span className="text-zinc-500 text-sm">الرصيد المتاح:</span>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-2xl font-black ${item.quantityInStock <= 3 && item.quantityInStock > 0 ? 'text-orange-400' : item.quantityInStock === 0 ? 'text-red-500' : 'text-emerald-400'}`}>
                        {item.quantityInStock}
                      </span>
                      <span className="text-zinc-500 text-xs">{item.unit}</span>
                    </div>
                  </div>
                  {item.quantityInStock === 0 && (
                    <div className="mt-3 text-xs text-red-400 font-bold bg-red-500/10 rounded-lg px-3 py-1.5 text-center">
                      نفد من المخزن - يرجى الشراء
                    </div>
                  )}
                  {item.quantityInStock > 0 && item.quantityInStock <= 3 && (
                    <div className="mt-3 text-xs text-orange-400 font-bold bg-orange-500/10 rounded-lg px-3 py-1.5 text-center">
                      يقترب من النفاد - يُنصح بإعادة الطلب
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

      </div>

      {/* Add Stock Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir="rtl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            <h2 className="text-xl font-bold text-white mb-2">إضافة كمية للمخزن</h2>
            <p className="text-sm text-zinc-500 mb-6">قم بإدخال كميات المشتريات الجديدة للرصيد.</p>
            
            <form onSubmit={handleAddStock} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5">اختر الصنف ({activeTab === 'material' ? 'خامات' : 'إكسسوار'})</label>
                <select 
                  value={selectedItemId}
                  onChange={e => setSelectedItemId(e.target.value)}
                  required 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none appearance-none"
                >
                  <option value="">-- اضغط لاختيار الصنف --</option>
                  {(activeTab === 'material' ? materials : hardwareItems).map(item => (
                    <option key={item.id} value={item.id}>{item.nameAr}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5">الكمية المضافة</label>
                <input 
                  type="number" 
                  value={quantityToAdd}
                  onChange={e => setQuantityToAdd(Number(e.target.value))}
                  required 
                  min="1" 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5">رقم الفاتورة / ملاحظات (اختياري)</label>
                <input 
                  type="text" 
                  value={addNote}
                  onChange={e => setAddNote(e.target.value)}
                  placeholder="مثال: فاتورة رقم 123 من المورد..." 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" 
                />
              </div>

              <div className="flex gap-3 mt-8">
                <button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 py-3 rounded-xl font-bold transition-colors">إضافة للرصيد</button>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-bold transition-colors">إلغاء</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </RoleGuard>
  );
}
