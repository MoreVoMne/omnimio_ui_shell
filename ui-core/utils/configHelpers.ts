// Configuration Helper Functions
// Create, update, and manage ConfigurationStateV2

import { ConfigurationStateV2, Product, TreeNode } from '../types-tree';
import { flattenTree } from './treeHelpers';

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create default configuration from product tree
 * Sets all nodes to their default values
 */
export function createDefaultConfiguration(product: Product): ConfigurationStateV2 {
  const config: ConfigurationStateV2 = {
    version: '2.0.0',

    product: {
      id: product.id,
      baseModel: '/models/aurora-bag.glb', // TODO: Get from product
    },

    selections: {},

    materials: {},

    customizations: {
      text: [],
      images: [],
      patterns: [],
    },

    scene: {
      camera: {
        position: [0, 1.5, 3],
        target: [0, 0, 0],
        fov: 50,
      },
      lighting: {
        preset: 'studio',
        intensity: 1.0,
      },
    },

    user: {
      username: 'Guest',
    },

    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      saveCount: 0,
      sessionId: generateSessionId(),
    },
  };

  // Set all default selections from tree
  const allNodes = flattenTree(product.customizationTree);

  allNodes.forEach((node) => {
    // Only set defaults for nodes that have them
    if (node.default !== undefined && node.type !== 'component') {
      config.selections[node.id] = {
        nodeId: node.id,
        value: node.default,
        timestamp: new Date(),
      };
    }
  });

  return config;
}

/**
 * Update a selection in configuration
 */
export function updateSelection(
  config: ConfigurationStateV2,
  nodeId: string,
  value: any
): ConfigurationStateV2 {
  return {
    ...config,
    selections: {
      ...config.selections,
      [nodeId]: {
        nodeId,
        value,
        timestamp: new Date(),
      },
    },
    metadata: {
      ...config.metadata,
      updatedAt: new Date(),
    },
  };
}

/**
 * Remove a selection from configuration
 */
export function removeSelection(
  config: ConfigurationStateV2,
  nodeId: string
): ConfigurationStateV2 {
  const newSelections = { ...config.selections };
  delete newSelections[nodeId];

  return {
    ...config,
    selections: newSelections,
    metadata: {
      ...config.metadata,
      updatedAt: new Date(),
    },
  };
}

/**
 * Add text customization
 */
export function addTextCustomization(
  config: ConfigurationStateV2,
  data: {
    nodeId: string;
    content: string;
    font: string;
    fontSize: number;
    color: string;
    position: [number, number, number];
    rotation?: [number, number, number];
  }
): ConfigurationStateV2 {
  const newText = {
    id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...data,
  };

  return {
    ...config,
    customizations: {
      ...config.customizations,
      text: [...(config.customizations.text || []), newText],
    },
    metadata: {
      ...config.metadata,
      updatedAt: new Date(),
    },
  };
}

/**
 * Remove text customization
 */
export function removeTextCustomization(
  config: ConfigurationStateV2,
  textId: string
): ConfigurationStateV2 {
  return {
    ...config,
    customizations: {
      ...config.customizations,
      text: (config.customizations.text || []).filter((t) => t.id !== textId),
    },
    metadata: {
      ...config.metadata,
      updatedAt: new Date(),
    },
  };
}

/**
 * Add image customization
 */
export function addImageCustomization(
  config: ConfigurationStateV2,
  data: {
    nodeId: string;
    imageUrl: string;
    position: [number, number, number];
    scale: number;
    rotation?: [number, number, number];
  }
): ConfigurationStateV2 {
  const newImage = {
    id: `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...data,
  };

  return {
    ...config,
    customizations: {
      ...config.customizations,
      images: [...(config.customizations.images || []), newImage],
    },
    metadata: {
      ...config.metadata,
      updatedAt: new Date(),
    },
  };
}

/**
 * Remove image customization
 */
export function removeImageCustomization(
  config: ConfigurationStateV2,
  imageId: string
): ConfigurationStateV2 {
  return {
    ...config,
    customizations: {
      ...config.customizations,
      images: (config.customizations.images || []).filter((i) => i.id !== imageId),
    },
    metadata: {
      ...config.metadata,
      updatedAt: new Date(),
    },
  };
}

/**
 * Add pattern customization
 */
export function addPatternCustomization(
  config: ConfigurationStateV2,
  data: {
    nodeId: string;
    patternId: string;
    color: string;
    scale?: number;
  }
): ConfigurationStateV2 {
  const newPattern = {
    id: `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...data,
  };

  return {
    ...config,
    customizations: {
      ...config.customizations,
      patterns: [...(config.customizations.patterns || []), newPattern],
    },
    metadata: {
      ...config.metadata,
      updatedAt: new Date(),
    },
  };
}

/**
 * Remove pattern customization
 */
export function removePatternCustomization(
  config: ConfigurationStateV2,
  patternId: string
): ConfigurationStateV2 {
  return {
    ...config,
    customizations: {
      ...config.customizations,
      patterns: (config.customizations.patterns || []).filter((p) => p.id !== patternId),
    },
    metadata: {
      ...config.metadata,
      updatedAt: new Date(),
    },
  };
}

/**
 * Reset configuration to defaults
 */
export function resetConfiguration(
  config: ConfigurationStateV2,
  product: Product
): ConfigurationStateV2 {
  return createDefaultConfiguration(product);
}

/**
 * Clone configuration (for undo/redo)
 */
export function cloneConfiguration(config: ConfigurationStateV2): ConfigurationStateV2 {
  return {
    ...config,
    selections: { ...config.selections },
    materials: { ...config.materials },
    customizations: {
      text: [...(config.customizations.text || [])],
      images: [...(config.customizations.images || [])],
      patterns: [...(config.customizations.patterns || [])],
    },
    scene: {
      ...config.scene,
      camera: { ...config.scene.camera },
      lighting: { ...config.scene.lighting },
    },
    user: { ...config.user },
    metadata: { ...config.metadata },
  };
}

/**
 * Check if configuration has unsaved changes
 */
export function hasUnsavedChanges(config: ConfigurationStateV2): boolean {
  const lastSaved = config.metadata.updatedAt;
  const saveCount = config.metadata.saveCount;

  // If never saved (saveCount = 0) and has selections, has changes
  if (saveCount === 0 && Object.keys(config.selections).length > 0) {
    return true;
  }

  // TODO: More sophisticated check based on last save timestamp
  return false;
}

/**
 * Mark configuration as saved
 */
export function markAsSaved(config: ConfigurationStateV2): ConfigurationStateV2 {
  return {
    ...config,
    metadata: {
      ...config.metadata,
      saveCount: config.metadata.saveCount + 1,
    },
  };
}

/**
 * Serialize configuration to JSON
 */
export function serializeConfiguration(config: ConfigurationStateV2): string {
  return JSON.stringify(config, null, 2);
}

/**
 * Deserialize configuration from JSON
 */
export function deserializeConfiguration(json: string): ConfigurationStateV2 {
  const parsed = JSON.parse(json);

  // Convert date strings back to Date objects
  if (parsed.metadata) {
    parsed.metadata.createdAt = new Date(parsed.metadata.createdAt);
    parsed.metadata.updatedAt = new Date(parsed.metadata.updatedAt);
  }

  if (parsed.selections) {
    Object.values(parsed.selections).forEach((selection: any) => {
      if (selection.timestamp) {
        selection.timestamp = new Date(selection.timestamp);
      }
    });
  }

  return parsed;
}

/**
 * Save configuration to localStorage
 */
export function saveToLocalStorage(
  config: ConfigurationStateV2,
  key: string = 'omnimio-draft'
): void {
  const serialized = serializeConfiguration(config);
  localStorage.setItem(key, serialized);
}

/**
 * Load configuration from localStorage
 */
export function loadFromLocalStorage(
  key: string = 'omnimio-draft'
): ConfigurationStateV2 | null {
  const stored = localStorage.getItem(key);
  if (!stored) return null;

  try {
    return deserializeConfiguration(stored);
  } catch (error) {
    console.error('Failed to load configuration from localStorage:', error);
    return null;
  }
}

/**
 * Clear configuration from localStorage
 */
export function clearLocalStorage(key: string = 'omnimio-draft'): void {
  localStorage.removeItem(key);
}

/**
 * Get configuration summary (for display)
 */
export function getConfigurationSummary(config: ConfigurationStateV2): {
  selectionsCount: number;
  textCount: number;
  imageCount: number;
  patternCount: number;
  modifiedCount: number;
} {
  return {
    selectionsCount: Object.keys(config.selections).length,
    textCount: config.customizations.text?.length || 0,
    imageCount: config.customizations.images?.length || 0,
    patternCount: config.customizations.patterns?.length || 0,
    modifiedCount: Object.values(config.selections).filter((s) => {
      // Count selections that differ from default
      // This is a simplified check - real implementation would check against tree
      return true; // TODO: Implement proper check
    }).length,
  };
}

export default {
  generateSessionId,
  createDefaultConfiguration,
  updateSelection,
  removeSelection,
  addTextCustomization,
  removeTextCustomization,
  addImageCustomization,
  removeImageCustomization,
  addPatternCustomization,
  removePatternCustomization,
  resetConfiguration,
  cloneConfiguration,
  hasUnsavedChanges,
  markAsSaved,
  serializeConfiguration,
  deserializeConfiguration,
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
  getConfigurationSummary,
};
