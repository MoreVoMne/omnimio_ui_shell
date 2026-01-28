// SpecSentence.tsx - Configuration as a Living Sentence
// The product is described by editing a natural language sentence
// All merchant-configured options are exposed to the customer

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ConfigurationStateV2, Product, TreeNode } from '../types-tree';
import { findNodeById } from '../utils/treeHelpers';

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
interface SpecSentenceProps {
  configuration: ConfigurationStateV2;
  product: Product;
  onNodeClick: (nodeIdOrSelection: string) => void;
  totalPrice: number;
  onOpenPrice: () => void;
  onLoginRequest: () => void;
  onPartHighlight?: (partId: string | null) => void;
  highlightedPart?: string | null;
  /**
   * layout="overlay" (default): fixed bottom rail over the 3D stage (current behavior)
   * layout="embedded": renders inside a parent container (e.g. Tag chapter)
   */
  layout?: 'overlay' | 'embedded';
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

// ==== HELPER: Get all configurable attributes from a component ====
function _getAllAttributes(node: TreeNode): TreeNode[] {
  const attributes: TreeNode[] = [];
  
  const traverse = (n: TreeNode) => {
    if (n.type === 'attribute' && n.children?.some(c => c.type === 'option')) {
      attributes.push(n);
    }
    n.children?.forEach(traverse);
  };
  
  traverse(node);
  return attributes;
}

// ==== HELPER: Build sentence tokens - one per configurable attribute ====
function buildTokensFromConfig(
  tree: TreeNode[],
  config: ConfigurationStateV2
): Token[] {
  const tokens: Token[] = [];

  // === BODY COMPONENT - Split into separate tokens ===
  const bodyNode = tree.find(n => n.id === 'node-body');
  if (bodyNode) {
    const materialNode = bodyNode.children?.find(c => c.id === 'node-body-material');
    const colorNode = materialNode?.children?.find(c => c.id === 'node-body-color');
    const finishNode = materialNode?.children?.find(c => c.id === 'node-body-finish');
    const baseNode = bodyNode.children?.find(c => c.id === 'node-body-base');

    // Color token
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

    // Finish token
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

    // Material type token
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

    // Base token (if not standard)
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

    // Clasp type token (e.g., "magnetic clasp", "zipper clasp")
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

    // Clasp finish token (e.g., "polished gold finish")
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

    // Handle style token
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

    // Handle length token
    if (lengthNode) {
      const lengthValue = getSelectedValue(lengthNode, config);
      tokens.push({
        id: 'token-handle-length',
        nodeId: lengthNode.id,
        label: 'Handle Length',
        value: lengthValue ? `${lengthValue.toLowerCase()} length` : 'standard length',
        isEditable: true,
        linkedPart: 'mesh-handle',
      });
    }

    // Handle config token
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

    // Monogram token
    if (monogramNode) {
      const monogramValue = getSelectedValue(monogramNode, config);
      tokens.push({
        id: 'token-monogram',
        nodeId: monogramNode.id,
        label: 'Monogram',
        value: monogramValue.toLowerCase() === 'none' ? 'no monogram' : monogramValue.toLowerCase(),
        isEditable: true,
        prefix: '—',
        linkedPart: 'mesh-body',
      });
    }

    // Artwork status
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
export const SpecSentence: React.FC<SpecSentenceProps> = ({
  configuration,
  product,
  onNodeClick,
  totalPrice,
  onOpenPrice,
  onLoginRequest,
  onPartHighlight,
  highlightedPart,
  layout = 'overlay',
}) => {
  const [activeToken, setActiveToken] = useState<Token | null>(null);
  const [activeNode, setActiveNode] = useState<TreeNode | null>(null);
  const sentenceRef = useRef<HTMLDivElement>(null);
  const trayRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Build tokens from configuration
  const tokens = buildTokensFromConfig(product.customizationTree, configuration);

  // Close tray when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        trayRef.current &&
        !trayRef.current.contains(e.target as Node) &&
        sentenceRef.current &&
        !sentenceRef.current.contains(e.target as Node)
      ) {
        setActiveToken(null);
        setActiveNode(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle token tap
  const handleTokenTap = (token: Token) => {
    if (activeToken?.id === token.id) {
      setActiveToken(null);
      setActiveNode(null);
      return;
    }

    setActiveToken(token);

    // Find the node for this token
    const node = findNodeById(product.customizationTree, token.nodeId);
    setActiveNode(node || null);

    // Highlight corresponding part on model
    if (onPartHighlight && token.linkedPart) {
      onPartHighlight(token.linkedPart);
    }
  };

  // Handle option selection
  const handleOptionSelect = (nodeId: string, optionId: string) => {
    onNodeClick(`${nodeId}:${optionId}`);
    setTimeout(() => {
      setActiveToken(null);
      setActiveNode(null);
    }, 150);
  };

  // Handle swipe to cycle options
  const handleSwipe = (token: Token, direction: 'left' | 'right') => {
    const node = findNodeById(product.customizationTree, token.nodeId);
    if (!node || !node.children) return;

    const options = node.children.filter(c => c.type === 'option');
    if (options.length === 0) return;
    
    const currentSelection = configuration.selections[node.id]?.value;
    let currentIndex = options.findIndex(o => o.id === currentSelection);
    if (currentIndex === -1) currentIndex = 0;

    let nextIndex = direction === 'right' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= options.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = options.length - 1;

    onNodeClick(`${node.id}:${options[nextIndex].id}`);
  };

  // Get swatch color for an option
  const getSwatchColor = (label: string): string | null => {
    const l = label.toLowerCase();
    if (l.includes('black')) return '#2C2C2C';
    if (l.includes('navy')) return '#1A2B4A';
    if (l.includes('emerald')) return '#2F6B4F';
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

  // Group tokens for sentence structure
  const materialTokens = tokens.filter(t => ['token-color', 'token-finish', 'token-material'].includes(t.id));
  const claspTokens = tokens.filter(t => ['token-clasp-type', 'token-clasp-finish', 'token-base'].includes(t.id));
  const handleTokens = tokens.filter(t => t.id.startsWith('token-handle'));
  const personalTokens = tokens.filter(t => ['token-monogram', 'token-artwork'].includes(t.id));

  // Render a token button
  const renderToken = (token: Token, showPrefix = true, suffixPunct?: string) => (
    <span key={token.id} className="sentence-glue">
      {showPrefix && token.prefix ? <span className="spec-prefix">{token.prefix}{'\u00A0'}</span> : null}
      <motion.button
        className={`spec-token ${activeToken?.id === token.id ? 'active' : ''} ${highlightedPart === token.linkedPart ? 'highlighted' : ''}`}
        onClick={() => handleTokenTap(token)}
        whileTap={{ scale: 0.98 }}
        drag={isMobile ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragEnd={(_, info: PanInfo) => {
          if (Math.abs(info.offset.x) > 40) {
            handleSwipe(token, info.offset.x > 0 ? 'right' : 'left');
          }
        }}
      >
        {token.value}
      </motion.button>
      {suffixPunct ? <span className="token-punct">{suffixPunct}</span> : null}
    </span>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=JetBrains+Mono:wght@300;400&display=swap');

        .spec-sentence-container {
          ${layout === 'overlay' ? `
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 40;
            pointer-events: none;
          ` : `
            position: relative;
            width: 100%;
            height: 100%;
            pointer-events: auto;
          `}
        }

        .spec-sentence-rail {
          ${layout === 'overlay' ? `
            background: linear-gradient(
              to top,
              rgba(248, 245, 240, 1) 0%,
              rgba(248, 245, 240, 1) 40%,
              rgba(248, 245, 240, 0.95) 60%,
              rgba(248, 245, 240, 0.7) 75%,
              rgba(248, 245, 240, 0.3) 88%,
              rgba(248, 245, 240, 0) 100%
            );
            padding: 4.5rem 1.25rem 1.5rem;
          ` : `
            background: rgba(248, 245, 240, 1);
            padding: 1.25rem 1.25rem 1rem;
            height: 100%;
            overflow: auto;
          `}
          pointer-events: auto;
        }

        @media (min-width: 640px) {
          .spec-sentence-rail {
            padding: 5rem 2.5rem 2rem;
          }
        }

        .spec-sentence-inner {
          max-width: 720px;
          margin: 0 auto;
        }

        .spec-sentence-text {
          font-family: 'PP Editorial Old', serif;
          font-feature-settings: "liga" 1, "dlig" 1, "calt" 1, "swsh" 1, "salt" 1;
          font-variant-ligatures: common-ligatures discretionary-ligatures contextual;
          font-size: 1.05rem;
          font-weight: 300;
          line-height: 2.1;
          color: #1a1a1a;
          text-align: left;
          letter-spacing: 0.01em;
          text-wrap: balance;
          hanging-punctuation: first last;
        }

        @media (min-width: 640px) {
          .spec-sentence-text {
            font-size: 1.25rem;
            line-height: 2;
          }
        }

        .spec-token {
          display: inline;
          background: transparent;
          border: none;
          padding: 0 0.15em;
          margin: 0;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          font-family: inherit;
          font-size: inherit;
          font-weight: 400;
          color: #1a1a1a;
          border-bottom: 1.5px solid rgba(194, 0, 0, 0.3);
          -webkit-tap-highlight-color: transparent;
        }

        .spec-token:hover {
          border-bottom-color: rgba(194, 0, 0, 0.6);
          color: #000;
        }

        .spec-token.active {
          border-bottom-color: #C20000;
          border-bottom-width: 2px;
          color: #000;
          background: rgba(194, 0, 0, 0.04);
        }

        .spec-token.highlighted {
          animation: token-pulse 1.5s ease-in-out infinite;
        }

        @keyframes token-pulse {
          0%, 100% { background: transparent; }
          50% { background: rgba(194, 0, 0, 0.08); }
        }

        .spec-prefix {
          font-weight: 300;
          color: rgba(26, 26, 26, 0.45);
        }

        .product-name {
          font-style: italic;
          font-weight: 400;
        }

        .token-separator {
          color: rgba(26, 26, 26, 0.3);
        }

        /* Option Tray - Desktop */
        .option-tray {
          position: ${layout === 'overlay' ? 'fixed' : 'absolute'};
          z-index: 100;
          background: #F8F5F0;
          border: 1px solid rgba(0, 0, 0, 0.12);
          border-radius: 12px;
          padding: 1.25rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
          pointer-events: auto;
          max-width: 480px;
          width: calc(100vw - 2rem);
        }

        .option-tray.desktop {
          ${layout === 'overlay' ? `
            left: 50%;
            transform: translateX(-50%);
            bottom: auto;
          ` : `
            left: 1rem;
            right: 1rem;
            width: auto;
            max-width: none;
          `}
        }

        /* Option Tray - Mobile (Bottom Sheet) */
        .option-tray.mobile {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          width: 100%;
          max-width: 100%;
          border-radius: 20px 20px 0 0;
          padding: 0.75rem 1.25rem 2rem;
          max-height: 50vh;
          overflow-y: auto;
        }

        .tray-handle {
          width: 36px;
          height: 4px;
          background: rgba(0, 0, 0, 0.15);
          border-radius: 2px;
          margin: 0 auto 0.75rem;
        }

        .tray-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 0.75rem;
          margin-bottom: 0.75rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }

        .tray-title {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.65rem;
          font-weight: 400;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: rgba(26, 26, 26, 0.5);
        }

        .tray-close {
          background: none;
          border: none;
          padding: 0.5rem;
          margin: -0.5rem;
          cursor: pointer;
          opacity: 0.4;
          transition: opacity 0.2s;
          border-radius: 50%;
        }

        .tray-close:hover {
          opacity: 1;
          background: rgba(0, 0, 0, 0.05);
        }

        .tray-options {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .option-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.55rem 0.9rem;
          background: transparent;
          border: 1px solid rgba(0, 0, 0, 0.15);
          border-radius: 100px;
          cursor: pointer;
          transition: all 0.15s ease-out;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.68rem;
          font-weight: 300;
          color: #1a1a1a;
          white-space: nowrap;
        }

        .option-chip:hover {
          border-color: rgba(0, 0, 0, 0.4);
          background: rgba(0, 0, 0, 0.02);
        }

        .option-chip.selected {
          background: #1a1a1a;
          border-color: #1a1a1a;
          color: #F8F5F0;
          font-weight: 400;
        }

        .option-chip .price-badge {
          font-size: 0.55rem;
          opacity: 0.5;
        }

        .option-chip.selected .price-badge {
          opacity: 0.7;
        }

        .option-swatch {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 1px solid rgba(0, 0, 0, 0.1);
          flex-shrink: 0;
        }

        .option-chip.selected .option-swatch {
          border-color: rgba(255, 255, 255, 0.3);
        }

        /* Footer */
        .spec-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1rem;
          margin-top: 1rem;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
          gap: 1rem;
        }

        @media (max-width: 639px) {
          .spec-footer {
            flex-direction: column;
            align-items: stretch;
            gap: 0.75rem;
          }
        }

        .spec-price-block {
          display: flex;
          align-items: baseline;
          gap: 0.75rem;
        }

        @media (max-width: 639px) {
          .spec-price-block {
            justify-content: space-between;
          }
        }

        .spec-price {
          font-family: 'PP Editorial Old', serif;
          font-feature-settings: "liga" 1, "dlig" 1, "calt" 1, "swsh" 1, "salt" 1, "ss01" 1;
          font-variant-ligatures: common-ligatures discretionary-ligatures contextual;
          font-size: 1.5rem;
          font-weight: 300;
          font-style: italic;
          color: #1a1a1a;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .spec-price:hover {
          opacity: 0.7;
        }

        .spec-meta {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.55rem;
          color: rgba(26, 26, 26, 0.4);
          letter-spacing: 0.03em;
        }

        .spec-cta {
          display: flex;
          gap: 0.5rem;
        }

        @media (max-width: 639px) {
          .spec-cta {
            width: 100%;
          }
        }

        .cta-button {
          padding: 0.75rem 1.5rem;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.6rem;
          font-weight: 400;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border: 1px solid #1a1a1a;
          border-radius: 0;
          cursor: pointer;
          transition: all 0.2s;
        }

        @media (max-width: 639px) {
          .cta-button {
            flex: 1;
            padding: 0.9rem 1rem;
          }
        }

        .cta-button.primary {
          background: #1a1a1a;
          color: #F8F5F0;
        }

        .cta-button.primary:hover {
          background: #000;
        }

        .cta-button.secondary {
          background: transparent;
          color: #1a1a1a;
        }

        .cta-button.secondary:hover {
          background: rgba(0, 0, 0, 0.04);
        }
      `}</style>

      <div className="spec-sentence-container">
        {/* Option Tray */}
        <AnimatePresence>
          {activeToken && activeNode && (
            <motion.div
              ref={trayRef}
              className={`option-tray ${isMobile ? 'mobile' : 'desktop'}`}
              initial={{ opacity: 0, y: isMobile ? 100 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: isMobile ? 100 : 10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={!isMobile ? { 
                bottom: sentenceRef.current 
                  ? window.innerHeight - sentenceRef.current.getBoundingClientRect().top + 16 
                  : 220 
              } : undefined}
            >
              {isMobile && <div className="tray-handle" />}
              
              <div className="tray-header">
                <span className="tray-title">{activeToken.label}</span>
                <button className="tray-close" onClick={() => { setActiveToken(null); setActiveNode(null); }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M5 5L13 13M13 5L5 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              <div className="tray-options">
                {activeNode.children?.filter(c => c.type === 'option').map(option => {
                  const isSelected = configuration.selections[activeNode.id]?.value === option.id ||
                                   (!configuration.selections[activeNode.id] && option.default === true);

                  const swatchColor = getSwatchColor(option.label);

                  return (
                    <button
                      key={option.id}
                      className={`option-chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleOptionSelect(activeNode.id, option.id)}
                    >
                      {swatchColor && (
                        <span className="option-swatch" style={{ background: swatchColor }} />
                      )}
                      <span>{option.label}</span>
                      {option.priceModifier !== undefined && option.priceModifier !== 0 && (
                        <span className="price-badge">
                          {option.priceModifier > 0 ? '+' : ''}£{option.priceModifier}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sentence Rail */}
        <div className="spec-sentence-rail">
          <div className="spec-sentence-inner">
            <div ref={sentenceRef} className="spec-sentence-text">
              {/* Opening */}
              <span>This </span>
              <span className="product-name">{product.name}</span>
              <span> is </span>

              {/* Material tokens: "in [natural] [pebbled leather]" */}
              {materialTokens.map((token, i) => (
                <React.Fragment key={token.id}>
                  {renderToken(token, i === 0)}
                  {i < materialTokens.length - 1 && <span> </span>}
                </React.Fragment>
              ))}

              {/* Clasp tokens: "and [magnetic clasp] with [polished gold finish]" */}
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

              {/* Handle tokens: "and [matching leather] [standard length] [single strap]" */}
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

              {/* Personalization: "— [no monogram], [no artwork]" */}
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

              <span>.</span>
            </div>

            <div className="spec-footer">
              <div className="spec-price-block">
                <div className="spec-price" onClick={onOpenPrice}>£{totalPrice}</div>
                <div className="spec-meta">Lead time 10–14 days</div>
              </div>

              <div className="spec-cta">
                <button className="cta-button secondary" onClick={onLoginRequest}>
                  Save
                </button>
                <button className="cta-button primary">
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SpecSentence;
