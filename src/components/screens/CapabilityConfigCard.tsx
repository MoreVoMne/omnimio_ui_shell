import React, { useEffect, useState, useRef, useImperativeHandle } from 'react';
import { motion } from 'framer-motion';
import {
  Palette,
  Layers,
  Ruler,
  Type,
  Image as ImageIcon,
  PenTool,
  Stamp,
  Shuffle,
  Plus,
  ChevronDown,
  HelpCircle,
  X,
  Check,
  Trash2,
  Upload,
  Save,
  Triangle,
} from 'lucide-react';
import type {
  CapabilityId,
  CapabilityDefinition,
  CapabilityConfiguration,
  CapabilityOption,
  CapabilityRule,
  ExportFormat,
  PricingModel,
  TextOptions,
  PartDefinition,
  SizeOptions,
  SizeMode,
  SizePreset,
  DimensionConstraint,
  CustomDimension,
} from '../../types/merchant-wizard';

const CONTROL_H = 'h-9';
const CONTROL_INPUT_BASE =
  `${CONTROL_H} border border-charcoal/20 focus:outline-none focus:border-charcoal`;
const CONTROL_BTN_BASE =
  `${CONTROL_H} border border-charcoal/20 bg-white text-charcoal/60 hover:border-charcoal hover:text-charcoal transition-colors font-mono text-[9px] uppercase tracking-widest flex items-center justify-center`;

const CAPABILITY_ICONS: Record<CapabilityId, React.ReactNode> = {
  color: <Palette size={16} strokeWidth={1.5} />,
  material: <Layers size={16} strokeWidth={1.5} />,
  size: <Ruler size={16} strokeWidth={1.5} />,
  shape: <Triangle size={16} strokeWidth={1.5} />,
  text: <Type size={16} strokeWidth={1.5} />,
  print: <ImageIcon size={16} strokeWidth={1.5} />,
  engraving: <PenTool size={16} strokeWidth={1.5} />,
  embossing: <Stamp size={16} strokeWidth={1.5} />,
  swap_parts: <Shuffle size={16} strokeWidth={1.5} />,
  add_accessories: <Plus size={16} strokeWidth={1.5} />,
};

export const CapabilityConfigHeaderContent: React.FC<{
  capability: CapabilityDefinition;
  onClose: () => void;
}> = ({ capability, onClose }) => {
  const icon = capability.id === 'size'
    ? <Ruler size={18} className="text-charcoal/60" />
    : <span className="text-charcoal/60">{CAPABILITY_ICONS[capability.id]}</span>;

  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <h4 className="font-serif text-lg sm:text-xl italic text-charcoal">
            {capability.label}
          </h4>
        </div>
      </div>
      <button onClick={onClose} className="p-1 hover:bg-charcoal/5 transition-colors">
        <X size={16} className="text-charcoal/50" />
      </button>
    </div>
  );
};

export const CapabilityConfigFooterActions: React.FC<{
  capability: CapabilityDefinition;
  onRemove: () => void;
  onSave: () => void;
}> = ({ capability, onRemove, onSave }) => (
  <>
    <button
      type="button"
      onClick={onRemove}
      className="px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors"
    >
      Remove
    </button>
    <button
      type="button"
      onClick={onSave}
      className="flex-1 sm:flex-none px-6 py-3 bg-charcoal text-cream font-mono text-[10px] uppercase tracking-widest hover:bg-charcoal/90 transition-colors flex items-center justify-center gap-2"
    >
      <Save size={12} />
      Save {capability.label} Configuration
    </button>
  </>
);

const EXPORT_FORMAT_LABELS: Record<ExportFormat, string> = {
  config_json: 'Config JSON (always included)',
  preview_png: 'Preview render (PNG)',
  pattern_dxf_1to1: 'Pattern/Cut file with actual dimensions (DXF, 1:1)',
  bom_csv_pdf: 'Include in BOM / Parts list (CSV/PDF)',
};

const EXPORT_FORMATS_ORDER: ExportFormat[] = [
  'config_json',
  'preview_png',
  'pattern_dxf_1to1',
  'bom_csv_pdf',
];

const ComingSoonBadge: React.FC<{ className?: string }> = ({ className }) => (
  <span
    className={`text-[9px] uppercase tracking-widest text-charcoal/30 border border-charcoal/20 px-1.5 py-0.5 rounded ${className ?? ''}`}
  >
    COMING SOON
  </span>
);

const formatPriceDelta = (amount: number) => {
  if (amount === 0) return '£0';
  return `${amount > 0 ? '+' : '-'}£${Math.abs(amount)}`;
};

const AppliesToSelector: React.FC<{
  parts: PartDefinition[];
  selectedParts: string[];
  onChange: (nextParts: string[]) => void;
  question: string;
  showTitle?: boolean;
  partsOnly?: boolean;
}> = ({ parts, selectedParts, onChange, question, showTitle = true, partsOnly = false }) => {
  const isWhole = !partsOnly && selectedParts.includes('__whole_product__');

  const toggleWhole = () => {
    if (partsOnly) return;
    onChange(isWhole ? [] : ['__whole_product__']);
  };

  const togglePart = (partId: string) => {
    if (isWhole) return;
    const next = selectedParts.includes(partId)
      ? selectedParts.filter(id => id !== partId)
      : [...selectedParts, partId];
    onChange(next);
  };

  return (
    <div>
      {showTitle && (
        <>
          <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60 mb-3">
            Applies To
          </p>
          <p className="font-mono text-[9px] text-charcoal/40 mb-4">
            {question}
          </p>
        </>
      )}
      <div className="space-y-3">
        {!partsOnly && (
          <label className="flex items-center gap-3 cursor-pointer py-1">
            <input
              type="checkbox"
              checked={isWhole}
              onChange={toggleWhole}
              className="w-4 h-4 accent-charcoal"
            />
            <span className="font-mono text-[11px] text-charcoal/70 font-medium">
              Whole product
            </span>
          </label>
        )}

        {parts.length > 0 && (partsOnly || !isWhole) && (
          <>
            {!partsOnly && (
              <div className="border-t border-charcoal/10 pt-2 mt-2">
                <p className="font-mono text-[9px] text-charcoal/40 mb-2">
                  Or select specific parts:
                </p>
              </div>
            )}
            {parts.map(part => {
              const isSelected = selectedParts.includes(part.id);
              return (
                <label key={part.id} className="flex items-center gap-3 cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => togglePart(part.id)}
                    className="w-4 h-4 accent-charcoal"
                  />
                  <span className="font-mono text-[11px] text-charcoal/70">
                    {part.name}
                    <span className="text-charcoal/40 ml-2">({part.role})</span>
                  </span>
                </label>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

interface OptionInputProps {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}

type OptionInputHandle = {
  commit: () => void;
  getValue: () => string;
  focus: () => void;
};

const OptionInput = React.memo(React.forwardRef<OptionInputHandle, OptionInputProps>(({ value, placeholder, onChange }, ref) => {
  const [localValue, setLocalValue] = useState(value);
  const [showError, setShowError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useImperativeHandle(ref, () => ({
    commit: () => {
      if (localValue !== value) onChange(localValue);
    },
    getValue: () => localValue,
    focus: () => {
      inputRef.current?.focus();
      setShowError(true);
      setTimeout(() => setShowError(false), 2000);
    },
  }), [localValue, value, onChange]);
  
  return (
    <input
      ref={inputRef}
      type="text"
      value={localValue}
      onChange={(e) => {
        setLocalValue(e.target.value);
        if (showError && e.target.value.trim()) setShowError(false);
      }}
      onBlur={() => {
        if (localValue !== value) {
          onChange(localValue);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur();
        }
      }}
      placeholder={placeholder}
      className={`w-full ${CONTROL_INPUT_BASE} px-3 font-mono text-[11px] uppercase tracking-wide placeholder:normal-case placeholder:text-charcoal/30 transition-colors ${showError ? 'border-red-500 bg-red-50' : ''}`}
    />
  );
}));

interface PriceInputProps {
  value: number;
  onChange: (value: number) => void;
}

type PriceInputHandle = {
  commit: () => void;
  getValue: () => number;
};

const PriceInput = React.memo(React.forwardRef<PriceInputHandle, PriceInputProps>(({ value, onChange }, ref) => {
  const [localValue, setLocalValue] = useState(value.toString());

  useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  useImperativeHandle(ref, () => ({
    commit: () => {
      const numVal = parseFloat(localValue) || 0;
      if (numVal !== value) onChange(numVal);
    },
    getValue: () => parseFloat(localValue) || 0,
  }), [localValue, value, onChange]);
  
  return (
    <input
      type="number"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => {
        const numVal = parseFloat(localValue) || 0;
        if (numVal !== value) {
          onChange(numVal);
        }
      }}
      className={`w-16 ${CONTROL_INPUT_BASE} px-2 font-mono text-[10px] text-center`}
    />
  );
}));

const DEFAULT_SIZE_OPTIONS: SizeOptions = {
  mode: 'discrete',
  unit: 'cm',
  dimensions: {
    width: { enabled: true, min: 5, max: 50, step: 1 },
    length: { enabled: true, min: 5, max: 50, step: 1 },
    height: { enabled: false, min: 1, max: 20, step: 1 },
    depth: { enabled: false, min: 1, max: 20, step: 1 },
  },
  custom_dimensions: [],
  presets: [],
  allow_custom_dimensions: true,
  affected_parts: [],
  adaptation_method: 'deformation',
  pricing_mode: 'per_unit',
  base_price: 25,
  price_per_cm2: 0.15,
  price_per_cm3: 0.5,
  price_per_unit: 0.5,
  export_pattern_format: 'dxf',
  export_scale: '1:1',
  include_dimension_sheet: true,
};

interface SizeConfigurationPanelProps {
  capability: CapabilityDefinition;
  parts: PartDefinition[];
  config: CapabilityConfiguration;
  onUpdate: (config: CapabilityConfiguration) => void;
  onSave: () => void;
  onRemove: () => void;
  onClose: () => void;
  embedded?: boolean;
}

const SizeConfigurationPanel: React.FC<SizeConfigurationPanelProps> = ({
  capability,
  parts,
  config,
  onUpdate,
  onSave,
  onRemove,
  onClose,
  embedded = false,
}) => {
  const sizeOptions: SizeOptions = {
    ...DEFAULT_SIZE_OPTIONS,
    ...(config.size_options || {}),
    dimensions: {
      ...DEFAULT_SIZE_OPTIONS.dimensions,
      ...(config.size_options?.dimensions || {}),
    },
    custom_dimensions: config.size_options?.custom_dimensions || DEFAULT_SIZE_OPTIONS.custom_dimensions,
    presets: config.size_options?.presets || DEFAULT_SIZE_OPTIONS.presets,
  };

  const updateSizeOptions = (updates: Partial<SizeOptions>) => {
    onUpdate({
      ...config,
      size_options: { ...sizeOptions, ...updates },
    });
  };

  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editingCustomDimId, setEditingCustomDimId] = useState<string | null>(null);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;

      if (editingPresetId) {
        const row = document.querySelector(`[data-preset-row="${editingPresetId}"]`);
        if (row && !row.contains(target)) setEditingPresetId(null);
      }

      if (editingCustomDimId) {
        const row = document.querySelector(`[data-custom-dim-row="${editingCustomDimId}"]`);
        if (row && !row.contains(target)) setEditingCustomDimId(null);
      }
    };

    document.addEventListener('mousedown', onMouseDown, true);
    return () => document.removeEventListener('mousedown', onMouseDown, true);
  }, [editingPresetId, editingCustomDimId]);

  const updateDimension = (dim: 'width' | 'length' | 'height' | 'depth', updates: Partial<DimensionConstraint>) => {
    updateSizeOptions({
      dimensions: {
        ...sizeOptions.dimensions,
        [dim]: { ...sizeOptions.dimensions[dim], ...updates },
      },
    });
  };

  const addPreset = () => {
    const id = `preset-${Date.now()}`;
    const newPreset: SizePreset = {
      id,
      name: '',
      width: sizeOptions.dimensions.width.min,
      length: sizeOptions.dimensions.length.min,
      height: sizeOptions.dimensions.height.min,
      price_modifier: 0,
      is_default: sizeOptions.presets.length === 0,
    };
    updateSizeOptions({ presets: [...sizeOptions.presets, newPreset] });
    setEditingPresetId(id);
  };

  const updatePreset = (index: number, updates: Partial<SizePreset>) => {
    const newPresets = [...sizeOptions.presets];
    newPresets[index] = { ...newPresets[index], ...updates };
    updateSizeOptions({ presets: newPresets });
  };

  const removePreset = (index: number) => {
    updateSizeOptions({ presets: sizeOptions.presets.filter((_, i) => i !== index) });
  };

  const toggleAffectedPart = (partId: string) => {
    const existing = sizeOptions.affected_parts.find(p => p.part_id === partId);
    if (existing) {
      updateSizeOptions({
        affected_parts: sizeOptions.affected_parts.filter(p => p.part_id !== partId),
      });
    } else {
      updateSizeOptions({
        affected_parts: [...sizeOptions.affected_parts, { part_id: partId, scales: true }],
      });
    }
  };

  const calculateVolume = (w: number, l: number, h: number) => w * l * h;
  const calculatePrice = (volume: number) => sizeOptions.base_price + (volume * sizeOptions.price_per_cm3);
  
  const volumeUnit = sizeOptions.unit === 'cm' ? 'cm³' : sizeOptions.unit === 'mm' ? 'mm³' : 'in³';
  const areaUnit = sizeOptions.unit === 'cm' ? 'cm²' : sizeOptions.unit === 'mm' ? 'mm²' : 'in²';

  const enabledStandardDims = (['width', 'length', 'height', 'depth'] as const)
    .filter(d => sizeOptions.dimensions[d].enabled)
    .map(d => ({ key: d, label: d.charAt(0).toUpperCase() + d.slice(1) }));

  const enabledCustomDims = sizeOptions.custom_dimensions
    .filter(d => d.enabled)
    .map(d => ({ key: d.id, label: (d.name || 'Custom').trim() || 'Custom' }));

  const enabledDims = [...enabledStandardDims, ...enabledCustomDims];
  const enabledDimCount = enabledDims.length;

  const dimsForArea = enabledDims.slice(0, 2);
  const dimsForVolume = enabledDims.slice(0, 3);

  const contentClassName = embedded
    ? 'flex-1 min-h-0 p-4 sm:p-6 space-y-6'
    : 'flex-1 min-h-0 p-4 sm:p-6 overflow-y-auto scroll-smooth space-y-6';
  const panelClassName = 'bg-cream overflow-hidden w-full h-full min-h-0 flex flex-col';

  const handleSave = () => {
    setEditingPresetId(null);
    setEditingCustomDimId(null);
    onSave();
  };

  useEffect(() => {
    if (sizeOptions.mode !== 'custom') return;

    if (enabledDimCount <= 1) {
      if (sizeOptions.pricing_mode !== 'per_unit') updateSizeOptions({ pricing_mode: 'per_unit' });
      return;
    }

    if (enabledDimCount === 2) {
      if (sizeOptions.pricing_mode === 'formula') updateSizeOptions({ pricing_mode: 'area' });
      if (sizeOptions.pricing_mode === 'tiered') updateSizeOptions({ pricing_mode: 'per_unit' });
      return;
    }

    if (sizeOptions.pricing_mode === 'tiered') updateSizeOptions({ pricing_mode: 'per_unit' });
  }, [sizeOptions.mode, enabledDimCount, sizeOptions.pricing_mode]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className={panelClassName}
    >
      {!embedded && (
        <div className="p-4 sm:p-5 border-b border-charcoal/10 bg-cream/50">
          <CapabilityConfigHeaderContent capability={capability} onClose={onClose} />
        </div>
      )}

      <div className={contentClassName}>
        <AppliesToSelector
          parts={parts}
          selectedParts={config.applies_to_parts}
          onChange={(applies_to_parts) => onUpdate({ ...config, applies_to_parts })}
          question="What can customers resize?"
        />

        <div className="border-t border-charcoal/10 pt-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60 mb-1">
                Unit of Measurement
              </p>
              <p className="font-mono text-[9px] text-charcoal/40">
                Used across all size settings
              </p>
            </div>
            <div className="flex items-center gap-1">
              {(['cm', 'mm', 'inches'] as const).map(unit => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => updateSizeOptions({ unit })}
                  className={`px-3 py-1.5 border font-mono text-[10px] uppercase tracking-widest transition-colors ${
                    sizeOptions.unit === unit
                      ? 'border-charcoal bg-charcoal text-cream'
                      : 'border-charcoal/30 text-charcoal/60 hover:border-charcoal'
                  }`}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-charcoal/10 pt-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60 mb-2">
            How does size work for this product?
          </p>
          <div className="space-y-2">
            {[
              { value: 'discrete', label: 'Preset sizes (e.g. Small, Medium, Large)', disabled: false },
              { value: 'custom', label: 'Custom dimensions (customers enter their own size)', disabled: false },
              { value: 'parametric', label: 'Parametric sizing (3D model scales automatically)', disabled: true, comingSoon: true },
            ].map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => !option.disabled && updateSizeOptions({ mode: option.value as SizeMode })}
                className={`w-full flex items-center gap-3 py-2 text-left ${option.disabled ? 'cursor-not-allowed' : ''}`}
                disabled={option.disabled}
              >
                <div className={`w-4 h-4 rounded-full border ${
                  sizeOptions.mode === option.value 
                    ? 'border-charcoal bg-charcoal' 
                    : option.disabled 
                      ? 'border-charcoal/20' 
                      : 'border-charcoal/30'
                } flex items-center justify-center`}>
                  {sizeOptions.mode === option.value && (
                    <div className="w-2 h-2 rounded-full bg-cream" />
                  )}
                </div>
                <span className={`font-mono text-[11px] ${option.disabled ? 'text-charcoal/30' : 'text-charcoal/70'}`}>
                  {option.label}
                  {option.comingSoon && <ComingSoonBadge className="ml-2" />}
                </span>
              </button>
            ))}
          </div>
        </div>

        {sizeOptions.mode === 'discrete' && (
          <div className="border-t border-charcoal/10 pt-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60 mb-3">
              Size Presets
            </p>
            <p className="font-mono text-[9px] text-charcoal/40 mb-3">
              Define available size options with prices
            </p>
            
            <div className="space-y-2 mb-3">
              {sizeOptions.presets.length === 0 ? (
                <p className="font-mono text-[10px] text-charcoal/40 italic">
                  No preset sizes yet
                </p>
              ) : (
                sizeOptions.presets.map((preset, index) => {
                  const isEditing = editingPresetId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      data-preset-row={preset.id}
                      className="flex items-center gap-2 flex-wrap"
                      onBlurCapture={(e) => {
                        const next = e.relatedTarget as Node | null;
                        if (!next || !e.currentTarget.contains(next)) {
                          if (editingPresetId === preset.id) setEditingPresetId(null);
                        }
                      }}
                    >
                      <label className="flex items-center gap-2 cursor-pointer w-44">
                        <input
                          type="radio"
                          name="default_preset"
                          checked={!!preset.is_default}
                          onChange={() => {
                            const newPresets = sizeOptions.presets.map((p, i) => ({
                              ...p,
                              is_default: i === index,
                            }));
                            updateSizeOptions({ presets: newPresets });
                          }}
                          className="accent-charcoal"
                        />
                        {isEditing ? (
                          <input
                            type="text"
                            value={preset.name}
                            onChange={(e) => updatePreset(index, { name: e.target.value })}
                            placeholder="Name (e.g. Small)"
                            autoFocus
                            className={`w-full ${CONTROL_INPUT_BASE} px-3 font-mono text-[11px]`}
                          />
                        ) : (
                          <span className="font-mono text-[11px] text-charcoal/70">
                            {preset.name?.trim() ? preset.name : 'Unnamed'}
                          </span>
                        )}
                      </label>

                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[9px] text-charcoal/40">W:</span>
                          <input
                            type="number"
                            value={preset.width}
                            onChange={(e) => updatePreset(index, { width: parseFloat(e.target.value) || 0 })}
                            className={`w-14 ${CONTROL_INPUT_BASE} px-2 font-mono text-[10px] text-center`}
                          />
                          <span className="font-mono text-[9px] text-charcoal/30">×</span>
                          <span className="font-mono text-[9px] text-charcoal/40">L:</span>
                          <input
                            type="number"
                            value={preset.length}
                            onChange={(e) => updatePreset(index, { length: parseFloat(e.target.value) || 0 })}
                            className={`w-14 ${CONTROL_INPUT_BASE} px-2 font-mono text-[10px] text-center`}
                          />
                          <span className="font-mono text-[9px] text-charcoal/30">×</span>
                          <span className="font-mono text-[9px] text-charcoal/40">H:</span>
                          <input
                            type="number"
                            value={preset.height}
                            onChange={(e) => updatePreset(index, { height: parseFloat(e.target.value) || 0 })}
                            className={`w-14 ${CONTROL_INPUT_BASE} px-2 font-mono text-[10px] text-center`}
                          />
                          <span className="font-mono text-[9px] text-charcoal/40">{sizeOptions.unit}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10px] text-charcoal/50">
                            {preset.width}×{preset.length}×{preset.height}{sizeOptions.unit}
                          </span>
                          {preset.model_name && (
                            <span className="font-mono text-[9px] uppercase tracking-widest text-charcoal/40 border border-charcoal/10 bg-white/70 px-2 py-1">
                              3D: {preset.model_name}
                            </span>
                          )}
                        </div>
                      )}

                      {isEditing && (
                        <div className="flex items-center gap-2 flex-wrap ml-auto">
                          <input
                            type="file"
                            accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
                            className="hidden"
                            id={`preset-model-${preset.id}`}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;

                              if (preset.model_url && preset.model_url.startsWith('blob:')) {
                                try { URL.revokeObjectURL(preset.model_url); } catch {}
                              }

                              const url = URL.createObjectURL(file);
                              updatePreset(index, { model_url: url, model_name: file.name, model_size_bytes: file.size });
                              e.currentTarget.value = '';
                            }}
                          />

                          <label
                            htmlFor={`preset-model-${preset.id}`}
                            className={`${CONTROL_BTN_BASE} px-3 cursor-pointer`}
                          >
                            <Upload size={12} />
                            {preset.model_name ? 'Replace 3D' : 'Upload 3D'}
                          </label>

                          {preset.model_name && (
                            <button
                              type="button"
                              onClick={() => {
                                if (preset.model_url && preset.model_url.startsWith('blob:')) {
                                  try { URL.revokeObjectURL(preset.model_url); } catch {}
                                }
                                updatePreset(index, { model_url: undefined, model_name: undefined, model_size_bytes: undefined });
                              }}
                              className={`${CONTROL_BTN_BASE} px-3`}
                            >
                              Remove 3D
                            </button>
                          )}
                        </div>
                      )}

                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-[9px] text-charcoal/50">£</span>
                          <input
                            type="number"
                            value={preset.price_modifier}
                            onChange={(e) => updatePreset(index, { price_modifier: parseFloat(e.target.value) || 0 })}
                            className="w-20 border border-charcoal/20 px-2 py-1 font-mono text-[10px] text-center"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 ml-auto">
                          <span className="font-mono text-[10px] text-charcoal/70">
                            £{preset.price_modifier.toFixed(0)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingPresetId(preset.id)}
                            className={`${CONTROL_BTN_BASE} px-3`}
                          >
                            Edit
                          </button>
                        </div>
                      )}

                      {isEditing ? (
                        <button
                          type="button"
                          onClick={() => setEditingPresetId(null)}
                          className={`${CONTROL_BTN_BASE} px-3`}
                        >
                          Done
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => removePreset(index)}
                          className="p-1 text-charcoal/30 hover:text-red-500 transition-colors"
                          aria-label="Remove preset"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <button
              onClick={addPreset}
              className="flex items-center gap-2 px-3 py-2 border border-dashed border-charcoal/30 hover:border-charcoal text-charcoal/50 hover:text-charcoal transition-all w-full justify-center"
            >
              <Plus size={12} />
              <span className="font-mono text-[10px] uppercase tracking-widest">Add size option</span>
            </button>
          </div>
        )}

        {sizeOptions.mode === 'custom' && (
          <div className="border-t border-charcoal/10 pt-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60 mb-3">
              Dimension Parameters
            </p>
            <p className="font-mono text-[9px] text-charcoal/40 mb-4">
              Which dimensions can customers specify?
            </p>

            <div className="space-y-2">
              {(['width', 'length', 'height', 'depth'] as const).map(dim => (
                <div key={dim} className="flex items-center gap-2 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer w-20">
                    <input
                      type="checkbox"
                      checked={sizeOptions.dimensions[dim].enabled}
                      onChange={(e) => updateDimension(dim, { enabled: e.target.checked })}
                      className="w-4 h-4 accent-charcoal"
                    />
                    <span className="font-mono text-[11px] text-charcoal/70 capitalize">
                      {dim}
                    </span>
                  </label>
                  
                  {sizeOptions.dimensions[dim].enabled && (
                    <>
                      <span className="font-mono text-[9px] text-charcoal/40">Min:</span>
                      <input
                        type="number"
                        value={sizeOptions.dimensions[dim].min}
                        onChange={(e) => updateDimension(dim, { min: parseFloat(e.target.value) || 0 })}
                        className={`w-14 ${CONTROL_INPUT_BASE} px-2 font-mono text-[10px] text-center`}
                      />
                      <span className="font-mono text-[9px] text-charcoal/40">Max:</span>
                      <input
                        type="number"
                        value={sizeOptions.dimensions[dim].max}
                        onChange={(e) => updateDimension(dim, { max: parseFloat(e.target.value) || 0 })}
                        className={`w-14 ${CONTROL_INPUT_BASE} px-2 font-mono text-[10px] text-center`}
                      />
                      <span className="font-mono text-[9px] text-charcoal/40">{sizeOptions.unit}</span>
                    </>
                  )}
                </div>
              ))}
              
              {sizeOptions.custom_dimensions.map((dim, index) => (
                <div
                  key={dim.id}
                  data-custom-dim-row={dim.id}
                  className="flex items-center gap-2 flex-wrap"
                  onBlurCapture={(e) => {
                    const next = e.relatedTarget as Node | null;
                    if (!next || !e.currentTarget.contains(next)) {
                      if (editingCustomDimId === dim.id) setEditingCustomDimId(null);
                    }
                  }}
                >
                  <label className="flex items-center gap-2 cursor-pointer w-20">
                    <input
                      type="checkbox"
                      checked={dim.enabled}
                      onChange={(e) => {
                        const newDims = [...sizeOptions.custom_dimensions];
                        newDims[index] = { ...dim, enabled: e.target.checked };
                        updateSizeOptions({ custom_dimensions: newDims });
                      }}
                      className="w-4 h-4 accent-charcoal"
                    />
                    {editingCustomDimId === dim.id || !dim.name?.trim() ? (
                      <input
                        type="text"
                        value={dim.name}
                        onChange={(e) => {
                          const newDims = [...sizeOptions.custom_dimensions];
                          newDims[index] = { ...dim, name: e.target.value };
                          updateSizeOptions({ custom_dimensions: newDims });
                        }}
                        placeholder="Parameter"
                        autoFocus
                        className="w-full border-0 bg-transparent px-0 py-0 font-mono text-[11px] text-charcoal/70 placeholder:text-charcoal/30 focus:outline-none"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingCustomDimId(dim.id)}
                        className="w-full text-left font-mono text-[11px] text-charcoal/70 hover:text-charcoal transition-colors"
                      >
                        {dim.name}
                      </button>
                    )}
                  </label>

                  {dim.enabled && (
                    <>
                      <span className="font-mono text-[9px] text-charcoal/40">Min:</span>
                      <input
                        type="number"
                        value={dim.min}
                        onChange={(e) => {
                          const newDims = [...sizeOptions.custom_dimensions];
                          newDims[index] = { ...dim, min: parseFloat(e.target.value) || 0 };
                          updateSizeOptions({ custom_dimensions: newDims });
                        }}
                        className={`w-14 ${CONTROL_INPUT_BASE} px-2 font-mono text-[10px] text-center`}
                      />
                      <span className="font-mono text-[9px] text-charcoal/40">Max:</span>
                      <input
                        type="number"
                        value={dim.max}
                        onChange={(e) => {
                          const newDims = [...sizeOptions.custom_dimensions];
                          newDims[index] = { ...dim, max: parseFloat(e.target.value) || 0 };
                          updateSizeOptions({ custom_dimensions: newDims });
                        }}
                        className={`w-14 ${CONTROL_INPUT_BASE} px-2 font-mono text-[10px] text-center`}
                      />
                      <span className="font-mono text-[9px] text-charcoal/40">{sizeOptions.unit}</span>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      updateSizeOptions({
                        custom_dimensions: sizeOptions.custom_dimensions.filter((_, i) => i !== index),
                      });
                    }}
                    className="p-1 text-charcoal/30 hover:text-red-500"
                    aria-label="Remove parameter"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              
              <button
                type="button"
                onClick={() => {
                  const id = `dim-${Date.now()}`;
                  const newDim: CustomDimension = {
                    id,
                    enabled: true,
                    name: '',
                    min: 1,
                    max: 100,
                    step: 1,
                  };
                  updateSizeOptions({
                    custom_dimensions: [...sizeOptions.custom_dimensions, newDim],
                  });
                  setEditingCustomDimId(id);
                }}
                className="flex items-center gap-2 py-2 text-charcoal/40 hover:text-charcoal transition-colors"
              >
                <Plus size={14} />
                <span className="font-mono text-[10px] uppercase tracking-widest">Add parameter</span>
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-charcoal/10">
              <p className="font-mono text-[9px] text-charcoal/40 mb-3">How to price custom sizes?</p>
              {enabledDimCount <= 1 ? (
                <div className="p-3 bg-charcoal/5 border border-charcoal/10 space-y-2">
                  <p className="font-mono text-[9px] text-charcoal/50">
                    Auto: <span className="text-charcoal/70">Linear</span> (only 1 dimension enabled)
                  </p>
                  <p className="font-mono text-[9px] text-charcoal/40">
                    Product base price comes from your store. This sets the <span className="text-charcoal/70">customization surcharge</span> for resizing.
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] text-charcoal/60">Base customization fee: £</span>
                    <input
                      type="number"
                      value={sizeOptions.base_price}
                      onChange={(e) => updateSizeOptions({ base_price: parseFloat(e.target.value) || 0 })}
                      className="w-16 border border-charcoal/20 px-2 py-1 font-mono text-[10px] text-center"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] text-charcoal/60">+ £</span>
                    <input
                      type="number"
                      value={sizeOptions.price_per_unit}
                      onChange={(e) => updateSizeOptions({ price_per_unit: parseFloat(e.target.value) || 0 })}
                      className="w-16 border border-charcoal/20 px-2 py-1 font-mono text-[10px] text-center"
                      step="0.1"
                    />
                    <span className="font-mono text-[9px] text-charcoal/60">
                      per {sizeOptions.unit} extra ({enabledDims[0]?.label || 'dimension'})
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => updateSizeOptions({ pricing_mode: 'per_unit' })}
                      className={`flex-1 px-3 py-2 border font-mono text-[10px] uppercase tracking-widest transition-colors ${
                        sizeOptions.pricing_mode === 'per_unit'
                          ? 'bg-charcoal text-cream border-charcoal'
                          : 'bg-white text-charcoal border-charcoal/20 hover:border-charcoal'
                      }`}
                    >
                      Linear
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSizeOptions({ pricing_mode: 'area' })}
                      className={`flex-1 px-3 py-2 border font-mono text-[10px] uppercase tracking-widest transition-colors ${
                        sizeOptions.pricing_mode === 'area'
                          ? 'bg-charcoal text-cream border-charcoal'
                          : 'bg-white text-charcoal border-charcoal/20 hover:border-charcoal'
                      }`}
                    >
                      Area
                    </button>
                    <button
                      type="button"
                      disabled={enabledDimCount < 3}
                      onClick={() => enabledDimCount >= 3 && updateSizeOptions({ pricing_mode: 'formula' })}
                      className={`flex-1 px-3 py-2 border font-mono text-[10px] uppercase tracking-widest transition-colors ${
                        enabledDimCount < 3
                          ? 'bg-charcoal/5 text-charcoal/30 border-charcoal/10 cursor-not-allowed'
                          : sizeOptions.pricing_mode === 'formula'
                            ? 'bg-charcoal text-cream border-charcoal'
                            : 'bg-white text-charcoal border-charcoal/20 hover:border-charcoal'
                      }`}
                      title={enabledDimCount < 3 ? 'Enable 3+ dimensions to use Volume pricing' : 'Volume'}
                    >
                      Volume
                    </button>
                  </div>

                  {sizeOptions.pricing_mode === 'per_unit' && (
                    <div className="p-3 bg-charcoal/5 border border-charcoal/10 space-y-2">
                      <p className="font-mono text-[9px] text-charcoal/50">
                        Uses sum: <span className="text-charcoal/70">{enabledDims.map(d => d.label).join(' + ')}</span>
                      </p>
                      <p className="font-mono text-[9px] text-charcoal/40">
                        Product base price comes from your store. This is the <span className="text-charcoal/70">minimum fee</span> for resizing (e.g. pattern work).
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] text-charcoal/60">Base customization fee: £</span>
                        <input
                          type="number"
                          value={sizeOptions.base_price}
                          onChange={(e) => updateSizeOptions({ base_price: parseFloat(e.target.value) || 0 })}
                          className="w-16 border border-charcoal/20 px-2 py-1 font-mono text-[10px] text-center"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] text-charcoal/60">+ £</span>
                        <input
                          type="number"
                          value={sizeOptions.price_per_unit}
                          onChange={(e) => updateSizeOptions({ price_per_unit: parseFloat(e.target.value) || 0 })}
                          className="w-16 border border-charcoal/20 px-2 py-1 font-mono text-[10px] text-center"
                          step="0.1"
                        />
                        <span className="font-mono text-[9px] text-charcoal/60">
                          per {sizeOptions.unit} extra (sum)
                        </span>
                      </div>
                    </div>
                  )}

                  {sizeOptions.pricing_mode === 'area' && (
                    <div className="p-3 bg-charcoal/5 border border-charcoal/10 space-y-2">
                      <p className="font-mono text-[9px] text-charcoal/50">
                        Uses product: <span className="text-charcoal/70">{dimsForArea.map(d => d.label).join(' × ')}</span>
                      </p>
                      <p className="font-mono text-[9px] text-charcoal/40">
                        Product base price comes from your store. Base fee covers setup; variable part covers material/cut changes.
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] text-charcoal/60">Base customization fee: £</span>
                        <input
                          type="number"
                          value={sizeOptions.base_price}
                          onChange={(e) => updateSizeOptions({ base_price: parseFloat(e.target.value) || 0 })}
                          className="w-16 border border-charcoal/20 px-2 py-1 font-mono text-[10px] text-center"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] text-charcoal/60">+ £</span>
                        <input
                          type="number"
                          value={sizeOptions.price_per_cm2}
                          onChange={(e) => updateSizeOptions({ price_per_cm2: parseFloat(e.target.value) || 0 })}
                          className="w-16 border border-charcoal/20 px-2 py-1 font-mono text-[10px] text-center"
                          step="0.01"
                        />
                        <span className="font-mono text-[9px] text-charcoal/60">per {areaUnit} extra</span>
                      </div>
                    </div>
                  )}

                  {sizeOptions.pricing_mode === 'formula' && enabledDimCount >= 3 && (
                    <div className="p-3 bg-charcoal/5 border border-charcoal/10 space-y-2">
                      <p className="font-mono text-[9px] text-charcoal/50">
                        Uses product: <span className="text-charcoal/70">{dimsForVolume.map(d => d.label).join(' × ')}</span>
                      </p>
                      <p className="font-mono text-[9px] text-charcoal/40">
                        Product base price comes from your store. Base fee covers setup; variable part tracks material/time usage.
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] text-charcoal/60">Base customization fee: £</span>
                        <input
                          type="number"
                          value={sizeOptions.base_price}
                          onChange={(e) => updateSizeOptions({ base_price: parseFloat(e.target.value) || 0 })}
                          className="w-16 border border-charcoal/20 px-2 py-1 font-mono text-[10px] text-center"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] text-charcoal/60">+ £</span>
                        <input
                          type="number"
                          value={sizeOptions.price_per_cm3}
                          onChange={(e) => updateSizeOptions({ price_per_cm3: parseFloat(e.target.value) || 0 })}
                          className="w-16 border border-charcoal/20 px-2 py-1 font-mono text-[10px] text-center"
                          step="0.01"
                        />
                        <span className="font-mono text-[9px] text-charcoal/60">per {volumeUnit} extra</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {sizeOptions.mode === 'parametric' && (
          <>
            <div className="border-t border-charcoal/10 pt-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60 mb-3">
                Parametric Sizing
              </p>
              <p className="font-mono text-[9px] text-charcoal/40 mb-3">
                Which dimensions can customers change?
              </p>
              
              <div className="flex gap-4 mb-4">
                {(['width', 'length', 'height', 'depth'] as const).map(dim => (
                  <label key={dim} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sizeOptions.dimensions[dim].enabled}
                      onChange={(e) => updateDimension(dim, { enabled: e.target.checked })}
                      className="w-4 h-4 accent-charcoal"
                    />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-charcoal/70">
                      {dim}
                    </span>
                  </label>
                ))}
              </div>

              <p className="font-mono text-[9px] text-charcoal/40 mb-2">Constraints:</p>
              <div className="space-y-2">
                {(['width', 'length', 'height', 'depth'] as const).filter(d => sizeOptions.dimensions[d].enabled).map(dim => (
                  <div key={dim} className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] text-charcoal/60 w-16 capitalize">{dim}:</span>
                    <span className="font-mono text-[9px] text-charcoal/40">Min</span>
                    <input
                      type="number"
                      value={sizeOptions.dimensions[dim].min}
                      onChange={(e) => updateDimension(dim, { min: parseFloat(e.target.value) || 0 })}
                      className={`w-14 ${CONTROL_INPUT_BASE} px-2 font-mono text-[10px] text-center`}
                    />
                    <span className="font-mono text-[9px] text-charcoal/40">{sizeOptions.unit} — Max</span>
                    <input
                      type="number"
                      value={sizeOptions.dimensions[dim].max}
                      onChange={(e) => updateDimension(dim, { max: parseFloat(e.target.value) || 0 })}
                      className={`w-14 ${CONTROL_INPUT_BASE} px-2 font-mono text-[10px] text-center`}
                    />
                    <span className="font-mono text-[9px] text-charcoal/40">{sizeOptions.unit} Step</span>
                    <input
                      type="number"
                      value={sizeOptions.dimensions[dim].step}
                      onChange={(e) => updateDimension(dim, { step: parseFloat(e.target.value) || 0.5 })}
                      className={`w-14 ${CONTROL_INPUT_BASE} px-2 font-mono text-[10px] text-center`}
                      step="0.1"
                    />
                    <span className="font-mono text-[9px] text-charcoal/40">{sizeOptions.unit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-charcoal/10 pt-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60 mb-3">
                Size Presets <span className="text-charcoal/40">(optional shortcuts)</span>
              </p>
              
              <div className="space-y-2 mb-3">
                {sizeOptions.presets.map((preset, index) => (
                  <div key={preset.id} className="flex items-center gap-2 p-2 border border-charcoal/10 bg-cream/30">
                    <input
                      type="text"
                      value={preset.name}
                      onChange={(e) => updatePreset(index, { name: e.target.value })}
                      placeholder="Preset name..."
                      className="flex-1 border border-charcoal/20 px-2 py-1 font-mono text-[10px]"
                    />
                    <input
                      type="number"
                      value={preset.width}
                      onChange={(e) => updatePreset(index, { width: parseFloat(e.target.value) || 0 })}
                      className="w-12 border border-charcoal/20 px-1 py-1 font-mono text-[10px] text-center"
                    />
                    <span className="font-mono text-[9px] text-charcoal/40">×</span>
                    <input
                      type="number"
                      value={preset.length}
                      onChange={(e) => updatePreset(index, { length: parseFloat(e.target.value) || 0 })}
                      className="w-12 border border-charcoal/20 px-1 py-1 font-mono text-[10px] text-center"
                    />
                    <span className="font-mono text-[9px] text-charcoal/40">×</span>
                    <input
                      type="number"
                      value={preset.height}
                      onChange={(e) => updatePreset(index, { height: parseFloat(e.target.value) || 0 })}
                      className="w-12 border border-charcoal/20 px-1 py-1 font-mono text-[10px] text-center"
                    />
                    <span className="font-mono text-[9px] text-charcoal/40">{sizeOptions.unit}</span>
                    <span className="font-mono text-[9px] text-charcoal/40">+£</span>
                    <input
                      type="number"
                      value={preset.price_modifier}
                      onChange={(e) => updatePreset(index, { price_modifier: parseFloat(e.target.value) || 0 })}
                      className="w-12 border border-charcoal/20 px-1 py-1 font-mono text-[10px] text-center"
                    />
                    <button
                      onClick={() => removePreset(index)}
                      className="p-1 text-charcoal/30 hover:text-red-500"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={addPreset}
                className="flex items-center gap-2 px-3 py-2 border border-dashed border-charcoal/30 hover:border-charcoal text-charcoal/50 hover:text-charcoal transition-all w-full justify-center"
              >
                <Plus size={12} />
                <span className="font-mono text-[10px] uppercase tracking-widest">Add preset</span>
              </button>

              <label className="flex items-center gap-2 mt-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sizeOptions.allow_custom_dimensions}
                  onChange={(e) => updateSizeOptions({ allow_custom_dimensions: e.target.checked })}
                  className="w-4 h-4 accent-charcoal"
                />
                <span className="font-mono text-[10px] text-charcoal/70">
                  Allow custom dimensions (customers enter exact size)
                </span>
              </label>
            </div>

            <div className="border-t border-charcoal/10 pt-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60 mb-2">
                Affected Parts
              </p>
              <p className="font-mono text-[9px] text-charcoal/40 mb-3">
                When size changes, these parts adapt:
              </p>
              
              <div className="space-y-2">
                {parts.length === 0 ? (
                  <p className="font-mono text-[10px] text-charcoal/40 italic">No parts defined</p>
                ) : (
                  parts.map(part => {
                    const isAffected = sizeOptions.affected_parts.some(p => p.part_id === part.id);
                    return (
                      <label key={part.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isAffected}
                          onChange={() => toggleAffectedPart(part.id)}
                          className="w-4 h-4 accent-charcoal"
                        />
                        <span className="font-mono text-[10px] text-charcoal/70">
                          {part.name} {isAffected ? '(scales with dimensions)' : '(fixed size)'}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
              
              <p className="font-mono text-[9px] text-charcoal/40 mt-2 flex items-center gap-1">
                <HelpCircle size={10} /> Parametric parts must have proper mesh topology
              </p>
            </div>

            <div className="border-t border-charcoal/10 pt-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60 mb-3">
                3D Adaptation
              </p>
              
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => updateSizeOptions({ adaptation_method: 'deformation' })}
                  className="w-full text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-4 h-4 rounded-full border mt-0.5 ${
                      sizeOptions.adaptation_method === 'deformation' 
                        ? 'border-charcoal bg-charcoal' 
                        : 'border-charcoal/30'
                    } flex items-center justify-center`}>
                      {sizeOptions.adaptation_method === 'deformation' && (
                        <div className="w-2 h-2 rounded-full bg-cream" />
                      )}
                    </div>
                    <div>
                      <span className="font-mono text-[11px] text-charcoal/70">
                        Real-time deformation (mesh scales, UV adapts)
                      </span>
                      <p className="font-mono text-[9px] text-accent mt-1">
                        ⚠ Requires proper mesh topology + UV layout
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => updateSizeOptions({ adaptation_method: 'swap_models' })}
                  className="w-full text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-4 h-4 rounded-full border mt-0.5 ${
                      sizeOptions.adaptation_method === 'swap_models' 
                        ? 'border-charcoal bg-charcoal' 
                        : 'border-charcoal/30'
                    } flex items-center justify-center`}>
                      {sizeOptions.adaptation_method === 'swap_models' && (
                        <div className="w-2 h-2 rounded-full bg-cream" />
                      )}
                    </div>
                    <div>
                      <span className="font-mono text-[11px] text-charcoal/70">
                        Swap models per preset (no deformation)
                      </span>
                      <p className="font-mono text-[9px] text-charcoal/40 mt-1">
                        Upload separate GLB for each preset size
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}

        {sizeOptions.mode === 'parametric' && (
          <div className="border-t border-charcoal/10 pt-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60 mb-2">
              Pricing Model
            </p>
            <p className="font-mono text-[9px] text-charcoal/40 mb-3">
              How should price change with size?
            </p>
            
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => updateSizeOptions({ pricing_mode: 'formula' })}
                className="w-full text-left"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-4 h-4 rounded-full border mt-0.5 ${
                    sizeOptions.pricing_mode === 'formula' 
                      ? 'border-charcoal bg-charcoal' 
                      : 'border-charcoal/30'
                  } flex items-center justify-center`}>
                    {sizeOptions.pricing_mode === 'formula' && (
                      <div className="w-2 h-2 rounded-full bg-cream" />
                    )}
                  </div>
                  <span className="font-mono text-[11px] text-charcoal/70">Formula-based</span>
                </div>
              </button>

              {sizeOptions.pricing_mode === 'formula' && (
                <div className="ml-7 space-y-2 p-3 bg-charcoal/5 border border-charcoal/10">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] text-charcoal/60">Base customization fee: £</span>
                    <input
                      type="number"
                      value={sizeOptions.base_price}
                      onChange={(e) => updateSizeOptions({ base_price: parseFloat(e.target.value) || 0 })}
                      className="w-16 border border-charcoal/20 px-2 py-1 font-mono text-[10px] text-center"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] text-charcoal/60">+ £</span>
                    <input
                      type="number"
                      value={sizeOptions.price_per_cm3}
                      onChange={(e) => updateSizeOptions({ price_per_cm3: parseFloat(e.target.value) || 0 })}
                      className="w-16 border border-charcoal/20 px-2 py-1 font-mono text-[10px] text-center"
                      step="0.01"
                    />
                    <span className="font-mono text-[9px] text-charcoal/60">per {volumeUnit} volume</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => updateSizeOptions({ pricing_mode: 'tiered' })}
                className="w-full text-left"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-4 h-4 rounded-full border mt-0.5 ${
                    sizeOptions.pricing_mode === 'tiered' 
                      ? 'border-charcoal bg-charcoal' 
                      : 'border-charcoal/30'
                  } flex items-center justify-center`}>
                    {sizeOptions.pricing_mode === 'tiered' && (
                      <div className="w-2 h-2 rounded-full bg-cream" />
                    )}
                  </div>
                  <span className="font-mono text-[11px] text-charcoal/70">Tiered pricing (per preset only)</span>
                </div>
              </button>
            </div>
          </div>
        )}

        <div className="border-t border-charcoal/10 pt-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60 mb-3">
            Export Requirements
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={true}
                  className="w-4 h-4 accent-charcoal"
                  readOnly
                />
                <span className="font-mono text-[10px] text-charcoal/70">
                  Pattern/Cut file with actual dimensions
                </span>
              </label>
              <select
                value={sizeOptions.export_pattern_format}
                onChange={(e) => updateSizeOptions({ export_pattern_format: e.target.value as 'dxf' | 'svg' | 'pdf' })}
                className="border border-charcoal/20 px-2 py-1 font-mono text-[10px]"
              >
                <option value="dxf">DXF</option>
                <option value="svg">SVG</option>
                <option value="pdf">PDF</option>
              </select>
              <select
                value={sizeOptions.export_scale}
                onChange={(e) => updateSizeOptions({ export_scale: e.target.value as '1:1' | '1:2' | '1:4' })}
                className="border border-charcoal/20 px-2 py-1 font-mono text-[10px]"
              >
                <option value="1:1">1:1</option>
                <option value="1:2">1:2</option>
                <option value="1:4">1:4</option>
              </select>
            </div>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sizeOptions.include_dimension_sheet}
                onChange={(e) => updateSizeOptions({ include_dimension_sheet: e.target.checked })}
                className="w-4 h-4 accent-charcoal"
              />
              <span className="font-mono text-[10px] text-charcoal/70">
                Include dimensions in production spec (PDF)
              </span>
            </label>
          </div>
        </div>
      </div>

      {!embedded && (
        <div className="p-4 sm:p-6 border-t border-charcoal/10 bg-cream/30 flex items-center justify-between gap-4">
          <CapabilityConfigFooterActions
            capability={capability}
            onRemove={onRemove}
            onSave={handleSave}
          />
        </div>
      )}
    </motion.div>
  );
};

interface ConfigurationPanelProps {
  capability: CapabilityDefinition;
  parts: PartDefinition[];
  config: CapabilityConfiguration;
  onUpdate: (config: CapabilityConfiguration) => void;
  onSave: () => void;
  onRemove: () => void;
  onClose: () => void;
  embedded?: boolean;
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  capability,
  parts,
  config,
  onUpdate,
  onSave,
  onRemove,
  onClose,
  embedded = false,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['applies_to', 'options'])
  );
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const optionNameRef = useRef(new Map<string, OptionInputHandle>());
  const optionPriceRef = useRef(new Map<string, PriceInputHandle>());
  const appliesToTitle = capability.id === 'swap_parts'
    ? 'What part can customers change?'
    : 'Applies To';
  const appliesToQuestion = capability.id === 'size'
    ? 'What can customers resize?'
    : capability.id === 'swap_parts'
    ? "Select the part you're offering options for"
    : 'What can customers customize?';
  const contentClassName = embedded
    ? 'flex-1 min-h-0 p-4 sm:p-6'
    : 'flex-1 min-h-0 p-4 sm:p-6 overflow-y-auto scroll-smooth';
  const panelClassName = 'bg-cream overflow-hidden w-full h-full min-h-0 flex flex-col';

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const handleAddOption = () => {
    const newOption: CapabilityOption = {
      id: `opt-${Date.now()}`,
      name: '',
      price_modifier: 0,
      is_default: config.options.length === 0,
    };
    onUpdate({ ...config, options: [...config.options, newOption] });
    setEditingOptionId(newOption.id);
  };

  const handleUpdateOption = (index: number, updates: Partial<CapabilityOption>) => {
    const newOptions = [...config.options];
    newOptions[index] = { ...newOptions[index], ...updates };
    onUpdate({ ...config, options: newOptions });
  };

  const handleRemoveOption = (index: number) => {
    const removed = config.options[index];
    const newOptions = config.options.filter((_, i) => i !== index);
    onUpdate({ ...config, options: newOptions });
    if (removed?.id && editingOptionId === removed.id) setEditingOptionId(null);
  };

  const commitOption = (optionId: string) => {
    optionNameRef.current.get(optionId)?.commit();
    optionPriceRef.current.get(optionId)?.commit();
  };

  const closeOptionEdit = (optionId: string, opts?: { allowDropEmpty?: boolean }) => {
    const idx = config.options.findIndex(o => o.id === optionId);
    if (idx < 0) {
      if (editingOptionId === optionId) setEditingOptionId(null);
      return;
    }

    const draftName = optionNameRef.current.get(optionId)?.getValue() ?? config.options[idx]?.name ?? '';
    if (opts?.allowDropEmpty !== false && !draftName.trim()) {
      handleRemoveOption(idx);
      return;
    }

    if (editingOptionId === optionId) setEditingOptionId(null);
  };

  const handleExportToggle = (format: ExportFormat) => {
    const newFormats = config.export_formats.includes(format)
      ? config.export_formats.filter(f => f !== format)
      : [...config.export_formats, format];
    onUpdate({ ...config, export_formats: newFormats });
  };

  const allowedExports = EXPORT_FORMATS_ORDER;
  const selectedExports = React.useMemo(() => {
    const onlyKnown = config.export_formats.filter(f => allowedExports.includes(f));
    const withRequired = onlyKnown.includes('config_json') ? onlyKnown : ['config_json', ...onlyKnown];
    return allowedExports.filter(f => withRequired.includes(f));
  }, [config.export_formats, allowedExports]);

  const handlePricingChange = (pricing: PricingModel) => {
    onUpdate({ ...config, pricing });
  };

  const handleTextOptionsChange = (updates: Partial<TextOptions>) => {
    onUpdate({
      ...config,
      text_options: { ...config.text_options!, ...updates },
    });
  };

  const Section: React.FC<{
    id: string;
    title: string;
    subtitle?: string;
    disabled?: boolean;
    badge?: React.ReactNode;
    children: React.ReactNode;
  }> = ({ id, title, subtitle, disabled, badge, children }) => {
    const isExpanded = expandedSections.has(id);
    return (
      <div className={`border-t border-charcoal/10 ${disabled ? 'opacity-50' : ''}`}>
        <button
          type="button"
          onClick={() => !disabled && toggleSection(id)}
          className="w-full flex items-center justify-between py-4 text-left"
          disabled={disabled}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60">
                {title}
              </span>
              {badge}
            </div>
            {subtitle && (
              <p className="font-mono text-[9px] text-charcoal/40 mt-0.5">{subtitle}</p>
            )}
          </div>
          <ChevronDown
            size={14}
            className={`text-charcoal/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>
        {isExpanded && !disabled && (
          <div className="pb-4">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className={panelClassName}
    >
      {!embedded && (
        <div className="p-4 sm:p-5 border-b border-charcoal/10 bg-cream/50">
          <CapabilityConfigHeaderContent capability={capability} onClose={onClose} />
        </div>
      )}

      <div className={contentClassName}>
        {capability.id === 'swap_parts' && (
          <div className="mb-6 space-y-3">
            <p className="font-mono text-[12px] text-charcoal leading-relaxed">
              Let customers choose which base part comes with the product (they must pick one option).
            </p>
            <div className="p-3 bg-cream/50 border border-charcoal/10 rounded">
              <p className="font-mono text-[9px] text-charcoal/40 leading-relaxed">
                If the customer can buy without this part, use Add-ons / Extras instead.
              </p>
            </div>
          </div>
        )}

        <Section id="applies_to" title={appliesToTitle} subtitle={appliesToQuestion}>
          <AppliesToSelector
            parts={parts}
            selectedParts={config.applies_to_parts}
            onChange={(applies_to_parts) => onUpdate({ ...config, applies_to_parts })}
            question={appliesToQuestion}
            showTitle={false}
            partsOnly={capability.id === 'swap_parts'}
          />
        </Section>

        {capability.supports_options && (
          <Section id="options" title={`${capability.label} Options`} subtitle="Define available choices">
            <div className="space-y-4">
              {config.options.map((option, index) => {
                const isEditing = editingOptionId === option.id;
                return (
                  <div
                    key={option.id}
                    data-option-row={option.id}
                    onBlur={(e) => {
                      const next = e.relatedTarget as Node | null;
                      if (!next || !e.currentTarget.contains(next)) closeOptionEdit(option.id);
                    }}
                    className={`
                      transition-all duration-200
                      ${isEditing 
                        ? 'flex gap-4 items-start bg-charcoal/5 p-5 rounded-lg -mx-2 sm:mx-0 border border-charcoal/10 my-4 shadow-sm'
                        : 'flex gap-2 items-start py-3 border-b border-charcoal/5 last:border-0 hover:bg-charcoal/[0.02] px-2 -mx-2 rounded transition-colors'
                      }
                    `}
                  >
                    {isEditing ? (
                      <>
                        <div className="flex-1 space-y-3">
                          <OptionInput
                            ref={(h) => {
                              if (h) optionNameRef.current.set(option.id, h);
                              else optionNameRef.current.delete(option.id);
                            }}
                            value={option.name}
                            placeholder={`Option ${index + 1} name...`}
                            onChange={(name) => handleUpdateOption(index, { name })}
                          />
                          
                          <div className="flex flex-wrap gap-y-3 gap-x-4 items-start">
                            <button
                              type="button"
                              className="flex items-center gap-2 px-3 py-1.5 border border-charcoal/20 text-charcoal/60 hover:border-charcoal hover:text-charcoal transition-colors bg-white"
                            >
                              <Upload size={12} />
                              <span className="font-mono text-[9px] uppercase tracking-widest">Upload 3D</span>
                            </button>

                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-[9px] text-charcoal/50">±£</span>
                                <PriceInput
                                  ref={(h) => {
                                    if (h) optionPriceRef.current.set(option.id, h);
                                    else optionPriceRef.current.delete(option.id);
                                  }}
                                  value={option.price_modifier}
                                  onChange={(price_modifier) => handleUpdateOption(index, { price_modifier })}
                                />
                              </div>
                              <span className="font-mono text-[8px] text-charcoal/40 tracking-wide whitespace-nowrap">
                                - cheaper / + higher
                              </span>
                            </div>
                          </div>

                          <div>
                            {option.is_default ? (
                              <span className="font-mono text-[9px] uppercase tracking-widest text-charcoal/40 border border-charcoal/10 px-2 py-1 rounded bg-charcoal/5">
                                Default Option
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  const newOptions = config.options.map((o, i) => ({
                                    ...o,
                                    is_default: i === index,
                                  }));
                                  onUpdate({ ...config, options: newOptions });
                                }}
                                className="font-mono text-[9px] uppercase tracking-widest text-charcoal/50 hover:text-charcoal underline decoration-dotted underline-offset-4"
                              >
                                Set as default
                              </button>
                            )}
                          </div>

                          {capability.id === 'swap_parts' && (
                            <div className="pt-3 mt-3 border-t border-charcoal/10 space-y-2">
                              <p className="font-mono text-[9px] uppercase tracking-widest text-charcoal/50 mb-2">
                                Where does this part attach?
                              </p>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`attachment_${option.id}`}
                                  checked={option.same_attachment_points ?? true}
                                  onChange={() => handleUpdateOption(index, { same_attachment_points: true })}
                                  className="w-3.5 h-3.5 accent-charcoal"
                                />
                                <span className="font-mono text-[10px] text-charcoal/70">
                                  Same points as original
                                </span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`attachment_${option.id}`}
                                  checked={!(option.same_attachment_points ?? true)}
                                  onChange={() => handleUpdateOption(index, { same_attachment_points: false })}
                                  className="w-3.5 h-3.5 accent-charcoal"
                                />
                                <span className="font-mono text-[10px] text-charcoal/70">
                                  Other points
                                </span>
                              </label>
                              {!(option.same_attachment_points ?? true) && (
                                <div className="pl-5 pt-1 space-y-1">
                                  <button
                                    type="button"
                                    className="flex items-center gap-2 px-3 py-2 border border-charcoal/20 text-charcoal/60 hover:border-charcoal hover:text-charcoal transition-colors bg-white"
                                  >
                                    <span className="font-mono text-[9px] uppercase tracking-widest">Pick points on model</span>
                                  </button>
                                  <p className="font-mono text-[8px] text-charcoal/40">
                                    Click where this part connects
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const currentName = optionNameRef.current.get(option.id)?.getValue() ?? option.name ?? '';
                              if (!currentName.trim()) {
                                optionNameRef.current.get(option.id)?.focus();
                                return;
                              }
                              commitOption(option.id);
                              requestAnimationFrame(() => closeOptionEdit(option.id, { allowDropEmpty: false }));
                            }}
                            className={`${CONTROL_BTN_BASE} px-3`}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(index)}
                            className="p-2 text-charcoal/30 hover:text-red-500 transition-colors self-center"
                            aria-label="Remove option"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditingOptionId(option.id)}
                          className="flex-1 border border-charcoal/20 bg-white px-4 py-3 text-left hover:border-charcoal transition-colors"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className={`font-mono text-[11px] uppercase tracking-widest ${option.name ? 'text-charcoal' : 'text-charcoal/40 italic'}`}>
                              {option.name || `Option ${index + 1}`}
                            </span>
                            <span className="font-mono text-[10px] text-charcoal/50">
                              {formatPriceDelta(option.price_modifier)}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center gap-3 flex-wrap">
                            {capability.id === 'swap_parts' ? (
                              <span className="font-mono text-[9px] uppercase tracking-widest text-charcoal/40">
                                {option.same_attachment_points === false ? 'Custom attachment' : 'Same attachment'}
                              </span>
                            ) : (
                              <span className="font-mono text-[9px] uppercase tracking-widest text-charcoal/40">
                                {option.swatch_url ? 'Has swatch' : 'No swatch'}
                              </span>
                            )}
                            {option.is_default && (
                              <span className="font-mono text-[9px] uppercase tracking-widest text-success">
                                Default
                              </span>
                            )}
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(index)}
                          className="p-2 text-charcoal/30 hover:text-red-500 transition-colors"
                          aria-label="Remove option"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
              <button
                type="button"
                onClick={handleAddOption}
                className="flex items-center gap-2 px-3 py-3 border border-dashed border-charcoal/30 hover:border-charcoal text-charcoal/50 hover:text-charcoal transition-all w-full justify-center mt-4"
              >
                <Plus size={12} />
                <span className="font-mono text-[10px] uppercase tracking-widest">Add option</span>
              </button>
            </div>
          </Section>
        )}

        {capability.supports_zones && (
          <Section id="zones" title="Zones & Placement" subtitle="Define where customization can be placed">
            <div className="border border-charcoal/10 bg-charcoal/5 p-4 flex items-center justify-center min-h-[150px]">
              <div className="text-center">
                <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal/40 mb-2">
                  3D Zone Editor
                </p>
                <p className="font-mono text-[9px] text-charcoal/30">
                  Click on model to define zones
                </p>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {config.zones.map((zone, index) => (
                <div key={zone.id} className="flex items-center justify-between p-2 border border-charcoal/10 bg-white">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-widest">{zone.name}</span>
                    <span className="font-mono text-[9px] text-charcoal/40 ml-2">
                      {zone.max_width_cm}×{zone.max_height_cm} cm
                    </span>
                  </div>
                  <button className="text-charcoal/30 hover:text-red-500">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-2 border border-dashed border-charcoal/30 hover:border-charcoal text-charcoal/50 hover:text-charcoal transition-all w-full justify-center"
              >
                <Plus size={12} />
                <span className="font-mono text-[10px] uppercase tracking-widest">Add zone</span>
              </button>
            </div>
          </Section>
        )}

        {capability.supports_text_config && (
          <Section id="text_options" title="Text Options" subtitle="Character limits and fonts">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="font-mono text-[10px] text-charcoal/60">Character limit:</span>
                <input
                  type="number"
                  value={config.text_options?.max_characters || 3}
                  onChange={(e) => handleTextOptionsChange({ max_characters: parseInt(e.target.value) || 1 })}
                  min={1}
                  max={50}
                  className="w-16 border border-charcoal/20 px-2 py-1 font-mono text-[10px] text-center focus:outline-none focus:border-charcoal"
                />
                <span className="font-mono text-[9px] text-charcoal/40">characters</span>
              </div>
              <div>
                <span className="font-mono text-[10px] text-charcoal/60 block mb-2">Fonts:</span>
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-2 border border-dashed border-charcoal/30 hover:border-charcoal text-charcoal/50 hover:text-charcoal transition-all"
                >
                  <Upload size={12} />
                  <span className="font-mono text-[10px] uppercase tracking-widest">Upload font files</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.text_options?.block_profanity ?? true}
                    onChange={(e) => handleTextOptionsChange({ block_profanity: e.target.checked })}
                    className="w-4 h-4 border border-charcoal/30 accent-charcoal"
                  />
                  <span className="font-mono text-[10px] text-charcoal/70">Block profanity</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.text_options?.uppercase_only ?? false}
                    onChange={(e) => handleTextOptionsChange({ uppercase_only: e.target.checked })}
                    className="w-4 h-4 border border-charcoal/30 accent-charcoal"
                  />
                  <span className="font-mono text-[10px] text-charcoal/70">Uppercase only</span>
                </label>
              </div>
            </div>
          </Section>
        )}

        <Section
          id="rules"
          title="Rules & Constraints"
          subtitle="Conditional logic between options"
          badge={<ComingSoonBadge />}
          disabled
        >
          <div className="space-y-2">
            {config.rules.map((rule, index) => (
              <div key={rule.id} className="p-3 border border-charcoal/10 bg-cream/50">
                <p className="font-mono text-[10px] text-charcoal/70">
                  IF {rule.if_capability} = "{rule.if_option_id}" THEN {rule.then_action} {rule.then_target_capability || rule.then_target_part}
                </p>
                {rule.reason && (
                  <p className="font-mono text-[9px] text-charcoal/40 mt-1">({rule.reason})</p>
                )}
              </div>
            ))}
            <button
              type="button"
              className="flex items-center gap-2 px-3 py-2 border border-dashed border-charcoal/30 hover:border-charcoal text-charcoal/50 hover:text-charcoal transition-all w-full justify-center"
            >
              <Plus size={12} />
              <span className="font-mono text-[10px] uppercase tracking-widest">Add rule</span>
            </button>
          </div>
        </Section>

        <Section id="exports" title="Export Requirements" subtitle="What production files do you need?">
          <div className="space-y-3">
            <label className="flex items-center gap-3 py-1 opacity-60">
              <input
                type="checkbox"
                checked={true}
                disabled
                className="w-4 h-4 border border-charcoal/30 accent-charcoal"
              />
              <span className="font-mono text-[10px] text-charcoal/50">
                Config JSON (always included)
              </span>
            </label>

            {EXPORT_FORMATS_ORDER.filter(f => f !== 'config_json').map((format) => (
              <label key={format} className="flex items-center gap-3 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={selectedExports.includes(format)}
                  onChange={() => handleExportToggle(format)}
                  className="w-4 h-4 border border-charcoal/30 accent-charcoal"
                />
                <span className="font-mono text-[10px] text-charcoal/70">
                  {EXPORT_FORMAT_LABELS[format]}
                </span>
              </label>
            ))}
          </div>
        </Section>

        <Section id="pricing" title="Pricing Model">
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="pricing"
                checked={config.pricing.type === 'per_option'}
                onChange={() => handlePricingChange({ type: 'per_option' })}
                className="w-4 h-4 border border-charcoal/30 accent-charcoal"
              />
              <span className="font-mono text-[10px] text-charcoal/70">Per-option pricing (set individually above)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="pricing"
                checked={config.pricing.type === 'fixed'}
                onChange={() => handlePricingChange({ type: 'fixed', amount: 0 })}
                className="w-4 h-4 border border-charcoal/30 accent-charcoal"
              />
              <span className="font-mono text-[10px] text-charcoal/70">Fixed markup: +£</span>
              {config.pricing.type === 'fixed' && (
                <input
                  type="number"
                  value={config.pricing.amount}
                  onChange={(e) => handlePricingChange({ type: 'fixed', amount: parseFloat(e.target.value) || 0 })}
                  className="w-16 border border-charcoal/20 px-2 py-1 font-mono text-[10px] text-center focus:outline-none focus:border-charcoal"
                />
              )}
            </label>
            {capability.supports_text_config && (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="pricing"
                  checked={config.pricing.type === 'per_unit'}
                  onChange={() => handlePricingChange({ type: 'per_unit', amount: 0 })}
                  className="w-4 h-4 border border-charcoal/30 accent-charcoal"
                />
                <span className="font-mono text-[10px] text-charcoal/70">Per character: +£</span>
                {config.pricing.type === 'per_unit' && (
                  <input
                    type="number"
                    value={config.pricing.amount}
                    onChange={(e) => handlePricingChange({ type: 'per_unit', amount: parseFloat(e.target.value) || 0 })}
                    className="w-16 border border-charcoal/20 px-2 py-1 font-mono text-[10px] text-center focus:outline-none focus:border-charcoal"
                  />
                )}
              </label>
            )}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="pricing"
                checked={config.pricing.type === 'no_charge'}
                onChange={() => handlePricingChange({ type: 'no_charge' })}
                className="w-4 h-4 border border-charcoal/30 accent-charcoal"
              />
              <span className="font-mono text-[10px] text-charcoal/70">No price change</span>
            </label>
          </div>
        </Section>
      </div>

      {!embedded && (
        <div className="p-4 sm:p-6 border-t border-charcoal/10 bg-cream/30 flex items-center justify-between gap-4">
          <CapabilityConfigFooterActions
            capability={capability}
            onRemove={onRemove}
            onSave={onSave}
          />
        </div>
      )}
    </motion.div>
  );
};

interface CapabilityConfigCardProps {
  capability: CapabilityDefinition;
  parts: PartDefinition[];
  config: CapabilityConfiguration;
  onUpdate: (config: CapabilityConfiguration) => void;
  onSave: () => void;
  onRemove: () => void;
  onClose: () => void;
}

interface CapabilityConfigPanelProps extends CapabilityConfigCardProps {
  embedded?: boolean;
}

export const CapabilityConfigPanel: React.FC<CapabilityConfigPanelProps> = ({
  capability,
  parts,
  config,
  onUpdate,
  onSave,
  onRemove,
  onClose,
  embedded = false,
}) => {
  return capability.id === 'size' ? (
    <SizeConfigurationPanel
      capability={capability}
      parts={parts}
      config={config}
      onUpdate={onUpdate}
      onSave={onSave}
      onRemove={onRemove}
      onClose={onClose}
      embedded={embedded}
    />
  ) : (
    <ConfigurationPanel
      capability={capability}
      parts={parts}
      config={config}
      onUpdate={onUpdate}
      onSave={onSave}
      onRemove={onRemove}
      onClose={onClose}
      embedded={embedded}
    />
  );
};

const CapabilityConfigCard: React.FC<CapabilityConfigCardProps> = ({
  capability,
  parts,
  config,
  onUpdate,
  onSave,
  onRemove,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-charcoal/40 flex items-start sm:items-center justify-center sm:p-8 overflow-y-auto">
      <div className="w-full sm:w-[75%] sm:max-w-2xl bg-cream flex flex-col min-h-screen sm:min-h-0 sm:max-h-[85vh] border border-charcoal rounded-[20px] sm:rounded-[24px] md:rounded-[32px] shadow-xl overflow-hidden">
        <CapabilityConfigPanel
          capability={capability}
          parts={parts}
          config={config}
          onUpdate={onUpdate}
          onSave={onSave}
          onRemove={onRemove}
          onClose={onClose}
        />
      </div>
    </div>
  );
};

export default CapabilityConfigCard;

