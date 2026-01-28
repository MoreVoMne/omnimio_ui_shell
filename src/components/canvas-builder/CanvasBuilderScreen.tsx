import React, { useState } from 'react';
import { Undo2, Redo2, Eye, EyeOff, Maximize2, Grid3x3 } from 'lucide-react';
import { useCanvasStore } from '../../stores/canvasStore';
import Viewport3D from './Viewport3D';
import Viewport2D from './Viewport2D';
import ExplodedViewParts from './ExplodedViewParts';
import AssetTray from './AssetTray';
import PartNamingPopup from './PartNamingPopup';
import CapabilityPicker from './CapabilityPicker';
import ZoneEditor from '../overlays/ZoneEditor';
import CapabilityConfig from '../overlays/CapabilityConfig';
import PreviewQA from '../overlays/PreviewQA';
import { ToastContainer } from '../ui/Toast';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useAutoSave } from '../../hooks/useAutoSave';
import type { CapabilityType, PartRole } from '../../types/canvas';
import type { ToastType } from '../ui/Toast';
import StandardLayout, { StandardButton } from '../layout/StandardLayout';

const CanvasBuilderScreen: React.FC = () => {
  const {
    parts,
    selectedPartId,
    addPart,
    addCapability,
    configureCapability,
    selectPart,
    setScreen,
    setOverlay,
    activeOverlay,
    overlayData,
    undo,
    redo,
    history,
    historyIndex,
    capabilities,
    assets,
    groupParts,
  } = useCanvasStore();

  // Keyboard shortcuts
  useKeyboardShortcuts();

  // Auto-save
  useAutoSave();

  const [namingPopup, setNamingPopup] = useState<{
    meshIndex: number;
    meshName: string;
  } | null>(null);
  const [capabilityPicker, setCapabilityPicker] = useState<{
    partId: string;
  } | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: ToastType; onUndo?: () => void }>>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [viewMode, setViewMode] = useState<'2d' | '3d' | 'split'>('3d');
  const [selectedPartIds, setSelectedPartIds] = useState<Set<string>>(new Set());
  const [groupDialog, setGroupDialog] = useState<{
    partIds: string[];
  } | null>(null);

  const addToast = (message: string, type: ToastType, onUndo?: () => void) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, message, type, onUndo }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleMeshClick = (meshIndex: number, meshName: string) => {
    // Check if part already exists for this mesh
    const existingPart = parts.find((p) => p.meshIndex === meshIndex);

    if (existingPart) {
      // Select existing part
      selectPart(existingPart.id);
    } else {
      // Open naming popup for new part
      setNamingPopup({ meshIndex, meshName });
    }
  };

  const handleMeshHover = (meshIndex: number | null) => {
    if (meshIndex !== null) {
      const part = parts.find((p) => p.meshIndex === meshIndex);
      if (part) {
        // Hover part will be handled by store
      }
    }
  };

  const handlePartNameSave = (name: string, role: PartRole) => {
    if (namingPopup) {
      addPart({
        name,
        meshIndex: namingPopup.meshIndex,
        role,
        parentId: null,
      });
      setNamingPopup(null);
      addToast(`Part "${name}" saved`, 'success');
    }
  };

  const surfaceCapabilityTypes: CapabilityType[] = [
    'print',
    'text',
    'engrave',
    'emboss',
    'hot-stamp',
  ];

  const openCapabilityOverlay = (
    partId: string,
    capabilityType: CapabilityType,
    capabilityId: string
  ) => {
    if (surfaceCapabilityTypes.includes(capabilityType)) {
      setOverlay('zone', { partId, capabilityId });
    } else {
      setOverlay('capability', { partId, capabilityId });
    }
  };

  const handleAddCapability = (partId: string, capabilityType: CapabilityType) => {
    const existingCapability = capabilities
      .get(partId)
      ?.find((cap) => cap.type === capabilityType);

    if (existingCapability) {
      addToast(`Capability "${capabilityType}" already added`, 'warning');
      openCapabilityOverlay(partId, capabilityType, existingCapability.id);
      return existingCapability.id;
    }

    const capabilityId = addCapability(partId, capabilityType);
    addToast(`Capability "${capabilityType}" added`, 'success');
    openCapabilityOverlay(partId, capabilityType, capabilityId);
    return capabilityId;
  };

  const handleViewportDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const capabilityType = e.dataTransfer.getData('capability-type') as CapabilityType;
    const assetId = e.dataTransfer.getData('asset-id');

    // Handle asset drop - auto-assign based on asset type
    if (assetId && selectedPartId) {
      const asset = [
        ...assets.models,
        ...assets.textures,
        ...assets.images,
        ...assets.fonts,
      ].find((a) => a.id === assetId);

      if (asset) {
        if (asset.type === 'texture') {
          // Auto-assign texture to material capability
          const existingMaterial = capabilities
            .get(selectedPartId)
            ?.find((c) => c.type === 'material');
          
          if (existingMaterial) {
            // Add texture to existing material capability
            const materialConfig = existingMaterial.config || {};
            const materialOptions = (materialConfig.options as any[]) || [];
            const newOption = {
              id: `opt-${Date.now()}`,
              name: asset.name,
              customerName: asset.name,
              textureId: asset.id,
              price: 0,
              isDefault: materialOptions.length === 0,
            };
            configureCapability(selectedPartId, existingMaterial.id, {
              ...materialConfig,
              options: [...materialOptions, newOption],
            });
            addToast(`Texture "${asset.name}" added to material`, 'success');
          } else {
            // Create new material capability
            const capabilityId = addCapability(selectedPartId, 'material');
            const materialConfig = {
              options: [
                {
                  id: `opt-${Date.now()}`,
                  name: asset.name,
                  customerName: asset.name,
                  textureId: asset.id,
                  price: 0,
                  isDefault: true,
                },
              ],
            };
            configureCapability(selectedPartId, capabilityId, materialConfig);
            addToast(`Material capability created with "${asset.name}"`, 'success');
            setOverlay('capability', { partId: selectedPartId, capabilityId });
          }
        } else if (asset.type === 'image') {
          // Auto-assign image to print capability
          const existingPrint = capabilities
            .get(selectedPartId)
            ?.find((c) => c.type === 'print');
          
          if (existingPrint) {
            // Add image to existing print library
            const printConfig = existingPrint.config || {};
            const imageLibrary = printConfig.imageLibrary || [];
            configureCapability(selectedPartId, existingPrint.id, {
              ...printConfig,
              imageLibrary: [...imageLibrary, asset.id],
            });
            addToast(`Image "${asset.name}" added to print library`, 'success');
          } else {
            // Create new print capability
            const capabilityId = addCapability(selectedPartId, 'print');
            const printConfig = {
              imageLibrary: [asset.id],
              allowUpload: true,
              allowLibrary: true,
            };
            configureCapability(selectedPartId, capabilityId, printConfig);
            addToast(`Print capability created with "${asset.name}"`, 'success');
            setOverlay('zone', { partId: selectedPartId, capabilityId });
          }
        }
        return;
      }
    }

    // Handle capability drop
    if (capabilityType) {
      if (!selectedPartId) {
        addToast('Select a part to add a capability', 'warning');
      } else {
        handleAddCapability(selectedPartId, capabilityType);
      }
    }
  };

  const handleViewportDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handlePartSelect = (partIds: Set<string>) => {
    setSelectedPartIds(partIds);
  };

  const handleGroupSelected = () => {
    if (selectedPartIds.size === 0) {
      addToast('Select at least one part to group', 'error');
      return;
    }
    setGroupDialog({ partIds: Array.from(selectedPartIds) });
  };

  const handleGroupSave = (groupName: string) => {
    if (groupDialog) {
      const groupId = groupParts(groupDialog.partIds, groupName);
      addToast(`Group "${groupName}" created`, 'success');
      setGroupDialog(null);
      setSelectedPartIds(new Set());
    }
  };

  return (
    <StandardLayout
      header={{
        title: 'Define Parts',
        subtitle:
          "Name only the parts customers can customize. These names appear in your store's configurator and on all order and production documents.",
        showBack: true,
        onBack: () => setScreen('assets'),
        rightContent: (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="border border-charcoal/30 px-2 py-1.5 rounded-md hover:bg-charcoal/10 hover:border-charcoal/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
              title="Undo (⌘Z)"
            >
              <Undo2 size={14} />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="border border-charcoal/30 px-2 py-1.5 rounded-md hover:bg-charcoal/10 hover:border-charcoal/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
              title="Redo (⌘⇧Z)"
            >
              <Redo2 size={14} />
            </button>
            <button
              onClick={() => {
                if (viewMode === '2d') {
                  setViewMode('3d');
                } else if (viewMode === '3d') {
                  setViewMode('split');
                } else {
                  setViewMode('2d');
                }
              }}
              className="border border-charcoal/30 px-2 py-1.5 rounded-md hover:bg-charcoal/10 hover:border-charcoal/50 transition-colors flex items-center justify-center gap-1"
              title={
                viewMode === '2d' ? 'Switch to 3D View' :
                viewMode === '3d' ? 'Switch to Split View' :
                'Switch to 2D View'
              }
            >
              <span className="font-mono text-[9px] uppercase tracking-widest text-charcoal/80">
                {viewMode === '2d' ? '2D' : viewMode === '3d' ? '3D' : '2D/3D'}
              </span>
            </button>
            <button
              onClick={() => setOverlay('preview')}
              className="border border-charcoal/30 px-2 py-1.5 rounded-md hover:bg-charcoal/10 hover:border-charcoal/50 transition-colors flex items-center justify-center"
              title="Preview"
            >
              <Maximize2 size={14} />
            </button>
          </div>
        ),
      }}
      footer={{
        leftContent: <div />,
        rightContent: (
          <StandardButton onClick={() => setScreen('capabilities')}>
            CONTINUE
            <span>→</span>
          </StandardButton>
        ),
      }}
      contentScroll="none"
    >
      {/* Main Content - negative margins to break out of StandardLayout padding */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row break-content-full">
        <div className="min-h-0 flex flex-col flex-1 lg:flex-[0_0_50%] lg:border-r border-charcoal/10 bg-cream/30">
          <div className="bg-cream flex flex-col min-h-0 flex-1 overflow-hidden">
            {/* Viewport (2D/3D/Split) */}
            <div className="flex-1 min-h-0 overflow-hidden panel-padding-x panel-padding-b">
              {viewMode === 'split' ? (
                <div className="w-full h-full flex gap-4 overflow-hidden">
                  <div
                    className="w-1/2 flex-1 min-h-0 overflow-hidden"
                    onDrop={handleViewportDrop}
                    onDragOver={handleViewportDragOver}
                  >
                    <Viewport2D onMeshClick={handleMeshClick} />
                  </div>
                  <div
                    className="w-1/2 flex-1 min-h-0 overflow-hidden"
                    onDrop={handleViewportDrop}
                    onDragOver={handleViewportDragOver}
                  >
                    <Viewport3D onMeshClick={handleMeshClick} onMeshHover={handleMeshHover} />
                  </div>
                </div>
              ) : (
                <div
                  className="w-full h-full overflow-hidden"
                  onDrop={handleViewportDrop}
                  onDragOver={handleViewportDragOver}
                >
                  {viewMode === '3d' ? (
                    <Viewport3D onMeshClick={handleMeshClick} onMeshHover={handleMeshHover} />
                  ) : (
                    <Viewport2D onMeshClick={handleMeshClick} />
                  )}
                </div>
              )}
            </div>

            {/* Naming Guidance */}
            <div className="hidden lg:block border-t border-charcoal/60 bg-cream p-4 flex-shrink-0">
              <p className="text-mono-body text-charcoal">
                Tips:
              </p>
              <ul className="mt-2 space-y-1 text-mono-body text-muted-medium">
                <li>- Combine parts customized together (e.g., "Fittings")</li>
                <li>- Mark swappable/optional parts (can do later)</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 lg:flex-[0_0_50%] overflow-hidden flex flex-col lg:border-t lg:border-t-0 border-charcoal/20">
          <div className="flex-1 min-h-0 flex flex-col p-4 sm:p-6 lg:p-8">
            <div className="flex-1 min-h-0">
              <ExplodedViewParts
                onPartClick={(partId) => {
                  selectPart(partId);
                }}
                onMeshClick={handleMeshClick}
                onPartSelect={handlePartSelect}
                selectedPartIds={selectedPartIds}
                onDrop={handleViewportDrop}
                onDragOver={handleViewportDragOver}
              />
            </div>
            {selectedPartIds.size > 0 && (
              <div className="mt-4 flex items-center justify-between border-t border-charcoal/60 pt-4">
                <span className="font-mono text-[10px] uppercase tracking-widest text-charcoal/70">
                  {selectedPartIds.size} part{selectedPartIds.size !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={handleGroupSelected}
                  className="border border-charcoal px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-charcoal hover:text-cream transition-colors"
                >
                  Group Selected
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

        {/* Part Naming Popup */}
        {namingPopup && (
          <PartNamingPopup
            meshIndex={namingPopup.meshIndex}
            meshName={namingPopup.meshName}
            onClose={() => setNamingPopup(null)}
            onSave={handlePartNameSave}
          />
        )}

        {/* Capability Picker */}
        {capabilityPicker && (
          <CapabilityPicker
            partId={capabilityPicker.partId}
            partName={parts.find((p) => p.id === capabilityPicker.partId)?.name || 'Part'}
            existingCapabilities={
              capabilities.get(capabilityPicker.partId)?.map((c) => c.type) || []
            }
            onSelect={(capabilityType) => {
              handleAddCapability(capabilityPicker.partId, capabilityType);
            }}
            onClose={() => setCapabilityPicker(null)}
          />
        )}

        {/* Overlays */}
        {activeOverlay === 'zone' && overlayData?.partId && overlayData?.capabilityId && (
          <ZoneEditor
            partId={overlayData.partId}
            capabilityId={overlayData.capabilityId}
            onClose={() => setOverlay(null)}
          />
        )}

        {activeOverlay === 'capability' && overlayData?.partId && overlayData?.capabilityId && (
          <CapabilityConfig
            partId={overlayData.partId}
            capabilityId={overlayData.capabilityId}
            onClose={() => setOverlay(null)}
          />
        )}

        {activeOverlay === 'preview' && (
          <PreviewQA onClose={() => setOverlay(null)} />
        )}

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />

        {/* Confirmation Dialog */}
        {confirmDialog && (
          <ConfirmDialog
            title={confirmDialog.title}
            message={confirmDialog.message}
            onConfirm={() => {
              confirmDialog.onConfirm();
              setConfirmDialog(null);
            }}
            onCancel={() => setConfirmDialog(null)}
          />
        )}

        {/* Group Dialog */}
        {groupDialog && (
          <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-50">
            <div className="bg-cream border border-charcoal rounded-[24px] p-6 max-w-md w-full mx-4">
              <h3 className="font-serif text-xl mb-4">Create Part Group</h3>
              <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal/70 mb-4">
                Enter a name for the group of {groupDialog.partIds.length} part{groupDialog.partIds.length !== 1 ? 's' : ''}:
              </p>
              <input
                type="text"
                placeholder="Group name..."
                className="w-full border border-charcoal rounded-[12px] px-4 py-3 font-serif text-base mb-4 bg-cream"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    handleGroupSave(e.currentTarget.value.trim());
                  }
                }}
                autoFocus
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setGroupDialog(null)}
                  className="border border-charcoal/60 px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-charcoal/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    const input = e.currentTarget.parentElement?.previousElementSibling as HTMLInputElement;
                    if (input?.value.trim()) {
                      handleGroupSave(input.value.trim());
                    }
                  }}
                  className="border border-charcoal px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-charcoal hover:text-cream transition-colors"
                >
                  Create Group
                </button>
              </div>
            </div>
          </div>
        )}
    </StandardLayout>
  );
};

export default CanvasBuilderScreen;

