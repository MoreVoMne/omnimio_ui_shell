
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { SelectionState } from '../types';
import { MATERIALS } from '../constants';

// Get fabric from window as it is loaded via script tag
const fabric = (window as any).fabric;

interface PatternViewProps {
  selections: SelectionState;
  customModelUrl?: string | null;
  selectedPartId: string | null;
  onSelectPart: (id: string | null) => void;
  decals?: any[];
  isDragging?: boolean;
  isTransitioning?: boolean;
}

type ViewLayer = 'outer' | 'inner';

export const PatternView: React.FC<PatternViewProps> = ({ selections, customModelUrl, selectedPartId, onSelectPart, isDragging = false, isTransitioning = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [viewLayer, setViewLayer] = useState<ViewLayer>('outer');

  // --- Helper: Fit Content to View ---
  const fitContent = useCallback(() => {
      const canvas = fabricCanvasRef.current;
      const container = containerRef.current;
      
      // Prevent calculations during layout transition to stop jumping
      if (!canvas || !container) return;

      // 1. Update Canvas Dimensions to Match Container
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      if (width === 0 || height === 0) return;

      // 2. Calculate Bounding Box of Content
      const objects = canvas.getObjects();
      const visibleObjects = objects.filter((o: any) => o.visible);
      const targets = visibleObjects.length > 0 ? visibleObjects : objects;
      
      if (targets.length === 0) {
          canvas.requestRenderAll();
          return;
      }

      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

      targets.forEach((obj: any) => {
          const bound = obj.getBoundingRect();
          if (bound.left < minX) minX = bound.left;
          if (bound.top < minY) minY = bound.top;
          if (bound.left + bound.width > maxX) maxX = bound.left + bound.width;
          if (bound.top + bound.height > maxY) maxY = bound.top + bound.height;
      });

      const boundsWidth = maxX - minX;
      const boundsHeight = maxY - minY;

      if (boundsWidth === 0 || boundsHeight === 0) return;

      // 3. Calculate Scale & Pan
      const padding = 60; 
      const availableWidth = width - (padding * 2);
      const availableHeight = height - (padding * 2);

      const scaleX = availableWidth / boundsWidth;
      const scaleY = availableHeight / boundsHeight;
      const zoom = Math.min(scaleX, scaleY, 20); 

      const centerX = minX + boundsWidth / 2;
      const centerY = minY + boundsHeight / 2;

      const panX = (width / 2) - (centerX * zoom);
      const panY = (height / 2) - (centerY * zoom);

      canvas.setViewportTransform([zoom, 0, 0, zoom, panX, panY]);
      canvas.requestRenderAll();
  }, []);

  // Helper: Only resize canvas element
  const updateCanvasDimensions = useCallback(() => {
      if (!fabricCanvasRef.current || !containerRef.current) return;
      const canvas = fabricCanvasRef.current;
      const container = containerRef.current;
      canvas.setWidth(container.clientWidth);
      canvas.setHeight(container.clientHeight);
      canvas.requestRenderAll();
  }, []);

  // Snap fit when dragging/transition ends
  useEffect(() => {
      if (!isDragging && !isTransitioning) {
          // Small delay to ensure layout has settled
          const t = setTimeout(() => {
              updateCanvasDimensions();
              fitContent();
          }, 100);
          return () => clearTimeout(t);
      }
  }, [isDragging, isTransitioning, fitContent, updateCanvasDimensions]);


  // --- Initialize Fabric Canvas ---
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || !fabric) return;
    
    // Initialize empty canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      selection: true,
      preserveObjectStacking: true,
      backgroundColor: 'transparent'
    });

    // Setup interactions
    let isDragPan = false;
    let lastPosX = 0;
    let lastPosY = 0;

    canvas.on('mouse:down', (opt: any) => {
      const evt = opt.e;
      if (!opt.target) {
          isDragPan = true;
          canvas.selection = false;
          lastPosX = evt.clientX;
          lastPosY = evt.clientY;
          onSelectPart(null);
      } else {
          if (opt.target.data?.stableId) {
              onSelectPart(opt.target.data.stableId);
          }
      }
    });

    canvas.on('mouse:move', (opt: any) => {
      if (isDragPan) {
        const e = opt.e;
        const vpt = canvas.viewportTransform!;
        vpt[4] += e.clientX - lastPosX;
        vpt[5] += e.clientY - lastPosY;
        canvas.requestRenderAll();
        lastPosX = e.clientX;
        lastPosY = e.clientY;
      }
    });

    canvas.on('mouse:up', () => {
      canvas.setViewportTransform(canvas.viewportTransform!);
      isDragPan = false;
      canvas.selection = true;
    });

    canvas.on('mouse:wheel', (opt: any) => {
      const delta = opt.e.deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 20) zoom = 20;
      if (zoom < 0.01) zoom = 0.01;
      canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    fabricCanvasRef.current = canvas;

    return () => {
      canvas.dispose();
    };
  }, []); 


  // --- Resize Observer ---
  useEffect(() => {
      if (!containerRef.current) return;

      const resizeObserver = new ResizeObserver(() => {
          // CRITICAL: Do not attempt to resize or fit content during CSS transition
          if (isTransitioning) return;

          window.requestAnimationFrame(() => {
              updateCanvasDimensions();
              fitContent();
          });
      });

      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
  }, [fitContent, updateCanvasDimensions, isTransitioning]);


  // --- Load Custom Model ---
  useEffect(() => {
    if (!customModelUrl || !fabricCanvasRef.current) return;

    setIsLoading(true);
    const loader = new GLTFLoader();

    loader.load(customModelUrl, (gltf) => {
        const canvas = fabricCanvasRef.current!;
        canvas.clear(); 
        
        const CANVAS_SIZE = 800; 

        const meshes: { mesh: THREE.Mesh; volume: number; worldBox: THREE.Box3 }[] = [];
        
        gltf.scene.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
             const mesh = obj as THREE.Mesh;
             mesh.updateMatrixWorld(true);
             if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
             
             const box = mesh.geometry.boundingBox!.clone();
             box.applyMatrix4(mesh.matrixWorld);
             const size = new THREE.Vector3();
             box.getSize(size);
             const volume = size.x * size.y * size.z;
             meshes.push({ mesh, volume, worldBox: box });
          }
        });

        meshes.sort((a, b) => b.volume - a.volume);
        const shell = meshes[0];
        const shellBoxExpanded = shell?.worldBox.clone().expandByScalar(0.01);

        let meshIndex = 0;

        gltf.scene.traverse((obj) => {
            if ((obj as THREE.Mesh).isMesh) {
                const mesh = obj as THREE.Mesh;
                const geometry = mesh.geometry;
                const stableId = `${mesh.name || 'mesh'}_${meshIndex}`;
                meshIndex++;

                let layer: ViewLayer = 'outer';
                if (shell && mesh !== shell.mesh) {
                    const meshEntry = meshes.find(m => m.mesh === mesh);
                    if (meshEntry && shellBoxExpanded.containsBox(meshEntry.worldBox)) {
                        layer = 'inner';
                    }
                }

                if (geometry.attributes.uv) {
                    const uvs = geometry.attributes.uv;
                    const count = uvs.count;
                    const indices = geometry.index ? geometry.index.array : null;

                    let fillPathData = "";
                    const edgeMap = new Map<string, number>();

                    const processTriangle = (a: number, b: number, c: number) => {
                        const u1 = uvs.getX(a) * CANVAS_SIZE;
                        const v1 = (1 - uvs.getY(a)) * CANVAS_SIZE;
                        const u2 = uvs.getX(b) * CANVAS_SIZE;
                        const v2 = (1 - uvs.getY(b)) * CANVAS_SIZE;
                        const u3 = uvs.getX(c) * CANVAS_SIZE;
                        const v3 = (1 - uvs.getY(c)) * CANVAS_SIZE;

                        fillPathData += `M ${u1} ${v1} L ${u2} ${v2} L ${u3} ${v3} Z `;

                        const addEdge = (x1: number, y1: number, x2: number, y2: number) => {
                            const k1 = `${x1.toFixed(1)},${y1.toFixed(1)}`;
                            const k2 = `${x2.toFixed(1)},${y2.toFixed(1)}`;
                            const key = k1 < k2 ? `${k1}|${k2}` : `${k2}|${k1}`;
                            edgeMap.set(key, (edgeMap.get(key) || 0) + 1);
                        };
                        addEdge(u1, v1, u2, v2);
                        addEdge(u2, v2, u3, v3);
                        addEdge(u3, v3, u1, v1);
                    };

                    if (indices) {
                        for (let i = 0; i < indices.length; i += 3) {
                            processTriangle(indices[i], indices[i + 1], indices[i + 2]);
                        }
                    } else {
                        for (let i = 0; i < count; i += 3) {
                            processTriangle(i, i+1, i+2);
                        }
                    }

                    if (fillPathData.length > 0) {
                        const fillPath = new fabric.Path(fillPathData, {
                           fill: 'rgba(255,255,255,0.01)', 
                           stroke: null,
                           strokeWidth: 0,
                           originX: 'center',
                           originY: 'center'
                        });

                        let contourPathData = "";
                        for (const [key, count] of edgeMap.entries()) {
                            if (count === 1) {
                                const [start, end] = key.split('|');
                                const [x1, y1] = start.split(',').map(Number);
                                const [x2, y2] = end.split(',').map(Number);
                                contourPathData += `M ${x1} ${y1} L ${x2} ${y2} `;
                            }
                        }

                        const contourPath = new fabric.Path(contourPathData, {
                            stroke: '#000000', 
                            strokeWidth: 1,
                            fill: null,
                            strokeLineCap: 'round',
                            strokeLineJoin: 'round',
                            originX: 'center',
                            originY: 'center'
                        });

                        const group = new fabric.Group([fillPath, contourPath], {
                            data: { stableId, layer }, 
                            selectable: true,
                            hoverCursor: 'pointer',
                            perPixelTargetFind: true,
                            lockMovementX: true,
                            lockMovementY: true,
                            lockScalingX: true,
                            lockScalingY: true,
                            lockRotation: true,
                            hasControls: false,
                            hasBorders: false,
                            subTargetCheck: false,
                            visible: layer === 'outer'
                        });
                        canvas.add(group);
                    }
                }
            }
        });

        // Only fit if not currently transitioning
        if (!isTransitioning) {
            fitContent();
        }
        setIsLoading(false);

    }, undefined, (error) => {
        console.error("Error loading model:", error);
        setIsLoading(false);
    });
  }, [customModelUrl, fitContent, isTransitioning]);


  // --- Layer Switching & Fitting ---
  useEffect(() => {
    if (fabricCanvasRef.current) {
       fabricCanvasRef.current.getObjects().forEach((obj: any) => {
          if (obj.data?.layer) {
             obj.visible = obj.data.layer === viewLayer;
          }
       });
       if (!isTransitioning) fitContent();
    }
  }, [viewLayer, fitContent, isTransitioning]);


  // --- Selection Sync ---
  useEffect(() => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      if (selectedPartId) {
          const targetObj = canvas.getObjects().find((obj: any) => obj.data?.stableId === selectedPartId);
          if (targetObj) {
              const targetLayer = (targetObj as any).data?.layer;
              if (targetLayer && targetLayer !== viewLayer) {
                  setViewLayer(targetLayer as ViewLayer);
                  return; 
              }
          }
      }

      canvas.getObjects().forEach((obj: any) => {
          const group = obj;
          const id = group.data?.stableId;
          
          if (!group.visible) return;

          const objects = group.getObjects();
          const fillObj = objects[0];
          const contourObj = objects[1];

          if (id === selectedPartId) {
              if (contourObj) contourObj.set({ stroke: '#C20000', strokeWidth: 3 });
              if (fillObj) fillObj.set({ fill: 'rgba(194, 0, 0, 0.2)' });
              canvas.bringToFront(group);
          } else {
              if (contourObj) contourObj.set({ stroke: '#000000', strokeWidth: 1 });
              if (fillObj) fillObj.set({ fill: 'rgba(255,255,255,0.01)' });
          }
          group.dirty = true;
      });
      canvas.requestRenderAll();
  }, [selectedPartId, viewLayer]);


  const bodyMat = MATERIALS[selections.body as keyof typeof MATERIALS] || MATERIALS.pebble_bisque;
  const handleMatKey = selections.handle_material === 'match_body' 
    ? selections.body 
    : (selections.handle_material === 'contrast_tan' ? 'leather_sienna' : 'pebble_noir');
  const handleColor = selections.handle_material === 'scarf_wrap' 
    ? '#C85A17' 
    : (MATERIALS[handleMatKey as keyof typeof MATERIALS]?.color || '#EFECE4');
  const hardwareMat = MATERIALS[selections.hardware as keyof typeof MATERIALS] || MATERIALS.brass_antique;

  // Interactive helpers for procedural fallback
  const handleProceduralClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onSelectPart(id);
  };

  const getProceduralStyle = (id: string) => {
    const isSelected = selectedPartId === id;
    return {
      stroke: isSelected ? '#C20000' : '#000000',
      strokeWidth: isSelected ? 3 : (id.includes('hardware') ? 3 : 1),
      fill: isSelected ? '#C20000' : undefined,
      fillOpacity: isSelected ? 0.2 : 1,
      className: 'cursor-pointer transition-all duration-300'
    };
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-paper relative overflow-hidden flex flex-col items-center justify-center">
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'linear-gradient(#000000 1px, transparent 1px), linear-gradient(90deg, #000000 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>
        
        {/* Ruler */}
        <div className="absolute top-0 left-0 w-full h-8 border-b border-charcoal flex items-end justify-between px-2 font-mono text-[10px] text-charcoal z-10 pointer-events-none">
           {[...Array(20)].map((_, i) => <span key={i}>|</span>)}
        </div>

        {customModelUrl ? (
            <>
                <canvas ref={canvasRef} className="absolute inset-0 z-0" />
                
                <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
                    <div className="flex bg-paper border border-charcoal rounded-sm overflow-hidden shadow-sm">
                        <button 
                            onClick={() => setViewLayer('outer')}
                            className={`px-3 py-1 text-[10px] font-mono uppercase transition-colors ${viewLayer === 'outer' ? 'bg-charcoal text-cream' : 'text-charcoal hover:bg-gray-100'}`}
                        >
                            Outer
                        </button>
                        <div className="w-px bg-charcoal"></div>
                        <button 
                            onClick={() => setViewLayer('inner')}
                            className={`px-3 py-1 text-[10px] font-mono uppercase transition-colors ${viewLayer === 'inner' ? 'bg-charcoal text-cream' : 'text-charcoal hover:bg-gray-100'}`}
                        >
                            Inner
                        </button>
                    </div>
                </div>

                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-paper/80 z-20">
                        <p className="font-mono text-xs text-charcoal animate-pulse">EXTRACTING UV GEOMETRY...</p>
                    </div>
                )}
            </>
        ) : (
            /* --- Procedural SVG View (Responsive Fallback) --- */
            <div className="relative z-10 p-8 w-full h-full flex items-center justify-center" onClick={() => onSelectPart(null)}>
                <svg 
                    viewBox="0 0 400 500" 
                    className="max-w-full max-h-full w-auto h-auto drop-shadow-xl" 
                    preserveAspectRatio="xMidYMid meet"
                >
                    <defs>
                        <pattern id="pattern-grain" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                            <circle cx="1" cy="1" r="1" fill="black" opacity="0.05"/>
                        </pattern>
                    </defs>

                    {/* Main Body Panel Pattern */}
                    <g transform="translate(50, 50)" onClick={(e) => handleProceduralClick(e, 'proc_body')}>
                        <rect 
                            x="0" y="0" width="300" height="250" rx="10" 
                            fill={bodyMat.color} 
                            strokeDasharray="5,5"
                            {...getProceduralStyle('proc_body')}
                            fillOpacity={selectedPartId === 'proc_body' ? 0.2 : 1}
                        />
                        {/* Overlay grain only if not selected (to see highlight better) */}
                        <rect x="0" y="0" width="300" height="250" rx="10" fill="url(#pattern-grain)" className="pointer-events-none" />
                        <line x1="-10" y1="50" x2="10" y2="50" stroke="red" strokeWidth="1" />
                        <line x1="290" y1="50" x2="310" y2="50" stroke="red" strokeWidth="1" />
                        <text x="150" y="125" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill={selectedPartId === 'proc_body' ? '#C16646' : '#000'} className="pointer-events-none font-bold">PANEL_FRONT_01</text>
                    </g>

                    {/* Handle Patterns */}
                    <g transform="translate(50, 320)" onClick={(e) => handleProceduralClick(e, 'proc_handle')}>
                        <rect 
                            x="0" y="0" width="300" height="30" rx="15" 
                            fill={handleColor} 
                            {...getProceduralStyle('proc_handle')}
                            fillOpacity={selectedPartId === 'proc_handle' ? 0.2 : 1}
                        />
                        <text x="150" y="20" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill={selectedPartId === 'proc_handle' ? '#C16646' : '#000'} className="pointer-events-none font-bold">STRAP_ASSEMBLY</text>
                        
                        {/* Hardware Rings */}
                        <g onClick={(e) => handleProceduralClick(e, 'proc_hardware')}>
                             <circle cx="15" cy="15" r="8" fill="none" {...getProceduralStyle('proc_hardware')} stroke={selectedPartId === 'proc_hardware' ? '#C16646' : hardwareMat.color} />
                             <circle cx="285" cy="15" r="8" fill="none" {...getProceduralStyle('proc_hardware')} stroke={selectedPartId === 'proc_hardware' ? '#C16646' : hardwareMat.color} />
                        </g>
                    </g>

                    {/* Charm Pattern */}
                    {selections.charm_type !== 'none' && (
                            <g transform="translate(300, 400)" onClick={(e) => handleProceduralClick(e, 'proc_charm')}>
                            <rect 
                                x="0" y="0" width="40" height="60" rx="2" 
                                fill={selections.charm_type === 'leather_tag' ? MATERIALS.leather_sienna.color : hardwareMat.color} 
                                {...getProceduralStyle('proc_charm')}
                                fillOpacity={selectedPartId === 'proc_charm' ? 0.2 : 1}
                            />
                            <circle cx="20" cy="10" r="2" fill="#fff" />
                            <text x="20" y="35" textAnchor="middle" fontSize="8" fontFamily="serif" fill={selectedPartId === 'proc_charm' ? '#C16646' : '#000'} className="font-bold">M</text>
                            </g>
                    )}
                </svg>
            </div>
        )}
        
        <div className="absolute bottom-4 left-4 font-mono text-[10px] text-charcoal pointer-events-none">
             TOGGLE LAYER • CLICK ISLAND • DRAG PAN • SCROLL ZOOM
        </div>
    </div>
  );
};
