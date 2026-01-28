/**
 * Parts & Add-ons Capability Configuration Card (Placeholder)
 * TODO: Implement full functionality
 */

import React, { useState } from 'react';
import QuizCard from './QuizCard';
import type {
  PartsAddonsCapabilityData,
  PartIdentity,
  PartSelectionState,
} from '../../types-capability-wizard';

interface PartsAddonsCapabilityCardProps {
  miniChoices: any;
  parts: PartIdentity[];
  partSelection: PartSelectionState;
  onEnterSelectionMode: () => void;
  onComplete: (data: PartsAddonsCapabilityData) => void;
  onBack: () => void;
}

const PartsAddonsCapabilityCard: React.FC<PartsAddonsCapabilityCardProps> = ({
  miniChoices,
  parts,
  partSelection,
  onEnterSelectionMode,
  onComplete,
  onBack,
}) => {
  const [step, setStep] = useState<'select' | 'configure'>('select');

  // Handle continue
  const handleContinue = () => {
    if (step === 'select') {
      onEnterSelectionMode();
      // Will auto-advance when selection is done
    } else {
      // Complete with placeholder data
      const data: PartsAddonsCapabilityData = {
        configurablePartIds: Array.from(partSelection.selectedPartIds),
        configType: ['optional'],
        defaultState: 'on',
        exceptions: [],
      };
      onComplete(data);
    }
  };

  // When selection is done, move to configure
  React.useEffect(() => {
    if (!partSelection.isSelectionModeActive && step === 'select' && partSelection.selectedPartIds.size > 0) {
      setStep('configure');
    }
  }, [partSelection.isSelectionModeActive, step, partSelection.selectedPartIds.size]);

  if (step === 'select' && !partSelection.isSelectionModeActive) {
    return (
      <QuizCard
        title="Select parts that customers can configure"
        subtitle="Parts & Add-ons"
        onBack={onBack}
        onNext={handleContinue}
        nextLabel="Select Parts"
      >
        <div className="p-4 bg-charcoal/5 rounded-sm border border-charcoal/10">
          <p className="font-mono text-sm text-charcoal/60">
            Click "Select Parts" to enter selection mode and choose which parts customers can modify.
          </p>
        </div>
      </QuizCard>
    );
  }

  // Configuration step
  return (
    <QuizCard
      title="What can customers do with these parts?"
      subtitle="Parts & Add-ons • Configuration"
      onBack={() => setStep('select')}
      onNext={() => {
        const data: PartsAddonsCapabilityData = {
          configurablePartIds: Array.from(partSelection.selectedPartIds),
          configType: ['optional'],
          defaultState: 'on',
          exceptions: [],
        };
        onComplete(data);
      }}
      nextDisabled={partSelection.selectedPartIds.size === 0}
    >
      <div className="space-y-4">
        <div className="p-3 bg-charcoal/5 rounded-sm border border-charcoal/10">
          <div className="font-mono text-[9px] uppercase tracking-widest text-charcoal/60 mb-1">
            Selected parts:
          </div>
          <div className="font-mono text-sm">
            {partSelection.selectedPartIds.size} parts
          </div>
        </div>

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-sm">
          <p className="font-mono text-xs text-yellow-800">
            📝 Placeholder: Full configuration UI will be implemented in next iteration.
          </p>
        </div>
      </div>
    </QuizCard>
  );
};

export default PartsAddonsCapabilityCard;
