"use client";

import React, { useEffect, useState } from 'react';
import { getProjectById } from '@/lib/firebase/projects';
import { useProjectStore } from '@/store/projectStore';
import { KitchenCanvas3D } from '@/components/canvas/KitchenCanvas3D';
import { calculateProjectCost } from '@/lib/pricing';
import { useSettingsStore } from '@/store/settingsStore';
import { motion } from 'framer-motion';
import { KitchenProject, Material } from '@/types';
import { CheckCircle2, Clock, MapPin, Phone, User, Building2 } from 'lucide-react';

export default function SharedProjectPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [project, setProject] = useState<KitchenProject | null>(null);
  
  const setProjectDetails = useProjectStore(state => state.setProjectDetails);
  const { materials, hardwareItems, workshopSettings } = useSettingsStore();

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const data = await getProjectById(params.id);
        if (data) {
          setProject(data);
          setProjectDetails(data); // Load into 3D Canvas
        } else {
          setError('لم يتم العثور على المشروع. قد يكون الرابط غير صحيح أو تم حذفه.');
        }
      } catch (err) {
        setError('حدث خطأ أثناء تحميل المشروع.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProject();
  }, [params.id, setProjectDetails]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full bg-zinc-950">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
        <p className="text-zinc-400 font-bold animate-pulse">جاري تحميل التصميم 3D...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-zinc-950 p-4">
        <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">عذراً</h1>
          <p className="text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  // Calculate only the final price for the client (no cost details)
  const materialsById = materials.reduce((acc, m) => ({ ...acc, [m.id]: m }), {} as Record<string, Material>);
  const costSummary = calculateProjectCost(project, materialsById);
  const finalPrice = costSummary.grandTotal;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-zinc-950 text-white" dir="rtl">
      
      {/* Header */}
      <header className="bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800 p-4 shrink-0 z-20 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <Building2 className="text-emerald-950" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-white leading-tight">{workshopSettings.name || 'ورشة مطابخ'}</h1>
              <p className="text-emerald-400 text-sm font-bold mt-1 tracking-wide">تصميم 3D تفاعلي</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 bg-zinc-950/50 px-6 py-2 rounded-2xl border border-zinc-800">
            <div className="text-center">
              <span className="block text-zinc-500 text-xs font-bold mb-1">العميل</span>
              <span className="text-white font-bold">{project.clientName}</span>
            </div>
            <div className="w-px h-8 bg-zinc-800"></div>
            <div className="text-center">
              <span className="block text-zinc-500 text-xs font-bold mb-1">إجمالي السعر</span>
              <span className="text-emerald-400 font-bold text-lg">{finalPrice.toLocaleString()} {workshopSettings.currency}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 relative">
        {/* 3D Viewer */}
        <div className="absolute inset-0 z-0">
          <KitchenCanvas3D readOnly={true} />
        </div>

        {/* Floating Info Overlay */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-8 right-8 z-10 w-80 pointer-events-none hidden md:block"
        >
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="font-bold text-lg text-white mb-4 border-b border-zinc-800 pb-3">تفاصيل المشروع</h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <div className="text-xs text-zinc-500 font-bold">الحالة</div>
                  <div className="text-sm font-bold text-zinc-200">
                    {project.status === 'design' ? 'قيد التصميم / المراجعة' : 'تم الاعتماد'}
                  </div>
                </div>
              </div>

              {project.deliveryDate && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-blue-400">
                    <Clock size={16} />
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 font-bold">تاريخ التسليم المتوقع</div>
                    <div className="text-sm font-bold text-zinc-200">{project.deliveryDate}</div>
                  </div>
                </div>
              )}

              {project.projectAddress && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-amber-400">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 font-bold">الموقع</div>
                    <div className="text-sm font-bold text-zinc-200">{project.projectAddress}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800">
              <p className="text-xs text-zinc-500 text-center leading-relaxed">
                يمكنك تحريك التصميم وسحبه بأصبعك أو بالماوس لرؤيته من كافة الزوايا.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
