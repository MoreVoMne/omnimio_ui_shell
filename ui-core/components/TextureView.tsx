
import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, Loader2, AlertCircle, Layers, MousePointer2 } from 'lucide-react';
import { UVMapData } from '../types';

// Declare Fabric globally as it comes from CDN
declare global {
  interface Window {
    fabric: any;
  }
}

interface TextureViewProps {
  src: string | null;
  uvData?: UVMapData | null;
  status: 'idle' | 'scanning' | 'success' | 'error' | 'empty';
  onSelectIsland?: (island: { materialName: string | null, materialIndex: number } | null) => void;
}

export const TextureView: React.FC<TextureViewProps> = ({ src, uvData, status, onSelectIsland }) => {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedIslandId, setSelectedIslandId] = useState<number | null>(null);
  const [isFabricReady, setIsFabricReady] = useState(false);

  // Initialize Fabric Canvas
  useEffect(() => {
    if (!canvasElRef.current || !window.fabric) return;

    const canvas = new window.fabric.Canvas(canvasElRef.current, {
      selection: false, // disable group selection
      preserveObjectStacking: true,
    });

    fabricCanvasRef.current = canvas;
    setIsFabricReady(true);

    // Handle Selection Logic via Fabric events
    canvas.on('mouse:down', (options: any) => {
        if (options.target && options.target.data && options.target.data.type === 'island') {
            const islandId = options.target.data.id;
            const materialIndex = options.target.data.materialIndex;
            const materialName = options.target.data.materialName;
            
            // Toggle selection
            handleSelection(islandId, materialName, materialIndex);
        } else {
            // Deselect if clicked empty space
            handleSelection(null, null, -1);
        }
    });

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, []);

  // Handle selection state
  const handleSelection = (id: number | null, matName: string | null, matIndex: number) => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      canvas.getObjects().forEach((obj: any) => {
          if (obj.data && obj.data.type === 'island') {
              if (obj.data.id === id) {
                  // Highlight with Outline only (very transparent fill)
                  obj.set({
                      fill: 'rgba(194, 0, 0, 0.2)', // Almost transparent red
                      stroke: '#C20000',
                      strokeWidth: 5 // Thicker for visibility
                  });
              } else {
                  // Reset
                  obj.set({
                      fill: 'transparent',
                      stroke: 'rgba(0, 0, 0, 0.2)', // Black ghost
                      strokeWidth: 1
                  });
              }
          }
      });
      
      canvas.requestRenderAll();

      // Update Parent State
      if (id !== null && onSelectIsland) {
          onSelectIsland({ materialName: matName, materialIndex: matIndex });
      } else if (onSelectIsland) {
          onSelectIsland(null);
      }
      
      setSelectedIslandId(id);
  };

  // Load Image & UVs
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !isFabricReady) return;
    if (!containerRef.current) return;

    // Clear existing
    canvas.clear();

    // 1. Load Background Image (Base Texture)
    const loadTexture = () => {
        return new Promise<void>((resolve) => {
            if (src) {
                window.fabric.Image.fromURL(src, (img: any) => {
                    // Resize canvas to match image aspect ratio, fitted in container
                    const containerW = containerRef.current!.clientWidth - 64; // padding
                    const containerH = containerRef.current!.clientHeight - 64;
                    
                    const scale = Math.min(containerW / img.width, containerH / img.height);
                    const finalW = img.width * scale;
                    const finalH = img.height * scale;

                    canvas.setDimensions({ width: finalW, height: finalH });
                    
                    img.set({
                        scaleX: scale,
                        scaleY: scale,
                        originX: 'left',
                        originY: 'top',
                        selectable: false,
                        evented: false
                    });
                    
                    canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
                    canvas.data = { scale: scale, width: finalW, height: finalH }; // store meta
                    resolve();
                }, { crossOrigin: 'anonymous' });
            } else {
                // No texture, use default square
                const size = Math.min(containerRef.current!.clientWidth, containerRef.current!.clientHeight) - 64;
                canvas.setDimensions({ width: size, height: size });
                canvas.backgroundColor = '#ffffff';
                canvas.data = { scale: size, width: size, height: size }; // UVs are 0-1, so scale is size
                resolve();
            }
        });
    };

    // 2. Draw UV Islands
    const drawIslands = () => {
        if (!uvData || !uvData.islands) return;
        
        const width = canvas.getWidth();
        const height = canvas.getHeight();

        uvData.islands.forEach((island) => {
            const triangleObjs = island.triangles.map((tri) => {
                return new window.fabric.Polygon([
                    { x: tri.p1.u * width, y: tri.p1.v * height },
                    { x: tri.p2.u * width, y: tri.p2.v * height },
                    { x: tri.p3.u * width, y: tri.p3.v * height }
                ], {
                    stroke: 'rgba(0,0,0,0.2)',
                    strokeWidth: 1,
                    fill: 'transparent',
                    selectable: true,
                    // We aggregate these later, but strictly speaking, we want the whole island to react as one.
                });
            });

            // Grouping them makes them act as one unit
            const group = new window.fabric.Group(triangleObjs, {
                selectable: true,
                hasControls: false,
                hasBorders: false,
                perPixelTargetFind: true, // Accurate hit testing
                lockMovementX: true,
                lockMovementY: true,
                lockScalingX: true,
                lockScalingY: true,
                lockRotation: true,
                hoverCursor: 'pointer',
                data: { 
                    type: 'island', 
                    id: island.id,
                    materialName: island.materialName,
                    materialIndex: island.materialIndex
                }
            });
            
            canvas.add(group);
        });
        
        canvas.requestRenderAll();
    };

    loadTexture().then(() => {
        drawIslands();
    });

  }, [src, uvData, isFabricReady]);


  return (
    <div className="w-full h-full bg-white relative overflow-hidden group select-none" ref={containerRef}>
      {/* Grid Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ 
             backgroundImage: 'radial-gradient(#000000 1px, transparent 1px)', 
             backgroundSize: '20px 20px' 
           }} 
      />
      
      {/* Header / Label */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <div className="bg-cream/90 backdrop-blur border border-charcoal px-2 py-1 rounded-sm flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest font-bold text-charcoal">Fabric.js Studio</span>
            {status === 'scanning' && <Loader2 size={10} className="animate-spin text-accent" />}
        </div>
      </div>

      {/* MAIN CANVAS CONTAINER */}
      <motion.div 
          className="w-full h-full flex items-center justify-center p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
           {/* Canvas Element controlled by Fabric */}
           <canvas ref={canvasElRef} />
      </motion.div>
           
       {/* Empty States */}
       {!src && !uvData && status !== 'scanning' && (
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="flex flex-col items-center gap-2 text-charcoal/40">
                    <Layers size={24} />
                    <span className="text-xs uppercase tracking-widest">No Model Data</span>
                </div>
           </div>
       )}
       
       {status === 'scanning' && (
           <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-white/80 px-3 py-2 rounded-full shadow-sm">
                <Loader2 size={12} className="animate-spin text-accent" />
                <span className="text-[9px] uppercase tracking-widest">Processing Geometry...</span>
           </div>
       )}

       {/* Hint */}
       {uvData && selectedIslandId === null && (
         <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-charcoal/80 backdrop-blur text-cream px-3 py-1 rounded-full flex items-center gap-2 pointer-events-none">
             <MousePointer2 size={12} />
             <span className="text-[9px] uppercase tracking-widest">Click map to paint selection</span>
         </div>
       )}
    </div>
  );
};
