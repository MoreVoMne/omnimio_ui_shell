import React, { useState } from 'react';
import type { CapabilityType } from '../../types/canvas';

const CAPABILITIES: { type: CapabilityType; label: string; description: string }[] = [
  { type: 'material', label: 'Material', description: 'Choose material textures' },
  { type: 'color', label: 'Color', description: 'Select colors' },
  { type: 'finish', label: 'Finish', description: 'Surface finish options' },
  { type: 'part-swap', label: 'Part Swap', description: 'Replace parts with alternatives' },
  { type: 'add-on', label: 'Add-on', description: 'Additional components' },
  { type: 'size', label: 'Size', description: 'Size variations' },
  { type: 'print', label: 'Print', description: 'Custom print areas' },
  { type: 'text', label: 'Text', description: 'Text customization' },
  { type: 'engrave', label: 'Engrave', description: 'Engraving options' },
  { type: 'emboss', label: 'Emboss', description: 'Embossing patterns' },
  { type: 'hot-stamp', label: 'Hot Stamp', description: 'Hot stamping' },
];

interface CapabilityPickerProps {
  partId: string;
  partName: string;
  existingCapabilities: CapabilityType[];
  onSelect: (capabilityType: CapabilityType) => void;
  onClose: () => void;
}

const CapabilityPicker: React.FC<CapabilityPickerProps> = ({
  partId,
  partName,
  existingCapabilities,
  onSelect,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const availableCapabilities = CAPABILITIES.filter(
    (cap) =>
      !existingCapabilities.includes(cap.type) &&
      (searchTerm === '' || cap.label.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelect = (capabilityType: CapabilityType) => {
    onSelect(capabilityType);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-charcoal/40 flex items-center justify-center p-6">
      <div className="bg-cream border border-charcoal rounded-[20px] p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-serif text-xl mb-1">Add Capability</h2>
            <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60">
              {partName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-charcoal flex items-center justify-center hover:bg-charcoal hover:text-cream transition-colors"
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search capabilities..."
            className="w-full border border-charcoal rounded-full px-4 py-2 font-mono text-xs uppercase tracking-widest bg-cream"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {availableCapabilities.length === 0 ? (
            <div className="col-span-2 text-center py-8">
              <p className="font-mono text-xs uppercase tracking-widest text-charcoal/60">
                {searchTerm ? 'No capabilities found' : 'All capabilities already added'}
              </p>
            </div>
          ) : (
            availableCapabilities.map((cap) => (
              <button
                key={cap.type}
                onClick={() => handleSelect(cap.type)}
                className="border border-charcoal rounded-[12px] p-4 text-left hover:bg-charcoal hover:text-cream transition-colors group"
              >
                <div className="font-serif text-lg mb-1">{cap.label}</div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-charcoal/70 group-hover:text-cream/70">
                  {cap.description}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CapabilityPicker;

