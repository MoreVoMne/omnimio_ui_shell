/**
 * Sample data for the alternative layout components
 * This maps to the L1 → L2 → L3 hierarchy used by CardsLayout, TreeLayout, etc.
 */

import { L1Category, ConfigState } from './types-layouts';

export const productLayoutData: L1Category[] = [
  {
    id: 'body',
    label: 'Body',
    components: [
      {
        id: 'material_type',
        label: 'Material',
        description: 'Select the primary leather type for the bag body.',
        defaultValue: 'smooth',
        options: [
          { id: 'mt_smooth', value: 'smooth', label: 'Smooth Leather' },
          { id: 'mt_pebbled', value: 'pebbled', label: 'Pebbled Leather' },
          { id: 'mt_calfskin', value: 'calfskin', label: 'Calfskin', priceMod: 50 },
        ],
        properties: [
          {
            id: 'material_color',
            label: 'Color',
            type: 'color',
            options: [
              { id: 'mc_latte', value: 'latte', label: 'Natural Latte', colorHex: '#D2B48C' },
              { id: 'mc_black', value: 'black', label: 'Classic Black', colorHex: '#1a1a1a' },
              { id: 'mc_tan', value: 'tan', label: 'Warm Tan', colorHex: '#C19A6B' },
              { id: 'mc_burgundy', value: 'burgundy', label: 'Deep Burgundy', colorHex: '#722F37', priceMod: 15 },
            ]
          },
          {
            id: 'material_finish',
            label: 'Finish',
            type: 'select',
            options: [
              { id: 'mf_natural', value: 'natural', label: 'Natural' },
              { id: 'mf_waxed', value: 'waxed', label: 'Waxed', priceMod: 20 },
              { id: 'mf_matte', value: 'matte', label: 'Matte' },
            ]
          }
        ]
      },
      {
        id: 'print_config',
        label: 'Decoration',
        description: 'Add custom prints or monograms to personalize your bag.',
        defaultValue: 'none',
        options: [
          { id: 'pc_none', value: 'none', label: 'None' },
          { id: 'pc_mono', value: 'monogram', label: 'Monogram', priceMod: 20 },
          { id: 'pc_pattern', value: 'pattern', label: 'Custom Pattern', priceMod: 35 },
        ],
        properties: []
      }
    ]
  },
  {
    id: 'handle',
    label: 'Handle',
    components: [
      {
        id: 'handle_config',
        label: 'Handle Style',
        description: 'Choose the handle configuration that suits your lifestyle.',
        defaultValue: 'single',
        options: [
          { id: 'hc_single', value: 'single', label: 'Single Strap' },
          { id: 'hc_double', value: 'double', label: 'Double Handle' },
          { id: 'hc_rope', value: 'rope', label: 'Rope Style', priceMod: 15 },
        ],
        properties: [
          {
            id: 'handle_material',
            label: 'Handle Material',
            type: 'select',
            options: [
              { id: 'hm_match', value: 'match', label: 'Match Body' },
              { id: 'hm_contrast', value: 'contrast', label: 'Contrast Leather', priceMod: 10 },
              { id: 'hm_chain', value: 'chain', label: 'Chain', priceMod: 45 },
            ]
          },
          {
            id: 'handle_size',
            label: 'Handle Length',
            type: 'select',
            options: [
              { id: 'hs_std', value: 'standard', label: 'Standard' },
              { id: 'hs_ext', value: 'extended', label: 'Extended', priceMod: 25 },
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'hardware',
    label: 'Hardware',
    components: [
      {
        id: 'hardware_finish',
        label: 'Hardware Finish',
        description: 'Select the metal finish for all hardware components.',
        defaultValue: 'brass_antique',
        options: [
          { id: 'hw_brass', value: 'brass_antique', label: 'Antique Brass' },
          { id: 'hw_gold', value: 'gold_polish', label: 'Polished Gold', priceMod: 20 },
          { id: 'hw_silver', value: 'silver_polish', label: 'Polished Silver' },
          { id: 'hw_matte', value: 'matte_black', label: 'Matte Black', priceMod: 15 },
        ],
        properties: [
          {
            id: 'clasp_type',
            label: 'Closure',
            type: 'select',
            options: [
              { id: 'ct_mag', value: 'magnetic', label: 'Magnetic Snap' },
              { id: 'ct_turn', value: 'turnlock', label: 'Turnlock' },
              { id: 'ct_zip', value: 'zipper', label: 'Zipper', priceMod: 10 },
            ]
          }
        ]
      },
      {
        id: 'charm_type',
        label: 'Charm',
        description: 'Add a decorative charm or tag.',
        defaultValue: 'none',
        options: [
          { id: 'ch_none', value: 'none', label: 'No Charm' },
          { id: 'ch_tag', value: 'leather_tag', label: 'Leather Tag', priceMod: 15 },
          { id: 'ch_tassel', value: 'tassel', label: 'Tassel', priceMod: 20 },
          { id: 'ch_metal', value: 'metal_charm', label: 'Metal Charm', priceMod: 25 },
        ],
        properties: []
      }
    ]
  }
];

// Default selections for a new configuration
export const defaultLayoutConfig: ConfigState = {
  // Product
  product_def: 'aurora',
  
  // Body
  material_type: 'smooth',
  material_color: 'latte',
  material_finish: 'natural',
  print_config: 'none',
  
  // Handle
  handle_config: 'single',
  handle_material: 'match',
  handle_size: 'standard',
  
  // Hardware
  hardware_finish: 'brass_antique',
  clasp_type: 'magnetic',
  charm_type: 'none',
};

// Calculate total price from selections
export function calculateLayoutPrice(data: L1Category[], selections: ConfigState, basePrice: number = 295): number {
  let total = basePrice;
  
  data.forEach(l1 => {
    l1.components.forEach(l2 => {
      // Check L2 option price mod
      const l2Selected = l2.options.find(o => o.value === selections[l2.id]);
      if (l2Selected?.priceMod) total += l2Selected.priceMod;
      
      // Check L3 property price mods
      l2.properties.forEach(l3 => {
        const l3Selected = l3.options.find(o => o.value === selections[l3.id]);
        if (l3Selected?.priceMod) total += l3Selected.priceMod;
      });
    });
  });
  
  return total;
}

// Check if a selection has been modified from default
export function isModifiedFromDefault(id: string, selections: ConfigState): boolean {
  return selections[id] !== defaultLayoutConfig[id];
}


