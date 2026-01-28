/**
 * Type definitions for Capability Selection Screen
 * Used for the initial capability selection before detailed configuration
 */

// ============================================================================
// Capability Selection Types
// ============================================================================

export type CapabilityType =
  | 'size'
  | 'shape'
  | 'material'
  | 'color'
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

export interface CapabilityConfig {
  enabled: boolean;
}

export type CapabilityConfigMap = Record<CapabilityType, CapabilityConfig>;

// ============================================================================
// Model Analysis (for recommendations)
// ============================================================================

export interface ModelAnalysisResult {
  partsCount: number;
  materialsCount: number;
  uvMapDetected: boolean;
  warnings: string[];
  recommendations: string[];
}

