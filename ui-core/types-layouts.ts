/**
 * Types for the alternative layout components (CardsLayout, TreeLayout, etc.)
 * These use a flattened L1 → L2 → L3 hierarchy model
 */

export interface Option {
  id: string;
  value: string;
  label: string;
  colorHex?: string;
  priceMod?: number;
}

export interface L3Property {
  id: string;
  label: string;
  options: Option[];
  type?: 'color' | 'text' | 'select';
}

export interface L2Component {
  id: string;
  label: string;
  description?: string;
  options: Option[];
  defaultValue: string;
  properties: L3Property[];
}

export interface L1Category {
  id: string;
  label: string;
  components: L2Component[];
}

// Flat key-value config state for these layouts
export type ConfigState = Record<string, string>;


