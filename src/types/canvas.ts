import type { Part, PartRole, PartGroup } from './parts';
import type { Asset } from './assets';
import type { CapabilityConfigMap, ModelAnalysisResult } from './capability-wizard';

export type CapabilityType =
  | 'material'
  | 'color'
  | 'finish'
  | 'part-swap'
  | 'add-on'
  | 'size'
  | 'shape'
  | 'print'
  | 'text'
  | 'engrave'
  | 'emboss'
  | 'hot-stamp';

export interface Capability {
  id: string;
  type: CapabilityType;
  partId: string;
  configured: boolean;
  config?: CapabilityConfig;
}

export interface CapabilityConfig {
  // Material
  options?: MaterialOption[];
  defaultOptionId?: string;

  // Print/Text/Engrave
  zones?: Zone[];
  allowUpload?: boolean;
  allowLibrary?: boolean;
  allowAI?: boolean;
  imageLibrary?: string[]; // asset IDs
  minResolution?: number; // DPI
  allowedFormats?: string[];
  maxFileSize?: number; // bytes

  // Text/Monogram
  textType?: 'monogram' | 'free-text' | 'name';
  maxCharacters?: number;
  fonts?: string[]; // asset IDs
  colors?: string[];

  // Part Swap
  alternatives?: PartSwapAlternative[];

  // Add-on
  addOnItems?: AddOnItem[];

  // Pricing
  pricing?: PricingConfig;
}

export interface MaterialOption {
  id: string;
  name: string;
  customerName: string;
  textureId?: string; // asset ID
  price: number;
  isDefault: boolean;
}

export interface PartSwapAlternative {
  id: string;
  name: string;
  modelId?: string; // asset ID for 3D model
  price: number;
  isDefault: boolean;
}

export interface AddOnItem {
  id: string;
  name: string;
  modelId?: string; // asset ID for 3D model
  maxQuantity: number;
  price: number;
}

export interface PricingConfig {
  model: 'fixed' | 'per-option' | 'by-size' | 'per-character' | 'none';
  basePrice?: number;
  optionPrices?: Record<string, number>;
  perCm2?: number;
  perCharacter?: number;
}

export interface Zone {
  id: string;
  partId: string;
  name: string;
  uvBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  size: {
    width: number; // cm
    height: number; // cm
  };
  position: {
    x: 'left' | 'center' | 'right';
    y: 'top' | 'center' | 'bottom';
  };
  allowedCapabilities: CapabilityType[];
  allowRepositioning?: boolean;
}

export interface Product {
  id: string;
  shopifyProductId?: string;
  name: string;
  price: number;
  description?: string;
  images: string[];
  category: string;
  tags: string[];
  status: 'not-setup' | 'draft' | 'active';
}

export interface ProductGraph {
  product: Product;
  parts: Part[];
  capabilities: Capability[];
  zones: Zone[];
  assets: Asset[];
}

export type Screen = 
  | 'product' 
  | 'assets' 
  | 'capabilities' 
  | 'canvas' 
  | 'demo' 
  | 'tour'
  | 'theme-check'    // Shopify: Check theme compatibility
  | 'activation'     // Shopify: Enable customizer in theme
  | 'billing';       // Shopify: Plan selection
export type Overlay = 'zone' | 'capability' | 'preview' | null;

export interface HistoryState {
  timestamp: number;
  action: string;
  state: Partial<CanvasState>;
}

export interface CanvasState {
  // Product
  selectedProduct: Product | null;

  // Assets
  assets: {
    models: Asset[];
    textures: Asset[];
    images: Asset[];
    fonts: Asset[];
  };

  // Parts
  parts: Part[];
  selectedPartId: string | null;
  hoveredPartId: string | null;
  partGroups: PartGroup[];

  // Capabilities
  capabilities: Map<string, Capability[]>; // partId -> capabilities

  // Zones
  zones: Map<string, Zone[]>; // partId -> zones

  // UI State
  currentScreen: Screen;
  activeOverlay: Overlay;
  overlayData?: {
    partId?: string;
    capabilityId?: string;
    zoneId?: string;
  };

  // Undo/Redo
  history: HistoryState[];
  historyIndex: number;

  // Capability Selection
  selectedCapabilities: CapabilityConfigMap;
  modelAnalysis?: ModelAnalysisResult;

  // Shopify-specific state
  shopify: {
    themeCompatible: boolean | null;
    activationComplete: boolean;
    billingPlan: 'starter' | 'pro' | 'enterprise' | null;
    billingAddons: string[];
    trialActive: boolean;
  };
}

