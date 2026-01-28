import React from 'react';
import { X, Check } from 'lucide-react';
import { Option } from '../types-layouts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  options: Option[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

const SelectionDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  options,
  selectedValue,
  onSelect,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-charcoal/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[450px] bg-cream border-l border-charcoal flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl">
        
        {/* Header */}
        <div className="px-8 py-8 border-b border-charcoal bg-cream">
          <div className="flex justify-between items-start mb-6">
             <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-charcoal/50">Edit Configuration</span>
             <button 
                onClick={onClose}
                className="p-2 border border-charcoal/10 hover:border-charcoal hover:bg-charcoal hover:text-white transition-all rounded-[2px]"
             >
                <X size={16} />
             </button>
          </div>
          <h3 className="font-serif text-4xl text-charcoal italic mb-2">{title}</h3>
          {/* Accent Line */}
          <div className="w-8 h-[2px] bg-accent mb-3"></div>
          {subtitle && <p className="font-mono text-xs text-charcoal/60 leading-relaxed max-w-xs">{subtitle}</p>}
        </div>

        {/* Options List */}
        <div className="flex-1 overflow-y-auto p-8 space-y-4 bg-white/50">
          {options.map((opt) => {
            const isSelected = selectedValue === opt.value;
            return (
              <button
                key={opt.id}
                onClick={() => {
                    onSelect(opt.value);
                }}
                className={`
                  w-full group relative flex items-center p-5 border text-left transition-all duration-200
                  ${isSelected 
                    ? 'border-charcoal bg-charcoal text-cream shadow-hard translate-x-[-2px] translate-y-[-2px]' 
                    : 'border-charcoal/20 bg-white hover:border-charcoal text-charcoal'}
                `}
              >
                {/* Visual Swatch if color exists */}
                {opt.colorHex && (
                  <span 
                    className={`w-12 h-12 border border-charcoal mr-6 flex-shrink-0 ${isSelected ? 'ring-2 ring-cream ring-offset-2 ring-offset-charcoal' : ''}`}
                    style={{ backgroundColor: opt.colorHex }}
                  />
                )}

                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className={`font-serif text-2xl italic ${isSelected ? 'text-cream' : 'text-charcoal'}`}>
                      {opt.label}
                    </span>
                    {opt.priceMod && (
                      <span className={`font-mono text-[10px] px-2 py-1 border ${isSelected ? 'border-cream text-cream' : 'border-charcoal text-charcoal'}`}>
                        {opt.priceMod > 0 ? '+' : ''}£{opt.priceMod}
                      </span>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <div className="ml-4 text-accent">
                    <Check size={20} strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-charcoal bg-cream">
          <button
            onClick={onClose}
            className="w-full py-4 bg-transparent border border-charcoal text-charcoal hover:bg-charcoal hover:text-cream font-mono text-xs tracking-[0.2em] uppercase transition-all"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </>
  );
};

export default SelectionDrawer;


