// Types for the Merchant Wizard capability configuration

export type CapabilityId =
  | 'color'
  | 'material'
  | 'size'
  | 'shape'
  | 'text'
  | 'print'
  | 'engraving'
  | 'embossing'
  | 'swap_parts'
  | 'add_accessories';

export type CapabilityCategory =
  | 'structure'
  | 'appearance'
  | 'surface'
  | 'components';

export interface PartDefinition {
  id: string;
  name: string;
  mesh_index: number;
  role: 'base' | 'swappable' | 'add-on';
  parent_id: string | null;
}

export interface CapabilityOption {
  id: string;
  name: string;
  swatch_url?: string;
  price_modifier: number;
  is_default?: boolean;
  same_attachment_points?: boolean;
}

export interface ZoneDefinition {
  id: string;
  name: string;
  part_id: string;
  max_width_cm?: number;
  max_height_cm?: number;
  position_description?: string;
}

export interface CapabilityRule {
  id: string;
  if_capability: CapabilityId;
  if_option_id?: string;
  then_action: 'disable' | 'enable' | 'require';
  then_target_capability?: CapabilityId;
  then_target_part?: string;
  reason?: string;
}

export type ExportFormat =
  | 'config_json'
  | 'preview_png'
  | 'pattern_dxf_1to1'
  | 'bom_csv_pdf';

export type PricingModel =
  | { type: 'per_option' }
  | { type: 'fixed'; amount: number }
  | { type: 'per_unit'; amount: number }
  | { type: 'no_charge' };

export interface TextOptions {
  max_characters: number;
  fonts: { id: string; name: string; file_url?: string }[];
  block_profanity: boolean;
  uppercase_only: boolean;
}

export type SizeMode = 'discrete' | 'custom' | 'parametric';
export type SizeAdaptationMethod = 'deformation' | 'swap_models';

export interface DimensionConstraint {
  enabled: boolean;
  min: number;
  max: number;
  step: number;
}

export interface CustomDimension {
  id: string;
  enabled: boolean;
  name: string;
  min: number;
  max: number;
  step: number;
}

export interface SizePreset {
  id: string;
  name: string;
  width: number;
  length: number;
  height: number;
  price_modifier: number;
  is_default?: boolean;
  model_url?: string;
  model_name?: string;
  model_size_bytes?: number;
}

export interface SizeOptions {
  mode: SizeMode;
  unit: 'cm' | 'mm' | 'inches';
  dimensions: {
    width: DimensionConstraint;
    length: DimensionConstraint;
    height: DimensionConstraint;
    depth: DimensionConstraint;
  };
  custom_dimensions: CustomDimension[];
  presets: SizePreset[];
  allow_custom_dimensions: boolean;
  affected_parts: { part_id: string; scales: boolean }[];
  adaptation_method: SizeAdaptationMethod;
  pricing_mode: 'formula' | 'tiered' | 'per_unit' | 'area';
  base_price: number;
  price_per_cm2: number;
  price_per_cm3: number;
  price_per_unit: number;
  export_pattern_format: 'dxf' | 'svg' | 'pdf';
  export_scale: '1:1' | '1:2' | '1:4';
  include_dimension_sheet: boolean;
}

export interface CapabilityConfiguration {
  capability_id: CapabilityId;
  is_configured: boolean;
  applies_to_parts: string[];
  options: CapabilityOption[];
  zones: ZoneDefinition[];
  text_options?: TextOptions;
  size_options?: SizeOptions;
  rules: CapabilityRule[];
  export_formats: ExportFormat[];
  pattern_format?: 'dxf' | 'svg' | 'pdf';
  pattern_scale?: '1:1' | '1:2' | '1:4';
  same_attachment_points?: boolean;
  pricing: PricingModel;
}

export const INITIAL_CAPABILITY_CONFIG: CapabilityConfiguration = {
  capability_id: 'color',
  is_configured: false,
  applies_to_parts: [],
  options: [],
  zones: [],
  rules: [],
  export_formats: ['config_json'],
  pattern_format: 'dxf',
  pattern_scale: '1:1',
  pricing: { type: 'no_charge' },
};

export interface CapabilityDefinition {
  id: CapabilityId;
  label: string;
  description: string;
  category: CapabilityCategory;
  requires_uv: boolean;
  requires_zones: boolean;
  requires_ports: boolean;
  supports_options: boolean;
  supports_zones: boolean;
  supports_text_config: boolean;
}

export const CAPABILITY_CATEGORIES: { id: CapabilityCategory; label: string }[] = [
  { id: 'structure', label: 'Product Structure' },
  { id: 'appearance', label: 'Materials & Appearance' },
  { id: 'surface', label: 'Surface Customization' },
  { id: 'components', label: 'Parts & Components' },
];

export const CAPABILITY_DEFINITIONS: CapabilityDefinition[] = [
  {
    id: 'size',
    label: 'Size',
    description: 'Provide size variations or custom dimensions',
    category: 'structure',
    requires_uv: false,
    requires_zones: false,
    requires_ports: false,
    supports_options: true,
    supports_zones: false,
    supports_text_config: false,
  },
  {
    id: 'shape',
    label: 'Shape',
    description: 'Offer different shape variations (round, square, oval, etc.)',
    category: 'structure',
    requires_uv: false,
    requires_zones: false,
    requires_ports: false,
    supports_options: true,
    supports_zones: false,
    supports_text_config: false,
  },
  {
    id: 'material',
    label: 'Material',
    description: 'Offer different material options (leather, fabric, etc.)',
    category: 'appearance',
    requires_uv: false,
    requires_zones: false,
    requires_ports: false,
    supports_options: true,
    supports_zones: false,
    supports_text_config: false,
  },
  {
    id: 'color',
    label: 'Color',
    description: 'Let customers choose from predefined colors',
    category: 'appearance',
    requires_uv: false,
    requires_zones: false,
    requires_ports: false,
    supports_options: true,
    supports_zones: false,
    supports_text_config: false,
  },
  {
    id: 'text',
    label: 'Text',
    description: 'Add custom text, names, or monograms',
    category: 'surface',
    requires_uv: true,
    requires_zones: true,
    requires_ports: false,
    supports_options: false,
    supports_zones: true,
    supports_text_config: true,
  },
  {
    id: 'print',
    label: 'Print',
    description: 'Upload images or patterns to print on product',
    category: 'surface',
    requires_uv: true,
    requires_zones: true,
    requires_ports: false,
    supports_options: false,
    supports_zones: true,
    supports_text_config: false,
  },
  {
    id: 'engraving',
    label: 'Engraving',
    description: 'Laser or CNC engraving on surfaces',
    category: 'surface',
    requires_uv: true,
    requires_zones: true,
    requires_ports: false,
    supports_options: false,
    supports_zones: true,
    supports_text_config: true,
  },
  {
    id: 'embossing',
    label: 'Embossing',
    description: 'Raised or pressed patterns on leather/fabric',
    category: 'surface',
    requires_uv: true,
    requires_zones: true,
    requires_ports: false,
    supports_options: false,
    supports_zones: true,
    supports_text_config: false,
  },
  {
    id: 'swap_parts',
    label: 'Swap parts',
    description: 'Replace parts with alternatives (handles, straps, etc.)',
    category: 'components',
    requires_uv: false,
    requires_zones: false,
    requires_ports: true,
    supports_options: true,
    supports_zones: false,
    supports_text_config: false,
  },
  {
    id: 'add_accessories',
    label: 'Add accessories',
    description: 'Optional add-ons (charms, keychains, pouches)',
    category: 'components',
    requires_uv: false,
    requires_zones: false,
    requires_ports: true,
    supports_options: true,
    supports_zones: false,
    supports_text_config: false,
  },
];

export function getCapabilitiesByCategory(category: CapabilityCategory): CapabilityDefinition[] {
  return CAPABILITY_DEFINITIONS.filter((capability) => capability.category === category);
}

export function getDefaultExports(_capabilityId: CapabilityId): ExportFormat[] {
  return ['config_json', 'preview_png', 'pattern_dxf_1to1', 'bom_csv_pdf'];
}

