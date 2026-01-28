// TeachModeOverlay.tsx - "Teach by Example" Mode
// Merchants use the customer customizer to demonstrate capabilities
// The system watches their actions and suggests capability sentences

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, X, ChevronRight, Lightbulb, Play, Pause, RotateCcw } from 'lucide-react';

// ==== TYPES ====

interface DetectedCapability {
  id: string;
  type: 'part-swap' | 'material-change' | 'zone-artwork' | 'size-adjust';
  timestamp: number;
  action: string;
  targetPart: string;
  suggestedSentence: string;
  tokens: {
    id: string;
    value: string;
    type: string;
  }[];
  isAccepted: boolean;
  isRejected: boolean;
}

interface TeachModeOverlayProps {
  isActive: boolean;
  onToggle: () => void;
  onAcceptCapability: (capability: DetectedCapability) => void;
  onRejectCapability: (capabilityId: string) => void;
  onClearAll: () => void;
}

// ==== HELPER: Generate capability from action ====
const generateCapabilitySuggestion = (
  actionType: string,
  targetPart: string,
  value: string
): DetectedCapability => {
  const id = `cap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  switch (actionType) {
    case 'material':
      return {
        id,
        type: 'material-change',
        timestamp: Date.now(),
        action: `Changed ${targetPart} material to ${value}`,
        targetPart,
        suggestedSentence: `Customers can change [materials] on [${targetPart}].`,
        tokens: [
          { id: 'token-material', value: value, type: 'option' },
          { id: 'token-part', value: targetPart, type: 'part' }
        ],
        isAccepted: false,
        isRejected: false
      };
      
    case 'swap':
      return {
        id,
        type: 'part-swap',
        timestamp: Date.now(),
        action: `Swapped ${targetPart} component`,
        targetPart,
        suggestedSentence: `Customers can [swap parts] on [${targetPart}].`,
        tokens: [
          { id: 'token-swap', value: 'swap parts', type: 'action' },
          { id: 'token-part', value: targetPart, type: 'part' }
        ],
        isAccepted: false,
        isRejected: false
      };
      
    case 'artwork':
      return {
        id,
        type: 'zone-artwork',
        timestamp: Date.now(),
        action: `Added artwork on ${targetPart}`,
        targetPart,
        suggestedSentence: `Artwork allowed on [${targetPart} zone] as [print].`,
        tokens: [
          { id: 'token-zone', value: `${targetPart} zone`, type: 'zone' },
          { id: 'token-method', value: 'print', type: 'method' }
        ],
        isAccepted: false,
        isRejected: false
      };
      
    case 'size':
      return {
        id,
        type: 'size-adjust',
        timestamp: Date.now(),
        action: `Adjusted ${targetPart} size`,
        targetPart,
        suggestedSentence: `Customers can adjust [size] on [${targetPart}].`,
        tokens: [
          { id: 'token-size', value: 'size', type: 'option' },
          { id: 'token-part', value: targetPart, type: 'part' }
        ],
        isAccepted: false,
        isRejected: false
      };
      
    default:
      return {
        id,
        type: 'material-change',
        timestamp: Date.now(),
        action: `Modified ${targetPart}`,
        targetPart,
        suggestedSentence: `Customers can change [options] on [${targetPart}].`,
        tokens: [
          { id: 'token-option', value: 'options', type: 'option' },
          { id: 'token-part', value: targetPart, type: 'part' }
        ],
        isAccepted: false,
        isRejected: false
      };
  }
};

// ==== CAPABILITY CARD COMPONENT ====
const CapabilityCard: React.FC<{
  capability: DetectedCapability;
  onAccept: () => void;
  onReject: () => void;
}> = ({ capability, onAccept, onReject }) => {
  if (capability.isRejected) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`
        border bg-cream p-3 mb-2
        ${capability.isAccepted 
          ? 'border-emerald-500/30 bg-emerald-50/30' 
          : 'border-charcoal/20'
        }
      `}
    >
      {/* Detected Action */}
      <div className="flex items-start gap-2 mb-2">
        <Lightbulb size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
        <span className="font-mono text-[9px] uppercase tracking-widest text-charcoal/50">
          Detected: {capability.action}
        </span>
      </div>
      
      {/* Suggested Sentence */}
      <div className="font-serif text-sm italic text-charcoal/80 mb-3 leading-relaxed">
        {capability.suggestedSentence.split(/\[([^\]]+)\]/).map((part, i) => {
          if (i % 2 === 0) return <span key={i}>{part}</span>;
          return (
            <span 
              key={i} 
              className="inline-block px-1.5 py-0.5 mx-0.5 bg-charcoal/10 border border-charcoal/20 rounded-sm font-mono text-[10px] uppercase tracking-wide not-italic"
            >
              {part}
            </span>
          );
        })}
      </div>
      
      {/* Actions */}
      {!capability.isAccepted && (
        <div className="flex items-center gap-2">
          <button
            onClick={onAccept}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-charcoal text-cream font-mono text-[9px] uppercase tracking-widest hover:bg-charcoal/90 transition-colors"
          >
            <Check size={10} />
            Accept
          </button>
          <button
            onClick={onReject}
            className="px-3 py-2 border border-charcoal/20 text-charcoal/50 font-mono text-[9px] uppercase tracking-widest hover:border-charcoal hover:text-charcoal transition-colors"
          >
            <X size={10} />
          </button>
        </div>
      )}
      
      {capability.isAccepted && (
        <div className="flex items-center gap-1.5 text-emerald-600">
          <Check size={12} />
          <span className="font-mono text-[9px] uppercase tracking-widest">
            Added to Blueprint
          </span>
        </div>
      )}
    </motion.div>
  );
};

// ==== MAIN COMPONENT ====
export const TeachModeOverlay: React.FC<TeachModeOverlayProps> = ({
  isActive,
  onToggle,
  onAcceptCapability,
  onRejectCapability,
  onClearAll
}) => {
  const [capabilities, setCapabilities] = useState<DetectedCapability[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  // Simulate detecting actions (in production, this would hook into the customizer state)
  useEffect(() => {
    if (!isActive || !isRecording) return;

    // Demo: Add mock capabilities periodically
    const mockActions = [
      { type: 'material', part: 'Body', value: 'Pebbled Leather' },
      { type: 'material', part: 'Handle', value: 'Chain' },
      { type: 'swap', part: 'Hardware', value: 'Gold' },
      { type: 'artwork', part: 'Front Flap', value: 'Print' },
      { type: 'size', part: 'Strap', value: 'Extended' }
    ];

    let actionIndex = 0;
    const interval = setInterval(() => {
      if (actionIndex < mockActions.length) {
        const action = mockActions[actionIndex];
        const newCapability = generateCapabilitySuggestion(action.type, action.part, action.value);
        setCapabilities(prev => [...prev, newCapability]);
        actionIndex++;
      }
    }, 3000); // New capability every 3 seconds for demo

    return () => clearInterval(interval);
  }, [isActive, isRecording]);

  const handleAccept = useCallback((capability: DetectedCapability) => {
    setCapabilities(prev => prev.map(c => 
      c.id === capability.id ? { ...c, isAccepted: true } : c
    ));
    onAcceptCapability(capability);
  }, [onAcceptCapability]);

  const handleReject = useCallback((capabilityId: string) => {
    setCapabilities(prev => prev.map(c => 
      c.id === capabilityId ? { ...c, isRejected: true } : c
    ));
    onRejectCapability(capabilityId);
  }, [onRejectCapability]);

  const handleClear = useCallback(() => {
    setCapabilities([]);
    onClearAll();
  }, [onClearAll]);

  const pendingCount = capabilities.filter(c => !c.isAccepted && !c.isRejected).length;
  const acceptedCount = capabilities.filter(c => c.isAccepted).length;

  if (!isActive) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={onToggle}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:shadow-xl transition-shadow"
      >
        <Sparkles size={16} />
        <span className="font-mono text-[10px] uppercase tracking-widest font-medium">
          Teach Mode
        </span>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed right-6 top-20 bottom-6 w-[320px] z-50 flex flex-col bg-cream border border-charcoal shadow-2xl"
    >
      {/* Header */}
      <div className="p-4 border-b border-charcoal/10 bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-amber-500" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-medium text-charcoal">
              Teach Mode
            </span>
          </div>
          <button
            onClick={onToggle}
            className="p-1.5 hover:bg-charcoal/5 rounded-sm transition-colors"
          >
            <X size={14} className="text-charcoal/50" />
          </button>
        </div>
        <p className="font-mono text-[9px] text-charcoal/50 leading-relaxed">
          Use the customizer as a customer would. We'll detect what you're doing and suggest capabilities.
        </p>
      </div>

      {/* Recording Controls */}
      <div className="p-3 border-b border-charcoal/10 bg-white/50">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`
              flex-1 flex items-center justify-center gap-2 py-2.5 font-mono text-[10px] uppercase tracking-widest transition-all
              ${isRecording 
                ? 'bg-accent text-white' 
                : 'bg-charcoal text-cream hover:bg-charcoal/90'
              }
            `}
          >
            {isRecording ? (
              <>
                <Pause size={12} />
                Recording...
              </>
            ) : (
              <>
                <Play size={12} />
                Start Teaching
              </>
            )}
          </button>
          
          {capabilities.length > 0 && (
            <button
              onClick={handleClear}
              className="p-2.5 border border-charcoal/20 hover:border-charcoal hover:bg-white transition-all"
              title="Clear all"
            >
              <RotateCcw size={12} className="text-charcoal/50" />
            </button>
          )}
        </div>
        
        {isRecording && (
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="font-mono text-[9px] text-charcoal/50">
              Watching your actions...
            </span>
          </div>
        )}
      </div>

      {/* Stats Bar */}
      {capabilities.length > 0 && (
        <div className="px-3 py-2 border-b border-charcoal/10 bg-charcoal/5 flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-widest text-charcoal/50">
            {pendingCount} pending · {acceptedCount} accepted
          </span>
        </div>
      )}

      {/* Capabilities List */}
      <div className="flex-1 overflow-y-auto p-3">
        <AnimatePresence mode="popLayout">
          {capabilities.filter(c => !c.isRejected).map(capability => (
            <CapabilityCard
              key={capability.id}
              capability={capability}
              onAccept={() => handleAccept(capability)}
              onReject={() => handleReject(capability.id)}
            />
          ))}
        </AnimatePresence>
        
        {capabilities.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 border border-dashed border-charcoal/20 rounded-full flex items-center justify-center mb-4">
              <Sparkles size={24} className="text-charcoal/20" />
            </div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal/40 mb-2">
              No capabilities detected yet
            </p>
            <p className="font-mono text-[9px] text-charcoal/30 max-w-[200px]">
              Start recording and use the customizer to teach the product its capabilities
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      {acceptedCount > 0 && (
        <div className="p-3 border-t border-charcoal/10 bg-white/30">
          <button
            onClick={onToggle}
            className="w-full py-3 bg-charcoal text-cream font-mono text-[10px] uppercase tracking-widest hover:bg-charcoal/90 transition-colors flex items-center justify-center gap-2"
          >
            Apply {acceptedCount} Capabilities
            <ChevronRight size={12} />
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default TeachModeOverlay;

