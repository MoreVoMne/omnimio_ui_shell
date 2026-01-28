import React, { useState, useEffect } from 'react';
import { useCanvasStore } from '../../stores/canvasStore';

interface ConfigGraphProps {
  onCapabilityClick?: (partId: string, capabilityId: string) => void;
  onAddCapability?: (partId: string) => void;
}

const ConfigGraph: React.FC<ConfigGraphProps> = ({ onCapabilityClick, onAddCapability }) => {
  const { parts, capabilities, selectPart, hoverPart, partGroups } = useCanvasStore();
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

  const formatPrice = (price: number) => {
    if (price === 0) return 'Included';
    return price > 0 ? `+£${price.toFixed(2)}` : `£${price.toFixed(2)}`;
  };

  // Group parts by their groupId
  const groupedPartsMap = new Map<string, typeof parts>();
  const ungroupedParts: typeof parts = [];

  parts.forEach((part) => {
    if (part.groupId) {
      if (!groupedPartsMap.has(part.groupId)) {
        groupedPartsMap.set(part.groupId, []);
      }
      groupedPartsMap.get(part.groupId)!.push(part);
    } else {
      ungroupedParts.push(part);
    }
  });

  // Get all capabilities for a group
  const getGroupCapabilities = (groupPartIds: string[]) => {
    const allCaps: any[] = [];
    groupPartIds.forEach((partId) => {
      const caps = partCapabilities(partId);
      allCaps.push(...caps.map(cap => ({ ...cap, partId })));
    });
    return allCaps;
  };

  // Check if group has capabilities
  const groupHasCapabilities = (groupPartIds: string[]) => {
    return groupPartIds.some(partId => hasCapabilities(partId));
  };

  if (parts.length === 0) {
    return (
      <div className="space-y-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] mb-3">CONFIGURATION GRAPH</div>
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

  const renderCapabilities = (caps: any[], onCapClick: (partId: string, capId: string) => void, onAddCap: (partId: string) => void) => {
    return (
      <div className="ml-6 space-y-2 mt-2">
        {caps.map((cap) => {
          const optionCount = cap.config?.options?.length || 0;
          const zoneCount = cap.config?.zones?.length || 0;
          const pricing = cap.config?.pricing;

          return (
            <div
              key={cap.id}
              className="border-l-2 border-charcoal/20 pl-3 cursor-pointer hover:bg-cream/40 rounded px-2 py-1 relative"
              onClick={() => {
                onCapClick(cap.partId, cap.id);
              }}
            >
              {/* Visual connection line */}
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-charcoal/20"></div>
              
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
                {pricing && pricing.model !== 'none' && (
                  <span className="font-mono text-[10px] uppercase tracking-widest text-green-600">
                    {pricing.model === 'fixed' && pricing.basePrice !== undefined
                      ? formatPrice(pricing.basePrice)
                      : pricing.model}
                  </span>
                )}
              </div>
              
              {/* Show constraints/rules as badges */}
              {cap.config && (
                <div className="ml-6 mt-1 flex flex-wrap gap-1">
                  {cap.config.minResolution && (
                    <span className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60 px-1.5 py-0.5 bg-charcoal/10 rounded">
                      {cap.config.minResolution}DPI
                    </span>
                  )}
                  {cap.config.maxCharacters && (
                    <span className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60 px-1.5 py-0.5 bg-charcoal/10 rounded">
                      Max {cap.config.maxCharacters} chars
                    </span>
                  )}
                  {cap.config.maxFileSize && (
                    <span className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60 px-1.5 py-0.5 bg-charcoal/10 rounded">
                      Max {(cap.config.maxFileSize / 1024 / 1024).toFixed(1)}MB
                    </span>
                  )}
                </div>
              )}
              
              {cap.configured && cap.config?.options && (
                <div className="ml-6 mt-1 space-y-1">
                  {cap.config.options.slice(0, 3).map((opt: any) => (
                    <div
                      key={opt.id}
                      className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60 flex items-center gap-2"
                    >
                      <span className="text-charcoal/40">└─</span>
                      <span>{opt.customerName || opt.name}</span>
                      {opt.price !== undefined && opt.price !== 0 && (
                        <span className="text-green-600">{formatPrice(opt.price)}</span>
                      )}
                      {opt.isDefault && (
                        <span className="text-charcoal/60">(default)</span>
                      )}
                    </div>
                  ))}
                  {cap.config.options.length > 3 && (
                    <div className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60">
                      └─ ... +{cap.config.options.length - 3} more
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {caps.length === 0 && (
          <div className="ml-6 mt-2">
            <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60 mb-2">
              (no capabilities)
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] mb-3">CONFIGURATION GRAPH</div>
      <div className="space-y-2">
        {/* Render groups as single elements */}
        {partGroups.map((group) => {
          const groupParts = groupedPartsMap.get(group.id) || [];
          if (groupParts.length === 0) return null;

          const groupCaps = getGroupCapabilities(groupParts.map(p => p.id));
          const isExpanded = expandedParts.has(group.id);
          const hasCaps = groupHasCapabilities(groupParts.map(p => p.id));

          return (
            <div key={group.id} className="border border-charcoal/40 rounded-[12px] p-3 bg-charcoal/5">
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => toggleExpand(group.id)}
                  className="font-mono text-xs"
                  disabled={!hasCaps}
                >
                  {isExpanded ? '▼' : '▶'}
                </button>
                <button
                  onClick={() => {
                    // Select first part in group
                    if (groupParts.length > 0) {
                      selectPart(groupParts[0].id);
                    }
                  }}
                  onMouseEnter={() => {
                    // Hover all parts in group
                    groupParts.forEach(p => hoverPart(p.id));
                  }}
                  onMouseLeave={() => hoverPart(null)}
                  className="flex-1 text-left font-serif text-base"
                >
                  {group.name}
                </button>
                <span className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60 px-2 py-1 bg-charcoal/10 rounded">
                  {groupParts.length} part{groupParts.length !== 1 ? 's' : ''}
                </span>
                <span className={hasCaps ? 'text-green-600' : 'text-charcoal/40'}>
                  {hasCaps ? '●' : '○'}
                </span>
              </div>

              {/* Show parts in group */}
              <div className="ml-6 mb-2 space-y-1">
                {groupParts.map((part) => (
                  <div key={part.id} className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60">
                    └─ {part.name}
                  </div>
                ))}
              </div>

              {isExpanded && hasCaps && renderCapabilities(
                groupCaps,
                (partId, capId) => onCapabilityClick?.(partId, capId),
                (partId) => onAddCapability?.(partId)
              )}

              {!hasCaps && (
                <div className="ml-6 mt-2">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60 mb-2">
                    (no capabilities)
                  </p>
                  {groupParts.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddCapability?.(groupParts[0].id);
                      }}
                      className="font-mono text-[10px] uppercase tracking-widest underline underline-offset-4 hover:text-accent"
                    >
                      + Add capability
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Render ungrouped parts */}
        {ungroupedParts.map((part) => {
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

              {isExpanded && hasCaps && renderCapabilities(
                partCaps.map(cap => ({ ...cap, partId: part.id })),
                (partId, capId) => onCapabilityClick?.(partId, capId),
                (partId) => onAddCapability?.(partId)
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

export default ConfigGraph;

