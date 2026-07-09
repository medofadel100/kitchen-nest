import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { KitchenUnit, UnitType, DEFAULT_UNIT_DIMENSIONS, STANDARD_WIDTHS_MM, Room, FixtureType, RoomFixture, StructuralObstacle, KitchenProject, ProjectSettings } from '@/types';

interface ProjectState {
  // Project Info
  projectDetails: Partial<KitchenProject> | null;
  setProjectDetails: (details: Partial<KitchenProject>) => void;
  
  projectSettings: ProjectSettings;
  updateProjectSettings: (settings: Partial<ProjectSettings>, applyToExisting?: boolean) => void;

  units: KitchenUnit[];
  
  // Generic Selection
  selectedElement: { id: string; type: 'unit' | 'fixture' | 'obstacle' } | null;
  selectedElements: Array<{ id: string; type: 'unit' | 'fixture' | 'obstacle' }>;
  selectedUnitId: string | null; // Keep for backward compatibility for now
  
  // Room State
  room: Room | null;
  isRoomSetupComplete: boolean;

  // UI State
  displayUnit: 'mm' | 'cm' | 'm';
  activeTool: 'select' | 'door' | 'window' | 'column' | 'measure';
  isSnappingEnabled: boolean;
  
  // Unit Actions
  addUnit: (type: UnitType, xMm: number, yMm: number) => void;
  updateUnitPosition: (id: string, xMm: number, yMm: number, zMm?: number, rotationDeg?: number) => void;
  updateUnitDimensions: (id: string, widthMm: number, depthMm: number, heightMm: number, leftLegCarcassDepthMm?: number, rightLegCarcassDepthMm?: number) => void;
  updateUnitDetails: (id: string, updates: Partial<KitchenUnit>) => void;
  selectUnit: (id: string | null) => void;
  deleteUnit: (id: string) => void;

  // Room Actions
  setupRoomDimensions: (widthMm: number, lengthMm: number, heightMm: number) => void;
  addRoomFixture: (type: FixtureType, xMm: number, yMm: number, widthMm: number) => void;
  updateRoomFixture: (id: string, updates: Partial<RoomFixture>) => void;
  deleteRoomFixture: (id: string) => void;
  addRoomObstacle: (type: "column" | "beam", xMm: number, yMm: number, widthMm: number, depthMm: number) => void;
  updateRoomObstacle: (id: string, updates: Partial<StructuralObstacle>) => void;
  deleteRoomObstacle: (id: string) => void;
  completeRoomSetup: () => void;

  // UI Actions
  selectElement: (id: string | null, type?: 'unit' | 'fixture' | 'obstacle', multi?: boolean) => void;
  setDisplayUnit: (unit: 'mm' | 'cm' | 'm') => void;
  setActiveTool: (tool: 'select' | 'door' | 'window' | 'column' | 'measure') => void;
  toggleSnapping: () => void;

  // Context Menu Actions
  duplicateElement: (id: string, type: 'unit' | 'fixture' | 'obstacle') => void;
  toggleElementVisibility: (id: string, type: 'unit' | 'fixture' | 'obstacle') => void;
  showAllHiddenElements: () => void;
}

// دالة لمساعدة التقريب لأقرب عرض قياسي (Snap)
const snapToStandardWidth = (width: number): number => {
  return STANDARD_WIDTHS_MM.reduce((prev, curr) => 
    Math.abs(curr - width) < Math.abs(prev - width) ? curr : prev
  );
};

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projectDetails: null,
      setProjectDetails: (details) => set({ projectDetails: details }),
  
  projectSettings: {
    defaultMaterialId: 'mdf_18_standard_nfb',
    defaultDoorMaterialId: 'mdf_18_standard_nfb',
    defaultHingeId: 'hinge_blum_soft',
    defaultDrawerRunnerId: 'drawer_samet_smart_slide',
    defaultHandleId: 'handle_gola_profile',
    defaultBaseHeightMm: 900,
    defaultBaseDepthMm: 600,
    defaultWallElevationMm: 1500,
    defaultWallHeightMm: 700,
    defaultWallDepthMm: 350,
    defaultLoftElevationMm: 2200,
    defaultLoftHeightMm: 400,
    defaultLoftDepthMm: 600,
    minAisleWidthMm: 900,
    maxWorkTriangleMm: 7000,
    defaultColorHex: '#D4B896',
    defaultBaseColor: '#D4B896',
    defaultWallColor: '#D4B896',
    defaultTallColor: '#D4B896',
    defaultLoftColor: '#D4B896',
  },
  updateProjectSettings: (settings, applyToExisting = false) => set((state) => {
    const newSettings = { ...state.projectSettings, ...settings };
    let newUnits = state.units;
    
    if (applyToExisting) {
      newUnits = state.units.map(unit => {
        let updated = { ...unit };
        let dim = { ...unit.dimensions };
        let pos = { ...unit.position };
        
        // Apply materials and hardware
        if (settings.defaultMaterialId) updated.materialId = settings.defaultMaterialId;
        if (settings.defaultDoorMaterialId) updated.doorMaterialId = settings.defaultDoorMaterialId;
        if (settings.defaultHingeId) updated.hingeType = settings.defaultHingeId;
        if (settings.defaultHandleId) updated.handleType = settings.defaultHandleId;

        // Apply dimensions and elevations
        if (unit.type === 'base' || unit.type === 'drawer_unit' || unit.type === 'corner_base') {
           if (settings.defaultBaseHeightMm) dim.heightMm = settings.defaultBaseHeightMm;
           if (settings.defaultBaseDepthMm && unit.type !== 'corner_base') dim.depthMm = settings.defaultBaseDepthMm;
        } else if (unit.type === 'wall' || unit.type === 'corner_wall') {
           if (settings.defaultWallElevationMm) pos.zMm = settings.defaultWallElevationMm;
           if (settings.defaultWallHeightMm) dim.heightMm = settings.defaultWallHeightMm;
           if (settings.defaultWallDepthMm && unit.type !== 'corner_wall') dim.depthMm = settings.defaultWallDepthMm;
        } else if (unit.type === 'tall') {
           if (settings.defaultBaseDepthMm) dim.depthMm = settings.defaultBaseDepthMm;
        } else if (unit.type === 'loft') {
           if (settings.defaultLoftElevationMm) pos.zMm = settings.defaultLoftElevationMm;
           if (settings.defaultLoftHeightMm) dim.heightMm = settings.defaultLoftHeightMm;
           if (settings.defaultLoftDepthMm) dim.depthMm = settings.defaultLoftDepthMm;
        }

        updated.dimensions = dim;
        updated.position = pos;
        return updated;
      });
    }

    return { 
      projectSettings: newSettings,
      units: newUnits
    };
  }),
  
  units: [],
  selectedElement: null,
  selectedElements: [],
  selectedUnitId: null,
  room: null,
  isRoomSetupComplete: false,
  displayUnit: 'm', // default to m for initial setup
  activeTool: 'select',
  isSnappingEnabled: true,

  addUnit: (type, xMm, yMm) => set((state) => {
    const settings = state.projectSettings;
    let zMm = 0;
    let heightMm = DEFAULT_UNIT_DIMENSIONS[type].heightMm;
    let depthMm = DEFAULT_UNIT_DIMENSIONS[type].depthMm;

    if (type === 'base' || type === 'drawer_unit') {
      heightMm = settings.defaultBaseHeightMm;
      depthMm = settings.defaultBaseDepthMm;
    } else if (type === 'wall') {
      zMm = settings.defaultWallElevationMm;
      heightMm = settings.defaultWallHeightMm;
      depthMm = settings.defaultWallDepthMm;
    } else if (type === 'corner_base') {
      heightMm = settings.defaultBaseHeightMm;
      // depthMm stays 900 (from DEFAULT_UNIT_DIMENSIONS)
    } else if (type === 'corner_wall') {
      zMm = settings.defaultWallElevationMm;
      heightMm = settings.defaultWallHeightMm;
      // depthMm stays 600 (from DEFAULT_UNIT_DIMENSIONS)
    } else if (type === 'corner_tall') {
      // heightMm stays 2100 (from DEFAULT_UNIT_DIMENSIONS)
      // depthMm stays 900 (from DEFAULT_UNIT_DIMENSIONS)
    } else if (type === 'loft') {
      zMm = settings.defaultLoftElevationMm;
      heightMm = settings.defaultLoftHeightMm;
      depthMm = settings.defaultLoftDepthMm;
    } else if (type === 'tall') {
      depthMm = settings.defaultBaseDepthMm;
    }

    // اختيار اللون حسب نوع الوحدة من الإعدادات الافتراضية
    let defaultColorHex = settings.defaultBaseColor || '#D4B896';
    if (type === 'wall' || type === 'corner_wall') defaultColorHex = settings.defaultWallColor || settings.defaultBaseColor || '#D4B896';
    else if (type === 'tall' || type === 'corner_tall') defaultColorHex = settings.defaultTallColor || settings.defaultBaseColor || '#D4B896';
    else if (type === 'loft') defaultColorHex = settings.defaultLoftColor || settings.defaultWallColor || '#D4B896';

    const newUnit: KitchenUnit = {
      id: `unit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type,
      position: { xMm, yMm, zMm, rotationDeg: 0 },
      dimensions: { 
        widthMm: DEFAULT_UNIT_DIMENSIONS[type].widthMm, 
        depthMm, 
        heightMm,
        ...(type.startsWith('corner') ? { 
          leftLegCarcassDepthMm: type === 'corner_wall' ? settings.defaultWallDepthMm : settings.defaultBaseDepthMm, 
          rightLegCarcassDepthMm: type === 'corner_wall' ? settings.defaultWallDepthMm : settings.defaultBaseDepthMm 
        } : {})
      },
      materialId: settings.defaultMaterialId,
      colorHex: defaultColorHex,
      doorMaterialId: settings.defaultDoorMaterialId,
      doorColorHex: settings.defaultWallColorHex || defaultColorHex,
      doorCount: type === 'base' || type === 'wall' || type === 'tall' || type === 'loft' ? 2 : 0,
      drawerCount: type === 'drawer_unit' ? 3 : 0,
      shelfCount: type === 'base' || type === 'wall' ? 1 : (type === 'tall' ? 4 : 0),
      hingeType: settings.defaultHingeId,
      hingesPerDoor: 2,
      handleType: settings.defaultHandleId,
      handleCount: type === 'base' || type === 'wall' || type === 'tall' || type === 'loft' ? 2 : (type === 'drawer_unit' ? 3 : 0),
      hasLedProfile: false,
      ...(type.startsWith('corner') ? {
        cornerConfig: {
          doorStyle: 'bifold_lazy_susan',
          internalSolution: 'lazy_susan_2tier',
          lazySusanDiameterMm: 750,
          hardwareCost: 1200,
        }
      } : {}),
    };
    return { 
      units: [...state.units, newUnit], 
      selectedUnitId: newUnit.id,
      selectedElement: { id: newUnit.id, type: 'unit' },
      selectedElements: [{ id: newUnit.id, type: 'unit' }]
    };
  }),

  updateUnitPosition: (id, xMm, yMm, zMm, rotationDeg) => set((state) => ({
    units: state.units.map(unit => 
      unit.id === id 
        ? { ...unit, position: { ...unit.position, xMm, yMm, ...(zMm !== undefined && { zMm }), ...(rotationDeg !== undefined && { rotationDeg: rotationDeg as any }) } } 
        : unit
    )
  })),

  updateUnitDimensions: (id, widthMm, depthMm, heightMm, leftLegCarcassDepthMm?, rightLegCarcassDepthMm?) => set((state) => ({
    units: state.units.map(unit => {
      if (unit.id === id) {
        // التقريب للعرض القياسي
        const snappedWidth = snapToStandardWidth(widthMm);
        return { 
          ...unit, 
          dimensions: { 
            ...unit.dimensions,
            widthMm: snappedWidth, 
            depthMm, 
            heightMm,
            leftLegCarcassDepthMm: leftLegCarcassDepthMm ?? unit.dimensions.leftLegCarcassDepthMm,
            rightLegCarcassDepthMm: rightLegCarcassDepthMm ?? unit.dimensions.rightLegCarcassDepthMm
          } 
        };
      }
      return unit;
    })
  })),

  updateUnitDetails: (id, updates) => set((state) => ({
    units: state.units.map(unit => 
      unit.id === id ? { ...unit, ...updates } : unit
    )
  })),

  selectUnit: (id) => set({ 
    selectedUnitId: id,
    selectedElement: id ? { id, type: 'unit' } : null,
    selectedElements: id ? [{ id, type: 'unit' }] : []
  }),
  
  deleteUnit: (id) => set((state) => {
    // If id is part of multi-selection, delete all selected units. Otherwise, just delete id.
    const isMulti = state.selectedElements.some(e => e.id === id);
    const idsToDelete = isMulti ? state.selectedElements.filter(e => e.type === 'unit').map(e => e.id) : [id];
    
    const newUnits = state.units.filter(u => !idsToDelete.includes(u.id));
    const newSelectedElements = state.selectedElements.filter(e => !idsToDelete.includes(e.id));
    
    return { 
      units: newUnits,
      selectedElements: newSelectedElements,
      selectedElement: newSelectedElements.length > 0 ? newSelectedElements[newSelectedElements.length - 1] : null,
      selectedUnitId: newSelectedElements.length > 0 && newSelectedElements[newSelectedElements.length - 1].type === 'unit' ? newSelectedElements[newSelectedElements.length - 1].id : null
    };
  }),

  // Room Actions implementation
  setupRoomDimensions: (widthMm, lengthMm, heightMm) => set(() => ({
    room: {
      id: `room_${Date.now()}`,
      name: "المطبخ",
      widthMm,
      lengthMm,
      heightMm,
      polygonMm: [
        { xMm: 0, yMm: 0 },
        { xMm: widthMm, yMm: 0 },
        { xMm: widthMm, yMm: lengthMm },
        { xMm: 0, yMm: lengthMm }
      ],
      fixtures: [],
      obstacles: []
    }
  })),

  addRoomFixture: (type, xMm, yMm, widthMm) => set((state) => {
    if (!state.room) return state;
    const newFixture: RoomFixture = {
      id: `fix_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type,
      xMm,
      yMm,
      widthMm,
      heightMm: type === 'door' ? 2200 : 1200,
      zMm: type === 'window' ? 1000 : 0
    };
    return { 
      room: { ...state.room, fixtures: [...state.room.fixtures, newFixture] }, 
      selectedElement: { id: newFixture.id, type: 'fixture' },
      selectedElements: [{ id: newFixture.id, type: 'fixture' }]
    };
  }),

  updateRoomFixture: (id, updates) => set((state) => {
    if (!state.room) return state;
    return {
      room: {
        ...state.room,
        fixtures: state.room.fixtures.map(f => f.id === id ? { ...f, ...updates } : f)
      }
    };
  }),

  deleteRoomFixture: (id) => set((state) => {
    if (!state.room) return state;
    const isMulti = state.selectedElements.some(e => e.id === id);
    const idsToDelete = isMulti ? state.selectedElements.filter(e => e.type === 'fixture').map(e => e.id) : [id];
    
    const newSelectedElements = state.selectedElements.filter(e => !idsToDelete.includes(e.id));

    return {
      room: {
        ...state.room,
        fixtures: state.room.fixtures.filter(f => !idsToDelete.includes(f.id))
      },
      selectedElements: newSelectedElements,
      selectedElement: newSelectedElements.length > 0 ? newSelectedElements[newSelectedElements.length - 1] : null
    };
  }),

  addRoomObstacle: (type, xMm, yMm, widthMm, depthMm) => set((state) => {
    if (!state.room) return state;
    const newObstacle: StructuralObstacle = {
      id: `obs_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type,
      xMm,
      yMm,
      widthMm,
      depthMm
    };
    return { room: { ...state.room, obstacles: [...state.room.obstacles, newObstacle] }, selectedElement: { id: newObstacle.id, type: 'obstacle' } };
  }),

  updateRoomObstacle: (id, updates) => set((state) => {
    if (!state.room) return state;
    return {
      room: {
        ...state.room,
        obstacles: state.room.obstacles.map(o => o.id === id ? { ...o, ...updates } : o)
      }
    };
  }),

  deleteRoomObstacle: (id) => set((state) => {
    if (!state.room) return state;
    const isMulti = state.selectedElements.some(e => e.id === id);
    const idsToDelete = isMulti ? state.selectedElements.filter(e => e.type === 'obstacle').map(e => e.id) : [id];
    
    const newSelectedElements = state.selectedElements.filter(e => !idsToDelete.includes(e.id));

    return {
      room: {
        ...state.room,
        obstacles: state.room.obstacles.filter(o => !idsToDelete.includes(o.id))
      },
      selectedElements: newSelectedElements,
      selectedElement: newSelectedElements.length > 0 ? newSelectedElements[newSelectedElements.length - 1] : null
    };
  }),

  completeRoomSetup: () => set({ isRoomSetupComplete: true }),

  // UI Actions
  selectElement: (id, type, multi = false) => set((state) => {
    if (!id || !type) return { selectedElement: null, selectedUnitId: null, selectedElements: [] };
    
    if (multi) {
      const exists = state.selectedElements.some(e => e.id === id);
      const newElements = exists 
        ? state.selectedElements.filter(e => e.id !== id) 
        : [...state.selectedElements, { id, type }];
      return {
        selectedElements: newElements,
        selectedElement: newElements.length > 0 ? newElements[newElements.length - 1] : null,
        selectedUnitId: newElements.length > 0 && newElements[newElements.length - 1].type === 'unit' ? newElements[newElements.length - 1].id : null
      };
    } else {
      return {
        selectedElements: [{ id, type }],
        selectedElement: { id, type },
        selectedUnitId: type === 'unit' ? id : null
      };
    }
  }),
  setDisplayUnit: (unit) => set({ displayUnit: unit }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  toggleSnapping: () => set((state) => ({ isSnappingEnabled: !state.isSnappingEnabled })),

  duplicateElement: (id, type) => set((state) => {
    const isMulti = state.selectedElements.some(e => e.id === id);
    const elementsToDuplicate = isMulti ? state.selectedElements : [{ id, type }];

    let newUnits = [...state.units];
    let newRoom = state.room ? { ...state.room } : null;

    elementsToDuplicate.forEach(el => {
      if (el.type === 'unit') {
        const target = state.units.find(u => u.id === el.id);
        if (target) {
          newUnits.push({
            ...target,
            id: crypto.randomUUID(),
            position: { ...target.position, xMm: target.position.xMm + 100, yMm: target.position.yMm + 100 }
          });
        }
      } else if (el.type === 'fixture' && newRoom) {
        const target = state.room?.fixtures.find(f => f.id === el.id);
        if (target) {
          newRoom.fixtures = [...newRoom.fixtures, { ...target, id: crypto.randomUUID(), xMm: target.xMm + 100, yMm: target.yMm + 100 }];
        }
      } else if (el.type === 'obstacle' && newRoom) {
        const target = state.room?.obstacles.find(o => o.id === el.id);
        if (target) {
          newRoom.obstacles = [...newRoom.obstacles, { ...target, id: crypto.randomUUID(), xMm: target.xMm + 100, yMm: target.yMm + 100 }];
        }
      }
    });

    return { units: newUnits, room: newRoom };
  }),

  toggleElementVisibility: (id, type) => set((state) => {
    const isMulti = state.selectedElements.some(e => e.id === id);
    const elementsToToggle = isMulti ? state.selectedElements : [{ id, type }];

    let newUnits = [...state.units];
    let newRoom = state.room ? { ...state.room } : null;

    // Get the toggle state from the first element (if we are toggling multiple, we toggle based on the target element's state)
    let isHiddenTarget = false;
    if (type === 'unit') {
      isHiddenTarget = !state.units.find(u => u.id === id)?.isHidden;
    } else if (type === 'fixture') {
      isHiddenTarget = !state.room?.fixtures.find(f => f.id === id)?.isHidden;
    } else if (type === 'obstacle') {
      isHiddenTarget = !state.room?.obstacles.find(o => o.id === id)?.isHidden;
    }

    elementsToToggle.forEach(el => {
      if (el.type === 'unit') {
        newUnits = newUnits.map(u => u.id === el.id ? { ...u, isHidden: isHiddenTarget } : u);
      } else if (el.type === 'fixture' && newRoom) {
        newRoom.fixtures = newRoom.fixtures.map(f => f.id === el.id ? { ...f, isHidden: isHiddenTarget } : f);
      } else if (el.type === 'obstacle' && newRoom) {
        newRoom.obstacles = newRoom.obstacles.map(o => o.id === el.id ? { ...o, isHidden: isHiddenTarget } : o);
      }
    });

    return { units: newUnits, room: newRoom };
  }),

  showAllHiddenElements: () => set((state) => {
    return {
      units: state.units.map(u => ({ ...u, isHidden: false })),
      room: state.room ? {
        ...state.room,
        fixtures: state.room.fixtures.map(f => ({ ...f, isHidden: false })),
        obstacles: state.room.obstacles.map(o => ({ ...o, isHidden: false }))
      } : null
    };
  })
    }),
    {
      name: 'kitchen-nest-project-storage',
    }
  )
);
