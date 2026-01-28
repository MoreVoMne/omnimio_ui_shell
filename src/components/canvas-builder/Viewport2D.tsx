import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useCanvasStore } from '../../stores/canvasStore';
import { extractUVMap } from '../../utils/uvExtractor';
import type { UVMapData } from '../../utils/uvExtractor';

interface Viewport2DProps {
  onMeshClick?: (meshIndex: number, meshName: string) => void;
}

const Viewport2D: React.FC<Viewport2DProps> = ({ onMeshClick }) => {
  const { assets, parts } = useCanvasStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [uvMaps, setUvMaps] = useState<UVMapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const uvMapPositionsRef = useRef<Array<{ x: number; y: number; size: number; meshIndex: number }>>([]);

  const modelAsset = assets.models[0];
  const modelUrl = modelAsset?.url;

  // Load UV maps for all meshes
  useEffect(() => {
    if (!modelUrl) {
      setLoading(false);
      return;
    }

    const loadUVMaps = async () => {
      setLoading(true);
      const maps: UVMapData[] = [];
      
      // Try to load UV maps for up to 20 meshes (reasonable limit)
      for (let i = 0; i < 20; i++) {
        const uvData = await extractUVMap(modelUrl, i);
        if (uvData) {
          maps.push(uvData);
        } else {
          // If we get null, we've likely reached the end of meshes
          break;
        }
      }
      
      setUvMaps(maps);
      setLoading(false);
    };

    loadUVMaps();
  }, [modelUrl]);

  // Render UV maps on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || uvMaps.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const container = containerRef.current;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    // Clear canvas
    ctx.fillStyle = '#F8F5F0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#00000015';
    ctx.lineWidth = 1;
    const gridSize = 40 * scale;
    const offsetX = (panX % gridSize + gridSize) % gridSize;
    const offsetY = (panY % gridSize + gridSize) % gridSize;
    
    for (let x = -offsetX; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    for (let y = -offsetY; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw UV maps
    const baseSize = 512;
    const spacing = 20 * scale;
    let currentX = panX;
    let currentY = panY;
    const maxWidth = canvas.width;

    uvMaps.forEach((uvData, index) => {
      const displaySize = baseSize * scale;
      
      // Check if we need to wrap to next row
      if (currentX + displaySize > maxWidth && currentX > panX) {
        currentX = panX;
        currentY += displaySize + spacing;
      }

      // Create temporary canvas for this UV map
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = uvData.width;
      tempCanvas.height = uvData.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.putImageData(uvData.imageData, 0, 0);
        
        // Draw UV map
        ctx.drawImage(
          tempCanvas,
          currentX,
          currentY,
          displaySize,
          displaySize
        );
      }

      // Draw part name if exists
      const part = parts.find((p) => p.meshIndex === index);
      if (part) {
        ctx.fillStyle = '#000000';
        ctx.font = `${12 * scale}px monospace`;
        ctx.fillText(
          part.name || `Part ${index}`,
          currentX + 5 * scale,
          currentY + 15 * scale
        );
      }

      // Draw border
      ctx.strokeStyle = '#00000040';
      ctx.lineWidth = 1;
      ctx.strokeRect(currentX, currentY, displaySize, displaySize);

      // Store position for click detection
      uvMapPositionsRef.current[index] = {
        x: currentX,
        y: currentY,
        size: displaySize,
        meshIndex: index,
      };

      currentX += displaySize + spacing;
    });
  }, [uvMaps, scale, panX, panY, parts]);

  // Handle wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(3, scale * delta));
    setScale(newScale);
  }, [scale]);

  // Handle mouse drag for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
    }
  }, [panX, panY]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPanX(e.clientX - dragStart.x);
      setPanY(e.clientY - dragStart.y);
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle canvas click
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) return;
    
    const canvas = canvasRef.current;
    if (!canvas || !onMeshClick) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const positions = uvMapPositionsRef.current;
    if (positions && positions.length > 0) {
      for (const pos of positions) {
        if (x >= pos.x && x <= pos.x + pos.size && y >= pos.y && y <= pos.y + pos.size) {
          const uvData = uvMaps[pos.meshIndex];
          if (uvData) {
            onMeshClick(pos.meshIndex, uvData.meshName);
            break;
          }
        }
      }
    }
  }, [isDragging, onMeshClick, uvMaps]);

  if (!modelUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-cream/70 border border-charcoal rounded-[18px]">
        <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60">
          No 3D model loaded
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-cream/70 border border-charcoal rounded-[18px]">
        <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60">
          Loading UV maps...
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative bg-cream/70 border border-charcoal rounded-[18px] overflow-hidden cursor-move"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onClick={handleCanvasClick}
      />
      <div className="absolute top-2 right-2 bg-cream/90 border border-charcoal/30 px-2 py-1 rounded-md">
        <p className="font-mono text-[8px] uppercase tracking-widest text-charcoal/60">
          Zoom: {(scale * 100).toFixed(0)}% | Pan: Drag | Meshes: {uvMaps.length}
        </p>
      </div>
    </div>
  );
};

export default Viewport2D;

