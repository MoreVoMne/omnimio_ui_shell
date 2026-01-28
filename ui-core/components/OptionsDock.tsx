
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ChevronRight, Check, Info } from 'lucide-react';
import { ConfigurationState, PartId, ConflictResolution } from '../types';
import { OPTION_GROUPS } from '../constants';

interface OptionsDockProps {
  configuration: ConfigurationState;
  onUpdate: (key: keyof ConfigurationState, value: string) => void;
  activePart: PartId | null;
  setActivePart: (part: PartId | null) => void;
  activeTab?: string; 
  onTabChange: (tab: string) => void;
  totalPrice: number;
  conflict: ConflictResolution | null;
  onResolveConflict: () => void;
  onOpenPriceTree: () => void;
}

export const OptionsDock: React.FC<OptionsDockProps> = ({ 
  configuration, 
  onUpdate, 
  activePart, 
  setActivePart,
  activeTab: propActiveTab,
  onTabChange,
  totalPrice,
  conflict,
  onResolveConflict,
  onOpenPriceTree
}) => {
  
  // Use the prop or default to 'materials'
  const activeTab = propActiveTab || 'materials';

  const activeGroup = activePart === 'handle' ? OPTION_GROUPS.handle : 
                      activePart === 'body' ? OPTION_GROUPS.surface : null;

  // Check if a category has options for the current active part
  const hasCategory = (category: string) => {
    if (!activeGroup) return false;
    // @ts-ignore
    return activeGroup.steps.some(s => s.category === category);
  };

  // Auto-switch tab if the current tab has no options for the new part
  useEffect(() => {
    if (activePart && activeGroup) {
      // Check if current tab is valid for this new part group
      if (!hasCategory(activeTab)) {
        // Find the first valid category
        // @ts-ignore
        const firstValidStep = activeGroup.steps[0];
        const targetTab = firstValidStep ? firstValidStep.category : 'materials';
        
        // Only call change if it's different to prevent loops
        if (targetTab !== activeTab) {
             onTabChange(targetTab);
        }
      }
    }
  }, [activePart, activeGroup, activeTab, onTabChange]);

  // Helper to get current value label
  const getLabel = (stepId: string) => {
    // @ts-ignore
    const val = configuration[stepId];
    // Find option
    const step = activeGroup?.steps.find(s => s.id === stepId);
    const opt = step?.options.find(o => o.id === val);
    return opt?.label || val;
  };

  const getPriceDiff = (stepId: string) => {
    // @ts-ignore
    const val = configuration[stepId];
    const step = activeGroup?.steps.find(s => s.id === stepId);
    const opt = step?.options.find(o => o.id === val);
    return opt?.price || 0;
  };

  const tabs = ['Materials', 'Details', 'Images', 'Text'];

  // Filter steps based on active tab
  const filteredSteps = activeGroup?.steps.filter((step: any) => step.category === activeTab) || [];

  return (
    <div className="h-full flex flex-col p-6 md:p-10">
      
      {/* Dock Header: Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-[11px] uppercase tracking-widest font-medium text-charcoal">
        <button onClick={() => setActivePart(null)} className="hover:text-accent transition-colors">
          Bag
        </button>
        {activePart && (
          <>
            <ChevronRight size={10} />
            <span className="text-charcoal">{activeGroup?.label}</span>
          </>
        )}
      </div>

      {/* Tabs - Only show if a part is active */}
      {activePart && (
        <div className="flex items-center gap-6 mb-8 border-b border-charcoal pb-3 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
            const key = tab.toLowerCase();
            const isActive = activeTab === key;
            const isDisabled = !hasCategory(key);

            return (
                <button 
                key={tab} 
                onClick={() => !isDisabled && onTabChange(key)}
                disabled={isDisabled}
                className={`
                    text-[11px] uppercase tracking-widest transition-colors bg-transparent border-none p-0 whitespace-nowrap relative
                    ${isActive ? 'text-accent font-bold' : ''}
                    ${isDisabled ? 'text-charcoal cursor-default opacity-50' : 'text-charcoal hover:text-black cursor-pointer'}
                `}
                >
                {tab}
                {isActive && (
                    <motion.div 
                        layoutId="activeTabIndicator"
                        className="absolute -bottom-[13px] left-0 right-0 h-[2px] bg-accent" 
                    />
                )}
                </button>
            );
            })}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar relative">
        {/* Root View: Category List */}
        {!activePart && (
           <div className="space-y-2">
              <div className="text-xs font-serif italic text-charcoal mb-4">Select a part to customize:</div>
              <button 
                onClick={() => setActivePart('handle')}
                className="w-full flex items-center justify-between p-4 border border-charcoal/20 hover:border-accent hover:bg-white transition-all group"
              >
                 <span className="font-serif text-xl text-charcoal">Handle</span>
                 <span className="text-[10px] uppercase tracking-widest text-charcoal group-hover:text-accent flex items-center gap-2">
                    Customize <ChevronRight size={12} />
                 </span>
              </button>
              <button 
                onClick={() => setActivePart('body')}
                className="w-full flex items-center justify-between p-4 border border-charcoal/20 hover:border-accent hover:bg-white transition-all group"
              >
                 <span className="font-serif text-xl text-charcoal">Surface</span>
                 <span className="text-[10px] uppercase tracking-widest text-charcoal group-hover:text-accent flex items-center gap-2">
                    Customize <ChevronRight size={12} />
                 </span>
              </button>
           </div>
        )}

        {/* Part View: Filtered Steps */}
        {activePart && activeGroup && (
          <div className="space-y-8">
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {filteredSteps.length > 0 ? (
                    filteredSteps.map((step: any) => (
                        <div key={step.id} className="mb-8">
                        <div className="flex justify-between items-baseline mb-3">
                            <h4 className="text-[11px] uppercase tracking-widest text-charcoal font-bold">{step.label}</h4>
                            <span className="font-serif text-sm italic text-charcoal">
                                {getLabel(step.id)} 
                                {getPriceDiff(step.id) > 0 && <span className="text-charcoal ml-1 text-xs">(+${getPriceDiff(step.id)})</span>}
                            </span>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                            {step.options.map((opt: any) => {
                                // @ts-ignore
                                const isSelected = configuration[step.id] === opt.id;
                                return (
                                    <button
                                        key={opt.id}
                                        onClick={() => onUpdate(step.id as keyof ConfigurationState, opt.id)}
                                        className={`
                                            w-full text-left flex items-center justify-between px-4 py-3 border transition-all
                                            ${isSelected 
                                                ? 'bg-charcoal text-cream border-charcoal' 
                                                : 'bg-transparent text-charcoal border-charcoal hover:border-black'}
                                        `}
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-xs uppercase tracking-wide font-medium">{opt.label}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {opt.price > 0 && (
                                                <span className={`text-[10px] ${isSelected ? 'text-cream' : 'text-charcoal'}`}>+${opt.price}</span>
                                            )}
                                            {isSelected && <Check size={14} className="text-accent" />}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                        </div>
                    ))
                    ) : (
                    <div className="flex flex-col items-center justify-center h-32 text-charcoal gap-2">
                        <Info size={20} />
                        <span className="text-[10px] uppercase tracking-widest">No options available in {activeTab}</span>
                    </div>
                    )}
                </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Conflict Banner (Inline Auto-Plan) */}
      <AnimatePresence>
        {conflict && (
          <motion.div 
            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
            animate={{ height: 'auto', opacity: 1, marginBottom: 24 }}
            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-charcoal p-4 mt-4">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle size={16} className="text-accent mt-[2px]" />
                <div className="flex flex-col">
                     <span className="text-xs font-bold uppercase tracking-wide text-accent mb-1">Constraint</span>
                     <span className="text-sm font-serif italic text-charcoal">{conflict.message}</span>
                </div>
              </div>
              <div className="flex gap-2 pl-7">
                <button 
                  onClick={conflict.optionA.action}
                  className="px-4 py-2 border border-charcoal text-[10px] uppercase tracking-wide hover:bg-charcoal hover:text-cream transition-colors text-charcoal"
                >
                  {conflict.optionA.label}
                </button>
                <button 
                  onClick={conflict.optionB.action}
                  className="px-4 py-2 border border-charcoal text-[10px] uppercase tracking-wide hover:bg-charcoal hover:text-cream transition-colors text-charcoal"
                >
                  {conflict.optionB.label}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
