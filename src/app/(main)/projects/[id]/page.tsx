"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ToolsSidebar } from "@/components/ToolsSidebar";
import { RoomSetupWizard } from "@/components/RoomSetupWizard";
import { useProjectStore } from "@/store/projectStore";
import { getProjectById } from "@/lib/firebase/projects";
import { motion, AnimatePresence } from "framer-motion";
import { Map, Ruler, Settings2, Calculator, PaintBucket, Share2, Bookmark } from "lucide-react";
import { PricingDashboard } from "@/components/PricingDashboard";
import { ProjectSettingsModal } from "@/components/ProjectSettingsModal";
import { ProductionModal } from "@/components/ProductionModal";
import { Scissors } from "lucide-react";
import { SplashLoader } from "@/components/SplashLoader";
import { TemplatesManager } from "@/components/TemplatesManager";

const KitchenCanvas = dynamic(() => import("@/components/canvas/KitchenCanvas").then(mod => mod.KitchenCanvas), { 
  ssr: false,
  loading: () => <SplashLoader text="جاري تحميل مساحة العمل 2D..." />
});

const KitchenCanvas3D = dynamic(() => import("@/components/canvas/KitchenCanvas3D").then(mod => mod.KitchenCanvas3D), { 
  ssr: false,
  loading: () => <SplashLoader text="جاري تحميل مساحة العمل 3D..." />
});

export default function ProjectWorkspace({ params }: { params: { id: string } }) {
  const { isRoomSetupComplete, displayUnit, setDisplayUnit, loadProjectData } = useProjectStore();
  const [viewMode, setViewMode] = React.useState<'2d' | '3d'>('2d');
  const [activeTab, setActiveTab] = React.useState<'design' | 'pricing'>('design');
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isProductionOpen, setIsProductionOpen] = React.useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isLoadingProject, setIsLoadingProject] = React.useState(true);
  const [isSharingLink, setIsSharingLink] = React.useState(false);

  const handleSaveProject = async () => {
    setIsSaving(true);
    try {
      const state = useProjectStore.getState();
      // Import dynamically to avoid loading firebase if not needed, or just import at top. Let's import directly.
      const { updateProject } = await import("@/lib/firebase/projects");
      
      const dataToSave = {
        ...(state.room ? { room: state.room } : {}),
        units: state.units,
        // appliances: state.appliances, // Not in store yet, maybe added later
        settings: state.projectSettings,
        updatedAt: new Date().toISOString()
      };
      
      await updateProject(params.id, dataToSave);
      alert("تم حفظ المشروع بنجاح! 🚀");
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء حفظ المشروع. تأكد من اتصال الإنترنت.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    setIsSharingLink(true);
    try {
      // تحقق أولاً لو المشروع عنده shareToken محفوظ
      const currentProject = await getProjectById(params.id);
      let token = currentProject?.shareToken;

      if (!token) {
        // ولّد token جديد عشوائي وآمن واحفظه على Firestore
        const { nanoid } = await import('nanoid');
        token = nanoid(16);
        const { updateProject } = await import("@/lib/firebase/projects");
        await updateProject(params.id, { shareToken: token });
      }

      const url = `${window.location.origin}/share/${token}`;
      await navigator.clipboard.writeText(url);
      alert(`تم نسخ رابط العميل الآمن! 🔗\n\n${url}`);
    } catch (error) {
      console.error('Share error:', error);
      alert('حدث خطأ أثناء إنشاء رابط المشاركة.');
    } finally {
      setIsSharingLink(false);
    }
  };

  React.useEffect(() => {
    let isMounted = true;

    const fetchProject = async () => {
      try {
        setIsLoadingProject(true);
        const project = await getProjectById(params.id);
        if (isMounted && project) {
          loadProjectData(project);
        }
      } catch (error) {
        console.error('Failed to load project:', error);
      } finally {
        if (isMounted) {
          setIsLoadingProject(false);
        }
      }
    };

    fetchProject();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete') {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
        
        const state = useProjectStore.getState();
        const selected = state.selectedElements;
        if (selected.length > 0) {
          selected.forEach(s => {
            if (s.type === 'unit') state.deleteUnit(s.id);
            if (s.type === 'fixture') state.deleteRoomFixture(s.id);
            if (s.type === 'obstacle') state.deleteRoomObstacle(s.id);
          });
          state.selectElement(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      isMounted = false;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [params.id, loadProjectData]);

  if (isLoadingProject) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-100">
        <SplashLoader text="جاري تحميل المشروع من السحابة..." />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <AnimatePresence>
        {!isRoomSetupComplete && !isLoadingProject && <RoomSetupWizard key="wizard" />}
      </AnimatePresence>
      
      {/* Sidebar on the right (RTL) */}
      <ToolsSidebar />
      
      {/* Main Workspace */}
      <div className="flex-1 flex flex-col relative">
        <header className="h-20 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md flex justify-between items-center px-8 z-10 shrink-0">
          <div className="flex-1 min-w-max">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white tracking-tight">مساحة التصميم {viewMode === '2d' ? '2D' : '3D'}</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                {params.id}
              </span>
            </div>
            <p className="text-zinc-500 text-xs mt-1">الوضع المعماري النشط - كل مربع في الشبكة يمثل 500مم</p>
          </div>
          
          <div className="flex justify-center flex-1">
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl p-1">
            <button 
              onClick={() => setActiveTab('design')}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'design' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
            >
              <PaintBucket size={16} />
              التصميم
            </button>
            <button 
              onClick={() => setActiveTab('pricing')}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'pricing' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
            >
              <Calculator size={16} />
              الحسابات والتسعير
            </button>
          </div>
          </div>

          <div className="flex-1 flex items-center justify-end gap-2 xl:gap-4">
            
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center justify-center p-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="إعدادات المشروع"
            >
              <Settings2 size={20} />
            </button>

            <button
              onClick={() => setIsTemplatesOpen(true)}
              className="flex items-center justify-center p-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition-colors"
              title="القوالب"
            >
              <Bookmark size={20} />
            </button>

            <button 
              onClick={handleSaveProject}
              disabled={isSaving}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all ${isSaving ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.3)]'}`}
            >
              {isSaving ? "جاري الحفظ..." : "حفظ المشروع"}
            </button>

            <button 
              onClick={handleShare}
              disabled={isSharingLink}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all ${isSharingLink ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-400 text-zinc-950 shadow-[0_0_20px_rgba(59,130,246,0.3)]'}`}
            >
              <Share2 size={18} />
              {isSharingLink ? 'جاري إنشاء الرابط...' : 'مشاركة للعميل'}
            </button>

            <button 
              onClick={() => setIsProductionOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all ml-2"
            >
              <Scissors size={18} />
              تحويل للتصنيع
            </button>
          </div>
        </header>

        <ProjectSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        <ProductionModal isOpen={isProductionOpen} onClose={() => setIsProductionOpen(false)} projectId={params.id} />
        <TemplatesManager
          isOpen={isTemplatesOpen}
          onClose={() => setIsTemplatesOpen(false)}
          onLoadTemplate={(tpl) => {
            const { loadProjectData } = useProjectStore.getState();
            loadProjectData({
              ...tpl,
              projectName: '',
              workshopId: 'default_workshop',
              clientName: '',
              status: 'design',
              profitMarginPercent: 30,
              payments: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as any);
            setIsTemplatesOpen(false);
          }}
        />
        
        <div className="flex-1 relative bg-zinc-950 overflow-hidden flex flex-col">
          {activeTab === 'design' ? (
            <div className="w-full h-full relative bg-[url('/grid.svg')] bg-center bg-repeat p-6">
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-0 pointer-events-none"></div>
              
              {/* Floating Canvas Controls */}
              <div className="absolute top-6 right-6 z-20 flex flex-col gap-3">
                <div className="flex bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-full p-1 shadow-lg">
                  <button 
                    onClick={() => setViewMode('2d')}
                    className={`px-6 py-2 rounded-full text-sm font-bold transition-colors ${viewMode === '2d' ? 'bg-emerald-500 text-zinc-950' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                  >
                    2D View
                  </button>
                  <button 
                    onClick={() => setViewMode('3d')}
                    className={`px-6 py-2 rounded-full text-sm font-bold transition-colors ${viewMode === '3d' ? 'bg-emerald-500 text-zinc-950' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                  >
                    3D View
                  </button>
                </div>

                <div className="flex bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-full p-1 shadow-lg w-max">
                  {(['mm', 'cm', 'm'] as const).map(unit => (
                    <button
                      key={unit}
                      onClick={() => setDisplayUnit(unit)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition-colors ${displayUnit === unit ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'}`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full h-full relative z-10 rounded-3xl overflow-hidden border border-zinc-800/50 shadow-2xl bg-zinc-900/40 backdrop-blur-sm"
              >
                {viewMode === '2d' ? <KitchenCanvas /> : <KitchenCanvas3D />}
              </motion.div>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full h-full"
            >
              <PricingDashboard />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
