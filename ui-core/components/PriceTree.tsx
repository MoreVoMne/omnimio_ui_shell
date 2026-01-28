
import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { ConfigurationState } from '../types';
import { PRICE_BREAKDOWN } from '../constants';

interface PriceTreeProps {
  configuration: ConfigurationState;
  totalPrice: number;
  onClose: () => void;
}

export const PriceTree: React.FC<PriceTreeProps> = ({ configuration, totalPrice, onClose }) => {
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-cream/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[400px] bg-cream border border-charcoal p-8 shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-charcoal hover:text-accent transition-colors">
          <X size={24} strokeWidth={1} />
        </button>

        {/* Editorial Header */}
        <div className="mb-8">
            <h2 className="font-serif text-4xl text-charcoal tracking-tight mb-2">Price Breakdown</h2>
            <div className="h-[2px] w-12 bg-accent" />
        </div>

        {/* List of Items - Swiss Monospace */}
        <div className="space-y-6 mb-8">
          {/* Base Item */}
          <div className="flex justify-between items-baseline group">
             <span className="font-mono text-xs uppercase tracking-widest text-charcoal group-hover:text-accent transition-colors">
                Aurora Bag (Base)
             </span>
             <span className="font-serif text-lg italic text-charcoal">
                ${PRICE_BREAKDOWN.base}
             </span>
          </div>

          {/* Handle Add-ons */}
          {configuration.handleSize === 'extended' && (
               <div className="flex justify-between items-baseline group">
                   <span className="font-mono text-xs uppercase tracking-widest text-charcoal group-hover:text-accent transition-colors">
                      Handle: Extended
                   </span>
                   <span className="font-serif text-lg italic text-charcoal">
                      +${PRICE_BREAKDOWN.handle.size}
                   </span>
               </div>
           )}
           {configuration.handleMaterial === 'contrast' && (
               <div className="flex justify-between items-baseline group">
                   <span className="font-mono text-xs uppercase tracking-widest text-charcoal group-hover:text-accent transition-colors">
                      Handle: Contrast
                   </span>
                   <span className="font-serif text-lg italic text-charcoal">
                      +${PRICE_BREAKDOWN.handle.contrast}
                   </span>
               </div>
           )}
           {configuration.handleMaterial === 'chain' && (
               <div className="flex justify-between items-baseline group">
                   <span className="font-mono text-xs uppercase tracking-widest text-charcoal group-hover:text-accent transition-colors">
                      Handle: Gold Chain
                   </span>
                   <span className="font-serif text-lg italic text-charcoal">
                      +${PRICE_BREAKDOWN.handle.chain}
                   </span>
               </div>
           )}

           {/* Surface Add-ons */}
           {configuration.surfacePrint !== 'none' && (
               <div className="flex justify-between items-baseline group">
                   <span className="font-mono text-xs uppercase tracking-widest text-charcoal group-hover:text-accent transition-colors">
                      Surface: {configuration.surfacePrint}
                   </span>
                   <span className="font-serif text-lg italic text-charcoal">
                      +${PRICE_BREAKDOWN.surface.print}
                   </span>
               </div>
           )}
           
           {configuration.surfaceText !== 'none' && (
               <div className="flex justify-between items-baseline group">
                   <span className="font-mono text-xs uppercase tracking-widest text-charcoal group-hover:text-accent transition-colors">
                      Custom Label
                   </span>
                   <span className="font-serif text-lg italic text-charcoal">
                      +$25
                   </span>
               </div>
           )}
        </div>
          
        {/* Total Divider */}
        <div className="border-t border-charcoal pt-6 flex justify-between items-center">
            <span className="font-serif text-2xl italic text-charcoal">Total Estimate</span>
            <span className="font-serif text-4xl text-charcoal">${totalPrice}</span>
        </div>

        {/* Minimal Footer Hint */}
        <div className="mt-12 text-center">
             <p className="font-mono text-[9px] uppercase tracking-widest text-charcoal/60">
                Hover items to see pin on model
             </p>
        </div>

      </motion.div>
    </motion.div>
  );
};
