import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { IdentityTagV2 } from './components/IdentityTagV2';
import { SpecSentence } from './components/SpecSentence';
import { LivingLabel } from './components/LivingLabel';
import { LivingLabelComplete } from './components/LivingLabelComplete';
import { FullStoryLabel } from './components/FullStoryLabel';
import { MarginsEvidence } from './components/MarginsEvidence';
import { FourCorners } from './components/FourCorners';
import { SentenceWithDrawer } from './components/SentenceWithDrawer';
import { AccordionSentence } from './components/AccordionSentence';
import { BidirectionalBridge } from './components/BidirectionalBridge';
import { HangtagChapters } from './components/HangtagChapters';
import { OmniLayout } from './components/OmniLayout';
import { ProductStage } from './components/ProductStage';
import { PatternView } from './components/PatternView';
import { PriceTree } from './components/PriceTree';
import { AdminControls } from './components/AdminControls';
import { AuthModal } from './components/AuthModal';
import { PartId, ConfigurationState, ConflictResolution, AdminViewMode, SelectionState, HotspotMap3D, HotspotPartId, DecalPlacement } from './types';
import { ConfigurationStateV2 } from './types-tree';
import { AURORA_BAG } from './productCatalog';
import { createDefaultConfiguration, updateSelection } from './utils/configHelpers';
import { calculatePriceModifiers } from './utils/treeHelpers';
import { DEFAULT_CONFIGURATION } from './constants';
import { GripVertical } from 'lucide-react';
import { HotspotRadial } from './components/HotspotRadial';
// MerchantWizard moved to demo-iframe app
import { v4 as uuidv4 } from 'uuid';

// New Layout Components
import CardsLayout from './components/CardsLayout';
import TreeLayout from './components/TreeLayout';
import SplitLayout from './components/SplitLayout';
import SentenceLayout from './components/SentenceLayout';
import OntologyLayout from './components/OntologyLayout';
import StyleGuideLayout from './components/StyleGuideLayout';
import SelectionDrawer from './components/SelectionDrawer';
import { Option, ConfigState } from './types-layouts';
import { productLayoutData, defaultLayoutConfig, calculateLayoutPrice, isModifiedFromDefault } from './layoutData';

export default function App() {
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
  const [merchantStage, setMerchantStage] = useState<'welcome' | 'app'>('app');

  // Hotspot placement (surface-anchored)
  const [hotspotPlacementEnabled, setHotspotPlacementEnabled] = useState(false);
  const [hotspotPlacementTarget, setHotspotPlacementTarget] = useState<HotspotPartId>('body');
  const [hotspots3d, setHotspots3d] = useState<HotspotMap3D>({});

  // Decal placement (UV + world hit synced with 2D)
  const [decalPlacementEnabled, setDecalPlacementEnabled] = useState(false);
  const [decalImageUrl, setDecalImageUrl] = useState<string | null>(null);
  const [decalScale, setDecalScale] = useState(0.12);
  const [decalRotation, setDecalRotation] = useState(0);
  const [decalTargetMode, setDecalTargetMode] = useState<'auto' | 'selected'>('auto');
  const [decals, setDecals] = useState<DecalPlacement[]>([]);
  
  // UI Mode Toggle - All concepts + legacy modes + new layouts
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
  const [uiMode, setUiMode] = useState<UiMode>('omni');
  const [highlightedPart, setHighlightedPart] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'customer' | 'merchant'>('customer');
  
  // State for the alternative layout components (L1→L2→L3 data model)
  const [layoutSelections, setLayoutSelections] = useState<ConfigState>(defaultLayoutConfig);
  const [layoutPrice, setLayoutPrice] = useState(295);
  const [selectionDrawer, setSelectionDrawer] = useState<{
    isOpen: boolean;
    id: string;
    title: string;
    subtitle?: string;
    options: Option[];
  }>({ isOpen: false, id: '', title: '', options: [] });
  
  // Calculate Price Effect - New tree-based calculation
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
    
    // Match CSS transition duration (0.4s) plus a small buffer
    setTimeout(() => {
      setIsLayoutTransitioning(false);
    }, 450);
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
      
      // Clamp percentage to reasonable limits (20% - 80%)
      const clamped = Math.min(Math.max(percentage, 20), 80);
      setSplitPos(clamped);
    };

    const handleMouseUp = () => {
      setIsDraggingSplit(false);
    };

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
    const updateViewport = () => {
      setIsMobileViewport(window.innerWidth <= 640);
    };
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  // Load/persist hotspots in localStorage (v1)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('omnimio.hotspots3d.v1');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') setHotspots3d(parsed);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('omnimio.hotspots3d.v1', JSON.stringify(hotspots3d));
    } catch {
      // ignore
    }
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
      if (!parsed || typeof parsed !== 'object') return;
      setHotspots3d(parsed);
    } catch {
      alert('Invalid JSON.');
    }
  };

  // Handle Option Selection with Constraint Checking (Auto-Plan)
  const updateConfig = useCallback((key: keyof ConfigurationState, value: string) => {
    setConfiguration((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Handle Option Selection with Constraint Checking (Auto-Plan)
  const handleSelection = useCallback((key: keyof ConfigurationState, value: string) => {
    // Constraint: Chain handles cannot have prints
    if (key === 'handleMaterial' && value === 'chain' && configuration.surfacePrint !== 'none') {
      setConflict({
        message: "Chain disables Print.",
        optionA: { label: "Switch to Leather", action: () => {
            updateConfig('handleMaterial', 'contrast');
            updateConfig('surfacePrint', configuration.surfacePrint); // keep print
            setConflict(null);
        }},
        optionB: { label: "Remove Print", action: () => {
            updateConfig('handleMaterial', 'chain'); // set chain
            updateConfig('surfacePrint', 'none'); // remove print
            setConflict(null);
        }}
      });
      return;
    }

    updateConfig(key, value);
  }, [configuration.surfacePrint, updateConfig]);

  const handleFocusPart = useCallback((part: string | null) => {
    setActivePart(part as PartId | null);
    // Auto-expand tag when a part is focused so controls are visible
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
    ({
      part,
      key,
      value,
      stepId: _stepId,
    }: {
      part: Extract<PartId, 'handle' | 'body' | 'clasp'>;
      key: keyof ConfigurationState;
      value: string;
      stepId: string;
    }) => {
      handleSelection(key, value);
      // Tab routing is legacy; focus the part only.
      handleFocusPart(part);
      setRadialMenu(null);
    },
    [handleSelection, handleFocusPart]
  );

  const handleRadialDetails = useCallback(
    ({ part, stepId: _stepId }: { part: Extract<PartId, 'handle' | 'body' | 'clasp'>; stepId: string }) => {
      // Tab routing is legacy; focus the part only.
      handleFocusPart(part);
      setRadialMenu(null);
    },
    [handleFocusPart]
  );

  // MerchantWizard removed - use demo-iframe app for merchant flow

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
    // Heuristic: procedural/semantic ids shouldn't be used to constrain GLTF mesh raycasts.
    if (
      activePart === 'handle' ||
      activePart === 'body' ||
      activePart === 'zipper' ||
      activePart === 'clasp' ||
      activePart === 'proc_body' ||
      activePart === 'proc_handle' ||
      activePart === 'proc_hardware' ||
      activePart === 'proc_charm'
    ) {
      return null;
    }
    return String(activePart);
  };

  const handleClearCustomModel = () => {
    setCustomModelSrc(null);
    // Also stop placement modes to avoid confusing click behavior with the procedural model.
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

  // New tree-based handlers
  const handleNodeClick = (nodeIdOrSelection: string) => {
    console.log('Node action:', nodeIdOrSelection);

    // Check if this is a selection (format: "nodeId:optionId")
    if (nodeIdOrSelection.includes(':')) {
      const [nodeId, optionId] = nodeIdOrSelection.split(':');
      console.log('Option selected:', { nodeId, optionId });
      // Update configuration with the selected option
      setConfigurationV2(prev => updateSelection(prev, nodeId, optionId));
      return;
    }

    // Otherwise it's a node click - this shouldn't happen now
    // as IdentityTagV2 handles it internally
    console.log('Direct node click (handled internally):', nodeIdOrSelection);
  };

  const handlePresetSelectV2 = (presetName: string) => {
    console.log('Preset selected:', presetName);
    // TODO: Load preset configuration
  };

  // Mapping ConfigurationState to SelectionState for the new components
  const derivedSelections: SelectionState = {
    body: configuration.surfaceTexture === 'smooth' ? 'smooth_latte' : 'pebble_bisque',
    handle_style: configuration.handleConfig === 'single' ? 'single_short' : (configuration.handleConfig === 'double' ? 'shoulder_strap' : 'crossbody'),
    handle_material: configuration.handleMaterial === 'same' ? 'match_body' : (configuration.handleMaterial === 'chain' ? 'chain' : 'contrast_tan'),
    hardware: configuration.surfaceHardware === 'gold' ? 'brass_antique' : 'silver_polish',
    charm_type: configuration.surfaceText === 'patch' ? 'leather_tag' : 'none'
  };

  return (
    /* 
      THE OUTER MATTE 
    */
    <div className="relative w-full h-full p-[3px] lg:p-[5px] bg-cream overflow-hidden">
      
      {/* 
        THE SWISS FRAME 
      */}
      <div className="relative w-full h-full border border-charcoal rounded-[20px] sm:rounded-[24px] md:rounded-[32px] overflow-hidden bg-cream flex flex-col shadow-2xl shadow-charcoal/5">
        
        {/* UI Mode Toggle - Top Right */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50 flex items-center gap-3 pointer-events-auto">
          {/* Role Toggle (only visible when in unified/complete mode) */}
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

        {/* 1i. Omni Layout (Fresh Concept) */}
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
              onSetUiMode: (mode) => setUiMode(mode as UiMode),
              decalEditor: {
                enabled: decalPlacementEnabled,
                hasImage: !!decalImageUrl,
                scale: decalScale,
                rotation: decalRotation,
                targetMode: decalTargetMode,
                onSetTargetMode: (mode) => setDecalTargetMode(mode),
                onSetEnabled: (enabled) => {
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
                onSetEnabled: (enabled) => {
                  if (enabled) setDecalPlacementEnabled(false);
                  setHotspotPlacementEnabled(enabled);
                },
                onSetTarget: (target) => setHotspotPlacementTarget(target),
                onExport: exportHotspots3d,
                onImport: importHotspots3d,
                onClear: () => setHotspots3d({}),
              }
            }}
          />
        )}

        {/* 1. Identity Tag (Panel Mode - Right Side) */}
        {adminViewMode === '3d' && uiMode === 'panel' && (
          <div className={`absolute right-4 left-4 md:left-auto md:right-6 z-50 flex justify-center md:justify-end pointer-events-none transition-all duration-300 ${
            isTagExpanded 
              ? 'bottom-[1rem] md:bottom-[2rem] md:top-auto md:translate-y-0' 
              : 'bottom-[1rem] md:bottom-[2rem] md:top-auto md:translate-y-0'
          }`}>
            <div className="pointer-events-auto w-full md:w-auto flex justify-center md:justify-end">
              <IdentityTagV2
                  expanded={isTagExpanded}
                  onToggle={() => setIsTagExpanded(!isTagExpanded)}
                  configuration={configurationV2}
                  product={AURORA_BAG}
                  onNodeClick={handleNodeClick}
                  onPresetSelect={handlePresetSelectV2}
                  totalPrice={totalPrice}
                  onOpenPrice={() => {
                    setIsTagExpanded(false);
                    setIsPriceTreeOpen(true);
                  }}
                  onLoginRequest={() => setIsAuthOpen(true)}
                  availablePresets={['Studio Noir', 'Minimal Latte', 'Urban Charcoal', 'Custom']}
                  currentPresetName="Custom"
              />
            </div>
          </div>
        )}

        {/* 1b. Spec Sentence UI (Sentence Mode - Bottom Rail) */}
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

        {/* 1c. Evidence in Margins (RECOMMENDED - Clean sentence, margins have info) */}
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

        {/* 1c-alt. Full Story Label (Stacked layout) */}
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

        {/* 1c-alt. Living Label Complete (Tabs version) */}
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

        {/* 1c-alt. Living Label Basic (Concept 3 - Without Info/Community) */}
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

        {/* 1d. Sentence with Drawer (Concept 1) */}
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

        {/* 1e. Accordion Sentence (Concept 2) */}
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

        {/* 1f. Bidirectional Bridge (Concept 5) */}
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

        {/* 1g. Hangtag Chapters (Spec sentence + full Info/Community chapters) */}
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

        {/* 1h. Four Corners (Concept 6 - Specialized Tools) */}
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

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ALTERNATIVE LAYOUTS (Full-screen, no 3D stage) */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        
        {/* Cards Layout */}
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
        
        {/* Tree Layout */}
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
        
        {/* Split Layout */}
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
        
        {/* Sentence Layout (Alternative) */}
        {uiMode === 'sentence-alt' && (
          <SentenceLayout
            data={productLayoutData}
            selections={layoutSelections}
            onSelect={handleLayoutSelect}
            isModified={isLayoutModified}
            totalPrice={layoutPrice}
          />
        )}
        
        {/* Ontology Layout (Graph Visualization) */}
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
        
        {/* Style Guide Layout */}
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

        {/* 2. Main Content Area with Splitter (Only for 3D-based modes) */}
        {!['cards', 'tree', 'split', 'sentence-alt', 'ontology', 'styleguide'].includes(uiMode) && (
        <div ref={splitContainerRef} className="w-full h-full flex relative overflow-hidden">
            
            {/* 3D Stage View */}
            <div 
                className={`relative h-full overflow-hidden bg-cream`}
                style={{
                    width: adminViewMode === '3d' ? '100%' : (adminViewMode === '2d' ? '0%' : `${splitPos}%`),
                    // Disable transition during drag for 1:1 responsiveness
                    transition: isDraggingSplit ? 'none' : 'width 0.4s cubic-bezier(0.25, 0.1, 0.25, 1.0)',
                    // Hide when in 2d mode but keep mounted for WebGL context
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
                    onPlaceHotspot={(part, placement) => {
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
                    onPlaceDecal={(placement) => {
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
                    onUpdateDecal={(id, patch) => {
                      setDecals((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
                    }}
                    isDragging={isDraggingSplit}
                    isTransitioning={isLayoutTransitioning}
                />
                {/* Right Border in Split Mode (visual separator) */}
                {adminViewMode === 'split' && (
                    <div className="absolute top-0 right-0 bottom-0 w-[1px] bg-charcoal/10 pointer-events-none" />
                )}
            </div>

            {/* Draggable Slider Handle (Only in Split Mode) */}
            {adminViewMode === 'split' && (
                <div 
                    onMouseDown={handleSplitMouseDown}
                    className="absolute top-0 bottom-0 w-6 -ml-3 z-50 cursor-col-resize flex items-center justify-center group hover:bg-charcoal/5 active:bg-charcoal/10 transition-colors"
                    style={{ left: `${splitPos}%` }}
                >
                     {/* Interactive Line */}
                     <div className="w-[1px] h-8 bg-charcoal/20 group-hover:bg-charcoal group-hover:h-12 transition-all duration-300" />
                     
                     {/* Handle Pill */}
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

        {/* Selection Drawer for Cards/Tree layouts */}
        <SelectionDrawer
          isOpen={selectionDrawer.isOpen}
          onClose={() => setSelectionDrawer(prev => ({ ...prev, isOpen: false }))}
          title={selectionDrawer.title}
          subtitle={selectionDrawer.subtitle}
          options={selectionDrawer.options}
          selectedValue={layoutSelections[selectionDrawer.id] || ''}
          onSelect={handleDrawerSelect}
        />

        {/* 3. Overlays */}
        <AnimatePresence>
          {isPriceTreeOpen && (
            <PriceTree 
              configuration={configuration}
              totalPrice={totalPrice}
              onClose={() => setIsPriceTreeOpen(false)}
            />
          )}
        </AnimatePresence>

        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onLogin={handleLogin}
        />

        {/* 4. Admin Controls (Bottom Left Anchor) - Hidden in Omni Mode (embedded) */}
        {uiMode !== 'omni' && (
          <AdminControls 
            isOpen={isAdminOpen}
            onToggle={() => setIsAdminOpen(!isAdminOpen)}
            onUploadModel={handleModelUpload}
            onUploadTexture={() => {}} // Legacy placeholder (kept to avoid breaking UI section)
            onClearModel={handleClearCustomModel}
            hasCustomModel={!!customModelSrc}
            viewMode={adminViewMode}
            onSetViewMode={handleViewModeChange}
            activePart={activePart}
            uiMode={uiMode}
            onSetUiMode={(mode) => setUiMode(mode as UiMode)}
            decalEditor={{
              enabled: decalPlacementEnabled,
              hasImage: !!decalImageUrl,
              scale: decalScale,
              rotation: decalRotation,
              targetMode: decalTargetMode,
              onSetTargetMode: (mode) => setDecalTargetMode(mode),
              onSetEnabled: (enabled) => {
                // Mutually exclusive placement modes (prevents "I placed a hotspot" confusion).
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
              onSetEnabled: (enabled) => {
                // Mutually exclusive placement modes.
                if (enabled) setDecalPlacementEnabled(false);
                setHotspotPlacementEnabled(enabled);
              },
              onSetTarget: (target) => setHotspotPlacementTarget(target),
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
}
