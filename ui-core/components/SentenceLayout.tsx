import React, { useState, useMemo, useEffect, useRef } from 'react';
import { L1Category, ConfigState, Option } from '../types-layouts';
import { RotateCcw } from 'lucide-react';

interface Props {
  data: L1Category[];
  selections: ConfigState;
  onSelect: (key: string, value: string) => void;
  isModified: (id: string) => boolean;
  totalPrice: number;
}

interface ConfigItem {
  id: string;
  label: string;
  options: Option[];
  type?: string;
}

const SentenceLayout: React.FC<Props> = ({ data, selections, onSelect, isModified, totalPrice }) => {
  const [activeTokenId, setActiveTokenId] = useState<string | null>(null);
  const [trayPosition, setTrayPosition] = useState<{ top: number; left: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Flatten data for easy lookup
  const configMap = useMemo(() => {
    const map = new Map<string, ConfigItem>();
    data.forEach(l1 => {
      l1.components.forEach(l2 => {
        map.set(l2.id, { id: l2.id, label: l2.label, options: l2.options });
        l2.properties.forEach(l3 => {
          map.set(l3.id, { id: l3.id, label: l3.label, options: l3.options, type: l3.type });
        });
      });
    });
    return map;
  }, [data]);

  const activeItem = activeTokenId ? configMap.get(activeTokenId) : null;

  // Filter options based on constraints for the tray
  const getFilteredOptions = (item: ConfigItem) => {
    if (selections['material_type'] === 'calfskin') {
      if (item.id === 'material_color') {
        return item.options.filter(o => ['black', 'tan'].includes(o.value));
      }
      if (item.id === 'handle_config') {
        return item.options.filter(o => o.value === 'rope');
      }
      if (item.id === 'print_config') {
        return item.options.filter(o => o.value === 'none');
      }
    }
    return item.options;
  };

  const filteredOptions = activeItem ? getFilteredOptions(activeItem) : [];

  // Handle click outside to close tray
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close if clicking outside the container or tray
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target as Node) && 
        !(event.target as HTMLElement).closest('[data-tray]')
      ) {
         setActiveTokenId(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTokenClick = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    
    if (activeTokenId === id) {
      setActiveTokenId(null);
      return;
    }

    const button = e.currentTarget;
    const container = containerRef.current;
    
    if (container) {
      const btnRect = button.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      // Calculate position relative to the container
      setTrayPosition({
        top: btnRect.top - containerRect.top, 
        left: (btnRect.left - containerRect.left) + (btnRect.width / 2) // Center of button
      });
    }

    setActiveTokenId(id);
  };

  const Token = ({ id, prefix = "", suffix = "" }: { id: string, prefix?: string, suffix?: string }) => {
    const item = configMap.get(id);
    if (!item) return null;
    
    const selectedOption = item.options.find(o => o.value === selections[id]);
    const label = selectedOption?.label || selections[id];
    const isActive = activeTokenId === id;
    const modified = isModified(id);

    return (
      <span className="inline-block mx-1 leading-normal">
        {prefix}
        <button
          data-token-id={id}
          onClick={(e) => handleTokenClick(id, e)}
          className={`
            relative inline-flex items-center px-2 py-0.5 rounded-[2px] border-b-2 transition-all duration-200 align-baseline
            
            ${/* Active State: High Contrast Focus */ ''}
            ${isActive 
              ? 'bg-charcoal text-cream border-charcoal shadow-hard -translate-y-0.5 z-10' 
              : 'hover:bg-charcoal/5'}

            ${/* Modified State: Solid, Bold, Confirmed */ ''}
            ${!isActive && modified 
              ? 'bg-white border-charcoal text-charcoal font-semibold shadow-sm' 
              : ''}

            ${/* Unmodified State: Faded, Dashed, Placeholder-like */ ''}
            ${!isActive && !modified 
              ? 'bg-transparent border-charcoal/20 border-dashed text-charcoal/50' 
              : ''}
          `}
        >
           <span className={`font-mono text-[11px] md:text-[13px] uppercase tracking-wide ${isActive ? 'font-bold' : ''}`}>
             [{label}]
           </span>
        </button>
        {suffix}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full relative min-h-[80vh]">
      {/* 1. 3D/2D Stage (Abstract) */}
      <div className="flex-1 min-h-[300px] md:min-h-[400px] bg-[#EBE7DF] relative flex flex-col items-center justify-center border-b border-charcoal overflow-hidden group cursor-pointer" onClick={() => setActiveTokenId(null)}>
         
         <div className="absolute inset-0 pointer-events-none opacity-[0.05]" 
             style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px' }} 
         />

         {/* Abstract Product Visualization */}
         <div className="relative z-10 text-center transition-transform duration-700 group-hover:scale-105">
             <div className="w-64 h-64 md:w-80 md:h-80 border-2 border-charcoal bg-white shadow-hard flex items-center justify-center relative rounded-sm">
                {/* Dynamic colored square based on body color */}
                <div 
                  className="w-48 h-48 border border-charcoal/20 shadow-inner"
                  style={{ 
                    backgroundColor: configMap.get('material_color')?.options.find(o => o.value === selections['material_color'])?.colorHex || '#D2B48C' 
                  }}
                />
                <div className="absolute bottom-4 right-4 font-mono text-[10px] uppercase tracking-widest text-charcoal/40">
                  FIG. PREVIEW
                </div>
                
                {/* Overlay text for product name */}
                <div className="absolute top-4 left-4 font-serif italic text-2xl text-charcoal/20">
                    {selections['product_def'] === 'luna' ? 'Luna' : 'Aurora'}
                </div>
             </div>
         </div>
         
         <div className="absolute top-8 left-8">
             <span className="font-mono text-[10px] uppercase tracking-[0.3em] bg-charcoal text-cream px-2 py-1">Live View</span>
         </div>
      </div>

      {/* 2. Spec Sentence Rail */}
      <div className="bg-cream relative z-20 flex-shrink-0" ref={containerRef}>
         <div className="max-w-4xl mx-auto p-6 md:p-12 pb-32 md:pb-40" onClick={() => setActiveTokenId(null)}>
            <h2 className="font-serif text-2xl md:text-4xl leading-relaxed md:leading-[1.6] text-charcoal/90">
              
              The
              <Token id="product_def" />
              is crafted from
              <Token id="material_finish" />
              <Token id="material_type" />
              leather in
              <Token id="material_color" suffix="." />
              It features a
              <Token id="handle_config" />
              handle and
              <Token id="print_config" suffix=" decoration." />
            </h2>

            <div className="mt-8 pt-8 border-t border-dashed border-charcoal/30 flex flex-wrap gap-4 items-center text-charcoal/60 font-mono text-xs">
               <span className="flex items-center gap-2">
                 <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                 Available to order
               </span>
               <span>|</span>
               <span>Est. Production: 10–12 Days</span>
               <span>|</span>
               <span className="text-charcoal font-bold">Total: £{totalPrice}</span>
            </div>
         </div>

         {/* 3. Floating Option Tray */}
         {activeItem && trayPosition && (
            <div 
               data-tray
               className="absolute z-50 transition-all duration-200"
               style={{ 
                  top: trayPosition.top, 
                  left: trayPosition.left,
                  transform: 'translate(-50%, -100%)',
                  marginTop: '-12px', // Gap above token
               }}
               onClick={(e) => e.stopPropagation()}
            >
               {/* Arrow */}
               <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-charcoal rotate-45 z-10"></div>
               
               {/* Content Box */}
               <div className="bg-white border border-charcoal shadow-hard rounded-sm p-1.5 min-w-[200px] max-w-[90vw] relative z-20">
                  
                  {/* Header Row (Reset) */}
                  {isModified(activeItem.id) && (
                     <div className="flex justify-between items-center px-2 py-1 mb-1 border-b border-charcoal/10">
                        <span className="font-mono text-[9px] text-charcoal/40 uppercase tracking-widest">{activeItem.label}</span>
                        <button 
                              onClick={() => onSelect(activeItem.id, activeItem.options[0].value)} 
                              className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-charcoal/50 hover:text-charcoal"
                        >
                              <RotateCcw size={8} /> Reset
                        </button>
                     </div>
                  )}

                  {/* Options Scroller */}
                  <div className="flex gap-2 overflow-x-auto p-1 scrollbar-hide">
                      {filteredOptions.length > 0 ? (
                        filteredOptions.map((opt) => {
                           const isSelected = selections[activeItem.id] === opt.value;
                           return (
                              <button
                                 key={opt.id}
                                 onClick={() => {
                                    onSelect(activeItem.id, opt.value);
                                 }}
                                 className={`
                                    flex-shrink-0 group relative flex flex-col items-center justify-center p-3 border transition-all text-center min-w-[80px]
                                    ${isSelected 
                                       ? 'border-charcoal bg-charcoal text-cream shadow-sm' 
                                       : 'border-charcoal/10 bg-white hover:border-charcoal text-charcoal'}
                                 `}
                              >
                                 {/* Color Circle */}
                                 {opt.colorHex && (
                                    <div 
                                       className={`w-6 h-6 rounded-full border border-charcoal/20 mb-2 ${isSelected ? 'border-cream/50' : ''}`}
                                       style={{ backgroundColor: opt.colorHex }}
                                    />
                                 )}

                                 <span className={`font-serif text-sm whitespace-nowrap ${isSelected ? 'italic' : ''}`}>
                                    {opt.label}
                                 </span>
                                 
                                 {opt.priceMod && (
                                    <span className={`font-mono text-[8px] mt-1 opacity-60`}>
                                       {opt.priceMod > 0 ? '+' : ''}£{opt.priceMod}
                                    </span>
                                 )}
                              </button>
                           );
                        })
                      ) : (
                        <div className="px-4 py-2 font-mono text-[10px] text-charcoal/40 italic">
                            No options available for this configuration.
                        </div>
                      )}
                  </div>
               </div>
            </div>
         )}
      </div>
    </div>
  );
};

export default SentenceLayout;


