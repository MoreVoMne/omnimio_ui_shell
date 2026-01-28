import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ConfigurationState, PartId } from '../types';

type HotspotPart = Extract<PartId, 'handle' | 'body' | 'clasp'>;

interface RadialOption {
  id: string;
  label: string;
  value: string;
  swatch?: string;
}

interface RadialSegment {
  id: string;
  label: string;
  type: 'options' | 'details';
  configKey?: keyof ConfigurationState;
  options?: RadialOption[];
  stepId: string;
}

interface HotspotRadialProps {
  part: HotspotPart;
  anchor: { x: number; y: number };
  configuration: ConfigurationState;
  isMobile?: boolean;
  onClose: () => void;
  onApply: (payload: {
    part: HotspotPart;
    key: keyof ConfigurationState;
    value: string;
    stepId: string;
  }) => void;
  onOpenDetails: (payload: { part: HotspotPart; stepId: string }) => void;
}

const RADIAL_SEGMENTS: Record<HotspotPart, RadialSegment[]> = {
  handle: [
    {
      id: 'color',
      label: 'COLOR',
      type: 'options',
      configKey: 'handlePrint',
      stepId: 'handlePrint',
      options: [
        { id: 'solid', label: 'Solid', value: 'none', swatch: '#2C2C2C' },
        { id: 'camo', label: 'Camo', value: 'camo', swatch: '#6b6b4f' },
      ],
    },
    {
      id: 'details',
      label: 'DETAILS',
      type: 'details',
      stepId: 'handleMaterial',
    },
    {
      id: 'material',
      label: 'MATERIAL',
      type: 'options',
      configKey: 'handleConfig',
      stepId: 'handleConfig',
      options: [
        { id: 'single', label: 'Single Strap', value: 'single' },
        { id: 'double', label: 'Double Strap', value: 'double' },
      ],
    },
    {
      id: 'style',
      label: 'STYLE',
      type: 'options',
      configKey: 'handleMaterial',
      stepId: 'handleMaterial',
      options: [
        { id: 'same', label: 'Match Body', value: 'same' },
        { id: 'contrast', label: 'Contrast', value: 'contrast' },
        { id: 'chain', label: 'Chain', value: 'chain' },
      ],
    },
  ],
  body: [
    {
      id: 'color',
      label: 'COLOR',
      type: 'options',
      configKey: 'surfaceTexture',
      stepId: 'surfaceTexture',
      options: [
        { id: 'pebbled', label: 'Pebbled Bisque', value: 'pebbled', swatch: '#EFECE4' },
        { id: 'smooth', label: 'Smooth Latte', value: 'smooth', swatch: '#D0C5B8' },
      ],
    },
    {
      id: 'details',
      label: 'DETAILS',
      type: 'details',
      stepId: 'surfaceTreatment',
    },
    {
      id: 'material',
      label: 'MATERIAL',
      type: 'options',
      configKey: 'surfaceTreatment',
      stepId: 'surfaceTreatment',
      options: [
        { id: 'natural', label: 'Natural Matte', value: 'natural' },
        { id: 'waxed', label: 'Waxed', value: 'waxed' },
      ],
    },
    {
      id: 'finish',
      label: 'FINISH',
      type: 'options',
      configKey: 'surfacePrint',
      stepId: 'surfacePrint',
      options: [
        { id: 'none', label: 'No Print', value: 'none' },
        { id: 'pattern', label: 'Pattern', value: 'pattern' },
        { id: 'monogram', label: 'Monogram', value: 'monogram' },
      ],
    },
  ],
  clasp: [
    {
      id: 'color',
      label: 'COLOR',
      type: 'options',
      configKey: 'surfaceHardware',
      stepId: 'surfaceHardware',
      options: [
        { id: 'gold', label: 'Gold', value: 'gold', swatch: '#D4AF37' },
        { id: 'silver', label: 'Silver', value: 'silver', swatch: '#C0C0C0' },
      ],
    },
    {
      id: 'details',
      label: 'DETAILS',
      type: 'details',
      stepId: 'claspType',
    },
    {
      id: 'material',
      label: 'MATERIAL',
      type: 'options',
      configKey: 'claspFinish',
      stepId: 'claspFinish',
      options: [
        { id: 'polished', label: 'Polished', value: 'polished' },
        { id: 'brushed', label: 'Brushed', value: 'brushed' },
        { id: 'matte', label: 'Matte', value: 'matte' },
      ],
    },
    {
      id: 'style',
      label: 'STYLE',
      type: 'options',
      configKey: 'claspType',
      stepId: 'claspType',
      options: [
        { id: 'magnetic', label: 'Magnetic', value: 'magnetic' },
        { id: 'turnlock', label: 'Turn Lock', value: 'turnlock' },
        { id: 'zipper', label: 'Zipper', value: 'zipper' },
      ],
    },
  ],
};

export const HotspotRadial: React.FC<HotspotRadialProps> = ({
  part,
  anchor,
  configuration,
  isMobile = false,
  onClose,
  onApply,
  onOpenDetails,
}) => {
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const radius = isMobile ? 120 : 90;
  const centerSize = isMobile ? 18 : 12;

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const segments = RADIAL_SEGMENTS[part];
  const activeSegmentData = useMemo(
    () => segments.find((segment) => segment.id === activeSegment),
    [activeSegment, segments]
  );

  const positionForIndex = (index: number) => {
    const points = [
      { x: 0, y: -radius },
      { x: radius, y: 0 },
      { x: 0, y: radius },
      { x: -radius, y: 0 },
    ];
    return points[index] || points[0];
  };

  const handleSegmentClick = (segment: RadialSegment) => {
    if (segment.type === 'details') {
      onOpenDetails({ part, stepId: segment.stepId });
      onClose();
      return;
    }
    if (!segment.options || !segment.configKey) {
      return;
    }
    setActiveSegment((prev) => (prev === segment.id ? null : segment.id));
  };

  const handleOptionSelect = (segment: RadialSegment, option: RadialOption) => {
    if (!segment.configKey) return;
    onApply({ part, key: segment.configKey, value: option.value, stepId: segment.stepId });
    setActiveSegment(null);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
      >
        <motion.div
          className="absolute"
          style={{ left: anchor.x, top: anchor.y, transform: 'translate(-50%, -50%)' }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="relative flex items-center justify-center"
            style={{ width: radius * 2.2, height: radius * 2.2 }}
          >
            <span
              className="absolute rounded-full border border-charcoal bg-cream shadow-lg"
              style={{ width: centerSize, height: centerSize }}
            />
            {segments.map((segment, index) => {
              const pos = positionForIndex(index);
              const isActive = activeSegment === segment.id;
              return (
                <button
                  key={segment.id}
                  className={`absolute w-20 h-20 rounded-full border bg-white/90 backdrop-blur-sm text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal transition-all ${
                    isActive ? 'border-charcoal shadow-md' : 'border-charcoal/40 hover:border-charcoal'
                  }`}
                  style={{
                    transform: `translate(${pos.x}px, ${pos.y}px)`,
                  }}
                  onClick={() => handleSegmentClick(segment)}
                >
                  {segment.label}
                </button>
              );
            })}

            {activeSegmentData && activeSegmentData.options && activeSegmentData.configKey && (
              <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 min-w-[220px] rounded-full border border-charcoal/20 bg-white/95 px-4 py-2 shadow-lg flex items-center justify-center gap-2">
                {activeSegmentData.options.map((option) => {
                  const isSelected =
                    configuration[activeSegmentData.configKey as keyof ConfigurationState] === option.value;
                  return (
                    <button
                      key={option.id}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] uppercase tracking-widest transition-all ${
                        isSelected
                          ? 'border-charcoal bg-charcoal text-cream'
                          : 'border-charcoal/20 text-charcoal hover:border-charcoal/50'
                      }`}
                      onClick={() => handleOptionSelect(activeSegmentData, option)}
                    >
                      {option.swatch && (
                        <span
                          className="block h-3 w-3 rounded-full border border-charcoal/20"
                          style={{ background: option.swatch }}
                        />
                      )}
                      {option.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default HotspotRadial;

