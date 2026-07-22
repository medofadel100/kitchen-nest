"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, User, Phone, MapPin, Calendar, HardHat, Briefcase } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useProjectStore } from '@/store/projectStore';
import { useAuth } from '@/contexts/AuthContext';
import { createProject } from '@/lib/firebase/projects';
import { KitchenProject, ProjectSettings } from '@/types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateProjectModal = ({ isOpen, onClose }: CreateProjectModalProps) => {
  const router = useRouter();
  const setProjectDetails = useProjectStore(state => state.setProjectDetails);
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    projectName: '',
    clientName: '',
    clientPhone: '',
    projectAddress: '',
    engineerName: '',
    deliveryDate: '',
    projectSource: 'direct_client' as 'engineering_office' | 'direct_client',
    officeName: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { projectSettings } = useProjectStore.getState();
      const prjRef = `PRJ-${Math.floor(Math.random() * 9000) + 1000}`;
      
      const newProjectData: Omit<KitchenProject, "id"> = {
        workshopId: user.uid,
        ...formData,
        status: 'design',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        profitMarginPercent: 30, // Default, can be updated later
        includeVat: true,
        units: [],
        settings: projectSettings,
        room: {
          id: 'room_1',
          name: 'المطبخ',
          widthMm: 3000,
          lengthMm: 3000,
          heightMm: 2800,
          polygonMm: [],
          fixtures: [],
          obstacles: []
        },
        appliances: [],
        payments: []
      };

      const savedProject = await createProject(newProjectData);
      
      // Update local store so the editor has it immediately (optional, as the editor might fetch it)
      setProjectDetails(savedProject);

      // Navigate to project using the Firebase generated ID
      router.push(`/projects/${savedProject.id}`);
      onClose();
    } catch (error) {
      console.error("Error creating project", error);
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Building2 className="text-emerald-500" />
                مشروع جديد
              </h2>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400 block">اسم المشروع</label>
                  <div className="relative">
                    <Building2 className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input 
                      required
                      type="text" 
                      value={formData.projectName}
                      onChange={e => setFormData({...formData, projectName: e.target.value})}
                      placeholder="مثال: فيلا التجمع الخامس"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-4 pr-12 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400 block">اسم العميل (المالك)</label>
                  <div className="relative">
                    <User className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input 
                      required
                      type="text" 
                      value={formData.clientName}
                      onChange={e => setFormData({...formData, clientName: e.target.value})}
                      placeholder="اسم العميل"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-4 pr-12 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400 block">رقم الهاتف</label>
                  <div className="relative">
                    <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input 
                      type="tel" 
                      value={formData.clientPhone}
                      onChange={e => setFormData({...formData, clientPhone: e.target.value})}
                      placeholder="01xxxxxxxxx"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-4 pr-12 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400 block">العنوان</label>
                  <div className="relative">
                    <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input 
                      type="text" 
                      value={formData.projectAddress}
                      onChange={e => setFormData({...formData, projectAddress: e.target.value})}
                      placeholder="عنوان التركيب"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-4 pr-12 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400 block">المهندس المسؤول</label>
                  <div className="relative">
                    <HardHat className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input 
                      type="text" 
                      value={formData.engineerName}
                      onChange={e => setFormData({...formData, engineerName: e.target.value})}
                      placeholder="اسم مهندس التصميم/التنفيذ"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-4 pr-12 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400 block">تاريخ التسليم المتوقع</label>
                  <div className="relative">
                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input 
                      required
                      type="date" 
                      value={formData.deliveryDate}
                      onChange={e => setFormData({...formData, deliveryDate: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-4 pr-12 text-white focus:outline-none focus:border-emerald-500/50 [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400 block">مصدر المشروع</label>
                  <div className="relative">
                    <Briefcase className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <select 
                      value={formData.projectSource}
                      onChange={e => setFormData({...formData, projectSource: e.target.value as any})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-4 pr-12 text-white focus:outline-none focus:border-emerald-500/50 appearance-none"
                    >
                      <option value="direct_client">عميل مباشر</option>
                      <option value="engineering_office">مكتب هندسي</option>
                    </select>
                  </div>
                </div>

                {formData.projectSource === 'engineering_office' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-emerald-400 block">اسم المكتب الهندسي</label>
                    <div className="relative">
                      <Building2 className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500/50" size={18} />
                      <input 
                        required
                        type="text" 
                        value={formData.officeName}
                        onChange={e => setFormData({...formData, officeName: e.target.value})}
                        placeholder="أدخل اسم المكتب الهندسي"
                        className="w-full bg-zinc-950 border border-emerald-500/30 rounded-xl py-3 pl-4 pr-12 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}

              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-zinc-800">
                <button 
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-500 text-emerald-950 px-8 py-2.5 rounded-xl font-bold hover:bg-emerald-400 transition-colors shadow-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء المشروع وبدء التصميم'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
