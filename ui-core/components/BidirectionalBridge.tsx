// BidirectionalBridge.tsx - CONCEPT 5: "The Bidirectional Bridge"
// Sentence and Panel coexist side by side with deep linking between them.
// Hovering elements in one highlights corresponding elements in the other.
// A draggable divider lets you adjust the balance between them.

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
  sectionId: string;
  linkedPart?: string;
}

interface BidirectionalBridgeProps {
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
        id: 'token-color', nodeId: colorNode.id, label: 'Color',
        value: getSelectedValue(colorNode, config).toLowerCase() || 'natural',
        prefix: 'in', sectionId: 'node-body', linkedPart: 'mesh-body',
      });
    }
    if (materialNode) {
      tokens.push({
        id: 'token-material', nodeId: materialNode.id, label: 'Material',
        value: getSelectedValue(materialNode, config).toLowerCase() || 'leather',
        sectionId: 'node-body', linkedPart: 'mesh-body',
      });
    }
  }

  const claspNode = tree.find(n => n.id === 'node-clasp');
  if (claspNode) {
    const typeNode = claspNode.children?.find(c => c.id === 'node-clasp-type');
    if (typeNode) {
      tokens.push({
        id: 'token-clasp', nodeId: typeNode.id, label: 'Clasp',
        value: `${getSelectedValue(typeNode, config).toLowerCase()} clasp`,
        prefix: 'with', sectionId: 'node-clasp', linkedPart: 'mesh-clasp',
      });
    }
  }

  const handleNode = tree.find(n => n.id === 'node-handle');
  if (handleNode) {
    const styleNode = handleNode.children?.find(c => c.id === 'node-handle-style');
    if (styleNode) {
      tokens.push({
        id: 'token-handle', nodeId: styleNode.id, label: 'Handle',
        value: getSelectedValue(styleNode, config).toLowerCase().replace('match body', 'matching') || 'leather',
        prefix: 'and', sectionId: 'node-handle', linkedPart: 'mesh-handle',
      });
    }
  }

  return tokens;
}

function getSwatchColor(label: string): string | null {
  const l = label.toLowerCase();
  if (l.includes('black')) return '#2C2C2C';
  if (l.includes('navy')) return '#1A2B4A';
  if (l.includes('gold') || l.includes('brass')) return '#D4AF37';
  if (l.includes('natural')) return '#E8DFD0';
  if (l.includes('pebbled')) return '#E2D8CC';
  return null;
}

const ThinArrowRight = () => (
  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
    <path d="M2 1L6 4L2 7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const BidirectionalBridge: React.FC<BidirectionalBridgeProps> = ({
  configuration,
  product,
  onNodeClick,
  totalPrice,
  onOpenPrice,
  onLoginRequest,
  onPartHighlight,
}) => {
  // Split position (percentage for sentence vs panel)
  const [splitRatio, setSplitRatio] = useState(55); // 55% sentence, 45% panel
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Bidirectional highlight state
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);
  
  // Active attribute for detail view
  const [activeAttribute, setActiveAttribute] = useState<TreeNode | null>(null);
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const tokens = buildTokens(product.customizationTree, configuration);
  const componentSections = product.customizationTree.filter(n => n.type === 'component');

  // Drag handler for split
  const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSplitRatio(Math.min(Math.max(percentage, 30), 70));
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      setSplitRatio(Math.min(Math.max(percentage, 30), 70));
    };
    
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  // Handle token hover (highlight in panel)
  const handleTokenHover = (token: Token | null) => {
    if (token) {
      setHighlightedNodeId(token.nodeId);
      setHighlightedSection(token.sectionId);
      if (onPartHighlight && token.linkedPart) onPartHighlight(token.linkedPart);
    } else {
      setHighlightedNodeId(null);
      setHighlightedSection(null);
      if (onPartHighlight) onPartHighlight(null);
    }
  };

  // Handle panel row hover (highlight in sentence)
  const handleRowHover = (attr: TreeNode | null, sectionId: string | null) => {
    if (attr) {
      setHighlightedNodeId(attr.id);
      setHighlightedSection(sectionId);
    } else {
      setHighlightedNodeId(null);
      setHighlightedSection(null);
    }
  };

  const handleOptionSelect = (nodeId: string, optionId: string) => {
    onNodeClick(`${nodeId}:${optionId}`);
    setActiveAttribute(null);
  };

  return (
    <>
      <style>{`

        .bridge-container {
          --bg: #F8F5F0;
          --ink: #1a1a1a;
          --accent: #C20000;
          --highlight: rgba(194, 0, 0, 0.08);
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

        @media (min-width: 768px) {
          .bridge-container {
            left: 50%;
            right: auto;
            transform: translateX(-50%);
            bottom: 1.5rem;
            max-width: 800px;
            width: calc(100% - 3rem);
            border: 1px solid var(--ink);
            border-radius: 20px;
            overflow: hidden;
          }
        }

        /* Mobile: Stacked layout */
        .bridge-mobile {
          display: flex;
          flex-direction: column;
        }

        .bridge-mobile .bridge-sentence {
          padding: 1.25rem;
          border-bottom: 1px solid rgba(0,0,0,0.1);
        }

        .bridge-mobile .bridge-panel {
          max-height: 200px;
          overflow-y: auto;
          padding: 1rem;
        }

        /* Desktop: Side by side with draggable divider */
        .bridge-desktop {
          display: flex;
          min-height: 180px;
        }

        .bridge-sentence-wrapper {
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 1.5rem;
        }

        .bridge-divider {
          width: 12px;
          background: rgba(0,0,0,0.03);
          cursor: col-resize;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
          position: relative;
          flex-shrink: 0;
        }

        .bridge-divider:hover {
          background: rgba(0,0,0,0.06);
        }

        .bridge-divider-line {
          width: 2px;
          height: 32px;
          background: rgba(0,0,0,0.15);
          border-radius: 1px;
          transition: all 0.2s;
        }

        .bridge-divider:hover .bridge-divider-line {
          background: rgba(0,0,0,0.3);
          height: 48px;
        }

        .bridge-panel-wrapper {
          overflow-y: auto;
          padding: 1rem;
          border-left: 1px solid rgba(0,0,0,0.08);
        }

        /* Sentence Styles */
        .bridge-sentence-text {
          font-family: var(--serif);
          font-size: 1.1rem;
          font-weight: 300;
          line-height: 1.9;
          color: var(--ink);
        }

        @media (min-width: 768px) {
          .bridge-sentence-text {
            font-size: 1.2rem;
          }
        }

        .bridge-prefix {
          color: rgba(26, 26, 26, 0.4);
        }

        .bridge-token {
          display: inline;
          background: transparent;
          border: none;
          padding: 0 0.1em;
          cursor: pointer;
          font-family: inherit;
          font-size: inherit;
          font-weight: 400;
          color: var(--ink);
          border-bottom: 1.5px solid rgba(194, 0, 0, 0.25);
          transition: all 0.2s;
        }

        .bridge-token:hover,
        .bridge-token.highlighted {
          border-bottom-color: var(--accent);
          background: var(--highlight);
        }

        /* Panel Styles */
        .bridge-section {
          margin-bottom: 1rem;
        }

        .bridge-section:last-child {
          margin-bottom: 0;
        }

        .bridge-section-title {
          font-family: var(--mono);
          font-size: 0.55rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-bottom: 0.35rem;
          color: rgba(26, 26, 26, 0.5);
          padding: 2px 0;
          border-bottom: 1px solid var(--accent);
          display: inline-block;
          transition: all 0.2s;
        }

        .bridge-section.highlighted .bridge-section-title {
          background: var(--highlight);
          padding: 2px 6px;
          margin-left: -6px;
          border-radius: 2px;
        }

        .bridge-row {
          display: flex;
          align-items: baseline;
          font-family: var(--mono);
          font-size: 0.7rem;
          padding: 0.3rem 0.25rem;
          cursor: pointer;
          border-radius: 3px;
          transition: all 0.15s;
          margin: 0 -0.25rem;
        }

        .bridge-row:hover {
          background: rgba(0,0,0,0.03);
        }

        .bridge-row.highlighted {
          background: var(--highlight);
        }

        .bridge-row-label {
          color: var(--ink);
          white-space: nowrap;
        }

        .bridge-row-dots {
          flex: 1;
          border-bottom: 1px dotted rgba(0,0,0,0.15);
          margin: 0 6px;
          position: relative;
          top: -3px;
        }

        .bridge-row-value {
          color: var(--ink);
          white-space: nowrap;
        }

        .bridge-row-arrow {
          margin-left: 4px;
          opacity: 0.3;
        }

        /* Options Detail View */
        .bridge-detail {
          padding: 0.5rem 0;
        }

        .bridge-detail-back {
          font-family: var(--mono);
          font-size: 0.55rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(0,0,0,0.4);
          cursor: pointer;
          margin-bottom: 0.5rem;
          display: inline-block;
        }

        .bridge-detail-back:hover {
          color: var(--ink);
        }

        .bridge-detail-title {
          font-family: var(--serif);
          font-size: 1rem;
          font-style: italic;
          margin-bottom: 0.75rem;
        }

        .bridge-options {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }

        .bridge-option {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.4rem 0.65rem;
          background: transparent;
          border: 1px solid rgba(0,0,0,0.12);
          border-radius: 100px;
          cursor: pointer;
          transition: all 0.15s;
          font-family: var(--mono);
          font-size: 0.6rem;
          color: var(--ink);
        }

        .bridge-option:hover {
          border-color: rgba(0,0,0,0.3);
        }

        .bridge-option.selected {
          background: var(--ink);
          border-color: var(--ink);
          color: var(--bg);
        }

        .bridge-option-swatch {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: 1px solid rgba(0,0,0,0.1);
        }

        .bridge-option.selected .bridge-option-swatch {
          border-color: rgba(255,255,255,0.3);
        }

        /* Footer */
        .bridge-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1.25rem;
          border-top: 1px solid rgba(0,0,0,0.08);
          gap: 1rem;
          flex-wrap: wrap;
        }

        .bridge-price {
          font-family: var(--serif);
          font-size: 1.3rem;
          font-style: italic;
          cursor: pointer;
        }

        .bridge-actions {
          display: flex;
          gap: 0.5rem;
        }

        .bridge-btn {
          padding: 0.6rem 1rem;
          font-family: var(--mono);
          font-size: 0.55rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          border: 1px solid var(--ink);
          cursor: pointer;
          transition: all 0.2s;
        }

        .bridge-btn-primary {
          background: var(--ink);
          color: var(--bg);
        }

        .bridge-btn-secondary {
          background: transparent;
          color: var(--ink);
        }
      `}</style>

      <div className="bridge-container" ref={containerRef}>
        {isMobile ? (
          /* Mobile: Stacked Layout */
          <div className="bridge-mobile">
            <div className="bridge-sentence">
              <div className="bridge-sentence-text">
                <span>This </span>
                <span style={{ fontStyle: 'italic' }}>{product.name}</span>
                <span> is </span>
                {tokens.map((token) => (
                  <React.Fragment key={token.id}>
                    {token.prefix && <span className="bridge-prefix"> {token.prefix} </span>}
                    <button
                      className={`bridge-token ${highlightedNodeId === token.nodeId ? 'highlighted' : ''}`}
                      onMouseEnter={() => handleTokenHover(token)}
                      onMouseLeave={() => handleTokenHover(null)}
                      onClick={() => {
                        const node = findNodeById(product.customizationTree, token.nodeId);
                        if (node) setActiveAttribute(node);
                      }}
                    >
                      {token.value}
                    </button>
                  </React.Fragment>
                ))}
                <span> handles.</span>
              </div>
            </div>

            <div className="bridge-panel">
              {!activeAttribute ? (
                componentSections.map(section => (
                  <div key={section.id} className={`bridge-section ${highlightedSection === section.id ? 'highlighted' : ''}`}>
                    <div className="bridge-section-title">{section.label}</div>
                    {section.children?.filter(c => c.type === 'attribute').map(attr => (
                      <div
                        key={attr.id}
                        className={`bridge-row ${highlightedNodeId === attr.id ? 'highlighted' : ''}`}
                        onMouseEnter={() => handleRowHover(attr, section.id)}
                        onMouseLeave={() => handleRowHover(null, null)}
                        onClick={() => setActiveAttribute(attr)}
                      >
                        <span className="bridge-row-label">{attr.label}</span>
                        <span className="bridge-row-dots" />
                        <span className="bridge-row-value">{getDisplayValue(attr, configuration)}</span>
                        <span className="bridge-row-arrow"><ThinArrowRight /></span>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div className="bridge-detail">
                  <div className="bridge-detail-back" onClick={() => setActiveAttribute(null)}>← Back</div>
                  <div className="bridge-detail-title">{activeAttribute.label}</div>
                  <div className="bridge-options">
                    {activeAttribute.children?.filter(c => c.type === 'option').map(option => {
                      const isSelected = configuration.selections[activeAttribute.id]?.value === option.id ||
                        (!configuration.selections[activeAttribute.id] && option.default === true);
                      const swatchColor = getSwatchColor(option.label);
                      return (
                        <button
                          key={option.id}
                          className={`bridge-option ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleOptionSelect(activeAttribute.id, option.id)}
                        >
                          {swatchColor && <span className="bridge-option-swatch" style={{ background: swatchColor }} />}
                          <span>{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Desktop: Side by Side with Draggable Divider */
          <div className="bridge-desktop">
            <div className="bridge-sentence-wrapper" style={{ width: `${splitRatio}%` }}>
              <div className="bridge-sentence-text">
                <span>This </span>
                <span style={{ fontStyle: 'italic' }}>{product.name}</span>
                <span> is </span>
                {tokens.map((token) => (
                  <React.Fragment key={token.id}>
                    {token.prefix && <span className="bridge-prefix"> {token.prefix} </span>}
                    <button
                      className={`bridge-token ${highlightedNodeId === token.nodeId ? 'highlighted' : ''}`}
                      onMouseEnter={() => handleTokenHover(token)}
                      onMouseLeave={() => handleTokenHover(null)}
                      onClick={() => {
                        const node = findNodeById(product.customizationTree, token.nodeId);
                        if (node) setActiveAttribute(node);
                      }}
                    >
                      {token.value}
                    </button>
                  </React.Fragment>
                ))}
                <span> handles.</span>
              </div>
            </div>

            <div className="bridge-divider" onMouseDown={() => setIsDragging(true)}>
              <div className="bridge-divider-line" />
            </div>

            <div className="bridge-panel-wrapper" style={{ width: `${100 - splitRatio}%` }}>
              {!activeAttribute ? (
                componentSections.map(section => (
                  <div key={section.id} className={`bridge-section ${highlightedSection === section.id ? 'highlighted' : ''}`}>
                    <div className="bridge-section-title">{section.label}</div>
                    {section.children?.filter(c => c.type === 'attribute').map(attr => (
                      <div
                        key={attr.id}
                        className={`bridge-row ${highlightedNodeId === attr.id ? 'highlighted' : ''}`}
                        onMouseEnter={() => handleRowHover(attr, section.id)}
                        onMouseLeave={() => handleRowHover(null, null)}
                        onClick={() => setActiveAttribute(attr)}
                      >
                        <span className="bridge-row-label">{attr.label}</span>
                        <span className="bridge-row-dots" />
                        <span className="bridge-row-value">{getDisplayValue(attr, configuration)}</span>
                        <span className="bridge-row-arrow"><ThinArrowRight /></span>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div className="bridge-detail">
                  <div className="bridge-detail-back" onClick={() => setActiveAttribute(null)}>← Back</div>
                  <div className="bridge-detail-title">{activeAttribute.label}</div>
                  <div className="bridge-options">
                    {activeAttribute.children?.filter(c => c.type === 'option').map(option => {
                      const isSelected = configuration.selections[activeAttribute.id]?.value === option.id ||
                        (!configuration.selections[activeAttribute.id] && option.default === true);
                      const swatchColor = getSwatchColor(option.label);
                      return (
                        <button
                          key={option.id}
                          className={`bridge-option ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleOptionSelect(activeAttribute.id, option.id)}
                        >
                          {swatchColor && <span className="bridge-option-swatch" style={{ background: swatchColor }} />}
                          <span>{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bridge-footer">
          <div className="bridge-price" onClick={onOpenPrice}>£{totalPrice}</div>
          <div className="bridge-actions">
            <button className="bridge-btn bridge-btn-secondary" onClick={onLoginRequest}>Save</button>
            <button className="bridge-btn bridge-btn-primary">Add to Cart</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default BidirectionalBridge;


