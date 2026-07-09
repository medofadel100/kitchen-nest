import { create } from 'zustand';
import { Material, StandardSheetSize, HardwareItem } from '@/types';
import { DEFAULT_MATERIALS } from '@/data/materials';
import { DEFAULT_HARDWARE } from '@/data/hardware';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface WorkshopSettings {
  name: string;
  defaultProfitMarginPercent: number;
  currency: string;
}

interface SettingsState {
  materials: Material[];
  hardwareItems: HardwareItem[];
  workshopSettings: WorkshopSettings;
  
  // Actions
  addMaterial: (material: Omit<Material, 'id' | 'updatedAt'>) => void;
  updateMaterial: (id: string, updates: Partial<Material>) => void;
  deleteMaterial: (id: string) => void;
  
  addHardwareItem: (item: Omit<HardwareItem, 'id'>) => void;
  updateHardwareItem: (id: string, updates: Partial<HardwareItem>) => void;
  deleteHardwareItem: (id: string) => void;
  
  updateWorkshopSettings: (updates: Partial<WorkshopSettings>) => void;
  
  // Cloud Sync
  setAllSettings: (data: Partial<SettingsState>) => void;
  syncFromCloud: (uid: string) => Promise<void>;
  saveToCloud: (uid: string) => Promise<void>;
  seedDefaultsToCloud: (uid: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()(
  (set, get) => ({
    // Initially empty or defaults, but will be overwritten by syncFromCloud
    materials: [],
    hardwareItems: [],
    workshopSettings: {
      name: 'KitchenNest Workshop',
      defaultProfitMarginPercent: 30,
      currency: 'ج.م',
    },

    addMaterial: (materialData) => set((state) => {
      const newMaterial: Material = {
        ...materialData,
        id: `mat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        updatedAt: new Date().toISOString(),
      };
      const newState = { materials: [...state.materials, newMaterial] };
      
      // Auto-save
      const uid = auth.currentUser?.uid;
      if (uid) get().saveToCloud(uid);
      
      return newState;
    }),

    updateMaterial: (id, updates) => set((state) => {
      const newState = {
        materials: state.materials.map(mat => 
          mat.id === id 
            ? { ...mat, ...updates, updatedAt: new Date().toISOString() } 
            : mat
        )
      };
      
      // Auto-save
      const uid = auth.currentUser?.uid;
      if (uid) get().saveToCloud(uid);

      return newState;
    }),

    deleteMaterial: (id) => set((state) => {
      const newState = {
        materials: state.materials.filter(mat => mat.id !== id)
      };

      // Auto-save
      const uid = auth.currentUser?.uid;
      if (uid) get().saveToCloud(uid);

      return newState;
    }),

    addHardwareItem: (itemData) => set((state) => {
      const newItem: HardwareItem = {
        ...itemData,
        id: `hw_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      };
      const newState = { hardwareItems: [...state.hardwareItems, newItem] };

      // Auto-save
      const uid = auth.currentUser?.uid;
      if (uid) get().saveToCloud(uid);

      return newState;
    }),

    updateHardwareItem: (id, updates) => set((state) => {
      const newState = {
        hardwareItems: state.hardwareItems.map(item => 
          item.id === id ? { ...item, ...updates } : item
        )
      };

      // Auto-save
      const uid = auth.currentUser?.uid;
      if (uid) get().saveToCloud(uid);

      return newState;
    }),

    deleteHardwareItem: (id) => set((state) => {
      const newState = {
        hardwareItems: state.hardwareItems.filter(item => item.id !== id)
      };

      // Auto-save
      const uid = auth.currentUser?.uid;
      if (uid) get().saveToCloud(uid);

      return newState;
    }),

    updateWorkshopSettings: (updates) => set((state) => {
      const newState = {
        workshopSettings: { ...state.workshopSettings, ...updates }
      };

      // Auto-save
      const uid = auth.currentUser?.uid;
      if (uid) get().saveToCloud(uid);

      return newState;
    }),

    setAllSettings: (data) => set((state) => ({ ...state, ...data })),

    syncFromCloud: async (uid: string) => {
      try {
        const docRef = doc(db, 'workshops', uid, 'settings', 'master');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as Partial<SettingsState>;
          set((state) => ({ ...state, ...data }));
        } else {
          // If literally no data exists, we should seed the defaults immediately
          await get().seedDefaultsToCloud(uid);
        }
      } catch (error) {
        console.error("Failed to sync from cloud:", error);
      }
    },

    saveToCloud: async (uid: string) => {
      try {
        const state = get();
        // Prevent saving if state is totally empty (e.g. before sync)
        if (state.materials.length === 0 && state.hardwareItems.length === 0) return;

        const docRef = doc(db, 'workshops', uid, 'settings', 'master');
        await setDoc(docRef, {
          materials: state.materials,
          hardwareItems: state.hardwareItems,
          workshopSettings: state.workshopSettings
        });
      } catch (error) {
        console.error("Failed to save to cloud:", error);
      }
    },

    seedDefaultsToCloud: async (uid: string) => {
      try {
        const docRef = doc(db, 'workshops', uid, 'settings', 'master');
        const defaultData = {
          materials: [...DEFAULT_MATERIALS],
          hardwareItems: [...DEFAULT_HARDWARE],
          workshopSettings: {
            name: 'KitchenNest Workshop',
            defaultProfitMarginPercent: 30,
            currency: 'ج.م',
          }
        };
        await setDoc(docRef, defaultData);
        set(defaultData); // Update local state immediately
      } catch (error) {
        console.error("Failed to seed defaults:", error);
        throw error;
      }
    },
  })
);
