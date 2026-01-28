
import React, { useEffect, useState, useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Float, OrbitControls, PerspectiveCamera, RoundedBox, useGLTF, Center, Bounds } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { SelectionState } from '../types';
import { MATERIALS } from '../constants';

// Fix for Intrinsic Elements in TypeScript (Global JSX)
// Explicitly defining R3F elements prevents "Property does not exist" errors
declare global {
  namespace JSX {
    interface IntrinsicElements {
      primitive: any;
      group: any;
      mesh: any;
      meshStandardMaterial: any;
      cylinderGeometry: any;
      torusGeometry: any;
      ambientLight: any;
      spotLight: any;
      [elemName: string]: any;
    }
  }
}

interface ProductStageProps {
  selections: SelectionState;
  customModelUrl?: string | null;
  selectedPartId?: string | null;
  onSelectPart?: (id: string | null) => void;
  onHotspotActivate?: (part: 'handle' | 'body' | 'clasp', coords: { x: number; y: number }) => void;
  hotspots3d?: any;
  hotspotPlacementMode?: any;
  onPlaceHotspot?: (part: string, placement: any) => void;
  decals?: any[];
  decalPlacementMode?: any;
  onPlaceDecal?: (placement: any) => void;
  onUpdateDecal?: (id: string, patch: any) => void;
  isDragging?: boolean;
  isTransitioning?: boolean;
}

// --- Bag Animation Shapes (SVG Paths) ---
const BAG_SHAPES = [
  // Tote
  "M35,35 C35,15 65,15 65,35 M25,35 L25,85 L75,85 L75,35 L25,35 Z",
  // Clutch
  "M15,45 L85,45 L85,75 L15,75 Z M15,45 L50,65 L85,45",
  // Handbag
  "M30,40 C30,20 70,20 70,40 M25,40 L75,40 L70,80 L30,80 Z"
];

const LOADING_LABELS = [
  "GEOMETRY_INIT",
  "SURFACE_PROJECTION",
  "SHADER_COMPILATION"
];

// --- Custom Uploaded Model Component ---
const UploadedModel = ({ url, selectedPartId, onSelectPart }: { url: string, selectedPartId?: string | null, onSelectPart?: (id: string | null) => void }) => {
  const { scene } = useGLTF(url);
  
  // Clone scene so we can modify materials (highlighting) without affecting other instances
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  // Keep a ref of the selected ID to avoid stale closures in the useFrame loop
  const selectedIdRef = useRef(selectedPartId);

  useEffect(() => {
    selectedIdRef.current = selectedPartId;
  }, [selectedPartId]);

  // Process scene to add interactive handlers and matching IDs
  useEffect(() => {
      let meshIndex = 0;
      clonedScene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
           const mesh = obj as THREE.Mesh;
           // Deterministic ID Generation: Use Name + Index to ensure global uniqueness.
           // This MUST match the logic in PatternView.tsx (Fabric) exactly.
           const stableId = `${mesh.name || 'mesh'}_${meshIndex}`;
           mesh.userData.stableId = stableId;
           meshIndex++;

           // Ensure material is unique per mesh for highlighting
           if (mesh.material) {
               mesh.material = (mesh.material as THREE.Material).clone();
           }
        }
      });
  }, [clonedScene]);

  // Apply Highlight Effect
  useFrame((state) => {
      const currentSelectedId = selectedIdRef.current;
      
      clonedScene.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
              const mesh = obj as THREE.Mesh;
              const isSelected = mesh.userData.stableId === currentSelectedId;
              const material = mesh.material as THREE.MeshStandardMaterial;
              
              if (isSelected) {
                  // Pulse Emissive
                  const t = state.clock.getElapsedTime();
                  const intensity = (Math.sin(t * 8) + 1) * 0.5 + 0.2; // Faster, brighter pulse
                  
                  // Apply robust highlighting
                  if ('emissive' in material) {
                      material.emissive = new THREE.Color('#C20000');
                      material.emissiveIntensity = intensity;
                  } else {
                     // Fallback for materials without emissive (e.g. Basic/Lambert)
                     if ('color' in material) {
                         // @ts-ignore
                         const originalColor = mesh.userData.originalColor || (mesh.userData.originalColor = material.color.clone());
                         // @ts-ignore
                         material.color.lerpColors(originalColor, new THREE.Color('#C20000'), intensity * 0.5);
                     }
                  }
              } else {
                  // Reset
                  if ('emissive' in material) {
                      material.emissive = new THREE.Color('#000000');
                      material.emissiveIntensity = 0;
                  }
                   // Reset color fallback
                   if (mesh.userData.originalColor && 'color' in material) {
                       // @ts-ignore
                       material.color.copy(mesh.userData.originalColor);
                   }
              }
          }
      });
  });

  return (
    <primitive 
        object={clonedScene} 
        onClick={(e: any) => {
            e.stopPropagation();
            // Find the clicked mesh
            let target = e.object;
            if (onSelectPart) {
                onSelectPart(target.userData.stableId || null);
            }
        }}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'auto'}
    />
  );
};

// --- Procedural Bag Component ---
const ProceduralBag = ({ 
  selections, 
  onSelectPart, 
  selectedPartId 
}: { 
  selections: SelectionState, 
  onSelectPart?: (id: string | null) => void, 
  selectedPartId?: string | null 
}) => {
  const bodyMat = MATERIALS[selections.body as keyof typeof MATERIALS] || MATERIALS.pebble_bisque;
  const handleStyle = selections.handle_style;
  const handleMatKey = selections.handle_material === 'match_body' ? selections.body : (selections.handle_material === 'contrast_tan' ? 'leather_sienna' : 'pebble_noir');
  const handleMatProps = selections.handle_material === 'scarf_wrap' 
    ? { color: '#C85A17', roughness: 0.8, metalness: 0, envMapIntensity: 0.5 } 
    : (MATERIALS[handleMatKey as keyof typeof MATERIALS] || MATERIALS.pebble_bisque);
  
  const hardwareMat = MATERIALS[selections.hardware as keyof typeof MATERIALS] || MATERIALS.brass_antique;
  
  // Smoothly interpolate color changes
  const bodyMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((state, delta) => {
    if (bodyMaterialRef.current) {
      bodyMaterialRef.current.color.lerp(new THREE.Color(bodyMat.color), delta * 5);
      bodyMaterialRef.current.roughness = THREE.MathUtils.lerp(bodyMaterialRef.current.roughness, bodyMat.roughness, delta * 5);
    }
  });

  // Helpers for interaction
  const handleSelect = (e: any, id: string) => {
    e.stopPropagation();
    if (onSelectPart) onSelectPart(id);
  };

  const getHighlightProps = (id: string) => {
    const isSelected = selectedPartId === id;
    return {
      emissive: isSelected ? new THREE.Color('#C20000') : new THREE.Color('#000000'),
      emissiveIntensity: isSelected ? 0.4 : 0
    };
  };

  return (
    <group position={[0, 0.5, 0]}>
      {/* Main Body */}
      <RoundedBox 
        args={[2.2, 1.8, 0.8]} 
        radius={0.1} 
        smoothness={4} 
        position={[0, 0, 0]}
        onClick={(e) => handleSelect(e, 'proc_body')}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'auto'}
      >
        <meshStandardMaterial 
          ref={bodyMaterialRef}
          color={bodyMat.color}
          roughness={bodyMat.roughness}
          metalness={bodyMat.metalness}
          envMapIntensity={bodyMat.envMapIntensity}
          {...getHighlightProps('proc_body')}
        />
      </RoundedBox>

      {/* Hardware / Clasps */}
      <group position={[0.8, 0.6, 0]} onClick={(e) => handleSelect(e, 'proc_hardware')}>
        {/* Cylinder connection */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.05, 0.3, 16]} />
          <meshStandardMaterial {...hardwareMat} {...getHighlightProps('proc_hardware')} />
        </mesh>
        {/* Ring */}
        <mesh position={[0, 0.15, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.15, 0.02, 16, 32]} />
          <meshStandardMaterial {...hardwareMat} {...getHighlightProps('proc_hardware')} />
        </mesh>
      </group>
      <group position={[-0.8, 0.6, 0]} onClick={(e) => handleSelect(e, 'proc_hardware')}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.05, 0.3, 16]} />
          <meshStandardMaterial {...hardwareMat} {...getHighlightProps('proc_hardware')} />
        </mesh>
        <mesh position={[0, 0.15, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.15, 0.02, 16, 32]} />
          <meshStandardMaterial {...hardwareMat} {...getHighlightProps('proc_hardware')} />
        </mesh>
      </group>

      {/* Handles */}
      {handleStyle === 'single_short' && (
        <group position={[0, 1.1, 0]} onClick={(e) => handleSelect(e, 'proc_handle')}>
           {/* Arched Handle */}
           <mesh scale={[1, 0.6, 1]}>
              <torusGeometry args={[0.8, 0.08, 16, 64]} />
              <meshStandardMaterial {...handleMatProps} {...getHighlightProps('proc_handle')} />
           </mesh>
        </group>
      )}

      {handleStyle === 'shoulder_strap' && (
         <group onClick={(e) => handleSelect(e, 'proc_handle')}>
            {/* Long Strap Arch */}
            <mesh position={[0, 1.5, 0]} scale={[1, 1.2, 1]}>
                <torusGeometry args={[1.2, 0.06, 16, 64]} />
                <meshStandardMaterial {...handleMatProps} {...getHighlightProps('proc_handle')} />
            </mesh>
         </group>
      )}

      {handleStyle === 'crossbody' && (
        <group onClick={(e) => handleSelect(e, 'proc_handle')}>
           {/* Chain Style */}
           <mesh position={[0, 1.8, 0]} scale={[1, 1.4, 1]}>
               <torusGeometry args={[1.4, 0.02, 8, 64]} />
               <meshStandardMaterial {...hardwareMat} roughness={0.2} metalness={1} {...getHighlightProps('proc_handle')} />
           </mesh>
        </group>
      )}

      {/* Charm */}
      {selections.charm_type !== 'none' && (
          <group position={[0.8, 0.8, 0.2]} rotation={[0, 0, -0.1]} onClick={(e) => handleSelect(e, 'proc_charm')}>
              {/* String */}
              <mesh position={[0, -0.3, 0]}>
                 <cylinderGeometry args={[0.01, 0.01, 0.6, 8]} />
                 <meshStandardMaterial color="#333" />
              </mesh>
              {/* Tag */}
              <RoundedBox args={[0.3, 0.4, 0.05]} radius={0.02} position={[0, -0.6, 0]}>
                   {selections.charm_type === 'leather_tag' ? (
                       <meshStandardMaterial color={MATERIALS.leather_sienna.color} roughness={0.5} {...getHighlightProps('proc_charm')} />
                   ) : (
                       <meshStandardMaterial {...hardwareMat} {...getHighlightProps('proc_charm')} />
                   )}
              </RoundedBox>
          </group>
      )}

    </group>
  );
};

// --- Main Stage ---
export const ProductStage: React.FC<ProductStageProps> = ({
  selections,
  customModelUrl,
  selectedPartId,
  onSelectPart,
  onHotspotActivate,
  hotspots3d,
  hotspotPlacementMode,
  onPlaceHotspot,
  decals,
  decalPlacementMode,
  onPlaceDecal,
  onUpdateDecal,
  isDragging = false,
  isTransitioning = false
}) => {
  const [isDrafting, setIsDrafting] = useState(true);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const controlsRef = useRef<any>(null);

  // Reset interactions when model changes
  useEffect(() => {
    // Reset sequence
    setIsDrafting(true);
    setLoadingPhase(0);
    
    // 3-second animation cycle
    const startTime = Date.now();
    const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        // Switch shape every 1 second
        const phase = Math.floor(elapsed / 1000);
        if (phase < BAG_SHAPES.length) {
           setLoadingPhase(phase);
        }
    }, 1000);

    // Finish after 3 seconds
    const timer = setTimeout(() => {
        setIsDrafting(false);
        clearInterval(interval);
    }, 3000);

    return () => {
        clearTimeout(timer);
        clearInterval(interval);
    };
  }, [selections.body, selections.handle_style, customModelUrl]);

  // Reset camera when switching back to procedural mode
  useEffect(() => {
    if (!customModelUrl && controlsRef.current) {
        controlsRef.current.reset();
    }
  }, [customModelUrl]);

  return (
    <div 
        className="relative w-full h-full bg-paper overflow-hidden" 
        onClick={() => onSelectPart && onSelectPart(null)} // Deselect on background click
    >
        
        {/* Swiss Technical Loading Animation (Refined) */}
        <AnimatePresence>
        {isDrafting && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             transition={{ duration: 0.5 }}
             className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center bg-cream/20 backdrop-blur-sm"
           >
               <div className="flex flex-col items-center gap-8">
                   <div className="relative w-32 h-32 flex items-center justify-center">
                       {/* Rotating Outer Ring */}
                       <div className="absolute inset-0 border border-charcoal rounded-full border-t-accent/40 animate-[spin_8s_linear_infinite]" />
                       
                       {/* Morphing Bag Shape */}
                       <svg width="100" height="100" viewBox="0 0 100 100" className="overflow-visible">
                          <AnimatePresence mode="wait">
                            <motion.path
                               key={loadingPhase}
                               d={BAG_SHAPES[loadingPhase]}
                               fill="transparent"
                               stroke="#C20000" // Accent color
                               strokeWidth="1.5"
                               strokeLinecap="round"
                               strokeLinejoin="round"
                               initial={{ pathLength: 0, opacity: 0 }}
                               animate={{ pathLength: 1, opacity: 1 }}
                               exit={{ opacity: 0, transition: { duration: 0.2 } }}
                               transition={{ duration: 0.8, ease: "easeInOut" }}
                            />
                          </AnimatePresence>
                       </svg>
                   </div>

                   {/* Text Label Sequence */}
                   <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-charcoal h-4 overflow-hidden relative">
                      <AnimatePresence mode="wait">
                        <motion.span
                            key={loadingPhase}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -10, opacity: 0 }}
                            className="block font-bold"
                        >
                            {LOADING_LABELS[loadingPhase] || "CALIBRATING"}
                        </motion.span>
                      </AnimatePresence>
                   </div>
               </div>
           </motion.div>
        )}
        </AnimatePresence>

        {/* 3D Scene */}
        <Canvas 
          shadows 
          dpr={(isDragging || isTransitioning) ? 1 : [1, 2]} // Lower resolution during drag/transition
          resize={{ debounce: isTransitioning ? 200 : 0 }} // Heavy debounce during layout transition
          className={`${isDrafting ? 'opacity-0' : 'opacity-100'} transition-opacity duration-700 delay-200`}
        >
            <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={45} />
            
            {/* Lighting Setup: "North Studio Light" */}
            <ambientLight intensity={0.7} color="#FFF5E0" />
            <spotLight 
              position={[5, 8, 5]} 
              angle={0.4} 
              penumbra={0.5} 
              intensity={1.5} 
              castShadow 
              shadow-bias={-0.0001}
            />
            <Environment preset="city" />

            <Float speed={customModelUrl ? 0 : 2} rotationIntensity={customModelUrl ? 0 : 0.2} floatIntensity={customModelUrl ? 0 : 0.2}>
              <Suspense fallback={null}>
                 {customModelUrl ? (
                   <Bounds fit clip observe margin={1.05}>
                     <Center>
                        <UploadedModel 
                            url={customModelUrl} 
                            selectedPartId={selectedPartId}
                            onSelectPart={onSelectPart}
                        />
                     </Center>
                   </Bounds>
                 ) : (
                   <ProceduralBag 
                      selections={selections} 
                      onSelectPart={onSelectPart}
                      selectedPartId={selectedPartId}
                    />
                 )}
              </Suspense>
            </Float>

            {/* Floor Contact Shadow */}
            <ContactShadows 
              position={[0, -1, 0]} 
              opacity={0.6} 
              scale={10} 
              blur={2} 
              far={4} 
              color="#000000"
            />

            <OrbitControls 
              ref={controlsRef}
              makeDefault
              enablePan={false} 
              minPolarAngle={Math.PI / 4} 
              maxPolarAngle={Math.PI / 2}
              autoRotate={!isDrafting}
              autoRotateSpeed={0.5}
            />
        </Canvas>
    </div>
  );
};

const HotspotVisual = ({ label }: { label: string }) => {
  return (
    <motion.div
      className="group relative cursor-pointer"
      whileHover={{ scale: 1.1 }}
    >
      <span className="absolute inset-0 -m-2 rounded-full border border-charcoal scale-100 group-hover:scale-150 transition-transform duration-500" />
      <span className="block w-3 h-3 rounded-full bg-cream border border-charcoal group-hover:bg-accent group-hover:border-accent transition-colors duration-300" />
      {/* Updated font style to match Swiss Identity and pure black text */}
      <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 text-charcoal font-mono uppercase text-[9px] tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-cream/90 px-2 py-1 border border-charcoal shadow-sm font-bold">
        {label}
      </span>
    </motion.div>
  );
};
