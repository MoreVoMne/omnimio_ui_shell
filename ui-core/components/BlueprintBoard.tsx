// BlueprintBoard.tsx - "Teach the Product" Merchant Wizard
// Mirrors the customer SpecSentence UI for merchant configuration
// Each card represents a capability area with editable token sentences

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Layers, Palette, MapPin, Calculator, ChevronRight, Check, AlertCircle, Plus, X, Eye, EyeOff } from 'lucide-react';

// ==== TYPES ====

interface MerchantToken {
  id: string;
  type: 'model' | 'part' | 'option' | 'zone' | 'method' | 'rule' | 'price' | 'action';
  label: string;
  value: string;
  placeholder?: string;
  isConfigured: boolean;
  isRequired: boolean;
  linkedMesh?: string;
  editorType: 'upload' | 'multi-select' | 'toggle' | 'rule-builder' | 'price-formula' | 'zone-draw' | 'text';
  options?: { id: string; label: string; icon?: string }[];
  validation?: {
    isValid: boolean;
    message?: string;
  };
}

interface CapabilitySentence {
  id: string;
  template: string; // "This product uses [model] with parts [parts]"
  tokens: MerchantToken[];
}

interface BlueprintCard {
  id: string;
  title: string;
  icon: React.ReactNode;
  sentences: CapabilitySentence[];
  isComplete: boolean;
  isExpanded: boolean;
}

interface BlueprintBoardProps {
  productName?: string;
  onComplete: () => void;
  onBack: () => void;
  initialModelUrl?: string;
}

// ==== MOCK DATA - Production would come from backend ====

const createInitialCards = (productName: string): BlueprintCard[] => [
  {
    id: 'structure',
    title: 'Structure',
    icon: <Layers size={14} strokeWidth={1.5} />,
    isComplete: false,
    isExpanded: true,
    sentences: [
      {
        id: 'structure-main',
        template: `${productName} uses [model] with parts [parts].`,
        tokens: [
          {
            id: 'token-model',
            type: 'model',
            label: 'Model File',
            value: '',
            placeholder: 'Upload .glb',
            isConfigured: false,
            isRequired: true,
            editorType: 'upload',
            validation: { isValid: false, message: 'Model required' }
          },
          {
            id: 'token-parts',
            type: 'part',
            label: 'Parts',
            value: '',
            placeholder: 'Define parts',
            isConfigured: false,
            isRequired: true,
            editorType: 'multi-select',
            options: [
              { id: 'body', label: 'Body' },
              { id: 'handle', label: 'Handle' },
              { id: 'hardware', label: 'Hardware' },
              { id: 'strap', label: 'Strap' },
              { id: 'lining', label: 'Lining' },
              { id: 'pocket', label: 'Pocket' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'customizations',
    title: 'Customizations',
    icon: <Palette size={14} strokeWidth={1.5} />,
    isComplete: false,
    isExpanded: false,
    sentences: [
      {
        id: 'custom-main',
        template: 'Customers can [swap-parts] on [swap-targets], change [materials] on [material-targets], and adjust [size].',
        tokens: [
          {
            id: 'token-swap',
            type: 'option',
            label: 'Swap Parts',
            value: '',
            placeholder: 'swap parts',
            isConfigured: false,
            isRequired: false,
            editorType: 'toggle'
          },
          {
            id: 'token-swap-targets',
            type: 'part',
            label: 'Swappable Parts',
            value: '',
            placeholder: 'select parts',
            isConfigured: false,
            isRequired: false,
            editorType: 'multi-select',
            options: [
              { id: 'handle', label: 'Handle' },
              { id: 'hardware', label: 'Hardware' },
              { id: 'strap', label: 'Strap' }
            ]
          },
          {
            id: 'token-materials',
            type: 'option',
            label: 'Materials',
            value: '',
            placeholder: 'materials',
            isConfigured: false,
            isRequired: true,
            editorType: 'multi-select',
            options: [
              { id: 'leather', label: 'Leather' },
              { id: 'fabric', label: 'Fabric' },
              { id: 'vegan', label: 'Vegan Leather' },
              { id: 'suede', label: 'Suede' }
            ]
          },
          {
            id: 'token-material-targets',
            type: 'part',
            label: 'Material Parts',
            value: '',
            placeholder: 'all parts',
            isConfigured: false,
            isRequired: false,
            editorType: 'multi-select',
            options: [
              { id: 'body', label: 'Body' },
              { id: 'handle', label: 'Handle' },
              { id: 'lining', label: 'Lining' }
            ]
          },
          {
            id: 'token-size',
            type: 'option',
            label: 'Size',
            value: '',
            placeholder: 'size options',
            isConfigured: false,
            isRequired: false,
            editorType: 'multi-select',
            options: [
              { id: 'small', label: 'Small' },
              { id: 'medium', label: 'Medium' },
              { id: 'large', label: 'Large' },
              { id: 'custom', label: 'Custom Dimensions' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'zones',
    title: 'Zones & Artwork',
    icon: <MapPin size={14} strokeWidth={1.5} />,
    isComplete: false,
    isExpanded: false,
    sentences: [
      {
        id: 'zones-main',
        template: 'Artwork allowed on [zones] as [methods], max [area] area.',
        tokens: [
          {
            id: 'token-zones',
            type: 'zone',
            label: 'Design Zones',
            value: '',
            placeholder: 'define zones',
            isConfigured: false,
            isRequired: false,
            editorType: 'zone-draw',
            linkedMesh: 'body'
          },
          {
            id: 'token-methods',
            type: 'method',
            label: 'Methods',
            value: '',
            placeholder: 'print/emboss',
            isConfigured: false,
            isRequired: false,
            editorType: 'multi-select',
            options: [
              { id: 'print', label: 'Digital Print' },
              { id: 'emboss', label: 'Emboss' },
              { id: 'deboss', label: 'Deboss' },
              { id: 'foil', label: 'Hot Foil' },
              { id: 'engrave', label: 'Laser Engrave' }
            ]
          },
          {
            id: 'token-area',
            type: 'option',
            label: 'Max Area',
            value: '',
            placeholder: 'A4',
            isConfigured: false,
            isRequired: false,
            editorType: 'multi-select',
            options: [
              { id: 'a6', label: 'A6 (105×148mm)' },
              { id: 'a5', label: 'A5 (148×210mm)' },
              { id: 'a4', label: 'A4 (210×297mm)' },
              { id: 'full', label: 'Full Zone' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'rules',
    title: 'Rules & Pricing',
    icon: <Calculator size={14} strokeWidth={1.5} />,
    isComplete: false,
    isExpanded: false,
    sentences: [
      {
        id: 'rules-condition',
        template: 'If [condition], then [action].',
        tokens: [
          {
            id: 'token-condition',
            type: 'rule',
            label: 'Condition',
            value: '',
            placeholder: 'material is dark',
            isConfigured: false,
            isRequired: false,
            editorType: 'rule-builder'
          },
          {
            id: 'token-action',
            type: 'rule',
            label: 'Action',
            value: '',
            placeholder: 'disable print',
            isConfigured: false,
            isRequired: false,
            editorType: 'rule-builder'
          }
        ]
      },
      {
        id: 'rules-pricing',
        template: 'Price = [base] + [materials] + [finishes] + [artwork].',
        tokens: [
          {
            id: 'token-base',
            type: 'price',
            label: 'Base Price',
            value: '',
            placeholder: '£0',
            isConfigured: false,
            isRequired: true,
            editorType: 'text'
          },
          {
            id: 'token-mat-price',
            type: 'price',
            label: 'Materials',
            value: '',
            placeholder: 'per material',
            isConfigured: false,
            isRequired: false,
            editorType: 'price-formula'
          },
          {
            id: 'token-finish-price',
            type: 'price',
            label: 'Finishes',
            value: '',
            placeholder: 'per finish',
            isConfigured: false,
            isRequired: false,
            editorType: 'price-formula'
          },
          {
            id: 'token-art-price',
            type: 'price',
            label: 'Artwork',
            value: '',
            placeholder: 'per area',
            isConfigured: false,
            isRequired: false,
            editorType: 'price-formula'
          }
        ]
      }
    ]
  }
];

// ==== HELPER COMPONENTS ====

// Token Chip - Interactive element in sentences
const TokenChip: React.FC<{
  token: MerchantToken;
  isActive: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  onHover: (hovering: boolean) => void;
}> = ({ token, isActive, isHighlighted, onClick, onHover }) => {
  const getStatusColor = () => {
    if (!token.isRequired && !token.isConfigured) return 'border-charcoal/20 text-charcoal/40';
    if (token.isConfigured) return 'border-emerald-600/40 text-charcoal bg-emerald-50/50';
    if (token.validation && !token.validation.isValid) return 'border-accent/40 text-charcoal bg-accent/5';
    return 'border-charcoal/30 text-charcoal';
  };

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className={`
        inline-flex items-center gap-1.5 px-2 py-0.5 mx-0.5
        border rounded-sm font-mono text-[11px] uppercase tracking-wide
        transition-all duration-200 cursor-pointer
        ${getStatusColor()}
        ${isActive ? 'ring-2 ring-charcoal ring-offset-1' : ''}
        ${isHighlighted ? 'bg-charcoal/5 scale-105' : ''}
        hover:border-charcoal hover:bg-charcoal/5
      `}
      whileTap={{ scale: 0.98 }}
    >
      {token.isConfigured && <Check size={10} className="text-emerald-600" />}
      {!token.isConfigured && token.isRequired && <AlertCircle size={10} className="text-accent/60" />}
      <span>{token.value || token.placeholder}</span>
    </motion.button>
  );
};

// Sentence Renderer - Parses template and inserts tokens
const SentenceRenderer: React.FC<{
  sentence: CapabilitySentence;
  activeTokenId: string | null;
  highlightedTokenId: string | null;
  onTokenClick: (token: MerchantToken) => void;
  onTokenHover: (tokenId: string | null) => void;
}> = ({ sentence, activeTokenId, highlightedTokenId, onTokenClick, onTokenHover }) => {
  // Parse template and insert tokens
  const parts = sentence.template.split(/\[([^\]]+)\]/);
  
  return (
    <div className="font-serif text-base leading-relaxed text-charcoal/80 italic">
      {parts.map((part, i) => {
        // Even indices are text, odd indices are token placeholders
        if (i % 2 === 0) {
          return <span key={i}>{part}</span>;
        }
        
        // Find matching token
        const token = sentence.tokens.find(t => 
          t.id.includes(part.toLowerCase().replace(/[^a-z]/g, '')) ||
          t.placeholder?.toLowerCase().includes(part.toLowerCase())
        );
        
        if (!token) {
          // Fallback: just show the placeholder text
          return <span key={i} className="text-charcoal/40">[{part}]</span>;
        }
        
        return (
          <TokenChip
            key={token.id}
            token={token}
            isActive={activeTokenId === token.id}
            isHighlighted={highlightedTokenId === token.id}
            onClick={() => onTokenClick(token)}
            onHover={(h) => onTokenHover(h ? token.id : null)}
          />
        );
      })}
    </div>
  );
};

// Card Component
const BlueprintCardComponent: React.FC<{
  card: BlueprintCard;
  activeTokenId: string | null;
  highlightedTokenId: string | null;
  onToggleExpand: () => void;
  onTokenClick: (token: MerchantToken) => void;
  onTokenHover: (tokenId: string | null) => void;
}> = ({ card, activeTokenId, highlightedTokenId, onToggleExpand, onTokenClick, onTokenHover }) => {
  const _configuredCount = card.sentences.flatMap(s => s.tokens).filter(t => t.isConfigured).length;
  const requiredCount = card.sentences.flatMap(s => s.tokens).filter(t => t.isRequired).length;
  const configuredRequiredCount = card.sentences.flatMap(s => s.tokens).filter(t => t.isRequired && t.isConfigured).length;

  return (
    <div className="border border-charcoal/15 bg-cream">
      {/* Card Header */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between p-4 hover:bg-white/50 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <span className="text-charcoal/50 group-hover:text-charcoal transition-colors">
            {card.icon}
          </span>
          <span className="font-mono text-[11px] uppercase tracking-widest text-charcoal font-medium">
            {card.title}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Status Badge */}
          {card.isComplete ? (
            <span className="flex items-center gap-1 text-emerald-600 font-mono text-[9px] uppercase tracking-widest">
              <Check size={10} />
              Complete
            </span>
          ) : requiredCount > 0 ? (
            <span className="font-mono text-[9px] uppercase tracking-widest text-charcoal/40">
              {configuredRequiredCount}/{requiredCount} required
            </span>
          ) : (
            <span className="font-mono text-[9px] uppercase tracking-widest text-charcoal/30">
              Optional
            </span>
          )}
          
          {/* Expand Arrow */}
          <motion.div
            animate={{ rotate: card.isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-charcoal/30 group-hover:text-charcoal transition-colors"
          >
            <ChevronRight size={14} />
          </motion.div>
        </div>
      </button>
      
      {/* Card Content */}
      <AnimatePresence>
        {card.isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-charcoal/10 pt-3">
              {card.sentences.map(sentence => (
                <SentenceRenderer
                  key={sentence.id}
                  sentence={sentence}
                  activeTokenId={activeTokenId}
                  highlightedTokenId={highlightedTokenId}
                  onTokenClick={onTokenClick}
                  onTokenHover={onTokenHover}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Token Editor Panel - Opens when a token is clicked
const TokenEditor: React.FC<{
  token: MerchantToken;
  onClose: () => void;
  onSave: (tokenId: string, value: string, selectedOptions?: string[]) => void;
}> = ({ token, onClose, onSave }) => {
  const [inputValue, setInputValue] = useState(token.value);
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    token.value ? token.value.split(', ').map(v => v.toLowerCase().replace(/\s/g, '-')) : []
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOptionToggle = (optionId: string) => {
    setSelectedOptions(prev => 
      prev.includes(optionId) 
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  const handleSave = () => {
    if (token.editorType === 'multi-select' && token.options) {
      const labels = selectedOptions
        .map(id => token.options?.find(o => o.id === id)?.label)
        .filter(Boolean)
        .join(', ');
      onSave(token.id, labels, selectedOptions);
    } else if (token.editorType === 'upload') {
      // File upload handled separately
      onSave(token.id, inputValue);
    } else {
      onSave(token.id, inputValue);
    }
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInputValue(file.name);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-x-4 bottom-4 bg-cream border border-charcoal shadow-xl z-50 max-h-[60%] overflow-hidden flex flex-col"
    >
      {/* Editor Header */}
      <div className="flex items-center justify-between p-4 border-b border-charcoal/10">
        <div>
          <h3 className="font-mono text-[11px] uppercase tracking-widest text-charcoal/50">
            Configure
          </h3>
          <p className="font-serif text-lg italic text-charcoal mt-0.5">
            {token.label}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-charcoal/5 rounded-sm transition-colors"
        >
          <X size={16} className="text-charcoal/50" />
        </button>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Upload Editor */}
        {token.editorType === 'upload' && (
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-charcoal/30 hover:border-charcoal hover:bg-white p-8 flex flex-col items-center justify-center cursor-pointer transition-all"
            >
              <Upload size={24} className="text-charcoal/40 mb-3" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60">
                {inputValue || 'Drop .GLB file or click to browse'}
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".glb,.gltf"
              onChange={handleFileChange}
              className="hidden"
            />
            
            {/* Requirements */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Format', value: '.GLB / .GLTF' },
                { label: 'Max Size', value: '≤50MB' },
                { label: 'UV Map', value: 'Required' },
                { label: 'Materials', value: 'PBR' }
              ].map((req, i) => (
                <div key={i} className="border border-charcoal/10 p-2 bg-white/50">
                  <div className="font-mono text-[8px] uppercase tracking-widest text-charcoal/40">{req.label}</div>
                  <div className="font-mono text-[10px] text-charcoal">{req.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Multi-Select Editor */}
        {token.editorType === 'multi-select' && token.options && (
          <div className="space-y-2">
            {token.options.map(option => (
              <button
                key={option.id}
                onClick={() => handleOptionToggle(option.id)}
                className={`
                  w-full flex items-center justify-between p-3 border transition-all
                  ${selectedOptions.includes(option.id)
                    ? 'border-charcoal bg-charcoal text-cream'
                    : 'border-charcoal/20 hover:border-charcoal hover:bg-white'
                  }
                `}
              >
                <span className="font-mono text-[11px] uppercase tracking-wider">
                  {option.label}
                </span>
                {selectedOptions.includes(option.id) && <Check size={14} />}
              </button>
            ))}
          </div>
        )}

        {/* Text Input Editor */}
        {token.editorType === 'text' && (
          <div>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={token.placeholder}
              className="w-full border border-charcoal/20 px-4 py-3 font-mono text-sm focus:border-charcoal focus:outline-none transition-colors bg-transparent"
            />
          </div>
        )}

        {/* Rule Builder Placeholder */}
        {token.editorType === 'rule-builder' && (
          <div className="border border-dashed border-charcoal/20 p-6 text-center">
            <span className="font-mono text-[10px] uppercase tracking-widest text-charcoal/40">
              Rule Builder — Coming in P1
            </span>
          </div>
        )}

        {/* Price Formula Placeholder */}
        {token.editorType === 'price-formula' && (
          <div className="space-y-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="e.g., +£15 per selection"
              className="w-full border border-charcoal/20 px-4 py-3 font-mono text-sm focus:border-charcoal focus:outline-none transition-colors bg-transparent"
            />
            <div className="font-mono text-[9px] uppercase tracking-widest text-charcoal/40">
              Tip: Use formulas like "base × 1.2" or "area × £2.50"
            </div>
          </div>
        )}

        {/* Zone Draw Placeholder */}
        {token.editorType === 'zone-draw' && (
          <div className="border border-dashed border-charcoal/20 p-6 text-center">
            <MapPin size={24} className="mx-auto mb-3 text-charcoal/30" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-charcoal/40">
              3D Zone Drawing Tool — Coming Soon
            </span>
            <p className="font-mono text-[9px] text-charcoal/30 mt-2">
              For now, zones will be auto-detected from UV islands
            </p>
          </div>
        )}

        {/* Toggle Editor */}
        {token.editorType === 'toggle' && (
          <div className="flex items-center justify-between p-4 border border-charcoal/20">
            <span className="font-mono text-[11px] uppercase tracking-wider">
              Enable {token.label}
            </span>
            <button
              onClick={() => setInputValue(inputValue === 'enabled' ? '' : 'enabled')}
              className={`
                w-12 h-6 rounded-full transition-all relative
                ${inputValue === 'enabled' ? 'bg-charcoal' : 'bg-charcoal/20'}
              `}
            >
              <motion.div
                animate={{ x: inputValue === 'enabled' ? 24 : 2 }}
                className="absolute top-1 w-4 h-4 bg-cream rounded-full shadow"
              />
            </button>
          </div>
        )}
      </div>

      {/* Editor Footer */}
      <div className="flex items-center justify-end gap-2 p-4 border-t border-charcoal/10 bg-white/30">
        <button
          onClick={onClose}
          className="px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-charcoal/60 hover:text-charcoal transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-charcoal text-cream font-mono text-[10px] uppercase tracking-widest hover:bg-charcoal/90 transition-colors"
        >
          Apply
        </button>
      </div>
    </motion.div>
  );
};

// ==== MAIN COMPONENT ====

export const BlueprintBoard: React.FC<BlueprintBoardProps> = ({
  productName = 'New Product',
  onComplete,
  onBack,
  initialModelUrl: _initialModelUrl
}) => {
  // State
  const [cards, setCards] = useState<BlueprintCard[]>(() => createInitialCards(productName));
  const [activeToken, setActiveToken] = useState<MerchantToken | null>(null);
  const [highlightedTokenId, setHighlightedTokenId] = useState<string | null>(null);
  const [highlightedMesh, setHighlightedMesh] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Calculate completion status
  const totalRequired = cards.flatMap(c => c.sentences.flatMap(s => s.tokens)).filter(t => t.isRequired).length;
  const completedRequired = cards.flatMap(c => c.sentences.flatMap(s => s.tokens)).filter(t => t.isRequired && t.isConfigured).length;
  const isReadyToPublish = completedRequired >= totalRequired;

  // Handlers
  const handleCardToggle = useCallback((cardId: string) => {
    setCards(prev => prev.map(card => ({
      ...card,
      isExpanded: card.id === cardId ? !card.isExpanded : card.isExpanded
    })));
  }, []);

  const handleTokenClick = useCallback((token: MerchantToken) => {
    setActiveToken(token);
    // Focus 3D on linked mesh
    if (token.linkedMesh) {
      setHighlightedMesh(token.linkedMesh);
    }
  }, []);

  const handleTokenHover = useCallback((tokenId: string | null) => {
    setHighlightedTokenId(tokenId);
    // Find token and highlight mesh
    if (tokenId) {
      const token = cards.flatMap(c => c.sentences.flatMap(s => s.tokens)).find(t => t.id === tokenId);
      if (token?.linkedMesh) {
        setHighlightedMesh(token.linkedMesh);
      }
    } else {
      setHighlightedMesh(null);
    }
  }, [cards]);

  const handleTokenSave = useCallback((tokenId: string, value: string, _selectedOptions?: string[]) => {
    setCards(prev => prev.map(card => ({
      ...card,
      sentences: card.sentences.map(sentence => ({
        ...sentence,
        tokens: sentence.tokens.map(token => 
          token.id === tokenId
            ? { ...token, value, isConfigured: !!value, validation: { isValid: !!value } }
            : token
        )
      })),
      isComplete: card.sentences.every(s => 
        s.tokens.filter(t => t.isRequired).every(t => t.id === tokenId ? !!value : t.isConfigured)
      )
    })));
    setActiveToken(null);
  }, []);

  return (
    <div className="min-h-screen w-full bg-cream text-charcoal flex items-center justify-center p-[3px] lg:p-[5px]">
      <div className="w-full border border-charcoal bg-cream relative overflow-hidden rounded-[20px] sm:rounded-[24px] md:rounded-[32px] flex h-[calc(100vh-6px)] lg:h-[calc(100vh-10px)]">
        {/* 3D Stage (Left 2/3) */}
        <div className="flex-1 relative bg-gradient-to-br from-cream to-stone-100 border-r border-charcoal/10">
        {/* Stage Header */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-10">
          <div>
            <button
              onClick={onBack}
              className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-charcoal/50 hover:text-charcoal transition-colors mb-4"
            >
              <ChevronRight size={10} className="rotate-180" />
              Back
            </button>
            <h1 className="font-serif text-4xl italic text-charcoal">
              Blueprint Studio
            </h1>
            <div className="w-10 h-[2px] bg-accent mt-2" />
            <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal/50 mt-3">
              Teaching: {productName}
            </p>
          </div>

          {/* Preview Toggle */}
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`
              flex items-center gap-2 px-4 py-2 border transition-all
              ${previewMode 
                ? 'bg-charcoal text-cream border-charcoal' 
                : 'bg-transparent text-charcoal border-charcoal/30 hover:border-charcoal'
              }
            `}
          >
            {previewMode ? <EyeOff size={14} /> : <Eye size={14} />}
            <span className="font-mono text-[10px] uppercase tracking-widest">
              {previewMode ? 'Exit Preview' : 'Preview as Customer'}
            </span>
          </button>
        </div>

        {/* 3D Viewport Placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-32 h-32 border border-dashed border-charcoal/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Layers size={40} className="text-charcoal/20" />
            </div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal/30">
              3D Stage — Upload model to begin
            </p>
            {highlightedMesh && (
              <p className="font-mono text-[9px] uppercase tracking-widest text-accent mt-4">
                Highlighting: {highlightedMesh}
              </p>
            )}
          </div>
        </div>

        {/* Completion Status Bar */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[9px] uppercase tracking-widest text-charcoal/50">
              Setup Progress
            </span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-charcoal/50">
              {completedRequired}/{totalRequired} required
            </span>
          </div>
          <div className="h-1 bg-charcoal/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-charcoal"
              initial={{ width: 0 }}
              animate={{ width: `${(completedRequired / Math.max(totalRequired, 1)) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Blueprint Board (Right 1/3) */}
      <div className="w-[400px] flex flex-col bg-cream border-l border-charcoal/5">
        {/* Board Header */}
        <div className="p-6 border-b border-charcoal/10">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] border border-charcoal px-2 py-1">
              Capability Board
            </span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-charcoal/40">
              P0 Mode
            </span>
          </div>
        </div>

        {/* Cards List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cards.map(card => (
            <BlueprintCardComponent
              key={card.id}
              card={card}
              activeTokenId={activeToken?.id || null}
              highlightedTokenId={highlightedTokenId}
              onToggleExpand={() => handleCardToggle(card.id)}
              onTokenClick={handleTokenClick}
              onTokenHover={handleTokenHover}
            />
          ))}

          {/* Add Custom Card Button */}
          <button className="w-full p-4 border border-dashed border-charcoal/20 hover:border-charcoal hover:bg-white transition-all flex items-center justify-center gap-2 group">
            <Plus size={14} className="text-charcoal/40 group-hover:text-charcoal transition-colors" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-charcoal/40 group-hover:text-charcoal transition-colors">
              Add Custom Rule
            </span>
          </button>
        </div>

        {/* Board Footer */}
        <div className="p-4 border-t border-charcoal/10 bg-white/30">
          <button
            onClick={onComplete}
            disabled={!isReadyToPublish}
            className={`
              w-full py-4 font-mono text-[11px] uppercase tracking-widest transition-all
              ${isReadyToPublish
                ? 'bg-charcoal text-cream hover:bg-charcoal/90'
                : 'bg-charcoal/10 text-charcoal/30 cursor-not-allowed'
              }
            `}
          >
            {isReadyToPublish ? 'Publish Product →' : 'Complete Required Fields'}
          </button>
          <p className="font-mono text-[8px] uppercase tracking-widest text-charcoal/30 text-center mt-3">
            You can always edit after publishing
          </p>
        </div>

        {/* Token Editor Overlay */}
        <AnimatePresence>
          {activeToken && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-charcoal/5 z-40"
                onClick={() => setActiveToken(null)}
              />
              
              {/* Editor */}
              <TokenEditor
                token={activeToken}
                onClose={() => setActiveToken(null)}
                onSave={handleTokenSave}
              />
            </>
          )}
        </AnimatePresence>
      </div>
      </div>
    </div>
  );
};

export default BlueprintBoard;

