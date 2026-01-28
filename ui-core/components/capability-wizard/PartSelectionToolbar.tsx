/**
 * PartSelectionToolbar - Controls for 3D part selection mode
 * Displays when user is selecting parts on the 3D model
 */

import React from 'react';
import { X, CheckSquare, Square, Repeat } from 'lucide-react';

interface PartSelectionToolbarProps {
  selectedCount: number;
  totalCount: number;
  onClear: () => void;
  onSelectAll: () => void;
  onInvert: () => void;
  onDone: () => void;
}

const PartSelectionToolbar: React.FC<PartSelectionToolbarProps> = ({
  selectedCount,
  totalCount,
  onClear,
  onSelectAll,
  onInvert,
  onDone,
}) => {
  return (
    <div className="flex items-center justify-between w-full">
      {/* Left: Selection Count */}
      <div className="flex items-center gap-4">
        <div className="font-mono text-sm">
          Selected: <span className="font-semibold">{selectedCount}</span> of {totalCount}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClear}
            disabled={selectedCount === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-sm font-mono text-[9px] uppercase tracking-widest transition-colors ${
              selectedCount === 0
                ? 'border-charcoal/20 text-charcoal/30 cursor-not-allowed'
                : 'border-charcoal/30 text-charcoal/60 hover:border-charcoal hover:bg-white'
            }`}
            title="Clear selection"
          >
            <X size={12} />
            Clear
          </button>

          <button
            onClick={onSelectAll}
            disabled={selectedCount === totalCount}
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-sm font-mono text-[9px] uppercase tracking-widest transition-colors ${
              selectedCount === totalCount
                ? 'border-charcoal/20 text-charcoal/30 cursor-not-allowed'
                : 'border-charcoal/30 text-charcoal/60 hover:border-charcoal hover:bg-white'
            }`}
            title="Select all"
          >
            <CheckSquare size={12} />
            All
          </button>

          <button
            onClick={onInvert}
            disabled={totalCount === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-charcoal/30 rounded-sm font-mono text-[9px] uppercase tracking-widest text-charcoal/60 hover:border-charcoal hover:bg-white transition-colors"
            title="Invert selection"
          >
            <Repeat size={12} />
            Invert
          </button>
        </div>
      </div>

      {/* Right: Done Button */}
      <button
        onClick={onDone}
        className="bg-charcoal text-cream font-mono text-[10px] uppercase tracking-widest py-3 px-8 hover:bg-charcoal/90 transition-colors"
      >
        Done
      </button>
    </div>
  );
};

export default PartSelectionToolbar;
