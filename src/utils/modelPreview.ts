import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Generates a thumbnail preview of a 3D model
 * @param modelUrl - URL of the 3D model (GLB/GLTF)
 * @param size - Size of the preview image (default: 128)
 * @returns Promise resolving to data URL of the preview image
 */
export async function generateModelPreview(
  modelUrl: string,
  size: number = 128
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
    renderer.setPixelRatio(window.devicePixelRatio);

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
    const gltf = await new Promise<THREE.Group>((resolve, reject) => {
      loader.load(
        modelUrl,
        (gltf) => resolve(gltf.scene),
        undefined,
        (error) => reject(error)
      );
    });

    scene.add(gltf);

    // Calculate bounding box and fit camera
    const box = new THREE.Box3().setFromObject(gltf);
    const center = box.getCenter(new THREE.Vector3());
    const size_box = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size_box.x, size_box.y, size_box.z);
    const distance = maxDim * 2;

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
    console.error('Error generating model preview:', error);
    return null;
  }
}



