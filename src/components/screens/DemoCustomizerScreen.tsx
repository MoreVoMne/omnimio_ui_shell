/**
 * DemoCustomizerScreen - Full customizer from ui-export
 * Includes 3D viewer, sentence, admin panel, identity tag, and all UI modes
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { GripVertical } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// Import components from ui-export
import { OmniLayout } from '@omnimio/ui-core/components/OmniLayout';
import { IdentityTagV2 } from '@omnimio/ui-core/components/IdentityTagV2';
import { SpecSentence } from '@omnimio/ui-core/components/SpecSentence';
import { LivingLabel } from '@omnimio/ui-core/components/LivingLabel';
import { LivingLabelComplete } from '@omnimio/ui-core/components/LivingLabelComplete';
import { FullStoryLabel } from '@omnimio/ui-core/components/FullStoryLabel';
import { MarginsEvidence } from '@omnimio/ui-core/components/MarginsEvidence';
import { FourCorners } from '@omnimio/ui-core/components/FourCorners';
import { SentenceWithDrawer } from '@omnimio/ui-core/components/SentenceWithDrawer';
import { AccordionSentence } from '@omnimio/ui-core/components/AccordionSentence';
import { BidirectionalBridge } from '@omnimio/ui-core/components/BidirectionalBridge';
import { HangtagChapters } from '@omnimio/ui-core/components/HangtagChapters';
import { ProductStage } from '@omnimio/ui-core/components/ProductStage';
import { PatternView } from '@omnimio/ui-core/components/PatternView';
import { PriceTree } from '@omnimio/ui-core/components/PriceTree';
import { AdminControls } from '@omnimio/ui-core/components/AdminControls';
import { AuthModal } from '@omnimio/ui-core/components/AuthModal';
import { HotspotRadial } from '@omnimio/ui-core/components/HotspotRadial';
import CardsLayout from '@omnimio/ui-core/components/CardsLayout';
import TreeLayout from '@omnimio/ui-core/components/TreeLayout';
import SplitLayout from '@omnimio/ui-core/components/SplitLayout';
import SentenceLayout from '@omnimio/ui-core/components/SentenceLayout';
import OntologyLayout from '@omnimio/ui-core/components/OntologyLayout';
import StyleGuideLayout from '@omnimio/ui-core/components/StyleGuideLayout';
import SelectionDrawer from '@omnimio/ui-core/components/SelectionDrawer';

// Import types and utilities from ui-export
import { ConfigurationStateV2 } from '@omnimio/ui-core/types-tree';
import { 
  ConfigurationState, 
  AdminViewMode, 
  SelectionState,
  PartId,
  ConflictResolution,
  HotspotMap3D,
  HotspotPartId,
  DecalPlacement
} from '@omnimio/ui-core/types';
import { Option, ConfigState } from '@omnimio/ui-core/types-layouts';
import { AURORA_BAG } from '@omnimio/ui-core/productCatalog';
import { createDefaultConfiguration, updateSelection } from '@omnimio/ui-core/utils/configHelpers';
import { calculatePriceModifiers } from '@omnimio/ui-core/utils/treeHelpers';
import { DEFAULT_CONFIGURATION } from '@omnimio/ui-core/constants';
import { productLayoutData, defaultLayoutConfig, calculateLayoutPrice, isModifiedFromDefault } from '@omnimio/ui-core/layoutData';

// UI Mode type
type UiMode =
  | 'omni'
  | 'fourcorners'
  | 'margins'
  | 'fullstory'
  | 'complete'
  | 'unified'
  | 'drawer'
  | 'accordion'
  | 'bridge'
  | 'chapters'
  | 'panel'
  | 'sentence'
  | 'cards'
  | 'tree'
  | 'split'
  | 'sentence-alt'
  | 'ontology'
  | 'styleguide';

interface DemoCustomizerScreenProps {
  onBack?: () => void;
}

const DemoCustomizerScreen: React.FC<DemoCustomizerScreenProps> = ({ onBack }) => {
  // Legacy state for ProductStage compatibility
  const [configuration, setConfiguration] = useState<ConfigurationState>(DEFAULT_CONFIGURATION);

  // New tree-based configuration
  const [configurationV2, setConfigurationV2] = useState<ConfigurationStateV2>(
    createDefaultConfiguration(AURORA_BAG)
  );

  const [activePart, setActivePart] = useState<PartId | null>(null);
  const [isTagExpanded, setIsTagExpanded] = useState(true);
  const [isPriceTreeOpen, setIsPriceTreeOpen] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [conflict, setConflict] = useState<ConflictResolution | null>(null);
  
  // Auth State
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Admin / Custom Model State
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminViewMode, setAdminViewMode] = useState<AdminViewMode>('3d');
  const [customModelSrc, setCustomModelSrc] = useState<string | null>(null);

  // Transition State for smooth sliding
  const [isLayoutTransitioning, setIsLayoutTransitioning] = useState(false);

  // Split View Resizing State
  const [splitPos, setSplitPos] = useState(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const [radialMenu, setRadialMenu] = useState<{
    part: Extract<PartId, 'handle' | 'body' | 'clasp'>;
    x: number;
    y: number;
  } | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  // Hotspot placement (surface-anchored)
  const [hotspotPlacementEnabled, setHotspotPlacementEnabled] = useState(false);
  const [hotspotPlacementTarget, setHotspotPlacementTarget] = useState<HotspotPartId>('body');
  const [hotspots3d, setHotspots3d] = useState<HotspotMap3D>({});

  // Decal placement
  const [decalPlacementEnabled, setDecalPlacementEnabled] = useState(false);
  const [decalImageUrl, setDecalImageUrl] = useState<string | null>(null);
  const [decalScale, setDecalScale] = useState(0.12);
  const [decalRotation, setDecalRotation] = useState(0);
  const [decalTargetMode, setDecalTargetMode] = useState<'auto' | 'selected'>('auto');
  const [decals, setDecals] = useState<DecalPlacement[]>([]);
  
  // UI Mode
  const [uiMode, setUiMode] = useState<UiMode>('omni');
  const [highlightedPart, setHighlightedPart] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'customer' | 'merchant'>('customer');
  
  // State for alternative layout components
  const [layoutSelections, setLayoutSelections] = useState<ConfigState>(defaultLayoutConfig);
  const [layoutPrice, setLayoutPrice] = useState(295);
  const [selectionDrawer, setSelectionDrawer] = useState<{
    isOpen: boolean;
    id: string;
    title: string;
    subtitle?: string;
    options: Option[];
  }>({ isOpen: false, id: '', title: '', options: [] });
  
  // Calculate Price Effect
  useEffect(() => {
    const basePrice = AURORA_BAG.basePrice;
    const modifiers = calculatePriceModifiers(AURORA_BAG.customizationTree, configurationV2);
    const total = basePrice + modifiers;
    setTotalPrice(total);
  }, [configurationV2]);
  
  // Calculate price for alternative layout components
  useEffect(() => {
    const price = calculateLayoutPrice(productLayoutData, layoutSelections);
    setLayoutPrice(price);
  }, [layoutSelections]);
  
  // Handlers for alternative layout components
  const handleLayoutSelect = (key: string, value: string) => {
    setLayoutSelections(prev => ({ ...prev, [key]: value }));
  };
  
  const handleOpenAttribute = (id: string, title: string, options: Option[], subtitle?: string) => {
    setSelectionDrawer({ isOpen: true, id, title, subtitle, options });
  };
  
  const handleDrawerSelect = (value: string) => {
    setLayoutSelections(prev => ({ ...prev, [selectionDrawer.id]: value }));
  };
  
  const isLayoutModified = (id: string) => isModifiedFromDefault(id, layoutSelections);

  // Handle View Mode Change with Transition State
  const handleViewModeChange = (mode: AdminViewMode) => {
    if (mode === adminViewMode) return;
    setIsLayoutTransitioning(true);
    setAdminViewMode(mode);
    setTimeout(() => setIsLayoutTransitioning(false), 450);
  };

  // Split Drag Handler
  const handleSplitMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingSplit(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingSplit || !splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      const clamped = Math.min(Math.max(percentage, 20), 80);
      setSplitPos(clamped);
    };

    const handleMouseUp = () => setIsDraggingSplit(false);

    if (isDraggingSplit) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDraggingSplit]);

  useEffect(() => {
    const updateViewport = () => setIsMobileViewport(window.innerWidth <= 640);
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  // Load/persist hotspots in localStorage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('omnimio.hotspots3d.v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') setHotspots3d(parsed);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('omnimio.hotspots3d.v1', JSON.stringify(hotspots3d));
    } catch { /* ignore */ }
  }, [hotspots3d]);

  const exportHotspots3d = async () => {
    const payload = JSON.stringify(hotspots3d, null, 2);
    try {
      await navigator.clipboard.writeText(payload);
      alert('Hotspots copied to clipboard.');
    } catch {
      prompt('Copy your hotspots JSON:', payload);
    }
  };

  const importHotspots3d = () => {
    const raw = prompt('Paste hotspots JSON:');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') setHotspots3d(parsed);
    } catch {
      alert('Invalid JSON.');
    }
  };

  // Handle Option Selection with Constraint Checking
  const updateConfig = useCallback((key: keyof ConfigurationState, value: string) => {
    setConfiguration((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSelection = useCallback((key: keyof ConfigurationState, value: string) => {
    if (key === 'handleMaterial' && value === 'chain' && configuration.surfacePrint !== 'none') {
      setConflict({
        message: "Chain disables Print.",
        optionA: { label: "Switch to Leather", action: () => {
            updateConfig('handleMaterial', 'contrast');
            updateConfig('surfacePrint', configuration.surfacePrint);
            setConflict(null);
        }},
        optionB: { label: "Remove Print", action: () => {
            updateConfig('handleMaterial', 'chain');
            updateConfig('surfacePrint', 'none');
            setConflict(null);
        }}
      });
      return;
    }
    updateConfig(key, value);
  }, [configuration.surfacePrint, updateConfig]);

  const handleFocusPart = useCallback((part: string | null) => {
    setActivePart(part as PartId | null);
    if (part) setIsTagExpanded(true);
  }, []);

  const handleHotspotActivate = useCallback(
    (part: Extract<PartId, 'handle' | 'body' | 'clasp'>, coords: { x: number; y: number }) => {
      handleFocusPart(part);
      setRadialMenu({ part, ...coords });
    },
    [handleFocusPart]
  );

  const handleRadialApply = useCallback(
    ({ part, key, value }: { part: Extract<PartId, 'handle' | 'body' | 'clasp'>; key: keyof ConfigurationState; value: string; stepId: string }) => {
      handleSelection(key, value);
      handleFocusPart(part);
      setRadialMenu(null);
    },
    [handleSelection, handleFocusPart]
  );

  const handleRadialDetails = useCallback(
    ({ part }: { part: Extract<PartId, 'handle' | 'body' | 'clasp'>; stepId: string }) => {
      handleFocusPart(part);
      setRadialMenu(null);
    },
    [handleFocusPart]
  );

  const handleModelUpload = (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    setCustomModelSrc(objectUrl);
  };

  const handleDecalUpload = (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    setDecalImageUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return objectUrl;
    });
  };

  const handleClearDecals = () => {
    setDecals([]);
    setDecalPlacementEnabled(false);
  };

  const getSelectedStableIdForTargeting = (): string | null => {
    if (!activePart) return null;
    if (['handle', 'body', 'zipper', 'clasp', 'proc_body', 'proc_handle', 'proc_hardware', 'proc_charm'].includes(activePart)) {
      return null;
    }
    return String(activePart);
  };

  const handleClearCustomModel = () => {
    setCustomModelSrc(null);
    setHotspotPlacementEnabled(false);
    setDecalPlacementEnabled(false);
  };

  const handleLogin = (username: string) => {
    setConfiguration(prev => ({ ...prev, username }));
    setConfigurationV2(prev => ({
      ...prev,
      user: { ...prev.user, username }
    }));
    setIsAuthOpen(false);
  };

  // Tree-based handlers
  const handleNodeClick = useCallback((nodeIdOrSelection: string) => {
    if (nodeIdOrSelection.includes(':')) {
      const parts = nodeIdOrSelection.split(':');
      const nodeId = parts[0] || '';
      const optionId = parts[1] || '';
      setConfigurationV2(prev => updateSelection(prev, nodeId, optionId));
      return;
    }
  }, []);

  const handlePresetSelectV2 = (presetName: string) => {
    console.log('Preset selected:', presetName);
  };

  // Mapping ConfigurationState to SelectionState
  const derivedSelections: SelectionState = {
    body: configuration.surfaceTexture === 'smooth' ? 'smooth_latte' : 'pebble_bisque',
    handle_style: configuration.handleConfig === 'single' ? 'single_short' : (configuration.handleConfig === 'double' ? 'shoulder_strap' : 'crossbody'),
    handle_material: configuration.handleMaterial === 'same' ? 'match_body' : (configuration.handleMaterial === 'chain' ? 'chain' : 'contrast_tan'),
    hardware: configuration.surfaceHardware === 'gold' ? 'brass_antique' : 'silver_polish',
    charm_type: configuration.surfaceText === 'patch' ? 'leather_tag' : 'none'
  };

  return (
    <div className="relative w-full h-full p-[3px] lg:p-[5px] bg-cream overflow-hidden">
      <div className="relative w-full h-full border border-charcoal rounded-[20px] sm:rounded-[24px] md:rounded-[32px] overflow-hidden bg-cream flex flex-col shadow-2xl shadow-charcoal/5">
        
        {/* Back button - positioned after the menu button */}
        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-4 left-14 z-[60] px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest border border-charcoal/30 rounded hover:bg-charcoal hover:text-cream transition-colors bg-cream/80 backdrop-blur-sm"
          >
            ← Back
          </button>
        )}

        {/* UI Mode Toggle - Top Right */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50 flex items-center gap-3 pointer-events-auto">
          {(uiMode === 'unified' || uiMode === 'complete') && (
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase tracking-widest text-charcoal/40">Role:</span>
              <button
                onClick={() => setUserRole(userRole === 'customer' ? 'merchant' : 'customer')}
                className="px-2 py-1 text-[9px] uppercase tracking-widest bg-cream border border-charcoal/20 rounded hover:border-charcoal/40 transition-all"
              >
                {userRole}
              </button>
            </div>
          )}
        </div>

        {/* Omni Layout */}
        {uiMode === 'omni' && (
          <OmniLayout
            configuration={configurationV2}
            product={AURORA_BAG}
            onNodeClick={handleNodeClick}
            totalPrice={totalPrice}
            onOpenPrice={() => setIsPriceTreeOpen(true)}
            onLoginRequest={() => setIsAuthOpen(true)}
            onPartHighlight={setHighlightedPart}
            highlightedPart={highlightedPart}
            adminProps={{
              onUploadModel: handleModelUpload,
              onUploadTexture: () => {},
              onClearModel: handleClearCustomModel,
              hasCustomModel: !!customModelSrc,
              viewMode: adminViewMode,
              onSetViewMode: handleViewModeChange,
              activePart: activePart,
              uiMode: uiMode,
              onSetUiMode: (mode: string) => setUiMode(mode as UiMode),
              decalEditor: {
                enabled: decalPlacementEnabled,
                hasImage: !!decalImageUrl,
                scale: decalScale,
                rotation: decalRotation,
                targetMode: decalTargetMode,
                onSetTargetMode: setDecalTargetMode,
                onSetEnabled: (enabled: boolean) => {
                  if (enabled) setHotspotPlacementEnabled(false);
                  setDecalPlacementEnabled(enabled);
                },
                onUploadImage: handleDecalUpload,
                onClear: handleClearDecals,
                onSetScale: setDecalScale,
                onSetRotation: setDecalRotation,
              },
              hotspotEditor: {
                enabled: hotspotPlacementEnabled,
                target: hotspotPlacementTarget,
                onSetEnabled: (enabled: boolean) => {
                  if (enabled) setDecalPlacementEnabled(false);
                  setHotspotPlacementEnabled(enabled);
                },
                onSetTarget: setHotspotPlacementTarget,
                onExport: exportHotspots3d,
                onImport: importHotspots3d,
                onClear: () => setHotspots3d({}),
              }
            }}
          />
        )}

        {/* Panel Mode */}
        {adminViewMode === '3d' && uiMode === 'panel' && (
          <div className="absolute right-4 left-4 md:left-auto md:right-6 z-50 flex justify-center md:justify-end pointer-events-none bottom-[1rem] md:bottom-[2rem]">
            <div className="pointer-events-auto w-full md:w-auto flex justify-center md:justify-end">
              <IdentityTagV2
                expanded={isTagExpanded}
                onToggle={() => setIsTagExpanded(!isTagExpanded)}
                configuration={configurationV2}
                product={AURORA_BAG}
                onNodeClick={handleNodeClick}
                onPresetSelect={handlePresetSelectV2}
                totalPrice={totalPrice}
                onOpenPrice={() => { setIsTagExpanded(false); setIsPriceTreeOpen(true); }}
                onLoginRequest={() => setIsAuthOpen(true)}
                availablePresets={['Studio Noir', 'Minimal Latte', 'Urban Charcoal', 'Custom']}
                currentPresetName="Custom"
              />
            </div>
          </div>
        )}

        {/* Sentence Mode */}
        {adminViewMode === '3d' && uiMode === 'sentence' && (
          <SpecSentence
            configuration={configurationV2}
            product={AURORA_BAG}
            onNodeClick={handleNodeClick}
            totalPrice={totalPrice}
            onOpenPrice={() => setIsPriceTreeOpen(true)}
            onLoginRequest={() => setIsAuthOpen(true)}
            onPartHighlight={setHighlightedPart}
            highlightedPart={highlightedPart}
          />
        )}

        {/* Margins Mode */}
        {adminViewMode === '3d' && uiMode === 'margins' && (
          <MarginsEvidence
            configuration={configurationV2}
            product={AURORA_BAG}
            onNodeClick={handleNodeClick}
            totalPrice={totalPrice}
            onOpenPrice={() => setIsPriceTreeOpen(true)}
            onLoginRequest={() => setIsAuthOpen(true)}
            onPartHighlight={setHighlightedPart}
          />
        )}

        {/* Fullstory Mode */}
        {adminViewMode === '3d' && uiMode === 'fullstory' && (
          <FullStoryLabel
            configuration={configurationV2}
            product={AURORA_BAG}
            onNodeClick={handleNodeClick}
            totalPrice={totalPrice}
            onOpenPrice={() => setIsPriceTreeOpen(true)}
            onLoginRequest={() => setIsAuthOpen(true)}
            onPartHighlight={setHighlightedPart}
          />
        )}

        {/* Complete Mode */}
        {adminViewMode === '3d' && uiMode === 'complete' && (
          <LivingLabelComplete
            configuration={configurationV2}
            product={AURORA_BAG}
            onNodeClick={handleNodeClick}
            totalPrice={totalPrice}
            onOpenPrice={() => setIsPriceTreeOpen(true)}
            onLoginRequest={() => setIsAuthOpen(true)}
            role={userRole}
            onPartHighlight={setHighlightedPart}
          />
        )}

        {/* Unified Mode */}
        {adminViewMode === '3d' && uiMode === 'unified' && (
          <LivingLabel
            configuration={configurationV2}
            product={AURORA_BAG}
            onNodeClick={handleNodeClick}
            totalPrice={totalPrice}
            onOpenPrice={() => setIsPriceTreeOpen(true)}
            onLoginRequest={() => setIsAuthOpen(true)}
            role={userRole}
            onPartHighlight={setHighlightedPart}
          />
        )}

        {/* Drawer Mode */}
        {adminViewMode === '3d' && uiMode === 'drawer' && (
          <SentenceWithDrawer
            configuration={configurationV2}
            product={AURORA_BAG}
            onNodeClick={handleNodeClick}
            totalPrice={totalPrice}
            onOpenPrice={() => setIsPriceTreeOpen(true)}
            onLoginRequest={() => setIsAuthOpen(true)}
            onPartHighlight={setHighlightedPart}
          />
        )}

        {/* Accordion Mode */}
        {adminViewMode === '3d' && uiMode === 'accordion' && (
          <AccordionSentence
            configuration={configurationV2}
            product={AURORA_BAG}
            onNodeClick={handleNodeClick}
            totalPrice={totalPrice}
            onOpenPrice={() => setIsPriceTreeOpen(true)}
            onLoginRequest={() => setIsAuthOpen(true)}
            onPartHighlight={setHighlightedPart}
          />
        )}

        {/* Bridge Mode */}
        {adminViewMode === '3d' && uiMode === 'bridge' && (
          <BidirectionalBridge
            configuration={configurationV2}
            product={AURORA_BAG}
            onNodeClick={handleNodeClick}
            totalPrice={totalPrice}
            onOpenPrice={() => setIsPriceTreeOpen(true)}
            onLoginRequest={() => setIsAuthOpen(true)}
            onPartHighlight={setHighlightedPart}
          />
        )}

        {/* Chapters Mode */}
        {adminViewMode === '3d' && uiMode === 'chapters' && (
          <div className="absolute right-4 left-4 md:left-auto md:right-6 z-50 bottom-[1rem] md:bottom-[2rem] pointer-events-none flex justify-center md:justify-end">
            <div className="pointer-events-auto w-full md:w-auto flex justify-center md:justify-end">
              <HangtagChapters
                configuration={configurationV2}
                product={AURORA_BAG}
                onNodeClick={handleNodeClick}
                totalPrice={totalPrice}
                onOpenPrice={() => setIsPriceTreeOpen(true)}
                onLoginRequest={() => setIsAuthOpen(true)}
                onPartHighlight={setHighlightedPart}
                highlightedPart={highlightedPart}
              />
            </div>
          </div>
        )}

        {/* Four Corners Mode */}
        {adminViewMode === '3d' && uiMode === 'fourcorners' && (
          <FourCorners
            configuration={configurationV2}
            product={AURORA_BAG}
            onNodeClick={handleNodeClick}
            totalPrice={totalPrice}
            onOpenPrice={() => setIsPriceTreeOpen(true)}
            onLoginRequest={() => setIsAuthOpen(true)}
            onPartHighlight={setHighlightedPart}
          />
        )}

        {/* Alternative Layouts (Full-screen, no 3D stage) */}
        {uiMode === 'cards' && (
          <div className="w-full h-full overflow-auto p-8 md:p-12 lg:p-16">
            <div className="max-w-6xl mx-auto">
              <div className="mb-12">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-charcoal/40 block mb-2">Configuration</span>
                <h1 className="text-5xl md:text-6xl font-serif italic text-charcoal mb-2">Aurora Bag</h1>
                <div className="w-12 h-[3px] bg-accent"></div>
              </div>
              <CardsLayout
                data={productLayoutData}
                selections={layoutSelections}
                onOpenAttribute={handleOpenAttribute}
                isModified={isLayoutModified}
              />
            </div>
          </div>
        )}
        
        {uiMode === 'tree' && (
          <div className="w-full h-full overflow-auto p-8 md:p-12 lg:p-16">
            <div className="max-w-4xl mx-auto">
              <div className="mb-12">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-charcoal/40 block mb-2">Product Tree</span>
                <h1 className="text-5xl md:text-6xl font-serif italic text-charcoal mb-2">Aurora Bag</h1>
                <div className="w-12 h-[3px] bg-accent"></div>
              </div>
              <TreeLayout
                data={productLayoutData}
                selections={layoutSelections}
                onOpenAttribute={handleOpenAttribute}
                isModified={isLayoutModified}
              />
            </div>
          </div>
        )}
        
        {uiMode === 'split' && (
          <div className="w-full h-full overflow-auto p-8 md:p-12">
            <div className="max-w-6xl mx-auto">
              <div className="mb-8">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-charcoal/40 block mb-2">Split View</span>
                <h1 className="text-4xl font-serif italic text-charcoal mb-2">Aurora Bag</h1>
                <div className="w-12 h-[3px] bg-accent"></div>
              </div>
              <SplitLayout
                data={productLayoutData}
                selections={layoutSelections}
                onSelect={handleLayoutSelect}
                isModified={isLayoutModified}
              />
            </div>
          </div>
        )}
        
        {uiMode === 'sentence-alt' && (
          <SentenceLayout
            data={productLayoutData}
            selections={layoutSelections}
            onSelect={handleLayoutSelect}
            isModified={isLayoutModified}
            totalPrice={layoutPrice}
          />
        )}
        
        {uiMode === 'ontology' && (
          <div className="w-full h-full overflow-auto p-8 md:p-12">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-charcoal/40 block mb-2">Product Ontology</span>
                <h1 className="text-4xl font-serif italic text-charcoal mb-2">System Graph</h1>
                <div className="w-12 h-[3px] bg-accent"></div>
              </div>
              <OntologyLayout />
            </div>
          </div>
        )}
        
        {uiMode === 'styleguide' && (
          <div className="w-full h-full overflow-auto p-8 md:p-12">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-charcoal/40 block mb-2">Design System</span>
                <h1 className="text-4xl font-serif italic text-charcoal mb-2">The Digital Atelier</h1>
                <div className="w-12 h-[3px] bg-accent"></div>
              </div>
              <StyleGuideLayout />
            </div>
          </div>
        )}

        {/* Main Content Area with 3D/2D Splitter */}
        {!['cards', 'tree', 'split', 'sentence-alt', 'ontology', 'styleguide'].includes(uiMode) && (
          <div ref={splitContainerRef} className="w-full h-full flex relative overflow-hidden">
            
            {/* 3D Stage View */}
            <div 
              className="relative h-full overflow-hidden bg-cream"
              style={{
                width: adminViewMode === '3d' ? '100%' : (adminViewMode === '2d' ? '0%' : `${splitPos}%`),
                transition: isDraggingSplit ? 'none' : 'width 0.4s cubic-bezier(0.25, 0.1, 0.25, 1.0)',
                position: adminViewMode === '2d' ? 'absolute' : 'relative',
                left: adminViewMode === '2d' ? '-100%' : '0',
                opacity: adminViewMode === '2d' ? 0 : 1,
                pointerEvents: adminViewMode === '2d' || isDraggingSplit ? 'none' : 'auto'
              }}
            >
              <ProductStage 
                selections={derivedSelections}
                customModelUrl={customModelSrc}
                selectedPartId={activePart}
                onSelectPart={(id) => {
                  if (id && id.includes('handle')) handleFocusPart('handle');
                  else if (id && id.includes('body')) handleFocusPart('body');
                  else if (id) handleFocusPart(id as any);
                  else handleFocusPart(null);
                }}
                onHotspotActivate={handleHotspotActivate}
                hotspots3d={hotspots3d}
                hotspotPlacementMode={{ enabled: hotspotPlacementEnabled, target: hotspotPlacementTarget }}
                onPlaceHotspot={(part: string, placement: any) => {
                  setHotspots3d((prev) => ({ ...prev, [part]: placement }));
                }}
                decals={decals}
                decalPlacementMode={{
                  enabled: decalPlacementEnabled,
                  imageUrl: decalImageUrl,
                  scale: decalScale,
                  rotation: decalRotation,
                  targetMode: decalTargetMode,
                  targetStableId: decalTargetMode === 'selected' ? getSelectedStableIdForTargeting() : null,
                }}
                onPlaceDecal={(placement: any) => {
                  if (!decalImageUrl) return;
                  setDecals((prev) => [
                    ...prev,
                    {
                      id: uuidv4(),
                      imageUrl: decalImageUrl,
                      layer: placement.layer,
                      targetStableId: placement.targetStableId ?? null,
                      u: placement.u,
                      v: placement.v,
                      scale: decalScale,
                      rotation: decalRotation,
                      worldPosition: placement.worldPosition,
                      worldNormal: placement.worldNormal,
                    },
                  ]);
                }}
                onUpdateDecal={(id: string, patch: any) => {
                  setDecals((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
                }}
                isDragging={isDraggingSplit}
                isTransitioning={isLayoutTransitioning}
              />
              {adminViewMode === 'split' && (
                <div className="absolute top-0 right-0 bottom-0 w-[1px] bg-charcoal/10 pointer-events-none" />
              )}
            </div>

            {/* Draggable Slider Handle */}
            {adminViewMode === 'split' && (
              <div 
                onMouseDown={handleSplitMouseDown}
                className="absolute top-0 bottom-0 w-6 -ml-3 z-50 cursor-col-resize flex items-center justify-center group hover:bg-charcoal/5 active:bg-charcoal/10 transition-colors"
                style={{ left: `${splitPos}%` }}
              >
                <div className="w-[1px] h-8 bg-charcoal/20 group-hover:bg-charcoal group-hover:h-12 transition-all duration-300" />
                <div className="absolute bg-cream border border-charcoal rounded-full w-6 h-6 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-200">
                  <GripVertical size={12} className="text-charcoal/60" />
                </div>
              </div>
            )}

            {/* 2D Pattern View */}
            <div 
              className="relative h-full bg-cream overflow-hidden"
              style={{
                width: adminViewMode === '2d' ? '100%' : (adminViewMode === '3d' ? '0%' : `${100 - splitPos}%`),
                transition: isDraggingSplit ? 'none' : 'width 0.4s cubic-bezier(0.25, 0.1, 0.25, 1.0)',
                opacity: (adminViewMode === '2d' || adminViewMode === 'split') ? 1 : 0,
                pointerEvents: isDraggingSplit ? 'none' : 'auto'
              }}
            >
              {(adminViewMode === '2d' || adminViewMode === 'split') && (
                <PatternView 
                  selections={derivedSelections}
                  customModelUrl={customModelSrc}
                  selectedPartId={activePart}
                  onSelectPart={(id) => {
                    if (id && id.includes('handle')) handleFocusPart('handle');
                    else if (id && id.includes('body')) handleFocusPart('body');
                    else if (id) handleFocusPart(id as any);
                    else handleFocusPart(null);
                  }}
                  decals={decals}
                  isDragging={isDraggingSplit}
                  isTransitioning={isLayoutTransitioning}
                />
              )}
            </div>
          </div>
        )}

        {/* Selection Drawer */}
        <SelectionDrawer
          isOpen={selectionDrawer.isOpen}
          onClose={() => setSelectionDrawer(prev => ({ ...prev, isOpen: false }))}
          title={selectionDrawer.title}
          subtitle={selectionDrawer.subtitle}
          options={selectionDrawer.options}
          selectedValue={layoutSelections[selectionDrawer.id] || ''}
          onSelect={handleDrawerSelect}
        />

        {/* Price Tree Overlay */}
        <AnimatePresence>
          {isPriceTreeOpen && (
            <PriceTree 
              configuration={configuration}
              totalPrice={totalPrice}
              onClose={() => setIsPriceTreeOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Auth Modal */}
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onLogin={handleLogin}
        />

        {/* Admin Controls (not in Omni mode - it's embedded) */}
        {uiMode !== 'omni' && (
          <AdminControls 
            isOpen={isAdminOpen}
            onToggle={() => setIsAdminOpen(!isAdminOpen)}
            onUploadModel={handleModelUpload}
            onUploadTexture={() => {}}
            onClearModel={handleClearCustomModel}
            hasCustomModel={!!customModelSrc}
            viewMode={adminViewMode}
            onSetViewMode={handleViewModeChange}
            activePart={activePart}
            uiMode={uiMode}
            onSetUiMode={(mode: string) => setUiMode(mode as UiMode)}
            decalEditor={{
              enabled: decalPlacementEnabled,
              hasImage: !!decalImageUrl,
              scale: decalScale,
              rotation: decalRotation,
              targetMode: decalTargetMode,
              onSetTargetMode: setDecalTargetMode,
              onSetEnabled: (enabled: boolean) => {
                if (enabled) setHotspotPlacementEnabled(false);
                setDecalPlacementEnabled(enabled);
              },
              onUploadImage: handleDecalUpload,
              onClear: handleClearDecals,
              onSetScale: setDecalScale,
              onSetRotation: setDecalRotation,
            }}
            hotspotEditor={{
              enabled: hotspotPlacementEnabled,
              target: hotspotPlacementTarget,
              onSetEnabled: (enabled: boolean) => {
                if (enabled) setDecalPlacementEnabled(false);
                setHotspotPlacementEnabled(enabled);
              },
              onSetTarget: setHotspotPlacementTarget,
              onExport: exportHotspots3d,
              onImport: importHotspots3d,
              onClear: () => setHotspots3d({}),
            }}
          />
        )}

        {/* Mobile Conflict Overlay */}
        <AnimatePresence>
          {conflict && !isTagExpanded && adminViewMode === '3d' && (
            <div className="fixed inset-0 bg-cream/50 backdrop-blur-sm z-[60] md:hidden flex items-center justify-center p-6" onClick={() => setConflict(null)}>
              <div className="bg-cream border border-charcoal p-4 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <h3 className="font-bold text-charcoal mb-2 uppercase text-xs tracking-widest">Conflict</h3>
                <p className="font-serif italic mb-4">{conflict.message}</p>
                <div className="flex gap-2">
                  <button onClick={conflict.optionA.action} className="flex-1 py-2 bg-charcoal text-cream text-xs uppercase">{conflict.optionA.label}</button>
                  <button onClick={conflict.optionB.action} className="flex-1 py-2 border border-charcoal text-xs uppercase">{conflict.optionB.label}</button>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {radialMenu && (
        <HotspotRadial
          part={radialMenu.part}
          anchor={{ x: radialMenu.x, y: radialMenu.y }}
          configuration={configuration}
          isMobile={isMobileViewport}
          onClose={() => setRadialMenu(null)}
          onApply={handleRadialApply}
          onOpenDetails={handleRadialDetails}
        />
      )}
    </div>
  );
};

export default DemoCustomizerScreen;
