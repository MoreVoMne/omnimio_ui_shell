
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ConfigurationStateV2, Product, TreeNode } from '../types-tree';
import { findNodeById } from '../utils/treeHelpers';
import { OmniMode } from './OmniLayout';

// ==== TOKEN TYPES ====
interface Token {
  id: string;
  nodeId: string;
  label: string;
  value: string;
  isEditable: boolean;
  prefix?: string;
  linkedPart?: string;
}

// ==== COMPONENT PROPS ====
interface OmniSentenceProps {
  configuration: ConfigurationStateV2;
  product: Product;
  onNodeClick: (nodeIdOrSelection: string) => void;
  totalPrice: number;
  onOpenPrice: () => void;
  onLoginRequest: () => void;
  onPartHighlight?: (partId: string | null) => void;
  highlightedPart?: string | null;
  onOpenMode: (mode: OmniMode) => void;
}

// ==== HELPER: Get selected value from node ====
function getSelectedValue(node: TreeNode | null | undefined, config: ConfigurationStateV2): string {
  if (!node) return '';
  
  const selection = config.selections[node.id];
  if (selection) {
    const selectedOption = node.children?.find(c => c.id === selection.value);
    return selectedOption?.label || '';
  }
  // Return default
  const defaultOption = node.children?.find(c => c.default === true);
  return defaultOption?.label || '';
}

// ==== HELPER: Build sentence tokens ====
function buildTokensFromConfig(
  tree: TreeNode[],
  config: ConfigurationStateV2
): Token[] {
  const tokens: Token[] = [];

  // === BODY COMPONENT ===
  const bodyNode = tree.find(n => n.id === 'node-body');
  if (bodyNode) {
    const materialNode = bodyNode.children?.find(c => c.id === 'node-body-material');
    const colorNode = materialNode?.children?.find(c => c.id === 'node-body-color');
    const finishNode = materialNode?.children?.find(c => c.id === 'node-body-finish');
    const baseNode = bodyNode.children?.find(c => c.id === 'node-body-base');

    if (colorNode) {
      const colorValue = getSelectedValue(colorNode, config);
      tokens.push({
        id: 'token-color',
        nodeId: colorNode.id,
        label: 'Color',
        value: colorValue.toLowerCase() || 'natural',
        isEditable: true,
        prefix: 'in',
        linkedPart: 'mesh-body',
      });
    }

    if (finishNode) {
      const finishValue = getSelectedValue(finishNode, config);
      if (finishValue && finishValue.toLowerCase() !== 'natural') {
        tokens.push({
          id: 'token-finish',
          nodeId: finishNode.id,
          label: 'Finish',
          value: finishValue.toLowerCase(),
          isEditable: true,
          linkedPart: 'mesh-body',
        });
      }
    }

    if (materialNode) {
      const materialValue = getSelectedValue(materialNode, config);
      tokens.push({
        id: 'token-material',
        nodeId: materialNode.id,
        label: 'Material',
        value: materialValue.toLowerCase() || 'leather',
        isEditable: true,
        linkedPart: 'mesh-body',
      });
    }

    if (baseNode) {
      const baseValue = getSelectedValue(baseNode, config);
      if (baseValue && baseValue.toLowerCase() !== 'standard') {
        tokens.push({
          id: 'token-base',
          nodeId: baseNode.id,
          label: 'Base',
          value: `${baseValue.toLowerCase()} base`,
          isEditable: true,
          prefix: 'with',
          linkedPart: 'mesh-body',
        });
      }
    }
  }

  // === CLASP ===
  const claspNode = tree.find(n => n.id === 'node-clasp');
  if (claspNode) {
    const typeNode = claspNode.children?.find(c => c.id === 'node-clasp-type');
    const finishNode = typeNode?.children?.find(c => c.id === 'node-clasp-finish');

    if (typeNode) {
      const typeValue = getSelectedValue(typeNode, config);
      tokens.push({
        id: 'token-clasp-type',
        nodeId: typeNode.id,
        label: 'Clasp Type',
        value: `${typeValue.toLowerCase()} clasp`,
        isEditable: true,
        prefix: 'and',
        linkedPart: 'mesh-clasp',
      });
    }

    if (finishNode) {
      const finishValue = getSelectedValue(finishNode, config);
      tokens.push({
        id: 'token-clasp-finish',
        nodeId: finishNode.id,
        label: 'Clasp Finish',
        value: `${finishValue.toLowerCase()} finish`,
        isEditable: true,
        prefix: 'with',
        linkedPart: 'mesh-clasp',
      });
    }
  }

  // === HANDLE ===
  const handleNode = tree.find(n => n.id === 'node-handle');
  if (handleNode) {
    const styleNode = handleNode.children?.find(c => c.id === 'node-handle-style');
    const lengthNode = styleNode?.children?.find(c => c.id === 'node-handle-length');
    const configNode = styleNode?.children?.find(c => c.id === 'node-handle-config');

    if (styleNode) {
      const styleValue = getSelectedValue(styleNode, config);
      const styleName = styleValue.toLowerCase()
        .replace('match body', 'matching leather')
        .replace('contrast leather', 'contrast leather');
      
      tokens.push({
        id: 'token-handle-style',
        nodeId: styleNode.id,
        label: 'Handle Style',
        value: styleName || 'leather',
        isEditable: true,
        prefix: 'and',
        linkedPart: 'mesh-handle',
      });
    }

    if (lengthNode) {
      const lengthValue = getSelectedValue(lengthNode, config);
      tokens.push({
        id: 'token-handle-length',
        nodeId: lengthNode.id,
        label: 'Handle Length',
        value: `${lengthValue.toLowerCase()} length` || 'standard length',
        isEditable: true,
        linkedPart: 'mesh-handle',
      });
    }

    if (configNode) {
      const configValue = getSelectedValue(configNode, config);
      tokens.push({
        id: 'token-handle-config',
        nodeId: configNode.id,
        label: 'Handle Config',
        value: configValue.toLowerCase() === 'double' ? 'double strap' : 'single strap',
        isEditable: true,
        linkedPart: 'mesh-handle',
      });
    }
  }

  // === PERSONALIZATION ===
  const personalizationNode = tree.find(n => n.id === 'node-personalization');
  if (personalizationNode) {
    const monogramNode = personalizationNode.children?.find(c => c.id === 'node-monogram');
    const hasArtwork = config.customizations.images && config.customizations.images.length > 0;

    if (monogramNode) {
      const monogramValue = getSelectedValue(monogramNode, config);
      const displayValue = !monogramValue || monogramValue.toLowerCase() === 'none' 
        ? 'no monogram' 
        : monogramValue.toLowerCase();
        
      tokens.push({
        id: 'token-monogram',
        nodeId: monogramNode.id,
        label: 'Monogram',
        value: displayValue,
        isEditable: true,
        prefix: '—',
        linkedPart: 'mesh-body',
      });
    }

    if (!hasArtwork) {
      tokens.push({
        id: 'token-artwork',
        nodeId: 'action-add-print',
        label: 'Artwork',
        value: 'no artwork',
        isEditable: true,
        linkedPart: 'mesh-body',
      });
    }
  }

  return tokens;
}

// ==== MAIN COMPONENT ====
export const OmniSentence: React.FC<OmniSentenceProps> = ({
  configuration,
  product,
  onNodeClick,
  totalPrice,
  onOpenPrice,
  onLoginRequest,
  onPartHighlight,
  highlightedPart,
  onOpenMode,
}) => {
  const [expandedTokenId, setExpandedTokenId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const selectedOptionRef = useRef<HTMLButtonElement | null>(null);
  const openPanelRef = useRef<HTMLDivElement | null>(null);
  const [inlineMeasured, setInlineMeasured] = useState(false); // Track if initial measurement is done
  const [inlineHasOverflow, setInlineHasOverflow] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const tokens = useMemo(
    () => buildTokensFromConfig(product.customizationTree, configuration),
    [product.customizationTree, configuration]
  );

  // Close on click outside the OPEN inliner panel (token clicks are handled by token buttons)
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!expandedTokenId) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Clicking a token should toggle via its own handler (don't treat as outside click)
      if (target.closest('.spec-token')) return;

      // Clicking inside the open panel should not close it
      // Check both by ref and by class for robustness during re-renders
      if (target.closest('.inline-panel')) return;
      const panel = openPanelRef.current;
      if (panel && panel.contains(target)) return;

      setExpandedTokenId(null);
      if (onPartHighlight) onPartHighlight(null);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [expandedTokenId, onPartHighlight]);

  const smoothScrollTo = (el: HTMLElement, targetLeft: number, durationMs = 650) => {
    const startLeft = el.scrollLeft;
    const delta = targetLeft - startLeft;
    if (Math.abs(delta) < 1) return;

    const start = performance.now();
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      el.scrollLeft = startLeft + delta * easeOutCubic(t);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const getOverflowPx = (el: HTMLElement) => {
    // Use ceil to avoid 1px fractional overflow creating micro-scroll.
    const sw = Math.ceil(el.scrollWidth);
    const cw = Math.ceil(el.clientWidth);
    return sw - cw;
  };

  const updateInlineScrollState = (forceStateUpdate = false) => {
    const container = scrollRef.current;
    if (!container) return;
    const overflowPx = getOverflowPx(container);
    // Tolerance: treat tiny "overflow" as fit to avoid touch nudge.
    const hasOverflow = overflowPx > 8;

    // Mark measurement as complete on first forced update
    if (forceStateUpdate && !inlineMeasured) {
      setInlineMeasured(true);
    }

    // Only update React state on initial measurement or when overflow status changes
    // This prevents re-renders during scroll
    if (forceStateUpdate || hasOverflow !== inlineHasOverflow) {
      setInlineHasOverflow(hasOverflow);
    }

    // Update arrow states only when they change
    const newCanScrollLeft = hasOverflow && container.scrollLeft > 2;
    const newCanScrollRight = hasOverflow && container.scrollLeft < overflowPx - 2;
    if (newCanScrollLeft !== canScrollLeft) setCanScrollLeft(newCanScrollLeft);
    if (newCanScrollRight !== canScrollRight) setCanScrollRight(newCanScrollRight);

    container.classList.toggle('inline-fits', !hasOverflow);
    if (!hasOverflow) container.scrollLeft = 0;
  };

  const nudgeInlineScroll = (dir: -1 | 1) => {
    const container = scrollRef.current;
    if (!container) return;
    const overflowPx = getOverflowPx(container);
    if (overflowPx <= 8) return;
    const maxLeft = Math.max(0, overflowPx);
    const amount = Math.round(container.clientWidth * 0.75) * dir;
    const target = Math.max(0, Math.min(maxLeft, container.scrollLeft + amount));
    smoothScrollTo(container, target, 520);
  };

  // When a panel opens, center the selected option in the horizontal scroller
  // Only runs when expandedTokenId changes (panel opens), NOT on every selection
  useEffect(() => {
    // Reset measurement state when panel changes
    setInlineMeasured(false);
    if (!expandedTokenId) return;
    // Wait for Framer Motion animation to complete (250ms) before measuring
    const timer = setTimeout(() => {
      const container = scrollRef.current;
      const selected = selectedOptionRef.current;
      if (!container || !selected) return;

      updateInlineScrollState(true); // Force state update on panel open
      const overflowPx = getOverflowPx(container);
      const hasOverflow = overflowPx > 8;
      if (!hasOverflow) return;

      const containerRect = container.getBoundingClientRect();
      const selectedRect = selected.getBoundingClientRect();

      // center selected within the scroll container
      const selectedCenter = (selectedRect.left - containerRect.left) + selectedRect.width / 2;
      const targetLeft = container.scrollLeft + (selectedCenter - containerRect.width / 2);

      const maxLeft = overflowPx;
      const clamped = Math.max(0, Math.min(maxLeft, targetLeft));
      smoothScrollTo(container, clamped, 700);
    }, 280);
    return () => clearTimeout(timer);
  }, [expandedTokenId]); // Only center when panel opens, not on every selection

  // Keep overflow + arrow state in sync with scroll/resize while a panel is open.
  // NOTE: Initial measurement is handled by the centering effect above - no duplicate here
  useEffect(() => {
    if (!expandedTokenId) return;
    const container = scrollRef.current;
    if (!container) return;

    const onScroll = () => {
      // If it fits, hard-lock to 0 (prevents touch micro-movement).
      const overflowPx = getOverflowPx(container);
      const hasOverflow = overflowPx > 8;
      if (!hasOverflow && container.scrollLeft !== 0) container.scrollLeft = 0;
      updateInlineScrollState();
    };

    const onResize = () => updateInlineScrollState();
    container.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      container.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [expandedTokenId]);

  const handleTokenClick = (token: Token) => {
    setExpandedTokenId(prev => (prev === token.id ? null : token.id));
    if (onPartHighlight) {
      if (expandedTokenId === token.id) onPartHighlight(null);
      else onPartHighlight(token.linkedPart || null);
    }
  };

  const handleOptionSelect = (nodeId: string, optionId: string) => {
    onNodeClick(`${nodeId}:${optionId}`);
    // Stay open (Accordion behavior)
  };

  const getSwatchColor = (label: string): string | null => {
    const l = label.toLowerCase();
    if (l.includes('black')) return '#2C2C2C';
    if (l.includes('navy')) return '#1A2B4A';
    if (l.includes('emerald')) return '#2F6B4F';
    if (l.includes('oxblood')) return '#4A1F2A';
    if (l.includes('cognac')) return '#B06A3B';
    if (l.includes('chocolate')) return '#4B2E2A';
    if (l.includes('taupe')) return '#9B8B7A';
    if (l.includes('stone')) return '#C9C2B8';
    if (l.includes('olive')) return '#556B2F';
    if (l.includes('saffron')) return '#C79B2B';
    if (l.includes('blush')) return '#D9A3A8';
    if (l.includes('plum')) return '#5A2A55';
    if (l.includes('cloud')) return '#E7E7E7';
    if (l.includes('silver')) return '#C0C0C0';
    if (l.includes('gold') || l.includes('brass') || l.includes('polished')) return '#D4AF37';
    if (l.includes('natural')) return '#E8DFD0';
    if (l.includes('waxed')) return '#C4B8A8';
    if (l.includes('patent')) return '#3A3A3A';
    if (l.includes('suede')) return '#A89080';
    if (l.includes('smooth')) return '#D5C9BC';
    if (l.includes('pebbled')) return '#E2D8CC';
    return null;
  };

  const materialTokens = tokens.filter(t => ['token-color', 'token-finish', 'token-material'].includes(t.id));
  const claspTokens = tokens.filter(t => ['token-clasp-type', 'token-clasp-finish', 'token-base'].includes(t.id));
  const handleTokens = tokens.filter(t => t.id.startsWith('token-handle'));
  const personalTokens = tokens.filter(t => ['token-monogram', 'token-artwork'].includes(t.id));

  const renderToken = (token: Token, showPrefix = true, suffixPunct?: string) => {
    const isExpanded = expandedTokenId === token.id;
    const node = findNodeById(product.customizationTree, token.nodeId);
    const options = node?.children?.filter(c => c.type === 'option') || [];
    const panelId = `inline-panel-${token.id}`;

    return (
      <React.Fragment key={token.id}>
        <span className="sentence-glue">
          {showPrefix && token.prefix ? <span className="spec-prefix">{token.prefix}{'\u00A0'}</span> : null}
          <button
            className={`spec-token ${isExpanded ? 'active' : ''} ${highlightedPart === token.linkedPart ? 'highlighted' : ''}`}
            onClick={() => handleTokenClick(token)}
            aria-expanded={isExpanded}
            aria-controls={panelId}
          >
            {token.value}
          </button>
          {suffixPunct ? <span className="token-punct">{suffixPunct}</span> : null}
        </span>

        {/* Inline panel (Accordion behavior) */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              className={`inline-panel ${inlineMeasured && !inlineHasOverflow ? 'fits' : 'has-overflow'}`}
              id={panelId}
              role="region"
              aria-label={`${token.label} options`}
              ref={(el) => {
                openPanelRef.current = el as HTMLDivElement | null;
              }}
              initial={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: '0.75rem', marginBottom: '0.75rem' }}
              exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className={`inline-frame ${inlineHasOverflow ? 'has-overflow' : 'fits'}`}>
                <button
                  type="button"
                  className="inline-close-x"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedTokenId(null);
                    if (onPartHighlight) onPartHighlight(null);
                  }}
                  aria-label="Close options"
                >
                  ×
                </button>
                {inlineHasOverflow ? (
                  <>
                    <button
                      type="button"
                      className="inline-arrow inline-arrow-left"
                      onClick={(e) => {
                        e.stopPropagation();
                        nudgeInlineScroll(-1);
                      }}
                      aria-label="Scroll left"
                      disabled={!canScrollLeft}
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className="inline-arrow inline-arrow-right"
                      onClick={(e) => {
                        e.stopPropagation();
                        nudgeInlineScroll(1);
                      }}
                      aria-label="Scroll right"
                      disabled={!canScrollRight}
                    >
                      ›
                    </button>
                  </>
                ) : null}
                <div className="inline-panel-inner" data-inline-title={token.label}>
                  <div
                    className={`inline-scroll ${inlineMeasured && !inlineHasOverflow ? 'inline-fits' : ''}`}
                    ref={(el) => {
                      scrollRef.current = el;
                    }}
                  >
                    <div className="inline-track">
                      {options.map(option => {
                        const selected =
                          configuration.selections[token.nodeId]?.value === option.id ||
                          (!configuration.selections[token.nodeId] && option.default === true);
                        const swatch = getSwatchColor(option.label) || '#EDE7DD';
                        const priceModifier = option.priceModifier ?? 0;
                        const priceLabel = `${priceModifier >= 0 ? '+' : '-'}${Math.abs(priceModifier)}`;

                        return (
                          <button
                            key={option.id}
                            className={`inline-item ${selected ? 'selected' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOptionSelect(token.nodeId, option.id);
                            }}
                            ref={(el) => {
                              if (selected) selectedOptionRef.current = el;
                            }}
                            aria-pressed={selected}
                          >
                            <div className="inline-swatch-frame">
                              <div className="inline-swatch" style={{ background: swatch }} />
                            </div>
                            <div className="inline-caption-row">
                              <span className="inline-label">{option.label}</span>
                              <span className="inline-price" aria-label={`Price modifier ${priceLabel}`}>
                                {priceLabel}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </React.Fragment>
    );
  };

  return (
    <>
      <style>{`
        .omni-sentence-rail {
          /* Gradient fade for the bottom area */
          background: linear-gradient(
            to top,
            rgba(248, 245, 240, 1) 0%,
            rgba(248, 245, 240, 1) 40%,
            rgba(248, 245, 240, 0.95) 60%,
            rgba(248, 245, 240, 0.8) 75%,
            rgba(248, 245, 240, 0) 100%
          );
          padding: clamp(2rem, 6vh, 3rem) clamp(1rem, 4vw, 1.25rem) clamp(1rem, 3vh, 1.5rem);
          pointer-events: auto;
          width: 100%;
          display: flex;
          justify-content: center;
        }

        .omni-sentence-inner {
          /* Width contract:
             - mobile (portrait + landscape): no width boundaries
             - desktop: 50% viewport width
          */
          width: 100%;
          max-width: 100%;
          background: transparent;
          border: none;
          display: flex;
          flex-direction: column;
        }

        /* Desktop */
        @media (min-width: 1024px) {
          .omni-sentence-inner {
            width: 80%;
            max-width: 80%;
          }
        }

        .omni-sentence-text {
          --sentence-pad-x: clamp(0.75rem, 3vw, 1rem);
          font-family: 'PP Editorial Old', serif;
          font-feature-settings: "liga" 1, "dlig" 1, "calt" 1, "swsh" 1, "salt" 1;
          font-variant-ligatures: common-ligatures discretionary-ligatures contextual;
          font-size: clamp(1.1rem, 3.2vw, 1.6rem);
          font-weight: 300;
          line-height: 1.45;
          color: #1a1a1a;
          letter-spacing: 0.02em;
          padding: clamp(1rem, 3vw, 1.5rem) var(--sentence-pad-x) 0.5rem;
          margin-bottom: 0;
          text-align: center;
          text-wrap: balance;
          hanging-punctuation: first last;
          font-style: normal;
        }

        /* Note: overflow: hidden removed - panel now uses viewport-based width */

        .spec-token {
          display: inline;
          background: transparent;
          text-decoration-line: underline;
          text-decoration-thickness: 0.5px;
          text-decoration-color: #1a1a1a;
          text-underline-offset: 0.08em;
          text-decoration-skip-ink: auto;
          padding: 0 0.1em;
          margin: 0 0.1em;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          font-family: inherit;
          font-size: inherit;
          font-weight: 400;
          color: #1a1a1a;
          font-style: italic;
        }

        .spec-token:hover, .spec-token.active {
          background: #1a1a1a;
          color: #F8F5F0;
          border-radius: 2px;
        }
        
        .spec-token:active {
          transform: scale(0.98);
        }

        .spec-prefix, .token-separator {
          color: #1a1a1a;
        }

        .token-punct {
          /* keep comma attached to the token, but allow wrapping after it (space is outside) */
        }
        
        .product-name {
          font-style: normal;
          font-weight: inherit;
        }

        /* --- PRICE BLOCK (Between sentence and buttons) --- */
        .omni-price-block-wrapper {
          display: flex;
          justify-content: center;
          margin: 1rem auto 1.25rem auto;
          padding: 0 1rem;
          box-sizing: border-box;
        }
        
        .omni-price-block {
          position: relative;
          display: inline-flex;
          align-items: baseline;
        }
        
        .omni-price-block .footer-price {
          font-family: 'PP Editorial Old', serif;
          font-feature-settings: "liga" 1, "dlig" 1, "calt" 1, "swsh" 1, "salt" 1;
          font-size: clamp(1.68rem, 4.8vw, 2.4rem);
          font-weight: 300;
          letter-spacing: -0.03em;
          white-space: nowrap;
        }
        
        .omni-price-block .price-info-circle {
          position: absolute;
          left: 100%;
          top: 0;
          margin-left: 0.4rem;
          width: clamp(0.9rem, 2.5vw, 1rem);
          height: clamp(0.9rem, 2.5vw, 1rem);
          border: 1px solid #C20000;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: clamp(8px, 2vw, 9px);
          font-family: 'JetBrains Mono', monospace;
          color: #C20000;
          transition: all 0.2s;
        }
        
        .omni-price-block:hover .price-info-circle {
          background: #C20000;
          color: #F8F5F0;
        }
        
        /* --- SPLIT BLOCK FOOTER (Spec Sheet Style) --- */
        .omni-footer-simple {
          display: flex;
          width: 100%;
          border-top: none;
          margin: 0;
          margin-top: 0rem;
          padding: 0 1rem;
          box-sizing: border-box;
        }
        
        /* Desktop: Narrower buttons */
        @media (min-width: 640px) {
          .omni-footer-simple {
            max-width: 720px;
            margin-left: auto;
            margin-right: auto;
          }
        }

        .omni-footer-block {
            flex: 1 1 0;
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: baseline;
            padding: clamp(0.65rem, 2.2vw, 0.9rem) clamp(0.6rem, 2vw, 0.8rem);
            cursor: pointer;
            transition: all 0.2s;
            text-align: center;
            gap: 0.5rem;
            height: 100%;
            border: none;
            outline: none;
            margin: 0;
            min-width: 0;
            border-radius: 0;
            -webkit-appearance: none;
            appearance: none;
            box-sizing: border-box;
            white-space: nowrap;
        }
        
        .omni-footer-block.secondary {
            background: transparent;
            color: #1a1a1a;
            border: 1px solid #1a1a1a;
        }
        
        .omni-footer-block.secondary:hover {
            background: #fff;
        }
        
        .omni-footer-block.primary {
            background: #1a1a1a;
            color: #F8F5F0;
        }
        
        .omni-footer-block.primary:hover {
            background: #000;
        }
        
        .footer-label {
            font-family: 'JetBrains Mono', monospace;
            font-size: clamp(0.55rem, 1.6vw, 0.65rem);
            text-transform: uppercase;
            letter-spacing: 0.15em;
            opacity: 0.6;
        }

        .footer-price-group {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .footer-price {
            font-family: 'PP Editorial Old', serif;
            font-feature-settings: "liga" 1, "dlig" 1, "calt" 1, "swsh" 1, "salt" 1;
            font-size: clamp(1rem, 3vw, 1.2rem);
            font-style: normal;
            font-weight: 400;
            letter-spacing: 0;
            opacity: 1;
            line-height: 1;
        }

        .footer-buy {
            font-family: 'JetBrains Mono', monospace;
            font-size: clamp(0.7rem, 2vw, 0.85rem);
            text-transform: uppercase;
            font-weight: 400;
            letter-spacing: 0.05em;
        }
        
        .footer-action {
            font-family: 'JetBrains Mono', monospace;
            font-size: clamp(0.7rem, 2vw, 0.85rem);
            text-transform: uppercase;
            font-weight: 400;
            letter-spacing: 0.05em;
        }

        /* === Inline refined inliner (horizontal, two-line option stacks) === */
        .inline-panel {
          display: flex;
          justify-content: center;
          overflow: hidden;
          width: 100%;
          position: relative;
          --inline-swatch-size: 78px;
        }

        .inline-frame {
          position: relative;
          width: 100%;
          min-width: 0; /* Allow flex item to shrink below content size for scrolling */
        }

        /* Desktop: prevent flex item from growing beyond parent */
        @media (min-width: 769px) {
          .inline-frame {
            max-width: 100%;
          }
        }

        /* When everything fits, shrink-wrap the inliner so the close “X” stays near the options */
        .inline-panel.fits .inline-frame {
          width: fit-content;
          max-width: 100%;
        }

        /* Desktop large (>=1024px): break out to 80vw to match sentence area */
        @media (min-width: 1024px) {
          .inline-panel {
            width: 80vw;
            max-width: 80vw;
            position: relative;
            left: 50%;
            margin-left: -40vw;
            margin-right: -40vw;
          }
        }

        /* Tablet/small desktop (769px-1023px): break out to full width */
        @media (min-width: 769px) and (max-width: 1023px) {
          .inline-panel {
            width: 100vw;
            max-width: 100vw;
            position: relative;
            left: 50%;
            margin-left: -50vw;
            margin-right: -50vw;
          }
        }

        /* Mobile (<=768px): break out to full viewport width */
        @media (max-width: 768px) {
          .inline-panel {
            width: 100vw;
            position: relative;
            left: 50%;
            right: 50%;
            margin-left: -50vw;
            margin-right: -50vw;
          }
          .inline-panel.fits .inline-frame {
            width: 100%;
            max-width: none;
          }
        }

        .inline-close-x {
          position: absolute;
          top: 0.5rem;
          right: 0.75rem;
          width: 28px;
          height: 28px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-family: 'JetBrains Mono', monospace;
          font-size: 1.35rem;
          line-height: 1;
          color: #000000;
          padding: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          opacity: 1;
          z-index: 2;
        }

        @media (max-width: 768px) {
          .inline-close-x {
            right: calc(0.75rem + env(safe-area-inset-right));
          }
        }

        .inline-close-x:hover { }

        .inline-close-x:focus-visible {
          outline: 2px solid rgba(26, 26, 26, 0.75);
          outline-offset: 2px;
        }

        .inline-arrow {
          position: absolute;
          /* Align to the center of the swatch circle (not the whole row) */
          top: calc(0.75rem + 0.25rem + (var(--inline-swatch-size) / 2));
          transform: translateY(-50%);
          width: 34px;
          height: 34px;
          border: none;
          border-radius: 0;
          background: transparent;
          cursor: pointer;
          font-family: 'JetBrains Mono', monospace;
          font-size: 1.6rem;
          line-height: 1;
          color: #1a1a1a;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          opacity: 1;
          z-index: 2;
        }

        .inline-arrow:hover {
          opacity: 1;
        }

        .inline-arrow:disabled {
          opacity: 1;
          cursor: default;
        }

        .inline-arrow:focus-visible {
          outline: 2px solid rgba(26, 26, 26, 0.75);
          outline-offset: 2px;
        }

        .inline-arrow-left {
          left: 0.5rem;
        }

        .inline-arrow-right {
          right: 0.5rem;
        }

        @media (max-width: 768px) {
          .inline-arrow-left {
            left: calc(0.5rem + env(safe-area-inset-left));
          }
          .inline-arrow-right {
            right: calc(0.5rem + env(safe-area-inset-right));
          }
        }

        .inline-panel-inner {
          margin: 0.75rem 0;
          padding: 0;
          border: none;
          border-radius: 0;
          background: transparent;
          width: 100%;
          overflow: hidden; /* Establish scroll boundary */
        }

        /* Desktop: ensure scroll boundary is properly constrained */
        @media (min-width: 769px) {
          .inline-panel-inner {
            max-width: 100%;
            box-sizing: border-box;
          }
        }

        /* When the inliner is shrink-wrapped (no overflow), reserve space for the close “X”
           so it doesn’t sit visually on top of / too close to the last swatch. */
        .inline-panel.fits .inline-panel-inner {
          display: inline-block;
          padding-right: 2.25rem;
        }

        .inline-panel-inner::before {
          content: none;
        }

        .inline-scroll {
          width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          scroll-snap-type: x proximity;
          scrollbar-width: none;
          -ms-overflow-style: none;
          padding: 0.25rem 0 0.25rem 0;
          /* Ensure first/last swatches never clip against the app frame */
          padding-left: max(var(--sentence-pad-x), env(safe-area-inset-left));
          padding-right: max(var(--sentence-pad-x), env(safe-area-inset-right));
        }

        /* Desktop: prevent scroll container from expanding beyond parent */
        @media (min-width: 769px) {
          .inline-scroll {
            max-width: 100%;
            box-sizing: border-box;
          }
        }

        /* If everything fits, disable scroll + snap so nothing "nudges" */
        .inline-scroll.inline-fits {
          overflow-x: hidden;
          scroll-snap-type: none;
          -webkit-overflow-scrolling: auto;
          overscroll-behavior-x: none;
          touch-action: pan-y;
          width: auto;
          padding-left: 0.25rem;
          padding-right: 0.25rem;
        }
        .inline-scroll::-webkit-scrollbar {
          display: none;
        }

        .inline-track {
          display: flex;
          gap: 1rem;
          padding: 0;
          width: max-content;
          margin: 0;
          min-width: 100%;
          justify-content: center;
          align-items: stretch;
        }

        .inline-item {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          background: transparent;
          border: none;
          border-radius: 0;
          padding: 0.25rem 0.1rem;
          cursor: pointer;
          opacity: 1;
          transition: none;
          scroll-snap-align: center;
          min-width: 110px;
          text-align: center;
        }

        .inline-item:hover {
          background: transparent;
        }

        .inline-item.selected {
          background: transparent;
        }

        .inline-item:focus-visible {
          outline: 2px solid rgba(194, 0, 0, 0.75);
          outline-offset: 2px;
        }

        .inline-swatch-frame {
          width: var(--inline-swatch-size);
          height: var(--inline-swatch-size);
          border-radius: 999px;
          border: 1px dashed rgba(26, 26, 26, 0.35);
          background: rgba(255, 255, 255, 0.55);
          overflow: hidden;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.12s ease;
        }

        .inline-item:hover .inline-swatch-frame {
          border-color: rgba(26, 26, 26, 0.55);
        }

        .inline-item.selected .inline-swatch-frame {
          border-style: solid;
          border-color: #1a1a1a;
        }

        .inline-caption-row {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.1rem;
          max-width: 96px;
          min-width: 0;
        }

        .inline-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.62rem;
          text-transform: none;
          letter-spacing: normal;
          color: #1a1a1a;
          line-height: 1.1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
        }

        .inline-price {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.62rem;
          text-transform: none;
          letter-spacing: normal;
          color: #1a1a1a;
          line-height: 1.1;
          white-space: nowrap;
        }

        .inline-swatch {
          width: 100%;
          height: 100%;
          border-radius: 999px;
          box-sizing: border-box;
          background-size: cover;
          background-position: center;
        }

        .inline-item.selected .inline-swatch {
          /* keep content neutral; selection is only the frame border */
        }

        @media (max-width: 640px) {
           .omni-footer-simple {
               gap: 0;
           }
           .omni-cta-btn {
               padding: 0.8rem 1.2rem;
           }
        }
      `}</style>

      <div className="omni-sentence-rail">
        <div className="omni-sentence-inner" ref={rootRef}>
          <div className="omni-sentence-text">
            <div>
              <span>You are customizing this </span>
              <span className="product-name">{product.name}</span>
              <span> </span>
              
              {/* Material */}
              {materialTokens.map((token, i) => (
                <React.Fragment key={token.id}>
                  {renderToken(token, i === 0)}
                  {i < materialTokens.length - 1 && <span> </span>}
                </React.Fragment>
              ))}

            {/* Clasp */}
            {claspTokens.length > 0 && (
                <>
                  {claspTokens.map((token, i) => (
                    <React.Fragment key={token.id}>
                      {renderToken(token, i === 0)}
                      {i < claspTokens.length - 1 && <span> </span>}
                    </React.Fragment>
                  ))}
                </>
            )}
            
              {/* Handle */}
              {handleTokens.length > 0 && (
                  <>
                    {handleTokens.map((token, i) => (
                      <React.Fragment key={token.id}>
                        {renderToken(token, i === 0)}
                        {i < handleTokens.length - 1 && <span> </span>}
                      </React.Fragment>
                    ))}
                    <span>&nbsp;handles</span>
                  </>
              )}

              {/* Personalization */}
              {personalTokens.length > 0 && (
                  <>
                    {personalTokens.map((token, i) => (
                      <React.Fragment key={token.id}>
                        {renderToken(token, i === 0, i < personalTokens.length - 1 ? ',' : undefined)}
                        {i < personalTokens.length - 1 && <span> </span>}
                      </React.Fragment>
                    ))}
                  </>
              )}
              
              <span className="sentence-glue">.</span>
            </div>
          </div>

          {/* PRICE AND BREAKDOWN */}
          <div className="omni-price-block-wrapper">
            <div className="omni-price-block group" onClick={onOpenPrice} style={{ cursor: 'pointer' }}>
              <span className="footer-price">£{totalPrice}</span>
              <div className="price-info-circle">i</div>
            </div>
          </div>

          <div className="omni-footer-simple">
            {/* Left Block: Secondary (User + Save) */}
            <button className="omni-footer-block secondary" onClick={onLoginRequest}>
               <span className="footer-action">Save Progress</span>
            </button>

            {/* Right Block: Primary (Buy) */}
            <button className="omni-footer-block primary" onClick={() => {}}>
               <span className="footer-buy">Add to Bag</span>
            </button>
          </div>

        </div>
      </div>
    </>
  );
};
