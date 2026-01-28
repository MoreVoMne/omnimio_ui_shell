import React from 'react';
import { useCanvasStore } from '../../stores/canvasStore';

const PreviewSentence: React.FC = () => {
  const { selectedProduct, parts, capabilities } = useCanvasStore();

  const generateSentence = (): string => {
    if (!selectedProduct) {
      return 'No product selected';
    }

    let sentence = selectedProduct.name;

    // Get capabilities for all parts
    const allCapabilities = Array.from(capabilities.values()).flat();

    // Build sentence from configured capabilities
    const materialCap = allCapabilities.find((c) => c.type === 'material' && c.configured);
    const colorCap = allCapabilities.find((c) => c.type === 'color' && c.configured);
    const finishCap = allCapabilities.find((c) => c.type === 'finish' && c.configured);

    const partsWithCapabilities = parts
      .map((part) => {
        const partCaps = capabilities.get(part.id) || [];
        return { part, caps: partCaps.filter((c) => c.configured) };
      })
      .filter(({ caps }) => caps.length > 0);

    if (materialCap || colorCap || finishCap || partsWithCapabilities.length > 0) {
      sentence += ' in';

      if (materialCap) {
        const defaultOption = materialCap.config?.options?.find((o) => o.isDefault);
        sentence += ` [${defaultOption?.customerName || 'material'}]`;
      }

      if (colorCap) {
        sentence += ' [color]';
      }

      if (finishCap) {
        sentence += ' [finish]';
      }

      partsWithCapabilities.forEach(({ part, caps }) => {
        const partCap = caps[0];
        if (partCap) {
          sentence += ` with [${part.name} ${partCap.type}]`;
        }
      });

      const printCap = allCapabilities.find((c) => c.type === 'print' && c.configured);
      if (printCap) {
        sentence += ' + Add print';
      }
    } else {
      sentence += ' (no customizations yet)';
    }

    return sentence;
  };

  return (
    <div className="space-y-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] mb-2">PREVIEW SENTENCE</div>
      <div className="font-serif text-base leading-relaxed text-charcoal border border-charcoal/20 rounded-[12px] p-3 bg-cream/60">
        "{generateSentence()}"
      </div>
    </div>
  );
};

export default PreviewSentence;

