
import { ConfigurationState, PriceBreakdownStructure, Preset } from './types';

export const MATERIALS = {
  pebble_bisque: { color: '#EFECE4', roughness: 0.6, metalness: 0, envMapIntensity: 0.5 },
  pebble_noir: { color: '#2C2C2C', roughness: 0.5, metalness: 0, envMapIntensity: 0.5 },
  smooth_latte: { color: '#D0C5B8', roughness: 0.3, metalness: 0, envMapIntensity: 0.8 },
  leather_sienna: { color: '#C16646', roughness: 0.6, metalness: 0, envMapIntensity: 0.5 },
  brass_antique: { color: '#D4AF37', roughness: 0.3, metalness: 0.8, envMapIntensity: 1 },
  silver_polish: { color: '#C0C0C0', roughness: 0.2, metalness: 0.9, envMapIntensity: 1 },
};

export const DEFAULT_CONFIGURATION: ConfigurationState = {
  username: 'Guest',
  
  handleSize: 'standard',
  handleConfig: 'single',
  handleMaterial: 'same',
  handlePrint: 'none',
  handleText: 'none',
  
  surfaceTreatment: 'natural',
  surfacePrint: 'none',
  surfaceTexture: 'pebbled',
  surfaceHardware: 'gold',
  surfaceText: 'none',
};

export const PRICE_BREAKDOWN: PriceBreakdownStructure = {
  base: 275,
  handle: {
    size: 15,
    chain: 45,
    contrast: 25,
  },
  surface: {
    print: 35,
  }
};

export const PRESETS: Preset[] = [
  {
    name: "Studio Noir",
    config: {
      handleSize: 'standard',
      handleConfig: 'double',
      handleMaterial: 'same',
      handlePrint: 'none',
      handleText: 'none',
      surfaceTreatment: 'waxed',
      surfacePrint: 'none',
      surfaceTexture: 'smooth',
      surfaceHardware: 'silver',
      surfaceText: 'none',
    }
  },
  {
    name: "Weekend Canvas",
    config: {
      handleSize: 'extended',
      handleConfig: 'single',
      handleMaterial: 'contrast',
      handlePrint: 'camo',
      handleText: 'initials',
      surfaceTreatment: 'natural',
      surfacePrint: 'pattern',
      surfaceTexture: 'pebbled',
      surfaceHardware: 'gold',
      surfaceText: 'patch',
    }
  }
];

export const OPTION_GROUPS = {
  handle: {
    label: "Handle",
    steps: [
      // Materials Tab
      {
        id: 'handleMaterial',
        label: 'Material',
        category: 'materials',
        options: [
          { id: 'same', label: 'Match Body', price: 0 },
          { id: 'contrast', label: 'Contrast Leather', price: 25 },
          { id: 'chain', label: 'Gold Chain', price: 45 },
        ]
      },
      // Details Tab
      {
        id: 'handleSize',
        label: 'Length',
        category: 'details',
        options: [
          { id: 'standard', label: 'Standard', price: 0 },
          { id: 'extended', label: 'Extended', price: 15 },
        ]
      },
      {
        id: 'handleConfig',
        label: 'Configuration',
        category: 'details',
        options: [
          { id: 'single', label: 'Single Strap', price: 0 },
          { id: 'double', label: 'Double Strap', price: 10 },
        ]
      },
      // Images Tab
      {
        id: 'handlePrint',
        label: 'Strap Pattern',
        category: 'images',
        options: [
          { id: 'none', label: 'Solid', price: 0 },
          { id: 'camo', label: 'Camo Print', price: 20 },
        ]
      },
      // Text Tab
      {
        id: 'handleText',
        label: 'Engraving',
        category: 'text',
        options: [
          { id: 'none', label: 'None', price: 0 },
          { id: 'initials', label: 'Initials', price: 15 },
        ]
      }
    ]
  },
  surface: {
    label: "Surface",
    steps: [
      // Materials Tab
      {
        id: 'surfaceTreatment',
        label: 'Finish',
        category: 'materials',
        options: [
          { id: 'natural', label: 'Natural Matte', price: 0 },
          { id: 'waxed', label: 'Waxed Coating', price: 20 },
        ]
      },
      {
        id: 'surfaceTexture',
        label: 'Leather Grain',
        category: 'materials',
        options: [
          { id: 'pebbled', label: 'Pebbled', price: 0 },
          { id: 'smooth', label: 'Smooth', price: 0 },
        ]
      },
      // Details Tab
      {
        id: 'surfaceHardware',
        label: 'Hardware',
        category: 'details',
        options: [
          { id: 'gold', label: 'Polished Gold', price: 0 },
          { id: 'silver', label: 'Brushed Silver', price: 0 },
        ]
      },
      // Images Tab
      {
        id: 'surfacePrint',
        label: 'Print',
        category: 'images',
        options: [
          { id: 'none', label: 'No Print', price: 0 },
          { id: 'pattern', label: 'Geometric', price: 35 },
          { id: 'monogram', label: 'Monogram Grid', price: 35 },
        ]
      },
      // Text Tab
      {
        id: 'surfaceText',
        label: 'Label',
        category: 'text',
        options: [
          { id: 'none', label: 'Standard Tag', price: 0 },
          { id: 'patch', label: 'Custom Patch', price: 25 },
        ]
      }
    ]
  }
};

// Helper to lookup a readable label for a given config key and value
export const getOptionLabel = (key: keyof ConfigurationState, value: string): string => {
  let foundLabel = value;
  
  // Search in handle groups
  OPTION_GROUPS.handle.steps.forEach(step => {
    if (step.id === key) {
      const opt = step.options.find(o => o.id === value);
      if (opt) foundLabel = opt.label;
    }
  });

  // Search in surface groups
  OPTION_GROUPS.surface.steps.forEach(step => {
    if (step.id === key) {
      const opt = step.options.find(o => o.id === value);
      if (opt) foundLabel = opt.label;
    }
  });

  return foundLabel;
};

// Mapping from step IDs to their category tabs
export const STEP_CATEGORY_LOOKUP: Record<string, string> = {
  // Handle steps
  handleMaterial: 'materials',
  handleSize: 'details',
  handleConfig: 'details',
  handlePrint: 'images',
  handleText: 'text',
  // Surface steps
  surfaceTreatment: 'materials',
  surfaceTexture: 'materials',
  surfaceHardware: 'details',
  surfacePrint: 'images',
  surfaceText: 'text',
};