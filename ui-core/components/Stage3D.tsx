
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { PartId, ConfigurationState, UVMapData, UVIsland, UVTriangle } from '../types';
import { OPTION_GROUPS } from '../constants';

// Fix custom element TypeScript definition for model-viewer
// Usage of 'model-viewer' is handled via @ts-ignore below.

// Default hotspot coordinates for the SheenChair (demo model)
const DEFAULT_HOTSPOTS = {
  handle: { position: "0m 0.7m -0.2m", normal: "0m 0m 1m" }, // Top of backrest
  body: { position: "0m 0.45m 0m", normal: "0m 1m 0m" }     // Seat center
};

interface Stage3DProps {
  configuration: ConfigurationState;
  activePart: PartId | null;
  onFocusPart: (part: PartId | null) => void;
  customModel?: string | null;
  onUpdateConfig: (key: keyof ConfigurationState, value: string) => void;
  isGhosting: boolean;
  onSetGhosting: (isGhosting: boolean) => void;
  onTextureExtracted: (url: string) => void;
  onUVExtracted: (data: UVMapData) => void;
  onAnalysisStatus?: (status: 'idle' | 'scanning' | 'success' | 'error' | 'empty') => void;
  highlightedMaterial?: { name: string | null; index: number } | null;
}

export const Stage3D: React.FC<Stage3DProps> = ({ 
    configuration, 
    activePart, 
    onFocusPart, 
    customModel,
    onUpdateConfig,
    isGhosting,
    onSetGhosting,
    onTextureExtracted,
    onUVExtracted,
    onAnalysisStatus,
    highlightedMaterial,
}) => {
  
  const viewerRef = useRef<HTMLElement>(null);
  // Keep latest callback reference to avoid useEffect re-runs
  const onTextureExtractedRef = useRef(onTextureExtracted);
  const onUVExtractedRef = useRef(onUVExtracted);
  const onAnalysisStatusRef = useRef(onAnalysisStatus);

  useEffect(() => {
    onTextureExtractedRef.current = onTextureExtracted;
    onUVExtractedRef.current = onUVExtracted;
    onAnalysisStatusRef.current = onAnalysisStatus;
  }, [onTextureExtracted, onUVExtracted, onAnalysisStatus]);

  const getModelSrc = () => {
    if (customModel) return customModel;
    return 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/SheenChair/glTF-Binary/SheenChair.glb';
  };

  // -------------------------------------------------------------------
  // SELECTION HIGHLIGHTER (Material Emissive)
  // -------------------------------------------------------------------
  useEffect(() => {
    const viewer = viewerRef.current as any;
    // Ensure model is fully loaded before attempting to manipulate materials
    if (!viewer || !viewer.model || !viewer.model.materials) return;

    const materials = viewer.model.materials;

    // 1. Clean slate: Reset all materials to no emission
    // We iterate by index to ensure we catch everything
    for (let i = 0; i < materials.length; i++) {
        const mat = materials[i];
        // Ensure we are accessing setEmissiveFactor on the PBR interface
        if (mat.pbrMetallicRoughness && typeof mat.pbrMetallicRoughness.setEmissiveFactor === 'function') {
             mat.pbrMetallicRoughness.setEmissiveFactor([0, 0, 0]);
        }
    }

    // 2. Apply highlight if selected
    if (highlightedMaterial) {
        const { index, name } = highlightedMaterial;
        const targets = new Set<any>();

        // Strategy 1: Direct Index Match (Primary Source of Truth)
        // If the analyzer and viewer are in sync, indices should match.
        if (index >= 0 && index < materials.length) {
             targets.add(materials[index]);
        }

        // Strategy 2: Name Match (Fallback / Supplement)
        // This helps if index alignment is slightly off due to loader differences,
        // or if multiple meshes share the same material name.
        if (name) {
             for(let i = 0; i < materials.length; i++) {
                 if (materials[i].name === name) {
                     targets.add(materials[i]);
                 }
             }
        }

        targets.forEach(targetMat => {
            // Use pbrMetallicRoughness to set emissive factor
            if (targetMat.pbrMetallicRoughness && typeof targetMat.pbrMetallicRoughness.setEmissiveFactor === 'function') {
                // Bright Red Glow [R, G, B]
                targetMat.pbrMetallicRoughness.setEmissiveFactor([1, 0, 0]);
            }
        });
    }

  }, [highlightedMaterial, customModel]);


  // -------------------------------------------------------------------
  // ANALYZER: Geometry & UV Extraction (THREE.js)
  // -------------------------------------------------------------------
  useEffect(() => {
      const modelUrl = getModelSrc();
      if (!modelUrl) return;

      if (onAnalysisStatusRef.current) onAnalysisStatusRef.current('scanning');

      const loader = new GLTFLoader();
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
      loader.setDRACOLoader(dracoLoader);

      loader.load(
          modelUrl,
          (gltf) => {
              // --- UV ISLAND EXTRACTION LOGIC ---
              interface TriangleMeta {
                  tri: UVTriangle;
                  id: number;
                  matName: string | null;
                  matIndex: number;
              }

              const allTriangles: TriangleMeta[] = [];
              let triangleCount = 0;
              const parser = gltf.parser as any;

              gltf.scene.traverse((node) => {
                  if ((node as THREE.Mesh).isMesh) {
                      const mesh = node as THREE.Mesh;
                      const geometry = mesh.geometry;
                      const uvAttribute = geometry.getAttribute('uv');
                      
                      let matName: string | null = null;
                      let matIdx = -1;
                      
                      if (!Array.isArray(mesh.material)) {
                         const material = mesh.material;
                         matName = material.name;
                         const assoc = parser.associations && parser.associations.get(material);
                         if (assoc && assoc.index !== undefined) {
                             matIdx = assoc.index;
                         } else if (parser.json && parser.json.materials) {
                             matIdx = parser.json.materials.findIndex((m: any) => m.name === material.name);
                         }
                      } else {
                          if (mesh.material.length > 0) {
                             const material = mesh.material[0];
                             matName = material.name;
                             const assoc = parser.associations && parser.associations.get(material);
                             if (assoc && assoc.index !== undefined) matIdx = assoc.index;
                          }
                      }
                      
                      if (uvAttribute) {
                          const extractTriangle = (a: number, b: number, c: number) => {
                              const t: UVTriangle = {
                                  p1: { u: uvAttribute.getX(a), v: uvAttribute.getY(a) },
                                  p2: { u: uvAttribute.getX(b), v: uvAttribute.getY(b) },
                                  p3: { u: uvAttribute.getX(c), v: uvAttribute.getY(c) }
                              };
                              allTriangles.push({ 
                                  tri: t, 
                                  id: triangleCount++,
                                  matName: matName || null,
                                  matIndex: matIdx
                              });
                          };

                          if (geometry.index) {
                              const indices = geometry.index;
                              for (let i = 0; i < indices.count; i += 3) {
                                  extractTriangle(indices.getX(i), indices.getX(i + 1), indices.getX(i + 2));
                              }
                          } else {
                              for (let i = 0; i < uvAttribute.count; i += 3) {
                                  extractTriangle(i, i + 1, i + 2);
                              }
                          }
                      }
                  }
              });

              if (allTriangles.length === 0) {
                  if (onAnalysisStatusRef.current) onAnalysisStatusRef.current('empty');
                  return;
              }

              // Union-Find for Island Detection
              const parent = new Array(triangleCount).fill(0).map((_, i) => i);
              const find = (i: number): number => {
                  if (parent[i] === i) return i;
                  parent[i] = find(parent[i]);
                  return parent[i];
              };
              const union = (i: number, j: number) => {
                  const rootI = find(i);
                  const rootJ = find(j);
                  if (rootI !== rootJ) parent[rootI] = rootJ;
              };

              const vertexMap = new Map<string, number[]>();
              const getKey = (u: number, v: number) => `${u.toFixed(4)},${v.toFixed(4)}`;

              allTriangles.forEach(({ tri, id }) => {
                  [tri.p1, tri.p2, tri.p3].forEach(p => {
                      const key = getKey(p.u, p.v);
                      if (!vertexMap.has(key)) {
                          vertexMap.set(key, [id]);
                      } else {
                          const existing = vertexMap.get(key)!;
                          union(id, existing[0]);
                          existing.push(id);
                      }
                  });
              });

              const islandMap = new Map<number, UVIsland>();

              allTriangles.forEach(({ tri, id, matName, matIndex }) => {
                  const rootId = find(id);
                  if (!islandMap.has(rootId)) {
                      islandMap.set(rootId, {
                          id: rootId,
                          materialName: matName,
                          materialIndex: matIndex,
                          triangles: [],
                          bounds: { minU: Infinity, maxU: -Infinity, minV: Infinity, maxV: -Infinity }
                      });
                  }
                  const island = islandMap.get(rootId)!;
                  island.triangles.push(tri);

                  [tri.p1, tri.p2, tri.p3].forEach(p => {
                      island.bounds.minU = Math.min(island.bounds.minU, p.u);
                      island.bounds.maxU = Math.max(island.bounds.maxU, p.u);
                      island.bounds.minV = Math.min(island.bounds.minV, p.v);
                      island.bounds.maxV = Math.max(island.bounds.maxV, p.v);
                  });
              });

              const finalIslands = Array.from(islandMap.values());
              finalIslands.sort((a, b) => b.triangles.length - a.triangles.length);
              finalIslands.forEach((island, idx) => island.id = idx);

              onUVExtractedRef.current({ islands: finalIslands });
              dracoLoader.dispose();
          },
          (xhr) => {},
          (error) => {
              console.error('Error parsing model geometry:', error);
              if (onAnalysisStatusRef.current) onAnalysisStatusRef.current('error');
          }
      );

  }, [customModel]);


  // -------------------------------------------------------------------
  // ANALYZER: Texture Extraction (Model Viewer API)
  // -------------------------------------------------------------------
  useEffect(() => {
    const viewer = viewerRef.current as any;
    if (!viewer) return;

    const handleLoad = async () => {
        if (!viewer.model) return;
        const materials = viewer.model.materials;
        if (!materials || materials.length === 0) return;

        let found = false;
        for (const material of materials) {
            try {
                if (typeof material.ensureLoaded === 'function') {
                    await material.ensureLoaded();
                }
                let pbr;
                try { pbr = material.pbrMetallicRoughness; } catch (err) { continue; }

                if (pbr && pbr.baseColorTexture) {
                    const texture = pbr.baseColorTexture.texture;
                    if (texture && texture.source && texture.source.createObjectURL) {
                        const url = await texture.source.createObjectURL();
                        if (url) {
                            onTextureExtractedRef.current(url);
                            if (onAnalysisStatusRef.current) onAnalysisStatusRef.current('success');
                            found = true;
                            return; 
                        }
                    }
                }
            } catch (e) {
                console.warn("Failed to extract texture:", e);
            }
        }
        if (!found) {
             if (onAnalysisStatusRef.current) onAnalysisStatusRef.current('success');
        }
    };

    viewer.addEventListener('load', handleLoad);
    if (viewer.loaded) handleLoad();
    return () => viewer.removeEventListener('load', handleLoad);
  }, [customModel]);

  // Camera Snap-Focus Logic
  useEffect(() => {
    const viewer = viewerRef.current as any;
    if (!viewer) return;

    if (activePart === 'handle') {
      viewer.cameraTarget = '0m 0.4m 0m';
      viewer.cameraOrbit = '0deg 75deg 2m';
    } else if (activePart === 'body') {
      viewer.cameraTarget = '0m 0.1m 0m';
      viewer.cameraOrbit = '45deg 80deg 2.5m';
    } else {
      viewer.cameraTarget = 'auto auto auto';
      viewer.cameraOrbit = '0deg 75deg 105%'; 
    }
  }, [activePart, customModel]);

  const getArrowDeckItems = () => {
      if (activePart === 'handle') return OPTION_GROUPS.handle.steps;
      if (activePart === 'body') return OPTION_GROUPS.surface.steps;
      return [];
  };

  return (
    <div 
      className="w-full h-full flex items-center justify-center relative bg-cream select-none"
      onPointerDown={(e) => {
         if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'CANVAS') {
             if (activePart) onFocusPart(null);
         }
      }}
    >
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/40 to-transparent z-10" />

      <div className={`relative w-full h-full transition-opacity duration-300 ${isGhosting ? 'opacity-30 grayscale blur-sm' : 'opacity-100'}`}>
        {/* @ts-ignore */}
        <model-viewer
          ref={viewerRef}
          src={getModelSrc()}
          alt="3D Model of Aurora Bag"
          camera-controls
          enable-pan
          touch-action="pan-y"
          bounds="tight"
          camera-target="auto auto auto" 
          shadow-intensity="1"
          exposure="1"
          interpolation-decay="200"
          crossorigin="anonymous" 
          style={{ backgroundColor: 'transparent', width: '100%', height: '100%' }}
        >
            <div 
                slot="hotspot-panel" 
                // @ts-ignore
                data-position={activePart ? DEFAULT_HOTSPOTS[activePart as keyof typeof DEFAULT_HOTSPOTS]?.position : "0m 0m 0m"}
                // @ts-ignore
                data-normal={activePart ? DEFAULT_HOTSPOTS[activePart as keyof typeof DEFAULT_HOTSPOTS]?.normal : "0m 1m 0m"}
                className={`pointer-events-none ${activePart && !isGhosting ? 'block' : 'hidden'}`}
            >
                <div className="transform -translate-x-1/2 -translate-y-[calc(100%+16px)] pointer-events-auto">
                    <AnimatePresence>
                        {activePart && !isGhosting && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            >
                                <div className="relative bg-cream/90 backdrop-blur-sm border border-charcoal px-4 py-3 rounded-none shadow-none min-w-[220px]">
                                    <div className="text-[10px] uppercase tracking-widest text-charcoal/40 mb-2 font-bold text-center">Quick Options</div>
                                    <div className="flex flex-col gap-2">
                                        {getArrowDeckItems().map(step => (
                                            <div key={step.id} className="flex items-center justify-between gap-4">
                                                <span className="text-xs font-serif italic">{step.label}</span>
                                                <div className="flex gap-1">
                                                    {step.options.slice(0,3).map(opt => (
                                                        <button 
                                                            key={opt.id}
                                                            // @ts-ignore
                                                            onClick={(e) => { e.stopPropagation(); onUpdateConfig(step.id, opt.id); }}
                                                            // @ts-ignore
                                                            className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${configuration[step.id] === opt.id ? 'bg-charcoal border-charcoal text-cream' : 'border-charcoal/20 hover:border-accent'}`}
                                                            title={opt.label}
                                                        >
                                                            <span className="text-[8px] font-bold">{opt.label[0]}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-cream/90 border-r border-b border-charcoal rotate-45" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {!activePart && !isGhosting && (
                <>
                    <button 
                        slot="hotspot-handle" 
                        data-position={DEFAULT_HOTSPOTS.handle.position} 
                        data-normal={DEFAULT_HOTSPOTS.handle.normal}
                        className="block w-0 h-0 focus:outline-none"
                        onClick={() => onFocusPart('handle')}
                    >
                         <div className="transform -translate-x-1/2 -translate-y-1/2">
                             <HotspotVisual label="Handle" />
                         </div>
                    </button>

                     <button 
                        slot="hotspot-body" 
                        data-position={DEFAULT_HOTSPOTS.body.position} 
                        data-normal={DEFAULT_HOTSPOTS.body.normal}
                        className="block w-0 h-0 focus:outline-none"
                        onClick={() => onFocusPart('body')}
                    >
                         <div className="transform -translate-x-1/2 -translate-y-1/2">
                             <HotspotVisual label="Surface" />
                         </div>
                    </button>
                </>
            )}
        {/* @ts-ignore */}
        </model-viewer>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 pointer-events-none">
        {!activePart && (
            <button
              className="pointer-events-auto bg-white/80 backdrop-blur-sm border border-charcoal/20 px-5 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:border-accent hover:text-accent transition-colors shadow-sm"
              onPointerDown={() => onSetGhosting(true)}
              onPointerUp={() => onSetGhosting(false)}
              onPointerLeave={() => onSetGhosting(false)}
              onTouchStart={(e) => { e.preventDefault(); onSetGhosting(true); }}
              onTouchEnd={(e) => { e.preventDefault(); onSetGhosting(false); }}
            >
              Hold to Compare
            </button>
        )}
        {!activePart && !isGhosting && (
            <span className="text-charcoal/40 text-[10px] uppercase tracking-widest">
                Tap part to edit
            </span>
        )}
      </div>

      <AnimatePresence>
        {isGhosting && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
            >
                <span className="bg-charcoal text-cream px-5 py-3 rounded-full text-xs uppercase tracking-widest font-bold shadow-xl">
                    Original Config
                </span>
            </motion.div>
        )}
      </AnimatePresence>
      
      {activePart && (
          <button 
            onClick={() => onFocusPart(null)}
            className="absolute top-6 left-6 z-40 w-10 h-10 bg-white/80 backdrop-blur rounded-full border border-charcoal/10 flex items-center justify-center text-charcoal hover:border-accent hover:text-accent transition-colors"
          >
             <span className="text-xl">×</span>
          </button>
      )}
    </div>
  );
};

const HotspotVisual = ({ label }: { label: string }) => {
  return (
    <motion.div
      className="group relative cursor-pointer"
      whileHover={{ scale: 1.1 }}
    >
      <span className="absolute inset-0 -m-2 rounded-full border border-charcoal/20 scale-100 group-hover:scale-150 transition-transform duration-500" />
      <span className="block w-3 h-3 rounded-full bg-cream border border-charcoal group-hover:bg-accent group-hover:border-accent transition-colors duration-300" />
      <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 text-charcoal font-serif italic text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-cream/80 px-2 py-1 border border-charcoal/10">
        {label}
      </span>
    </motion.div>
  );
};
