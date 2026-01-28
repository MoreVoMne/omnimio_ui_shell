import React from 'react';
import { L1Category, ConfigState, Option } from '../types-layouts';
import { ArrowRight, SlidersHorizontal } from 'lucide-react';

interface Props {
  data: L1Category[];
  selections: ConfigState;
  onOpenAttribute: (id: string, title: string, options: Option[], subtitle?: string) => void;
  isModified: (id: string) => boolean;
}

const CardsLayout: React.FC<Props> = ({ data, selections, onOpenAttribute, isModified }) => {
  return (
    <div className="space-y-20 pb-32">
      {data.map((l1, idx) => (
        <div key={l1.id}>
           <div className="flex items-center gap-6 mb-8">
                <span className="font-mono text-4xl text-charcoal/10 font-bold">0{idx + 1}</span>
                <h2 className="text-4xl font-serif italic text-charcoal">{l1.label}</h2>
                <div className="h-px bg-charcoal flex-1 mt-2"></div>
            </div>
          
          <div className="grid grid-cols-1 gap-12">
            {l1.components.map((l2) => {
               const l2Modified = isModified(l2.id);
               const l2Selected = l2.options.find(o => o.value === selections[l2.id]);

               return (
                <div key={l2.id} className="relative pl-0 md:pl-8">
                    {/* Visual Connection Line */}
                    <div className="absolute left-0 top-0 bottom-0 w-px bg-charcoal/10 hidden md:block" />

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-0 border border-charcoal bg-white shadow-sm">
                        
                        {/* LEFT: Main Config Card */}
                        <div 
                            className="md:col-span-7 p-8 border-b md:border-b-0 md:border-r border-charcoal relative group cursor-pointer hover:bg-cream/50 transition-colors"
                            onClick={() => onOpenAttribute(l2.id, l2.label, l2.options, l2.description)}
                        >
                             {/* Technical Label */}
                             <div className="flex justify-between mb-4">
                                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-charcoal/60">Component Spec</span>
                                {l2Modified && <span className="font-mono text-[9px] bg-charcoal text-cream px-1">CUSTOMIZED</span>}
                             </div>

                             <h3 className="text-4xl font-serif italic mb-4">{l2Selected?.label}</h3>
                             <p className="font-mono text-xs text-charcoal/60 leading-relaxed max-w-sm mb-8">
                                {l2.description || 'Standard specification applicable for this model.'}
                             </p>

                             <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-charcoal border-b border-charcoal inline-flex pb-1 group-hover:border-accent group-hover:text-accent transition-colors">
                                Edit Specification <ArrowRight size={10} />
                             </div>
                        </div>

                        {/* RIGHT: Sub-Properties (Data Grid) */}
                        <div className="md:col-span-5 bg-cream/30">
                            {l2.properties.length > 0 ? (
                                <div className="divide-y divide-charcoal/10 h-full flex flex-col justify-center">
                                     {l2.properties.map((l3) => {
                                         const l3Modified = isModified(l3.id);
                                         const l3Selected = l3.options.find(o => o.value === selections[l3.id]);

                                         return (
                                             <button
                                                key={l3.id}
                                                onClick={() => onOpenAttribute(l3.id, l3.label, l3.options, `Property of ${l2.label}`)}
                                                className="w-full flex items-center justify-between p-6 hover:bg-white transition-colors text-left group/prop"
                                             >
                                                 <div>
                                                     <span className="block font-mono text-[9px] text-charcoal/40 uppercase tracking-widest mb-1">{l3.label}</span>
                                                     <div className="flex items-center gap-3">
                                                         {l3.type === 'color' && l3Selected?.colorHex && (
                                                             <div className="w-3 h-3 border border-charcoal" style={{ backgroundColor: l3Selected.colorHex }} />
                                                         )}
                                                         <span className={`font-serif text-lg ${l3Modified ? 'italic text-charcoal' : 'text-charcoal/80'}`}>
                                                             {l3Selected?.label}
                                                         </span>
                                                     </div>
                                                 </div>
                                                 <SlidersHorizontal size={12} className="text-charcoal/20 group-hover/prop:text-charcoal transition-colors" />
                                             </button>
                                         );
                                     })}
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center p-8">
                                    <span className="font-mono text-[9px] text-charcoal/20 uppercase tracking-[0.3em] rotate-45">No Sub-Specs</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
               );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CardsLayout;


