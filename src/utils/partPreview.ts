import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Generates a thumbnail preview of a single mesh from a 3D model
 * @param modelUrl - URL of the 3D model (GLB/GLTF)
 * @param meshIndex - Index of the mesh to render
 * @param size - Size of the preview image (default: 64)
 * @returns Promise resolving to data URL of the preview image
 */
export async function generatePartPreview(
  modelUrl: string,
  meshIndex: number,
  size: number = 64
): Promise<string | null> {
  try {
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#E6E0D6');

    // Create camera
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    camera.position.set(0, 0, 5);

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(1); // Use 1 for thumbnails to save memory

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(10, 10, 5);
    scene.add(directionalLight1);
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-10, -10, -5);
    scene.add(directionalLight2);
    const pointLight = new THREE.PointLight(0xffffff, 0.3);
    pointLight.position.set(0, 0, 10);
    scene.add(pointLight);

    // Load model
    const loader = new GLTFLoader();
    const gltf = await new Promise<any>((resolve, reject) => {
      loader.load(
        modelUrl,
        (gltf) => resolve(gltf),
        undefined,
        (error) => reject(error)
      );
    });

    // Find the specific mesh
    let currentMeshIndex = 0;
    let targetMesh: THREE.Mesh | null = null;
    const allMeshes: THREE.Mesh[] = [];
    
    gltf.scene.traverse((child: any) => {
      if (child.isMesh) {
        allMeshes.push(child as THREE.Mesh);
        if (currentMeshIndex === meshIndex) {
          targetMesh = child as THREE.Mesh;
        }
        currentMeshIndex++;
      }
    });

    if (!targetMesh) {
      console.warn(`generatePartPreview: Mesh at index ${meshIndex} not found. Total meshes: ${allMeshes.length}`);
      return null;
    }

    // Clone the mesh and add to scene
    const clonedMesh = targetMesh.clone();
    
    // Ensure mesh has geometry and material
    if (!clonedMesh.geometry) {
      console.warn(`generatePartPreview: Mesh at index ${meshIndex} has no geometry`);
      return null;
    }
    
    // If no material, create a default one
    if (!clonedMesh.material) {
      clonedMesh.material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    }
    
    scene.add(clonedMesh);

    // Calculate bounding box and fit camera
    const box = new THREE.Box3().setFromObject(clonedMesh);
    if (box.isEmpty()) {
      console.warn(`generatePartPreview: Mesh at index ${meshIndex} has empty bounding box`);
      return null;
    }
    
    const center = box.getCenter(new THREE.Vector3());
    const size_box = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size_box.x, size_box.y, size_box.z);
    const distance = maxDim * 2.5;

    camera.position.set(
      center.x,
      center.y,
      center.z + distance
    );
    camera.lookAt(center);

    // Render
    renderer.render(scene, camera);

    // Convert to data URL
    const dataUrl = renderer.domElement.toDataURL('image/png');

    // Cleanup
    renderer.dispose();
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry?.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach((mat) => mat.dispose());
        } else {
          object.material?.dispose();
        }
      }
    });

    return dataUrl;
  } catch (error) {
    console.error('Error generating part preview:', error);
    return null;
  }
}

