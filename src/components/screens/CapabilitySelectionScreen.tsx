/**
 * Capability Selection Screen
 * Choose which capabilities customers can customize
 * Based on original export wizard with individual capabilities grouped by categories
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Ruler,
  Triangle,
  Layers,
  Palette,
  Type,
  Image as ImageIcon,
  PenTool,
  Stamp,
  ArrowLeftRight,
  Plus,
  HelpCircle,
} from 'lucide-react';
import { useCanvasStore } from '../../stores/canvasStore';
import StandardLayout, { StandardButton, FooterInfoItem } from '../layout/StandardLayout';
import {
  CapabilityConfigFooterActions,
  CapabilityConfigHeaderContent,
  CapabilityConfigPanel,
} from './CapabilityConfigCard';
import type { Part } from '../../types/parts';
import {
  CAPABILITY_CATEGORIES,
  CAPABILITY_DEFINITIONS,
  INITIAL_CAPABILITY_CONFIG,
  getCapabilitiesByCategory,
  getDefaultExports,
  type CapabilityConfiguration,
  type CapabilityDefinition,
  type CapabilityId,
  type PartDefinition,
} from '../../types/merchant-wizard';

interface CapabilitySelectionScreenProps {
  onNext: () => void;
  onBack: () => void;
}

const CAPABILITY_ICONS: Record<CapabilityId, React.ReactNode> = {
  size: <Ruler size={20} />,
  shape: <Triangle size={20} />,
  material: <Layers size={20} />,
  color: <Palette size={20} />,
  text: <Type size={20} />,
  print: <ImageIcon size={20} />,
  engraving: <PenTool size={20} />,
  embossing: <Stamp size={20} />,
  swap_parts: <ArrowLeftRight size={20} />,
  add_accessories: <Plus size={20} />,
};

const CapabilitySelectionScreen: React.FC<CapabilitySelectionScreenProps> = ({
  onNext,
  onBack,
}) => {
  const { parts, selectedCapabilities, setSelectedCapabilities } = useCanvasStore();
  const [expandedCapability, setExpandedCapability] = useState<CapabilityId | null>(null);
  const [configurations, setConfigurations] = useState<Record<CapabilityId, CapabilityConfiguration>>(
    {} as Record<CapabilityId, CapabilityConfiguration>
  );
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(media.matches);
    update();
    if ('addEventListener' in media) {
      media.addEventListener('change', update);
      return () => media.removeEventListener('change', update);
    }
    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  const partsForConfig = useMemo<PartDefinition[]>(() => {
    const roleMap: Record<Part['role'], PartDefinition['role']> = {
      main: 'base',
      swappable: 'swappable',
      'add-on': 'add-on',
      optional: 'add-on',
      decorative: 'add-on',
    };
    return parts.map((part) => ({
      id: part.id,
      name: part.name,
      mesh_index: part.meshIndex,
      role: roleMap[part.role] || 'base',
      parent_id: part.parentId,
    }));
  }, [parts]);

  const setCapabilityEnabled = (capabilityId: CapabilityId, enabled: boolean) => {
    setSelectedCapabilities({
      ...selectedCapabilities,
      [capabilityId]: { enabled },
    });
  };

  const buildInitialConfig = (capabilityId: CapabilityId, capability: CapabilityDefinition): CapabilityConfiguration => {
    return {
      ...INITIAL_CAPABILITY_CONFIG,
      capability_id: capabilityId,
      applies_to_parts: partsForConfig.map((part) => part.id),
      export_formats: getDefaultExports(capabilityId),
      options: [],
      text_options: capability.supports_text_config
        ? {
            max_characters: 3,
            fonts: [],
            block_profanity: true,
            uppercase_only: false,
          }
        : undefined,
    };
  };

  const handleChipClick = (capabilityId: CapabilityId) => {
    const capability = CAPABILITY_DEFINITIONS.find((cap) => cap.id === capabilityId);
    if (!capability) return;

    const isSelected = selectedCapabilities[capabilityId]?.enabled;
    if (!isSelected) {
      setCapabilityEnabled(capabilityId, true);
      setConfigurations((prev) => ({
        ...prev,
        [capabilityId]: buildInitialConfig(capabilityId, capability),
      }));
    } else if (!configurations[capabilityId]) {
      setConfigurations((prev) => ({
        ...prev,
        [capabilityId]: buildInitialConfig(capabilityId, capability),
      }));
    }
    setExpandedCapability(capabilityId);
  };

  const handleUpdateConfig = (capabilityId: CapabilityId, config: CapabilityConfiguration) => {
    setConfigurations((prev) => ({ ...prev, [capabilityId]: config }));
  };

  const handleSaveConfig = (capabilityId: CapabilityId) => {
    setConfigurations((prev) => ({
      ...prev,
      [capabilityId]: { ...prev[capabilityId], is_configured: true },
    }));
    setExpandedCapability(null);
  };

  const handleRemoveCapability = (capabilityId: CapabilityId) => {
    setCapabilityEnabled(capabilityId, false);
    setConfigurations((prev) => {
      const next = { ...prev };
      delete next[capabilityId];
      return next;
    });
    setExpandedCapability(null);
  };

  const selectedCount = Object.values(selectedCapabilities).filter((c) => c.enabled).length;
  const expandedCapDef = expandedCapability
    ? CAPABILITY_DEFINITIONS.find((cap) => cap.id === expandedCapability) || null
    : null;
  const isMobileExpanded = isMobile && !!expandedCapability && !!expandedCapDef;

  const stickyContent = isMobileExpanded ? (
    <CapabilityConfigHeaderContent
      capability={expandedCapDef!}
      onClose={() => setExpandedCapability(null)}
    />
  ) : (
    <div className="mb-2.5 text-left">
      <p className="text-mono-body text-charcoal">
        Choose which customization options customers can use for this product
      </p>
    </div>
  );

  const footerProps = isMobileExpanded
    ? {
        fullWidth: true,
        containerClassName: 'border-charcoal/10 bg-cream/30',
        contentClassName: 'p-4 sm:p-6 flex items-center justify-between gap-4',
        leftContent: (
          <CapabilityConfigFooterActions
            capability={expandedCapDef!}
            onRemove={() => handleRemoveCapability(expandedCapability!)}
            onSave={() => handleSaveConfig(expandedCapability!)}
          />
        ),
      }
    : {
        leftContent: (
          <FooterInfoItem label="SAVED" value={`${selectedCount} capabilities`} />
        ),
        rightContent: (
          <>
            <StandardButton variant="secondary">
              SAVE DRAFT
            </StandardButton>
            <StandardButton
              onClick={onNext}
              disabled={selectedCount === 0}
            >
              CONTINUE
              <span>→</span>
            </StandardButton>
          </>
        ),
      };

  return (
    <>
      <StandardLayout
        header={{
          title: 'Select Capabilities',
          showBack: true,
          onBack: onBack,
        }}
        footer={footerProps}
        stickyContent={stickyContent}
        contentScroll="none"
      >
        <div className="flex-1 min-h-0 flex flex-col md:flex-row">
          <div className="min-h-0 flex-1 p-6 sm:p-8 md:p-10 md:pr-6 md:flex-[0_0_50%] md:max-w-none overflow-y-auto scroll-smooth">
            {isMobileExpanded && expandedCapDef && expandedCapability ? (
              <CapabilityConfigPanel
                embedded
                capability={expandedCapDef}
                parts={partsForConfig}
                config={configurations[expandedCapability] || INITIAL_CAPABILITY_CONFIG}
                onUpdate={(config) => handleUpdateConfig(expandedCapability, config)}
                onSave={() => handleSaveConfig(expandedCapability)}
                onRemove={() => handleRemoveCapability(expandedCapability)}
                onClose={() => setExpandedCapability(null)}
              />
            ) : (
              CAPABILITY_CATEGORIES.map((category) => {
                const capabilities = getCapabilitiesByCategory(category.id);
                return (
                  <div key={category.id} className="mb-8">
                    <h3 className="font-mono text-[10px] uppercase tracking-widest text-charcoal/40 mb-3">
                      {category.label.toUpperCase()}
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        {capabilities.map((capability) => {
                          const isSelected = selectedCapabilities[capability.id]?.enabled || false;
                          return (
                            <button
                              key={capability.id}
                              onClick={() => handleChipClick(capability.id)}
                              className={`group relative border border-charcoal rounded-[12px] p-4 text-left transition-all h-[96px] w-full flex flex-col ${
                                isSelected
                                  ? 'bg-charcoal text-cream border-charcoal'
                                  : 'bg-cream border-charcoal/60 hover:border-charcoal hover:bg-desk'
                              }`}
                            >
                              <div className="space-y-2">
                                <div className={`${isSelected ? 'text-cream' : 'text-charcoal'}`}>
                                  {CAPABILITY_ICONS[capability.id]}
                                </div>

                                <div className="flex items-center gap-2">
                                  <h3 className="font-mono text-[10px] uppercase tracking-widest">
                                    {capability.label.toUpperCase()}
                                  </h3>
                                  <HelpCircle
                                    size={12}
                                    className={`${isSelected ? 'text-cream/60' : 'text-charcoal/40'}`}
                                  />
                                </div>
                              </div>

                              <p
                                className={`mt-auto font-mono text-[8px] uppercase tracking-widest leading-snug line-clamp-2 min-h-[32px] ${
                                  isSelected ? 'text-cream/80' : 'text-charcoal/50'
                                }`}
                              >
                                {capability.description}
                              </p>

                              {isSelected && (
                                <div className="absolute top-2 right-2">
                                  <div className="w-4 h-4 bg-cream rounded-full flex items-center justify-center">
                                    <span className="text-charcoal text-[10px]">✓</span>
                                  </div>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="hidden md:flex md:flex-[0_0_50%] min-h-0 border-l border-charcoal/10 bg-cream/30">
            <div className="w-full min-h-0 p-6 lg:p-8 flex flex-col">
              {expandedCapDef && expandedCapability ? (
                <div className="border border-charcoal bg-cream rounded-[12px] flex-1 min-h-0 overflow-hidden flex flex-col">
                  <CapabilityConfigPanel
                    capability={expandedCapDef}
                    parts={partsForConfig}
                    config={configurations[expandedCapability] || INITIAL_CAPABILITY_CONFIG}
                    onUpdate={(config) => handleUpdateConfig(expandedCapability, config)}
                    onSave={() => handleSaveConfig(expandedCapability)}
                    onRemove={() => handleRemoveCapability(expandedCapability)}
                    onClose={() => setExpandedCapability(null)}
                  />
                </div>
              ) : (
                <div className="border border-charcoal/10 bg-cream/50 p-6 flex-1 min-h-0">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-charcoal/40 mb-2">
                    Configure
                  </p>
                  <p className="font-mono text-[11px] text-charcoal/60 leading-relaxed">
                    Select a capability on the left to configure it here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </StandardLayout>

    </>
  );
};

export default CapabilitySelectionScreen;
