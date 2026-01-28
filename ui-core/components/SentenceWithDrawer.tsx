// SentenceWithDrawer.tsx - CONCEPT 1: "Sentence as Summary, Panel as Depth"
// The sentence is always visible at the bottom. Tapping any token opens
// a side drawer (desktop) or bottom sheet (mobile) with the full panel
// pre-scrolled to the relevant section.

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfigurationStateV2, Product, TreeNode } from '../types-tree';
import { getDisplayValue } from '../utils/treeHelpers';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

interface Token {
  id: string;
  nodeId: string;
  label: string;
  value: string;
  prefix?: string;
  sectionId: string;
  linkedPart?: string;
}

interface SentenceWithDrawerProps {
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
        sectionId: 'node-body',
        linkedPart: 'mesh-body',
      });
    }

    if (materialNode) {
      tokens.push({
        id: 'token-material',
        nodeId: materialNode.id,
        label: 'Material',
        value: getSelectedValue(materialNode, config).toLowerCase() || 'leather',
        sectionId: 'node-body',
        linkedPart: 'mesh-body',
      });
    }
  }

  const claspNode = tree.find(n => n.id === 'node-clasp');
  if (claspNode) {
    const typeNode = claspNode.children?.find(c => c.id === 'node-clasp-type');
    if (typeNode) {
      tokens.push({
        id: 'token-clasp',
        nodeId: typeNode.id,
        label: 'Clasp',
        value: `${getSelectedValue(typeNode, config).toLowerCase()} clasp`,
        prefix: 'with',
        sectionId: 'node-clasp',
        linkedPart: 'mesh-clasp',
      });
    }
  }

  const handleNode = tree.find(n => n.id === 'node-handle');
  if (handleNode) {
    const styleNode = handleNode.children?.find(c => c.id === 'node-handle-style');
    if (styleNode) {
      tokens.push({
        id: 'token-handle',
        nodeId: styleNode.id,
        label: 'Handle',
        value: getSelectedValue(styleNode, config).toLowerCase().replace('match body', 'matching') || 'leather',
        prefix: 'and',
        sectionId: 'node-handle',
        linkedPart: 'mesh-handle',
      });
    }
  }

  return tokens;
}

const ThinArrowRight = () => (
  <svg width="8" height="10" viewBox="0 0 8 10" fill="none">
    <path d="M1 1L6 5L1 9" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const SentenceWithDrawer: React.FC<SentenceWithDrawerProps> = ({
  configuration,
  product,
  onNodeClick,
  totalPrice,
  onOpenPrice,
  onLoginRequest,
  onPartHighlight,
}) => {
  const [activeToken, setActiveToken] = useState<Token | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [activeAttribute, setActiveAttribute] = useState<TreeNode | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const tokens = buildTokens(product.customizationTree, configuration);
  const componentSections = product.customizationTree.filter(n => n.type === 'component');

  const handleTokenTap = (token: Token) => {
    setActiveToken(token);
    setActiveSection(token.sectionId);
    setActiveAttribute(null);
    setIsDrawerOpen(true);
    if (onPartHighlight && token.linkedPart) {
      onPartHighlight(token.linkedPart);
    }
  };

  const handleOptionSelect = (nodeId: string, optionId: string) => {
    onNodeClick(`${nodeId}:${optionId}`);
    setActiveAttribute(null);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setActiveToken(null);
    setActiveSection(null);
    setActiveAttribute(null);
    if (onPartHighlight) onPartHighlight(null);
  };

  return (
    <>
      <style>{`

        .swd-container {
          --bg: #F8F5F0;
          --ink: #1a1a1a;
          --accent: #C20000;
          --serif: 'PP Editorial Old', serif;
          --mono: 'JetBrains Mono', monospace;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 40;
        }

        /* Sentence Rail */
        .swd-rail {
          background: linear-gradient(to top, var(--bg) 0%, var(--bg) 60%, rgba(248,245,240,0.95) 80%, rgba(248,245,240,0) 100%);
          padding: 3rem 1.5rem 1.5rem;
        }

        @media (min-width: 768px) {
          .swd-rail {
            padding: 4rem 2.5rem 2rem;
          }
        }

        .swd-inner {
          max-width: 680px;
          margin: 0 auto;
        }

        .swd-sentence {
          font-family: var(--serif);
          font-size: 1.15rem;
          font-weight: 300;
          line-height: 2;
          color: var(--ink);
          text-wrap: balance;
          hanging-punctuation: first last;
        }

        @media (min-width: 768px) {
          .swd-sentence {
            font-size: 1.35rem;
          }
        }

        .swd-token {
          display: inline;
          background: transparent;
          border: none;
          padding: 0 0.1em;
          cursor: pointer;
          font-family: inherit;
          font-size: inherit;
          font-weight: 400;
          color: var(--ink);
          border-bottom: 1.5px solid rgba(194, 0, 0, 0.3);
          transition: all 0.2s;
        }

        .swd-token:hover, .swd-token.active {
          border-bottom-color: var(--accent);
          background: rgba(194, 0, 0, 0.04);
        }

        .swd-prefix {
          color: rgba(26, 26, 26, 0.4);
        }

        .swd-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(0,0,0,0.08);
          flex-wrap: wrap;
          gap: 1rem;
        }

        .swd-price {
          font-family: var(--serif);
          font-size: 1.5rem;
          font-style: italic;
          cursor: pointer;
        }

        .swd-actions {
          display: flex;
          gap: 0.5rem;
        }

        .swd-btn {
          padding: 0.75rem 1.25rem;
          font-family: var(--mono);
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          border: 1px solid var(--ink);
          cursor: pointer;
          transition: all 0.2s;
        }

        .swd-btn-primary {
          background: var(--ink);
          color: var(--bg);
        }

        .swd-btn-secondary {
          background: transparent;
          color: var(--ink);
        }

        /* Drawer - Desktop (Side) */
        .swd-drawer {
          position: fixed;
          background: var(--bg);
          z-index: 60;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .swd-drawer.desktop {
          top: 0;
          right: 0;
          bottom: 0;
          width: 380px;
          border-left: 1px solid var(--ink);
        }

        .swd-drawer.mobile {
          left: 0;
          right: 0;
          bottom: 0;
          max-height: 70vh;
          border-top: 1px solid var(--ink);
          border-radius: 24px 24px 0 0;
        }

        .swd-drawer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid rgba(0,0,0,0.1);
        }

        .swd-drawer-title {
          font-family: var(--serif);
          font-size: 1.25rem;
          font-style: italic;
        }

        .swd-drawer-close {
          background: none;
          border: none;
          cursor: pointer;
          opacity: 0.5;
          transition: opacity 0.2s;
          padding: 0.5rem;
          margin: -0.5rem;
        }

        .swd-drawer-close:hover {
          opacity: 1;
        }

        .swd-drawer-content {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
        }

        .swd-section {
          margin-bottom: 1.5rem;
        }

        .swd-section-title {
          font-family: var(--mono);
          font-size: 0.6rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-bottom: 0.5rem;
          padding-bottom: 3px;
          border-bottom: 1px solid var(--accent);
          display: inline-block;
        }

        .swd-section.highlighted .swd-section-title {
          background: rgba(194, 0, 0, 0.08);
          padding: 3px 6px;
          margin-left: -6px;
          border-radius: 2px;
        }

        .swd-row {
          display: flex;
          align-items: baseline;
          font-family: var(--mono);
          font-size: 0.75rem;
          padding: 0.4rem 0;
          cursor: pointer;
          border-radius: 2px;
          transition: background 0.15s;
        }

        .swd-row:hover {
          background: rgba(0,0,0,0.03);
        }

        .swd-row-label {
          color: var(--ink);
        }

        .swd-row-dots {
          flex: 1;
          border-bottom: 1px dotted rgba(0,0,0,0.2);
          margin: 0 8px;
          position: relative;
          top: -4px;
        }

        .swd-row-value {
          color: var(--ink);
        }

        .swd-row-arrow {
          margin-left: 6px;
          opacity: 0.3;
        }

        /* Attribute Detail */
        .swd-detail-back {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          cursor: pointer;
          padding: 0.25rem 0;
          margin-bottom: 1rem;
          color: rgba(0,0,0,0.5);
          font-family: var(--mono);
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        .swd-detail-back:hover {
          color: var(--ink);
        }

        .swd-detail-title {
          font-family: var(--serif);
          font-size: 1.5rem;
          font-style: italic;
          margin-bottom: 1rem;
        }

        .swd-options {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .swd-option {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          border: 1px solid rgba(0,0,0,0.15);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .swd-option:hover {
          border-color: rgba(0,0,0,0.3);
        }

        .swd-option.selected {
          border-color: var(--ink);
          border-width: 2px;
        }

        .swd-option-swatch {
          width: 36px;
          height: 36px;
          border-radius: 6px;
          background: rgba(0,0,0,0.05);
          border: 1px solid rgba(0,0,0,0.1);
        }

        .swd-option-info {
          flex: 1;
        }

        .swd-option-name {
          font-family: var(--mono);
          font-size: 0.75rem;
        }

        .swd-option-price {
          font-family: var(--mono);
          font-size: 0.65rem;
          opacity: 0.5;
        }

        .swd-option-check {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 1.5px solid rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .swd-option.selected .swd-option-check {
          background: var(--ink);
          border-color: var(--ink);
          color: var(--bg);
        }

        /* Backdrop */
        .swd-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.2);
          z-index: 55;
        }

        /* Mobile handle */
        .swd-handle {
          width: 36px;
          height: 4px;
          background: rgba(0,0,0,0.15);
          border-radius: 2px;
          margin: 0.5rem auto;
        }
      `}</style>

      <div className="swd-container">
        {/* Sentence Rail - Always Visible */}
        <div className="swd-rail">
          <div className="swd-inner">
            <div className="swd-sentence">
              <span>This </span>
              <span style={{ fontStyle: 'italic' }}>{product.name}</span>
              <span> is </span>
              {tokens.map((token) => (
                <span key={token.id} className="sentence-glue">
                  {token.prefix ? <span className="swd-prefix">{token.prefix}{'\u00A0'}</span> : null}
                  <button
                    className={`swd-token ${activeToken?.id === token.id ? 'active' : ''}`}
                    onClick={() => handleTokenTap(token)}
                  >
                    {token.value}
                  </button>
                  <span> </span>
                </span>
              ))}
              <span>&nbsp;handles.</span>
            </div>

            <div className="swd-footer">
              <div className="swd-price" onClick={onOpenPrice}>£{totalPrice}</div>
              <div className="swd-actions">
                <button className="swd-btn swd-btn-secondary" onClick={onLoginRequest}>Save</button>
                <button className="swd-btn swd-btn-primary">Add to Cart</button>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Panel */}
        <AnimatePresence>
          {isDrawerOpen && (
            <>
              <motion.div
                className="swd-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeDrawer}
              />
              <motion.div
                className={`swd-drawer ${isMobile ? 'mobile' : 'desktop'}`}
                initial={isMobile ? { y: '100%' } : { x: '100%' }}
                animate={isMobile ? { y: 0 } : { x: 0 }}
                exit={isMobile ? { y: '100%' } : { x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              >
                {isMobile && <div className="swd-handle" />}
                
                <div className="swd-drawer-header">
                  <span className="swd-drawer-title">
                    {activeAttribute ? activeAttribute.label : 'Configuration'}
                  </span>
                  <button className="swd-drawer-close" onClick={closeDrawer}>
                    <CloseIcon />
                  </button>
                </div>

                <div className="swd-drawer-content">
                  {!activeAttribute ? (
                    /* Section List View */
                    componentSections.map(section => (
                      <div 
                        key={section.id} 
                        className={`swd-section ${activeSection === section.id ? 'highlighted' : ''}`}
                      >
                        <div className="swd-section-title">{section.label}</div>
                        {section.children?.filter(c => c.type === 'attribute').map(attr => (
                          <div
                            key={attr.id}
                            className="swd-row"
                            onClick={() => setActiveAttribute(attr)}
                          >
                            <span className="swd-row-label">{attr.label}</span>
                            <span className="swd-row-dots" />
                            <span className="swd-row-value">{getDisplayValue(attr, configuration)}</span>
                            <span className="swd-row-arrow"><ThinArrowRight /></span>
                          </div>
                        ))}
                      </div>
                    ))
                  ) : (
                    /* Attribute Detail View */
                    <>
                      <div className="swd-detail-back" onClick={() => setActiveAttribute(null)}>
                        ← Back
                      </div>
                      <div className="swd-detail-title">{activeAttribute.label}</div>
                      <div className="swd-options">
                        {activeAttribute.children?.filter(c => c.type === 'option').map(option => {
                          const isSelected = configuration.selections[activeAttribute.id]?.value === option.id ||
                            (!configuration.selections[activeAttribute.id] && option.default === true);
                          return (
                            <div
                              key={option.id}
                              className={`swd-option ${isSelected ? 'selected' : ''}`}
                              onClick={() => handleOptionSelect(activeAttribute.id, option.id)}
                            >
                              <div className="swd-option-swatch" />
                              <div className="swd-option-info">
                                <div className="swd-option-name">{option.label}</div>
                              </div>
                              {option.priceModifier !== undefined && option.priceModifier !== 0 && (
                                <div className="swd-option-price">
                                  {option.priceModifier > 0 ? '+' : ''}£{option.priceModifier}
                                </div>
                              )}
                              <div className="swd-option-check">
                                {isSelected && (
                                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                    <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                  </svg>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default SentenceWithDrawer;


