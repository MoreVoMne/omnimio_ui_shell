import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useCanvasStore } from '../../stores/canvasStore';
import { getPartUVMap } from '../../utils/uvExtractor';
import Viewport3D from '../canvas-builder/Viewport3D';
import type { Zone } from '../../types/canvas';

interface ZoneEditorProps {
  partId: string;
  capabilityId: string;
  onClose: () => void;
}

type DrawingTool = 'rectangle' | 'ellipse' | 'freeform' | 'polygon';

interface DrawingState {
  isDrawing: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  points: Array<{ x: number; y: number }>;
}

const ZoneEditor: React.FC<ZoneEditorProps> = ({ partId, capabilityId, onClose }) => {
  const { parts, zones, addZone, updateZone, removeZone, assets } = useCanvasStore();
  const [tool, setTool] = useState<DrawingTool>('rectangle');
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [drawingState, setDrawingState] = useState<DrawingState | null>(null);
  const [uvMapImage, setUvMapImage] = useState<ImageData | null>(null);
  const [showProperties, setShowProperties] = useState(false);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  const part = parts.find((p) => p.id === partId);
  const partZones = zones.get(partId) || [];
  const selectedZone = selectedZoneId ? partZones.find((z) => z.id === selectedZoneId) : null;

  // Load UV map for the part
  useEffect(() => {
    const loadUVMap = async () => {
      if (!part || !assets.models[0]?.url) return;

      const uvMap = await getPartUVMap(assets.models[0].url, part.meshIndex);
      if (uvMap) {
        setUvMapImage(uvMap);
      }
    };

    loadUVMap();
  }, [part, assets.models]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const canvasSize = 512;
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    // Clear canvas
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Draw UV map background
    if (uvMapImage) {
      ctx.putImageData(uvMapImage, 0, 0);
    } else {
      // Fallback: draw placeholder
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
    }

    // Draw zones
    partZones.forEach((zone) => {
      const x = zone.uvBounds.x * canvasSize;
      const y = zone.uvBounds.y * canvasSize;
      const w = zone.uvBounds.width * canvasSize;
      const h = zone.uvBounds.height * canvasSize;

      const isSelected = zone.id === selectedZoneId;
      ctx.strokeStyle = isSelected ? '#00ff00' : '#000000';
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.fillStyle = isSelected ? '#00ff0020' : '#00000010';
      
      if (tool === 'ellipse') {
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
      }

      // Zone label
      ctx.fillStyle = '#000000';
      ctx.font = '10px monospace';
      ctx.fillText(zone.name, x + 5, y + 15);
    });

    // Draw current drawing
    if (drawingState && drawingState.isDrawing) {
      ctx.strokeStyle = '#0066ff';
      ctx.lineWidth = 2;
      ctx.fillStyle = '#0066ff20';

      if (tool === 'rectangle' || tool === 'ellipse') {
        const x = Math.min(drawingState.startX, drawingState.currentX);
        const y = Math.min(drawingState.startY, drawingState.currentY);
        const w = Math.abs(drawingState.currentX - drawingState.startX);
        const h = Math.abs(drawingState.currentY - drawingState.startY);

        if (tool === 'ellipse') {
          ctx.beginPath();
          ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillRect(x, y, w, h);
          ctx.strokeRect(x, y, w, h);
        }
      } else if (tool === 'freeform' && drawingState.points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(drawingState.points[0].x, drawingState.points[0].y);
        for (let i = 1; i < drawingState.points.length; i++) {
          ctx.lineTo(drawingState.points[i].x, drawingState.points[i].y);
        }
        if (drawingState.points.length > 2) {
          ctx.closePath();
          ctx.fill();
        }
        ctx.stroke();
      }
    }
  }, [partZones, selectedZoneId, uvMapImage, drawingState, tool]);

  // Get canvas coordinates from mouse event
  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement> | MouseEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  // Validate zone bounds
  const validateZone = useCallback((uvBounds: Zone['uvBounds']): { valid: boolean; warnings: string[] } => {
    const warnings: string[] = [];
    let valid = true;

    // Check bounds
    if (uvBounds.x < 0 || uvBounds.y < 0 || uvBounds.x + uvBounds.width > 1 || uvBounds.y + uvBounds.height > 1) {
      valid = false;
      warnings.push('Zone outside UV bounds');
    }

    // Check min size (2cm equivalent to ~0.04 in UV space for typical models)
    const minSize = 0.04;
    if (uvBounds.width < minSize || uvBounds.height < minSize) {
      warnings.push('Zone too small for print (min 2cm)');
    }

    // Check if near edge
    const margin = 0.05;
    if (uvBounds.x < margin || uvBounds.y < margin || 
        uvBounds.x + uvBounds.width > 1 - margin || 
        uvBounds.y + uvBounds.height > 1 - margin) {
      warnings.push('Zone near edge — may clip');
    }

    return { valid, warnings };
  }, []);

  // Handle mouse down - start drawing
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return; // Only left mouse button

    const coords = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const canvasSize = canvas.width;
    const normalizedX = coords.x / canvasSize;
    const normalizedY = coords.y / canvasSize;

    if (tool === 'freeform') {
      setDrawingState({
        isDrawing: true,
        startX: coords.x,
        startY: coords.y,
        currentX: coords.x,
        currentY: coords.y,
        points: [{ x: normalizedX, y: normalizedY }],
      });
    } else {
      setDrawingState({
        isDrawing: true,
        startX: coords.x,
        startY: coords.y,
        currentX: coords.x,
        currentY: coords.y,
        points: [],
      });
    }
    isDrawingRef.current = true;
  }, [tool, getCanvasCoords]);

  // Handle mouse move - update drawing
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !drawingState) return;

    const coords = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const canvasSize = canvas.width;
    const normalizedX = coords.x / canvasSize;
    const normalizedY = coords.y / canvasSize;

    if (tool === 'freeform') {
      setDrawingState({
        ...drawingState,
        currentX: coords.x,
        currentY: coords.y,
        points: [...drawingState.points, { x: normalizedX, y: normalizedY }],
      });
    } else {
      setDrawingState({
        ...drawingState,
        currentX: coords.x,
        currentY: coords.y,
      });
    }
  }, [tool, drawingState, getCanvasCoords]);

  // Handle mouse up - finish drawing and create zone
  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !drawingState) {
      isDrawingRef.current = false;
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const canvasSize = canvas.width;
    let uvBounds: Zone['uvBounds'];

    if (tool === 'rectangle' || tool === 'ellipse') {
      const x = Math.min(drawingState.startX, drawingState.currentX) / canvasSize;
      const y = Math.min(drawingState.startY, drawingState.currentY) / canvasSize;
      const w = Math.abs(drawingState.currentX - drawingState.startX) / canvasSize;
      const h = Math.abs(drawingState.currentY - drawingState.startY) / canvasSize;

      // Apply min size constraint
      const minSize = 0.04;
      const finalW = Math.max(w, minSize);
      const finalH = Math.max(h, minSize);

      // Maintain aspect ratio if needed
      let finalWidth = finalW;
      let finalHeight = finalH;
      if (maintainAspectRatio && w > 0 && h > 0) {
        const aspect = w / h;
        if (finalW < finalH * aspect) {
          finalHeight = finalW / aspect;
        } else {
          finalWidth = finalH * aspect;
        }
      }

      uvBounds = {
        x: Math.max(0, Math.min(1 - finalWidth, x)),
        y: Math.max(0, Math.min(1 - finalHeight, y)),
        width: Math.min(finalWidth, 1 - x),
        height: Math.min(finalHeight, 1 - y),
      };
    } else if (tool === 'freeform' && drawingState.points.length > 2) {
      // Calculate bounding box for freeform
      const xs = drawingState.points.map((p) => p.x);
      const ys = drawingState.points.map((p) => p.y);
      const minX = Math.max(0, Math.min(...xs));
      const minY = Math.max(0, Math.min(...ys));
      const maxX = Math.min(1, Math.max(...xs));
      const maxY = Math.min(1, Math.max(...ys));

      uvBounds = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      };
    } else {
      isDrawingRef.current = false;
      setDrawingState(null);
      return;
    }

    // Validate zone
    const validation = validateZone(uvBounds);
    if (!validation.valid && validation.warnings.length > 0) {
      // Still create zone but show warning
      console.warn('Zone validation warnings:', validation.warnings);
    }

    // Estimate size in cm (rough approximation: 1 UV unit ≈ 10cm for typical models)
    const estimatedWidth = uvBounds.width * 10;
    const estimatedHeight = uvBounds.height * 10;

    const newZone: Omit<Zone, 'id'> = {
      partId,
      name: `Zone ${partZones.length + 1}`,
      uvBounds,
      size: {
        width: Math.max(2, Math.min(15, estimatedWidth)),
        height: Math.max(2, Math.min(10, estimatedHeight)),
      },
      position: {
        x: uvBounds.x < 0.33 ? 'left' : uvBounds.x > 0.67 ? 'right' : 'center',
        y: uvBounds.y < 0.33 ? 'top' : uvBounds.y > 0.67 ? 'bottom' : 'center',
      },
      allowedCapabilities: ['print', 'text'],
    };

    addZone(partId, newZone);
    setDrawingState(null);
    isDrawingRef.current = false;
  }, [tool, drawingState, maintainAspectRatio, partId, partZones.length, addZone, validateZone, getCanvasCoords]);

  // Handle double click on freeform to close polygon
  const handleDoubleClick = useCallback(() => {
    if (tool === 'freeform' && drawingState && drawingState.points.length > 2) {
      handleMouseUp({} as React.MouseEvent<HTMLCanvasElement>);
    }
  }, [tool, drawingState, handleMouseUp]);

  const handleAddZone = () => {
    const newZone: Omit<Zone, 'id'> = {
      partId,
      name: `Zone ${partZones.length + 1}`,
      uvBounds: {
        x: 0.2,
        y: 0.2,
        width: 0.3,
        height: 0.3,
      },
      size: {
        width: 5,
        height: 5,
      },
      position: {
        x: 'center',
        y: 'center',
      },
      allowedCapabilities: ['print', 'text'],
    };

    addZone(partId, newZone);
  };

  const handleDeleteZone = (zoneId: string) => {
    removeZone(partId, zoneId);
    if (selectedZoneId === zoneId) {
      setSelectedZoneId(null);
      setShowProperties(false);
    }
  };

  const handleSelectZone = (zoneId: string) => {
    setSelectedZoneId(zoneId);
    setShowProperties(true);
  };

  const handleUpdateZone = (updates: Partial<Zone>) => {
    if (selectedZoneId) {
      updateZone(partId, selectedZoneId, updates);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-charcoal/40 flex items-center justify-center p-6">
      <div className="bg-cream border border-charcoal rounded-[20px] p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-xl">
            ZONE EDITOR — {part?.name || 'Part'} &gt; Print
          </h2>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="border border-charcoal px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-charcoal hover:text-cream transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="border border-charcoal px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest bg-charcoal text-cream hover:bg-charcoal/90 transition-colors"
            >
              Done
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: 3D Preview */}
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] mb-3">3D PREVIEW</div>
            <div className="border border-charcoal rounded-[18px] p-4 bg-cream/70 h-64">
              <Viewport3D onMeshClick={() => {}} onMeshHover={() => {}} />
            </div>
            <div className="mt-3 flex gap-2">
              <button className="border border-charcoal px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-charcoal hover:text-cream transition-colors">
                Orbit
              </button>
              <button className="border border-charcoal px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-charcoal hover:text-cream transition-colors">
                Reset view
              </button>
            </div>
          </div>

          {/* Right: UV Map */}
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] mb-3">UV MAP</div>
            <div className="border border-charcoal rounded-[18px] p-4 bg-cream/70">
              <canvas
                ref={canvasRef}
                className="w-full border border-charcoal/40 rounded-[12px] cursor-crosshair"
                style={{ maxHeight: '400px', touchAction: 'none' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => {
                  isDrawingRef.current = false;
                  setDrawingState(null);
                }}
                onDoubleClick={handleDoubleClick}
              />

              {/* Tools */}
              <div className="mt-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] mb-2">TOOLS</div>
                <div className="flex gap-2">
                  {(['rectangle', 'ellipse', 'freeform', 'polygon'] as DrawingTool[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTool(t)}
                      className={`border border-charcoal px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-widest transition-colors ${
                        tool === t
                          ? 'bg-charcoal text-cream'
                          : 'bg-cream hover:bg-charcoal hover:text-cream'
                      }`}
                    >
                      {t === 'rectangle' && '□ Rectangle'}
                      {t === 'ellipse' && '○ Ellipse'}
                      {t === 'freeform' && '✎ Freeform'}
                      {t === 'polygon' && '⬡ Polygon'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Constraints */}
              <div className="mt-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] mb-2">CONSTRAINTS</div>
                <div className="space-y-2 font-mono text-xs uppercase tracking-widest text-charcoal/70">
                  <div>Min size: 2 × 2 cm</div>
                  <div>Max size: 15 × 10 cm</div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={maintainAspectRatio}
                      onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span>Maintain aspect ratio</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Zones List */}
        <div className="mt-6 border-t border-charcoal/20 pt-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] mb-4">
            ZONES ON THIS PART
          </div>
          <div className="space-y-3">
            {partZones.length === 0 ? (
              <p className="font-mono text-xs uppercase tracking-widest text-charcoal/60">
                No zones defined yet
              </p>
            ) : (
              partZones.map((zone) => (
                <div
                  key={zone.id}
                  className={`border border-charcoal rounded-[12px] p-4 bg-cream/60 ${
                    selectedZoneId === zone.id ? 'ring-2 ring-green-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-serif text-lg mb-1">● Zone: "{zone.name}"</div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60">
                        Size: {zone.size.width} × {zone.size.height} cm | Position: {zone.position.x}{' '}
                        / {zone.position.y}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSelectZone(zone.id)}
                        className="border border-charcoal px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-charcoal hover:text-cream transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteZone(zone.id)}
                        className="border border-charcoal px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-accent hover:text-cream transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
            <button
              onClick={handleAddZone}
              className="border border-charcoal/40 border-dashed px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-charcoal hover:text-cream transition-colors w-full"
            >
              + Add another zone
            </button>
          </div>

          {/* Zone Properties Panel */}
          {showProperties && selectedZone && (
            <div className="mt-6 border-t border-charcoal/20 pt-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] mb-4">
                ZONE PROPERTIES
              </div>
              <div className="border border-charcoal rounded-[12px] p-4 bg-cream/60 space-y-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest mb-2">
                    Name:
                  </label>
                  <input
                    type="text"
                    value={selectedZone.name}
                    onChange={(e) => handleUpdateZone({ name: e.target.value })}
                    className="w-full border border-charcoal rounded-full px-3 py-1 font-mono text-xs uppercase tracking-widest bg-cream"
                  />
                </div>

                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest mb-2">Size</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-widest mb-1">
                        Width: (cm)
                      </label>
                      <input
                        type="number"
                        value={selectedZone.size.width}
                        onChange={(e) =>
                          handleUpdateZone({
                            size: {
                              ...selectedZone.size,
                              width: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        min={2}
                        max={15}
                        className="w-full border border-charcoal rounded-full px-3 py-1 font-mono text-xs uppercase tracking-widest bg-cream"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-widest mb-1">
                        Height: (cm)
                      </label>
                      <input
                        type="number"
                        value={selectedZone.size.height}
                        onChange={(e) =>
                          handleUpdateZone({
                            size: {
                              ...selectedZone.size,
                              height: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        min={2}
                        max={10}
                        className="w-full border border-charcoal rounded-full px-3 py-1 font-mono text-xs uppercase tracking-widest bg-cream"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest mb-2">Position</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-widest mb-1">
                        X:
                      </label>
                      <select
                        value={selectedZone.position.x}
                        onChange={(e) =>
                          handleUpdateZone({
                            position: {
                              ...selectedZone.position,
                              x: e.target.value as 'left' | 'center' | 'right',
                            },
                          })
                        }
                        className="w-full border border-charcoal rounded-full px-3 py-1 font-mono text-xs uppercase tracking-widest bg-cream"
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-widest mb-1">
                        Y:
                      </label>
                      <select
                        value={selectedZone.position.y}
                        onChange={(e) =>
                          handleUpdateZone({
                            position: {
                              ...selectedZone.position,
                              y: e.target.value as 'top' | 'center' | 'bottom',
                            },
                          })
                        }
                        className="w-full border border-charcoal rounded-full px-3 py-1 font-mono text-xs uppercase tracking-widest bg-cream"
                      >
                        <option value="top">Top</option>
                        <option value="center">Center</option>
                        <option value="bottom">Bottom</option>
                      </select>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={selectedZone.allowRepositioning || false}
                      onChange={(e) => handleUpdateZone({ allowRepositioning: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="font-mono text-xs uppercase tracking-widest">
                      Allow customer repositioning
                    </span>
                  </label>
                </div>

                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest mb-2">
                    Capabilities allowed:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(['print', 'text', 'engrave', 'emboss', 'hot-stamp'] as const).map((capType) => (
                      <label key={capType} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedZone.allowedCapabilities.includes(capType)}
                          onChange={(e) => {
                            const newCaps = e.target.checked
                              ? [...selectedZone.allowedCapabilities, capType]
                              : selectedZone.allowedCapabilities.filter((c) => c !== capType);
                            handleUpdateZone({ allowedCapabilities: newCaps });
                          }}
                          className="w-4 h-4"
                        />
                        <span className="font-mono text-xs uppercase tracking-widest">{capType}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteZone(selectedZone.id)}
                  className="border border-charcoal px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-accent hover:text-cream transition-colors w-full"
                >
                  Delete zone
                </button>
              </div>
            </div>
          )}

          {/* Validation */}
          {partZones.length > 0 && (
            <div className="mt-4 border-t border-charcoal/20 pt-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] mb-2">VALIDATION</div>
              <div className="space-y-1">
                {partZones.map((zone) => {
                  const validation = validateZone(zone.uvBounds);
                  return (
                    <div key={zone.id} className="font-mono text-xs uppercase tracking-widest">
                      {validation.valid ? (
                        <div className="text-green-600">✓ {zone.name}: Zone ready for print</div>
                      ) : (
                        <div className="text-red-600">
                          ✗ {zone.name}: {validation.warnings[0] || 'Invalid zone'}
                        </div>
                      )}
                      {validation.warnings.length > 0 && validation.valid && (
                        <div className="text-yellow-600 ml-4">
                          ⚠ {validation.warnings[0]}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ZoneEditor;

