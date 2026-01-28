// New Tree-Based Type Definitions
// This file contains the tree structure that will replace the flat ConfigurationState

export type NodeType = 'component' | 'attribute' | 'option' | 'action';
export type ActionType = 'modify' | 'add' | 'remove' | 'preset' | 'place';
export type NodeState = 'default' | 'modified' | 'available' | 'disabled' | 'added';

/**
 * TreeNode - The core hierarchical data structure
 * Replaces the flat key-value configuration
 */
export interface TreeNode {
  // Identity
  id: string;                           // Unique identifier (e.g., "node-body-material")
  type: NodeType;                       // Type of node

  // Display
  label: string;                        // Human-readable label (e.g., "Material", "Pebbled Leather")
  description?: string;                 // Optional description for tooltips
  icon?: string;                        // Optional icon identifier

  // Hierarchy
  depth: number;                        // Tree depth level (1, 2, 3, etc.)
  children?: TreeNode[];                // Child nodes
  parentId?: string;                    // Reference to parent node ID

  // Interaction
  clickable: boolean;                   // Can user click this node?
  action?: ActionType;                  // What happens on click?

  // State
  required: boolean;                    // Must user configure this?
  default?: string | number | boolean;  // Default value
  currentValue?: any;                   // Current selected value
  state?: NodeState;                    // Visual state for progress indication

  // Pricing
  priceModifier?: number;               // Fixed price modifier (+£15, -£5)
  priceType?: 'fixed' | 'percentage' | 'formula'; // How to calculate price
  priceFormula?: string;                // For complex pricing (e.g., "area * 2.5")

  // Validation & Constraints
  constraints?: {
    minValue?: number;
    maxValue?: number;
    allowedValues?: string[];
    incompatibleWith?: string[];        // Node IDs that conflict
    requiredWith?: string[];            // Node IDs that must be selected together
    dependsOn?: string[];               // Node IDs that must be selected first
  };

  // 3D Integration
  linkedParts?: string[];               // Which 3D mesh parts this affects
  hotspotPosition?: {                   // 3D coordinates for hotspot
    x: number;
    y: number;
    z: number;
  };

  // Metadata
  metadata?: {
    category?: 'materials' | 'details' | 'images' | 'text';
    tags?: string[];                    // For search/filter
    thumbnail?: string;                 // Preview image URL
    popularity?: number;                // For sorting
  };
}

/**
 * Product - Contains the full tree and metadata
 */
export interface Product {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  currency: string;

  // The tree structure
  customizationTree: TreeNode[];

  // Supporting data
  catalog: {
    materials: Material[];
    textures: Texture[];
    patterns: Pattern[];
  };

  rules: ValidationRule[];
  pricingRules: PricingRule[];
}

/**
 * Material Definition
 */
export interface Material {
  id: string;
  name: string;
  type: 'leather' | 'fabric' | 'metal' | 'plastic' | 'vegan_leather';
  color: string;                        // Hex: #RRGGBB
  textureId?: string;                   // Reference to texture
  finish?: 'matte' | 'glossy' | 'metallic';
  price: number;
  inStock: boolean;

  // 3D rendering properties
  rendering?: {
    roughness: number;
    metalness: number;
    envMapIntensity: number;
  };
}

/**
 * Texture Definition
 */
export interface Texture {
  id: string;
  name: string;
  url: string;
  type: 'diffuse' | 'normal' | 'roughness' | 'metalness';
  resolution: number;
  seamless: boolean;
}

/**
 * Pattern Definition
 */
export interface Pattern {
  id: string;
  name: string;
  thumbnailUrl: string;
  fullUrl: string;
  category: string;
  price: number;
}

/**
 * Configuration State - New tree-based version
 * This replaces the old flat ConfigurationState
 */
export interface ConfigurationStateV2 {
  version: '2.0.0';

  // Product reference
  product: {
    id: string;
    variantId?: string;
    baseModel: string;                  // GLB URL
  };

  // Tree-based selections
  selections: {
    [nodeId: string]: {
      nodeId: string;
      value: any;                       // Selected value
      timestamp: Date;                  // When selected
    };
  };

  // Material customization (organized by part)
  materials: {
    [partId: string]: {
      type: string;
      color: string;
      texture?: string;
      finish?: string;
    };
  };

  // Added customizations (text, images, patterns)
  customizations: {
    text?: Array<{
      id: string;
      content: string;
      font: string;
      fontSize: number;
      color: string;
      position: [x: number, y: number, z: number];
      rotation?: [x: number, y: number, z: number];
      nodeId: string;                   // Which node added this
    }>;

    images?: Array<{
      id: string;
      imageUrl: string;
      position: [x: number, y: number, z: number];
      scale: number;
      rotation?: [x: number, y: number, z: number];
      nodeId: string;
    }>;

    patterns?: Array<{
      id: string;
      patternId: string;
      color: string;
      scale?: number;
      nodeId: string;
    }>;
  };

  // Scene settings
  scene: {
    camera: {
      position: [x: number, y: number, z: number];
      target: [x: number, y: number, z: number];
      fov?: number;
    };
    lighting: {
      preset: 'studio' | 'natural' | 'dramatic' | 'custom';
      intensity?: number;
    };
  };

  // User info
  user: {
    username: string;
    userId?: string;
  };

  // Metadata
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    saveCount: number;
    sessionId: string;
  };
}

/**
 * Validation Rule
 */
export interface ValidationRule {
  id: string;
  name: string;
  type: 'blocking' | 'warning' | 'info';

  // Rule condition (returns true if violated)
  condition: (config: ConfigurationStateV2, tree: TreeNode[]) => boolean;

  message: string;
  fixSuggestion?: string;

  // Auto-fix function (optional)
  autoFix?: (config: ConfigurationStateV2) => ConfigurationStateV2;
}

/**
 * Pricing Rule
 */
export interface PricingRule {
  id: string;
  scope: 'base' | 'part' | 'zone' | 'customization';

  // Pricing formula
  formula: 'fixed' | 'percentage' | 'per_unit' | 'per_area' | 'custom';

  basePrice?: number;
  rate?: number;                        // For per_unit, per_area

  // Custom formula (JavaScript expression)
  customFormula?: string;               // e.g., "area * 2.5 + 10"

  currency: string;
  rounding?: 'up' | 'down' | 'nearest';
}

/**
 * Context Menu Data
 */
export interface ContextMenu {
  id: string;
  triggeredBy: 'tag-line' | 'hotspot' | 'global-button';
  linkedNodeId: string;

  position: {
    x: number;
    y: number;
    anchor: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  };

  width: number;
  maxHeight: number;

  title: string;
  subtitle?: string;

  options: ContextMenuOption[];

  currentSelection?: string;
  searchEnabled?: boolean;
  filterTags?: string[];

  onSelect: (optionId: string) => void;
  onCancel: () => void;
  onBack?: () => void;
}

/**
 * Context Menu Option
 */
export interface ContextMenuOption {
  id: string;
  label: string;
  description?: string;

  thumbnail?: string;
  icon?: string;
  badge?: string;                       // "New", "Popular", "+£15"

  available: boolean;
  selected: boolean;
  disabled: boolean;
  disabledReason?: string;

  priceModifier?: number;
  displayPrice?: string;

  hasChildren: boolean;
  children?: ContextMenuOption[];

  action?: () => void;
  previewOnHover?: boolean;
}

/**
 * UI State
 */
export interface UIState {
  activeTag: boolean;
  activeContextMenu: string | null;    // Node ID or null
  activeHotspot: string | null;
  focusedPart: string | null;

  cameraPosition: {
    position: [number, number, number];
    target: [number, number, number];
  };

  lightingPreset: string;
}

/**
 * Navigation State
 */
export interface NavigationState {
  currentDepth: number;
  breadcrumb: string[];                 // Node IDs from root to current
  history: string[];                    // For back navigation
}

/**
 * Complete Customizer State (for Zustand)
 */
export interface CustomizerState {
  // Current configuration
  configuration: ConfigurationStateV2;

  // UI state
  ui: UIState;

  // Navigation state
  navigation: NavigationState;

  // Product definition
  product: Product;

  // Session management
  session: {
    userId?: string;
    sessionId: string;
    lastSaved: Date;
    isDirty: boolean;
  };

  // Actions
  actions: {
    // Configuration
    selectOption: (nodeId: string, value: any) => void;
    addCustomization: (type: 'text' | 'image' | 'pattern', data: any) => void;
    removeCustomization: (id: string) => void;

    // UI
    openContextMenu: (nodeId: string) => void;
    closeContextMenu: () => void;
    toggleTag: () => void;

    // Navigation
    navigateToNode: (nodeId: string) => void;
    navigateBack: () => void;

    // Session
    saveConfiguration: () => Promise<void>;
    loadConfiguration: (id: string) => Promise<void>;
    resetToDefault: () => void;
  };
}

/**
 * Validation Result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
}

/**
 * Price Breakdown
 */
export interface PriceBreakdown {
  base: number;
  materials: { [partId: string]: number };
  customizations: {
    text: number;
    images: number;
    patterns: number;
  };
  modifiers: { [nodeId: string]: number };
  subtotal: number;
  tax?: number;
  total: number;
  currency: string;
}

/**
 * History Stack for Undo/Redo
 */
export interface HistoryStack {
  past: ConfigurationStateV2[];
  present: ConfigurationStateV2;
  future: ConfigurationStateV2[];
  maxSize: number;
}
