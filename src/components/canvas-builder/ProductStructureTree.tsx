import React, { useState, useEffect } from 'react';
import { useCanvasStore } from '../../stores/canvasStore';

interface ProductStructureTreeProps {
  onCapabilityClick?: (partId: string, capabilityId: string) => void;
  onAddCapability?: (partId: string) => void;
}

const ProductStructureTree: React.FC<ProductStructureTreeProps> = ({ onCapabilityClick, onAddCapability }) => {
  const { parts, capabilities, selectPart, hoverPart } = useCanvasStore();
  const [expandedParts, setExpandedParts] = useState<Set<string>>(new Set());
  
  // Convert Map to array for reactivity tracking
  const capabilitiesArray = Array.from(capabilities.entries());

  // Auto-expand parts when they get capabilities
  useEffect(() => {
    const newExpanded = new Set(expandedParts);
    let changed = false;
    
    parts.forEach((part) => {
      const partCaps = capabilities.get(part.id) || [];
      if (partCaps.length > 0 && !newExpanded.has(part.id)) {
        newExpanded.add(part.id);
        changed = true;
      }
    });
    
    if (changed) {
      setExpandedParts(newExpanded);
    }
  }, [capabilitiesArray, parts]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleExpand = (partId: string) => {
    setExpandedParts((prev) => {
      const next = new Set(prev);
      if (next.has(partId)) {
        next.delete(partId);
      } else {
        next.add(partId);
      }
      return next;
    });
  };

  const partCapabilities = (partId: string) => {
    return capabilities.get(partId) || [];
  };

  const hasCapabilities = (partId: string) => {
    return partCapabilities(partId).length > 0;
  };

  if (parts.length === 0) {
    return (
      <div className="space-y-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] mb-3">PRODUCT STRUCTURE</div>
        <div className="border border-charcoal/20 rounded-[12px] p-4 bg-cream/60 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-charcoal/70">
            Click on 3D model to name parts
          </p>
          <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-charcoal/60">
            ◯ No parts defined yet
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] mb-3">PRODUCT STRUCTURE</div>
      <div className="space-y-2">
        {parts.map((part) => {
          const partCaps = partCapabilities(part.id);
          const isExpanded = expandedParts.has(part.id);
          const hasCaps = hasCapabilities(part.id);

          return (
            <div key={part.id} className="border border-charcoal/20 rounded-[12px] p-3 bg-cream/60">
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => toggleExpand(part.id)}
                  className="font-mono text-xs"
                  disabled={!hasCaps}
                >
                  {isExpanded ? '▼' : '▶'}
                </button>
                <button
                  onClick={() => selectPart(part.id)}
                  onMouseEnter={() => hoverPart(part.id)}
                  onMouseLeave={() => hoverPart(null)}
                  className="flex-1 text-left font-serif text-base"
                >
                  {part.name}
                </button>
                <span className={hasCaps ? 'text-green-600' : 'text-charcoal/40'}>
                  {hasCaps ? '●' : '○'}
                </span>
              </div>

              {isExpanded && hasCaps && (
                <div className="ml-6 space-y-2 mt-2">
                  {partCaps.map((cap) => {
                    const optionCount = cap.config?.options?.length || 0;
                    const zoneCount = cap.config?.zones?.length || 0;

                    return (
                      <div
                        key={cap.id}
                        className="border-l-2 border-charcoal/20 pl-3 cursor-pointer hover:bg-cream/40 rounded px-2 py-1"
                        onClick={() => {
                          onCapabilityClick?.(part.id, cap.id);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className={cap.configured ? 'text-green-600' : 'text-charcoal/40'}>
                            {cap.configured ? '✓' : '○'}
                          </span>
                          <span className="font-mono text-xs uppercase tracking-widest text-charcoal/70">
                            {cap.type}
                          </span>
                          {cap.configured && (
                            <span className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60">
                              {optionCount > 0 ? `[${optionCount} opts]` : zoneCount > 0 ? `[${zoneCount} zone]` : ''}
                            </span>
                          )}
                        </div>
                        {cap.configured && cap.config?.options && (
                          <div className="ml-6 mt-1 space-y-1">
                            {cap.config.options.slice(0, 3).map((opt: any) => (
                              <div
                                key={opt.id}
                                className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60"
                              >
                                └─ {opt.customerName || opt.name}{' '}
                                {opt.price !== undefined && opt.price !== 0
                                  ? `+£${opt.price}`
                                  : ''}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddCapability?.(part.id);
                    }}
                    className="ml-6 mt-2 font-mono text-[10px] uppercase tracking-widest underline underline-offset-4 hover:text-accent"
                  >
                    + Add capability
                  </button>
                </div>
              )}

              {!hasCaps && (
                <div className="ml-6 mt-2">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60 mb-2">
                    (no capabilities)
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddCapability?.(part.id);
                    }}
                    className="font-mono text-[10px] uppercase tracking-widest underline underline-offset-4 hover:text-accent"
                  >
                    + Add capability
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductStructureTree;

