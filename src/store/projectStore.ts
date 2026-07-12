import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  KitchenUnit,
  UnitType,
  DEFAULT_UNIT_DIMENSIONS,
  STANDARD_WIDTHS_MM,
  Room,
  FixtureType,
  RoomFixture,
  StructuralObstacle,
  KitchenProject,
  ProjectSettings,
  RoomWall,
} from '@/types';
import { findSmartUnitPlacement, snapValueToGrid } from '@/utils/geometry';
import { getWallsFromPolygon, wallListToPolygon, snapAngleToCommon, getPolygonBoundingBox, quickRectangle, updateWallLengthInPolygon, MIN_ROOM_POLYGON_VERTICES } from '@/lib/roomGeometry';

type Snapshot = {
  units: KitchenUnit[];
  room: Room | null;
  selectedElement: { id: string; type: 'unit' | 'fixture' | 'obstacle' } | null;
  selectedElements: Array<{ id: string; type: 'unit' | 'fixture' | 'obstacle' }>;
  selectedUnitId: string | null;
  displayUnit: 'mm' | 'cm' | 'm';
  activeTool: 'select' | 'door' | 'window' | 'column' | 'measure' | 'polygon';
  isSnappingEnabled: boolean;
  visibleWalls: Record<string, boolean>;
  roomPolygonPoints: { xMm: number; yMm: number }[]; // For drawing custom room shapes
};

export const getDefaultColorForUnitType = (type: UnitType, settings: ProjectSettings): string => {
  if (type === 'wall' || type === 'corner_wall') return settings.defaultWallColor || settings.defaultBaseColor || '#D4B896';
  if (type === 'tall' || type === 'corner_tall') return settings.defaultTallColor || settings.defaultBaseColor || '#D4B896';
  if (type === 'loft') return settings.defaultLoftColor || settings.defaultWallColor || settings.defaultBaseColor || '#D4B896';
  return settings.defaultBaseColor || '#D4B896';
};

export const getDefaultDoorColorForUnitType = (type: UnitType, settings: ProjectSettings): string => {
  if (type === 'wall' || type === 'corner_wall') return settings.defaultWallDoorColor || settings.defaultWallColor || settings.defaultBaseColor || '#D4B896';
  if (type === 'tall' || type === 'corner_tall') return settings.defaultTallDoorColor || settings.defaultWallColor || settings.defaultBaseColor || '#D4B896';
  if (type === 'loft') return settings.defaultLoftDoorColor || settings.defaultWallColor || settings.defaultBaseColor || '#D4B896';
  return settings.defaultBaseDoorColor || settings.defaultWallColor || settings.defaultBaseColor || '#D4B896';
};

// دالة لمساعدة التقريب لأقرب عرض قياسي (Snap)
const snapToStandardWidth = (width: number): number => {
  return STANDARD_WIDTHS_MM.reduce((prev, curr) => (Math.abs(curr - width) < Math.abs(prev - width) ? curr : prev));
};

type HistoryKind = 'move' | 'resize';

type HistoryAction = {
  id: string;
  kind: HistoryKind;
  label: string;
  elementType: 'unit' | 'fixture' | 'obstacle' | 'room';
  elementId?: string;
  timestamp: number;
};

type ProjectState = {
  // History
  past: Snapshot[];
  future: Snapshot[];
  canUndo: boolean;
  canRedo: boolean;
  commitSnapshot: (action?: Omit<HistoryAction, 'id' | 'timestamp'>) => void;
  undo: () => void;
  redo: () => void;
  jumpToHistory: (item: HistoryAction) => void;

  historyLog: HistoryAction[];
  historyItems: HistoryAction[];
  historyVisible: boolean;
  toggleHistoryVisible: () => void;



  // Project Info
  projectDetails: Partial<KitchenProject> | null;
  setProjectDetails: (details: Partial<KitchenProject>) => void;
  loadProjectData: (project: Partial<KitchenProject>) => void;

  projectSettings: ProjectSettings;
  updateProjectSettings: (settings: Partial<ProjectSettings>, applyToExisting?: boolean) => void;

  units: KitchenUnit[];

  // Selection
  selectedElement: { id: string; type: 'unit' | 'fixture' | 'obstacle' } | null;
  selectedElements: Array<{ id: string; type: 'unit' | 'fixture' | 'obstacle' }>;
  selectedUnitId: string | null;

  // Room
  room: Room | null;
  isRoomSetupComplete: boolean;

  // UI
  displayUnit: 'mm' | 'cm' | 'm';
  activeTool: 'select' | 'door' | 'window' | 'column' | 'measure' | 'polygon';
  isSnappingEnabled: boolean;
  isOrthoMode: boolean;
  visibleWalls: Record<string, boolean>;
  roomPolygonPoints: { xMm: number; yMm: number }[];
  setVisibleWalls: (walls: Record<string, boolean>) => void;
  addRoomPolygonPoint: (point: { xMm: number; yMm: number }) => void;
  toggleOrthoMode: () => void;

  // Unit Actions
  addUnit: (type: UnitType, xMm: number, yMm: number) => void;
  updateUnitPosition: (id: string, xMm: number, yMm: number, zMm?: number, rotationDeg?: number) => void;
  updateUnitDimensions: (
    id: string,
    widthMm: number,
    depthMm: number,
    heightMm: number,
    leftLegCarcassDepthMm?: number,
    rightLegCarcassDepthMm?: number
  ) => void;
  updateUnitDetails: (id: string, updates: Partial<KitchenUnit>) => void;
  selectUnit: (id: string | null) => void;
  deleteUnit: (id: string) => void;

  // Room Actions
  setupRoomDimensions: (widthMm: number, lengthMm: number, heightMm: number) => void;
  addRoomFixture: (type: FixtureType, xMm: number, yMm: number, widthMm: number) => void;
  updateRoomFixture: (id: string, updates: Partial<RoomFixture>) => void;
  deleteRoomFixture: (id: string) => void;

  addRoomObstacle: (type: 'column' | 'beam', xMm: number, yMm: number, widthMm: number, depthMm: number) => void;
  updateRoomObstacle: (id: string, updates: Partial<StructuralObstacle>) => void;
  deleteRoomObstacle: (id: string) => void;

  updateRoomDetails: (id: string, updates: Partial<Room>) => void;
  completeRoomSetup: () => void;

  // Room Vertex Manipulation (for non-rectangular rooms)
  updateRoomVertex: (index: number, xMm: number, yMm: number) => void;
  insertRoomVertex: (index: number, xMm: number, yMm: number) => void;
  deleteRoomVertex: (index: number) => void;
  setRoomFromWallList: (walls: { lengthMm: number; angleDeg: number }[]) => void;
  getRoomWalls: () => RoomWall[];
  setRoomPolygonPoints: (points: { xMm: number; yMm: number }[]) => void;
  updateRoomPolygonPoint: (index: number, xMm: number, yMm: number) => void;
  removeLastRoomPolygonPoint: () => void;
  clearProject: () => void;
  updateRoomWallLength: (wallIndex: number, newLengthMm: number) => void;
  setRoomPolygon: (polygonMm: { xMm: number; yMm: number }[]) => void;
  setRoomPolygonSilent: (polygonMm: { xMm: number; yMm: number }[]) => void;
  createQuickRectangleRoom: (widthMm: number, lengthMm: number, heightMm: number) => void;
  finishRoomPolygonDrawing: () => void;

  // UI
  selectElement: (id: string | null, type?: 'unit' | 'fixture' | 'obstacle', multi?: boolean) => void;
  setDisplayUnit: (unit: 'mm' | 'cm' | 'm') => void;
  setActiveTool: (tool: 'select' | 'door' | 'window' | 'column' | 'measure' | 'polygon') => void;
  toggleSnapping: () => void;

  // Context Menu
  duplicateElement: (id: string, type: 'unit' | 'fixture' | 'obstacle') => void;
  toggleElementVisibility: (id: string, type: 'unit' | 'fixture' | 'obstacle') => void;
  showAllHiddenElements: () => void;
};

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => {
      const cloneSnapshot = (state: ProjectState): Snapshot => ({
        units: state.units.map((u) => ({
          ...u,
          position: { ...u.position },
          dimensions: { ...u.dimensions },
          cornerConfig: u.cornerConfig ? { ...u.cornerConfig } : undefined,
        } as KitchenUnit)),
        room: state.room
          ? {
              ...state.room,
              fixtures: state.room.fixtures.map((f) => ({ ...f })),
              obstacles: state.room.obstacles.map((o) => ({ ...o })),
            }
          : null,
        selectedElement: state.selectedElement ? { ...state.selectedElement } : null,
        selectedElements: state.selectedElements.map((e) => ({ ...e })),
        selectedUnitId: state.selectedUnitId,
        displayUnit: state.displayUnit,
        activeTool: state.activeTool,
        isSnappingEnabled: state.isSnappingEnabled,
        visibleWalls: state.visibleWalls,
        roomPolygonPoints: state.roomPolygonPoints,
      });

      const HISTORY_MAX = 20;
      const SNAPSHOT_MAX = 200;

      const commitSnapshotInternal = (action?: Omit<HistoryAction, 'id' | 'timestamp'>) => {
        const state = get();
        const snapshot = cloneSnapshot(state);

        set((s) => {
          const past = [...s.past, snapshot].slice(-SNAPSHOT_MAX);

          // timeline-consistent history cursor:
          // - when committing a new action, future snapshots are cleared
          // - history log is truncated to match the new timeline head
          const head = s.historyLog.length - s.future.length;
          const truncatedHistory = s.historyLog.slice(0, Math.max(0, head));

          const nextHistoryLog = action
            ? [
                ...truncatedHistory,
                {
                  id: `h_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                  timestamp: Date.now(),
                  ...action,
                },
              ].slice(-HISTORY_MAX)
            : truncatedHistory.slice(-HISTORY_MAX);

          const historyItems = nextHistoryLog.slice(-HISTORY_MAX);

          return {
            past,
            future: [],
            historyLog: nextHistoryLog,
            historyItems,
          };
        });
      };


      const recomputeHistoryItems = (s: ProjectState) => {
        const HISTORY_MAX = 20;
        const pastHead = s.past.length;
        // historyLog contains snapshots for all commits; undo pops from past and pushes current into future.
        // timeline head equals historyLog.length - future.length
        const head = s.historyLog.length - s.future.length;
        const nextHistoryLog = s.historyLog.slice(0, Math.max(0, head));
        return {
          historyItems: nextHistoryLog.slice(-HISTORY_MAX),
        };
      };

      return {
        past: [],
        future: [],
        canUndo: false,
        canRedo: false,
        commitSnapshot: commitSnapshotInternal,

        historyLog: [],
        historyItems: [],
        historyVisible: false,
        toggleHistoryVisible: () => set((s) => ({ historyVisible: !s.historyVisible })),



        undo: () => {
          set((s) => {
            if (s.past.length === 0) return s;
            const prev = s.past[s.past.length - 1];
            const past = s.past.slice(0, -1);
            const currentBeforeUndo = cloneSnapshot(s);
            const future = [currentBeforeUndo, ...s.future];
            const nextState: ProjectState = {
              ...s,
              units: prev.units,
              room: prev.room,
              selectedElement: prev.selectedElement,
              selectedElements: prev.selectedElements,
              selectedUnitId: prev.selectedUnitId,
              displayUnit: prev.displayUnit,
              activeTool: prev.activeTool,
              isSnappingEnabled: prev.isSnappingEnabled,
              past,
              future,
              canUndo: past.length > 0,
              canRedo: true,
            };

            const HISTORY_MAX = 20;
            const head = nextState.historyLog.length - nextState.future.length;
            const nextHistoryLog = nextState.historyLog.slice(0, Math.max(0, head));

            return {
              ...nextState,
              historyItems: nextHistoryLog.slice(-HISTORY_MAX),
            };
          });
        },


        jumpToHistory: (item) => {
          set((s) => {
            const targetIndex = s.historyLog.findIndex((h) => h.id === item.id);
            if (targetIndex === -1) return s;

            // The past array index corresponds to the snapshot right after the action.
            // targetIndex is 0-based in historyLog, so snapshot at past[targetIndex + 1] is the state after this action.
            // We want to restore to the snapshot right AFTER the action was committed.
            // past[0] is the initial snapshot, past[1] is after first action, etc.
            // historyLog.length === past.length (since each snapshot has a corresponding action)
            // So to jump to after the nth action (0-indexed), we restore past[n + 1] (but clamped to past.length)
            const snapshotIdx = Math.min(targetIndex + 1, s.past.length - 1);
            if (snapshotIdx < 0) return s;

            const targetSnapshot = s.past[snapshotIdx];
            if (!targetSnapshot) return s;

            // The new past is up to and including this snapshot
            const newPast = s.past.slice(0, snapshotIdx);
            // The new future is everything after this snapshot: current state + remaining past + future
            const currentSnapshot = cloneSnapshot(s);
            const remainingPast = s.past.slice(snapshotIdx);
            const newFuture = [currentSnapshot, ...remainingPast, ...s.future];

            return {
              ...s,
              units: targetSnapshot.units,
              room: targetSnapshot.room,
              selectedElement: targetSnapshot.selectedElement,
              selectedElements: targetSnapshot.selectedElements,
              selectedUnitId: targetSnapshot.selectedUnitId,
              displayUnit: targetSnapshot.displayUnit,
              activeTool: targetSnapshot.activeTool,
              isSnappingEnabled: targetSnapshot.isSnappingEnabled,
              past: newPast,
              future: newFuture,
              canUndo: newPast.length > 0,
              canRedo: newFuture.length > 0,
              historyItems: s.historyLog.slice(-20),
            };
          });
        },

        redo: () => {
          set((s) => {
            if (s.future.length === 0) return s;
            const next = s.future[0];
            const future = s.future.slice(1);
            const currentBeforeRedo = cloneSnapshot(s);
            const past = [...s.past, currentBeforeRedo];
            const nextState: ProjectState = {
              ...s,
              units: next.units,
              room: next.room,
              selectedElement: next.selectedElement,
              selectedElements: next.selectedElements,
              selectedUnitId: next.selectedUnitId,
              displayUnit: next.displayUnit,
              activeTool: next.activeTool,
              isSnappingEnabled: next.isSnappingEnabled,
              past,
              future,
              canUndo: true,
              canRedo: future.length > 0,
            };

            const HISTORY_MAX = 20;
            const head = nextState.historyLog.length - nextState.future.length;
            const nextHistoryLog = nextState.historyLog.slice(0, Math.max(0, head));

            return {
              ...nextState,
              historyItems: nextHistoryLog.slice(-HISTORY_MAX),
            };
          });
        },



        projectDetails: null,
        setProjectDetails: (details) => set({ projectDetails: details }),
        loadProjectData: (project) =>
          set((state) => ({
            projectDetails: project as Partial<KitchenProject> | null,
            units: project.units || state.units,
            room: project.room || state.room,
            projectSettings: { ...state.projectSettings, ...(project.settings || {}) },
            isRoomSetupComplete: Boolean(project.room),
          })),

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
          defaultWallColor: '#6B7280',
          defaultTallColor: '#A16207',
          defaultLoftColor: '#4B5563',
          defaultBaseDoorColor: '#FFFFFF',
          defaultWallDoorColor: '#F5F5F5',
          defaultTallDoorColor: '#E5E7EB',
          defaultLoftDoorColor: '#EDEDED',
        },

        updateProjectSettings: (settings, applyToExisting = false) =>
          set((state) => {
            const newSettings = { ...state.projectSettings, ...settings };
            let newUnits = state.units;

            if (applyToExisting) {
              newUnits = state.units.map((unit) => {
                const updated: KitchenUnit = { ...unit, dimensions: { ...unit.dimensions }, position: { ...unit.position } };

                if (settings.defaultMaterialId) updated.materialId = settings.defaultMaterialId;
                if (settings.defaultDoorMaterialId) updated.doorMaterialId = settings.defaultDoorMaterialId;
                if (settings.defaultHingeId) updated.hingeType = settings.defaultHingeId;
                if (settings.defaultHandleId) updated.handleType = settings.defaultHandleId;

                if (unit.type === 'base' || unit.type === 'drawer_unit' || unit.type === 'corner_base') {
                  if (settings.defaultBaseHeightMm) updated.dimensions.heightMm = settings.defaultBaseHeightMm;
                  if (settings.defaultBaseDepthMm && unit.type !== 'corner_base') updated.dimensions.depthMm = settings.defaultBaseDepthMm;
                } else if (unit.type === 'wall' || unit.type === 'corner_wall') {
                  if (settings.defaultWallElevationMm) updated.position.zMm = settings.defaultWallElevationMm;
                  if (settings.defaultWallHeightMm) updated.dimensions.heightMm = settings.defaultWallHeightMm;
                  if (settings.defaultWallDepthMm && unit.type !== 'corner_wall') updated.dimensions.depthMm = settings.defaultWallDepthMm;
                } else if (unit.type === 'tall') {
                  if (settings.defaultBaseDepthMm) updated.dimensions.depthMm = settings.defaultBaseDepthMm;
                } else if (unit.type === 'loft') {
                  if (settings.defaultLoftElevationMm) updated.position.zMm = settings.defaultLoftElevationMm;
                  if (settings.defaultLoftHeightMm) updated.dimensions.heightMm = settings.defaultLoftHeightMm;
                  if (settings.defaultLoftDepthMm) updated.dimensions.depthMm = settings.defaultLoftDepthMm;
                }

                updated.colorHex = getDefaultColorForUnitType(unit.type, newSettings);
                updated.doorColorHex = getDefaultDoorColorForUnitType(unit.type, newSettings);
                return updated;
              });
            }

            return { projectSettings: newSettings, units: newUnits };
          }),

        units: [],
        selectedElement: null,
        selectedElements: [],
        selectedUnitId: null,
        room: null,
        isRoomSetupComplete: false,
        displayUnit: 'm',
        activeTool: 'select',
        isSnappingEnabled: true,
        isOrthoMode: true,
        visibleWalls: { back: true, left: true, front: true, right: true },
        roomPolygonPoints: [],
        setVisibleWalls: (walls) =>
          set((state) => ({
            visibleWalls: { ...state.visibleWalls, ...walls },
          })),
        setRoomPolygonPoints: (points) => set({ roomPolygonPoints: points }),
        updateRoomPolygonPoint: (index, xMm, yMm) =>
          set((state) => {
            const pts = [...state.roomPolygonPoints];
            if (index < 0 || index >= pts.length) return state;
            pts[index] = { xMm, yMm };
            return { roomPolygonPoints: pts };
          }),
        removeLastRoomPolygonPoint: () =>
          set((state) => ({
            roomPolygonPoints: state.roomPolygonPoints.slice(0, -1),
          })),
        addRoomPolygonPoint: (point) =>
          set((state) => ({
            roomPolygonPoints: [...state.roomPolygonPoints, point],
          })),
        toggleOrthoMode: () => set((state) => ({ isOrthoMode: !state.isOrthoMode })),

        addUnit: (type, xMm, yMm) =>
          set((state) => {
            // push snapshot before change
            get().commitSnapshot();

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
            } else if (type === 'corner_wall') {
              zMm = settings.defaultWallElevationMm;
              heightMm = settings.defaultWallHeightMm;
            } else if (type === 'loft') {
              zMm = settings.defaultLoftElevationMm;
              heightMm = settings.defaultLoftHeightMm;
              depthMm = settings.defaultLoftDepthMm;
            } else if (type === 'tall') {
              depthMm = settings.defaultBaseDepthMm;
            }

            let defaultColorHex = settings.defaultBaseColor || '#D4B896';
            if (type === 'wall' || type === 'corner_wall') defaultColorHex = settings.defaultWallColor || settings.defaultBaseColor || '#D4B896';
            else if (type === 'tall' || type === 'corner_tall') defaultColorHex = settings.defaultTallColor || settings.defaultBaseColor || '#D4B896';
            else if (type === 'loft') defaultColorHex = settings.defaultLoftColor || settings.defaultWallColor || '#D4B896';

            const defaultDoorColorHex = getDefaultDoorColorForUnitType(type, settings);

            const newUnit: KitchenUnit = {
              id: `unit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              type,
              position: { xMm, yMm, zMm, rotationDeg: 0 },
              dimensions: {
                widthMm: DEFAULT_UNIT_DIMENSIONS[type].widthMm,
                depthMm,
                heightMm,
                ...(type.startsWith('corner')
                  ? {
                      leftLegCarcassDepthMm: type === 'corner_wall' ? settings.defaultWallDepthMm : settings.defaultBaseDepthMm,
                      rightLegCarcassDepthMm: type === 'corner_wall' ? settings.defaultWallDepthMm : settings.defaultBaseDepthMm,
                    }
                  : {}),
              },
              materialId: settings.defaultMaterialId,
              colorHex: defaultColorHex,
              doorMaterialId: settings.defaultDoorMaterialId,
              doorColorHex: defaultDoorColorHex,
              doorCount: type === 'base' || type === 'wall' || type === 'tall' || type === 'loft' ? 2 : 0,
              drawerCount: type === 'drawer_unit' ? 3 : 0,
              shelfCount: type === 'base' || type === 'wall' ? 1 : type === 'tall' ? 4 : 0,
              hingeType: settings.defaultHingeId,
              hingesPerDoor: 2,
              handleType: settings.defaultHandleId,
              handleCount: type === 'base' || type === 'wall' || type === 'tall' || type === 'loft' ? 2 : type === 'drawer_unit' ? 3 : 0,
              hasLedProfile: false,
              ...(type.startsWith('corner')
                ? {
                    cornerConfig: {
                      doorStyle: 'bifold_lazy_susan',
                      internalSolution: 'lazy_susan_2tier',
                      lazySusanDiameterMm: 750,
                      hardwareCost: 1200,
                    },
                  }
                : {}),
            };

            const room = state.room;
            if (room) {
              newUnit.position.xMm = snapValueToGrid(newUnit.position.xMm, 10);
              newUnit.position.yMm = snapValueToGrid(newUnit.position.yMm, 10);
              const placement = findSmartUnitPlacement(newUnit, room, state.units, newUnit.position.xMm, newUnit.position.yMm, 10, 80);
              newUnit.position.xMm = placement.xMm;
              newUnit.position.yMm = placement.yMm;
            }

            return {
              units: [...state.units, newUnit],
              selectedUnitId: newUnit.id,
              selectedElement: { id: newUnit.id, type: 'unit' },
              selectedElements: [{ id: newUnit.id, type: 'unit' }],
            };
          }),

        updateUnitPosition: (id, xMm, yMm, zMm, rotationDeg) =>
          set((state) => {
            get().commitSnapshot();
            return {
              units: state.units.map((unit) =>
                unit.id === id
                  ? {
                      ...unit,
                      position: {
                        ...unit.position,
                        xMm,
                        yMm,
                        ...(zMm !== undefined ? { zMm } : {}),
                        ...(rotationDeg !== undefined ? { rotationDeg: rotationDeg as any } : {}),
                      },
                    }
                  : unit
              ),
            };
          }),

        updateUnitDimensions: (id, widthMm, depthMm, heightMm, leftLegCarcassDepthMm, rightLegCarcassDepthMm) =>
          set((state) => {
            get().commitSnapshot();
            return {
              units: state.units.map((unit) => {
                if (unit.id !== id) return unit;
                const snappedWidth = snapToStandardWidth(widthMm);
                return {
                  ...unit,
                  dimensions: {
                    ...unit.dimensions,
                    widthMm: snappedWidth,
                    depthMm,
                    heightMm,
                    leftLegCarcassDepthMm: leftLegCarcassDepthMm ?? unit.dimensions.leftLegCarcassDepthMm,
                    rightLegCarcassDepthMm: rightLegCarcassDepthMm ?? unit.dimensions.rightLegCarcassDepthMm,
                  },
                };
              }),
            };
          }),

        updateUnitDetails: (id, updates) =>
          set((state) => {
            get().commitSnapshot();
            return { units: state.units.map((unit) => (unit.id === id ? { ...unit, ...updates } : unit)) };
          }),

        selectUnit: (id) =>
          set({
            selectedUnitId: id,
            selectedElement: id ? { id, type: 'unit' } : null,
            selectedElements: id ? [{ id, type: 'unit' }] : [],
          }),

        deleteUnit: (id) =>
          set((state) => {
            get().commitSnapshot();
            const isMulti = state.selectedElements.some((e) => e.id === id);
            const idsToDelete = isMulti ? state.selectedElements.filter((e) => e.type === 'unit').map((e) => e.id) : [id];
            const newUnits = state.units.filter((u) => !idsToDelete.includes(u.id));
            const newSelectedElements = state.selectedElements.filter((e) => !idsToDelete.includes(e.id));
            return {
              units: newUnits,
              selectedElements: newSelectedElements,
              selectedElement: newSelectedElements.length > 0 ? newSelectedElements[newSelectedElements.length - 1] : null,
              selectedUnitId:
                newSelectedElements.length > 0 && newSelectedElements[newSelectedElements.length - 1].type === 'unit'
                  ? newSelectedElements[newSelectedElements.length - 1].id
                  : null,
            };
          }),

        setupRoomDimensions: (widthMm, lengthMm, heightMm) =>
          set(() => {
            const room: Room = {
              id: `room_${Date.now()}`,
              name: 'المطبخ',
              widthMm,
              lengthMm,
              heightMm,
              polygonMm: [
                { xMm: 0, yMm: 0 },
                { xMm: widthMm, yMm: 0 },
                { xMm: widthMm, yMm: lengthMm },
                { xMm: 0, yMm: lengthMm },
              ],
              fixtures: [],
              obstacles: [],
            };
            return { room, isRoomSetupComplete: true };
          }),

        addRoomFixture: (type, xMm, yMm, widthMm) =>
          set((state) => {
            if (!state.room) return state;
            get().commitSnapshot();
            const newFixture: RoomFixture = {
              id: `fix_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              type,
              xMm,
              yMm,
              widthMm,
              heightMm: type === 'door' ? 2200 : 1200,
              zMm: type === 'window' ? 1000 : 0,
            };
            return {
              room: { ...state.room, fixtures: [...state.room.fixtures, newFixture] },
              selectedElement: { id: newFixture.id, type: 'fixture' },
              selectedElements: [{ id: newFixture.id, type: 'fixture' }],
            };
          }),

        updateRoomFixture: (id, updates) =>
          set((state) => {
            if (!state.room) return state;
            get().commitSnapshot();
            return {
              room: { ...state.room, fixtures: state.room.fixtures.map((f) => (f.id === id ? { ...f, ...updates } : f)) },
            };
          }),

        deleteRoomFixture: (id) =>
          set((state) => {
            if (!state.room) return state;
            get().commitSnapshot();
            const isMulti = state.selectedElements.some((e) => e.id === id);
            const idsToDelete = isMulti ? state.selectedElements.filter((e) => e.type === 'fixture').map((e) => e.id) : [id];
            const newSelectedElements = state.selectedElements.filter((e) => !idsToDelete.includes(e.id));
            return {
              room: { ...state.room, fixtures: state.room.fixtures.filter((f) => !idsToDelete.includes(f.id)) },
              selectedElements: newSelectedElements,
              selectedElement: newSelectedElements.length > 0 ? newSelectedElements[newSelectedElements.length - 1] : null,
            };
          }),

        addRoomObstacle: (type, xMm, yMm, widthMm, depthMm) =>
          set((state) => {
            if (!state.room) return state;
            get().commitSnapshot();
            const newObstacle: StructuralObstacle = {
              id: `obs_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              type,
              xMm,
              yMm,
              widthMm,
              depthMm,
            };
            return {
              room: { ...state.room, obstacles: [...state.room.obstacles, newObstacle] },
              selectedElement: { id: newObstacle.id, type: 'obstacle' },
            };
          }),

        updateRoomObstacle: (id, updates) =>
          set((state) => {
            if (!state.room) return state;
            get().commitSnapshot();
            return {
              room: { ...state.room, obstacles: state.room.obstacles.map((o) => (o.id === id ? { ...o, ...updates } : o)) },
            };
          }),

        deleteRoomObstacle: (id) =>
          set((state) => {
            if (!state.room) return state;
            get().commitSnapshot();
            const isMulti = state.selectedElements.some((e) => e.id === id);
            const idsToDelete = isMulti ? state.selectedElements.filter((e) => e.type === 'obstacle').map((e) => e.id) : [id];
            const newSelectedElements = state.selectedElements.filter((e) => !idsToDelete.includes(e.id));
            return {
              room: { ...state.room, obstacles: state.room.obstacles.filter((o) => !idsToDelete.includes(o.id)) },
              selectedElements: newSelectedElements,
              selectedElement: newSelectedElements.length > 0 ? newSelectedElements[newSelectedElements.length - 1] : null,
            };
          }),

        updateRoomDetails: (id, updates) =>
          set((state) => {
            if (!state.room) return state;
            get().commitSnapshot();
            const merged = { ...state.room, ...updates };
            if (updates.polygonMm) {
              const bbox = getPolygonBoundingBox(updates.polygonMm);
              merged.widthMm = bbox.width;
              merged.lengthMm = bbox.height;
            }
            return { room: merged };
          }),

        completeRoomSetup: () => set({ isRoomSetupComplete: true }),

        selectElement: (id, type, multi = false) =>
          set((state) => {
            if (!id || !type) return { selectedElement: null, selectedUnitId: null, selectedElements: [] };

            if (multi) {
              const exists = state.selectedElements.some((e) => e.id === id);
              const newElements = exists ? state.selectedElements.filter((e) => e.id !== id) : [...state.selectedElements, { id, type }];
              return {
                selectedElements: newElements,
                selectedElement: newElements.length > 0 ? newElements[newElements.length - 1] : null,
                selectedUnitId: newElements.length > 0 && newElements[newElements.length - 1].type === 'unit' ? newElements[newElements.length - 1].id : null,
              };
            }

            return {
              selectedElements: [{ id, type }],
              selectedElement: { id, type },
              selectedUnitId: type === 'unit' ? id : null,
            };
          }),

        setDisplayUnit: (unit) => set({ displayUnit: unit }),
        setActiveTool: (tool) => set({ activeTool: tool }),
        toggleSnapping: () => set((state) => ({ isSnappingEnabled: !state.isSnappingEnabled })),

        duplicateElement: (id, type) =>
          set((state) => {
            get().commitSnapshot();
            const isMulti = state.selectedElements.some((e) => e.id === id);
            const elementsToDuplicate = isMulti ? state.selectedElements : [{ id, type }];

            let newUnits = [...state.units];
            let newRoom = state.room ? { ...state.room, fixtures: [...state.room.fixtures], obstacles: [...state.room.obstacles] } : null;

            elementsToDuplicate.forEach((el) => {
              if (el.type === 'unit') {
                const target = state.units.find((u) => u.id === el.id);
                if (target) {
                  newUnits.push({
                    ...target,
                    id: crypto.randomUUID(),
                    position: { ...target.position, xMm: target.position.xMm + 100, yMm: target.position.yMm + 100 },
                  });
                }
              } else if (el.type === 'fixture' && newRoom) {
                const target = state.room?.fixtures.find((f) => f.id === el.id);
                if (target) {
                  newRoom.fixtures.push({ ...target, id: crypto.randomUUID(), xMm: target.xMm + 100, yMm: target.yMm + 100 });
                }
              } else if (el.type === 'obstacle' && newRoom) {
                const target = state.room?.obstacles.find((o) => o.id === el.id);
                if (target) {
                  newRoom.obstacles.push({ ...target, id: crypto.randomUUID(), xMm: target.xMm + 100, yMm: target.yMm + 100 });
                }
              }
            });

            return { units: newUnits, room: newRoom };
          }),

        toggleElementVisibility: (id, type) =>
          set((state) => {
            get().commitSnapshot();
            const isMulti = state.selectedElements.some((e) => e.id === id);
            const elementsToToggle = isMulti ? state.selectedElements : [{ id, type }];

            let newUnits = [...state.units];
            let newRoom = state.room ? { ...state.room } : null;

            let isHiddenTarget = false;
            if (type === 'unit') {
              isHiddenTarget = !state.units.find((u) => u.id === id)?.isHidden;
            } else if (type === 'fixture') {
              isHiddenTarget = !state.room?.fixtures.find((f) => f.id === id)?.isHidden;
            } else {
              isHiddenTarget = !state.room?.obstacles.find((o) => o.id === id)?.isHidden;
            }

            elementsToToggle.forEach((el) => {
              if (el.type === 'unit') {
                newUnits = newUnits.map((u) => (u.id === el.id ? { ...u, isHidden: isHiddenTarget } : u));
              } else if (el.type === 'fixture' && newRoom) {
                newRoom.fixtures = newRoom.fixtures.map((f) => (f.id === el.id ? { ...f, isHidden: isHiddenTarget } : f));
              } else if (el.type === 'obstacle' && newRoom) {
                newRoom.obstacles = newRoom.obstacles.map((o) => (o.id === el.id ? { ...o, isHidden: isHiddenTarget } : o));
              }
            });

            return { units: newUnits, room: newRoom };
          }),

        showAllHiddenElements: () =>
          set((state) => {
            get().commitSnapshot();
            return {
              units: state.units.map((u) => ({ ...u, isHidden: false })),
              room: state.room
                ? {
                    ...state.room,
                    fixtures: state.room.fixtures.map((f) => ({ ...f, isHidden: false })),
                    obstacles: state.room.obstacles.map((o) => ({ ...o, isHidden: false })),
                  }
                : null,
            };
          }),

        // Room Vertex Manipulation (for non-rectangular rooms)
        updateRoomVertex: (index, xMm, yMm) =>
          set((state) => {
            if (!state.room) return state;
            get().commitSnapshot();
            const newPolygon = [...state.room.polygonMm];
            if (index >= 0 && index < newPolygon.length) {
              newPolygon[index] = { xMm, yMm };
              const bbox = getPolygonBoundingBox(newPolygon);
              return {
                room: {
                  ...state.room,
                  polygonMm: newPolygon,
                  widthMm: bbox.width,
                  lengthMm: bbox.height,
                },
              };
            }
            return state;
          }),

        insertRoomVertex: (index, xMm, yMm) =>
          set((state) => {
            if (!state.room) return state;
            get().commitSnapshot();
            const newPolygon = [...state.room.polygonMm];
            // Insert at the specified index, or at the end
            const insertIndex = Math.min(Math.max(0, index), newPolygon.length);
            newPolygon.splice(insertIndex, 0, { xMm, yMm });
            return {
              room: { ...state.room, polygonMm: newPolygon },
            };
          }),

        deleteRoomVertex: (index) =>
          set((state) => {
            if (!state.room) return state;
            // Must have at least 4 vertices to form a valid room polygon
            if (state.room.polygonMm.length <= MIN_ROOM_POLYGON_VERTICES) return state;
            get().commitSnapshot();
            const newPolygon = state.room.polygonMm.filter((_, i) => i !== index);
            return {
              room: { ...state.room, polygonMm: newPolygon },
            };
          }),

        setRoomFromWallList: (walls) =>
          set((state) => {
            if (!state.room) return state;
            get().commitSnapshot();
            const newPolygon = wallListToPolygon(walls);
            // Update bounding box (widthMm/lengthMm) based on new polygon
            const xs = newPolygon.map(p => p.xMm);
            const ys = newPolygon.map(p => p.yMm);
            const widthMm = Math.max(...xs) - Math.min(...xs);
            const lengthMm = Math.max(...ys) - Math.min(...ys);
            
            return {
              room: {
                ...state.room,
                polygonMm: newPolygon,
                widthMm,
                lengthMm,
              },
            };
          }),

        getRoomWalls: () => {
          const state = get();
          if (!state.room || !state.room.polygonMm) return [];
          return getWallsFromPolygon(state.room.polygonMm);
        },

        updateRoomWallLength: (wallIndex, newLengthMm) =>
          set((state) => {
            if (!state.room || !state.room.polygonMm.length) return state;
            get().commitSnapshot();
            const newPolygon = updateWallLengthInPolygon(state.room.polygonMm, wallIndex, newLengthMm);
            const bbox = getPolygonBoundingBox(newPolygon);
            return {
              room: {
                ...state.room,
                polygonMm: newPolygon,
                widthMm: bbox.width,
                lengthMm: bbox.height,
              },
            };
          }),

        setRoomPolygon: (polygonMm) =>
          set((state) => {
            if (!state.room) return state;
            get().commitSnapshot();
            const bbox = getPolygonBoundingBox(polygonMm);
            return {
              room: {
                ...state.room,
                polygonMm,
                widthMm: bbox.width,
                lengthMm: bbox.height,
              },
            };
          }),

        setRoomPolygonSilent: (polygonMm) =>
          set((state) => {
            if (!state.room) return state;
            const bbox = getPolygonBoundingBox(polygonMm);
            return {
              room: {
                ...state.room,
                polygonMm,
                widthMm: bbox.width,
                lengthMm: bbox.height,
              },
            };
          }),

         createQuickRectangleRoom: (widthMm, lengthMm, heightMm) =>
           set((state) => {
             get().commitSnapshot();
             const polygonMm = quickRectangle(widthMm, lengthMm);
             if (state.room) {
               return {
                 room: {
                   ...state.room,
                   widthMm,
                   lengthMm,
                   heightMm,
                   polygonMm,
                 },
                 isRoomSetupComplete: true,
               };
             }

             const room: Room = {
               id: `room_${Date.now()}`,
               name: 'المطبخ',
               widthMm,
               lengthMm,
               heightMm,
               polygonMm,
               fixtures: [],
               obstacles: [],
             };

             return { room, isRoomSetupComplete: true };
           }),



        clearProject: () =>
          set({
            units: [],
            room: null,
            isRoomSetupComplete: false,
            roomPolygonPoints: [],
            selectedElement: null,
            selectedElements: [],
            selectedUnitId: null,
            activeTool: 'select',
            past: [],
            future: [],
            canUndo: false,
            canRedo: false,
            historyLog: [],
            historyItems: [],
          }),

        finishRoomPolygonDrawing: () =>
          set((state) => {
            const pts = state.roomPolygonPoints;
            const base = { roomPolygonPoints: [] as typeof pts, activeTool: 'select' as const };
            // Allow unclosed polygons - minimum 2 points for a wall segment
            if (pts.length >= 2 && state.room) {
              get().commitSnapshot();
              const bbox = getPolygonBoundingBox(pts);
              return {
                ...base,
                room: {
                  ...state.room,
                  polygonMm: pts,
                  widthMm: bbox.width,
                  lengthMm: bbox.height,
                },
              };
            }
            return base;
          }),


      };
    },
    {
      name: 'kitchen-nest-project-storage',
    }
  )
);

