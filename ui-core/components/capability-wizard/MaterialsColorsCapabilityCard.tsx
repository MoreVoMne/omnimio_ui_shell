/**
 * Materials & Colors Capability Configuration Card
 * Handles material, color, and variant options with part targeting
 */

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import QuizCard from './QuizCard';
import type {
  MaterialsColorsCapabilityData,
  PartTargetingMode,
  PartIdentity,
  PartSelectionState,
  MaterialOption,
  ColorOption,
} from '../../types-capability-wizard';

interface MaterialsColorsCapabilityCardProps {
  miniChoices: any;
  parts: PartIdentity[];
  partSelection: PartSelectionState;
  onEnterSelectionMode: () => void;
  onComplete: (data: MaterialsColorsCapabilityData) => void;
  onBack: () => void;
}

const MaterialsColorsCapabilityCard: React.FC<MaterialsColorsCapabilityCardProps> = ({
  miniChoices,
  parts,
  partSelection,
  onEnterSelectionMode,
  onComplete,
  onBack,
}) => {
  const allowMaterial = miniChoices.material !== false;
  const allowColor = miniChoices.color !== false;
  const allowVariant = miniChoices.variant !== false;

  const [targetingMode, setTargetingMode] = useState<PartTargetingMode>('all');
  const [step, setStep] = useState<'targeting' | 'configure'>('targeting');

  const [materials, setMaterials] = useState<MaterialOption[]>([
    {
      id: '1',
      label: 'Leather',
      isDefault: true,
      colors: [
        { id: 'c1', label: 'Black', hex: '#000000' },
        { id: 'c2', label: 'Brown', hex: '#8B4513' },
      ],
      variants: [
        { id: 'v1', label: 'Matte' },
        { id: 'v2', label: 'Glossy' },
      ],
    },
  ]);

  const [standaloneColors, setStandaloneColors] = useState<ColorOption[]>([
    { id: 'c1', label: 'Black', hex: '#000000' },
  ]);

  // Add material
  const addMaterial = () => {
    const newMaterial: MaterialOption = {
      id: String(Date.now()),
      label: `Material ${materials.length + 1}`,
      isDefault: materials.length === 0,
      colors: [],
      variants: [],
    };
    setMaterials([...materials, newMaterial]);
  };

  // Remove material
  const removeMaterial = (id: string) => {
    setMaterials(materials.filter((m) => m.id !== id));
  };

  // Update material
  const updateMaterial = (id: string, updates: Partial<MaterialOption>) => {
    setMaterials(
      materials.map((m) => {
        if (m.id === id) {
          if (updates.isDefault) {
            return { ...m, ...updates };
          }
          return { ...m, ...updates };
        }
        if (updates.isDefault) {
          return { ...m, isDefault: false };
        }
        return m;
      })
    );
  };

  // Add color to material
  const addColorToMaterial = (materialId: string) => {
    const colorCount = materials.find((m) => m.id === materialId)?.colors.length || 0;
    const newColor: ColorOption = {
      id: String(Date.now()),
      label: `Color ${colorCount + 1}`,
      hex: '#CCCCCC',
    };
    setMaterials(
      materials.map((m) =>
        m.id === materialId
          ? { ...m, colors: [...m.colors, newColor] }
          : m
      )
    );
  };

  // Handle targeting mode selection
  const handleTargetingSelect = (mode: PartTargetingMode) => {
    setTargetingMode(mode);

    if (mode === 'some' || mode === 'except') {
      // Enter selection mode
      onEnterSelectionMode();
    } else {
      // Move to configuration
      setStep('configure');
    }
  };

  // When selection is done, move to configure
  React.useEffect(() => {
    if (!partSelection.isSelectionModeActive && step === 'targeting' && (targetingMode === 'some' || targetingMode === 'except')) {
      setStep('configure');
    }
  }, [partSelection.isSelectionModeActive, step, targetingMode]);

  // Handle complete
  const handleContinue = () => {
    const data: MaterialsColorsCapabilityData = {
      targetingMode,
      selectedPartIds: targetingMode === 'some' ? Array.from(partSelection.selectedPartIds) : [],
      excludedPartIds: targetingMode === 'except' ? Array.from(partSelection.selectedPartIds) : [],
      allowMaterial,
      allowColor,
      allowVariant,
      materials: allowMaterial ? materials : [],
      standaloneColors: !allowMaterial && allowColor ? standaloneColors : undefined,
      exceptions: [],
    };
    onComplete(data);
  };

  const canContinue = step === 'configure' && (
    (allowMaterial && materials.length > 0) ||
    (!allowMaterial && allowColor && standaloneColors.length > 0)
  );

  // Render targeting step
  if (step === 'targeting') {
    return (
      <QuizCard
        title="Does this apply to all parts?"
        subtitle="Materials & Colors • Part Targeting"
        onBack={onBack}
        showNext={false}
      >
        <div className="space-y-3">
          <button
            onClick={() => handleTargetingSelect('all')}
            className={`w-full p-4 border rounded-sm text-left transition-all ${
              targetingMode === 'all'
                ? 'border-charcoal bg-white shadow-hard'
                : 'border-charcoal/20 bg-cream hover:border-charcoal/40'
            }`}
          >
            <div className="font-serif text-lg italic mb-1">All parts</div>
            <div className="font-mono text-[9px] text-charcoal/60">
              Apply to all {parts.length} parts
            </div>
          </button>

          <button
            onClick={() => handleTargetingSelect('some')}
            className={`w-full p-4 border rounded-sm text-left transition-all ${
              targetingMode === 'some'
                ? 'border-charcoal bg-white shadow-hard'
                : 'border-charcoal/20 bg-cream hover:border-charcoal/40'
            }`}
          >
            <div className="font-serif text-lg italic mb-1">Some parts</div>
            <div className="font-mono text-[9px] text-charcoal/60">
              Select which parts to apply to
            </div>
          </button>

          <button
            onClick={() => handleTargetingSelect('except')}
            className={`w-full p-4 border rounded-sm text-left transition-all ${
              targetingMode === 'except'
                ? 'border-charcoal bg-white shadow-hard'
                : 'border-charcoal/20 bg-cream hover:border-charcoal/40'
            }`}
          >
            <div className="font-serif text-lg italic mb-1">All except...</div>
            <div className="font-mono text-[9px] text-charcoal/60">
              Select parts to exclude
            </div>
          </button>
        </div>
      </QuizCard>
    );
  }

  // Render configuration step
  return (
    <QuizCard
      title="Define material and color options"
      subtitle="Materials & Colors • Configuration"
      onBack={() => setStep('targeting')}
      onNext={handleContinue}
      nextDisabled={!canContinue}
    >
      <div className="space-y-6">
        {/* Summary of targeting */}
        <div className="p-3 bg-charcoal/5 rounded-sm border border-charcoal/10">
          <div className="font-mono text-[9px] uppercase tracking-widest text-charcoal/60 mb-1">
            Applies to:
          </div>
          <div className="font-mono text-sm">
            {targetingMode === 'all' && `All ${parts.length} parts`}
            {targetingMode === 'some' && `${partSelection.selectedPartIds.size} selected parts`}
            {targetingMode === 'except' && `All except ${partSelection.selectedPartIds.size} parts`}
          </div>
        </div>

        {/* Materials (if enabled) */}
        {allowMaterial && (
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60 mb-3">
              Materials
            </div>
            <div className="space-y-3">
              {materials.map((material) => (
                <div
                  key={material.id}
                  className="p-4 border border-charcoal/20 rounded-sm bg-white space-y-3"
                >
                  <div className="flex items-center gap-3">
                    {/* Default radio */}
                    <button
                      onClick={() => updateMaterial(material.id, { isDefault: true })}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        material.isDefault
                          ? 'border-charcoal bg-charcoal'
                          : 'border-charcoal/30'
                      }`}
                    >
                      {material.isDefault && (
                        <div className="w-2 h-2 bg-cream rounded-full" />
                      )}
                    </button>

                    {/* Label */}
                    <input
                      type="text"
                      value={material.label}
                      onChange={(e) =>
                        updateMaterial(material.id, { label: e.target.value })
                      }
                      className="flex-1 border-none focus:outline-none bg-transparent font-mono text-sm"
                      placeholder="Material name"
                    />

                    {/* Remove */}
                    <button
                      onClick={() => removeMaterial(material.id)}
                      disabled={materials.length === 1}
                      className={`p-1 hover:bg-charcoal/5 rounded-sm ${
                        materials.length === 1 ? 'opacity-30 cursor-not-allowed' : ''
                      }`}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Colors (if enabled) */}
                  {allowColor && (
                    <div className="border-t border-charcoal/10 pt-3">
                      <div className="font-mono text-[9px] text-charcoal/60 mb-2">
                        Colors:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {material.colors.map((color) => (
                          <div
                            key={color.id}
                            className="flex items-center gap-2 px-3 py-1.5 bg-charcoal/5 rounded-sm"
                          >
                            <div
                              className="w-4 h-4 rounded-sm border border-charcoal/20"
                              style={{ backgroundColor: color.hex }}
                            />
                            <span className="font-mono text-xs">{color.label}</span>
                          </div>
                        ))}
                        <button
                          onClick={() => addColorToMaterial(material.id)}
                          className="px-3 py-1.5 border border-dashed border-charcoal/30 rounded-sm font-mono text-[9px] hover:border-charcoal"
                        >
                          <Plus size={12} className="inline" /> Add Color
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <button
                onClick={addMaterial}
                className="flex items-center gap-2 px-4 py-2 border border-charcoal/30 rounded-sm font-mono text-[9px] uppercase tracking-widest hover:border-charcoal hover:bg-white transition-colors"
              >
                <Plus size={14} />
                Add Material
              </button>
            </div>
          </div>
        )}
      </div>
    </QuizCard>
  );
};

export default MaterialsColorsCapabilityCard;
