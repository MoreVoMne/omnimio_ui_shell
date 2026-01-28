
import React, { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Upload, X, Trash2, Box, Image as ImageIcon, Columns, LayoutTemplate, Activity, Sparkles, Sticker, MapPin, ChevronDown } from 'lucide-react';
import { AdminViewMode, PartId } from '../types';

interface DecalEditorProps {
  enabled: boolean;
  hasImage: boolean;
  scale: number;
  rotation: number;
  targetMode: 'auto' | 'selected';
  onSetTargetMode: (mode: 'auto' | 'selected') => void;
  onSetEnabled: (enabled: boolean) => void;
  onUploadImage: (file: File) => void;
  onClear: () => void;
  onSetScale: (scale: number) => void;
  onSetRotation: (rotation: number) => void;
}

interface HotspotEditorProps {
  enabled: boolean;
  target: string;
  onSetEnabled: (enabled: boolean) => void;
  onSetTarget: (target: any) => void;
  onExport: () => void;
  onImport: () => void;
  onClear: () => void;
}

interface AdminControlsProps {
  isOpen: boolean;
  onToggle: () => void;
  onUploadModel: (file: File) => void;
  onUploadTexture: (file: File) => void;
  onClearModel: () => void;
  hasCustomModel: boolean;
  viewMode: AdminViewMode;
  onSetViewMode: (mode: AdminViewMode) => void;
  activePart: PartId | null;
  uiMode?: string;
  onSetUiMode?: (mode: string) => void;
  decalEditor?: DecalEditorProps;
  hotspotEditor?: HotspotEditorProps;
  embedded?: boolean;
}

const AdminSection: React.FC<{ 
  title: string; 
  children: React.ReactNode; 
  defaultOpen?: boolean; 
  id: string;
}> = ({ title, children, defaultOpen = false, id }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="mb-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full border-b border-charcoal pb-2 mb-4 group"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-charcoal group-hover:text-charcoal/60 transition-colors">
          {title}
        </span>
        <ChevronDown 
          size={14} 
          className={`text-charcoal transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export const AdminControls: React.FC<AdminControlsProps> = ({
  isOpen,
  onToggle,
  onUploadModel,
  onUploadTexture,
  onClearModel,
  hasCustomModel,
  viewMode,
  onSetViewMode,
  activePart,
  uiMode,
  onSetUiMode,
  decalEditor,
  hotspotEditor,
  embedded
}) => {
  const modelInputRef = useRef<HTMLInputElement>(null);
  const textureInputRef = useRef<HTMLInputElement>(null);
  const decalInputRef = useRef<HTMLInputElement>(null);

  const handleModelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onUploadModel(file);
  };

  const handleTextureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onUploadTexture(file);
  };

  const uiModeGroups = useMemo(() => {
    const concepts = [
      { value: 'omni', label: 'Omni' },
      { value: 'panel', label: 'Panel' },
      { value: 'sentence', label: 'Sentence' },
      { value: 'margins', label: 'Margins' },
      { value: 'fullstory', label: 'Full Story' },
      { value: 'unified', label: 'Unified' },
      { value: 'complete', label: 'Complete' },
      { value: 'drawer', label: 'Drawer' },
      { value: 'accordion', label: 'Accordion' },
      { value: 'bridge', label: 'Bridge' },
      { value: 'chapters', label: 'Chapters' },
      { value: 'fourcorners', label: 'Four Corners' },
    ];
    const layouts = [
      { value: 'cards', label: 'Cards' },
      { value: 'tree', label: 'Tree' },
      { value: 'split', label: 'Split' },
      { value: 'sentence-alt', label: 'Sentence Alt' },
      { value: 'ontology', label: 'Ontology' },
      { value: 'styleguide', label: 'Style Guide' },
    ];
    return { concepts, layouts };
  }, []);

  const handleDecalImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && decalEditor?.onUploadImage) decalEditor.onUploadImage(file);
  };

  const PanelSections = (
    <div className="space-y-2">
      
      {/* 01. INTERFACE */}
      {uiMode && onSetUiMode && (
        <AdminSection title="01. Interface" id="interface">
          <div className="space-y-6 pb-4">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-charcoal/80 block mb-3">Concept</span>
              <div className="grid grid-cols-2 gap-2">
                {uiModeGroups.concepts.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onSetUiMode(opt.value)}
                    className={[
                      'text-left px-3 py-2 text-[10px] uppercase tracking-[0.1em] font-mono transition-all border rounded-none',
                      uiMode === opt.value
                        ? 'bg-charcoal text-cream border-charcoal'
                        : 'bg-transparent text-charcoal border-charcoal/20 hover:border-charcoal'
                    ].join(' ')}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-charcoal/80 block mb-3">Layout Engine</span>
              <div className="grid grid-cols-2 gap-2">
                {uiModeGroups.layouts.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onSetUiMode(opt.value)}
                    className={[
                      'text-left px-3 py-2 text-[10px] uppercase tracking-[0.1em] font-mono transition-all border rounded-none',
                      uiMode === opt.value
                        ? 'bg-charcoal text-cream border-charcoal'
                        : 'bg-transparent text-charcoal border-charcoal/20 hover:border-charcoal'
                    ].join(' ')}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </AdminSection>
      )}

      {/* 02. VIEWPORT */}
      <AdminSection title="02. Viewport" id="viewport">
        <div className="grid grid-cols-3 gap-0 border border-charcoal mb-4">
          <button
            onClick={() => onSetViewMode('3d')}
            className={`py-3 flex items-center justify-center transition-all border-r border-charcoal last:border-r-0 ${
                viewMode === '3d' 
                ? 'bg-charcoal text-cream' 
                : 'bg-transparent text-charcoal/80 hover:text-charcoal hover:bg-white'
            }`}
            title="3D Only"
          >
            <Box size={14} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => onSetViewMode('split')}
            className={`py-3 flex items-center justify-center transition-all border-r border-charcoal last:border-r-0 ${
                viewMode === 'split' 
                ? 'bg-charcoal text-cream' 
                : 'bg-transparent text-charcoal/80 hover:text-charcoal hover:bg-white'
            }`}
            title="Split View"
          >
            <Columns size={14} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => onSetViewMode('2d')}
            className={`py-3 flex items-center justify-center transition-all border-r border-charcoal last:border-r-0 ${
                viewMode === '2d' 
                ? 'bg-charcoal text-cream' 
                : 'bg-transparent text-charcoal/80 hover:text-charcoal hover:bg-white'
            }`}
            title="2D Map Only"
          >
            <LayoutTemplate size={14} strokeWidth={1.5} />
          </button>
        </div>
      </AdminSection>

      {/* 03. ASSETS */}
      <AdminSection title="03. Assets" id="assets">
        <div className="space-y-4 pb-4">
            {/* Model Upload */}
            <div>
                {!hasCustomModel ? (
                <button
                    onClick={() => modelInputRef.current?.click()}
                    className="w-full border border-dashed border-charcoal p-6 flex flex-col items-center gap-3 hover:bg-white hover:border-charcoal transition-all group"
                >
                    <Upload size={16} strokeWidth={1} className="text-charcoal transition-colors" />
                    <span className="font-mono text-[9px] text-charcoal group-hover:text-charcoal/60 uppercase tracking-[0.2em]">Upload .GLB Model</span>
                </button>
                ) : (
                <div className="flex items-center justify-between p-3 border border-charcoal/20 bg-white">
                    <div className="flex items-center gap-3">
                        <Box size={14} strokeWidth={1.5} className="text-charcoal" />
                        <span className="font-mono text-[10px] uppercase tracking-widest text-charcoal">Custom Model Loaded</span>
                    </div>
                    <button
                        onClick={onClearModel}
                        className="text-charcoal/60 hover:text-accent transition-colors"
                    >
                        <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                </div>
                )}
                <input type="file" ref={modelInputRef} onChange={handleModelChange} accept=".glb,.gltf" className="hidden" />
            </div>

            {/* Texture Map Upload */}
            {(viewMode === '2d' || viewMode === 'split') && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <button
                    onClick={() => textureInputRef.current?.click()}
                    className="w-full flex items-center justify-between p-3 border border-dashed border-charcoal hover:border-charcoal hover:bg-white transition-all group"
                >
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-charcoal group-hover:text-charcoal/60">Texture Map</span>
                    <ImageIcon size={14} strokeWidth={1.5} className="text-charcoal" />
                </button>
                <input type="file" ref={textureInputRef} onChange={handleTextureChange} accept="image/*" className="hidden" />
                </motion.div>
            )}
        </div>
      </AdminSection>

      {/* 04. TOOLS (Decals & Hotspots) */}
      {(decalEditor || hotspotEditor) && (
        <AdminSection title="04. Tools" id="tools">
          <div className="space-y-8 pb-4">
            {decalEditor && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-charcoal">Decal Placement</span>
                        <button
                            onClick={() => decalEditor.onSetEnabled(!decalEditor.enabled)}
                            className={`w-3 h-3 border border-charcoal ${decalEditor.enabled ? 'bg-charcoal' : 'bg-transparent'}`}
                        />
                    </div>

                    {decalEditor.enabled && (
                        <div className="space-y-3 pl-4 border-l border-charcoal">
                            <button
                                onClick={() => decalInputRef.current?.click()}
                                className="w-full text-left font-mono text-[9px] uppercase tracking-widest text-charcoal hover:text-charcoal/60 hover:underline decoration-accent underline-offset-4 transition-all"
                            >
                                {decalEditor.hasImage ? 'Replace Image' : '+ Upload Image'}
                            </button>
                            <input type="file" ref={decalInputRef} onChange={handleDecalImageChange} accept="image/*" className="hidden" />

                            <div className="flex gap-4 pt-2">
                                <button
                                    onClick={() => decalEditor.onSetTargetMode('auto')}
                                    className={`font-mono text-[9px] uppercase tracking-widest transition-colors ${decalEditor.targetMode === 'auto' ? 'text-charcoal underline decoration-accent underline-offset-4' : 'text-charcoal/60 hover:text-charcoal'}`}
                                >
                                    Auto Target
                                </button>
                                <button
                                    onClick={() => decalEditor.onSetTargetMode('selected')}
                                    className={`font-mono text-[9px] uppercase tracking-widest transition-colors ${decalEditor.targetMode === 'selected' ? 'text-charcoal underline decoration-accent underline-offset-4' : 'text-charcoal/60 hover:text-charcoal'}`}
                                >
                                    Selected Only
                                </button>
                            </div>
                            
                            <button
                                onClick={decalEditor.onClear}
                                className="text-left font-mono text-[9px] uppercase tracking-widest text-charcoal/60 hover:text-accent transition-colors pt-2"
                            >
                                Clear All
                            </button>
                        </div>
                    )}
                </div>
            )}

            {hotspotEditor && (
                <div>
                     <div className="flex items-center justify-between mb-4">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-charcoal">Hotspot Editor</span>
                        <button
                            onClick={() => hotspotEditor.onSetEnabled(!hotspotEditor.enabled)}
                            className={`w-3 h-3 border border-charcoal ${hotspotEditor.enabled ? 'bg-charcoal' : 'bg-transparent'}`}
                        />
                    </div>

                    {hotspotEditor.enabled && (
                        <div className="space-y-3 pl-4 border-l border-charcoal">
                            <div className="flex gap-4">
                                <button
                                    onClick={hotspotEditor.onExport}
                                    className="font-mono text-[9px] uppercase tracking-widest text-charcoal hover:text-charcoal/60 transition-colors"
                                >
                                    Export JSON
                                </button>
                                <button
                                    onClick={hotspotEditor.onImport}
                                    className="font-mono text-[9px] uppercase tracking-widest text-charcoal hover:text-charcoal/60 transition-colors"
                                >
                                    Import JSON
                                </button>
                            </div>
                             <button
                                onClick={hotspotEditor.onClear}
                                className="text-left font-mono text-[9px] uppercase tracking-widest text-charcoal/60 hover:text-accent transition-colors pt-2"
                            >
                                Clear All
                            </button>
                        </div>
                    )}
                </div>
            )}
          </div>
        </AdminSection>
      )}

      {/* 05. TELEMETRY */}
      <section className="pt-4 mt-4 border-t border-charcoal">
        <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-charcoal/80 space-y-1">
          <div className="flex justify-between">
            <span className="opacity-60">Render Engine</span>
            <span>WebGL 2.0</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-60">Camera</span>
            <span>Perspective</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-60">Asset Source</span>
            <span>{hasCustomModel ? 'External' : 'Procedural'}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-60">Active Node</span>
            <span className={activePart ? 'text-charcoal' : ''}>
              {activePart ? activePart.substring(0, 12) : 'Idle'}
            </span>
          </div>
        </div>
      </section>
    </div>
  );

  if (embedded) {
    return <div className="font-sans">{PanelSections}</div>;
  }

  return (
    // THE ANCHOR: Positioned absolutely at bottom-left
    <div className="absolute bottom-6 left-6 z-50 flex items-end gap-2 font-sans">
      {/* THE POP-UP PANEL */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            // Origin ensures it grows OUT of the button
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            className="bg-paper border border-charcoal p-6 w-80 mb-4 absolute bottom-full left-0 origin-bottom-left shadow-hard rounded-none max-h-[80vh] overflow-y-auto no-scrollbar"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Settings size={14} strokeWidth={1.5} className="text-charcoal/40" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-charcoal/40">v2.0 / Studio</span>
                </div>
                <h2 className="font-serif text-3xl italic text-charcoal">Admin Studio</h2>
                <div className="w-10 h-[2px] bg-accent mt-3" />
              </div>
              <button onClick={onToggle} className="text-charcoal/30 hover:text-charcoal transition-colors p-1">
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            {PanelSections}
          </motion.div>
        )}
      </AnimatePresence>

      {/* THE TRIGGER BUTTON */}
      <button
        onClick={onToggle}
        className={`
          w-12 h-12 rounded-full flex items-center justify-center border transition-all shadow-hard active:scale-95
          ${isOpen ? 'bg-charcoal text-cream border-charcoal' : 'bg-paper text-charcoal border-charcoal hover:bg-white'}
        `}
      >
        <Settings size={20} strokeWidth={1.5} />
      </button>
    </div>
  );
};
