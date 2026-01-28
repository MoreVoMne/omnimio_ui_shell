// AccordionSentence.tsx - CONCEPT 2: "The Accordion Sentence"
// The sentence itself IS the UI. Each token expands inline to reveal options.
// Only one section expanded at a time. Reading IS configuring.

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfigurationStateV2, Product, TreeNode } from '../types-tree';
import { findNodeById, getDisplayValue } from '../utils/treeHelpers';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

interface Token {
  id: string;
  nodeId: string;
  label: string;
  value: string;
  prefix?: string;
  suffix?: string;
  linkedPart?: string;
}

interface AccordionSentenceProps {
  configuration: ConfigurationStateV2;
  product: Product;
  onNodeClick: (nodeIdOrSelection: string) => void;
  totalPrice: number;
  onOpenPrice: () => void;
  onLoginRequest: () => void;
  onPartHighlight?: (partId: string | null) => void;
}

function getSelectedValue(node: TreeNode | null | undefined, config: ConfigurationStateV2): string {
  if (!node) return '';
  const selection = config.selections[node.id];
  if (selection) {
    const selectedOption = node.children?.find(c => c.id === selection.value);
    return selectedOption?.label || '';
  }
  const defaultOption = node.children?.find(c => c.default === true);
  return defaultOption?.label || '';
}

function buildTokens(tree: TreeNode[], config: ConfigurationStateV2): Token[] {
  const tokens: Token[] = [];

  const bodyNode = tree.find(n => n.id === 'node-body');
  if (bodyNode) {
    const materialNode = bodyNode.children?.find(c => c.id === 'node-body-material');
    const colorNode = materialNode?.children?.find(c => c.id === 'node-body-color');

    if (colorNode) {
      tokens.push({
        id: 'token-color',
        nodeId: colorNode.id,
        label: 'Color',
        value: getSelectedValue(colorNode, config).toLowerCase() || 'natural',
        prefix: 'in',
        linkedPart: 'mesh-body',
      });
    }

    if (materialNode) {
      tokens.push({
        id: 'token-material',
        nodeId: materialNode.id,
        label: 'Leather',
        value: getSelectedValue(materialNode, config).toLowerCase() || 'leather',
        suffix: 'leather',
        linkedPart: 'mesh-body',
      });
    }
  }

  const claspNode = tree.find(n => n.id === 'node-clasp');
  if (claspNode) {
    const typeNode = claspNode.children?.find(c => c.id === 'node-clasp-type');
    const finishNode = typeNode?.children?.find(c => c.id === 'node-clasp-finish');

    if (typeNode) {
      tokens.push({
        id: 'token-clasp',
        nodeId: typeNode.id,
        label: 'Clasp Type',
        value: getSelectedValue(typeNode, config).toLowerCase() || 'magnetic',
        prefix: 'with a',
        suffix: 'clasp',
        linkedPart: 'mesh-clasp',
      });
    }

    if (finishNode) {
      tokens.push({
        id: 'token-finish',
        nodeId: finishNode.id,
        label: 'Hardware Finish',
        value: getSelectedValue(finishNode, config).toLowerCase() || 'polished gold',
        prefix: 'in',
        linkedPart: 'mesh-clasp',
      });
    }
  }

  const handleNode = tree.find(n => n.id === 'node-handle');
  if (handleNode) {
    const styleNode = handleNode.children?.find(c => c.id === 'node-handle-style');
    const configNode = styleNode?.children?.find(c => c.id === 'node-handle-config');

    if (styleNode) {
      tokens.push({
        id: 'token-handle',
        nodeId: styleNode.id,
        label: 'Handle Material',
        value: getSelectedValue(styleNode, config).toLowerCase().replace('match body', 'matching') || 'matching',
        prefix: 'and',
        linkedPart: 'mesh-handle',
      });
    }

    if (configNode) {
      tokens.push({
        id: 'token-config',
        nodeId: configNode.id,
        label: 'Handle Style',
        value: getSelectedValue(configNode, config).toLowerCase() === 'double' ? 'double' : 'single',
        suffix: 'handles',
        linkedPart: 'mesh-handle',
      });
    }
  }

  return tokens;
}

function getSwatchColor(label: string): string | null {
  const l = label.toLowerCase();
  if (l.includes('black')) return '#2C2C2C';
  if (l.includes('navy')) return '#1A2B4A';
  if (l.includes('emerald')) return '#2F6B4F';
  if (l.includes('silver')) return '#C0C0C0';
  if (l.includes('gold') || l.includes('brass') || l.includes('polished')) return '#D4AF37';
  if (l.includes('natural')) return '#E8DFD0';
  if (l.includes('pebbled')) return '#E2D8CC';
  if (l.includes('smooth')) return '#D5C9BC';
  if (l.includes('magnetic')) return '#888';
  if (l.includes('turn')) return '#666';
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const AccordionSentence: React.FC<AccordionSentenceProps> = ({
  configuration,
  product,
  onNodeClick,
  totalPrice,
  onOpenPrice,
  onLoginRequest,
  onPartHighlight,
}) => {
  const [expandedToken, setExpandedToken] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const tokens = buildTokens(product.customizationTree, configuration);

  const handleTokenClick = (token: Token) => {
    if (expandedToken === token.id) {
      setExpandedToken(null);
      if (onPartHighlight) onPartHighlight(null);
    } else {
      setExpandedToken(token.id);
      if (onPartHighlight && token.linkedPart) {
        onPartHighlight(token.linkedPart);
      }
    }
  };

  const handleOptionSelect = (nodeId: string, optionId: string) => {
    onNodeClick(`${nodeId}:${optionId}`);
    // Keep expanded to see the change
  };

  const getNodeForToken = (token: Token): TreeNode | null => {
    return findNodeById(product.customizationTree, token.nodeId) || null;
  };

  return (
    <>
      <style>{`

        .accordion-container {
          --bg: #F8F5F0;
          --ink: #1a1a1a;
          --accent: #C20000;
          --serif: 'PP Editorial Old', serif;
          --mono: 'JetBrains Mono', monospace;
          
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 50;
          background: var(--bg);
          border-top: 1px solid var(--ink);
        }

        @media (min-width: 640px) {
          .accordion-container {
            left: 50%;
            right: auto;
            transform: translateX(-50%);
            bottom: 1.5rem;
            max-width: 640px;
            width: calc(100% - 3rem);
            border: 1px solid var(--ink);
            border-radius: 20px;
          }
        }

        .accordion-inner {
          padding: 1.5rem;
        }

        @media (min-width: 640px) {
          .accordion-inner {
            padding: 2rem;
          }
        }

        /* Sentence Flow */
        .accordion-sentence {
          font-family: var(--serif);
          font-size: 1.1rem;
          font-weight: 300;
          line-height: 1.8;
          color: var(--ink);
        }

        @media (min-width: 640px) {
          .accordion-sentence {
            font-size: 1.3rem;
            line-height: 1.9;
          }
        }

        .accordion-prefix {
          color: rgba(26, 26, 26, 0.4);
        }

        .accordion-suffix {
          color: var(--ink);
        }

        /* Token Button */
        .accordion-token {
          display: inline;
          background: transparent;
          border: none;
          padding: 0;
          margin: 0;
          cursor: pointer;
          font-family: inherit;
          font-size: inherit;
          font-weight: 400;
          color: var(--ink);
          position: relative;
          transition: all 0.2s;
        }

        .accordion-token-text {
          border-bottom: 1.5px solid rgba(194, 0, 0, 0.3);
          transition: all 0.2s;
        }

        .accordion-token:hover .accordion-token-text,
        .accordion-token.expanded .accordion-token-text {
          border-bottom-color: var(--accent);
          background: rgba(194, 0, 0, 0.04);
        }

        .accordion-token.expanded .accordion-token-text {
          border-bottom-width: 2px;
        }

        /* Expanded Options Panel */
        .accordion-options {
          display: block;
          margin: 0.75rem 0;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.02);
          border-radius: 12px;
          border: 1px solid rgba(0, 0, 0, 0.06);
        }

        .accordion-options-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }

        .accordion-options-title {
          font-family: var(--mono);
          font-size: 0.6rem;
          font-weight: 400;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: rgba(26, 26, 26, 0.5);
        }

        .accordion-options-close {
          background: none;
          border: none;
          font-family: var(--mono);
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(26, 26, 26, 0.4);
          cursor: pointer;
          padding: 0.25rem 0.5rem;
          margin: -0.25rem -0.5rem;
          transition: all 0.2s;
        }

        .accordion-options-close:hover {
          color: var(--ink);
          background: rgba(0, 0, 0, 0.04);
          border-radius: 4px;
        }

        .accordion-options-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .accordion-option {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 0.75rem;
          background: var(--bg);
          border: 1px solid rgba(0, 0, 0, 0.12);
          border-radius: 100px;
          cursor: pointer;
          transition: all 0.15s;
          font-family: var(--mono);
          font-size: 0.7rem;
          color: var(--ink);
        }

        .accordion-option:hover {
          border-color: rgba(0, 0, 0, 0.3);
          background: #fff;
        }

        .accordion-option.selected {
          background: var(--ink);
          border-color: var(--ink);
          color: var(--bg);
        }

        .accordion-option-swatch {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 1px solid rgba(0, 0, 0, 0.1);
          flex-shrink: 0;
        }

        .accordion-option.selected .accordion-option-swatch {
          border-color: rgba(255, 255, 255, 0.3);
        }

        .accordion-option-price {
          font-size: 0.55rem;
          opacity: 0.5;
          margin-left: 0.25rem;
        }

        /* Footer */
        .accordion-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1.25rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(0, 0, 0, 0.08);
          gap: 1rem;
          flex-wrap: wrap;
        }

        .accordion-price {
          font-family: var(--serif);
          font-size: 1.5rem;
          font-style: italic;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .accordion-price:hover {
          opacity: 0.7;
        }

        .accordion-meta {
          font-family: var(--mono);
          font-size: 0.55rem;
          color: rgba(26, 26, 26, 0.4);
          letter-spacing: 0.03em;
        }

        .accordion-actions {
          display: flex;
          gap: 0.5rem;
        }

        @media (max-width: 639px) {
          .accordion-actions {
            width: 100%;
          }
        }

        .accordion-btn {
          padding: 0.75rem 1.25rem;
          font-family: var(--mono);
          font-size: 0.6rem;
          font-weight: 400;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          border: 1px solid var(--ink);
          cursor: pointer;
          transition: all 0.2s;
        }

        @media (max-width: 639px) {
          .accordion-btn {
            flex: 1;
          }
        }

        .accordion-btn-primary {
          background: var(--ink);
          color: var(--bg);
        }

        .accordion-btn-secondary {
          background: transparent;
          color: var(--ink);
        }
      `}</style>

      <div className="accordion-container" ref={containerRef}>
        <div className="accordion-inner">
          <div className="accordion-sentence">
            <span>This </span>
            <span style={{ fontStyle: 'italic' }}>{product.name}</span>
            <span> is </span>

            {tokens.map((token, index) => {
              const node = getNodeForToken(token);
              const isExpanded = expandedToken === token.id;
              const options = node?.children?.filter(c => c.type === 'option') || [];

              return (
                <React.Fragment key={token.id}>
                  {/* Prefix */}
                  {token.prefix && <span className="accordion-prefix"> {token.prefix} </span>}

                  {/* Token */}
                  <button
                    className={`accordion-token ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => handleTokenClick(token)}
                  >
                    <span className="accordion-token-text">{token.value}</span>
                  </button>

                  {/* Suffix */}
                  {token.suffix && <span className="accordion-suffix"> {token.suffix}</span>}

                  {/* Expanded Options Panel - Inline */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        className="accordion-options"
                        initial={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: '0.75rem', marginBottom: '0.75rem' }}
                        exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <div className="accordion-options-header">
                          <span className="accordion-options-title">{token.label}</span>
                          <button 
                            className="accordion-options-close"
                            onClick={(e) => { e.stopPropagation(); setExpandedToken(null); }}
                          >
                            Done
                          </button>
                        </div>
                        <div className="accordion-options-grid">
                          {options.map(option => {
                            const isSelected = configuration.selections[token.nodeId]?.value === option.id ||
                              (!configuration.selections[token.nodeId] && option.default === true);
                            const swatchColor = getSwatchColor(option.label);

                            return (
                              <button
                                key={option.id}
                                className={`accordion-option ${isSelected ? 'selected' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOptionSelect(token.nodeId, option.id);
                                }}
                              >
                                {swatchColor && (
                                  <span className="accordion-option-swatch" style={{ background: swatchColor }} />
                                )}
                                <span>{option.label}</span>
                                {option.priceModifier !== undefined && option.priceModifier !== 0 && (
                                  <span className="accordion-option-price">
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

                  {/* Trailing space if not last */}
                  {index < tokens.length - 1 && !token.suffix && ' '}
                </React.Fragment>
              );
            })}

            <span>.</span>
          </div>

          {/* Footer */}
          <div className="accordion-footer">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
              <div className="accordion-price" onClick={onOpenPrice}>£{totalPrice}</div>
              <div className="accordion-meta">Lead time 10–14 days</div>
            </div>
            <div className="accordion-actions">
              <button className="accordion-btn accordion-btn-secondary" onClick={onLoginRequest}>Save</button>
              <button className="accordion-btn accordion-btn-primary">Add to Cart</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AccordionSentence;


