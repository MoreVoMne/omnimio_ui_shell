import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { ModelAsset } from '../types/assets';

export interface ModelValidationResult {
  loads: boolean;
  meshCount: number;
  hasUV: boolean;
  uvMeshCount: number;
  errors: string[];
  warnings: string[];
  fileSize: number;
}

export async function validateGLTF(file: File): Promise<ModelValidationResult> {
  const result: ModelValidationResult = {
    loads: false,
    meshCount: 0,
    hasUV: false,
    uvMeshCount: 0,
    errors: [],
    warnings: [],
    fileSize: file.size,
  };

  try {
    const loader = new GLTFLoader();
    const arrayBuffer = await file.arrayBuffer();
    const gltf = await loader.parseAsync(arrayBuffer, '');

    result.loads = true;
    result.meshCount = gltf.scene.children.length;

    // Check for UV mapping
    let meshesWithUV = 0;
    gltf.scene.traverse((child) => {
      if ((child as any).isMesh) {
        const mesh = child as any;
        if (mesh.geometry) {
          const geometry = mesh.geometry;
          if (geometry.attributes.uv || geometry.attributes.uv2) {
            meshesWithUV++;
          }
        }
      }
    });

    result.hasUV = meshesWithUV > 0;
    result.uvMeshCount = meshesWithUV;

    if (meshesWithUV < result.meshCount) {
      result.warnings.push(
        `UV mapping: ${meshesWithUV}/${result.meshCount} meshes have UV. Print/text will only work on UV-mapped parts.`
      );
    }

    // Check file size
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      result.errors.push(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB, max 50MB)`);
    }

    // Performance check
    if (result.meshCount > 100) {
      result.warnings.push('High mesh count may affect performance');
    }
  } catch (error) {
    result.loads = false;
    result.errors.push(`Failed to load file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

export function getPerformanceRating(meshCount: number, fileSize: number): 'Good' | 'Fair' | 'Poor' {
  if (meshCount < 50 && fileSize < 10 * 1024 * 1024) {
    return 'Good';
  }
  if (meshCount < 100 && fileSize < 30 * 1024 * 1024) {
    return 'Fair';
  }
  return 'Poor';
}

