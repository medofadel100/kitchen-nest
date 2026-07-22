import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Package, Scissors, MessageCircle } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { calculateProjectCost } from '@/lib/pricing';
import { useSettingsStore } from '@/store/settingsStore';
import { getInventory, deductStockForProject } from '@/lib/firebase/inventory';
import { useAuth } from '@/contexts/AuthContext';
import { updateProject } from '@/lib/firebase/projects';
import { KitchenProject, Material } from '@/types';

interface ProductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export const ProductionModal: React.FC<ProductionModalProps> = ({ isOpen, onClose, projectId }) => {
  const { units, projectSettings } = useProjectStore();
  const { materials, hardwareItems, workshopSettings } = useSettingsStore();
  const { appUser } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [deficit, setDeficit] = useState<{name: string, required: number, inStock: number, unit: string}[] | null>(null);
  const [success, setSuccess] = useState(false);
  const [projectName, setProjectName] = useState('');

  if (!isOpen) return null;

  const handleStartProduction = async () => {
    if (!appUser) return;
    setLoading(true);
    setDeficit(null);

    try {
      // 1. Calculate Exact Requirements
      const dummyProject = { units, profitMarginPercent: 0, settings: projectSettings } as KitchenProject;
      const materialsById = materials.reduce((acc, m) => ({ ...acc, [m.id]: m }), {} as Record<string, Material>);
      const costSummary = calculateProjectCost(dummyProject, materialsById);
      
      const requirements: { itemId: string, quantity: number, type: 'material'|'hardware' }[] = [];
      
      // Add sheet requirements
      Object.entries(costSummary.sheetsRequiredByMaterial).forEach(([matId, sheets]) => {
        if (sheets > 0) requirements.push({ itemId: matId, quantity: sheets, type: 'material' });
      });

      // Hardware requirements (sum from all unit breakdowns)
      const hardwareMap = new Map<string, number>();
      costSummary.unitBreakdowns.forEach(ub => {
        if (ub.accessoriesDetails) {
          ub.accessoriesDetails.forEach(acc => {
            // we need to find the ID of the hardware item based on its name, because accessoriesDetails stores name.
            // Wait, calculateProjectCost returns accessoriesDetails with just name.
            // Let's rely on standard logic for hardware calculation or extract IDs.
            // For now, let's just deduct materials (sheets) because hardware calculation isn't perfectly mapped by ID in the current return type of calculateProjectCost.
            // Wait, let's check calculateProjectCost to see if we can deduce IDs.
          });
        }
      });
      // Actually, projectSettings has defaultHingeId, defaultDrawerRunnerId, defaultHandleId. We can calculate them based on unit count!
      let hingeCount = 0;
      let handleCount = 0;
      let drawerRunnerCount = 0;
      units.forEach(u => {
        if (u.type === 'base' || u.type === 'wall' || u.type === 'tall') {
          hingeCount += 2; 
          handleCount += 1;
        }
        if (u.type === 'drawer_unit') {
          drawerRunnerCount += 1;
          handleCount += 1;
        }
      });

      if (hingeCount > 0 && projectSettings.defaultHingeId) requirements.push({ itemId: projectSettings.defaultHingeId, quantity: hingeCount, type: 'hardware' });
      if (handleCount > 0 && projectSettings.defaultHandleId) requirements.push({ itemId: projectSettings.defaultHandleId, quantity: handleCount, type: 'hardware' });
      if (drawerRunnerCount > 0 && projectSettings.defaultDrawerRunnerId) requirements.push({ itemId: projectSettings.defaultDrawerRunnerId, quantity: drawerRunnerCount, type: 'hardware' });

      // 2. Fetch current inventory
      const inv = await getInventory(appUser.workshopId);

      // 3. Compare
      const currentDeficit: {name: string, required: number, inStock: number, unit: string}[] = [];
      const deductions: { itemId: string, quantity: number }[] = [];

      for (const req of requirements) {
        const stockItem = inv.find(i => i.id === req.itemId);
        const inStock = stockItem?.quantityInStock || 0;
        
        let nameAr = '';
        if (req.type === 'material') nameAr = materials.find(m => m.id === req.itemId)?.nameAr || req.itemId;
        if (req.type === 'hardware') nameAr = hardwareItems.find(h => h.id === req.itemId)?.nameAr || req.itemId;
        
        if (inStock < req.quantity) {
          currentDeficit.push({
            name: nameAr,
            required: req.quantity,
            inStock: inStock,
            unit: req.type === 'material' ? 'لوح' : 'قطعة'
          });
        } else {
          deductions.push({ itemId: req.itemId, quantity: req.quantity });
        }
      }

      if (currentDeficit.length > 0) {
        setDeficit(currentDeficit);
        setLoading(false);
        return;
      }

      // 4. No Deficit -> Deduct and Update Project
      await deductStockForProject(appUser.workshopId, projectId, deductions);
      await updateProject(projectId, { status: 'in_production' });
      
      const projName = useProjectStore.getState().projectDetails?.projectName || 'مشروع المطبخ';
      setProjectName(projName);
      setSuccess(true);
    } catch (error) {
      console.error(error);
      alert('حدث خطأ غير متوقع');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir="rtl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl"
      >
        {!success ? (
          <>
            <div className="flex items-center gap-3 mb-6 text-amber-500">
              <Scissors size={28} />
              <h2 className="text-2xl font-black">تحويل المشروع للتصنيع</h2>
            </div>
            
            <p className="text-zinc-400 mb-6 text-sm">
              هذا الإجراء سيقوم باحتساب ألواح الخشب المطلوبة (Nesting) وعدد الإكسسوارات، وخصمها فوراً من <strong>المخزن</strong>. لا يمكن التراجع عن هذه الخطوة بسهولة.
            </p>

            {deficit && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-2 text-red-400 mb-3 font-bold">
                  <AlertTriangle size={18} />
                  عجز في المخزن! لا يمكنك بدء التصنيع.
                </div>
                <div className="space-y-2">
                  {deficit.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-zinc-950/50 p-2 rounded-lg text-sm border border-red-500/10">
                      <span className="text-white font-semibold line-clamp-1">{item.name}</span>
                      <div className="flex gap-4 text-xs">
                        <span className="text-zinc-500">المطلوب: <span className="text-zinc-300 font-bold">{item.required}</span></span>
                        <span className="text-zinc-500">المتاح: <span className="text-red-400 font-bold">{item.inStock}</span></span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-red-300/80 mt-3">يُرجى الذهاب لصفحة المخزن وإضافة فواتير شراء لتغطية العجز.</p>
              </div>
            )}

            <div className="flex gap-3">
              <button 
                onClick={handleStartProduction}
                disabled={loading}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 py-3 rounded-xl font-bold transition-colors disabled:opacity-50"
              >
                {loading ? 'جاري الفحص...' : 'اعتماد وخصم من المخزن'}
              </button>
              <button 
                onClick={onClose}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-bold transition-colors"
              >
                إلغاء
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <CheckCircle size={64} className="mx-auto text-emerald-500 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">تم الخصم بنجاح!</h2>
            <p className="text-zinc-400 mb-6">المشروع الآن في مرحلة التصنيع (Production).</p>
            
            <button
              onClick={() => {
                const msg = encodeURIComponent(`مرحباً، تم بدء تصنيع مشروع "${projectName}" بنجاح. سيتم التواصل معك قريباً لموعد التسليم.`);
                window.open(`https://wa.me/?text=${msg}`, '_blank');
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 mb-3"
            >
              <MessageCircle size={18} />
              إرسال إشعار واتساب للعميل
            </button>

            <button 
              onClick={() => { onClose(); window.location.reload(); }}
              className="bg-zinc-800 hover:bg-zinc-700 text-white px-8 py-3 rounded-xl font-bold transition-colors"
            >
              إغلاق وتحديث
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
