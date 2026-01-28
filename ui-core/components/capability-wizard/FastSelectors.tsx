/**
 * FastSelectors - Quick selection tools for products with many parts
 * Solves the "68-part problem" by allowing selection by material, similar meshes, etc.
 */

import React, { useState, useMemo } from 'react';
import { Search, Layers, Sparkles, Eye, EyeOff } from 'lucide-react';
import type { PartIdentity } from '../../types-capability-wizard';

interface FastSelectorsProps {
  parts: PartIdentity[];
  selectedPartIds: Set<string>;
  onSelectionChange: (partIds: Set<string>) => void;
  onVisibilityToggle?: () => void;
  showOnlySelected?: boolean;
}

const FastSelectors: React.FC<FastSelectorsProps> = ({
  parts,
  selectedPartIds,
  onSelectionChange,
  onVisibilityToggle,
  showOnlySelected = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>('material');

  // Group parts by material index
  const partsByMaterial = useMemo(() => {
    const groups = new Map<number, PartIdentity[]>();
    parts.forEach((part) => {
      const matIndex = part.materialIndex ?? -1;
      if (!groups.has(matIndex)) {
        groups.set(matIndex, []);
      }
      groups.get(matIndex)!.push(part);
    });
    return groups;
  }, [parts]);

  // Get unique mesh name patterns (e.g., "sleeve" from "sleeve_L_03")
  const meshNamePatterns = useMemo(() => {
    const patterns = new Map<string, PartIdentity[]>();
    parts.forEach((part) => {
      if (part.meshName) {
        // Extract base pattern (remove numbers and common suffixes)
        const pattern = part.meshName
          .toLowerCase()
          .replace(/_[lr](?:_|$)/gi, '_') // Remove _L, _R
          .replace(/_\d+/g, '') // Remove _01, _02, etc.
          .replace(/[._-]+$/, ''); // Remove trailing separators

        if (!patterns.has(pattern)) {
          patterns.set(pattern, []);
        }
        patterns.get(pattern)!.push(part);
      }
    });
    // Only keep patterns with multiple parts
    return new Map(
      Array.from(patterns.entries()).filter(([, items]) => items.length > 1)
    );
  }, [parts]);

  // Get largest surfaces by area
  const largestParts = useMemo(() => {
    return [...parts]
      .filter((p) => p.area !== undefined)
      .sort((a, b) => (b.area || 0) - (a.area || 0))
      .slice(0, Math.min(10, Math.ceil(parts.length * 0.2))); // Top 20% or 10 parts
  }, [parts]);

  // Filter parts by search query
  const filteredParts = useMemo(() => {
    if (!searchQuery.trim()) return parts;
    const query = searchQuery.toLowerCase();
    return parts.filter(
      (part) =>
        part.label.toLowerCase().includes(query) ||
        part.meshName?.toLowerCase().includes(query)
    );
  }, [parts, searchQuery]);

  // Select parts by material
  const selectByMaterial = (materialIndex: number) => {
    const materialParts = partsByMaterial.get(materialIndex) || [];
    const newSelection = new Set(selectedPartIds);
    materialParts.forEach((part) => newSelection.add(part.id));
    onSelectionChange(newSelection);
  };

  // Select parts by pattern
  const selectByPattern = (pattern: string) => {
    const patternParts = meshNamePatterns.get(pattern) || [];
    const newSelection = new Set(selectedPartIds);
    patternParts.forEach((part) => newSelection.add(part.id));
    onSelectionChange(newSelection);
  };

  // Select largest parts
  const selectLargest = () => {
    const newSelection = new Set(selectedPartIds);
    largestParts.forEach((part) => newSelection.add(part.id));
    onSelectionChange(newSelection);
  };

  return (
    <div className="space-y-4">
      {/* Search by object name */}
      <div className="border border-charcoal/20 rounded-sm bg-white p-4">
        <div className="flex items-center gap-2 mb-3">
          <Search size={14} className="text-charcoal/60" />
          <span className="font-mono text-[9px] uppercase tracking-widest text-charcoal/60">
            Search parts
          </span>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Type part name or mesh name..."
          className="w-full border border-charcoal/20 px-3 py-2 font-mono text-sm focus:border-charcoal focus:outline-none bg-transparent"
        />
        {filteredParts.length > 0 && searchQuery && (
          <div className="mt-3 max-h-40 overflow-y-auto space-y-1">
            {filteredParts.slice(0, 20).map((part) => (
              <button
                key={part.id}
                onClick={() => {
                  const newSelection = new Set(selectedPartIds);
                  if (newSelection.has(part.id)) {
                    newSelection.delete(part.id);
                  } else {
                    newSelection.add(part.id);
                  }
                  onSelectionChange(newSelection);
                }}
                className={`w-full text-left px-3 py-2 rounded-sm font-mono text-xs transition-colors ${
                  selectedPartIds.has(part.id)
                    ? 'bg-charcoal text-cream'
                    : 'hover:bg-charcoal/5'
                }`}
              >
                <div>{part.label}</div>
                {part.meshName && (
                  <div className="text-[10px] opacity-60">{part.meshName}</div>
                )}
              </button>
            ))}
            {filteredParts.length > 20 && (
              <div className="px-3 py-2 font-mono text-[10px] text-charcoal/40">
                +{filteredParts.length - 20} more...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Select by Material */}
      {partsByMaterial.size > 1 && (
        <div className="border border-charcoal/20 rounded-sm bg-white">
          <button
            onClick={() =>
              setExpandedSection(expandedSection === 'material' ? null : 'material')
            }
            className="w-full flex items-center justify-between p-4 hover:bg-charcoal/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-charcoal/60" />
              <span className="font-mono text-[9px] uppercase tracking-widest text-charcoal/60">
                Select by Material
              </span>
            </div>
            <span className="font-mono text-xs text-charcoal/40">
              {partsByMaterial.size} materials
            </span>
          </button>
          {expandedSection === 'material' && (
            <div className="border-t border-charcoal/10 p-4 space-y-2">
              {Array.from(partsByMaterial.entries()).map(([matIndex, materialParts]) => (
                <button
                  key={matIndex}
                  onClick={() => selectByMaterial(matIndex)}
                  className="w-full flex items-center justify-between px-3 py-2 border border-charcoal/20 rounded-sm hover:border-charcoal hover:bg-charcoal/5 transition-colors"
                >
                  <span className="font-mono text-sm">
                    Material {matIndex >= 0 ? matIndex + 1 : 'None'}
                  </span>
                  <span className="font-mono text-[10px] text-charcoal/60">
                    {materialParts.length} parts
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Select by Similar Pattern */}
      {meshNamePatterns.size > 0 && (
        <div className="border border-charcoal/20 rounded-sm bg-white">
          <button
            onClick={() =>
              setExpandedSection(expandedSection === 'pattern' ? null : 'pattern')
            }
            className="w-full flex items-center justify-between p-4 hover:bg-charcoal/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-charcoal/60" />
              <span className="font-mono text-[9px] uppercase tracking-widest text-charcoal/60">
                Select Similar Parts
              </span>
            </div>
            <span className="font-mono text-xs text-charcoal/40">
              {meshNamePatterns.size} patterns
            </span>
          </button>
          {expandedSection === 'pattern' && (
            <div className="border-t border-charcoal/10 p-4 space-y-2">
              {Array.from(meshNamePatterns.entries()).map(([pattern, patternParts]) => (
                <button
                  key={pattern}
                  onClick={() => selectByPattern(pattern)}
                  className="w-full flex items-center justify-between px-3 py-2 border border-charcoal/20 rounded-sm hover:border-charcoal hover:bg-charcoal/5 transition-colors"
                >
                  <span className="font-mono text-sm capitalize">
                    {pattern.replace(/_/g, ' ')}
                  </span>
                  <span className="font-mono text-[10px] text-charcoal/60">
                    {patternParts.length} parts
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Select Largest Surfaces */}
      {largestParts.length > 0 && (
        <button
          onClick={selectLargest}
          className="w-full border border-charcoal/20 rounded-sm bg-white p-4 hover:border-charcoal hover:bg-charcoal/5 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-charcoal/60" />
              <span className="font-mono text-[9px] uppercase tracking-widest text-charcoal/60">
                Select Largest Surfaces
              </span>
            </div>
            <span className="font-mono text-xs text-charcoal/40">
              {largestParts.length} parts
            </span>
          </div>
        </button>
      )}

      {/* Visibility Toggle */}
      {onVisibilityToggle && (
        <button
          onClick={onVisibilityToggle}
          className="w-full border border-charcoal/20 rounded-sm bg-white p-4 hover:border-charcoal hover:bg-charcoal/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            {showOnlySelected ? (
              <Eye size={14} className="text-charcoal/60" />
            ) : (
              <EyeOff size={14} className="text-charcoal/60" />
            )}
            <span className="font-mono text-[9px] uppercase tracking-widest text-charcoal/60">
              {showOnlySelected ? 'Show All Parts' : 'Show Only Selected'}
            </span>
          </div>
        </button>
      )}
    </div>
  );
};

export default FastSelectors;
