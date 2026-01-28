/**
 * Capability Wizard Review Screen
 * Shows summary of all configured capabilities
 * Allows editing or confirming to complete setup
 */

import React from 'react';
import { CheckCircle2, Edit2, Ruler, Palette, Layers, Type } from 'lucide-react';
import type { CapabilityWizardState, CapabilityType } from '../types-capability-wizard';

interface CapabilityWizardReviewProps {
  wizardState: CapabilityWizardState;
  onConfirm: () => void;
  onBack: () => void;
  onEditCapability: (capType: CapabilityType) => void;
}

const CapabilityWizardReview: React.FC<CapabilityWizardReviewProps> = ({
  wizardState,
  onConfirm,
  onBack,
  onEditCapability,
}) => {
  // Get capability icon
  const getCapabilityIcon = (capType: CapabilityType) => {
    switch (capType) {
      case 'size':
        return <Ruler size={20} />;
      case 'materials-colors':
        return <Palette size={20} />;
      case 'parts-addons':
        return <Layers size={20} />;
      case 'personalization':
        return <Type size={20} />;
    }
  };

  // Get capability title
  const getCapabilityTitle = (capType: CapabilityType): string => {
    switch (capType) {
      case 'size':
        return 'Size';
      case 'materials-colors':
        return 'Materials & Colors';
      case 'parts-addons':
        return 'Parts & Add-ons';
      case 'personalization':
        return 'Personalization';
    }
  };

  // Get capability summary
  const getCapabilitySummary = (capType: CapabilityType): string[] => {
    switch (capType) {
      case 'size':
        const sizeData = wizardState.sizeData;
        if (!sizeData) return ['Not configured'];
        const summary = [];
        if (sizeData.usePresets) {
          summary.push(`${sizeData.presets.length} preset sizes`);
        }
        if (sizeData.useCustomInput) {
          summary.push(`Custom input (${sizeData.customConfig?.allowedDimensions.length || 0} dimensions)`);
        }
        return summary;

      case 'materials-colors':
        const matData = wizardState.materialsColorsData;
        if (!matData) return ['Not configured'];
        return [
          `${matData.materials.length} materials`,
          `Applies to: ${matData.targetingMode === 'all' ? 'all parts' : matData.targetingMode === 'some' ? `${matData.selectedPartIds.length} parts` : `all except ${matData.excludedPartIds.length}`}`,
        ];

      case 'parts-addons':
        const partsData = wizardState.partsAddonsData;
        if (!partsData) return ['Not configured'];
        return [`${partsData.configurablePartIds.length} configurable parts`];

      case 'personalization':
        const personData = wizardState.personalizationData;
        if (!personData) return ['Not configured'];
        return [
          `${personData.targetPartIds.length} parts`,
          `${personData.methods.length} production methods`,
        ];
    }
  };

  const completedCapabilities = Array.from(wizardState.completedCapabilities);

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
          Review & Confirm
        </div>
        <div className="w-20" /> {/* Spacer */}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6 md:p-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-serif text-3xl md:text-4xl italic mb-3">
              Review Your Configuration
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60">
              {completedCapabilities.length} capabilities configured
            </p>
          </div>

          {/* 3D Model Preview */}
          <div className="mb-8 bg-charcoal/5 rounded-sm overflow-hidden" style={{ height: '300px' }}>
            <model-viewer
              src={wizardState.modelUrl || ''}
              camera-controls
              touch-action="pan-y"
              style={{ width: '100%', height: '100%' }}
              className="w-full h-full"
            />
          </div>

          {/* Capability Summary Cards */}
          <div className="space-y-4 mb-8">
            {completedCapabilities.map((capType) => {
              const summary = getCapabilitySummary(capType);
              return (
                <div
                  key={capType}
                  className="border border-charcoal/20 rounded-sm bg-cream hover:bg-white transition-colors"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Icon */}
                        <div className="p-3 bg-charcoal/5 rounded-sm">
                          {getCapabilityIcon(capType)}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-serif text-xl italic">
                              {getCapabilityTitle(capType)}
                            </h3>
                            <CheckCircle2 size={16} className="text-green-600" />
                          </div>
                          <ul className="space-y-1">
                            {summary.map((line, i) => (
                              <li key={i} className="font-mono text-sm text-charcoal/60">
                                • {line}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Edit Button */}
                      <button
                        onClick={() => onEditCapability(capType)}
                        className="flex items-center gap-2 px-4 py-2 border border-charcoal/30 rounded-sm font-mono text-[9px] uppercase tracking-widest hover:border-charcoal hover:bg-white transition-colors"
                      >
                        <Edit2 size={12} />
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="bg-cream border border-charcoal/20 rounded-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60 mb-1">
                  Ready to proceed?
                </div>
                <p className="font-mono text-sm text-charcoal/60">
                  You can always edit these settings later
                </p>
              </div>
              <button
                onClick={onConfirm}
                className="bg-charcoal text-cream font-mono text-[10px] uppercase tracking-widest py-3 px-8 hover:bg-charcoal/90 transition-colors"
              >
                Confirm & Complete →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CapabilityWizardReview;
