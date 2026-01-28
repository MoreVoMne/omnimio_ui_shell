// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ChevronRight, ChevronLeft, ChevronDown, X, ArrowLeft, Check, Info, Heart, RefreshCw, ShoppingBag, Share2, Plus } from 'lucide-react';
import { PRESETS, getOptionLabel, OPTION_GROUPS, DEFAULT_CONFIGURATION } from '../constants';
import { ConfigurationState, PartId, ConflictResolution } from '../types';

const PAPER_TEXTURE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.12'/%3E%3C/svg%3E")`;

// Animation timing constants (from spec Section 9.5)
const TIMINGS = {
  buttonPress: 50,
  radioSelect: 50,
  highlight: 100,
  dropdownClose: 200,
  tabSwitch: 250,
  tagExpand: 300,
  dropdownOpen: 300,
  tabStagger: {
    info: 100,
    community: 150
  }
};

interface IdentityTagProps {
  expanded: boolean;
  onToggle: () => void;
  configuration: ConfigurationState;
  onUpdateConfig: (key: keyof ConfigurationState, value: string) => void;
  onPresetSelect: (preset: Partial<ConfigurationState>) => void;
  totalPrice: number;
  onOpenPrice: () => void;
  
  // Editing State
  activePart: PartId | null;
  setActivePart: (part: PartId | null, tab?: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  conflict: ConflictResolution | null;
  onResolveConflict: () => void;
  onLoginRequest: () => void;
}

// Dropdown state for specific attribute editing
interface DropdownState {
  isOpen: boolean;
  componentLabel: string;  // e.g., "Body", "Handle"
  attributeId: keyof ConfigurationState | null;
  attributeLabel: string;  // e.g., "Material", "Length"
}

type FolderTab = 'customize' | 'info' | 'community';

// Check if an attribute is modified from default
const isModified = (key: keyof ConfigurationState, value: string): boolean => {
  return DEFAULT_CONFIGURATION[key] !== value;
};

// Helper to look up price for a specific configuration
const getOptionPrice = (key: keyof ConfigurationState, value: string): number => {
  let foundPrice = 0;
  
  [...OPTION_GROUPS.handle.steps, ...OPTION_GROUPS.surface.steps].forEach(step => {
    if (step.id === key) {
      // @ts-ignore
      const opt = step.options.find(o => o.id === value);
      if (opt) foundPrice = opt.price;
    }
  });

  return foundPrice;
};

// Preview styles for option thumbnails
const getOptionPreviewStyle = (attributeId: keyof ConfigurationState | null, optionId: string): string => {
  if (!attributeId) return '#f5f5f5';
  
  // Material/Texture previews
  const previewStyles: Record<string, Record<string, string>> = {
    surfaceTexture: {
      pebbled: 'linear-gradient(135deg, #e8e4dc 25%, #d4cfc5 25%, #d4cfc5 50%, #e8e4dc 50%, #e8e4dc 75%, #d4cfc5 75%), radial-gradient(circle at 30% 30%, #ccc 1px, transparent 1px), radial-gradient(circle at 70% 70%, #ccc 1px, transparent 1px)',
      smooth: 'linear-gradient(180deg, #f0ebe3 0%, #e5dfd5 100%)',
    },
    surfaceTreatment: {
      natural: 'linear-gradient(180deg, #f5f0e8 0%, #ebe5db 100%)',
      waxed: 'linear-gradient(180deg, #d4cfc5 0%, #c9c3b8 50%, #d4cfc5 100%)',
    },
    surfacePrint: {
      none: 'linear-gradient(180deg, #f5f0e8 0%, #ebe5db 100%)',
      pattern: 'repeating-linear-gradient(45deg, #e8e4dc, #e8e4dc 4px, #d4cfc5 4px, #d4cfc5 8px)',
      monogram: 'repeating-linear-gradient(0deg, #e8e4dc, #e8e4dc 8px, #d4cfc5 8px, #d4cfc5 16px), repeating-linear-gradient(90deg, #e8e4dc, #e8e4dc 8px, #d4cfc5 8px, #d4cfc5 16px)',
    },
    handleMaterial: {
      same: 'linear-gradient(180deg, #f5f0e8 0%, #ebe5db 100%)',
      contrast: 'linear-gradient(180deg, #c9a87c 0%, #a88b5e 100%)',
      chain: 'linear-gradient(180deg, #d4af37 0%, #b8962f 50%, #d4af37 100%)',
    },
    handleSize: {
      standard: 'linear-gradient(180deg, #f5f0e8 0%, #ebe5db 100%)',
      extended: 'linear-gradient(180deg, #e8e4dc 0%, #ddd8ce 100%)',
    },
    handleConfig: {
      single: 'linear-gradient(180deg, #f5f0e8 0%, #ebe5db 100%)',
      double: 'linear-gradient(90deg, #e8e4dc 45%, #ccc 50%, #e8e4dc 55%)',
    },
    surfaceHardware: {
      gold: 'linear-gradient(135deg, #d4af37 0%, #f5d76e 50%, #d4af37 100%)',
      silver: 'linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 50%, #c0c0c0 100%)',
    },
    handleText: {
      none: 'linear-gradient(180deg, #f5f0e8 0%, #ebe5db 100%)',
      initials: 'linear-gradient(180deg, #e8e4dc 0%, #ddd8ce 100%)',
    },
  };
  
  return previewStyles[attributeId]?.[optionId] || '#f5f5f5';
};

// Breadcrumb Component (Spec Section 11.2)
const Breadcrumb: React.FC<{
  path: string[];
  onClose: () => void;
}> = ({ path, onClose }) => {
  // Max 3 levels visible, deeper shows "Parent › ... › Current"
  const displayPath = path.length > 3 
    ? [path[0], '...', path[path.length - 1]]
    : path;

  return (
    <div className="flex items-center justify-between py-2 px-1 border-b border-charcoal mb-3 sticky top-0 bg-cream z-10 pr-8">
      <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-charcoal">
        {displayPath.map((item, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="text-charcoal/40 mx-1">›</span>}
            <span className={i === displayPath.length - 1 ? 'font-medium' : 'text-charcoal/60'}>
              {item}
            </span>
          </React.Fragment>
        ))}
      </div>
      <button 
        onClick={onClose}
        className="w-6 h-6 flex items-center justify-center hover:bg-charcoal/10 rounded-sm transition-colors"
      >
        <X size={12} />
      </button>
    </div>
  );
};

// Tree Row Component with Progress Indication (Spec Section 3.3)
const TreeRow: React.FC<{ 
    label: string; 
    value: string; 
    price?: number;
    isLast?: boolean; 
    indent?: boolean; 
    onClick?: () => void;
    isModified?: boolean;
    isAddAction?: boolean;
    isAdded?: boolean;
}> = ({ label, value, price, isLast, indent, onClick, isModified = false, isAddAction = false, isAdded = false }) => {
  // All options should be fully visible (black text)
  let opacity = 'opacity-100';

  return (
    <button 
        onClick={onClick}
        className={`relative w-full flex items-center text-left font-mono text-[11px] leading-normal group -mx-2 px-2 py-0.5 rounded-sm transition-colors ${onClick ? 'cursor-pointer hover:bg-charcoal/5' : 'cursor-default'} ${opacity}`}
    >
        {indent && (
            <div className="absolute left-2 top-0 bottom-0 w-4">
                <div className={`absolute left-0 top-0 w-px bg-charcoal ${isLast ? 'h-1/2' : 'h-full'}`} />
                <div className="absolute left-0 top-1/2 w-2.5 h-px bg-charcoal" />
            </div>
        )}
        
        <div className={`flex-1 flex items-baseline w-full ${indent ? 'pl-5' : ''}`}>
            {isAddAction ? (
              <span className="whitespace-nowrap text-black flex items-center gap-1">
                <Plus size={10} />
                {label}
            </span>
            ) : (
              <>
                <span className="whitespace-nowrap mr-2 text-black font-normal">
                    {label}
                </span>
                <span className="flex-1 border-b-2 border-dotted border-black mx-2 mb-1"></span>
                <span className="whitespace-nowrap text-black font-mono"> 
                    {value}
                    <span className="text-[10px] ml-1 text-black inline-block align-middle">▼</span>
                </span>
              </>
            )}
        </div>
    </button>
);
};

// Tab Button with stagger animation support
const TabButton: React.FC<{ 
  id: FolderTab;
  label: string;
  isActive: boolean;
  isExpanded: boolean;
  isLast?: boolean;
  staggerDelay?: number;
  onClick: () => void;
}> = ({ id, label, isActive, isExpanded, isLast, staggerDelay = 0, onClick }) => (
  <motion.div 
      onClick={onClick}
      initial={false}
      animate={{ 
        x: 0,
        opacity: 1 
      }}
      transition={{ 
        type: "spring",
        stiffness: 300,
        damping: 30,
        delay: isExpanded ? staggerDelay / 1000 : 0
      }}
      style={{ backgroundImage: isActive && isExpanded ? PAPER_TEXTURE : undefined }}
      className={`
          flex-1 cursor-pointer px-1 flex items-center justify-center border-t border-r border-l border-charcoal
          rounded-t-sm transition-all relative select-none overflow-hidden
          ${!isLast ? 'mr-[-1px]' : ''}
          ${isActive && isExpanded
              ? 'bg-cream z-30 h-10 pb-1 border-b-0'
              : 'bg-white text-charcoal hover:bg-white/90 z-10 h-8 mt-2 border-b border-charcoal'
          }
      `}
  >
      <span className={`text-[10px] uppercase tracking-widest font-medium font-mono whitespace-nowrap truncate ${isActive && isExpanded ? 'text-charcoal' : 'text-charcoal'}`}>
          {label}
      </span>
  </motion.div>
);

// Community Design Card (Spec Section 10.3)
const DesignCard: React.FC<{
  name: string;
  author: string;
  likes: number;
  onLike: () => void;
  onRemix: () => void;
  onQuickBuy: () => void;
}> = ({ name, author, likes, onLike, onRemix, onQuickBuy }) => (
  <div className="border border-charcoal rounded-sm overflow-hidden mb-3 relative aspect-square bg-charcoal/5 flex flex-col justify-end">
    {/* Preview placeholder text */}
    <span className="absolute inset-0 flex items-center justify-center font-mono text-[9px] text-charcoal/30 uppercase tracking-widest">Preview</span>
    
    {/* Overlay content inside the frame */}
    <div className="relative z-10 p-3 bg-gradient-to-t from-cream/95 via-cream/80 to-transparent">
      {/* Author & Likes row */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[9px] uppercase tracking-widest text-charcoal/70">by @{author}</span>
        <button 
          onClick={onLike}
          className="flex items-center gap-1 text-charcoal/60 hover:text-accent transition-colors"
        >
          <Heart size={12} strokeWidth={1.5} />
          <span className="font-mono text-[9px]">{likes}</span>
        </button>
      </div>
      
      {/* Action buttons */}
      <div className="flex gap-2">
        <button 
          onClick={onRemix}
          className="flex-1 py-2 border border-charcoal bg-cream/80 rounded-none font-mono text-[9px] uppercase tracking-widest hover:bg-cream transition-colors flex items-center justify-center gap-1.5"
        >
          <RefreshCw size={10} />
          Remix
        </button>
        <button 
          onClick={onQuickBuy}
          className="flex-1 py-2 border border-charcoal bg-cream/80 rounded-none font-mono text-[9px] uppercase tracking-widest hover:bg-cream transition-colors flex items-center justify-center gap-1.5"
        >
          <ShoppingBag size={10} />
          Buy
        </button>
      </div>
    </div>
  </div>
);

// Accordion Section Component
const InfoAccordion: React.FC<{
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-charcoal/10 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 group"
      >
        <span className="font-mono text-[10px] uppercase tracking-widest font-bold text-charcoal group-hover:text-accent transition-colors">{title}</span>
        <ChevronDown size={14} className={`text-charcoal transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-4 text-[10px] text-charcoal/80 leading-relaxed">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const IdentityTag: React.FC<IdentityTagProps> = ({ 
  expanded, 
  onToggle,
  configuration,
  onUpdateConfig,
  onPresetSelect, 
  totalPrice,
  onOpenPrice,
  activePart,
  setActivePart,
  activeTab,
  setActiveTab,
  conflict,
  onLoginRequest
}) => {
  const [folderTab, setFolderTab] = useState<FolderTab>('customize');
  const [hasChanges, setHasChanges] = useState(false);
  const [dropdown, setDropdown] = useState<DropdownState>({
    isOpen: false,
    componentLabel: '',
    attributeId: null,
    attributeLabel: ''
  });

  // Mobile State Logic
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMode, setMobileMode] = useState<'peek' | 'full'>('peek');

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset mobile mode when closed
  useEffect(() => {
    if (!expanded) {
      setMobileMode('peek');
    }
  }, [expanded]);

  // Height management - measure once, lock forever
  const COLLAPSED_HEIGHT = 245; // Must fully contain footer with pb-8 (32px)
  const [expandedHeight, setExpandedHeight] = useState<number | null>(null);
  const [hasMeasured, setHasMeasured] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Measure all tabs on first expand to find optimal height
  useEffect(() => {
    if (!expanded || hasMeasured) return;
    
    // Wait for content to render
    const measureTimeout = setTimeout(() => {
      if (contentRef.current) {
        // Get the scrollHeight which includes all content
        const contentHeight = contentRef.current.scrollHeight;
        // Add minimal breathing room - footer pb-8 already provides bottom space
        const optimalHeight = contentHeight + 8;
        // Cap at 85vh to never overflow screen
        const maxHeight = Math.floor(window.innerHeight * 0.85);
        const finalHeight = Math.min(optimalHeight, maxHeight);
        
        setExpandedHeight(finalHeight);
        setHasMeasured(true);
      }
    }, 100);
    
    return () => clearTimeout(measureTimeout);
  }, [expanded, hasMeasured]);
  
  // Fallback height while measuring
  const currentExpandedHeight = expandedHeight || Math.floor(window.innerHeight * 0.75);

  const getTargetHeight = () => {
    if (!expanded) return COLLAPSED_HEIGHT;
    if (isMobile) {
      return mobileMode === 'peek' ? window.innerHeight * 0.4 : currentExpandedHeight;
    }
    return currentExpandedHeight;
  };

  // Track if any changes have been made (for showing Save button)
  useEffect(() => {
    const hasAnyChange = Object.keys(DEFAULT_CONFIGURATION).some(key => {
      if (key === 'username') return false;
      return configuration[key as keyof ConfigurationState] !== DEFAULT_CONFIGURATION[key as keyof ConfigurationState];
    });
    setHasChanges(hasAnyChange);
  }, [configuration]);

  // Open dropdown for a specific attribute
  const openDropdown = (componentLabel: string, attributeId: keyof ConfigurationState, attributeLabel: string) => {
    setDropdown({
      isOpen: true,
      componentLabel,
      attributeId,
      attributeLabel
    });
  };

  // Close dropdown
  const closeDropdown = () => {
    setDropdown({
      isOpen: false,
      componentLabel: '',
      attributeId: null,
      attributeLabel: ''
    });
  };

  // Get options for current dropdown attribute
  const getDropdownOptions = () => {
    if (!dropdown.attributeId) return [];
    
    const allSteps = [...OPTION_GROUPS.handle.steps, ...OPTION_GROUPS.surface.steps];
    const step = allSteps.find(s => s.id === dropdown.attributeId);
    return step?.options || [];
  };

  // Handle option selection in dropdown
  const handleOptionSelect = (optionId: string) => {
    if (dropdown.attributeId) {
      onUpdateConfig(dropdown.attributeId, optionId);
      // Close dropdown after brief delay to show selection
      setTimeout(closeDropdown, TIMINGS.radioSelect);
    }
  };

  const handleTabClick = (tab: FolderTab) => {
    if (folderTab === tab) {
      onToggle();
    } else {
      setFolderTab(tab);
      if (!expanded) onToggle();
    }
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (!isMobile) return;
    
    const DRAG_THRESHOLD = 50;
    if (mobileMode === 'peek' && info.offset.y < -DRAG_THRESHOLD) {
      setMobileMode('full');
    } else if (mobileMode === 'full' && info.offset.y > DRAG_THRESHOLD) {
      setMobileMode('peek');
    }
  };

  return (
    <div className="relative flex flex-col items-start font-sans text-charcoal select-none z-50 w-full max-w-[360px] md:w-[360px]">
        
        {/* TABS ROW */}
        <div className="flex items-end w-full relative z-30">
            <TabButton 
                id="customize" 
                label="CUSTOMIZE"
                isActive={folderTab === 'customize'} 
                isExpanded={expanded}
                onClick={() => handleTabClick('customize')}
            />
            <TabButton 
                id="info" 
                label="INFO"
                isActive={folderTab === 'info'} 
                isExpanded={expanded}
                staggerDelay={TIMINGS.tabStagger.info}
                onClick={() => handleTabClick('info')}
            />
            <TabButton 
                id="community" 
                label="COMMUNITY"
                isActive={folderTab === 'community'} 
                isExpanded={expanded}
                staggerDelay={TIMINGS.tabStagger.community}
                onClick={() => handleTabClick('community')}
                isLast
            />
        </div>

        {/* FOLDER BODY */}
        <motion.div
            layout="size"
            initial={false}
            animate={{ 
                height: getTargetHeight(),
                opacity: 1
            }}
            transition={{
                height: {
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    mass: 0.8
                },
                opacity: { duration: 0.2 }
            }}
            className={`
                w-full bg-cream border-l border-r border-b border-charcoal shadow-2xl shadow-charcoal/10 z-20
                rounded-b-[24px] relative -mt-[1px] overflow-hidden flex flex-col
            `}
        >
             {/* Mobile Handle */}
             {isMobile && expanded && (
               <motion.div 
                  className="w-full flex justify-center pt-3 pb-1 touch-none cursor-grab active:cursor-grabbing z-50 bg-cream shrink-0"
                  drag="y"
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={0.2}
                  onDragEnd={handleDragEnd}
               >
                  <div className="w-12 h-1 bg-charcoal/20 rounded-full" />
               </motion.div>
             )}

             {/* Toggle Button */}
             <button 
                onClick={onToggle}
                className="absolute top-4 right-4 z-50 w-8 h-8 flex items-center justify-center hover:text-accent transition-colors text-charcoal"
            >
                {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} className="-rotate-90" />}
            </button>

             {/* Inner Content Container */}
             <div 
                ref={contentRef}
                className={`flex flex-col flex-1 overflow-hidden relative`}
             >
                 <div className="flex flex-col h-full p-4 pb-0 flex-1 overflow-y-auto no-scrollbar">
                <AnimatePresence mode="wait">
                    
                    {/* CUSTOMIZE TAB CONTENT */}
                    {folderTab === 'customize' && (
                        <motion.div
                            key="customize"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: TIMINGS.tabSwitch / 1000 }}
                            className="flex flex-col min-h-0"
                        >
                            <AnimatePresence mode="wait">
                                {!dropdown.isOpen ? (
                                    /* SUMMARY VIEW - Tree specification */
                                    <motion.div
                                        key="summary"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex flex-col"
                                    >
                                            {/* Header: ProductName by @username */}
                                            <div className="mb-4 pr-8 flex flex-col items-start transition-all shrink-0">
                                                <div>
                                                    <div className="flex items-baseline mb-2 flex-wrap gap-x-1.5">
                                                        <h3 className="font-serif text-3xl italic text-charcoal">Aurora</h3>
                                                        <div className="flex items-baseline">
                                                            <span className="font-serif text-xl italic text-charcoal mr-1.5">by</span>
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (configuration.username === 'Guest') {
                                                                        onLoginRequest();
                                                                    }
                                                                }}
                                                                className="font-serif text-xl italic text-charcoal hover:text-accent transition-colors relative group"
                                                            >
                                                                {configuration.username}
                                                                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-accent transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {/* Load Preset or Configure hint */}
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {PRESETS.map((preset) => (
                                                            <button
                                                                key={preset.name}
                                                                onClick={(e) => { e.stopPropagation(); onPresetSelect(preset.config); }}
                                                                className="px-3 py-1 border border-charcoal/30 rounded-sm font-serif italic text-xs tracking-wide capitalize hover:border-charcoal hover:bg-charcoal/5 transition-colors text-charcoal"
                                                            >
                                                                {preset.name}
                                                            </button>
                                                        ))}
                                                        <span className="font-serif italic text-charcoal/60 ml-2 text-sm">or configure below</span>
                                                </div>
                                                </div>
                                            </div>
                                            
                                            {/* TREE VIEW SPECIFICATION (Spec Section 3.2) */}
                                            {expanded && (
                                            <div className="space-y-5 mb-4 select-text pl-1 flex-1">
                                                
                                                {/* Group 1: Body */}
                                                <div>
                                                    <div className="mb-2">
                                                        <span className="font-mono text-xs font-medium uppercase tracking-widest text-black border-b-2 border-accent pb-0.5">Body</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <TreeRow 
                                                            indent label="Material" 
                                                            value={getOptionLabel('surfaceTexture', configuration.surfaceTexture)} 
                                                            isModified={isModified('surfaceTexture', configuration.surfaceTexture)}
                                                            onClick={() => openDropdown('Body', 'surfaceTexture', 'Material')}
                                                        />
                                                        <TreeRow 
                                                            indent label="Finish" 
                                                            value={getOptionLabel('surfaceTreatment', configuration.surfaceTreatment)} 
                                                            isModified={isModified('surfaceTreatment', configuration.surfaceTreatment)}
                                                            onClick={() => openDropdown('Body', 'surfaceTreatment', 'Finish')}
                                                        />
                                                        <TreeRow 
                                                            indent label="Print" 
                                                            value={getOptionLabel('surfacePrint', configuration.surfacePrint)}
                                                            isModified={isModified('surfacePrint', configuration.surfacePrint)}
                                                            onClick={() => openDropdown('Body', 'surfacePrint', 'Print')}
                                                        />
                                                        <TreeRow 
                                                            indent isLast label="Base" 
                                                            value="Standard" 
                                                        />
                                                    </div>
                                                </div>

                                                {/* Group 2: Handle */}
                                                <div>
                                                    <div className="mb-2">
                                                        <span className="font-mono text-xs font-medium uppercase tracking-widest text-black border-b-2 border-accent pb-0.5">Handle</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <TreeRow 
                                                            indent label="Type" 
                                                            value={getOptionLabel('handleMaterial', configuration.handleMaterial)} 
                                                            isModified={isModified('handleMaterial', configuration.handleMaterial)}
                                                            onClick={() => openDropdown('Handle', 'handleMaterial', 'Type')}
                                                        />
                                                        <TreeRow 
                                                            indent label="Length" 
                                                            value={getOptionLabel('handleSize', configuration.handleSize)} 
                                                            isModified={isModified('handleSize', configuration.handleSize)}
                                                            onClick={() => openDropdown('Handle', 'handleSize', 'Length')}
                                                        />
                                                        <TreeRow 
                                                            indent isLast label="Config" 
                                                            value={getOptionLabel('handleConfig', configuration.handleConfig)} 
                                                            isModified={isModified('handleConfig', configuration.handleConfig)}
                                                            onClick={() => openDropdown('Handle', 'handleConfig', 'Config')}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Group 3: Clasp */}
                                                <div>
                                                    <div className="mb-2">
                                                        <span className="font-mono text-xs font-medium uppercase tracking-widest text-black border-b-2 border-accent pb-0.5">Clasp</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <TreeRow 
                                                            indent isLast label="Type" 
                                                            value={getOptionLabel('surfaceHardware', configuration.surfaceHardware)} 
                                                            isModified={isModified('surfaceHardware', configuration.surfaceHardware)}
                                                            onClick={() => openDropdown('Clasp', 'surfaceHardware', 'Type')}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Group 4: Personalization */}
                                                <div>
                                                    <div className="mb-2">
                                                        <span className="font-mono text-xs font-medium uppercase tracking-widest text-black border-b-2 border-accent pb-0.5">Personalization</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <TreeRow 
                                                            indent isLast label="Monogram" 
                                                            value={getOptionLabel('handleText', configuration.handleText)} 
                                                            isModified={isModified('handleText', configuration.handleText)}
                                                            onClick={() => openDropdown('Personalization', 'handleText', 'Monogram')}
                                                        />
                                                    </div>
                                                </div>

                                            </div>
                                            )}
                                    </motion.div>
                                ) : (
                                    /* DROPDOWN VIEW - Options for specific attribute (Spec Section 11) */
                                    <motion.div
                                        key="dropdown"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ duration: TIMINGS.dropdownOpen / 1000 }}
                                        className="flex flex-col"
                                    >
                                        {/* Breadcrumb Navigation (Spec Section 11.2) */}
                                        <Breadcrumb 
                                          path={[dropdown.componentLabel, dropdown.attributeLabel]}
                                          onClose={closeDropdown}
                                        />

                                        {/* Options List - Grid Layout (Variant B) */}
                                        <div className="min-h-0 -mr-1">
                                            <div className="grid grid-cols-2 gap-3 px-1 pb-4">
                                                {getDropdownOptions().map((opt: any) => {
                                                    const isSelected = dropdown.attributeId && configuration[dropdown.attributeId] === opt.id;
                                                    return (
                                                        <button 
                                                            key={opt.id}
                                                            onClick={() => handleOptionSelect(opt.id)}
                                                            className={`
                                                                relative group w-full text-left flex flex-col
                                                                ${isSelected ? '' : 'hover:opacity-80'}
                                                            `}
                                                        >
                                                            {/* Large Preview */}
                                                            <div 
                                                                className={`w-full aspect-square mb-2 border ${isSelected ? 'border-charcoal border-2' : 'border-charcoal/10'}`}
                                                                style={{ background: getOptionPreviewStyle(dropdown.attributeId, opt.id) }}
                                                            />
                                                            
                                                            {/* Label */}
                                                            <span className={`font-mono text-[10px] uppercase tracking-widest mb-1 ${isSelected ? 'font-bold underline' : ''}`}>{opt.label}</span>
                                                            
                                                            {/* Price */}
                                                            {opt.price > 0 ? (
                                                                <span className="font-mono text-[10px] text-charcoal">+${opt.price}</span>
                                                            ) : (
                                                                <span className="font-mono text-[10px] text-charcoal/40">Included</span>
                                                            )}

                                                            {/* Checkmark Badge */}
                                                            {isSelected && (
                                                                <div className="absolute top-2 right-2 bg-charcoal text-cream p-1 shadow-sm">
                                                                    <Check size={12} />
                                                                </div>
                                                            )}
                                                        </button>
                                                    )
                                                })}
                                                        </div>
                                                        
                                            {/* Conflict Resolution - Kept same for now */}
                                            <AnimatePresence>
                                                {conflict && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                                    animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                                                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="bg-accent/5 border border-accent p-3 rounded-sm">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Info size={14} className="text-accent" />
                                                            <span className="text-xs font-mono text-charcoal">{conflict.message}</span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button onClick={conflict.optionA.action} className="flex-1 py-2 border border-charcoal text-charcoal font-mono text-[9px] uppercase tracking-wide hover:bg-charcoal hover:text-cream transition-colors rounded-sm">
                                                                {conflict.optionA.label}
                                                            </button>
                                                            <button onClick={conflict.optionB.action} className="flex-1 py-2 border border-charcoal/30 text-charcoal/70 font-mono text-[9px] uppercase tracking-wide hover:border-charcoal hover:text-charcoal transition-colors rounded-sm">
                                                                {conflict.optionB.label}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {/* INFO TAB CONTENT (Spec Section 10.2) */}
                    {folderTab === 'info' && (
                        <motion.div
                            key="info"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: TIMINGS.tabSwitch / 1000 }}
                            className="flex flex-col"
                        >
                            <div className="space-y-0 border-t border-charcoal mt-2">
                                {/* Order Details */}
                                <InfoAccordion title="Order Details" defaultOpen>
                                    <div className="grid grid-cols-2 gap-y-3 font-mono text-[10px] pt-2">
                                        <span className="uppercase text-charcoal/60">Serial_ID</span>
                                        <span className="text-right">#A-{Math.random().toString(36).substring(2, 7).toUpperCase()}</span>
                                        
                                        <span className="uppercase text-charcoal/60">Date</span>
                                        <span className="text-right">{new Date().toLocaleDateString()}</span>
                                        
                                        <span className="uppercase text-charcoal/60">Status</span>
                                        <span className="text-right">In Production</span>
                                        
                                        <span className="uppercase text-charcoal/60">ETA</span>
                                        <span className="text-right">5-7 Days</span>
                                    </div>
                                </InfoAccordion>

                                {/* Care Instructions */}
                                <InfoAccordion title="Care Instructions">
                                    <div className="pt-2">
                                        <p className="font-serif text-sm italic text-charcoal/80 mb-3">
                                            "Treat this piece as a companion. It will age and develop character alongside you."
                                        </p>
                                        <ul className="space-y-2 font-mono text-[10px] list-none text-charcoal/70">
                                            <li className="flex gap-3">
                                                <span>01.</span>
                                                <span>Clean with dry cloth only.</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <span>02.</span>
                                                <span>Condition leather monthly.</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <span>03.</span>
                                                <span>Store in provided dust bag.</span>
                                            </li>
                                    </ul>
                                        <button className="font-mono text-[9px] border-b border-charcoal mt-4 uppercase hover:text-accent transition-colors pb-0.5">
                                            Read Full Guide
                                        </button>
                                    </div>
                                </InfoAccordion>

                                {/* Materials */}
                                <InfoAccordion title="Materials">
                                    <div className="pt-2 space-y-4">
                                        <div>
                                            <span className="font-mono text-[9px] uppercase tracking-widest text-charcoal/50 block mb-1">Leather</span>
                                            <span className="font-serif text-lg text-charcoal block">Italian Vachetta</span>
                                            <p className="font-sans text-[10px] text-charcoal/60 mt-1 leading-relaxed">
                                                Vegetable-tanned in Tuscany. Selected for its ability to heal scratches and darken beautifully.
                                            </p>
                                </div>
                                        <div className="w-12 h-px bg-charcoal/20" />
                                        <div>
                                            <span className="font-mono text-[9px] uppercase tracking-widest text-charcoal/50 block mb-1">Hardware</span>
                                            <span className="font-serif text-lg text-charcoal block">Solid Brass</span>
                                            <p className="font-sans text-[10px] text-charcoal/60 mt-1 leading-relaxed">
                                                Unplated, solid metal sand-casted in Portugal. Will never chip, only burnish.
                                            </p>
                                        </div>
                                    </div>
                                </InfoAccordion>

                                {/* Warranty */}
                                <InfoAccordion title="Warranty">
                                    <div className="pt-2 flex justify-between items-center">
                                        <div>
                                            <span className="font-serif text-lg italic text-charcoal block">Lifetime Guarantee</span>
                                            <span className="font-mono text-[9px] uppercase tracking-widest text-charcoal/60 block mt-1">Structural Coverage</span>
                                        </div>
                                        <div className="border border-charcoal px-3 py-2">
                                            <Check size={14} strokeWidth={1.5} />
                                        </div>
                                    </div>
                                </InfoAccordion>
                            </div>
                        </motion.div>
                    )}

                    {/* COMMUNITY TAB CONTENT (Spec Section 10.3) */}
                    {folderTab === 'community' && (
                        <motion.div
                            key="community"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: TIMINGS.tabSwitch / 1000 }}
                            className="flex flex-col"
                        >
                            {/* Share & Earn */}
                            <div className="border border-charcoal/30 p-3 mb-4 flex items-center justify-between gap-3">
                                <p className="font-mono text-[10px] text-black leading-relaxed">
                                    Publish your design. Earn 10% when others order it.
                                </p>
                                <button className="px-3 py-1.5 border border-charcoal hover:bg-charcoal/5 transition-colors text-[9px] font-mono uppercase tracking-wide whitespace-nowrap flex items-center gap-1">
                                    <Share2 size={10} />
                                    Publish
                                </button>
                            </div>

                            {/* Design Card */}
                            <DesignCard 
                              name="Aurora - Navy"
                              author="MikeDesigns"
                              likes={234}
                              onLike={() => {}}
                              onRemix={() => {}}
                              onQuickBuy={() => {}}
                            />

                            {/* Swipe indicators */}
                            <div className="flex justify-center gap-8 my-3 items-center">
                                <button className="p-1 hover:bg-charcoal/5 rounded-full transition-colors">
                                    <ChevronLeft size={16} className="text-charcoal" />
                                </button>
                                <span className="font-mono text-[9px] text-charcoal/60">1 / 5</span>
                                <button className="p-1 hover:bg-charcoal/5 rounded-full transition-colors">
                                    <ChevronRight size={16} className="text-charcoal" />
                                </button>
                            </div>

                            {/* See All Designs */}
                            <button className="w-full py-2 border border-charcoal/30 rounded-sm font-mono text-[9px] uppercase tracking-widest text-charcoal hover:border-charcoal hover:bg-charcoal/5 transition-colors mb-4">
                                See All Designs
                            </button>
                        </motion.div>
                    )}

                </AnimatePresence>
             </div>

             {/* FOOTER - PINNED TO BOTTOM IN ALL STATES */}
             <div className="border-t border-charcoal bg-cream relative z-20 shrink-0 px-6 pt-4 pb-8">
                {/* ROW 1: SAVE | BREAKDOWN */}
                <div className="flex items-center justify-between pb-3 border-b border-charcoal mb-3">
                    <button className="px-4 py-1.5 border border-charcoal bg-transparent hover:bg-charcoal hover:text-cream transition-all font-mono text-[10px] uppercase tracking-widest">
                        Save
                    </button>
                    <button onClick={onOpenPrice} className="font-mono text-[10px] uppercase tracking-widest hover:text-accent transition-colors text-black">
                        BREAKDOWN
                    </button>
                </div>

                {/* ROW 2: ADD TO CART | PRICE */}
                <div className="flex items-center justify-between">
                    <button className="px-6 py-2 border border-charcoal bg-charcoal text-cream hover:bg-accent hover:border-accent transition-all font-mono text-xs uppercase tracking-widest font-medium">
                        Add to Cart
                    </button>
                    <span className="font-serif text-2xl font-bold text-black">
                        ${totalPrice}
                    </span>
                </div>
             </div>

             </div>
        </motion.div>
    </div>
  );
};
