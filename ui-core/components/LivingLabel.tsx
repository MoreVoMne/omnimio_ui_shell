// LivingLabel.tsx - Unified Identity Tag + Sentence UI
// Three density states: 'label' (collapsed), 'sentence' (narrative), 'panel' (full controls)
// The sentence is always visible as header when in panel mode

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ConfigurationStateV2, Product, TreeNode } from '../types-tree';
import { findNodeById, getDisplayValue } from '../utils/treeHelpers';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type Density = 'label' | 'sentence' | 'panel';
type UserRole = 'customer' | 'merchant';

interface Token {
  id: string;
  nodeId: string;
  label: string;
  value: string;
  prefix?: string;
  linkedPart?: string;
  sectionId?: string; // Links to panel section
}

interface LivingLabelProps {
  configuration: ConfigurationStateV2;
  product: Product;
  onNodeClick: (nodeIdOrSelection: string) => void;
  totalPrice: number;
  onOpenPrice: () => void;
  onLoginRequest: () => void;
  role?: UserRole;
  initialDensity?: Density;
  onPartHighlight?: (partId: string | null) => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════════

const ChevronUp = () => (
  <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
    <path d="M11 7L6 2L1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronDown = () => (
  <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
    <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ThinArrowRight = () => (
  <svg width="8" height="10" viewBox="0 0 8 10" fill="none">
    <path d="M1 1L6 5L1 9" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ThinArrowLeft = () => (
  <svg width="8" height="10" viewBox="0 0 8 10" fill="none">
    <path d="M7 1L2 5L7 9" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

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

  // BODY
  const bodyNode = tree.find(n => n.id === 'node-body');
  if (bodyNode) {
    const materialNode = bodyNode.children?.find(c => c.id === 'node-body-material');
    const colorNode = materialNode?.children?.find(c => c.id === 'node-body-color');
    const finishNode = materialNode?.children?.find(c => c.id === 'node-body-finish');

    if (colorNode) {
      tokens.push({
        id: 'token-color',
        nodeId: colorNode.id,
        label: 'Color',
        value: getSelectedValue(colorNode, config).toLowerCase() || 'natural',
        prefix: 'in',
        linkedPart: 'mesh-body',
        sectionId: 'node-body',
      });
    }

    if (finishNode) {
      const val = getSelectedValue(finishNode, config);
      if (val && val.toLowerCase() !== 'natural') {
        tokens.push({
          id: 'token-finish',
          nodeId: finishNode.id,
          label: 'Finish',
          value: val.toLowerCase(),
          linkedPart: 'mesh-body',
          sectionId: 'node-body',
        });
      }
    }

    if (materialNode) {
      tokens.push({
        id: 'token-material',
        nodeId: materialNode.id,
        label: 'Material',
        value: getSelectedValue(materialNode, config).toLowerCase() || 'leather',
        linkedPart: 'mesh-body',
        sectionId: 'node-body',
      });
    }
  }

  // CLASP
  const claspNode = tree.find(n => n.id === 'node-clasp');
  if (claspNode) {
    const typeNode = claspNode.children?.find(c => c.id === 'node-clasp-type');
    const finishNode = typeNode?.children?.find(c => c.id === 'node-clasp-finish');

    if (typeNode) {
      tokens.push({
        id: 'token-clasp-type',
        nodeId: typeNode.id,
        label: 'Clasp',
        value: `${getSelectedValue(typeNode, config).toLowerCase()} clasp`,
        prefix: 'with',
        linkedPart: 'mesh-clasp',
        sectionId: 'node-clasp',
      });
    }

    if (finishNode) {
      tokens.push({
        id: 'token-clasp-finish',
        nodeId: finishNode.id,
        label: 'Hardware Finish',
        value: getSelectedValue(finishNode, config).toLowerCase(),
        prefix: 'in',
        linkedPart: 'mesh-clasp',
        sectionId: 'node-clasp',
      });
    }
  }

  // HANDLE
  const handleNode = tree.find(n => n.id === 'node-handle');
  if (handleNode) {
    const styleNode = handleNode.children?.find(c => c.id === 'node-handle-style');
    const configNode = styleNode?.children?.find(c => c.id === 'node-handle-config');

    if (styleNode) {
      const val = getSelectedValue(styleNode, config).toLowerCase()
        .replace('match body', 'matching')
        .replace('contrast leather', 'contrast');
      tokens.push({
        id: 'token-handle-style',
        nodeId: styleNode.id,
        label: 'Handle',
        value: val || 'leather',
        prefix: 'and',
        linkedPart: 'mesh-handle',
        sectionId: 'node-handle',
      });
    }

    if (configNode) {
      const val = getSelectedValue(configNode, config).toLowerCase();
      tokens.push({
        id: 'token-handle-config',
        nodeId: configNode.id,
        label: 'Config',
        value: val === 'double' ? 'double' : 'single',
        linkedPart: 'mesh-handle',
        sectionId: 'node-handle',
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
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const LivingLabel: React.FC<LivingLabelProps> = ({
  configuration,
  product,
  onNodeClick,
  totalPrice,
  onOpenPrice,
  onLoginRequest,
  role = 'customer',
  initialDensity,
  onPartHighlight,
}) => {
  // Default density based on role
  const defaultDensity: Density = initialDensity || (role === 'merchant' ? 'panel' : 'sentence');
  const [density, setDensity] = useState<Density>(defaultDensity);
  
  // Active token for inline editing
  const [activeToken, setActiveToken] = useState<Token | null>(null);
  const [activeNode, setActiveNode] = useState<TreeNode | null>(null);
  
  // Panel navigation state
  const [activePanelSection, setActivePanelSection] = useState<string | null>(null);
  const [activeAttributeNode, setActiveAttributeNode] = useState<TreeNode | null>(null);
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const trayRef = useRef<HTMLDivElement>(null);
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Build tokens
  const tokens = buildTokens(product.customizationTree, configuration);

  // Cycle density
  const cycleDensity = useCallback((direction: 'up' | 'down' = 'up') => {
    const order: Density[] = ['label', 'sentence', 'panel'];
    const currentIndex = order.indexOf(density);
    const nextIndex = direction === 'up' 
      ? Math.min(currentIndex + 1, order.length - 1)
      : Math.max(currentIndex - 1, 0);
    setDensity(order[nextIndex]);
    setActiveToken(null);
    setActiveNode(null);
  }, [density]);

  // Handle token tap
  const handleTokenTap = (token: Token) => {
    if (activeToken?.id === token.id) {
      setActiveToken(null);
      setActiveNode(null);
      return;
    }
    
    setActiveToken(token);
    const node = findNodeById(product.customizationTree, token.nodeId);
    setActiveNode(node || null);
    
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
      setActiveAttributeNode(null);
    }, 150);
  };

  // Close tray on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        trayRef.current && !trayRef.current.contains(e.target as Node) &&
        containerRef.current && !containerRef.current.contains(e.target as Node)
      ) {
        setActiveToken(null);
        setActiveNode(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get component sections for panel view
  const componentSections = product.customizationTree.filter(n => n.type === 'component');

  // Build summary for label view
  const labelSummary = `${tokens.find(t => t.id === 'token-color')?.value || 'Natural'} ${tokens.find(t => t.id === 'token-material')?.value || 'leather'}`;

  return (
    <>
      <style>{`

        .living-label {
          --bg: #F8F5F0;
          --ink: #1a1a1a;
          --accent: #C20000;
          --border: rgba(0, 0, 0, 0.12);
          --serif: 'PP Editorial Old', serif;
          --mono: 'JetBrains Mono', monospace;
          
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 50;
          pointer-events: none;
        }

        .living-label-inner {
          pointer-events: auto;
          background: var(--bg);
          border: 1px solid var(--ink);
          border-bottom: none;
          border-radius: 24px 24px 0 0;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @media (min-width: 640px) {
          .living-label {
            left: 50%;
            right: auto;
            transform: translateX(-50%);
            bottom: 1.5rem;
            max-width: 560px;
            width: calc(100% - 3rem);
          }
          
          .living-label-inner {
            border: 1px solid var(--ink);
            border-radius: 24px;
          }
        }

        /* ─────────────────────────────────────────────────────────────────────
           LABEL STATE (Collapsed)
        ───────────────────────────────────────────────────────────────────── */
        .label-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.875rem 1.25rem;
          cursor: pointer;
          gap: 1rem;
        }

        .label-bar:hover {
          background: rgba(0, 0, 0, 0.02);
        }

        .label-product {
          font-family: var(--serif);
          font-size: 1rem;
          font-style: italic;
          font-weight: 400;
          color: var(--ink);
          white-space: nowrap;
        }

        .label-summary {
          font-family: var(--mono);
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--ink);
          opacity: 0.5;
          flex: 1;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .label-price {
          font-family: var(--serif);
          font-size: 1.1rem;
          font-style: italic;
          color: var(--ink);
        }

        .label-toggle {
          background: none;
          border: none;
          padding: 0.5rem;
          margin: -0.5rem;
          cursor: pointer;
          color: var(--ink);
          opacity: 0.4;
          transition: opacity 0.2s;
        }

        .label-toggle:hover {
          opacity: 1;
        }

        /* ─────────────────────────────────────────────────────────────────────
           SENTENCE STATE
        ───────────────────────────────────────────────────────────────────── */
        .sentence-view {
          padding: 1.5rem 1.25rem;
        }

        @media (min-width: 640px) {
          .sentence-view {
            padding: 2rem 2rem;
          }
        }

        .sentence-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }

        .sentence-text {
          font-family: var(--serif);
          font-size: 1.1rem;
          font-weight: 300;
          line-height: 2;
          color: var(--ink);
        }

        @media (min-width: 640px) {
          .sentence-text {
            font-size: 1.3rem;
            line-height: 1.9;
          }
        }

        .sentence-text.compact {
          font-size: 0.95rem;
          line-height: 1.7;
          padding: 0.75rem 1rem;
          background: rgba(0, 0, 0, 0.02);
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .product-name {
          font-style: italic;
          font-weight: 400;
        }

        .sentence-token {
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

        .sentence-token:hover {
          border-bottom-color: rgba(194, 0, 0, 0.6);
        }

        .sentence-token.active {
          border-bottom-color: var(--accent);
          border-bottom-width: 2px;
          background: rgba(194, 0, 0, 0.04);
        }

        .sentence-prefix {
          font-weight: 300;
          color: rgba(26, 26, 26, 0.4);
        }

        /* ─────────────────────────────────────────────────────────────────────
           PANEL STATE (Full Controls)
        ───────────────────────────────────────────────────────────────────── */
        .panel-view {
          max-height: 70vh;
          overflow-y: auto;
        }

        .panel-tabs {
          display: flex;
          border-bottom: 1px solid var(--ink);
        }

        .panel-tab {
          flex: 1;
          background: transparent;
          border: none;
          border-right: 1px solid var(--ink);
          padding: 0.75rem 0.5rem;
          font-family: var(--mono);
          font-size: 0.65rem;
          font-weight: 400;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          color: var(--ink);
          opacity: 0.5;
          position: relative;
          transition: all 0.2s;
        }

        .panel-tab:last-child {
          border-right: none;
        }

        .panel-tab:hover {
          opacity: 0.8;
        }

        .panel-tab.active {
          opacity: 1;
          background: var(--bg);
        }

        .panel-tab.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--accent);
        }

        .panel-content {
          padding: 1.25rem;
        }

        /* Section titles */
        .section-title {
          font-family: var(--mono);
          font-size: 0.6rem;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--ink);
          margin-bottom: 0.5rem;
          padding-bottom: 3px;
          border-bottom: 1px solid var(--accent);
          display: inline-block;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .section-title:hover {
          opacity: 0.7;
        }

        .section-title.active {
          background: rgba(194, 0, 0, 0.05);
          padding: 3px 6px 3px 6px;
          margin-left: -6px;
          border-radius: 2px;
        }

        /* Tree rows */
        .tree-row {
          display: flex;
          align-items: baseline;
          font-family: var(--mono);
          font-size: 0.75rem;
          padding: 0.35rem 0;
          cursor: pointer;
          transition: background 0.15s;
          border-radius: 2px;
        }

        .tree-row:hover {
          background: rgba(0, 0, 0, 0.03);
        }

        .tree-row.highlighted {
          background: rgba(194, 0, 0, 0.06);
        }

        .tree-label {
          color: var(--ink);
          white-space: nowrap;
        }

        .tree-dots {
          flex: 1;
          border-bottom: 1px dotted var(--ink);
          margin: 0 8px;
          position: relative;
          top: -4px;
          opacity: 0.3;
        }

        .tree-value {
          color: var(--ink);
          white-space: nowrap;
        }

        .tree-arrow {
          margin-left: 6px;
          opacity: 0.3;
        }

        /* ─────────────────────────────────────────────────────────────────────
           OPTION TRAY (Floating)
        ───────────────────────────────────────────────────────────────────── */
        .option-tray {
          position: fixed;
          z-index: 100;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 1rem 1.25rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          pointer-events: auto;
          max-width: 400px;
          width: calc(100vw - 2rem);
        }

        .option-tray.desktop {
          left: 50%;
          transform: translateX(-50%);
        }

        .option-tray.mobile {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          width: 100%;
          max-width: 100%;
          border-radius: 20px 20px 0 0;
          padding-bottom: 2rem;
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
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border);
        }

        .tray-title {
          font-family: var(--mono);
          font-size: 0.6rem;
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
        }

        .tray-close:hover {
          opacity: 1;
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
          border: 1px solid var(--border);
          border-radius: 100px;
          cursor: pointer;
          transition: all 0.15s;
          font-family: var(--mono);
          font-size: 0.68rem;
          font-weight: 300;
          color: var(--ink);
        }

        .option-chip:hover {
          border-color: rgba(0, 0, 0, 0.4);
          background: rgba(0, 0, 0, 0.02);
        }

        .option-chip.selected {
          background: var(--ink);
          border-color: var(--ink);
          color: var(--bg);
          font-weight: 400;
        }

        .option-swatch {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }

        .option-chip.selected .option-swatch {
          border-color: rgba(255, 255, 255, 0.3);
        }

        .price-badge {
          font-size: 0.55rem;
          opacity: 0.5;
        }

        /* ─────────────────────────────────────────────────────────────────────
           FOOTER (Always visible)
        ───────────────────────────────────────────────────────────────────── */
        .label-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.25rem;
          border-top: 1px solid var(--border);
          gap: 1rem;
        }

        @media (max-width: 639px) {
          .label-footer {
            flex-direction: column;
            gap: 0.75rem;
          }
        }

        .footer-left {
          display: flex;
          align-items: baseline;
          gap: 0.75rem;
        }

        @media (max-width: 639px) {
          .footer-left {
            width: 100%;
            justify-content: space-between;
          }
        }

        .footer-price {
          font-family: var(--serif);
          font-size: 1.4rem;
          font-style: italic;
          font-weight: 300;
          color: var(--ink);
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .footer-price:hover {
          opacity: 0.7;
        }

        .footer-meta {
          font-family: var(--mono);
          font-size: 0.55rem;
          color: rgba(26, 26, 26, 0.4);
          letter-spacing: 0.03em;
        }

        .footer-actions {
          display: flex;
          gap: 0.5rem;
        }

        @media (max-width: 639px) {
          .footer-actions {
            width: 100%;
          }
        }

        .btn {
          padding: 0.75rem 1.25rem;
          font-family: var(--mono);
          font-size: 0.6rem;
          font-weight: 400;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          border: 1px solid var(--ink);
          cursor: pointer;
          transition: all 0.2s;
          border-radius: 0;
        }

        @media (max-width: 639px) {
          .btn {
            flex: 1;
            padding: 0.9rem 1rem;
          }
        }

        .btn-primary {
          background: var(--ink);
          color: var(--bg);
        }

        .btn-primary:hover {
          background: #000;
        }

        .btn-secondary {
          background: transparent;
          color: var(--ink);
        }

        .btn-secondary:hover {
          background: rgba(0, 0, 0, 0.04);
        }

        /* ─────────────────────────────────────────────────────────────────────
           DENSITY TOGGLE
        ───────────────────────────────────────────────────────────────────── */
        .density-toggle {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          display: flex;
          gap: 2px;
          background: rgba(0, 0, 0, 0.04);
          border-radius: 4px;
          padding: 2px;
        }

        .density-btn {
          background: transparent;
          border: none;
          padding: 0.35rem 0.5rem;
          cursor: pointer;
          opacity: 0.4;
          transition: all 0.2s;
          border-radius: 3px;
        }

        .density-btn:hover {
          opacity: 0.7;
        }

        .density-btn.active {
          background: var(--bg);
          opacity: 1;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .density-icon {
          width: 14px;
          height: 10px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .density-icon span {
          height: 2px;
          background: var(--ink);
          border-radius: 1px;
        }

        .density-icon.label span:nth-child(2),
        .density-icon.label span:nth-child(3) {
          display: none;
        }

        .density-icon.sentence span:nth-child(3) {
          width: 60%;
        }

        .density-icon.panel span:nth-child(2) {
          width: 80%;
        }

        .density-icon.panel span:nth-child(3) {
          width: 60%;
        }

        /* ─────────────────────────────────────────────────────────────────────
           ATTRIBUTE DETAIL VIEW
        ───────────────────────────────────────────────────────────────────── */
        .attribute-detail {
          padding: 1rem;
        }

        .attribute-back {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          cursor: pointer;
          padding: 0.25rem 0;
          margin-bottom: 1rem;
          color: rgba(0, 0, 0, 0.5);
          transition: color 0.2s;
        }

        .attribute-back:hover {
          color: var(--ink);
        }

        .attribute-back-text {
          font-family: var(--mono);
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
        }

        .attribute-title {
          font-family: var(--serif);
          font-size: 1.5rem;
          font-style: italic;
          margin-bottom: 0.25rem;
        }

        .attribute-desc {
          font-family: var(--mono);
          font-size: 0.7rem;
          color: rgba(0, 0, 0, 0.5);
          margin-bottom: 1.25rem;
        }

        .attribute-options {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .attribute-option {
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 0.75rem;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .attribute-option:hover {
          border-color: rgba(0, 0, 0, 0.3);
          background: rgba(0, 0, 0, 0.01);
        }

        .attribute-option.selected {
          border-color: var(--ink);
          border-width: 2px;
        }

        .attribute-option-swatch {
          width: 40px;
          height: 40px;
          border-radius: 6px;
          background: rgba(0, 0, 0, 0.05);
          border: 1px solid var(--border);
          flex-shrink: 0;
        }

        .attribute-option-info {
          flex: 1;
        }

        .attribute-option-name {
          font-family: var(--mono);
          font-size: 0.75rem;
          font-weight: 400;
        }

        .attribute-option-desc {
          font-family: var(--serif);
          font-size: 0.7rem;
          font-style: italic;
          opacity: 0.5;
          margin-top: 2px;
        }

        .attribute-option-price {
          font-family: var(--mono);
          font-size: 0.65rem;
          opacity: 0.5;
        }

        .attribute-option-check {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 1.5px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .attribute-option.selected .attribute-option-check {
          background: var(--ink);
          border-color: var(--ink);
          color: var(--bg);
        }
      `}</style>

      <div className="living-label" ref={containerRef}>
        <motion.div 
          className="living-label-inner"
          layout
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* ══════════════════════════════════════════════════════════════════
              LABEL STATE (Collapsed Bar)
          ══════════════════════════════════════════════════════════════════ */}
          <AnimatePresence mode="wait">
            {density === 'label' && (
              <motion.div
                key="label"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="label-bar"
                onClick={() => cycleDensity('up')}
              >
                <span className="label-product">{product.name}</span>
                <span className="label-summary">{labelSummary}</span>
                <span className="label-price">£{totalPrice}</span>
                <button className="label-toggle" onClick={(e) => { e.stopPropagation(); cycleDensity('up'); }}>
                  <ChevronUp />
                </button>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                SENTENCE STATE
            ══════════════════════════════════════════════════════════════════ */}
            {density === 'sentence' && (
              <motion.div
                key="sentence"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="sentence-view"
              >
                {/* Density Toggle */}
                <div className="density-toggle">
                  <button 
                    className={`density-btn ${density === 'label' ? 'active' : ''}`}
                    onClick={() => setDensity('label')}
                    title="Collapse"
                  >
                    <div className="density-icon label">
                      <span style={{ width: '100%' }} />
                      <span />
                      <span />
                    </div>
                  </button>
                  <button 
                    className={`density-btn ${density === 'sentence' ? 'active' : ''}`}
                    onClick={() => setDensity('sentence')}
                    title="Sentence"
                  >
                    <div className="density-icon sentence">
                      <span style={{ width: '100%' }} />
                      <span style={{ width: '85%' }} />
                      <span />
                    </div>
                  </button>
                  <button 
                    className={`density-btn ${density === 'panel' ? 'active' : ''}`}
                    onClick={() => setDensity('panel')}
                    title="Full Panel"
                  >
                    <div className="density-icon panel">
                      <span style={{ width: '100%' }} />
                      <span />
                      <span />
                    </div>
                  </button>
                </div>

                {/* Sentence */}
                <div className="sentence-text">
                  <span>This </span>
                  <span className="product-name">{product.name}</span>
                  <span> is </span>
                  
                  {tokens.map((token, i) => (
                    <React.Fragment key={token.id}>
                      {token.prefix && <span className="sentence-prefix"> {token.prefix} </span>}
                      <button
                        className={`sentence-token ${activeToken?.id === token.id ? 'active' : ''}`}
                        onClick={() => handleTokenTap(token)}
                      >
                        {token.value}
                      </button>
                      {i < tokens.length - 1 && !tokens[i + 1].prefix && <span> </span>}
                    </React.Fragment>
                  ))}
                  <span> handles.</span>
                </div>

                {/* Footer */}
                <div className="label-footer" style={{ margin: '0 -1.25rem -1.5rem', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                  <div className="footer-left">
                    <div className="footer-price" onClick={onOpenPrice}>£{totalPrice}</div>
                    <div className="footer-meta">Lead time 10–14 days</div>
                  </div>
                  <div className="footer-actions">
                    <button className="btn btn-secondary" onClick={onLoginRequest}>Save</button>
                    <button className="btn btn-primary">Add to Cart</button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                PANEL STATE (Full Controls)
            ══════════════════════════════════════════════════════════════════ */}
            {density === 'panel' && (
              <motion.div
                key="panel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="panel-view"
              >
                {/* Tabs */}
                <div className="panel-tabs">
                  {['Customize', 'Info', 'Gallery'].map(tab => (
                    <button key={tab} className={`panel-tab ${tab === 'Customize' ? 'active' : ''}`}>
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Sentence as Header */}
                <div className="sentence-text compact" style={{ margin: '1rem 1rem 0' }}>
                  <span>This </span>
                  <span className="product-name">{product.name}</span>
                  <span> is </span>
                  {tokens.slice(0, 4).map((token, i) => (
                    <React.Fragment key={token.id}>
                      {token.prefix && <span className="sentence-prefix"> {token.prefix} </span>}
                      <button
                        className={`sentence-token ${activeToken?.id === token.id ? 'active' : ''}`}
                        onClick={() => handleTokenTap(token)}
                      >
                        {token.value}
                      </button>
                    </React.Fragment>
                  ))}
                  <span>...</span>
                </div>

                {/* Density Toggle */}
                <div className="density-toggle" style={{ top: '3.5rem' }}>
                  <button 
                    className={`density-btn ${density === 'label' ? 'active' : ''}`}
                    onClick={() => setDensity('label')}
                  >
                    <div className="density-icon label">
                      <span style={{ width: '100%' }} />
                      <span /><span />
                    </div>
                  </button>
                  <button 
                    className={`density-btn ${density === 'sentence' ? 'active' : ''}`}
                    onClick={() => setDensity('sentence')}
                  >
                    <div className="density-icon sentence">
                      <span style={{ width: '100%' }} />
                      <span style={{ width: '85%' }} /><span />
                    </div>
                  </button>
                  <button 
                    className={`density-btn ${density === 'panel' ? 'active' : ''}`}
                    onClick={() => setDensity('panel')}
                  >
                    <div className="density-icon panel">
                      <span style={{ width: '100%' }} />
                      <span /><span />
                    </div>
                  </button>
                </div>

                {/* Content */}
                {!activeAttributeNode ? (
                  <div className="panel-content">
                    {componentSections.map(section => (
                      <div key={section.id} style={{ marginBottom: '1.25rem' }}>
                        <div 
                          className={`section-title ${activePanelSection === section.id ? 'active' : ''}`}
                          onClick={() => setActivePanelSection(activePanelSection === section.id ? null : section.id)}
                        >
                          {section.label}
                        </div>
                        
                        {section.children?.filter(c => c.type === 'attribute').map(attr => {
                          const isHighlighted = tokens.some(t => t.nodeId === attr.id && t.id === activeToken?.id);
                          return (
                            <div 
                              key={attr.id} 
                              className={`tree-row ${isHighlighted ? 'highlighted' : ''}`}
                              onClick={() => setActiveAttributeNode(attr)}
                            >
                              <span className="tree-label">{attr.label}</span>
                              <span className="tree-dots" />
                              <span className="tree-value">{getDisplayValue(attr, configuration)}</span>
                              <span className="tree-arrow"><ThinArrowRight /></span>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Attribute Detail View */
                  <div className="attribute-detail">
                    <div className="attribute-back" onClick={() => setActiveAttributeNode(null)}>
                      <ThinArrowLeft />
                      <span className="attribute-back-text">Back</span>
                    </div>
                    
                    <div className="attribute-title">{activeAttributeNode.label}</div>
                    {activeAttributeNode.description && (
                      <div className="attribute-desc">{activeAttributeNode.description}</div>
                    )}
                    
                    <div className="attribute-options">
                      {activeAttributeNode.children?.filter(c => c.type === 'option').map(option => {
                        const isSelected = configuration.selections[activeAttributeNode.id]?.value === option.id ||
                          (!configuration.selections[activeAttributeNode.id] && option.default === true);
                        const swatchColor = getSwatchColor(option.label);
                        
                        return (
                          <div
                            key={option.id}
                            className={`attribute-option ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleOptionSelect(activeAttributeNode.id, option.id)}
                          >
                            <div 
                              className="attribute-option-swatch"
                              style={swatchColor ? { background: swatchColor } : {}}
                            />
                            <div className="attribute-option-info">
                              <div className="attribute-option-name">{option.label}</div>
                              {option.description && (
                                <div className="attribute-option-desc">{option.description}</div>
                              )}
                            </div>
                            {option.priceModifier !== undefined && option.priceModifier !== 0 && (
                              <div className="attribute-option-price">
                                {option.priceModifier > 0 ? '+' : ''}£{option.priceModifier}
                              </div>
                            )}
                            <div className="attribute-option-check">
                              {isSelected && (
                                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                  <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="label-footer">
                  <div className="footer-left">
                    <div className="footer-price" onClick={onOpenPrice}>£{totalPrice}</div>
                    <div className="footer-meta">Lead time 10–14 days</div>
                  </div>
                  <div className="footer-actions">
                    <button className="btn btn-secondary" onClick={onLoginRequest}>Save</button>
                    <button className="btn btn-primary">Add to Cart</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════════
            FLOATING OPTION TRAY
        ══════════════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {activeToken && activeNode && density !== 'panel' && (
            <motion.div
              ref={trayRef}
              className={`option-tray ${isMobile ? 'mobile' : 'desktop'}`}
              initial={{ opacity: 0, y: isMobile ? 100 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: isMobile ? 100 : 10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={!isMobile ? { bottom: containerRef.current ? containerRef.current.offsetHeight + 16 : 200 } : undefined}
            >
              {isMobile && <div className="tray-handle" />}
              
              <div className="tray-header">
                <span className="tray-title">{activeToken.label}</span>
                <button className="tray-close" onClick={() => { setActiveToken(null); setActiveNode(null); }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
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
                      {swatchColor && <span className="option-swatch" style={{ background: swatchColor }} />}
                      <span>{option.label}</span>
                      {option.priceModifier !== undefined && option.priceModifier !== 0 && (
                        <span className="price-badge">{option.priceModifier > 0 ? '+' : ''}£{option.priceModifier}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default LivingLabel;


