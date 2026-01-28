/**
 * Personalization Capability Configuration Card (Placeholder)
 * TODO: Implement full functionality with methods, placement, UV calibration
 */

import React, { useState } from 'react';
import QuizCard from './QuizCard';
import type {
  PersonalizationCapabilityData,
  PartIdentity,
  PartSelectionState,
} from '../../types-capability-wizard';

interface PersonalizationCapabilityCardProps {
  miniChoices: any;
  parts: PartIdentity[];
  partSelection: PartSelectionState;
  uvMapDetected: boolean;
  onEnterSelectionMode: () => void;
  onComplete: (data: PersonalizationCapabilityData) => void;
  onBack: () => void;
}

const PersonalizationCapabilityCard: React.FC<PersonalizationCapabilityCardProps> = ({
  miniChoices,
  parts,
  partSelection,
  uvMapDetected,
  onEnterSelectionMode,
  onComplete,
  onBack,
}) => {
  const [step, setStep] = useState<'select' | 'configure'>('select');

  // When selection is done, move to configure
  React.useEffect(() => {
    if (!partSelection.isSelectionModeActive && step === 'select' && partSelection.selectedPartIds.size > 0) {
      setStep('configure');
    }
  }, [partSelection.isSelectionModeActive, step, partSelection.selectedPartIds.size]);

  if (step === 'select' && !partSelection.isSelectionModeActive) {
    return (
      <QuizCard
        title="Select parts where customers can personalize"
        subtitle="Personalization"
        onBack={onBack}
        onNext={onEnterSelectionMode}
        nextLabel="Select Parts"
      >
        <div className="space-y-4">
          {!uvMapDetected && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-sm">
              <div className="font-mono text-[10px] uppercase tracking-widest text-yellow-800 mb-2">
                ⚠️ UV Map Not Detected
              </div>
              <p className="font-mono text-xs text-yellow-700">
                Personalization features may be limited without UV mapping.
              </p>
            </div>
          )}
          <div className="p-4 bg-charcoal/5 rounded-sm border border-charcoal/10">
            <p className="font-mono text-sm text-charcoal/60">
              Click "Select Parts" to choose which surfaces can be personalized with text, images, or patterns.
            </p>
          </div>
        </div>
      </QuizCard>
    );
  }

  return (
    <QuizCard
      title="Configure personalization options"
      subtitle="Personalization • Configuration"
      onBack={() => setStep('select')}
      onNext={() => {
        const data: PersonalizationCapabilityData = {
          targetPartIds: Array.from(partSelection.selectedPartIds),
          types: ['text', 'image'],
          methods: [
            {
              id: '1',
              methodType: 'print',
              supportsRaisedEffect: false,
              pricingTemplate: 'flat',
              rate: 10,
            },
          ],
          placementMode: 'anywhere',
          uvMapDetected,
          physicalScaleCalibrated: false,
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
            📝 Placeholder: Full configuration UI (methods, placement, UV calibration) will be implemented in next iteration.
          </p>
        </div>
      </div>
    </QuizCard>
  );
};

export default PersonalizationCapabilityCard;
