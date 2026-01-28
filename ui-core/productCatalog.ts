// Product Catalog - Aurora Bag with Tree Structure
// This replaces the flat OPTION_GROUPS with hierarchical TreeNode data

import { Product, TreeNode, Material, ValidationRule, PricingRule } from './types-tree';

/**
 * AURORA BAG - Complete Tree Definition
 */
export const AURORA_BAG_TREE: TreeNode[] = [
  // ==================== BODY COMPONENT ====================
  {
    id: 'node-body',
    type: 'component',
    label: 'BODY',
    depth: 1,
    clickable: true,
    required: true,
    children: [
      // Material Attribute (parent of Finish and Color)
      {
        id: 'node-body-material',
        type: 'attribute',
        label: 'Material',
        depth: 2,
        clickable: true,
        action: 'modify',
        required: true,
        default: 'pebbled-leather',
        state: 'default',
        metadata: {
          category: 'materials',
        },
        linkedParts: ['mesh-body'],
        children: [
          {
            id: 'opt-material-pebbled',
            type: 'option',
            label: 'Pebbled Leather',
            depth: 3,
            clickable: true,
            required: false,
            priceModifier: 0,
            default: true,
            metadata: {
              thumbnail: '/textures/pebbled-preview.jpg',
            },
            linkedParts: ['mesh-body'],
          },
          {
            id: 'opt-material-smooth',
            type: 'option',
            label: 'Smooth Leather',
            depth: 3,
            clickable: true,
            required: false,
            priceModifier: 10,
            metadata: {
              thumbnail: '/textures/smooth-preview.jpg',
            },
            linkedParts: ['mesh-body'],
          },
          {
            id: 'opt-material-suede',
            type: 'option',
            label: 'Suede',
            depth: 3,
            clickable: true,
            required: false,
            priceModifier: 25,
            metadata: {
              thumbnail: '/textures/suede-preview.jpg',
            },
            linkedParts: ['mesh-body'],
          },
          // Finish - nested under Material
          {
            id: 'node-body-finish',
            type: 'attribute',
            label: 'Finish',
            depth: 3,
            clickable: true,
            action: 'modify',
            required: true,
            default: 'natural',
            state: 'default',
            metadata: {
              category: 'materials',
            },
            linkedParts: ['mesh-body'],
            children: [
              {
                id: 'opt-finish-natural',
                type: 'option',
                label: 'Natural',
                depth: 4,
                clickable: true,
                required: false,
                priceModifier: 0,
                default: true,
                linkedParts: ['mesh-body'],
              },
              {
                id: 'opt-finish-waxed',
                type: 'option',
                label: 'Waxed',
                depth: 4,
                clickable: true,
                required: false,
                priceModifier: 10,
                linkedParts: ['mesh-body'],
              },
              {
                id: 'opt-finish-patent',
                type: 'option',
                label: 'Patent',
                depth: 4,
                clickable: true,
                required: false,
                priceModifier: 20,
                linkedParts: ['mesh-body'],
              },
            ],
          },
          // Color - nested under Material
          {
            id: 'node-body-color',
            type: 'attribute',
            label: 'Color',
            depth: 3,
            clickable: true,
            action: 'modify',
            required: true,
            default: 'natural',
            state: 'default',
            metadata: {
              category: 'materials',
            },
            linkedParts: ['mesh-body'],
            children: [
              {
                id: 'opt-color-natural',
                type: 'option',
                label: 'Natural',
                depth: 4,
                clickable: true,
                required: false,
                priceModifier: 0,
                default: true,
                metadata: {
                  thumbnail: '/colors/natural.jpg',
                },
                linkedParts: ['mesh-body'],
              },
              {
                id: 'opt-color-emerald',
                type: 'option',
                label: 'Emerald',
                depth: 4,
                clickable: true,
                required: false,
                priceModifier: 15,
                metadata: {
                  thumbnail: '/colors/emerald.jpg',
                },
                linkedParts: ['mesh-body'],
              },
              {
                id: 'opt-color-navy',
                type: 'option',
                label: 'Navy',
                depth: 4,
                clickable: true,
                required: false,
                priceModifier: 15,
                constraints: {
                  requiredWith: ['opt-hardware-silver'],
                },
                metadata: {
                  thumbnail: '/colors/navy.jpg',
                },
                linkedParts: ['mesh-body'],
              },
              {
                id: 'opt-color-black',
                type: 'option',
                label: 'Black',
                depth: 4,
                clickable: true,
                required: false,
                priceModifier: 10,
                metadata: {
                  thumbnail: '/colors/black.jpg',
                },
                linkedParts: ['mesh-body'],
              },
              {
                id: 'opt-color-oxblood',
                type: 'option',
                label: 'Oxblood',
                depth: 4,
                clickable: true,
                required: false,
                priceModifier: 18,
                metadata: {
                  thumbnail: '/colors/oxblood.jpg',
                },
                linkedParts: ['mesh-body'],
              },
              {
                id: 'opt-color-cognac',
                type: 'option',
                label: 'Cognac',
                depth: 4,
                clickable: true,
                required: false,
                priceModifier: 12,
                metadata: {
                  thumbnail: '/colors/cognac.jpg',
                },
                linkedParts: ['mesh-body'],
              },
              {
                id: 'opt-color-chocolate',
                type: 'option',
                label: 'Chocolate',
                depth: 4,
                clickable: true,
                required: false,
                priceModifier: 12,
                metadata: {
                  thumbnail: '/colors/chocolate.jpg',
                },
                linkedParts: ['mesh-body'],
              },
              {
                id: 'opt-color-taupe',
                type: 'option',
                label: 'Taupe',
                depth: 4,
                clickable: true,
                required: false,
                priceModifier: 8,
                metadata: {
                  thumbnail: '/colors/taupe.jpg',
                },
                linkedParts: ['mesh-body'],
              },
              {
                id: 'opt-color-stone',
                type: 'option',
                label: 'Stone',
                depth: 4,
                clickable: true,
                required: false,
                priceModifier: 6,
                metadata: {
                  thumbnail: '/colors/stone.jpg',
                },
                linkedParts: ['mesh-body'],
              },
              {
                id: 'opt-color-olive',
                type: 'option',
                label: 'Olive',
                depth: 4,
                clickable: true,
                required: false,
                priceModifier: 10,
                metadata: {
                  thumbnail: '/colors/olive.jpg',
                },
                linkedParts: ['mesh-body'],
              },
              {
                id: 'opt-color-saffron',
                type: 'option',
                label: 'Saffron',
                depth: 4,
                clickable: true,
                required: false,
                priceModifier: 10,
                metadata: {
                  thumbnail: '/colors/saffron.jpg',
                },
                linkedParts: ['mesh-body'],
              },
              {
                id: 'opt-color-blush',
                type: 'option',
                label: 'Blush',
                depth: 4,
                clickable: true,
                required: false,
                priceModifier: 8,
                metadata: {
                  thumbnail: '/colors/blush.jpg',
                },
                linkedParts: ['mesh-body'],
              },
              {
                id: 'opt-color-plum',
                type: 'option',
                label: 'Plum',
                depth: 4,
                clickable: true,
                required: false,
                priceModifier: 12,
                metadata: {
                  thumbnail: '/colors/plum.jpg',
                },
                linkedParts: ['mesh-body'],
              },
              {
                id: 'opt-color-cloud',
                type: 'option',
                label: 'Cloud',
                depth: 4,
                clickable: true,
                required: false,
                priceModifier: 5,
                metadata: {
                  thumbnail: '/colors/cloud.jpg',
                },
                linkedParts: ['mesh-body'],
              },
            ],
          },
        ],
      },

      // Base Attribute (separate from Material - structural element)
      {
        id: 'node-body-base',
        type: 'attribute',
        label: 'Base',
        depth: 2,
        clickable: true,
        action: 'modify',
        required: true,
        default: 'standard',
        state: 'default',
        metadata: {
          category: 'details',
        },
        linkedParts: ['mesh-body'],
        children: [
          {
            id: 'opt-base-standard',
            type: 'option',
            label: 'Standard',
            depth: 3,
            clickable: true,
            required: false,
            priceModifier: 0,
            default: true,
            linkedParts: ['mesh-body'],
          },
          {
            id: 'opt-base-reinforced',
            type: 'option',
            label: 'Reinforced',
            depth: 3,
            clickable: true,
            required: false,
            priceModifier: 15,
            linkedParts: ['mesh-body'],
          },
        ],
      },
    ],
  },

  // ==================== HANDLE COMPONENT ====================
  {
    id: 'node-handle',
    type: 'component',
    label: 'HANDLE',
    depth: 1,
    clickable: true,
    required: true,
    children: [
      // Handle Style (parent of Length and Config)
      {
        id: 'node-handle-style',
        type: 'attribute',
        label: 'Style',
        depth: 2,
        clickable: true,
        action: 'modify',
        required: true,
        default: 'match-body',
        state: 'default',
        metadata: {
          category: 'materials',
        },
        linkedParts: ['mesh-handle'],
        children: [
          {
            id: 'opt-handle-match',
            type: 'option',
            label: 'Match Body',
            depth: 3,
            clickable: true,
            required: false,
            priceModifier: 0,
            default: true,
            linkedParts: ['mesh-handle'],
          },
          {
            id: 'opt-handle-contrast',
            type: 'option',
            label: 'Contrast Leather',
            depth: 3,
            clickable: true,
            required: false,
            priceModifier: 25,
            linkedParts: ['mesh-handle'],
          },
          {
            id: 'opt-handle-chain',
            type: 'option',
            label: 'Chain',
            depth: 3,
            clickable: true,
            required: false,
            priceModifier: 45,
            constraints: {
              incompatibleWith: ['opt-handle-print-pattern'],
            },
            linkedParts: ['mesh-handle'],
          },
          {
            id: 'opt-handle-rope',
            type: 'option',
            label: 'Climbing Rope',
            depth: 3,
            clickable: true,
            required: false,
            priceModifier: 20,
            linkedParts: ['mesh-handle'],
          },
          // Length - nested under Style
          {
            id: 'node-handle-length',
            type: 'attribute',
            label: 'Length',
            depth: 3,
            clickable: true,
            action: 'modify',
            required: true,
            default: 'standard',
            state: 'default',
            metadata: {
              category: 'details',
            },
            linkedParts: ['mesh-handle'],
            children: [
              {
                id: 'opt-length-standard',
                type: 'option',
                label: 'Standard',
                depth: 4,
                clickable: true,
                required: false,
                priceModifier: 0,
                default: true,
                linkedParts: ['mesh-handle'],
              },
              {
                id: 'opt-length-extended',
                type: 'option',
                label: 'Extended',
                depth: 4,
                clickable: true,
                required: false,
                priceModifier: 15,
                linkedParts: ['mesh-handle'],
              },
              {
                id: 'opt-length-custom',
                type: 'option',
                label: 'Custom',
                depth: 4,
                clickable: true,
                required: false,
                priceType: 'formula',
                priceFormula: 'basePrice + (length - 24) * 2',
                linkedParts: ['mesh-handle'],
              },
            ],
          },
          // Config - nested under Style
          {
            id: 'node-handle-config',
            type: 'attribute',
            label: 'Config',
            depth: 3,
            clickable: true,
            action: 'modify',
            required: true,
            default: 'single',
            state: 'default',
            metadata: {
              category: 'details',
            },
            linkedParts: ['mesh-handle'],
            children: [
              {
                id: 'opt-config-single',
                type: 'option',
                label: 'Single',
                depth: 4,
                clickable: true,
                required: false,
                priceModifier: 0,
                default: true,
                linkedParts: ['mesh-handle'],
              },
              {
                id: 'opt-config-double',
                type: 'option',
                label: 'Double',
                depth: 4,
                clickable: true,
                required: false,
                priceModifier: 20,
                linkedParts: ['mesh-handle'],
              },
            ],
          },
        ],
      },

      // Add Charm (ACTION node - separate from Style)
      {
        id: 'action-add-charm',
        type: 'action',
        label: '+ Add Charm',
        depth: 2,
        clickable: true,
        action: 'add',
        required: false,
        state: 'available',
        priceModifier: 12,
        metadata: {
          category: 'details',
        },
        linkedParts: ['mesh-handle'],
      },
    ],
  },

  // ==================== CLASP COMPONENT ====================
  {
    id: 'node-clasp',
    type: 'component',
    label: 'CLASP',
    depth: 1,
    clickable: true,
    required: true,
    children: [
      {
        id: 'node-clasp-type',
        type: 'attribute',
        label: 'Type',
        depth: 2,
        clickable: true,
        action: 'modify',
        required: true,
        default: 'magnetic',
        state: 'default',
        metadata: {
          category: 'details',
        },
        linkedParts: ['mesh-clasp'],
        children: [
          {
            id: 'opt-clasp-magnetic',
            type: 'option',
            label: 'Magnetic',
            depth: 3,
            clickable: true,
            required: false,
            priceModifier: 0,
            default: true,
            linkedParts: ['mesh-clasp'],
          },
          {
            id: 'opt-clasp-turnlock',
            type: 'option',
            label: 'Turn Lock',
            depth: 3,
            clickable: true,
            required: false,
            priceModifier: 15,
            linkedParts: ['mesh-clasp'],
          },
          {
            id: 'opt-clasp-zipper',
            type: 'option',
            label: 'Zipper',
            depth: 3,
            clickable: true,
            required: false,
            priceModifier: 10,
            linkedParts: ['mesh-clasp'],
          },
          // Finish - nested under Type (hardware finish is property of clasp type)
          {
            id: 'node-clasp-finish',
            type: 'attribute',
            label: 'Finish',
            depth: 3,
            clickable: true,
            action: 'modify',
            required: true,
            default: 'polished',
            state: 'default',
            metadata: {
              category: 'materials',
            },
            linkedParts: ['mesh-clasp'],
            children: [
              {
                id: 'opt-hardware-polished',
                type: 'option',
                label: 'Polished Gold',
                depth: 4,
                clickable: true,
                required: false,
                priceModifier: 0,
                default: true,
                linkedParts: ['mesh-clasp', 'mesh-hardware'],
              },
              {
                id: 'opt-hardware-silver',
                type: 'option',
                label: 'Brushed Silver',
                depth: 4,
                clickable: true,
                required: false,
                priceModifier: 5,
                linkedParts: ['mesh-clasp', 'mesh-hardware'],
              },
              {
                id: 'opt-hardware-black',
                type: 'option',
                label: 'Matte Black',
                depth: 4,
                clickable: true,
                required: false,
                priceModifier: 8,
                linkedParts: ['mesh-clasp', 'mesh-hardware'],
              },
            ],
          },
        ],
      },
    ],
  },

  // ==================== PERSONALIZATION COMPONENT ====================
  {
    id: 'node-personalization',
    type: 'component',
    label: 'PERSONALIZATION',
    depth: 1,
    clickable: false,
    required: false,
    children: [
      // Monogram (attribute)
      {
        id: 'node-monogram',
        type: 'attribute',
        label: 'Monogram',
        depth: 2,
        clickable: true,
        action: 'modify',
        required: false,
        default: 'none',
        state: 'default',
        metadata: {
          category: 'text',
        },
        linkedParts: ['mesh-body'],
        children: [
          {
            id: 'opt-monogram-none',
            type: 'option',
            label: 'None',
            depth: 3,
            clickable: true,
            required: false,
            priceModifier: 0,
            linkedParts: ['mesh-body'],
          },
          {
            id: 'opt-monogram-initials',
            type: 'option',
            label: 'Initials (1-3 letters)',
            depth: 3,
            clickable: true,
            required: false,
            priceModifier: 15,
            linkedParts: ['mesh-body'],
          },
          {
            id: 'opt-monogram-name',
            type: 'option',
            label: 'Name (up to 8 letters)',
            depth: 3,
            clickable: true,
            required: false,
            priceModifier: 20,
            linkedParts: ['mesh-body'],
          },
        ],
      },

      // Add Print (ACTION node)
      {
        id: 'action-add-print',
        type: 'action',
        label: '+ Add Print',
        depth: 2,
        clickable: true,
        action: 'add',
        required: false,
        state: 'available',
        priceModifier: 15,
        metadata: {
          category: 'images',
        },
        linkedParts: ['mesh-body'],
      },

      // Add Text (ACTION node)
      {
        id: 'action-add-text',
        type: 'action',
        label: '+ Add Text',
        depth: 2,
        clickable: true,
        action: 'add',
        required: false,
        state: 'available',
        priceModifier: 20,
        metadata: {
          category: 'text',
        },
        linkedParts: ['mesh-body'],
      },
    ],
  },
];

/**
 * Material Catalog
 */
export const MATERIAL_CATALOG: Material[] = [
  {
    id: 'pebble-bisque',
    name: 'Pebbled Bisque',
    type: 'leather',
    color: '#EFECE4',
    finish: 'matte',
    price: 0,
    inStock: true,
    rendering: {
      roughness: 0.6,
      metalness: 0,
      envMapIntensity: 0.5,
    },
  },
  {
    id: 'smooth-latte',
    name: 'Smooth Latte',
    type: 'leather',
    color: '#D0C5B8',
    finish: 'matte',
    price: 10,
    inStock: true,
    rendering: {
      roughness: 0.3,
      metalness: 0,
      envMapIntensity: 0.8,
    },
  },
  {
    id: 'suede-navy',
    name: 'Navy Suede',
    type: 'leather',
    color: '#1A2B4A',
    finish: 'matte',
    price: 25,
    inStock: true,
    rendering: {
      roughness: 0.8,
      metalness: 0,
      envMapIntensity: 0.4,
    },
  },
  {
    id: 'brass-antique',
    name: 'Antique Brass',
    type: 'metal',
    color: '#D4AF37',
    finish: 'metallic',
    price: 0,
    inStock: true,
    rendering: {
      roughness: 0.3,
      metalness: 0.8,
      envMapIntensity: 1,
    },
  },
  {
    id: 'silver-polish',
    name: 'Polished Silver',
    type: 'metal',
    color: '#C0C0C0',
    finish: 'metallic',
    price: 5,
    inStock: true,
    rendering: {
      roughness: 0.2,
      metalness: 0.9,
      envMapIntensity: 1,
    },
  },
];

/**
 * Validation Rules
 */
export const VALIDATION_RULES: ValidationRule[] = [
  {
    id: 'rule-navy-requires-silver',
    name: 'Navy leather requires silver hardware',
    type: 'blocking',
    condition: (config, tree) => {
      // Check if body color is navy
      const bodyColorSelection = config.selections['node-body-color'];
      const hardwareSelection = config.selections['node-clasp-finish'];

      return (
        bodyColorSelection?.value === 'opt-color-navy' &&
        hardwareSelection?.value !== 'opt-hardware-silver'
      );
    },
    message: 'Navy leather is only available with silver hardware.',
    fixSuggestion: 'Change hardware to silver, or choose a different leather color.',
  },
  {
    id: 'rule-chain-no-prints',
    name: 'Chain handles cannot have prints',
    type: 'blocking',
    condition: (config, tree) => {
      const handleTypeSelection = config.selections['node-handle-type'];
      const hasPrints = config.customizations.images && config.customizations.images.length > 0;

      return (
        handleTypeSelection?.value === 'opt-handle-chain' &&
        hasPrints === true
      );
    },
    message: 'Chain handles cannot have prints.',
    fixSuggestion: 'Remove prints or switch to leather handle.',
  },
  {
    id: 'rule-text-length',
    name: 'Text must not exceed maximum length',
    type: 'blocking',
    condition: (config, tree) => {
      const textElements = config.customizations.text || [];
      return textElements.some((t) => t.content.length > 20);
    },
    message: 'Text must be 20 characters or less.',
    fixSuggestion: 'Shorten your text or split into multiple lines.',
  },
];

/**
 * Pricing Rules
 */
export const PRICING_RULES: PricingRule[] = [
  {
    id: 'pricing-base',
    scope: 'base',
    formula: 'fixed',
    basePrice: 275,
    currency: 'USD',
  },
  {
    id: 'pricing-text-per-char',
    scope: 'customization',
    formula: 'per_unit',
    rate: 1.5, // $1.50 per character
    currency: 'USD',
  },
  {
    id: 'pricing-print-per-area',
    scope: 'customization',
    formula: 'custom',
    customFormula: 'area * 2.5 + 10', // $2.50 per sq inch + $10 base
    currency: 'USD',
  },
];

/**
 * Complete Product Definition
 */
export const AURORA_BAG: Product = {
  id: 'aurora-bag-001',
  name: 'Aurora Tote',
  description: 'Handcrafted leather tote with customizable options',
  basePrice: 275,
  currency: 'USD',

  customizationTree: AURORA_BAG_TREE,

  catalog: {
    materials: MATERIAL_CATALOG,
    textures: [],
    patterns: [],
  },

  rules: VALIDATION_RULES,
  pricingRules: PRICING_RULES,
};
