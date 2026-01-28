/**
 * Screen 2: Capability Walkthrough
 * Iterates through enabled capabilities and configures each one
 * Includes 3D part selection mode with fast selectors
 */

import React, { useState } from 'react';
import type {
  CapabilityWizardState,
  CapabilityType,
  PartSelectionState,
} from '../types-capability-wizard';

import QuizCard from './capability-wizard/QuizCard';
import PartSelectionToolbar from './capability-wizard/PartSelectionToolbar';
import FastSelectors from './capability-wizard/FastSelectors';

// Capability template components
import SizeCapabilityCard from './capability-wizard/SizeCapabilityCard';
import MaterialsColorsCapabilityCard from './capability-wizard/MaterialsColorsCapabilityCard';
import PartsAddonsCapabilityCard from './capability-wizard/PartsAddonsCapabilityCard';
import PersonalizationCapabilityCard from './capability-wizard/PersonalizationCapabilityCard';

interface CapabilityWizardScreen2Props {
  wizardState: CapabilityWizardState;
  currentCapability: CapabilityType;
  capabilityIndex: number;
  totalCapabilities: number;
  onComplete: (capabilityType: CapabilityType, data: any) => void;
  onBack: () => void;
  onUpdatePartSelection: (partSelection: PartSelectionState) => void;
}

const CapabilityWizardScreen2: React.FC<CapabilityWizardScreen2Props> = ({
  wizardState,
  currentCapability,
  capabilityIndex,
  totalCapabilities,
  onComplete,
  onBack,
  onUpdatePartSelection,
}) => {
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  const { parts, partSelection, modelUrl } = wizardState;

  // Part selection handlers
  const handlePartClick = (partId: string) => {
    if (!partSelection.isSelectionModeActive) return;

    const newSelection = new Set(partSelection.selectedPartIds);
    if (newSelection.has(partId)) {
      newSelection.delete(partId);
    } else {
      newSelection.add(partId);
    }

    onUpdatePartSelection({
      ...partSelection,
      selectedPartIds: newSelection,
    });
  };

  const handleClearSelection = () => {
    onUpdatePartSelection({
      ...partSelection,
      selectedPartIds: new Set(),
    });
  };

  const handleSelectAll = () => {
    const allIds = new Set(parts.map((p) => p.id));
    onUpdatePartSelection({
      ...partSelection,
      selectedPartIds: allIds,
    });
  };

  const handleInvertSelection = () => {
    const allIds = new Set(parts.map((p) => p.id));
    const newSelection = new Set<string>();
    allIds.forEach((id) => {
      if (!partSelection.selectedPartIds.has(id)) {
        newSelection.add(id);
      }
    });
    onUpdatePartSelection({
      ...partSelection,
      selectedPartIds: newSelection,
    });
  };

  const handleDoneSelection = () => {
    onUpdatePartSelection({
      ...partSelection,
      isSelectionModeActive: false,
    });
  };

  const handleEnterSelectionMode = (capability: CapabilityType) => {
    onUpdatePartSelection({
      selectedPartIds: new Set(),
      targetingMode: 'none',
      isSelectionModeActive: true,
      currentCapability: capability,
    });
  };

  const handleFastSelectorChange = (partIds: Set<string>) => {
    onUpdatePartSelection({
      ...partSelection,
      selectedPartIds: partIds,
    });
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

  // Render the appropriate capability card
  const renderCapabilityCard = () => {
    const capabilityData = wizardState.capabilities[currentCapability];

    switch (currentCapability) {
      case 'size':
        return (
          <SizeCapabilityCard
            miniChoices={capabilityData.miniChoices || {}}
            onComplete={(data) => onComplete(currentCapability, data)}
            onBack={onBack}
          />
        );

      case 'materials-colors':
        return (
          <MaterialsColorsCapabilityCard
            miniChoices={capabilityData.miniChoices || {}}
            parts={parts}
            partSelection={partSelection}
            onEnterSelectionMode={() => handleEnterSelectionMode(currentCapability)}
            onComplete={(data) => onComplete(currentCapability, data)}
            onBack={onBack}
          />
        );

      case 'parts-addons':
        return (
          <PartsAddonsCapabilityCard
            miniChoices={capabilityData.miniChoices || {}}
            parts={parts}
            partSelection={partSelection}
            onEnterSelectionMode={() => handleEnterSelectionMode(currentCapability)}
            onComplete={(data) => onComplete(currentCapability, data)}
            onBack={onBack}
          />
        );

      case 'personalization':
        return (
          <PersonalizationCapabilityCard
            miniChoices={capabilityData.miniChoices || {}}
            parts={parts}
            partSelection={partSelection}
            uvMapDetected={wizardState.analysisResult?.uvMapDetected || false}
            onEnterSelectionMode={() => handleEnterSelectionMode(currentCapability)}
            onComplete={(data) => onComplete(currentCapability, data)}
            onBack={onBack}
          />
        );

      default:
        return null;
    }
  };

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
          {getCapabilityTitle(currentCapability)} • {capabilityIndex + 1} of{' '}
          {totalCapabilities}
        </div>
        <div className="w-20" /> {/* Spacer */}
      </div>

      {/* Main Area: 3D Viewer + Quiz Card */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 3D Viewer */}
        <div className="flex-1 bg-charcoal/5 relative">
          {/* 3D Model */}
          <model-viewer
            src={modelUrl || ''}
            camera-controls
            touch-action="pan-y"
            style={{ width: '100%', height: '100%' }}
            className="w-full h-full"
          />

          {/* Selection Mode Overlay */}
          {partSelection.isSelectionModeActive && (
            <div className="absolute top-4 right-4 bg-cream border border-charcoal/20 rounded-sm p-4 shadow-hard max-w-xs">
              <div className="font-mono text-[9px] uppercase tracking-widest text-charcoal/60 mb-3">
                Fast Selectors
              </div>
              <FastSelectors
                parts={parts}
                selectedPartIds={partSelection.selectedPartIds}
                onSelectionChange={handleFastSelectorChange}
                onVisibilityToggle={() => setShowOnlySelected(!showOnlySelected)}
                showOnlySelected={showOnlySelected}
              />
            </div>
          )}

          {/* Selection hint overlay */}
          {partSelection.isSelectionModeActive && (
            <div className="absolute top-4 left-4 bg-charcoal/90 text-cream px-4 py-2 rounded-sm">
              <div className="font-mono text-[10px] uppercase tracking-widest">
                Click parts to select • Use fast selectors →
              </div>
            </div>
          )}
        </div>

        {/* Bottom Quiz Card or Selection Toolbar */}
        {partSelection.isSelectionModeActive ? (
          <QuizCard
            title={`Selecting parts for: ${getCapabilityTitle(currentCapability)}`}
            collapsed={true}
            showNext={false}
          >
            <PartSelectionToolbar
              selectedCount={partSelection.selectedPartIds.size}
              totalCount={parts.length}
              onClear={handleClearSelection}
              onSelectAll={handleSelectAll}
              onInvert={handleInvertSelection}
              onDone={handleDoneSelection}
            />
          </QuizCard>
        ) : (
          renderCapabilityCard()
        )}
      </div>
    </div>
  );
};

export default CapabilityWizardScreen2;
