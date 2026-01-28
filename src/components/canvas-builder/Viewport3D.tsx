import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { useCanvasStore } from '../../stores/canvasStore';

interface Viewport3DProps {
  onMeshClick?: (meshIndex: number, meshName: string) => void;
  onMeshHover?: (meshIndex: number | null) => void;
}

interface SceneProps extends Viewport3DProps {
  onResetReady?: (resetFn: () => void) => void;
  onIsolateResetReady?: (resetFn: () => void) => void;
}

// Component to handle mesh selection and highlighting
const ModelWithInteraction: React.FC<{
  scene: THREE.Group;
  onMeshClick?: (meshIndex: number, meshName: string) => void;
  onMeshHover?: (meshIndex: number | null) => void;
  onIsolateReset?: (resetFn: () => void) => void;
}> = ({ scene, onMeshClick, onMeshHover, onIsolateReset }) => {
  const { selectedPartId, hoveredPartId, parts } = useCanvasStore();
  const [hoveredMesh, setHoveredMesh] = useState<THREE.Mesh | null>(null);
  const sceneRef = useRef<THREE.Group>(null);
  const isolatedPartRef = useRef<number | null>(null);

  // Store mesh index mapping
  const meshIndexMap = useRef<Map<THREE.Mesh, number>>(new Map());
  const meshNameMap = useRef<Map<THREE.Mesh, string>>(new Map());

  useEffect(() => {
    if (!scene) return;

    let index = 0;
    scene.traverse((child) => {
      if ((child as any).isMesh) {
        const mesh = child as THREE.Mesh;
        meshIndexMap.current.set(mesh, index);
        meshNameMap.current.set(mesh, mesh.name || `Mesh_${index}`);
        index++;
      }
    });
    
  }, [scene]);

  // Store original colors and textures, then make everything gray
  useEffect(() => {
    if (!scene) {
      return;
    }
    
    const UNNAMED_PART_COLOR = 0x888888;
    let processedCount = 0;
    let grayCount = 0;
    
    scene.traverse((child) => {
      if ((child as any).isMesh) {
        const mesh = child as THREE.Mesh;
        const meshIndex = meshIndexMap.current.get(mesh);
        if (!(mesh.material as any).originalColorStored) {
          // Handle array of materials
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat) => {
              if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
                processedCount++;
                // Store original color and texture
                const originalColor = mat.color.clone();
                const originalMap = mat.map;
                (mat as any).originalColor = originalColor;
                (mat as any).originalMap = originalMap;
                (mat as any).originalColorStored = true;
                // Make gray initially
                mat.color.setHex(UNNAMED_PART_COLOR);
                mat.map = null;
                mat.needsUpdate = true;
                grayCount++;
              }
            });
          } else if (mesh.material instanceof THREE.MeshStandardMaterial || mesh.material instanceof THREE.MeshPhysicalMaterial) {
            processedCount++;
            // Store original color and texture
            const originalColor = mesh.material.color.clone();
            const originalMap = mesh.material.map;
            (mesh.material as any).originalColor = originalColor;
            (mesh.material as any).originalMap = originalMap;
            (mesh.material as any).originalColorStored = true;
            // Make gray initially
            mesh.material.color.setHex(UNNAMED_PART_COLOR);
            mesh.material.map = null;
            mesh.material.needsUpdate = true;
            grayCount++;
          }
        }
      }
    });
  }, [scene]);

  useFrame(() => {
    if (!sceneRef.current) return;

    // Unnamed parts are gray, named parts get their original color/texture
    const UNNAMED_PART_COLOR = 0x888888;

    // Update mesh materials based on selection/hover and named status
    sceneRef.current.traverse((child) => {
      if ((child as any).isMesh) {
        const mesh = child as THREE.Mesh;
        const meshIndex = meshIndexMap.current.get(mesh);
        if (meshIndex === undefined) return;

        const part = parts.find((p) => p.meshIndex === meshIndex);
        const isSelected = part ? part.id === selectedPartId : false;
        const isHovered = part ? part.id === hoveredPartId : false;
        const isNamed = part && part.name && part.name.trim() !== '';

        // Handle both single material and array of materials
        const isMaterialArray = Array.isArray(mesh.material);
        const materials: THREE.Material[] = isMaterialArray ? (mesh.material as THREE.Material[]) : [mesh.material as THREE.Material];
        
        materials.forEach((mat: THREE.Material, matIndex: number) => {
          // Ensure material supports color property (MeshStandardMaterial or MeshPhysicalMaterial)
          let material: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;
          
          if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
            material = mat;
          } else {
            // Convert to MeshStandardMaterial if needed
            const oldMat = mat as any;
            const newMat = new THREE.MeshStandardMaterial({
              map: oldMat.map,
              color: oldMat.color || 0xffffff,
            });
            // Replace in array if needed
            if (isMaterialArray) {
              (mesh.material as THREE.Material[])[matIndex] = newMat;
            } else {
              mesh.material = newMat;
            }
            material = newMat;
          }
          
          // Ensure originalColor is stored for this material (should already be done in useEffect)
          if (!(material as any).originalColorStored) {
            // Store original color and texture if not already stored
            (material as any).originalColor = material.color.clone();
            (material as any).originalMap = material.map;
            (material as any).originalColorStored = true;
          }


          if (isSelected || isHovered) {
            // Highlight selected/hovered parts
            const highlightColor = isSelected ? 0x00ff00 : 0xffff00;
            if (!(material as any).isHighlighted) {
              (material as any).isHighlighted = true;
            }
            material.emissive.setHex(highlightColor);
            material.emissiveIntensity = 0.3;
          } else {
            // Remove highlight
            if ((material as any).isHighlighted) {
              material.emissive.setHex(0x000000);
              material.emissiveIntensity = 0;
              (material as any).isHighlighted = false;
            }

            // Apply color/texture based on whether part is named
            const originalColor = (material as any).originalColor;
            const originalMap = (material as any).originalMap;
            const currentColor = material.color.getHex();
            
            if (isNamed) {
              // Named parts: restore original color and texture
              if (originalColor) {
                const originalColorHex = originalColor.getHex();
                if (currentColor !== originalColorHex) {
                  material.color.copy(originalColor);
                  material.map = originalMap;
                  material.needsUpdate = true;
                } else if (originalMap && material.map !== originalMap) {
                  // Restore texture if color is already correct
                  material.map = originalMap;
                  material.needsUpdate = true;
                }
              }
            } else {
              // Unnamed parts: gray color, no texture
              if (currentColor !== UNNAMED_PART_COLOR) {
                material.color.setHex(UNNAMED_PART_COLOR);
                material.needsUpdate = true;
              }
              if (material.map !== null) {
                material.map = null;
                material.needsUpdate = true;
              }
            }
          }
        });
      }
    });
  });

  const handleClick = (event: any) => {
    event.stopPropagation();
    if (!sceneRef.current) return;

    const mesh = event.object as THREE.Mesh;
    if (!mesh) return;

    const meshIndex = meshIndexMap.current.get(mesh);
    const meshName = meshNameMap.current.get(mesh);

    if (meshIndex !== undefined && meshName) {
      // Check for double-click
      const now = Date.now();
      const lastClickTime = (handleClick as any).lastClickTime || 0;
      const lastClickMesh = (handleClick as any).lastClickMesh;

      if (now - lastClickTime < 300 && lastClickMesh === mesh) {
        // Double-click detected - isolate part
        const part = parts.find((p) => p.meshIndex === meshIndex);
        if (part && sceneRef.current) {
          isolatedPartRef.current = meshIndex;
          // Hide all other meshes
          sceneRef.current.traverse((child) => {
            if ((child as any).isMesh) {
              const childMesh = child as THREE.Mesh;
              const childMeshIndex = meshIndexMap.current.get(childMesh);
              if (childMeshIndex !== undefined && childMeshIndex !== meshIndex) {
                childMesh.visible = false;
              } else if (childMeshIndex === meshIndex) {
                childMesh.visible = true;
              }
            }
          });
        }
        (handleClick as any).lastClickTime = 0;
        (handleClick as any).lastClickMesh = null;
      } else {
        // Single click
        onMeshClick?.(meshIndex, meshName);
        (handleClick as any).lastClickTime = now;
        (handleClick as any).lastClickMesh = mesh;
      }
    }
  };

  const handlePointerMove = (event: any) => {
    if (!sceneRef.current) return;

    const mesh = event.object as THREE.Mesh;
    if (mesh) {
      const meshIndex = meshIndexMap.current.get(mesh);
      setHoveredMesh(mesh);
      onMeshHover?.(meshIndex ?? null);
    } else {
      setHoveredMesh(null);
      onMeshHover?.(null);
    }
  };

  const handlePointerOut = () => {
    setHoveredMesh(null);
    onMeshHover?.(null);
  };

  // Expose reset isolation function
  React.useEffect(() => {
    if (onIsolateReset) {
      onIsolateReset(() => {
        if (sceneRef.current) {
          isolatedPartRef.current = null;
          sceneRef.current.traverse((child) => {
            if ((child as any).isMesh) {
              (child as THREE.Mesh).visible = true;
            }
          });
        }
      });
    }
  }, [onIsolateReset]);

  return (
    <primitive
      ref={sceneRef}
      object={scene}
      onClick={handleClick}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
    />
  );
};

// Main 3D Scene component
const Scene: React.FC<SceneProps> = ({ onMeshClick, onMeshHover, onResetReady, onIsolateResetReady }) => {
  const { assets } = useCanvasStore();
  const { camera, size } = useThree();
  const controlsRef = useRef<any>(null);
  const [scene, setScene] = useState<THREE.Group | null>(null);
  const isolateResetFnRef = useRef<(() => void) | null>(null);

  // Get the first 3D model
  const modelAsset = assets.models[0];
  const modelUrl = modelAsset?.url;

  // Load model
  useEffect(() => {
    if (!modelUrl) {
      setScene(null);
      return;
    }

    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        const clonedScene = gltf.scene.clone();
        
        setScene(clonedScene);
      },
      undefined,
      (error) => {
        console.error('Error loading model:', error);
        setScene(null);
      }
    );
  }, [modelUrl]);

  // Reset camera on model load and window resize
  const fitCameraToModel = React.useCallback(() => {
    if (!scene || !camera) return;

    // Calculate bounding box of the entire scene
    const box = new THREE.Box3();
    box.setFromObject(scene);
    
    // Get center and size from bounding box
    const center = new THREE.Vector3();
    box.getCenter(center);
    
    const sizeVec = new THREE.Vector3();
    box.getSize(sizeVec);
    
    // Calculate the maximum dimension of the bounding box
    const maxDim = Math.max(sizeVec.x, sizeVec.y, sizeVec.z);
    
    // If bounding box is invalid or empty, use default values
    if (maxDim === 0 || !isFinite(maxDim)) {
      // Use default camera position for invalid models
      camera.position.set(0, 0, 5);
      camera.lookAt(0, 0, 0);
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
      return;
    }
    
    // Calculate distance based on FOV and model size
    // Use aspect ratio to ensure model fits both width and height
    const perspectiveCamera = camera as THREE.PerspectiveCamera;
    const fov = perspectiveCamera.fov * (Math.PI / 180);
    const aspect = size.width / size.height;
    
    // Calculate distance needed to fit model in view
    // Use the larger of width or height requirements
    const distanceHeight = Math.abs(maxDim / (2 * Math.tan(fov / 2)));
    const distanceWidth = Math.abs(maxDim / (2 * Math.tan(fov / 2) * aspect));
    const distance = Math.max(distanceHeight, distanceWidth) * 1.5; // 1.5x padding

    // Ensure minimum distance
    const minDistance = maxDim * 0.5;
    const finalDistance = Math.max(distance, minDistance);

    // Position camera to look at bounding box center from a distance
    // Place camera along Z-axis relative to center
    camera.position.set(center.x, center.y, center.z + finalDistance);
    camera.lookAt(center);

    // Update controls target to bounding box center
    if (controlsRef.current) {
      controlsRef.current.target.copy(center);
      controlsRef.current.update();
    }
  }, [scene, camera, size]);

  useEffect(() => {
    fitCameraToModel();
  }, [fitCameraToModel]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      fitCameraToModel();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fitCameraToModel]);

  // Expose reset function to parent
  useEffect(() => {
    if (onResetReady) {
      onResetReady(() => {
        fitCameraToModel();
      });
    }
  }, [onResetReady, fitCameraToModel]);

  if (!modelUrl) {
    return null;
  }

  if (!scene) {
    return (
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#E6E0D6" />
      </mesh>
    );
  }

  return (
    <>
      <PerspectiveCamera 
        makeDefault 
        position={[0, 0, 5]} 
        fov={50}
        near={0.1}
        far={1000}
      />
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <directionalLight position={[-10, -10, -5]} intensity={0.4} />
      <pointLight position={[0, 0, 10]} intensity={0.3} />

      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={0.5}
        maxDistance={50}
        enableDamping={true}
        dampingFactor={0.05}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        }}
      />

      <ModelWithInteraction
        scene={scene}
        onMeshClick={onMeshClick}
        onMeshHover={onMeshHover}
        onIsolateReset={() => {
          if (isolateResetFnRef.current) {
            isolateResetFnRef.current();
          }
        }}
      />
    </>
  );
};


// Main Viewport3D component
const Viewport3D: React.FC<Viewport3DProps> = (props) => {
  const { assets } = useCanvasStore();
  const resetRef = useRef<(() => void) | null>(null);
  const isolateResetRef = useRef<(() => void) | null>(null);

  if (!assets.models.length) {
    return (
      <div className="w-full h-full relative border border-charcoal rounded-[18px] bg-cream/70 overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <p className="font-serif text-2xl mb-2">Click any part to start configuring</p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60">
            No 3D model loaded
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative border border-charcoal rounded-[18px] bg-cream/70 overflow-hidden">
      <Canvas
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%', display: 'block' }}
        onCreated={({ gl }) => {
          gl.setClearColor('#E6E0D6', 1);
        }}
      >
        <Scene
          {...props}
          onResetReady={(resetFn: () => void) => {
            resetRef.current = resetFn;
          }}
          onIsolateResetReady={(resetFn: () => void) => {
            isolateResetRef.current = resetFn;
          }}
        />
      </Canvas>
    </div>
  );
};

export default Viewport3D;
