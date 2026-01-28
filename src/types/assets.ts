export type AssetType = 'model' | 'texture' | 'image' | 'font';

export interface Asset {
  id: string;
  type: AssetType;
  name: string;
  file: File;
  url?: string; // Object URL for preview
  size: number; // bytes
  uploadedAt: number;
  used: boolean; // Is asset being used in configuration
}

export interface ModelAsset extends Asset {
  type: 'model';
  meshCount?: number;
  hasUV?: boolean;
  uvMeshCount?: number; // How many meshes have UV
  previewUrl?: string; // Thumbnail preview of the 3D model
  validation?: {
    loads: boolean;
    errors: string[];
    warnings: string[];
  };
}

export interface TextureAsset extends Asset {
  type: 'texture';
  width?: number;
  height?: number;
}

export interface ImageAsset extends Asset {
  type: 'image';
  width?: number;
  height?: number;
}

export interface FontAsset extends Asset {
  type: 'font';
  family?: string;
}

