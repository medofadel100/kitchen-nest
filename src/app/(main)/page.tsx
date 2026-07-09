"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderKanban, TrendingUp, Users, ArrowUpRight, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { CreateProjectModal } from "@/components/CreateProjectModal";

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const router = useRouter();
  
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

  const imageVariants: any = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 20 } }
  };

  const handleCreateProject = () => {
    setIsModalOpen(true);
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
            <span className="flex items-center text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
              +12% <ArrowUpRight size={12} className="ml-1" />
            </span>
          </div>
          <div>
            <p className="text-zinc-400 font-medium text-sm mb-1">المشاريع النشطة</p>
            <p className="text-4xl font-black text-white">12</p>
          </div>
        </motion.div>
        
        {/* Card 2 */}
        <motion.div variants={itemVariants} className="group relative bg-zinc-900/50 backdrop-blur-sm p-6 rounded-3xl border border-zinc-800/80 shadow-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
              <TrendingUp size={24} />
            </div>
            <span className="flex items-center text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
              +24% <ArrowUpRight size={12} className="ml-1" />
            </span>
          </div>
          <div>
            <p className="text-zinc-400 font-medium text-sm mb-1">إجمالي الإيرادات</p>
            <p className="text-4xl font-black text-white tracking-tight">45,000 <span className="text-lg text-zinc-500 font-bold">ج.م</span></p>
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
            <p className="text-zinc-400 font-medium text-sm mb-1">عملاء جدد</p>
            <p className="text-4xl font-black text-white">4</p>
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
        
        <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-2xl">
          <FolderKanban size={48} className="mx-auto text-zinc-700 mb-4" />
          <h3 className="text-zinc-300 font-semibold mb-2">لا توجد نشاطات حديثة</h3>
          <p className="text-zinc-500 text-sm mb-6 max-w-sm mx-auto">ابدأ بإنشاء أول مشروع لك لإدارة الخامات والتقطيع وحساب التكلفة بدقة.</p>
          <Link href="/projects" className="inline-flex items-center justify-center px-6 py-2.5 bg-zinc-100 text-zinc-900 rounded-full font-bold hover:bg-white transition-colors">
            إضافة مشروع الآن
          </Link>
        </div>
      </motion.div>

      <CreateProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
