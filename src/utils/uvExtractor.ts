import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface UVMapData {
  imageData: ImageData;
  width: number;
  height: number;
  meshIndex: number;
  meshName: string;
}

/**
 * Extract UV map from a specific mesh in a GLTF/GLB model
 */
export async function extractUVMap(
  modelUrl: string,
  meshIndex: number
): Promise<UVMapData | null> {
  try {
    const loader = new GLTFLoader();
    const gltf = await new Promise<any>((resolve, reject) => {
      loader.load(modelUrl, resolve, undefined, reject);
    });

    let currentMeshIndex = 0;
    let targetMesh: THREE.Mesh | null = null;

    gltf.scene.traverse((child: any) => {
      if (child.isMesh) {
        if (currentMeshIndex === meshIndex) {
          targetMesh = child as THREE.Mesh;
        }
        currentMeshIndex++;
      }
    });

    if (!targetMesh || !targetMesh.geometry) {
      return null;
    }

    const geometry = targetMesh.geometry;
    const uvAttribute = geometry.attributes.uv;

    if (!uvAttribute) {
      return null;
    }

    // Create a canvas to render the UV map
    const canvasSize = 512;
    const canvas = document.createElement('canvas');
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return null;
    }

    // Fill background
    ctx.fillStyle = '#E6E0D6';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Draw grid
    ctx.strokeStyle = '#00000020';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvasSize; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvasSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvasSize, i);
      ctx.stroke();
    }

    // Draw UV islands
    const index = geometry.index;
    const position = geometry.attributes.position;
    const uv = uvAttribute;

    if (index && position && uv) {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.fillStyle = '#FFFFFF40';

      const indexArray = index.array;
      const uvArray = uv.array;

      // Draw triangles
      for (let i = 0; i < indexArray.length; i += 3) {
        const i0 = indexArray[i] * 2;
        const i1 = indexArray[i + 1] * 2;
        const i2 = indexArray[i + 2] * 2;

        const u0 = uvArray[i0] * canvasSize;
        const v0 = (1 - uvArray[i0 + 1]) * canvasSize; // Flip V coordinate
        const u1 = uvArray[i1] * canvasSize;
        const v1 = (1 - uvArray[i1 + 1]) * canvasSize;
        const u2 = uvArray[i2] * canvasSize;
        const v2 = (1 - uvArray[i2 + 1]) * canvasSize;

        ctx.beginPath();
        ctx.moveTo(u0, v0);
        ctx.lineTo(u1, v1);
        ctx.lineTo(u2, v2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    const imageData = ctx.getImageData(0, 0, canvasSize, canvasSize);

    return {
      imageData,
      width: canvasSize,
      height: canvasSize,
      meshIndex,
      meshName: targetMesh.name || `Mesh_${meshIndex}`,
    };
  } catch (error) {
    console.error('Error extracting UV map:', error);
    return null;
  }
}

/**
 * Get UV map for a part (by mesh index)
 */
export async function getPartUVMap(
  modelUrl: string,
  partMeshIndex: number
): Promise<ImageData | null> {
  const uvData = await extractUVMap(modelUrl, partMeshIndex);
  return uvData?.imageData || null;
}



