/**
 * Size Capability Configuration Card
 * Handles preset sizes and custom input configuration
 */

import React, { useState } from 'react';
import { Plus, X, Check } from 'lucide-react';
import QuizCard from './QuizCard';
import type { SizeCapabilityData, SizePreset } from '../../types-capability-wizard';

interface SizeCapabilityCardProps {
  miniChoices: any;
  onComplete: (data: SizeCapabilityData) => void;
  onBack: () => void;
}

const SizeCapabilityCard: React.FC<SizeCapabilityCardProps> = ({
  miniChoices,
  onComplete,
  onBack,
}) => {
  const usePresets = miniChoices.presets !== false;
  const useCustomInput = miniChoices.customInput !== false;

  const [presets, setPresets] = useState<SizePreset[]>([
    { id: '1', label: 'Small', isDefault: false },
    { id: '2', label: 'Medium', isDefault: true },
    { id: '3', label: 'Large', isDefault: false },
  ]);

  const [customConfig, setCustomConfig] = useState({
    allowedDimensions: ['width', 'height'] as ('width' | 'height' | 'depth' | 'length')[],
    ranges: {
      width: { min: 10, max: 100, step: 1 },
      height: { min: 10, max: 100, step: 1 },
    },
    lockProportions: false,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Add new preset
  const addPreset = () => {
    const newPreset: SizePreset = {
      id: String(Date.now()),
      label: `Size ${presets.length + 1}`,
      isDefault: presets.length === 0,
    };
    setPresets([...presets, newPreset]);
  };

  // Remove preset
  const removePreset = (id: string) => {
    setPresets(presets.filter((p) => p.id !== id));
  };

  // Update preset
  const updatePreset = (id: string, updates: Partial<SizePreset>) => {
    setPresets(
      presets.map((p) => {
        if (p.id === id) {
          // If setting this as default, unset others
          if (updates.isDefault) {
            return { ...p, ...updates };
          }
          return { ...p, ...updates };
        }
        // Unset default from others if this one is being set as default
        if (updates.isDefault) {
          return { ...p, isDefault: false };
        }
        return p;
      })
    );
  };

  // Toggle dimension
  const toggleDimension = (dim: 'width' | 'height' | 'depth' | 'length') => {
    const allowed = new Set(customConfig.allowedDimensions);
    if (allowed.has(dim)) {
      allowed.delete(dim);
    } else {
      allowed.add(dim);
    }
    setCustomConfig({
      ...customConfig,
      allowedDimensions: Array.from(allowed) as any,
    });
  };

  // Handle continue
  const handleContinue = () => {
    const data: SizeCapabilityData = {
      usePresets,
      presets: usePresets ? presets : [],
      defaultPresetId: presets.find((p) => p.isDefault)?.id,
      useCustomInput,
      customConfig: useCustomInput ? customConfig : undefined,
    };
    onComplete(data);
  };

  const canContinue = (usePresets && presets.length > 0) || useCustomInput;

  return (
    <QuizCard
      title="How can customers choose size?"
      subtitle="Size Configuration"
      onBack={onBack}
      onNext={handleContinue}
      nextDisabled={!canContinue}
    >
      <div className="space-y-6">
        {/* Preset Sizes */}
        {usePresets && (
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60 mb-3">
              Preset Sizes
            </div>
            <div className="space-y-2">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className="flex items-center gap-3 p-3 border border-charcoal/20 rounded-sm bg-white"
                >
                  {/* Default radio */}
                  <button
                    onClick={() => updatePreset(preset.id, { isDefault: true })}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      preset.isDefault
                        ? 'border-charcoal bg-charcoal'
                        : 'border-charcoal/30'
                    }`}
                    title="Set as default"
                  >
                    {preset.isDefault && (
                      <div className="w-2 h-2 bg-cream rounded-full" />
                    )}
                  </button>

                  {/* Label input */}
                  <input
                    type="text"
                    value={preset.label}
                    onChange={(e) =>
                      updatePreset(preset.id, { label: e.target.value })
                    }
                    className="flex-1 border-none focus:outline-none bg-transparent font-mono text-sm"
                    placeholder="Size name"
                  />

                  {/* Remove */}
                  <button
                    onClick={() => removePreset(preset.id)}
                    disabled={presets.length === 1}
                    className={`p-1 hover:bg-charcoal/5 rounded-sm transition-colors ${
                      presets.length === 1
                        ? 'opacity-30 cursor-not-allowed'
                        : ''
                    }`}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addPreset}
              className="mt-3 flex items-center gap-2 px-4 py-2 border border-charcoal/30 rounded-sm font-mono text-[9px] uppercase tracking-widest hover:border-charcoal hover:bg-white transition-colors"
            >
              <Plus size={14} />
              Add Size
            </button>
          </div>
        )}

        {/* Custom Input */}
        {useCustomInput && (
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60 mb-3">
              Custom Input
            </div>
            <div className="p-4 border border-charcoal/20 rounded-sm bg-white space-y-4">
              <div>
                <div className="font-mono text-[9px] text-charcoal/60 mb-2">
                  Customers can enter:
                </div>
                <div className="flex flex-wrap gap-2">
                  {(['width', 'height', 'depth', 'length'] as const).map((dim) => (
                    <button
                      key={dim}
                      onClick={() => toggleDimension(dim)}
                      className={`px-3 py-1.5 rounded-sm font-mono text-[9px] uppercase tracking-widest transition-all ${
                        customConfig.allowedDimensions.includes(dim)
                          ? 'bg-charcoal text-cream'
                          : 'bg-charcoal/10 text-charcoal/60 hover:bg-charcoal/20'
                      }`}
                    >
                      {dim}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ranges for selected dimensions */}
              {customConfig.allowedDimensions.length > 0 && (
                <div className="space-y-3">
                  {customConfig.allowedDimensions.map((dim) => (
                    <div key={dim} className="grid grid-cols-3 gap-3">
                      <div className="font-mono text-sm capitalize text-charcoal/60">
                        {dim}:
                      </div>
                      <input
                        type="number"
                        value={customConfig.ranges[dim]?.min || 0}
                        onChange={(e) =>
                          setCustomConfig({
                            ...customConfig,
                            ranges: {
                              ...customConfig.ranges,
                              [dim]: {
                                ...customConfig.ranges[dim],
                                min: Number(e.target.value),
                              },
                            },
                          })
                        }
                        className="px-3 py-2 border border-charcoal/20 rounded-sm font-mono text-sm focus:border-charcoal focus:outline-none"
                        placeholder="Min"
                      />
                      <input
                        type="number"
                        value={customConfig.ranges[dim]?.max || 100}
                        onChange={(e) =>
                          setCustomConfig({
                            ...customConfig,
                            ranges: {
                              ...customConfig.ranges,
                              [dim]: {
                                ...customConfig.ranges[dim],
                                max: Number(e.target.value),
                              },
                            },
                          })
                        }
                        className="px-3 py-2 border border-charcoal/20 rounded-sm font-mono text-sm focus:border-charcoal focus:outline-none"
                        placeholder="Max"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Advanced */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="font-mono text-[9px] uppercase tracking-widest text-charcoal/60 hover:text-charcoal"
              >
                {showAdvanced ? '▼' : '▶'} Advanced
              </button>

              {showAdvanced && (
                <div className="space-y-3 pt-3 border-t border-charcoal/10">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={customConfig.lockProportions}
                      onChange={(e) =>
                        setCustomConfig({
                          ...customConfig,
                          lockProportions: e.target.checked,
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span className="font-mono text-sm">Lock proportions</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </QuizCard>
  );
};

export default SizeCapabilityCard;
