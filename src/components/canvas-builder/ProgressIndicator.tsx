import React from 'react';
import { useCanvasStore } from '../../stores/canvasStore';

const ProgressIndicator: React.FC = () => {
  const { parts, capabilities } = useCanvasStore();

  const namedPartsCount = parts.length;
  const totalPartsCount = parts.length; // Will be updated when we have mesh count

  const capabilitiesCount = Array.from(capabilities.values()).flat().length;
  const configuredCapabilitiesCount = Array.from(capabilities.values())
    .flat()
    .filter((c) => c.configured).length;

  const partsWithPricing = Array.from(capabilities.values())
    .flat()
    .filter((c) => c.config?.pricing && c.config.pricing.model !== 'none').length;

  const totalCapabilitiesWithPricing = Array.from(capabilities.values()).flat().length;

  return (
    <div className="space-y-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] mb-3">PROGRESS</div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className={namedPartsCount > 0 ? 'text-green-600' : 'text-charcoal/40'}>
            {namedPartsCount > 0 ? '●' : '○'}
          </span>
          <span className="font-mono text-xs uppercase tracking-widest text-charcoal/70">
            Name parts {namedPartsCount}/{totalPartsCount}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className={capabilitiesCount > 0 ? 'text-green-600' : 'text-charcoal/40'}>
            {capabilitiesCount > 0 ? '●' : '○'}
          </span>
          <span className="font-mono text-xs uppercase tracking-widest text-charcoal/70">
            Add capabilities {capabilitiesCount}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={
              configuredCapabilitiesCount > 0 && configuredCapabilitiesCount < capabilitiesCount
                ? 'text-yellow-600'
                : configuredCapabilitiesCount === capabilitiesCount && capabilitiesCount > 0
                ? 'text-green-600'
                : 'text-charcoal/40'
            }
          >
            {configuredCapabilitiesCount > 0 && configuredCapabilitiesCount < capabilitiesCount
              ? '◐'
              : configuredCapabilitiesCount === capabilitiesCount && capabilitiesCount > 0
              ? '●'
              : '○'}
          </span>
          <span className="font-mono text-xs uppercase tracking-widest text-charcoal/70">
            Configure {configuredCapabilitiesCount}/{capabilitiesCount}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={
              partsWithPricing > 0 && partsWithPricing < totalCapabilitiesWithPricing
                ? 'text-yellow-600'
                : partsWithPricing === totalCapabilitiesWithPricing && totalCapabilitiesWithPricing > 0
                ? 'text-green-600'
                : 'text-charcoal/40'
            }
          >
            {partsWithPricing === totalCapabilitiesWithPricing && totalCapabilitiesWithPricing > 0
              ? '●'
              : partsWithPricing > 0
              ? '◐'
              : '○'}
          </span>
          <span className="font-mono text-xs uppercase tracking-widest text-charcoal/70">
            Set pricing {partsWithPricing}/{totalCapabilitiesWithPricing}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator;

