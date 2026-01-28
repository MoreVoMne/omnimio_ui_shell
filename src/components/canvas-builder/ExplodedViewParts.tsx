import React, { useState, useRef, useEffect } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCanvasStore } from '../../stores/canvasStore';
import type { Part } from '../../types/parts';

interface ExplodedViewPartsProps {
  onPartClick?: (partId: string) => void;
  onMeshClick?: (meshIndex: number, meshName: string) => void;
  onPartSelect?: (partIds: Set<string>) => void;
  selectedPartIds?: Set<string>;
  onDrop?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
}

// Component for individual part list item with inline editing
const PartListItem: React.FC<{
  index: number;
  name: string;
  part: Part | undefined;
  isSelected: boolean;
  onToggle: (partId: string) => void;
  onMeshClick?: (meshIndex: number, meshName: string) => void;
  onPartClick?: (partId: string) => void;
}> = ({ index, name, part, isSelected, onToggle, onMeshClick, onPartClick }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(part?.name || name);
  const { updatePart, selectPart } = useCanvasStore();

  // Update editName when part name changes
  useEffect(() => {
    if (part?.name) {
      setEditName(part.name);
    }
  }, [part?.name]);

  const handleNameSave = () => {
    if (editName.trim() && editName.trim() !== (part?.name || name)) {
      if (part) {
        // Update existing part
        updatePart(part.id, { name: editName.trim() });
      } else {
        // Create new part
        onMeshClick?.(index, editName.trim());
      }
    } else {
      // Reset to original if unchanged
      setEditName(part?.name || name);
    }
    setIsEditing(false);
  };

  const handleRowClick = () => {
    if (part) {
      selectPart(part.id);
      onPartClick?.(part.id);
    }
  };

  return (
    <div
      className={`flex items-center gap-2 p-2 rounded hover:bg-charcoal/5 transition-colors cursor-pointer ${
        isSelected ? 'bg-charcoal/10' : ''
      }`}
      onClick={handleRowClick}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={(e) => {
          e.stopPropagation();
          if (part) {
            onToggle(part.id);
          }
        }}
        disabled={!part}
        className="w-4 h-4 border border-charcoal rounded disabled:opacity-40 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      />
      {isEditing ? (
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleNameSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleNameSave();
            } else if (e.key === 'Escape') {
              setEditName(part?.name || name);
              setIsEditing(false);
            }
          }}
          className="flex-1 border border-charcoal rounded px-2 py-1 font-mono text-[10px] uppercase tracking-widest bg-cream"
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          className="font-mono text-[10px] uppercase tracking-widest flex-1 truncate cursor-text"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          title={part ? part.name : `${name} (unnamed)`}
        >
          {part ? part.name : (
            <span className="text-charcoal/60">{name}</span>
          )}
        </span>
      )}
      {part?.groupId && (
        <span className="font-mono text-[8px] uppercase tracking-widest text-charcoal/60 px-2 py-0.5 bg-charcoal/10 rounded">
          Group
        </span>
      )}
    </div>
  );
};

// Main component
const ExplodedViewParts: React.FC<ExplodedViewPartsProps> = ({
  onPartClick,
  onMeshClick,
  onPartSelect,
  selectedPartIds: externalSelectedPartIds,
  onDrop,
  onDragOver,
}) => {
  const { parts, assets, partGroups, groupParts, ungroupPart } = useCanvasStore();
  const [internalSelectedPartIds, setInternalSelectedPartIds] = useState<Set<string>>(new Set());
  const [allMeshIndices, setAllMeshIndices] = useState<Array<{ index: number; name: string }>>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'named' | 'unnamed' | 'grouped'>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const selectedPartIds = externalSelectedPartIds || internalSelectedPartIds;

  // Load model to get all mesh indices
  useEffect(() => {
    const modelAsset = assets.models[0];
    const modelUrl = modelAsset?.url;
    if (!modelUrl) {
      setAllMeshIndices([]);
      return;
    }

    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        const meshes: Array<{ index: number; name: string }> = [];
        let index = 0;
        gltf.scene.traverse((child) => {
          if ((child as any).isMesh) {
            meshes.push({
              index,
              name: child.name || `Mesh_${index}`,
            });
            index++;
          }
        });
        setAllMeshIndices(meshes);
      },
      undefined,
      (error) => {
        console.error('Error loading model for mesh list:', error);
        setAllMeshIndices([]);
      }
    );
  }, [assets.models]);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Filter meshes based on filterMode
  const filteredMeshes = allMeshIndices.filter(({ index }) => {
    const hasPart = parts.some(p => p.meshIndex === index);
    if (filterMode === 'named') return hasPart;
    if (filterMode === 'unnamed') return !hasPart;
    if (filterMode === 'grouped') {
      const part = parts.find(p => p.meshIndex === index);
      return part?.groupId !== undefined;
    }
    return true; // 'all'
  });

  // Organize parts into groups and ungrouped
  const groupedParts = partGroups.map(group => ({
    group,
    parts: parts.filter(p => p.groupId === group.id && filteredMeshes.some(m => m.index === p.meshIndex))
  })).filter(g => g.parts.length > 0);

  const ungroupedParts = parts.filter(p => 
    !p.groupId && filteredMeshes.some(m => m.index === p.meshIndex)
  );

  const ungroupedMeshes = filteredMeshes.filter(({ index }) => {
    const part = parts.find(p => p.meshIndex === index);
    return !part || !part.groupId;
  });

  // Get filtered part IDs (only parts that match current filter)
  const filteredPartIds = new Set(
    parts
      .filter(p => {
        const mesh = filteredMeshes.find(m => m.index === p.meshIndex);
        return !!mesh;
      })
      .map(p => p.id)
  );
  
  const isAllSelected = filteredPartIds.size > 0 && 
    selectedPartIds.size === filteredPartIds.size && 
    Array.from(filteredPartIds).every(id => selectedPartIds.has(id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      const empty = new Set<string>();
      if (externalSelectedPartIds === undefined) {
        setInternalSelectedPartIds(empty);
      }
      onPartSelect?.(empty);
    } else {
      if (externalSelectedPartIds === undefined) {
        setInternalSelectedPartIds(filteredPartIds);
      }
      onPartSelect?.(filteredPartIds);
    }
  };

  const handlePartToggle = (partId: string) => {
    const newSelected = new Set(selectedPartIds);
    if (newSelected.has(partId)) {
      newSelected.delete(partId);
    } else {
      newSelected.add(partId);
    }
    
    if (externalSelectedPartIds === undefined) {
      setInternalSelectedPartIds(newSelected);
    }
    onPartSelect?.(newSelected);
  };

  const selectedPartsInGroup = Array.from(selectedPartIds).filter(id => {
    const part = parts.find(p => p.id === id);
    return part?.groupId;
  });
  const isAllSelectedInGroup = selectedPartIds.size > 0 && selectedPartsInGroup.length === selectedPartIds.size;

  const handleToggleGroup = () => {
    if (selectedPartIds.size === 0) {
      return;
    }
    
    if (isAllSelectedInGroup) {
      // Ungroup
      selectedPartIds.forEach((partId) => {
        const part = parts.find((p) => p.id === partId);
        if (part?.groupId) {
          ungroupPart(partId);
        }
      });
      const empty = new Set<string>();
      if (externalSelectedPartIds === undefined) {
        setInternalSelectedPartIds(empty);
      }
      onPartSelect?.(empty);
    } else {
      // Group
      const groupName = prompt('Enter group name:');
      if (groupName && groupName.trim()) {
        groupParts(Array.from(selectedPartIds), groupName.trim());
        const empty = new Set<string>();
        if (externalSelectedPartIds === undefined) {
          setInternalSelectedPartIds(empty);
        }
        onPartSelect?.(empty);
      }
    }
  };

  const handlePartClick = (partId: string) => {
    handlePartToggle(partId);
    onPartClick?.(partId);
  };

  if (!assets.models.length) {
    return (
      <div className="w-full h-full border border-charcoal rounded-[18px] bg-cream/70 flex items-center justify-center">
        <div className="text-center">
          <p className="font-serif text-xl mb-2">No 3D model loaded</p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60">
            Upload a model first
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media (max-width: 1023px) {
          .parts-scrollable::-webkit-scrollbar {
            display: none;
          }
        }
      `}</style>
      <div 
        className="w-full h-full min-h-0 flex flex-col border-0 lg:border lg:border-charcoal lg:rounded-[18px] lg:bg-cream/70 overflow-hidden"
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
      {/* Fixed Header */}
      <div className="flex-shrink-0 pb-2 border-b border-charcoal/60 bg-cream overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="hidden lg:block font-mono text-[10px] uppercase tracking-[0.3em]">
            PARTS ({parts.length}/{allMeshIndices.length})
          </div>
        </div>
        
        {/* Action Buttons, Help Tooltip, and Filter */}
        <div className="flex flex-row gap-2 items-center justify-between">
          {/* Action Buttons - Left */}
          <div className="flex gap-1 items-center">
            <button
              onClick={handleToggleSelectAll}
              className="px-3 py-2 border border-charcoal bg-cream text-charcoal hover:border-charcoal font-mono text-[9px] uppercase tracking-widest transition-all whitespace-nowrap"
            >
              {isAllSelected ? 'Deselect All' : 'Select All'}
            </button>
            <button
              onClick={handleToggleGroup}
              disabled={selectedPartIds.size === 0}
              className="px-3 py-2 border border-charcoal bg-cream text-charcoal hover:border-charcoal disabled:opacity-30 disabled:cursor-not-allowed font-mono text-[9px] uppercase tracking-widest transition-all whitespace-nowrap"
            >
              {isAllSelectedInGroup ? 'Ungroup' : 'Group'}
            </button>
            
            {/* Help Tooltip / Modal */}
            <div className="relative">
              <button
                onClick={() => {
                  if (isMobile) {
                    setShowHelpModal(true);
                  } else {
                    setShowTooltip(!showTooltip);
                  }
                }}
                onMouseEnter={() => {
                  if (!isMobile) {
                    setShowTooltip(true);
                  }
                }}
                onMouseLeave={() => {
                  if (!isMobile) {
                    setShowTooltip(false);
                  }
                }}
                className="p-2 text-charcoal hover:text-charcoal/70 transition-all flex items-center justify-center"
              >
                <HelpCircle size={14} />
              </button>

              {/* Desktop Tooltip */}
              {!isMobile && (
                <AnimatePresence>
                  {showTooltip && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute top-full left-0 mt-2 bg-cream border border-charcoal shadow-xl z-30 min-w-[280px] max-w-[320px] p-3"
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                    >
                      <p className="text-[10px] text-charcoal leading-relaxed">
                        <strong>Combine parts customized together</strong> (e.g., "Fittings")
                        <br />
                        <br />
                        <strong>Mark swappable/optional parts</strong> (can do later)
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>
          
          {/* Filter Dropdown - Right */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`h-full px-3 py-2 border ${
                showFilterDropdown
                  ? 'bg-charcoal text-cream border-charcoal'
                  : 'bg-cream border-charcoal text-charcoal hover:border-charcoal'
              } font-mono text-[9px] uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap min-w-[100px] justify-between`}
            >
              <span>
                {filterMode === 'all' ? 'All' : filterMode === 'named' ? 'Named' : filterMode === 'unnamed' ? 'Unnamed' : 'Grouped'}
              </span>
              <ChevronDown size={10} className={`transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showFilterDropdown && (
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 10, opacity: 0 }}
                  className="absolute top-full right-0 mt-2 bg-cream border border-charcoal shadow-xl z-30 min-w-[140px]"
                >
                  {(['all', 'named', 'unnamed', 'grouped'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setFilterMode(mode);
                        setShowFilterDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 font-mono text-[9px] uppercase tracking-widest hover:bg-charcoal hover:text-cream transition-colors border-b last:border-0 border-charcoal/10 flex justify-between"
                    >
                      {mode === 'all' ? 'All' : mode === 'named' ? 'Named' : mode === 'unnamed' ? 'Unnamed' : 'Grouped'}
                      {filterMode === mode && <span className="text-accent">●</span>}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Scrollable Parts List */}
      <div 
        className="flex-1 min-h-0 overflow-y-auto p-4 scroll-smooth parts-scrollable"
        style={{
          scrollbarWidth: 'none', /* Firefox */
          msOverflowStyle: 'none', /* IE and Edge */
        }}
      >
        <div className="space-y-2">
          {/* Grouped Parts */}
          {groupedParts.map(({ group, parts: groupParts }) => (
            <div
              key={group.id}
              className="border border-charcoal/40 rounded-[12px] p-2 bg-charcoal/5"
            >
              <div className="font-mono text-[9px] uppercase tracking-widest text-charcoal/70 mb-1.5 px-1">
                {group.name} ({groupParts.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
                {groupParts.map((part) => {
                  const mesh = filteredMeshes.find(m => m.index === part.meshIndex);
                  if (!mesh) return null;
                  const isSelected = selectedPartIds.has(part.id);
                  return (
                    <PartListItem
                      key={`part-${part.id}`}
                      index={part.meshIndex}
                      name={part.name}
                      part={part}
                      isSelected={isSelected}
                      onToggle={handlePartToggle}
                      onMeshClick={onMeshClick}
                      onPartClick={handlePartClick}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {/* Ungrouped Parts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
            {ungroupedMeshes.map(({ index, name }) => {
              const part = parts.find((p) => p.meshIndex === index);
              const isSelected = part ? selectedPartIds.has(part.id) : false;
              return (
                <PartListItem
                  key={`mesh-${index}`}
                  index={index}
                  name={name}
                  part={part}
                  isSelected={isSelected}
                  onToggle={handlePartToggle}
                  onMeshClick={onMeshClick}
                  onPartClick={handlePartClick}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Help Modal */}
      <AnimatePresence>
        {showHelpModal && isMobile && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-charcoal/50 z-50"
              onClick={() => setShowHelpModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-cream border border-charcoal shadow-xl max-w-[320px] w-full p-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-mono text-[12px] uppercase tracking-widest text-charcoal">
                    Naming Guidance
                  </h3>
                  <button
                    onClick={() => setShowHelpModal(false)}
                    className="text-charcoal hover:text-charcoal/70 transition-colors"
                  >
                    ×
                  </button>
                </div>
                <p className="text-[12px] text-charcoal leading-relaxed">
                  <strong>Combine parts customized together</strong> (e.g., "Fittings")
                  <br />
                  <br />
                  <strong>Mark swappable/optional parts</strong> (can do later)
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
    </>
  );
};

export default ExplodedViewParts;
