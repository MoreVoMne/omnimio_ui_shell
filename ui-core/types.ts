
export type PartId = 'handle' | 'body' | 'zipper' | 'clasp' | 'proc_body' | 'proc_handle' | 'proc_hardware' | 'proc_charm';

export interface ConfigurationState {
  // Identity
  username: string;

  // Handle
  handleSize: 'standard' | 'extended';
  handleConfig: 'single' | 'double';
  handleMaterial: 'same' | 'contrast' | 'chain';
  handlePrint: 'none' | 'camo';
  handleText: 'none' | 'initials';
  
  // Surface (Body)
  surfaceTreatment: 'natural' | 'waxed';
  surfacePrint: 'none' | 'pattern' | 'monogram';
  surfaceTexture: 'pebbled' | 'smooth';
  surfaceHardware: 'gold' | 'silver';
  surfaceText: 'none' | 'patch';
}

export interface SelectionState {
  body: string;
  handle_material: string;
  handle_style: string;
  hardware: string;
  charm_type: string;
}

export interface PriceBreakdownStructure {
  base: number;
  handle: {
    size: number;
    chain: number;
    contrast: number;
  };
  surface: {
    print: number;
  };
}

export interface ConflictResolution {
  message: string;
  optionA: {
    label: string;
    action: () => void;
  };
  optionB: {
    label: string;
    action: () => void;
  };
}

export interface Preset {
  name: string;
  config: Partial<ConfigurationState>;
}

export type AdminViewMode = '3d' | '2d' | 'split';

export interface UVPoint {
  u: number;
  v: number;
  x?: number; // Fabric coordinates
  y?: number;
}

export interface UVTriangle {
  p1: UVPoint;
  p2: UVPoint;
  p3: UVPoint;
}

export interface UVIsland {
  id: number;
  materialName: string | null; // Name of the material this island belongs to
  materialIndex: number;      // Fallback index in the material list
  triangles: UVTriangle[];
  bounds: {
    minU: number;
    maxU: number;
    minV: number;
    maxV: number;
  };
}

export interface UVMapData {
  islands: UVIsland[];
}

export type HotspotPartId = 'handle' | 'body' | 'clasp';

export interface HotspotPlacement3D {
  worldPosition: [number, number, number];
  worldNormal: [number, number, number];
  uvCoords: [number, number];
  meshName: string;
}

export type HotspotMap3D = Partial<Record<HotspotPartId, HotspotPlacement3D>>;

export interface DecalPlacement {
  id: string;
  imageUrl: string;
  layer: string;
  targetStableId: string | null;
  u: number;
  v: number;
  scale: number;
  rotation: number;
  worldPosition: [number, number, number];
  worldNormal: [number, number, number];
}