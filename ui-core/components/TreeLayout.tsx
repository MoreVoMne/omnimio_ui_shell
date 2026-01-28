import React from 'react';
import { L1Category, ConfigState, Option } from '../types-layouts';
import { ArrowRight, CornerDownRight } from 'lucide-react';

interface Props {
  data: L1Category[];
  selections: ConfigState;
  onOpenAttribute: (id: string, title: string, options: Option[], subtitle?: string) => void;
  isModified: (id: string) => boolean;
}

const TreeLayout: React.FC<Props> = ({ data, selections, onOpenAttribute, isModified }) => {
  return (
    <div className="space-y-24 pb-32">
      {data.map((l1, l1Idx) => (
        <section key={l1.id} className="relative pt-8">
          {/* Editorial: Giant Section Number as Graphic */}
          <span className="absolute -top-10 -left-6 font-serif text-[140px] leading-none text-charcoal/[0.04] italic pointer-events-none select-none z-0">
            0{l1Idx + 1}
          </span>

          {/* L1 Header - The Section Cut */}
          <div className="relative z-10 flex items-end border-b border-charcoal pb-6 mb-12">
            <h2 className="text-5xl md:text-6xl font-serif italic text-charcoal leading-none">
              {l1.label}
            </h2>
            <span className="ml-auto font-mono text-[9px] uppercase tracking-widest text-charcoal/40 mb-2">
              Section {l1Idx + 1}
            </span>
          </div>

          <div className="space-y-1">
            {l1.components.map((l2) => {
              const l2SelectedOption = l2.options.find(o => o.value === selections[l2.id]);
              const l2Modified = isModified(l2.id);

              return (
                <div key={l2.id} className="relative group">
                  
                  {/* L2 ROW (Component) */}
                  <div className="relative z-10">
                    <button
                      onClick={() => onOpenAttribute(l2.id, l2.label, l2.options, l2.description)}
                      className={`
                        w-full flex items-center justify-between p-6 border-l border-r border-charcoal/0 hover:border-charcoal/10 transition-all duration-300 group-hover:bg-white
                        ${l2Modified ? 'bg-white' : ''}
                      `}
                    >
                      <div className="flex items-center gap-8">
                        {/* Status Indicator */}
                        <div className={`w-2 h-2 border border-charcoal ${l2Modified ? 'bg-charcoal' : 'bg-transparent'}`} />
                        
                        <div className="text-left">
                          <span className="block font-mono text-[10px] tracking-[0.2em] text-charcoal/50 uppercase mb-2">
                            {l2.label}
                          </span>
                          <span className={`text-3xl font-serif ${l2Modified ? 'italic' : ''} text-charcoal`}>
                            {l2SelectedOption?.label}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                         {l2Modified && (
                           <span className="font-mono text-[9px] uppercase tracking-widest text-charcoal border border-charcoal px-2 py-1">
                             Customized
                           </span>
                         )}
                         <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowRight size={18} className="text-charcoal" />
                         </div>
                      </div>
                    </button>
                    {/* Dashed Separator */}
                    <div className="absolute bottom-0 left-4 right-4 border-b border-dashed border-charcoal/20 group-hover:border-charcoal/40" />
                  </div>

                  {/* L3 ROWs (Properties) - Nested with technical lines */}
                  {l2.properties.length > 0 && (
                    <div className="relative pl-12 pr-4 pt-2 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Vertical Sewing Line */}
                      <div className="absolute left-[19px] top-0 bottom-4 w-px border-l border-dashed border-charcoal/30" />
                      
                      {l2.properties.map((l3) => {
                        const l3SelectedOption = l3.options.find(o => o.value === selections[l3.id]);
                        const l3Modified = isModified(l3.id);
                        
                        return (
                          <div key={l3.id} className="relative">
                            {/* Connection Curve */}
                            <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-4 border-t border-dashed border-charcoal/30 hidden md:block" />
                            
                            <button
                              onClick={() => onOpenAttribute(l3.id, l3.label, l3.options, `Select ${l3.label}`)}
                              className={`
                                w-full flex items-center justify-between p-4 border hover:shadow-hard hover:bg-white transition-all
                                ${l3Modified 
                                  ? 'border-charcoal bg-white' 
                                  : 'border-charcoal/20 bg-transparent hover:border-charcoal'}
                              `}
                            >
                              <div className="flex items-center gap-4">
                                 {l3.type === 'color' && l3SelectedOption?.colorHex ? (
                                   <div 
                                      className="w-4 h-4 border border-charcoal/20" 
                                      style={{ backgroundColor: l3SelectedOption.colorHex }}
                                   />
                                 ) : (
                                   <CornerDownRight size={14} className="text-charcoal/40" />
                                 )}
                                 
                                 <div className="text-left">
                                    <span className="font-mono text-[9px] text-charcoal/50 tracking-widest uppercase block mb-1">{l3.label}</span>
                                    <span className="font-serif italic text-xl text-charcoal leading-none">
                                      {l3SelectedOption?.label}
                                    </span>
                                 </div>
                              </div>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};

export default TreeLayout;


