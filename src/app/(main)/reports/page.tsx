"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';
import { KitchenProject } from '@/types';
import { getProjects } from '@/lib/firebase/projects';
import { BarChart3, TrendingUp, Users, Package, DollarSign, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ReportsPage() {
  const { appUser } = useAuth();
  const [projects, setProjects] = useState<KitchenProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (appUser?.workshopId) {
      loadProjects();
    }
  }, [appUser]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await getProjects(appUser!.workshopId);
      setProjects(data);
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const totalProjects = projects.length;
  const statusCounts = projects.reduce((acc, p) => {
    acc[p.status || 'design'] = (acc[p.status || 'design'] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalRevenue = projects.reduce((sum, p) => {
    const price = (p as any).quoteGrandTotalWithVat || (p as any).grandTotal || 0;
    return sum + price;
  }, 0);

  const avgProjectValue = totalProjects > 0 ? totalRevenue / totalProjects : 0;

  const clientCounts = projects.reduce((acc, p) => {
    const name = p.clientName || 'غير محدد';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topClients = Object.entries(clientCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['admin', 'manager']} fallback={
      <div className="flex items-center justify-center h-full w-full bg-zinc-950 p-4">
        <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl text-center max-w-md">
          <h2 className="text-xl font-bold text-red-400 mb-2">عفواً، لا تملك صلاحية</h2>
          <p className="text-red-300/80">صفحة التقارير مخصصة للمديرين فقط.</p>
        </div>
      </div>
    }>
      <div className="flex flex-col h-full bg-zinc-950 text-white p-8 overflow-y-auto" dir="rtl">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
              <BarChart3 size={24} />
            </div>
            التقارير الإدارية
          </h1>
          <p className="text-zinc-500 mt-2">نظرة عامة على أداء الورشة والمشاريع.</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Package size={24} />
              </div>
              <span className="text-zinc-400 text-sm font-bold">إجمالي المشاريع</span>
            </div>
            <div className="text-4xl font-black text-white">{totalProjects}</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                <DollarSign size={24} />
              </div>
              <span className="text-zinc-400 text-sm font-bold">إجمالي الإيرادات</span>
            </div>
            <div className="text-4xl font-black text-amber-400">{totalRevenue.toLocaleString()} <span className="text-lg text-amber-500/50">EGP</span></div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                <TrendingUp size={24} />
              </div>
              <span className="text-zinc-400 text-sm font-bold">متوسط قيمة المشروع</span>
            </div>
            <div className="text-4xl font-black text-blue-400">{avgProjectValue.toLocaleString()} <span className="text-lg text-blue-500/50">EGP</span></div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
                <Users size={24} />
              </div>
              <span className="text-zinc-400 text-sm font-bold">عدد العملاء</span>
            </div>
            <div className="text-4xl font-black text-violet-400">{Object.keys(clientCounts).length}</div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Project Status Distribution */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <BarChart3 size={18} className="text-emerald-400" />
              توزيع حالات المشاريع
            </h3>
            <div className="space-y-4">
              {[
                { key: 'design', label: 'قيد التصميم', color: 'bg-sky-500' },
                { key: 'client_review', label: 'مراجعة العميل', color: 'bg-blue-500' },
                { key: 'approved', label: 'تم التعاقد', color: 'bg-emerald-500' },
                { key: 'in_production', label: 'في التصنيع', color: 'bg-amber-500' },
                { key: 'installed', label: 'تم التسليم', color: 'bg-green-500' },
              ].map(({ key, label, color }) => {
                const count = statusCounts[key] || 0;
                const percent = totalProjects > 0 ? (count / totalProjects) * 100 : 0;
                return (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-zinc-300 font-bold">{label}</span>
                      <span className="text-sm text-zinc-500 font-mono">{count} ({Math.round(percent)}%)</span>
                    </div>
                    <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Top Clients */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Users size={18} className="text-violet-400" />
              أكثر العملاء
            </h3>
            {topClients.length === 0 ? (
              <p className="text-zinc-500 text-center py-8">لا توجد بيانات كافия</p>
            ) : (
              <div className="space-y-3">
                {topClients.map(([name, count], idx) => (
                  <div key={name} className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-300">
                        {idx + 1}
                      </div>
                      <span className="font-bold text-white text-sm">{name}</span>
                    </div>
                    <span className="text-zinc-400 text-sm font-mono">{count} مشروع</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Recent Projects */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 lg:col-span-2">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Calendar size={18} className="text-amber-400" />
              أحدث المشاريع
            </h3>
            {recentProjects.length === 0 ? (
              <p className="text-zinc-500 text-center py-8">لا توجد مشاريع بعد</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {recentProjects.map((proj) => {
                  const price = (proj as any).quoteGrandTotalWithVat || (proj as any).grandTotal || 0;
                  return (
                    <div key={proj.id} className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                      <h4 className="font-bold text-white text-sm truncate mb-2">{proj.clientName}</h4>
                      <p className="text-xs text-zinc-500 truncate mb-2">{proj.projectName || 'تصميم مطبخ'}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-emerald-400 font-mono font-bold">
                          {price > 0 ? `${price.toLocaleString()} EGP` : '-'}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          proj.status === 'installed' ? 'bg-emerald-500/10 text-emerald-400' :
                          proj.status === 'in_production' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-zinc-700 text-zinc-300'
                        }`}>
                          {proj.status === 'design' ? 'تصميم' :
                           proj.status === 'client_review' ? 'مراجعة' :
                           proj.status === 'approved' ? 'تعاقد' :
                           proj.status === 'in_production' ? 'تصنيع' :
                           proj.status === 'installed' ? 'تسليم' : proj.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </RoleGuard>
  );
}
