import React, { useState } from 'react';
import { L1Category, ConfigState, L2Component } from '../types-layouts';
import { ArrowRight, RotateCcw } from 'lucide-react';

interface Props {
  data: L1Category[];
  selections: ConfigState;
  onSelect: (key: string, value: string) => void;
  isModified: (id: string) => boolean;
}

const SplitLayout: React.FC<Props> = ({ data, selections, onSelect, isModified }) => {
  const [activeComponentId, setActiveComponentId] = useState<string>(data[0].components[0].id);

  const getActiveComponent = (): L2Component | undefined => {
    for (const l1 of data) {
      const found = l1.components.find(c => c.id === activeComponentId);
      if (found) return found;
    }
    return undefined;
  };

  const activeComponent = getActiveComponent();
  const activeModified = activeComponent ? isModified(activeComponent.id) : false;

  return (
    <div className="flex flex-col md:flex-row h-[700px] border border-charcoal bg-cream mb-24 relative">
      {/* Decorative Technical Markers */}
      <div className="absolute top-0 left-0 w-2 h-2 border-r border-b border-charcoal" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-l border-t border-charcoal" />

      {/* LEFT PANE: Navigation */}
      <div className="w-full md:w-[320px] border-r border-charcoal overflow-y-auto bg-cream">
        <div className="p-6">
          <div className="flex items-center justify-between mb-8 pb-2 border-b border-charcoal">
            <h3 className="font-mono text-[10px] tracking-[0.2em] uppercase">Navigation</h3>
            <span className="font-mono text-[9px] text-charcoal/50">IDX-01</span>
          </div>
          
          <div className="space-y-10">
            {data.map((l1) => (
              <div key={l1.id}>
                <h4 className="font-serif italic text-2xl mb-4">{l1.label}</h4>
                <ul className="space-y-0">
                  {l1.components.map((l2) => {
                    const isActive = activeComponentId === l2.id;
                    const modified = isModified(l2.id);
                    const childrenModified = l2.properties.some(p => isModified(p.id));
                    const anyModified = modified || childrenModified;

                    return (
                      <li key={l2.id}>
                        <button
                          onClick={() => setActiveComponentId(l2.id)}
                          className={`
                            w-full text-left px-4 py-3 transition-all flex justify-between items-center group border-l-2
                            ${isActive 
                                ? 'bg-white border-charcoal' 
                                : 'border-transparent hover:bg-white hover:border-charcoal/20'}
                          `}
                        >
                          <div>
                            <div className={`font-mono text-[11px] uppercase tracking-widest mb-1 ${isActive ? 'text-charcoal font-bold' : 'text-charcoal/70'}`}>
                              {l2.label}
                            </div>
                            {anyModified && (
                                <span className="text-[9px] font-mono text-charcoal bg-charcoal/10 px-1">MODIFIED</span>
                            )}
                          </div>
                          {isActive && <ArrowRight size={12} className="text-charcoal" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANE: Configuration */}
      <div className="w-full flex-1 bg-white overflow-y-auto relative">
         {/* Background Grid */}
         <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
             style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
        />

        {activeComponent && (
          <div className="p-8 md:p-16 max-w-3xl mx-auto animate-in fade-in duration-300 relative z-10">
            <div className="mb-16">
               {/* Editorial Header */}
               <div className="flex items-center gap-4 mb-6">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-charcoal/40 border-b border-charcoal/20 pb-1">
                     Ref. {activeComponent.id.toUpperCase()}
                  </span>
               </div>
               
               <h2 className="text-6xl md:text-7xl font-serif italic text-charcoal mb-8 leading-[0.9]">
                  {activeComponent.label}
               </h2>

               {/* Editorial Description: Serif, Large, Italic */}
               <div className="flex gap-6 items-start">
                   {/* The Accent Line - Vertical Emphasis */}
                   <div className="w-[4px] h-24 bg-accent flex-shrink-0 mt-2"></div>
                   
                   <div className="space-y-6">
                      <p className="font-serif text-2xl text-charcoal/80 italic leading-relaxed">
                        {activeComponent.description || `Select the specifications for the ${activeComponent.label.toLowerCase()} to define the character of the piece.`}
                      </p>
                      {activeModified && (
                         <button 
                          onClick={() => onSelect(activeComponent.id, activeComponent.defaultValue)}
                          className="group flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-charcoal/40 hover:text-accent transition-colors"
                         >
                            <RotateCcw size={10} className="group-hover:-rotate-180 transition-transform duration-500" /> 
                            Revert to Original
                         </button>
                       )}
                   </div>
               </div>
            </div>

            {/* L2 Selection */}
            <div className="mb-16">
              <label className="block font-mono text-[10px] uppercase tracking-[0.2em] mb-6 border-b border-dashed border-charcoal/30 pb-2 w-full text-charcoal/40">
                Primary Specification
              </label>
              <div className="grid grid-cols-1 gap-4">
                {activeComponent.options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => onSelect(activeComponent.id, opt.value)}
                    className={`
                      flex items-center justify-between p-6 border transition-all text-left group
                      ${selections[activeComponent.id] === opt.value 
                        ? 'border-charcoal bg-charcoal text-cream shadow-hard' 
                        : 'border-charcoal/20 bg-transparent hover:border-charcoal text-charcoal'}
                    `}
                  >
                    <div>
                        <span className="font-serif text-3xl italic">
                            {opt.label}
                        </span>
                    </div>
                    {opt.priceMod && (
                      <span className={`font-mono text-xs border px-2 py-1 ${selections[activeComponent.id] === opt.value ? 'border-cream text-cream' : 'border-charcoal text-charcoal'}`}>
                        {opt.priceMod > 0 ? '+' : ''}£{opt.priceMod}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* L3 Properties */}
            {activeComponent.properties.length > 0 && (
              <div className="space-y-12">
                {activeComponent.properties.map((l3) => {
                   return (
                    <div key={l3.id}>
                        <div className="flex justify-between items-end mb-6 border-b border-dashed border-charcoal/30 pb-2">
                            <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-charcoal/60">
                                {l3.label}
                            </label>
                            <span className="font-mono text-[9px] text-charcoal/40">FIG. {l3.id.split('_')[1].toUpperCase()}</span>
                        </div>
                        
                        {l3.type === 'color' ? (
                        <div className="flex flex-wrap gap-6">
                            {l3.options.map((opt) => (
                            <div key={opt.id} className="group cursor-pointer" onClick={() => onSelect(l3.id, opt.value)}>
                                <div 
                                    className={`w-16 h-16 border transition-all mb-2 ${selections[l3.id] === opt.value ? 'border-charcoal shadow-hard translate-x-[-2px] translate-y-[-2px]' : 'border-charcoal/20 hover:border-charcoal'}`}
                                    style={{ backgroundColor: opt.colorHex }}
                                />
                                <span className={`block text-center font-mono text-[9px] uppercase tracking-wider ${selections[l3.id] === opt.value ? 'text-charcoal font-bold' : 'text-charcoal/50'}`}>
                                    {opt.label}
                                </span>
                            </div>
                            ))}
                        </div>
                        ) : (
                        <div className="flex flex-wrap gap-3">
                            {l3.options.map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => onSelect(l3.id, opt.value)}
                                    className={`
                                        px-6 py-3 font-mono text-xs uppercase tracking-widest border transition-all
                                        ${selections[l3.id] === opt.value 
                                            ? 'bg-charcoal text-cream border-charcoal shadow-hard' 
                                            : 'bg-transparent text-charcoal border-charcoal/20 hover:border-charcoal'}
                                    `}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        )}
                    </div>
                );
              })}
              </div>
            )}
            
            <div className="h-24"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SplitLayout;


