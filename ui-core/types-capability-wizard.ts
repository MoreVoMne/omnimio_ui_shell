/**
 * Type definitions for Capability Walkthrough Wizard (v2)
 * Implements capability-first merchant setup to solve the "68-part problem"
 */

// ============================================================================
// SCREEN 0: Upload & Analysis
// ============================================================================

export type UploadState =
  | 'empty'
  | 'uploading'
  | 'analyzing'
  | 'ready'
  | 'needs-attention';

export interface ModelAnalysisResult {
  partsCount: number;
  materialsCount: number;
  uvMapDetected: boolean;
  warnings: string[];
  recommendations: string[];
}

// ============================================================================
// SCREEN 1: Capability Selection
// ============================================================================

export type CapabilityType =
  | 'size'
  | 'materials-colors'
  | 'parts-addons'
  | 'personalization';

export interface CapabilityConfig {
  enabled: boolean;
  miniChoices?: {
    // Size
    presets?: boolean;
    customInput?: boolean;

    // Materials & Colors
    material?: boolean;
    color?: boolean;
    variant?: boolean;

    // Parts & Add-ons
    optional?: boolean;
    swappable?: boolean;
    addons?: boolean;

    // Personalization
    text?: boolean;
    image?: boolean;
    pattern?: boolean;
  };
}

export type CapabilityConfigMap = Record<CapabilityType, CapabilityConfig>;

// ============================================================================
// SCREEN 2: Part Selection & Targeting
// ============================================================================

export type PartTargetingMode =
  | 'all'           // All parts
  | 'some'          // Some parts (select)
  | 'except'        // All except (select exclusions)
  | 'none';         // None (default, select which have this)

export interface PartIdentity {
  id: string;
  label: string;         // Default: "Part 17"
  meshName?: string;     // Technical hint: "sleeve_L_03"
  materialIndex?: number;
  area?: number;
}

export interface PartSelectionState {
  selectedPartIds: Set<string>;
  targetingMode: PartTargetingMode;
  isSelectionModeActive: boolean;
  currentCapability?: CapabilityType;
}

// ============================================================================
// CAPABILITY CONFIGURATIONS
// ============================================================================

// Size
export interface SizePreset {
  id: string;
  label: string;  // "Small", "Medium", "Large"
  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
    length?: number;
  };
  isDefault: boolean;
}

export interface CustomSizeConfig {
  allowedDimensions: ('width' | 'height' | 'depth' | 'length')[];
  ranges: Record<string, { min: number; max: number; step: number }>;
  lockProportions: boolean;
  extraPrice?: number;
}

export interface SizeCapabilityData {
  usePresets: boolean;
  presets: SizePreset[];
  defaultPresetId?: string;
  useCustomInput: boolean;
  customConfig?: CustomSizeConfig;
}

// Materials & Colors
export interface MaterialVariant {
  id: string;
  label: string;  // "Matte", "Glossy", "Textured"
}

export interface ColorOption {
  id: string;
  label: string;
  hex: string;
}

export interface MaterialOption {
  id: string;
  label: string;
  isDefault: boolean;
  colors: ColorOption[];
  variants: MaterialVariant[];
  priceModifier?: number;
}

export interface MaterialsColorsCapabilityData {
  targetingMode: PartTargetingMode;
  selectedPartIds: string[];
  excludedPartIds: string[];
  allowMaterial: boolean;
  allowColor: boolean;
  allowVariant: boolean;
  materials: MaterialOption[];
  standaloneColors?: ColorOption[];  // If material is off but color is on
  exceptions: ExceptionRule[];
}

// Parts & Add-ons
export type PartsConfigurationType = 'optional' | 'swappable' | 'addon';

export interface PartVariant {
  id: string;
  label: string;
  assetUrl?: string;
  priceModifier: number;
}

export interface PartsAddonsCapabilityData {
  configurablePartIds: string[];
  configType: PartsConfigurationType[];

  // Optional
  defaultState?: 'on' | 'off';

  // Swappable
  variants?: PartVariant[];

  // Add-on
  quantityMin?: number;
  quantityMax?: number;
  needsPlacement?: boolean;

  exceptions: ExceptionRule[];
}

// Personalization
export type PersonalizationType = 'text' | 'image' | 'pattern';

export type ProductionMethodType =
  | 'print'
  | 'transfer'
  | 'emboss'
  | 'engrave'
  | 'other';

export type PricingTemplate =
  | 'flat'
  | 'per-area'
  | 'per-character'
  | 'per-item';

export interface ProductionMethod {
  id: string;
  methodType: ProductionMethodType;
  maxSize?: { width: number; height: number };
  allowedColors?: ColorOption[] | 'any';
  supportsRaisedEffect: boolean;
  pricingTemplate: PricingTemplate;
  rate: number;
  minimum?: number;
}

export interface PersonalizationCapabilityData {
  targetPartIds: string[];
  types: PersonalizationType[];
  methods: ProductionMethod[];

  placementMode: 'anywhere' | 'predefined-spots';
  spots?: string[];  // Spot IDs, defined later

  uvMapDetected: boolean;
  physicalScaleCalibrated: boolean;
  scaleCalibrationData?: {
    point1: { x: number; y: number };
    point2: { x: number; y: number };
    realWorldDistance: number;
    unit: 'cm' | 'in';
  };

  exceptions: ExceptionRule[];
}

// ============================================================================
// GENERIC EXCEPTION RULES
// ============================================================================

export type ExceptionConditionType =
  | 'material'
  | 'color'
  | 'variant'
  | 'size-preset'
  | 'custom-size-value'
  | 'part-selected';

export type ExceptionOperator =
  | 'is'
  | 'is-not'
  | 'in'
  | 'not-in'
  | 'gte'
  | 'lte';

export type ExceptionAction =
  | 'disable-option'
  | 'hide-method'
  | 'change-max-size'
  | 'change-price';

export interface ExceptionRule {
  id: string;
  when: ExceptionConditionType;
  operator: ExceptionOperator;
  value: string | string[] | number;
  then: ExceptionAction;
  payload?: number | string;  // Amount, size, etc.
  message?: string;  // Customer-facing message
}

// ============================================================================
// OVERALL WIZARD STATE
// ============================================================================

export interface CapabilityWizardState {
  // Screen tracking
  currentScreen: 0 | 1 | 2 | 'review';
  currentCapabilityIndex: number;

  // Screen 0
  uploadState: UploadState;
  modelFile?: File;
  modelUrl?: string;
  analysisResult?: ModelAnalysisResult;

  // Screen 1
  capabilities: CapabilityConfigMap;

  // Screen 2 - Collected data
  sizeData?: SizeCapabilityData;
  materialsColorsData?: MaterialsColorsCapabilityData;
  partsAddonsData?: PartsAddonsCapabilityData;
  personalizationData?: PersonalizationCapabilityData;

  // Part selection state
  parts: PartIdentity[];
  partSelection: PartSelectionState;

  // Progress tracking
  completedCapabilities: Set<CapabilityType>;
}

// ============================================================================
// UI COMPONENT PROPS
// ============================================================================

export interface QuizCardProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onNext?: () => void;
  onSkip?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

export interface PartSelectionToolbarProps {
  selectedCount: number;
  totalCount: number;
  onClear: () => void;
  onSelectAll: () => void;
  onInvert: () => void;
  onDone: () => void;
}

export interface FastSelectorProps {
  parts: PartIdentity[];
  selectedPartIds: Set<string>;
  onSelectionChange: (partIds: Set<string>) => void;
}
