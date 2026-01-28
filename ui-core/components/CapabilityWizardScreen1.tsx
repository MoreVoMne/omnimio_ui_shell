/**
 * Screen 1: Choose Customer-Facing Capabilities
 * Global capability selection with toggles and mini-choices
 */

import React from 'react';
import { Ruler, Palette, Layers, Type, CheckCircle2 } from 'lucide-react';
import type {
  CapabilityConfigMap,
  CapabilityType,
  ModelAnalysisResult,
} from '../types-capability-wizard';

interface CapabilityWizardScreen1Props {
  capabilities: CapabilityConfigMap;
  analysisResult?: ModelAnalysisResult;
  onUpdate: (capabilities: CapabilityConfigMap) => void;
  onContinue: () => void;
  onBack: () => void;
}

const CapabilityWizardScreen1: React.FC<CapabilityWizardScreen1Props> = ({
  capabilities,
  analysisResult,
  onUpdate,
  onContinue,
  onBack,
}) => {
  // Toggle capability enabled/disabled
  const toggleCapability = (capType: CapabilityType) => {
    const updated = {
      ...capabilities,
      [capType]: {
        ...capabilities[capType],
        enabled: !capabilities[capType].enabled,
      },
    };
    onUpdate(updated);
  };

  // Update mini choices
  const updateMiniChoice = (
    capType: CapabilityType,
    choice: string,
    value: boolean
  ) => {
    const updated = {
      ...capabilities,
      [capType]: {
        ...capabilities[capType],
        miniChoices: {
          ...capabilities[capType].miniChoices,
          [choice]: value,
        },
      },
    };
    onUpdate(updated);
  };

  // Count enabled capabilities
  const enabledCount = Object.values(capabilities).filter((c) => c.enabled).length;

  // Capability tile data
  const capabilityTiles: Array<{
    type: CapabilityType;
    icon: React.ReactNode;
    title: string;
    description: string;
    recommended?: boolean;
    miniChoices?: Array<{ key: string; label: string }>;
  }> = [
    {
      type: 'size',
      icon: <Ruler size={24} />,
      title: 'Size',
      description: 'Let customers choose dimensions or presets',
      miniChoices: [
        { key: 'presets', label: 'Presets' },
        { key: 'customInput', label: 'Custom input' },
      ],
    },
    {
      type: 'materials-colors',
      icon: <Palette size={24} />,
      title: 'Materials & Colors',
      description: 'Change materials, colors, and finishes',
      recommended: analysisResult && analysisResult.materialsCount > 1,
      miniChoices: [
        { key: 'material', label: 'Material' },
        { key: 'color', label: 'Color' },
        { key: 'variant', label: 'Variant' },
      ],
    },
    {
      type: 'parts-addons',
      icon: <Layers size={24} />,
      title: 'Parts & Add-ons',
      description: 'Swap parts, add optional items, or customize components',
      recommended: analysisResult && analysisResult.partsCount > 5,
      miniChoices: [
        { key: 'optional', label: 'Optional' },
        { key: 'swappable', label: 'Swappable' },
        { key: 'addons', label: 'Add-ons' },
      ],
    },
    {
      type: 'personalization',
      icon: <Type size={24} />,
      title: 'Personalization',
      description: 'Add text, images, or patterns to surfaces',
      recommended: analysisResult?.uvMapDetected,
      miniChoices: [
        { key: 'text', label: 'Text' },
        { key: 'image', label: 'Image' },
        { key: 'pattern', label: 'Pattern' },
      ],
    },
  ];

  return (
    <div className="h-screen flex flex-col bg-desk">
      {/* Top Bar */}
      <div className="h-16 border-b border-charcoal/20 bg-cream flex items-center justify-between px-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-charcoal/60 hover:text-charcoal transition-colors"
        >
          <span>←</span> Back
        </button>
        <div className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60">
          Step 2 of 3
        </div>
        <div className="w-20" /> {/* Spacer */}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-6 md:p-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-serif text-3xl md:text-4xl italic mb-3">
              What can customers customize?
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60">
              Check all that apply
            </p>
          </div>

          {/* Capability Tiles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {capabilityTiles.map((tile) => {
              const isEnabled = capabilities[tile.type].enabled;
              const miniChoices = capabilities[tile.type].miniChoices || {};

              return (
                <div
                  key={tile.type}
                  className={`border rounded-sm transition-all ${
                    isEnabled
                      ? 'border-charcoal bg-white shadow-hard'
                      : 'border-charcoal/20 bg-cream hover:border-charcoal/40 hover:bg-white'
                  }`}
                >
                  {/* Main Toggle */}
                  <button
                    onClick={() => toggleCapability(tile.type)}
                    className="w-full p-6 text-left"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`${
                            isEnabled ? 'text-charcoal' : 'text-charcoal/40'
                          }`}
                        >
                          {tile.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-serif text-xl italic">
                              {tile.title}
                            </h3>
                            {tile.recommended && !isEnabled && (
                              <span className="px-2 py-0.5 bg-accent/10 border border-accent/30 rounded-sm font-mono text-[8px] uppercase tracking-widest text-accent">
                                Recommended
                              </span>
                            )}
                          </div>
                          <p className="font-mono text-[9px] text-charcoal/60 mt-1">
                            {tile.description}
                          </p>
                        </div>
                      </div>

                      {/* Toggle Indicator */}
                      <div
                        className={`flex-shrink-0 w-6 h-6 border-2 rounded-sm flex items-center justify-center transition-all ${
                          isEnabled
                            ? 'border-charcoal bg-charcoal'
                            : 'border-charcoal/30'
                        }`}
                      >
                        {isEnabled && (
                          <CheckCircle2 size={16} className="text-cream" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Mini Choices (only when enabled) */}
                  {isEnabled && tile.miniChoices && (
                    <div className="px-6 pb-6 pt-0">
                      <div className="border-t border-charcoal/10 pt-4">
                        <div className="font-mono text-[9px] uppercase tracking-widest text-charcoal/60 mb-3">
                          Options
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {tile.miniChoices.map((choice) => {
                            const isChoiceEnabled = miniChoices[choice.key];
                            return (
                              <button
                                key={choice.key}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateMiniChoice(
                                    tile.type,
                                    choice.key,
                                    !isChoiceEnabled
                                  );
                                }}
                                className={`px-3 py-1.5 rounded-sm font-mono text-[9px] uppercase tracking-widest transition-all ${
                                  isChoiceEnabled
                                    ? 'bg-charcoal text-cream'
                                    : 'bg-charcoal/10 text-charcoal/60 hover:bg-charcoal/20'
                                }`}
                              >
                                {choice.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary & CTA */}
          <div className="bg-cream border border-charcoal/20 rounded-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60 mb-1">
                  Selected capabilities
                </div>
                <div className="font-mono text-2xl font-semibold">
                  {enabledCount}
                </div>
                {enabledCount > 0 && (
                  <div className="font-mono text-[9px] text-charcoal/60 mt-1">
                    Setup will take ~{enabledCount * 5} minutes
                  </div>
                )}
              </div>
              <button
                onClick={onContinue}
                disabled={enabledCount === 0}
                className={`font-mono text-[10px] uppercase tracking-widest py-3 px-8 transition-colors ${
                  enabledCount === 0
                    ? 'bg-charcoal/20 text-charcoal/40 cursor-not-allowed'
                    : 'bg-charcoal text-cream hover:bg-charcoal/90'
                }`}
              >
                Continue →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CapabilityWizardScreen1;
