"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderKanban, TrendingUp, Users, ArrowUpRight, Zap, Calendar, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { CreateProjectModal } from "@/components/CreateProjectModal";
import { getProjects } from "@/lib/firebase/projects";
import { useAuth } from "@/contexts/AuthContext";
import { KitchenProject } from "@/types";

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<KitchenProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    if (user) {
      getProjects(user.uid).then(data => {
        // Sort projects by createdAt descending
        const sorted = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setProjects(sorted);
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const containerVariants: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const handleCreateProject = () => {
    setIsModalOpen(true);
  };

  const activeProjects = projects.filter(p => p.status !== 'installed').length;
  const uniqueClients = new Set(projects.map(p => p.clientName)).size;
  const totalRevenue = projects.reduce((total, proj) => {
    const projRevenue = proj.payments?.reduce((sum, p) => p.isPaid ? sum + p.amount : sum, 0) || 0;
    return total + projRevenue;
  }, 0);

  const recentProjects = projects.slice(0, 3);

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'design': return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'in_production': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'installed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'design': return 'قيد التصميم';
      case 'client_review': return 'مراجعة العميل';
      case 'approved': return 'تم التعاقد';
      case 'in_production': return 'في التصنيع';
      case 'installed': return 'تم التسليم';
      default: return status;
    }
  };

  return (
    <div className="p-10 max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-end mb-12"
      >
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">مرحباً بك في لوحة التحكم</h1>
          <p className="text-zinc-400 text-sm">نظرة عامة على أداء ورشتك ومشاريعك الحالية.</p>
        </div>
        <button 
          onClick={handleCreateProject}
          className="group relative flex items-center gap-2 bg-emerald-500 text-zinc-950 px-6 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all duration-300 hover:-translate-y-0.5"
        >
          <Zap size={18} className="fill-zinc-950" />
          <span>مشروع جديد</span>
        </button>
      </motion.div>
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
      >
        {/* Card 1 */}
        <motion.div variants={itemVariants} className="group relative bg-zinc-900/50 backdrop-blur-sm p-6 rounded-3xl border border-zinc-800/80 shadow-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl">
              <FolderKanban size={24} />
            </div>
          </div>
          <div>
            <p className="text-zinc-400 font-medium text-sm mb-1">المشاريع النشطة</p>
            <p className="text-4xl font-black text-white">{isLoading ? '...' : activeProjects}</p>
          </div>
        </motion.div>
        
        {/* Card 2 */}
        <motion.div variants={itemVariants} className="group relative bg-zinc-900/50 backdrop-blur-sm p-6 rounded-3xl border border-zinc-800/80 shadow-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
              <TrendingUp size={24} />
            </div>
          </div>
          <div>
            <p className="text-zinc-400 font-medium text-sm mb-1">إجمالي الإيرادات المحصلة</p>
            <p className="text-4xl font-black text-white tracking-tight">{isLoading ? '...' : totalRevenue.toLocaleString()} <span className="text-lg text-zinc-500 font-bold">ج.م</span></p>
          </div>
        </motion.div>
        
        {/* Card 3 */}
        <motion.div variants={itemVariants} className="group relative bg-zinc-900/50 backdrop-blur-sm p-6 rounded-3xl border border-zinc-800/80 shadow-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-2xl">
              <Users size={24} />
            </div>
          </div>
          <div>
            <p className="text-zinc-400 font-medium text-sm mb-1">إجمالي العملاء</p>
            <p className="text-4xl font-black text-white">{isLoading ? '...' : uniqueClients}</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-zinc-900/40 backdrop-blur-sm p-8 rounded-3xl border border-zinc-800/80 shadow-xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">أحدث المشاريع</h2>
          <Link href="/projects" className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
            عرض الكل
          </Link>
        </div>
        
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-zinc-400">جاري تحميل البيانات...</p>
          </div>
        ) : recentProjects.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-2xl">
            <FolderKanban size={48} className="mx-auto text-zinc-700 mb-4" />
            <h3 className="text-zinc-300 font-semibold mb-2">لا توجد مشاريع حديثة</h3>
            <p className="text-zinc-500 text-sm mb-6 max-w-sm mx-auto">ابدأ بإنشاء أول مشروع لك لإدارة الخامات والتقطيع وحساب التكلفة بدقة.</p>
            <button onClick={handleCreateProject} className="inline-flex items-center justify-center px-6 py-2.5 bg-zinc-100 text-zinc-900 rounded-full font-bold hover:bg-white transition-colors">
              إضافة مشروع الآن
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-zinc-950/30 text-zinc-500 text-xs uppercase tracking-wider border-b border-zinc-800/50">
                  <th className="p-4 font-semibold w-32">الرقم المرجعي</th>
                  <th className="p-4 font-semibold">اسم العميل</th>
                  <th className="p-4 font-semibold">حالة المشروع</th>
                  <th className="p-4 font-semibold">تاريخ التسليم</th>
                  <th className="p-4 font-semibold w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {recentProjects.map((proj) => (
                  <tr key={proj.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="p-4">
                      <span className="font-mono text-xs text-zinc-500">{proj.id.substring(0,8)}...</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
                          <FolderKanban size={14} />
                        </div>
                        <span className="font-bold text-zinc-200 text-sm">{proj.clientName}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusStyle(proj.status!)}`}>
                        {getStatusText(proj.status!)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
                        <Calendar size={14} className="text-zinc-500" />
                        {proj.deliveryDate || 'غير محدد'}
                      </div>
                    </td>
                    <td className="p-4 text-left">
                      <Link 
                        href={`/projects/${proj.id}`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:bg-emerald-500 hover:text-zinc-950 transition-all"
                      >
                        <ChevronLeft size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <CreateProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
