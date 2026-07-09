"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Calendar, ChevronLeft, FolderKanban } from 'lucide-react';
import { motion } from 'framer-motion';
import { KitchenProject } from '@/types';
import { CreateProjectModal } from '@/components/CreateProjectModal';
import { getProjects } from '@/lib/firebase/projects';
import { useAuth } from '@/contexts/AuthContext';

export default function ProjectsList() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<KitchenProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  React.useEffect(() => {
    if (user) {
      getProjects(user.uid).then(data => {
        setProjects(data);
        setIsLoading(false);
      });
    }
  }, [user]);

  
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

  const handleCreateProject = () => {
    setIsModalOpen(true);
  };

  return (
    <div className="p-10 max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-end mb-10"
      >
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">المشاريع</h1>
          <p className="text-zinc-400 text-sm">إدارة كافة مشاريع الورشة ومتابعة التصنيع والتسليم.</p>
        </div>
        <button 
          onClick={handleCreateProject}
          className="flex items-center gap-2 bg-white text-zinc-950 px-6 py-3 rounded-full font-bold hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10"
        >
          <Plus size={20} />
          <span>إنشاء مشروع</span>
        </button>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-zinc-800/80 bg-zinc-900/80 flex justify-between items-center">
          <div className="relative group">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="ابحث برقم أو اسم المشروع..." 
              className="pl-4 pr-12 py-3 bg-zinc-950/50 border border-zinc-800 rounded-2xl w-80 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-600"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-zinc-950/30 text-zinc-500 text-xs uppercase tracking-wider">
                <th className="p-6 font-semibold w-32">الرقم المرجعي</th>
                <th className="p-6 font-semibold">اسم العميل / المشروع</th>
                <th className="p-6 font-semibold">حالة المشروع</th>
                <th className="p-6 font-semibold">تاريخ التسليم</th>
                <th className="p-6 font-semibold w-32"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-zinc-500">جاري تحميل المشاريع...</td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-zinc-500">لا توجد مشاريع حتى الآن. ابدأ بإنشاء مشروعك الأول!</td>
                </tr>
              ) : (
                projects.map((proj, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * (idx + 1) }}
                    key={proj.id} 
                    className="hover:bg-zinc-800/30 transition-colors group cursor-pointer"
                  >
                  <td className="p-6">
                    <span className="font-mono text-sm text-zinc-500 group-hover:text-zinc-300 transition-colors">{proj.id}</span>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400">
                        <FolderKanban size={18} />
                      </div>
                      <span className="font-bold text-zinc-200">{proj.clientName}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusStyle(proj.status!)}`}>
                      {getStatusText(proj.status!)}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium">
                      <Calendar size={16} className="text-zinc-500" />
                      {proj.deliveryDate}
                    </div>
                  </td>
                  <td className="p-6 text-left">
                    <Link 
                      href={`/projects/${proj.id}`}
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-zinc-800 text-zinc-400 hover:bg-emerald-500 hover:text-zinc-950 transition-all"
                    >
                      <ChevronLeft size={20} />
                    </Link>
                  </td>
                </motion.tr>
              )))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <CreateProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
