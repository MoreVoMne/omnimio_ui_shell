import { create } from 'zustand';
import type { Asset } from '../types/assets';
import type { Part, PartRole, PartGroup } from '../types/parts';
import type {
  CanvasState,
  Product,
  Capability,
  Zone,
  Screen,
  Overlay,
  HistoryState,
  CapabilityType,
  CapabilityConfig,
} from '../types/canvas';
import type { CapabilityConfigMap, ModelAnalysisResult } from '../types/capability-wizard';

interface CanvasStore extends CanvasState {
  // Actions
  setProduct: (product: Product | null) => void;
  setScreen: (screen: Screen) => void;
  setOverlay: (overlay: Overlay, data?: CanvasState['overlayData']) => void;

  // Assets
  addAsset: (asset: Asset) => void;
  removeAsset: (assetId: string) => void;
  updateAssetUsage: (assetId: string, used: boolean) => void;

  // Parts
  addPart: (part: Omit<Part, 'id' | 'createdAt'>) => void;
  updatePart: (partId: string, updates: Partial<Part>) => void;
  removePart: (partId: string) => void;
  selectPart: (partId: string | null) => void;
  hoverPart: (partId: string | null) => void;
  
  // Part Groups
  groupParts: (partIds: string[], groupName: string) => string;
  ungroupPart: (partId: string) => void;
  getPartGroup: (partId: string) => PartGroup | null;

  // Capabilities
  addCapability: (partId: string, capabilityType: CapabilityType) => string; // Returns capability ID
  removeCapability: (partId: string, capabilityId: string) => void;
  configureCapability: (partId: string, capabilityId: string, config: CapabilityConfig) => void;

  // Zones
  addZone: (partId: string, zone: Omit<Zone, 'id'>) => void;
  updateZone: (partId: string, zoneId: string, updates: Partial<Zone>) => void;
  removeZone: (partId: string, zoneId: string) => void;

  // Undo/Redo
  pushHistory: (action: string, state: Partial<CanvasState>) => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;

  // Draft
  saveDraft: () => Promise<void>;
  loadDraft: (draftId: string) => Promise<void>;
  reset: () => void;

  // Capability Selection
  setSelectedCapabilities: (capabilities: CapabilityConfigMap) => void;
  setModelAnalysis: (analysis: ModelAnalysisResult) => void;
}

const MAX_HISTORY = 50;

const initialState: CanvasState = {
  selectedProduct: null,
  assets: {
    models: [],
    textures: [],
    images: [],
    fonts: [],
  },
  parts: [],
  selectedPartId: null,
  hoveredPartId: null,
  partGroups: [],
  capabilities: new Map(),
  zones: new Map(),
  currentScreen: 'product',
  activeOverlay: null,
  overlayData: undefined,
  history: [],
  historyIndex: -1,
  selectedCapabilities: {
    size: { enabled: false },
    shape: { enabled: false },
    material: { enabled: false },
    color: { enabled: false },
    text: { enabled: false },
    print: { enabled: false },
    engraving: { enabled: false },
    embossing: { enabled: false },
    swap_parts: { enabled: false },
    add_accessories: { enabled: false },
  },
  modelAnalysis: undefined,
  // Shopify-specific state
  shopify: {
    themeCompatible: null,
    activationComplete: false,
    billingPlan: null,
    billingAddons: [],
    trialActive: false,
  },
};

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  ...initialState,

  setProduct: (product) => {
    set({ selectedProduct: product });
    get().pushHistory('setProduct', { selectedProduct: product });
  },

  setScreen: (screen) => {
    set({ currentScreen: screen });
  },

  setOverlay: (overlay, data) => {
    set({ activeOverlay: overlay, overlayData: data });
  },

  addAsset: (asset) => {
    const state = get();
    const assetType = asset.type;
    const assets = { ...state.assets };

    if (assetType === 'model') {
      assets.models = [...assets.models, asset];
    } else if (assetType === 'texture') {
      assets.textures = [...assets.textures, asset];
    } else if (assetType === 'image') {
      assets.images = [...assets.images, asset];
    } else if (assetType === 'font') {
      assets.fonts = [...assets.fonts, asset];
    }

    set({ assets });
    get().pushHistory('addAsset', { assets });
  },

  removeAsset: (assetId) => {
    const state = get();
    const assets = { ...state.assets };

    assets.models = assets.models.filter((a) => a.id !== assetId);
    assets.textures = assets.textures.filter((a) => a.id !== assetId);
    assets.images = assets.images.filter((a) => a.id !== assetId);
    assets.fonts = assets.fonts.filter((a) => a.id !== assetId);

    set({ assets });
    get().pushHistory('removeAsset', { assets });
  },

  updateAssetUsage: (assetId, used) => {
    const state = get();
    const assets = { ...state.assets };

    const updateAsset = (arr: Asset[]) =>
      arr.map((a) => (a.id === assetId ? { ...a, used } : a));

    assets.models = updateAsset(assets.models);
    assets.textures = updateAsset(assets.textures);
    assets.images = updateAsset(assets.images);
    assets.fonts = updateAsset(assets.fonts);

    set({ assets });
  },

  addPart: (partData) => {
    const part: Part = {
      ...partData,
      id: `part-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
    };

    set((state) => ({
      parts: [...state.parts, part],
    }));

    get().pushHistory('addPart', { parts: [...get().parts, part] });
  },

  updatePart: (partId, updates) => {
    set((state) => ({
      parts: state.parts.map((p) => (p.id === partId ? { ...p, ...updates } : p)),
    }));

    get().pushHistory('updatePart', { parts: get().parts });
  },

  removePart: (partId) => {
    set((state) => ({
      parts: state.parts.filter((p) => p.id !== partId),
      capabilities: new Map(
        Array.from(state.capabilities.entries()).filter(([id]) => id !== partId)
      ),
      zones: new Map(Array.from(state.zones.entries()).filter(([id]) => id !== partId)),
    }));

    get().pushHistory('removePart', { parts: get().parts });
  },

  selectPart: (partId) => {
    set({ selectedPartId: partId });
  },

  hoverPart: (partId) => {
    set({ hoveredPartId: partId });
  },

  groupParts: (partIds, groupName) => {
    const group: PartGroup = {
      id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: groupName,
      partIds,
      createdAt: Date.now(),
    };

    set((state) => {
      const parts = state.parts.map((p) =>
        partIds.includes(p.id) ? { ...p, groupId: group.id } : p
      );
      const partGroups = [...state.partGroups, group];
      return { parts, partGroups };
    });

    get().pushHistory('groupParts', { parts: get().parts, partGroups: get().partGroups });
    return group.id;
  },

  ungroupPart: (partId) => {
    set((state) => {
      const part = state.parts.find((p) => p.id === partId);
      if (!part || !part.groupId) return state;

      const parts = state.parts.map((p) =>
        p.id === partId ? { ...p, groupId: undefined } : p
      );

      // Remove group if it becomes empty
      const partGroups = state.partGroups
        .map((g) => {
          if (g.id === part.groupId) {
            const newPartIds = g.partIds.filter((id) => id !== partId);
            return newPartIds.length > 0
              ? { ...g, partIds: newPartIds }
              : null;
          }
          return g;
        })
        .filter((g): g is PartGroup => g !== null);

      return { parts, partGroups };
    });

    get().pushHistory('ungroupPart', { parts: get().parts, partGroups: get().partGroups });
  },

  getPartGroup: (partId) => {
    const state = get();
    const part = state.parts.find((p) => p.id === partId);
    if (!part || !part.groupId) return null;
    return state.partGroups.find((g) => g.id === part.groupId) || null;
  },

  addCapability: (partId, capabilityType) => {
    const capability: Capability = {
      id: `cap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: capabilityType,
      partId,
      configured: false,
    };

    set((state) => {
      const capabilities = new Map(state.capabilities);
      const partCapabilities = capabilities.get(partId) || [];
      capabilities.set(partId, [...partCapabilities, capability]);
      return { capabilities };
    });

    get().pushHistory('addCapability', { capabilities: get().capabilities });
    
    return capability.id;
  },

  removeCapability: (partId, capabilityId) => {
    set((state) => {
      const capabilities = new Map(state.capabilities);
      const partCapabilities = capabilities.get(partId) || [];
      capabilities.set(
        partId,
        partCapabilities.filter((c) => c.id !== capabilityId)
      );
      return { capabilities };
    });

    get().pushHistory('removeCapability', { capabilities: get().capabilities });
  },

  configureCapability: (partId, capabilityId, config) => {
    set((state) => {
      const capabilities = new Map(state.capabilities);
      const partCapabilities = capabilities.get(partId) || [];
      capabilities.set(
        partId,
        partCapabilities.map((c) =>
          c.id === capabilityId ? { ...c, configured: true, config } : c
        )
      );
      return { capabilities };
    });

    get().pushHistory('configureCapability', { capabilities: get().capabilities });
  },

  addZone: (partId, zoneData) => {
    const zone: Zone = {
      ...zoneData,
      id: `zone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    set((state) => {
      const zones = new Map(state.zones);
      const partZones = zones.get(partId) || [];
      zones.set(partId, [...partZones, zone]);
      return { zones };
    });

    get().pushHistory('addZone', { zones: get().zones });
  },

  updateZone: (partId, zoneId, updates) => {
    set((state) => {
      const zones = new Map(state.zones);
      const partZones = zones.get(partId) || [];
      zones.set(
        partId,
        partZones.map((z) => (z.id === zoneId ? { ...z, ...updates } : z))
      );
      return { zones };
    });

    get().pushHistory('updateZone', { zones: get().zones });
  },

  removeZone: (partId, zoneId) => {
    set((state) => {
      const zones = new Map(state.zones);
      const partZones = zones.get(partId) || [];
      zones.set(
        partId,
        partZones.filter((z) => z.id !== zoneId)
      );
      return { zones };
    });

    get().pushHistory('removeZone', { zones: get().zones });
  },

  pushHistory: (action, state) => {
    const currentState = get();
    const historyState: HistoryState = {
      timestamp: Date.now(),
      action,
      state,
    };

    // Remove any future history if we're not at the end
    const history = currentState.history.slice(0, currentState.historyIndex + 1);
    history.push(historyState);

    // Limit history size
    if (history.length > MAX_HISTORY) {
      history.shift();
    }

    set({
      history,
      historyIndex: history.length - 1,
    });
  },

  undo: () => {
    const state = get();
    if (state.historyIndex <= 0) return;

    const newIndex = state.historyIndex - 1;
    const historyState = state.history[newIndex];

    // Apply previous state
    if (historyState && historyState.state) {
      set({
        ...state,
        ...historyState.state,
        historyIndex: newIndex,
      });
    }
  },

  redo: () => {
    const state = get();
    if (state.historyIndex >= state.history.length - 1) return;

    const newIndex = state.historyIndex + 1;
    const historyState = state.history[newIndex];

    // Apply next state
    if (historyState && historyState.state) {
      set({
        ...state,
        ...historyState.state,
        historyIndex: newIndex,
      });
    }
  },

  clearHistory: () => {
    set({ history: [], historyIndex: -1 });
  },

  saveDraft: async () => {
    const state = get();
    // TODO: Implement API call
    // Draft saving will be implemented later
  },

  loadDraft: async (draftId: string) => {
    // TODO: Implement API call
    // Draft loading will be implemented later
  },

  reset: () => {
    set(initialState);
  },

  setSelectedCapabilities: (capabilities) => {
    set({ selectedCapabilities: capabilities });
  },

  setModelAnalysis: (analysis) => {
    set({ modelAnalysis: analysis });
  },
}));

