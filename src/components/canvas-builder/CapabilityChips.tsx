import React from 'react';
import type { CapabilityType } from '../../types/canvas';

interface CapabilityChipsProps {
  onDragStart: (capabilityType: CapabilityType) => void;
  onToggle: (capabilityType: CapabilityType) => void;
  onExpand: (capabilityType: CapabilityType) => void;
  selectedCapabilityTypes?: Set<CapabilityType>;
  addedCapabilityTypes?: Set<CapabilityType>;
  expandedCapabilityType?: CapabilityType | null;
}

const CAPABILITIES: { type: CapabilityType; label: string; description: string }[] = [
  { 
    type: 'material', 
    label: 'Material', 
    description: 'Choose material texture (leather, fabric, etc.)' 
  },
  { 
    type: 'color', 
    label: 'Color', 
    description: 'Select color options for this part' 
  },
  { 
    type: 'finish', 
    label: 'Finish', 
    description: 'Choose surface finish (matte, glossy, etc.)' 
  },
  { 
    type: 'part-swap', 
    label: 'Part Swap', 
    description: 'Allow customers to swap this part with alternatives' 
  },
  { 
    type: 'add-on', 
    label: 'Add-on', 
    description: 'Add optional accessories to this part' 
  },
  { 
    type: 'size', 
    label: 'Size', 
    description: 'Configure product size options' 
  },
  { 
    type: 'shape', 
    label: 'Shape', 
    description: 'Offer different shape variations (round, square, oval, etc.)' 
  },
  { 
    type: 'print', 
    label: 'Print', 
    description: 'Add printable images/logos to this part' 
  },
  { 
    type: 'text', 
    label: 'Text', 
    description: 'Allow customers to add custom text or monograms' 
  },
  { 
    type: 'engrave', 
    label: 'Engrave', 
    description: 'Add engraved text or patterns' 
  },
  { 
    type: 'emboss', 
    label: 'Emboss', 
    description: 'Add raised text or patterns' 
  },
  { 
    type: 'hot-stamp', 
    label: 'Hot Stamp', 
    description: 'Add hot-stamped designs or text' 
  },
];

const CapabilityChips: React.FC<CapabilityChipsProps> = ({
  onDragStart,
  onToggle,
  onExpand,
  selectedCapabilityTypes,
  addedCapabilityTypes,
  expandedCapabilityType,
}) => {
  const handleDragStart = (e: React.DragEvent, capabilityType: CapabilityType) => {
    e.dataTransfer.setData('capability-type', capabilityType);
    e.dataTransfer.effectAllowed = 'move';
    onDragStart(capabilityType);
  };

  // Filter to only show selected capabilities
  const displayedCapabilities = selectedCapabilityTypes 
    ? CAPABILITIES.filter((cap) => selectedCapabilityTypes.has(cap.type))
    : [];

  // Don't render if no capabilities are selected
  if (!selectedCapabilityTypes || selectedCapabilityTypes.size === 0) {
    return null;
  }

  return (
    <div className="border border-charcoal rounded-[18px] p-4 bg-cream">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] mb-3">
        CAPABILITIES (drag or click to add/open)
      </div>
      <div className="flex flex-wrap gap-2">
        {displayedCapabilities.map((cap) => {
          const isSelected = addedCapabilityTypes?.has(cap.type) ?? false;
          const isExpanded = expandedCapabilityType === cap.type;

          return (
            <button
              key={cap.type}
              type="button"
              draggable
              onDragStart={(e) => handleDragStart(e, cap.type)}
              onClick={() => {
                if (!isSelected) {
                  onToggle(cap.type);
                } else if (!isExpanded) {
                  onExpand(cap.type);
                }
              }}
              className={`border border-charcoal px-3 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest bg-cream hover:bg-charcoal hover:text-cream transition-colors cursor-move active:scale-105 group relative ${
                isExpanded ? 'bg-charcoal text-cream' : ''
              } ${isSelected ? 'ring-1 ring-charcoal/20' : ''}`}
              title={cap.description}
            >
              {cap.label}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-charcoal text-cream text-xs font-sans normal-case tracking-normal rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
                {cap.description}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-charcoal"></div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CapabilityChips;

