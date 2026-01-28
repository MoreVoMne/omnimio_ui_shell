import React, { useState } from 'react';
import { useCanvasStore } from '../../stores/canvasStore';
import type {
  CapabilityConfig,
  MaterialOption,
  PartSwapAlternative,
  AddOnItem,
  PricingConfig,
  Zone,
} from '../../types/canvas';
import type { CapabilityType } from '../../types/canvas';

interface CapabilityConfigProps {
  partId: string;
  capabilityId: string;
  onClose: () => void;
}

const CapabilityConfig: React.FC<CapabilityConfigProps> = ({ partId, capabilityId, onClose }) => {
  const { parts, capabilities, assets, zones, configureCapability, setOverlay } = useCanvasStore();
  const part = parts.find((p) => p.id === partId);
  const capability = capabilities.get(partId)?.find((c) => c.id === capabilityId);

  if (!capability) {
    return null;
  }

  const [config, setConfig] = useState<CapabilityConfig>(capability.config || {});

  const handleSave = () => {
    configureCapability(partId, capabilityId, config);
    onClose();
  };

  // Material Capability
  if (capability.type === 'material') {
    const materialOptions = (config.options as MaterialOption[]) || [];
    const textures = assets.textures;

    return (
      <div className="fixed inset-0 z-50 bg-charcoal/40 flex items-center justify-center p-6">
        <div className="bg-cream border border-charcoal rounded-[20px] p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-xl">
              {part?.name || 'Part'} &gt; MATERIAL
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-charcoal flex items-center justify-center hover:bg-charcoal hover:text-cream transition-colors"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] mb-3">
                MATERIAL OPTIONS
              </div>
              <div className="mb-4">
                <div className="font-mono text-xs uppercase tracking-widest mb-2">
                  Add from your assets:
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {textures.map((texture) => {
                    const isSelected = materialOptions.some((opt) => opt.textureId === texture.id);
                    return (
                      <div
                        key={texture.id}
                        className={`border rounded-[12px] p-2 cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-charcoal bg-charcoal/10'
                            : 'border-charcoal/40 hover:border-charcoal'
                        }`}
                        onClick={() => {
                          if (isSelected) {
                            setConfig({
                              ...config,
                              options: materialOptions.filter((opt) => opt.textureId !== texture.id),
                            });
                          } else {
                            const newOption: MaterialOption = {
                              id: `opt-${Date.now()}`,
                              name: texture.name,
                              customerName: texture.name,
                              textureId: texture.id,
                              price: 0,
                              isDefault: materialOptions.length === 0,
                            };
                            setConfig({
                              ...config,
                              options: [...materialOptions, newOption],
                            });
                          }
                        }}
                      >
                        {texture.url && (
                          <img
                            src={texture.url}
                            alt={texture.name}
                            className="w-full aspect-square object-cover rounded-[8px] mb-2"
                          />
                        )}
                        <div className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-3 h-3"
                          />
                          <span className="font-mono text-[10px] uppercase tracking-widest text-charcoal/70 truncate">
                            {texture.name}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <button className="border border-charcoal/40 border-dashed rounded-[12px] p-2 hover:border-charcoal transition-colors flex flex-col items-center justify-center min-h-[100px]">
                    <span className="text-2xl mb-1">+</span>
                    <span className="font-mono text-[10px] uppercase tracking-widest">Add</span>
                  </button>
                </div>
              </div>

              {materialOptions.length > 0 && (
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.3em] mb-3">
                    SELECTED OPTIONS ({materialOptions.length})
                  </div>
                  <div className="space-y-3">
                    {materialOptions.map((option) => (
                      <div
                        key={option.id}
                        className="border border-charcoal rounded-[12px] p-4 bg-cream/60"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          {option.textureId && (
                            <img
                              src={assets.textures.find((t) => t.id === option.textureId)?.url}
                              alt={option.name}
                              className="w-16 h-16 object-cover rounded-[8px] border border-charcoal/40"
                            />
                          )}
                          <div className="flex-1">
                            <div className="font-serif text-lg mb-2">{option.name}</div>
                            <div className="space-y-2">
                              <div>
                                <label className="block font-mono text-[10px] uppercase tracking-widest mb-1">
                                  Customer name:
                                </label>
                                <input
                                  type="text"
                                  value={option.customerName}
                                  onChange={(e) => {
                                    setConfig({
                                      ...config,
                                      options: materialOptions.map((opt) =>
                                        opt.id === option.id
                                          ? { ...opt, customerName: e.target.value }
                                          : opt
                                      ),
                                    });
                                  }}
                                  className="w-full border border-charcoal rounded-full px-3 py-1 font-mono text-xs uppercase tracking-widest bg-cream"
                                />
                              </div>
                              <div>
                                <label className="block font-mono text-[10px] uppercase tracking-widest mb-1">
                                  Price:
                                </label>
                                <div className="flex items-center gap-3">
                                  <label className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name={`price-${option.id}`}
                                      checked={option.price === 0}
                                      onChange={() => {
                                        setConfig({
                                          ...config,
                                          options: materialOptions.map((opt) =>
                                            opt.id === option.id ? { ...opt, price: 0 } : opt
                                          ),
                                        });
                                      }}
                                    />
                                    <span className="font-mono text-xs uppercase tracking-widest">
                                      Included
                                    </span>
                                  </label>
                                  <label className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name={`price-${option.id}`}
                                      checked={option.price !== 0}
                                      onChange={() => {}}
                                    />
                                    <span className="font-mono text-xs uppercase tracking-widest">
                                      +£
                                    </span>
                                    <input
                                      type="number"
                                      value={option.price || 0}
                                      onChange={(e) => {
                                        setConfig({
                                          ...config,
                                          options: materialOptions.map((opt) =>
                                            opt.id === option.id
                                              ? { ...opt, price: parseFloat(e.target.value) || 0 }
                                              : opt
                                          ),
                                        });
                                      }}
                                      className="w-20 border border-charcoal rounded-full px-2 py-1 font-mono text-xs uppercase tracking-widest bg-cream"
                                    />
                                  </label>
                                </div>
                              </div>
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={option.isDefault}
                                  onChange={(e) => {
                                    setConfig({
                                      ...config,
                                      options: materialOptions.map((opt) =>
                                        opt.id === option.id
                                          ? { ...opt, isDefault: e.target.checked }
                                          : { ...opt, isDefault: false }
                                      ),
                                      defaultOptionId: e.target.checked ? option.id : undefined,
                                    });
                                  }}
                                />
                                <span className="font-mono text-xs uppercase tracking-widest">
                                  Default option
                                </span>
                              </label>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setConfig({
                                ...config,
                                options: materialOptions.filter((opt) => opt.id !== option.id),
                              });
                            }}
                            className="font-mono text-[10px] uppercase tracking-widest underline underline-offset-4 hover:text-accent"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-charcoal/20">
              <button
                onClick={onClose}
                className="border border-charcoal px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-charcoal hover:text-cream transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="border border-charcoal px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest bg-charcoal text-cream hover:bg-charcoal/90 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Print Capability
  if (capability.type === 'print') {
    const partZones = zones.get(partId) || [];
    const printZones = (config.zones as Zone[]) || [];
    const imageLibrary = config.imageLibrary || [];

    return (
      <div className="fixed inset-0 z-50 bg-charcoal/40 flex items-center justify-center p-6">
        <div className="bg-cream border border-charcoal rounded-[20px] p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-xl">{part?.name || 'Part'} &gt; PRINT</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-charcoal flex items-center justify-center hover:bg-charcoal hover:text-cream transition-colors"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            {/* Zones */}
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] mb-3">ZONES</div>
              {printZones.length > 0 ? (
                <div className="space-y-2">
                  {printZones.map((zone) => (
                    <div
                      key={zone.id}
                      className="border border-charcoal rounded-[12px] p-3 bg-cream/60 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-serif text-base">● {zone.name}</div>
                        <div className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60">
                          {zone.size.width} × {zone.size.height} cm
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          // Open zone editor
                          setOverlay('zone', { partId, capabilityId, zoneId: zone.id });
                        }}
                        className="border border-charcoal px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-charcoal hover:text-cream transition-colors"
                      >
                        Edit zone
                      </button>
                    </div>
                  ))}
                </div>
              ) : partZones.length > 0 ? (
                <div className="space-y-2">
                  <p className="font-mono text-xs uppercase tracking-widest text-charcoal/60 mb-2">
                    Select zones for print:
                  </p>
                  {partZones.map((zone) => (
                    <label key={zone.id} className="flex items-center gap-2 border border-charcoal/40 rounded-[12px] p-3 bg-cream/60 cursor-pointer hover:bg-cream/80">
                      <input
                        type="checkbox"
                        checked={printZones.some((z) => z.id === zone.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setConfig({
                              ...config,
                              zones: [...printZones, zone],
                            });
                          } else {
                            setConfig({
                              ...config,
                              zones: printZones.filter((z) => z.id !== zone.id),
                            });
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <div>
                        <div className="font-serif text-base">{zone.name}</div>
                        <div className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60">
                          {zone.size.width} × {zone.size.height} cm
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="border border-charcoal/40 border-dashed rounded-[12px] p-4 text-center">
                  <p className="font-mono text-xs uppercase tracking-widest text-charcoal/60 mb-2">
                    No zones defined for this part
                  </p>
                  <button
                    onClick={() => {
                      setOverlay('zone', { partId, capabilityId });
                    }}
                    className="border border-charcoal px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-charcoal hover:text-cream transition-colors"
                  >
                    Define zones
                  </button>
                </div>
              )}
            </div>

            {/* Print Options */}
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] mb-3">PRINT OPTIONS</div>
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.allowUpload !== false}
                    onChange={(e) => setConfig({ ...config, allowUpload: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="font-mono text-xs uppercase tracking-widest">
                    Customer can upload own image
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.allowLibrary || false}
                    onChange={(e) => setConfig({ ...config, allowLibrary: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="font-mono text-xs uppercase tracking-widest">
                    Customer can choose from library
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.allowAI || false}
                    onChange={(e) => setConfig({ ...config, allowAI: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="font-mono text-xs uppercase tracking-widest">
                    Customer can use AI generation
                  </span>
                </label>
              </div>
            </div>

            {/* Image Library */}
            {config.allowLibrary && (
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] mb-3">IMAGE LIBRARY</div>
                <div className="grid grid-cols-4 gap-3">
                  {assets.images.map((image) => (
                    <div
                      key={image.id}
                      className={`border rounded-[12px] p-2 cursor-pointer transition-colors ${
                        imageLibrary.includes(image.id)
                          ? 'border-charcoal bg-charcoal/10'
                          : 'border-charcoal/40 hover:border-charcoal'
                      }`}
                      onClick={() => {
                        if (imageLibrary.includes(image.id)) {
                          setConfig({
                            ...config,
                            imageLibrary: imageLibrary.filter((id) => id !== image.id),
                          });
                        } else {
                          setConfig({
                            ...config,
                            imageLibrary: [...imageLibrary, image.id],
                          });
                        }
                      }}
                    >
                      {image.url && (
                        <img
                          src={image.url}
                          alt={image.name}
                          className="w-full aspect-square object-cover rounded-[8px] mb-2"
                        />
                      )}
                      <div className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={imageLibrary.includes(image.id)}
                          onChange={() => {}}
                          className="w-3 h-3"
                        />
                        <span className="font-mono text-[10px] uppercase tracking-widest text-charcoal/70 truncate">
                          {image.name}
                        </span>
                      </div>
                    </div>
                  ))}
                  <button className="border border-charcoal/40 border-dashed rounded-[12px] p-2 hover:border-charcoal transition-colors flex flex-col items-center justify-center min-h-[100px]">
                    <span className="text-2xl mb-1">+</span>
                    <span className="font-mono text-[10px] uppercase tracking-widest">Add</span>
                  </button>
                </div>
              </div>
            )}

            {/* Pricing */}
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] mb-3">PRICING</div>
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="pricing-model"
                    checked={!config.pricing || config.pricing.model === 'fixed'}
                    onChange={() =>
                      setConfig({
                        ...config,
                        pricing: { model: 'fixed', basePrice: config.pricing?.basePrice || 15 },
                      })
                    }
                  />
                  <span className="font-mono text-xs uppercase tracking-widest">Fixed price: £</span>
                  <input
                    type="number"
                    value={config.pricing?.basePrice || 15}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        pricing: {
                          model: 'fixed',
                          basePrice: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-20 border border-charcoal rounded-full px-2 py-1 font-mono text-xs uppercase tracking-widest bg-cream"
                  />
                  <span className="font-mono text-xs uppercase tracking-widest">per placement</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="pricing-model"
                    checked={config.pricing?.model === 'by-size'}
                    onChange={() =>
                      setConfig({
                        ...config,
                        pricing: { model: 'by-size', perCm2: config.pricing?.perCm2 || 0.5 },
                      })
                    }
                  />
                  <span className="font-mono text-xs uppercase tracking-widest">By size: £</span>
                  <input
                    type="number"
                    step="0.1"
                    value={config.pricing?.perCm2 || 0.5}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        pricing: {
                          model: 'by-size',
                          perCm2: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-20 border border-charcoal rounded-full px-2 py-1 font-mono text-xs uppercase tracking-widest bg-cream"
                  />
                  <span className="font-mono text-xs uppercase tracking-widest">per cm²</span>
                </label>
              </div>
            </div>

            {/* Constraints */}
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] mb-3">CONSTRAINTS</div>
              <div className="space-y-3">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest mb-1">
                    Min resolution: (DPI)
                  </label>
                  <input
                    type="number"
                    value={config.minResolution || 300}
                    onChange={(e) =>
                      setConfig({ ...config, minResolution: parseInt(e.target.value) || 300 })
                    }
                    className="w-full border border-charcoal rounded-full px-3 py-1 font-mono text-xs uppercase tracking-widest bg-cream"
                  />
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest mb-2">
                    Allowed formats:
                  </div>
                  <div className="flex gap-3">
                    {['PNG', 'JPG', 'SVG'].map((format) => (
                      <label key={format} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={
                            !config.allowedFormats ||
                            config.allowedFormats.includes(format.toLowerCase())
                          }
                          onChange={(e) => {
                            const formats = config.allowedFormats || ['png', 'jpg'];
                            if (e.target.checked) {
                              setConfig({
                                ...config,
                                allowedFormats: [...formats, format.toLowerCase()],
                              });
                            } else {
                              setConfig({
                                ...config,
                                allowedFormats: formats.filter((f) => f !== format.toLowerCase()),
                              });
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="font-mono text-xs uppercase tracking-widest">{format}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest mb-1">
                    Max file size: (MB)
                  </label>
                  <input
                    type="number"
                    value={config.maxFileSize ? config.maxFileSize / 1024 / 1024 : 5}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        maxFileSize: (parseFloat(e.target.value) || 5) * 1024 * 1024,
                      })
                    }
                    className="w-full border border-charcoal rounded-full px-3 py-1 font-mono text-xs uppercase tracking-widest bg-cream"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-charcoal/20">
              <button
                onClick={onClose}
                className="border border-charcoal px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-charcoal hover:text-cream transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="border border-charcoal px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest bg-charcoal text-cream hover:bg-charcoal/90 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Text/Monogram Capability
  if (capability.type === 'text') {
    const partZones = zones.get(partId) || [];
    const textZones = (config.zones as Zone[]) || [];
    const fonts = config.fonts || [];
    const colors = config.colors || [];

    return (
      <div className="fixed inset-0 z-50 bg-charcoal/40 flex items-center justify-center p-6">
        <div className="bg-cream border border-charcoal rounded-[20px] p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-xl">{part?.name || 'Part'} &gt; TEXT</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-charcoal flex items-center justify-center hover:bg-charcoal hover:text-cream transition-colors"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            {/* Zones */}
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] mb-3">ZONES</div>
              {textZones.length > 0 ? (
                <div className="space-y-2">
                  {textZones.map((zone) => (
                    <div
                      key={zone.id}
                      className="border border-charcoal rounded-[12px] p-3 bg-cream/60 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-serif text-base">● {zone.name}</div>
                        <div className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60">
                          {zone.size.width} × {zone.size.height} cm
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setOverlay('zone', { partId, capabilityId, zoneId: zone.id });
                        }}
                        className="border border-charcoal px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-charcoal hover:text-cream transition-colors"
                      >
                        Edit zone
                      </button>
                    </div>
                  ))}
                </div>
              ) : partZones.length > 0 ? (
                <div className="space-y-2">
                  {partZones.map((zone) => (
                    <label
                      key={zone.id}
                      className="flex items-center gap-2 border border-charcoal/40 rounded-[12px] p-3 bg-cream/60 cursor-pointer hover:bg-cream/80"
                    >
                      <input
                        type="checkbox"
                        checked={textZones.some((z) => z.id === zone.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setConfig({
                              ...config,
                              zones: [...textZones, zone],
                            });
                          } else {
                            setConfig({
                              ...config,
                              zones: textZones.filter((z) => z.id !== zone.id),
                            });
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <div>
                        <div className="font-serif text-base">{zone.name}</div>
                        <div className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60">
                          {zone.size.width} × {zone.size.height} cm
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="border border-charcoal/40 border-dashed rounded-[12px] p-4 text-center">
                  <p className="font-mono text-xs uppercase tracking-widest text-charcoal/60 mb-2">
                    No zones defined for this part
                  </p>
                  <button
                    onClick={() => {
                      setOverlay('zone', { partId, capabilityId });
                    }}
                    className="border border-charcoal px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-charcoal hover:text-cream transition-colors"
                  >
                    Define zones
                  </button>
                </div>
              )}
            </div>

            {/* Text Options */}
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] mb-3">TEXT OPTIONS</div>
              <div className="space-y-3">
                <div>
                  <div className="font-mono text-xs uppercase tracking-widest mb-2">Text type:</div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="text-type"
                        checked={config.textType === 'monogram' || !config.textType}
                        onChange={() => setConfig({ ...config, textType: 'monogram' })}
                      />
                      <span className="font-mono text-xs uppercase tracking-widest">
                        Monogram (initials)
                      </span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="text-type"
                        checked={config.textType === 'free-text'}
                        onChange={() => setConfig({ ...config, textType: 'free-text' })}
                      />
                      <span className="font-mono text-xs uppercase tracking-widest">Free text</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="text-type"
                        checked={config.textType === 'name'}
                        onChange={() => setConfig({ ...config, textType: 'name' })}
                      />
                      <span className="font-mono text-xs uppercase tracking-widest">Name</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest mb-1">
                    Max characters:
                  </label>
                  <input
                    type="number"
                    value={config.maxCharacters || 3}
                    onChange={(e) =>
                      setConfig({ ...config, maxCharacters: parseInt(e.target.value) || 3 })
                    }
                    className="w-full border border-charcoal rounded-full px-3 py-1 font-mono text-xs uppercase tracking-widest bg-cream"
                  />
                </div>
              </div>
            </div>

            {/* Fonts */}
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] mb-3">FONTS</div>
              <div className="grid grid-cols-3 gap-3">
                {assets.fonts.map((font) => (
                  <div
                    key={font.id}
                    className={`border rounded-[12px] p-3 cursor-pointer transition-colors ${
                      fonts.includes(font.id)
                        ? 'border-charcoal bg-charcoal/10'
                        : 'border-charcoal/40 hover:border-charcoal'
                    }`}
                    onClick={() => {
                      if (fonts.includes(font.id)) {
                        setConfig({
                          ...config,
                          fonts: fonts.filter((id) => id !== font.id),
                        });
                      } else {
                        setConfig({
                          ...config,
                          fonts: [...fonts, font.id],
                        });
                      }
                    }}
                  >
                    <div className="font-serif text-2xl mb-2">Aa</div>
                    <div className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={fonts.includes(font.id)}
                        onChange={() => {}}
                        className="w-3 h-3"
                      />
                      <span className="font-mono text-[10px] uppercase tracking-widest text-charcoal/70 truncate">
                        {font.name}
                      </span>
                    </div>
                  </div>
                ))}
                <button className="border border-charcoal/40 border-dashed rounded-[12px] p-3 hover:border-charcoal transition-colors flex flex-col items-center justify-center">
                  <span className="text-2xl mb-1">+</span>
                  <span className="font-mono text-[10px] uppercase tracking-widest">Add font</span>
                </button>
              </div>
            </div>

            {/* Colors */}
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] mb-3">COLORS</div>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="color-mode"
                    checked={!colors || colors.length === 0}
                    onChange={() => setConfig({ ...config, colors: [] })}
                  />
                  <span className="font-mono text-xs uppercase tracking-widest">
                    Match material color
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="color-mode"
                    checked={colors && colors.length > 0}
                    onChange={() => setConfig({ ...config, colors: ['#FFD700', '#C0C0C0', '#000000'] })}
                  />
                  <span className="font-mono text-xs uppercase tracking-widest">
                    Custom palette:
                  </span>
                </label>
                {colors && colors.length > 0 && (
                  <div className="flex gap-2 ml-6">
                    {colors.map((color, i) => (
                      <input
                        key={i}
                        type="color"
                        value={color}
                        onChange={(e) => {
                          const newColors = [...colors];
                          newColors[i] = e.target.value;
                          setConfig({ ...config, colors: newColors });
                        }}
                        className="w-12 h-12 border border-charcoal rounded-[8px] cursor-pointer"
                      />
                    ))}
                    <button
                      onClick={() => {
                        setConfig({
                          ...config,
                          colors: [...colors, '#000000'],
                        });
                      }}
                      className="w-12 h-12 border border-charcoal/40 border-dashed rounded-[8px] flex items-center justify-center hover:border-charcoal transition-colors"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing */}
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] mb-3">PRICING</div>
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="text-pricing"
                    checked={!config.pricing || config.pricing.model === 'fixed'}
                    onChange={() =>
                      setConfig({
                        ...config,
                        pricing: { model: 'fixed', basePrice: config.pricing?.basePrice || 10 },
                      })
                    }
                  />
                  <span className="font-mono text-xs uppercase tracking-widest">Fixed: £</span>
                  <input
                    type="number"
                    value={config.pricing?.basePrice || 10}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        pricing: {
                          model: 'fixed',
                          basePrice: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-20 border border-charcoal rounded-full px-2 py-1 font-mono text-xs uppercase tracking-widest bg-cream"
                  />
                  <span className="font-mono text-xs uppercase tracking-widest">per monogram</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="text-pricing"
                    checked={config.pricing?.model === 'per-character'}
                    onChange={() =>
                      setConfig({
                        ...config,
                        pricing: {
                          model: 'per-character',
                          perCharacter: config.pricing?.perCharacter || 2,
                        },
                      })
                    }
                  />
                  <span className="font-mono text-xs uppercase tracking-widest">Per character: £</span>
                  <input
                    type="number"
                    step="0.1"
                    value={config.pricing?.perCharacter || 2}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        pricing: {
                          model: 'per-character',
                          perCharacter: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-20 border border-charcoal rounded-full px-2 py-1 font-mono text-xs uppercase tracking-widest bg-cream"
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-charcoal/20">
              <button
                onClick={onClose}
                className="border border-charcoal px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-charcoal hover:text-cream transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="border border-charcoal px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest bg-charcoal text-cream hover:bg-charcoal/90 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Part Swap Capability
  if (capability.type === 'part-swap') {
    const alternatives = (config.alternatives as PartSwapAlternative[]) || [];

    return (
      <div className="fixed inset-0 z-50 bg-charcoal/40 flex items-center justify-center p-6">
        <div className="bg-cream border border-charcoal rounded-[20px] p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-xl">{part?.name || 'Part'} &gt; PART SWAP</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-charcoal flex items-center justify-center hover:bg-charcoal hover:text-cream transition-colors"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] mb-3">SWAP OPTIONS</div>
              <p className="font-mono text-xs uppercase tracking-widest text-charcoal/60 mb-4">
                What alternatives can customer choose?
              </p>

              {/* Current option */}
              <div className="border border-charcoal rounded-[12px] p-4 bg-cream/60 mb-4">
                <div className="font-serif text-lg mb-3">● Current (from model)</div>
                <div className="space-y-3">
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-widest mb-1">
                      Name:
                    </label>
                    <input
                      type="text"
                      value={part?.name || 'Current'}
                      readOnly
                      className="w-full border border-charcoal/40 rounded-full px-3 py-1 font-mono text-xs uppercase tracking-widest bg-cream/50"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-widest mb-1">
                      Price:
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2">
                        <input type="radio" name="current-price" defaultChecked />
                        <span className="font-mono text-xs uppercase tracking-widest">Included</span>
                      </label>
                    </div>
                  </div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                    <span className="font-mono text-xs uppercase tracking-widest">Default</span>
                  </label>
                </div>
              </div>

              {/* Alternative options */}
              <div className="space-y-3">
                {alternatives.map((alt) => (
                  <div key={alt.id} className="border border-charcoal rounded-[12px] p-4 bg-cream/60">
                    <div className="font-serif text-lg mb-3">○ Alternative</div>
                    <div className="space-y-3">
                      <div>
                        <label className="block font-mono text-[10px] uppercase tracking-widest mb-1">
                          Name:
                        </label>
                        <input
                          type="text"
                          value={alt.name}
                          onChange={(e) => {
                            setConfig({
                              ...config,
                              alternatives: alternatives.map((a) =>
                                a.id === alt.id ? { ...a, name: e.target.value } : a
                              ),
                            });
                          }}
                          className="w-full border border-charcoal rounded-full px-3 py-1 font-mono text-xs uppercase tracking-widest bg-cream"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[10px] uppercase tracking-widest mb-1">
                          3D Model:
                        </label>
                        <div className="border border-charcoal/40 border-dashed rounded-[12px] p-4 text-center">
                          {alt.modelId ? (
                            <div className="font-mono text-xs uppercase tracking-widest text-charcoal/60">
                              {assets.models.find((m) => m.id === alt.modelId)?.name || 'Model loaded'}
                            </div>
                          ) : (
                            <div className="font-mono text-xs uppercase tracking-widest text-charcoal/60">
                              Drop GLB here or Browse
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block font-mono text-[10px] uppercase tracking-widest mb-1">
                          Price:
                        </label>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`alt-price-${alt.id}`}
                              checked={alt.price === 0}
                              onChange={() => {
                                setConfig({
                                  ...config,
                                  alternatives: alternatives.map((a) =>
                                    a.id === alt.id ? { ...a, price: 0 } : a
                                  ),
                                });
                              }}
                            />
                            <span className="font-mono text-xs uppercase tracking-widest">Included</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`alt-price-${alt.id}`}
                              checked={alt.price !== 0}
                              onChange={() => {}}
                            />
                            <span className="font-mono text-xs uppercase tracking-widest">+£</span>
                            <input
                              type="number"
                              value={alt.price || 0}
                              onChange={(e) => {
                                setConfig({
                                  ...config,
                                  alternatives: alternatives.map((a) =>
                                    a.id === alt.id
                                      ? { ...a, price: parseFloat(e.target.value) || 0 }
                                      : a
                                  ),
                                });
                              }}
                              className="w-20 border border-charcoal rounded-full px-2 py-1 font-mono text-xs uppercase tracking-widest bg-cream"
                            />
                          </label>
                        </div>
                      </div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={alt.isDefault}
                          onChange={(e) => {
                            setConfig({
                              ...config,
                              alternatives: alternatives.map((a) =>
                                a.id === alt.id
                                  ? { ...a, isDefault: e.target.checked }
                                  : { ...a, isDefault: false }
                              ),
                            });
                          }}
                          className="w-4 h-4"
                        />
                        <span className="font-mono text-xs uppercase tracking-widest">Default</span>
                      </label>
                      <button
                        onClick={() => {
                          setConfig({
                            ...config,
                            alternatives: alternatives.filter((a) => a.id !== alt.id),
                          });
                        }}
                        className="font-mono text-[10px] uppercase tracking-widest underline underline-offset-4 hover:text-accent"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => {
                    const newAlt: PartSwapAlternative = {
                      id: `alt-${Date.now()}`,
                      name: 'Alternative',
                      price: 0,
                      isDefault: false,
                    };
                    setConfig({
                      ...config,
                      alternatives: [...alternatives, newAlt],
                    });
                  }}
                  className="border border-charcoal/40 border-dashed px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-charcoal hover:text-cream transition-colors w-full"
                >
                  + Add another option
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-charcoal/20">
              <button
                onClick={onClose}
                className="border border-charcoal px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-charcoal hover:text-cream transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="border border-charcoal px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest bg-charcoal text-cream hover:bg-charcoal/90 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Add-on Capability
  if (capability.type === 'add-on') {
    const addOnItems = (config.addOnItems as AddOnItem[]) || [];

    return (
      <div className="fixed inset-0 z-50 bg-charcoal/40 flex items-center justify-center p-6">
        <div className="bg-cream border border-charcoal rounded-[20px] p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-xl">{part?.name || 'Part'} &gt; ADD-ONS</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-charcoal flex items-center justify-center hover:bg-charcoal hover:text-cream transition-colors"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] mb-3">ADD-ON ITEMS</div>
              <p className="font-mono text-xs uppercase tracking-widest text-charcoal/60 mb-4">
                What can customer add to this part?
              </p>

              <div className="space-y-3">
                {addOnItems.map((item) => (
                  <div key={item.id} className="border border-charcoal rounded-[12px] p-4 bg-cream/60">
                    <div className="font-serif text-lg mb-3">● {item.name}</div>
                    <div className="space-y-3">
                      <div>
                        <label className="block font-mono text-[10px] uppercase tracking-widest mb-1">
                          Name:
                        </label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => {
                            setConfig({
                              ...config,
                              addOnItems: addOnItems.map((i) =>
                                i.id === item.id ? { ...i, name: e.target.value } : i
                              ),
                            });
                          }}
                          className="w-full border border-charcoal rounded-full px-3 py-1 font-mono text-xs uppercase tracking-widest bg-cream"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[10px] uppercase tracking-widest mb-1">
                          3D Model:
                        </label>
                        <div className="border border-charcoal/40 rounded-[12px] p-3 flex items-center justify-between">
                          <span className="font-mono text-xs uppercase tracking-widest text-charcoal/60">
                            {item.modelId
                              ? assets.models.find((m) => m.id === item.modelId)?.name || 'Model loaded'
                              : 'Not uploaded'}
                          </span>
                          <button className="border border-charcoal px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-charcoal hover:text-cream transition-colors">
                            {item.modelId ? 'Change' : 'Upload'}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block font-mono text-[10px] uppercase tracking-widest mb-1">
                          Max quantity:
                        </label>
                        <input
                          type="number"
                          value={item.maxQuantity}
                          onChange={(e) => {
                            setConfig({
                              ...config,
                              addOnItems: addOnItems.map((i) =>
                                i.id === item.id
                                  ? { ...i, maxQuantity: parseInt(e.target.value) || 1 }
                                  : i
                              ),
                            });
                          }}
                          min={1}
                          className="w-full border border-charcoal rounded-full px-3 py-1 font-mono text-xs uppercase tracking-widest bg-cream"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[10px] uppercase tracking-widest mb-1">
                          Price: £ (each)
                        </label>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => {
                            setConfig({
                              ...config,
                              addOnItems: addOnItems.map((i) =>
                                i.id === item.id
                                  ? { ...i, price: parseFloat(e.target.value) || 0 }
                                  : i
                              ),
                            });
                          }}
                          className="w-full border border-charcoal rounded-full px-3 py-1 font-mono text-xs uppercase tracking-widest bg-cream"
                        />
                      </div>
                      <button
                        onClick={() => {
                          setConfig({
                            ...config,
                            addOnItems: addOnItems.filter((i) => i.id !== item.id),
                          });
                        }}
                        className="font-mono text-[10px] uppercase tracking-widest underline underline-offset-4 hover:text-accent"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => {
                    const newItem: AddOnItem = {
                      id: `addon-${Date.now()}`,
                      name: 'Add-on',
                      maxQuantity: 1,
                      price: 0,
                    };
                    setConfig({
                      ...config,
                      addOnItems: [...addOnItems, newItem],
                    });
                  }}
                  className="border border-charcoal/40 border-dashed px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-charcoal hover:text-cream transition-colors w-full"
                >
                  + Add another add-on
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-charcoal/20">
              <button
                onClick={onClose}
                className="border border-charcoal px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-charcoal hover:text-cream transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="border border-charcoal px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest bg-charcoal text-cream hover:bg-charcoal/90 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Color Capability
  if (capability.type === 'color') {
    const colorOptions = (config.options as any[]) || [];

    return (
      <div className="fixed inset-0 z-50 bg-charcoal/40 flex items-center justify-center p-6">
        <div className="bg-cream border border-charcoal rounded-[20px] p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-xl">{part?.name || 'Part'} &gt; COLOR</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-charcoal flex items-center justify-center hover:bg-charcoal hover:text-cream transition-colors"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] mb-3">COLOR OPTIONS</div>
              <div className="space-y-3">
                {colorOptions.map((option) => (
                  <div key={option.id} className="border border-charcoal rounded-[12px] p-4 bg-cream/60">
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={option.color || '#000000'}
                        onChange={(e) => {
                          setConfig({
                            ...config,
                            options: colorOptions.map((opt) =>
                              opt.id === option.id ? { ...opt, color: e.target.value } : opt
                            ),
                          });
                        }}
                        className="w-16 h-16 border border-charcoal rounded-[8px] cursor-pointer"
                      />
                      <div className="flex-1">
                        <input
                          type="text"
                          value={option.name || 'Color'}
                          onChange={(e) => {
                            setConfig({
                              ...config,
                              options: colorOptions.map((opt) =>
                                opt.id === option.id ? { ...opt, name: e.target.value } : opt
                              ),
                            });
                          }}
                          placeholder="Color name"
                          className="w-full border border-charcoal rounded-full px-3 py-1 font-mono text-xs uppercase tracking-widest bg-cream mb-2"
                        />
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`color-price-${option.id}`}
                              checked={option.price === 0}
                              onChange={() => {
                                setConfig({
                                  ...config,
                                  options: colorOptions.map((opt) =>
                                    opt.id === option.id ? { ...opt, price: 0 } : opt
                                  ),
                                });
                              }}
                            />
                            <span className="font-mono text-xs uppercase tracking-widest">Included</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`color-price-${option.id}`}
                              checked={option.price !== 0}
                              onChange={() => {}}
                            />
                            <span className="font-mono text-xs uppercase tracking-widest">+£</span>
                            <input
                              type="number"
                              value={option.price || 0}
                              onChange={(e) => {
                                setConfig({
                                  ...config,
                                  options: colorOptions.map((opt) =>
                                    opt.id === option.id
                                      ? { ...opt, price: parseFloat(e.target.value) || 0 }
                                      : opt
                                  ),
                                });
                              }}
                              className="w-20 border border-charcoal rounded-full px-2 py-1 font-mono text-xs uppercase tracking-widest bg-cream"
                            />
                          </label>
                        </div>
                      </div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={option.isDefault || false}
                          onChange={(e) => {
                            setConfig({
                              ...config,
                              options: colorOptions.map((opt) =>
                                opt.id === option.id
                                  ? { ...opt, isDefault: e.target.checked }
                                  : { ...opt, isDefault: false }
                              ),
                              defaultOptionId: e.target.checked ? option.id : undefined,
                            });
                          }}
                          className="w-4 h-4"
                        />
                        <span className="font-mono text-xs uppercase tracking-widest">Default</span>
                      </label>
                      <button
                        onClick={() => {
                          setConfig({
                            ...config,
                            options: colorOptions.filter((opt) => opt.id !== option.id),
                          });
                        }}
                        className="font-mono text-[10px] uppercase tracking-widest underline underline-offset-4 hover:text-accent"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => {
                    const newOption = {
                      id: `color-${Date.now()}`,
                      name: 'Color',
                      color: '#000000',
                      price: 0,
                      isDefault: colorOptions.length === 0,
                    };
                    setConfig({
                      ...config,
                      options: [...colorOptions, newOption],
                    });
                  }}
                  className="border border-charcoal/40 border-dashed px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-charcoal hover:text-cream transition-colors w-full"
                >
                  + Add another color
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-charcoal/20">
              <button
                onClick={onClose}
                className="border border-charcoal px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-charcoal hover:text-cream transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="border border-charcoal px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest bg-charcoal text-cream hover:bg-charcoal/90 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Finish Capability
  if (capability.type === 'finish') {
    const finishOptions = (config.options as any[]) || [];

    return (
      <div className="fixed inset-0 z-50 bg-charcoal/40 flex items-center justify-center p-6">
        <div className="bg-cream border border-charcoal rounded-[20px] p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-xl">{part?.name || 'Part'} &gt; FINISH</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-charcoal flex items-center justify-center hover:bg-charcoal hover:text-cream transition-colors"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] mb-3">FINISH OPTIONS</div>
              <div className="space-y-3">
                {finishOptions.map((option) => (
                  <div key={option.id} className="border border-charcoal rounded-[12px] p-4 bg-cream/60">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={option.name || 'Finish'}
                          onChange={(e) => {
                            setConfig({
                              ...config,
                              options: finishOptions.map((opt) =>
                                opt.id === option.id ? { ...opt, name: e.target.value } : opt
                              ),
                            });
                          }}
                          placeholder="Finish name (e.g., Matte, Glossy, Satin)"
                          className="w-full border border-charcoal rounded-full px-3 py-1 font-mono text-xs uppercase tracking-widest bg-cream mb-2"
                        />
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`finish-price-${option.id}`}
                              checked={option.price === 0}
                              onChange={() => {
                                setConfig({
                                  ...config,
                                  options: finishOptions.map((opt) =>
                                    opt.id === option.id ? { ...opt, price: 0 } : opt
                                  ),
                                });
                              }}
                            />
                            <span className="font-mono text-xs uppercase tracking-widest">Included</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`finish-price-${option.id}`}
                              checked={option.price !== 0}
                              onChange={() => {}}
                            />
                            <span className="font-mono text-xs uppercase tracking-widest">+£</span>
                            <input
                              type="number"
                              value={option.price || 0}
                              onChange={(e) => {
                                setConfig({
                                  ...config,
                                  options: finishOptions.map((opt) =>
                                    opt.id === option.id
                                      ? { ...opt, price: parseFloat(e.target.value) || 0 }
                                      : opt
                                  ),
                                });
                              }}
                              className="w-20 border border-charcoal rounded-full px-2 py-1 font-mono text-xs uppercase tracking-widest bg-cream"
                            />
                          </label>
                        </div>
                      </div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={option.isDefault || false}
                          onChange={(e) => {
                            setConfig({
                              ...config,
                              options: finishOptions.map((opt) =>
                                opt.id === option.id
                                  ? { ...opt, isDefault: e.target.checked }
                                  : { ...opt, isDefault: false }
                              ),
                              defaultOptionId: e.target.checked ? option.id : undefined,
                            });
                          }}
                          className="w-4 h-4"
                        />
                        <span className="font-mono text-xs uppercase tracking-widest">Default</span>
                      </label>
                      <button
                        onClick={() => {
                          setConfig({
                            ...config,
                            options: finishOptions.filter((opt) => opt.id !== option.id),
                          });
                        }}
                        className="font-mono text-[10px] uppercase tracking-widest underline underline-offset-4 hover:text-accent"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => {
                    const newOption = {
                      id: `finish-${Date.now()}`,
                      name: 'Finish',
                      price: 0,
                      isDefault: finishOptions.length === 0,
                    };
                    setConfig({
                      ...config,
                      options: [...finishOptions, newOption],
                    });
                  }}
                  className="border border-charcoal/40 border-dashed px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-charcoal hover:text-cream transition-colors w-full"
                >
                  + Add another finish
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-charcoal/20">
              <button
                onClick={onClose}
                className="border border-charcoal px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-charcoal hover:text-cream transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="border border-charcoal px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest bg-charcoal text-cream hover:bg-charcoal/90 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default fallback for other capability types
  return (
    <div className="fixed inset-0 z-50 bg-charcoal/40 flex items-center justify-center p-6">
      <div className="bg-cream border border-charcoal rounded-[20px] p-6 max-w-2xl w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-xl">
            {part?.name || 'Part'} &gt; {capability.type.toUpperCase()}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-charcoal flex items-center justify-center hover:bg-charcoal hover:text-cream transition-colors"
          >
            ×
          </button>
        </div>
        <p className="font-mono text-xs uppercase tracking-widest text-charcoal/60 mb-4">
          Configuration for {capability.type} capability (to be implemented)
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="border border-charcoal px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-charcoal hover:text-cream transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CapabilityConfig;

