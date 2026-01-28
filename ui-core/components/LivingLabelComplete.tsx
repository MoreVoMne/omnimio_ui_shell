// LivingLabelComplete.tsx - Full unified component with Info & Community
// Three density states + three content modes (Configure, Info, Community)
// Uses "flip" metaphor - like reading the back of a product label

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfigurationStateV2, Product, TreeNode } from '../types-tree';
import { findNodeById, getDisplayValue } from '../utils/treeHelpers';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type Density = 'label' | 'sentence' | 'panel';
type ContentMode = 'configure' | 'info' | 'community';
type UserRole = 'customer' | 'merchant';

interface Token {
  id: string;
  nodeId: string;
  label: string;
  value: string;
  prefix?: string;
  linkedPart?: string;
  sectionId?: string;
}

interface LivingLabelCompleteProps {
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

const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1"/>
    <path d="M8 7V11M8 5V5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const HeartIcon = ({ filled = false }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill={filled ? "currentColor" : "none"}>
    <path d="M8 14S1 9.5 1 5.5C1 3 3 1 5.5 1C7 1 8 2 8 2S9 1 10.5 1C13 1 15 3 15 5.5C15 9.5 8 14 8 14Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
  </svg>
);

const GalleryIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="3" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1"/>
    <rect x="5" y="1" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1" fill="var(--bg)"/>
  </svg>
);

const ConfigureIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="4" cy="8" r="2" stroke="currentColor" strokeWidth="1"/>
    <circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth="1"/>
    <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1"/>
    <path d="M6 8H14M10 4H2M10 12H2" stroke="currentColor" strokeWidth="1"/>
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

  const bodyNode = tree.find(n => n.id === 'node-body');
  if (bodyNode) {
    const materialNode = bodyNode.children?.find(c => c.id === 'node-body-material');
    const colorNode = materialNode?.children?.find(c => c.id === 'node-body-color');

    if (colorNode) {
      tokens.push({
        id: 'token-color', nodeId: colorNode.id, label: 'Color',
        value: getSelectedValue(colorNode, config).toLowerCase() || 'natural',
        prefix: 'in', linkedPart: 'mesh-body', sectionId: 'node-body',
      });
    }
    if (materialNode) {
      tokens.push({
        id: 'token-material', nodeId: materialNode.id, label: 'Material',
        value: getSelectedValue(materialNode, config).toLowerCase() || 'leather',
        linkedPart: 'mesh-body', sectionId: 'node-body',
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
        prefix: 'with', linkedPart: 'mesh-clasp', sectionId: 'node-clasp',
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
        prefix: 'and', linkedPart: 'mesh-handle', sectionId: 'node-handle',
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

// Mock community data
const communityDesigns = [
  { id: 1, name: 'Midnight Luxe', author: '@elena.v', likes: 234, liked: false },
  { id: 2, name: 'Coastal Breeze', author: '@marcus.d', likes: 189, liked: true },
  { id: 3, name: 'Urban Charcoal', author: '@sophie.k', likes: 156, liked: false },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const LivingLabelComplete: React.FC<LivingLabelCompleteProps> = ({
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
  const defaultDensity: Density = initialDensity || (role === 'merchant' ? 'panel' : 'sentence');
  const [density, setDensity] = useState<Density>(defaultDensity);
  const [contentMode, setContentMode] = useState<ContentMode>('configure');
  
  const [activeToken, setActiveToken] = useState<Token | null>(null);
  const [activeNode, setActiveNode] = useState<TreeNode | null>(null);
  const [activeAttributeNode, setActiveAttributeNode] = useState<TreeNode | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const trayRef = useRef<HTMLDivElement>(null);
  
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const tokens = buildTokens(product.customizationTree, configuration);
  const componentSections = product.customizationTree.filter(n => n.type === 'component');

  const labelSummary = `${tokens.find(t => t.id === 'token-color')?.value || 'Natural'} ${tokens.find(t => t.id === 'token-material')?.value || 'leather'}`;

  const handleTokenTap = (token: Token) => {
    if (activeToken?.id === token.id) {
      setActiveToken(null);
      setActiveNode(null);
      return;
    }
    setActiveToken(token);
    const node = findNodeById(product.customizationTree, token.nodeId);
    setActiveNode(node || null);
    if (onPartHighlight && token.linkedPart) onPartHighlight(token.linkedPart);
  };

  const handleOptionSelect = (nodeId: string, optionId: string) => {
    onNodeClick(`${nodeId}:${optionId}`);
    setTimeout(() => {
      setActiveToken(null);
      setActiveNode(null);
      setActiveAttributeNode(null);
    }, 150);
  };

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

  // Content mode icon buttons for sentence view
  const ContentModeToggle = () => (
    <div className="mode-toggle">
      <button
        className={`mode-btn ${contentMode === 'configure' ? 'active' : ''}`}
        onClick={() => setContentMode('configure')}
        title="Configure"
      >
        <ConfigureIcon />
      </button>
      <button
        className={`mode-btn ${contentMode === 'info' ? 'active' : ''}`}
        onClick={() => setContentMode('info')}
        title="Product Info"
      >
        <InfoIcon />
      </button>
      <button
        className={`mode-btn ${contentMode === 'community' ? 'active' : ''}`}
        onClick={() => setContentMode('community')}
        title="Community Gallery"
      >
        <GalleryIcon />
      </button>
    </div>
  );

  return (
    <>
      <style>{`

        .llc {
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

        .llc-inner {
          pointer-events: auto;
          background: var(--bg);
          border: 1px solid var(--ink);
          border-bottom: none;
          border-radius: 24px 24px 0 0;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @media (min-width: 640px) {
          .llc {
            left: 50%;
            right: auto;
            transform: translateX(-50%);
            bottom: 1.5rem;
            max-width: 580px;
            width: calc(100% - 3rem);
          }
          
          .llc-inner {
            border: 1px solid var(--ink);
            border-radius: 24px;
          }
        }

        /* ═══════════════════════════════════════════════════════════════════
           MODE TOGGLE (Info / Configure / Community)
        ═══════════════════════════════════════════════════════════════════ */
        .mode-toggle {
          display: flex;
          gap: 2px;
          background: rgba(0, 0, 0, 0.04);
          border-radius: 8px;
          padding: 3px;
        }

        .mode-btn {
          background: transparent;
          border: none;
          padding: 0.5rem;
          cursor: pointer;
          opacity: 0.4;
          transition: all 0.2s;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mode-btn:hover {
          opacity: 0.7;
        }

        .mode-btn.active {
          background: var(--bg);
          opacity: 1;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        /* ═══════════════════════════════════════════════════════════════════
           LABEL STATE (Collapsed)
        ═══════════════════════════════════════════════════════════════════ */
        .llc-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.875rem 1.25rem;
          cursor: pointer;
          gap: 1rem;
        }

        .llc-label:hover {
          background: rgba(0, 0, 0, 0.02);
        }

        .llc-product {
          font-family: var(--serif);
          font-size: 1rem;
          font-style: italic;
          color: var(--ink);
        }

        .llc-summary {
          font-family: var(--mono);
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--ink);
          opacity: 0.5;
          flex: 1;
          text-align: center;
        }

        .llc-price-small {
          font-family: var(--serif);
          font-size: 1.1rem;
          font-style: italic;
        }

        .llc-toggle {
          background: none;
          border: none;
          padding: 0.5rem;
          margin: -0.5rem;
          cursor: pointer;
          opacity: 0.4;
          transition: opacity 0.2s;
        }

        .llc-toggle:hover {
          opacity: 1;
        }

        /* ═══════════════════════════════════════════════════════════════════
           SENTENCE STATE
        ═══════════════════════════════════════════════════════════════════ */
        .llc-sentence-view {
          padding: 1.5rem 1.25rem;
        }

        @media (min-width: 640px) {
          .llc-sentence-view {
            padding: 1.75rem 2rem;
          }
        }

        .llc-sentence-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .llc-sentence-text {
          font-family: var(--serif);
          font-size: 1.1rem;
          font-weight: 300;
          line-height: 2;
          color: var(--ink);
        }

        @media (min-width: 640px) {
          .llc-sentence-text {
            font-size: 1.25rem;
          }
        }

        .llc-token {
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

        .llc-token:hover, .llc-token.active {
          border-bottom-color: var(--accent);
          background: rgba(194, 0, 0, 0.04);
        }

        .llc-prefix {
          color: rgba(26, 26, 26, 0.4);
        }

        /* ═══════════════════════════════════════════════════════════════════
           INFO CONTENT
        ═══════════════════════════════════════════════════════════════════ */
        .llc-info {
          padding: 0.5rem 0;
        }

        .llc-info-section {
          margin-bottom: 1.25rem;
        }

        .llc-info-section:last-child {
          margin-bottom: 0;
        }

        .llc-info-title {
          font-family: var(--mono);
          font-size: 0.55rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-bottom: 0.4rem;
          padding-bottom: 3px;
          border-bottom: 1px solid var(--accent);
          display: inline-block;
          color: var(--ink);
        }

        .llc-info-text {
          font-family: var(--serif);
          font-size: 0.95rem;
          line-height: 1.6;
          color: var(--ink);
          opacity: 0.8;
        }

        .llc-specs-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
          margin-top: 0.5rem;
        }

        .llc-spec-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .llc-spec-label {
          font-family: var(--mono);
          font-size: 0.55rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          opacity: 0.5;
        }

        .llc-spec-value {
          font-family: var(--serif);
          font-size: 0.9rem;
        }

        /* ═══════════════════════════════════════════════════════════════════
           COMMUNITY CONTENT
        ═══════════════════════════════════════════════════════════════════ */
        .llc-community {
          padding: 0.5rem 0;
        }

        .llc-community-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .llc-community-title {
          font-family: var(--serif);
          font-size: 1.1rem;
          font-style: italic;
        }

        .llc-share-btn {
          font-family: var(--mono);
          font-size: 0.55rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--ink);
          background: transparent;
          cursor: pointer;
          transition: all 0.2s;
        }

        .llc-share-btn:hover {
          background: var(--ink);
          color: var(--bg);
        }

        .llc-designs-scroll {
          display: flex;
          gap: 0.75rem;
          overflow-x: auto;
          padding-bottom: 0.5rem;
          margin: 0 -1.25rem;
          padding-left: 1.25rem;
          padding-right: 1.25rem;
          scrollbar-width: none;
        }

        .llc-designs-scroll::-webkit-scrollbar {
          display: none;
        }

        .llc-design-card {
          flex-shrink: 0;
          width: 140px;
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s;
        }

        .llc-design-card:hover {
          border-color: var(--ink);
          transform: translateY(-2px);
        }

        .llc-design-preview {
          height: 100px;
          background: rgba(0,0,0,0.03);
        }

        .llc-design-meta {
          padding: 0.5rem;
        }

        .llc-design-name {
          font-family: var(--serif);
          font-size: 0.85rem;
          margin-bottom: 2px;
        }

        .llc-design-author {
          font-family: var(--mono);
          font-size: 0.55rem;
          opacity: 0.5;
        }

        .llc-design-likes {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-family: var(--mono);
          font-size: 0.6rem;
          margin-top: 0.35rem;
          opacity: 0.6;
        }

        .llc-design-likes.liked {
          color: var(--accent);
          opacity: 1;
        }

        /* ═══════════════════════════════════════════════════════════════════
           PANEL STATE
        ═══════════════════════════════════════════════════════════════════ */
        .llc-panel {
          max-height: 70vh;
          overflow-y: auto;
        }

        .llc-tabs {
          display: flex;
          border-bottom: 1px solid var(--ink);
        }

        .llc-tab {
          flex: 1;
          background: transparent;
          border: none;
          border-right: 1px solid var(--ink);
          padding: 0.75rem 0.5rem;
          font-family: var(--mono);
          font-size: 0.6rem;
          font-weight: 400;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          color: var(--ink);
          opacity: 0.5;
          position: relative;
          transition: all 0.2s;
        }

        .llc-tab:last-child {
          border-right: none;
        }

        .llc-tab:hover {
          opacity: 0.8;
        }

        .llc-tab.active {
          opacity: 1;
        }

        .llc-tab.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--accent);
        }

        .llc-panel-content {
          padding: 1.25rem;
        }

        .llc-section {
          margin-bottom: 1.25rem;
        }

        .llc-section-title {
          font-family: var(--mono);
          font-size: 0.55rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-bottom: 0.5rem;
          padding-bottom: 3px;
          border-bottom: 1px solid var(--accent);
          display: inline-block;
        }

        .llc-row {
          display: flex;
          align-items: baseline;
          font-family: var(--mono);
          font-size: 0.72rem;
          padding: 0.35rem 0;
          cursor: pointer;
          border-radius: 2px;
          transition: background 0.15s;
        }

        .llc-row:hover {
          background: rgba(0,0,0,0.03);
        }

        .llc-row-label {
          color: var(--ink);
        }

        .llc-row-dots {
          flex: 1;
          border-bottom: 1px dotted rgba(0,0,0,0.2);
          margin: 0 8px;
          position: relative;
          top: -4px;
        }

        .llc-row-value {
          color: var(--ink);
        }

        .llc-row-arrow {
          margin-left: 6px;
          opacity: 0.3;
        }

        /* ═══════════════════════════════════════════════════════════════════
           ATTRIBUTE DETAIL
        ═══════════════════════════════════════════════════════════════════ */
        .llc-detail-back {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          cursor: pointer;
          padding: 0.25rem 0;
          margin-bottom: 1rem;
          color: rgba(0,0,0,0.5);
        }

        .llc-detail-back:hover {
          color: var(--ink);
        }

        .llc-detail-back-text {
          font-family: var(--mono);
          font-size: 0.55rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        .llc-detail-title {
          font-family: var(--serif);
          font-size: 1.25rem;
          font-style: italic;
          margin-bottom: 1rem;
        }

        .llc-options {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .llc-option {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.65rem;
          border: 1px solid var(--border);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .llc-option:hover {
          border-color: rgba(0,0,0,0.3);
        }

        .llc-option.selected {
          border-color: var(--ink);
          border-width: 2px;
        }

        .llc-option-swatch {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background: rgba(0,0,0,0.05);
          border: 1px solid var(--border);
        }

        .llc-option-info {
          flex: 1;
        }

        .llc-option-name {
          font-family: var(--mono);
          font-size: 0.72rem;
        }

        .llc-option-price {
          font-family: var(--mono);
          font-size: 0.6rem;
          opacity: 0.5;
        }

        .llc-option-check {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 1.5px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .llc-option.selected .llc-option-check {
          background: var(--ink);
          border-color: var(--ink);
          color: var(--bg);
        }

        /* ═══════════════════════════════════════════════════════════════════
           OPTION TRAY
        ═══════════════════════════════════════════════════════════════════ */
        .llc-tray {
          position: fixed;
          z-index: 100;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 1rem 1.25rem;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          pointer-events: auto;
          max-width: 400px;
          width: calc(100vw - 2rem);
        }

        .llc-tray.desktop {
          left: 50%;
          transform: translateX(-50%);
        }

        .llc-tray.mobile {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          width: 100%;
          max-width: 100%;
          border-radius: 20px 20px 0 0;
          padding-bottom: 2rem;
        }

        .llc-tray-handle {
          width: 36px;
          height: 4px;
          background: rgba(0,0,0,0.15);
          border-radius: 2px;
          margin: 0 auto 0.75rem;
        }

        .llc-tray-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border);
        }

        .llc-tray-title {
          font-family: var(--mono);
          font-size: 0.55rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          opacity: 0.5;
        }

        .llc-tray-close {
          background: none;
          border: none;
          padding: 0.5rem;
          margin: -0.5rem;
          cursor: pointer;
          opacity: 0.4;
        }

        .llc-tray-close:hover {
          opacity: 1;
        }

        .llc-tray-options {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .llc-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 0.8rem;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: 100px;
          cursor: pointer;
          transition: all 0.15s;
          font-family: var(--mono);
          font-size: 0.65rem;
          color: var(--ink);
        }

        .llc-chip:hover {
          border-color: rgba(0,0,0,0.4);
        }

        .llc-chip.selected {
          background: var(--ink);
          border-color: var(--ink);
          color: var(--bg);
        }

        .llc-chip-swatch {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 1px solid rgba(0,0,0,0.1);
        }

        .llc-chip.selected .llc-chip-swatch {
          border-color: rgba(255,255,255,0.3);
        }

        /* ═══════════════════════════════════════════════════════════════════
           FOOTER
        ═══════════════════════════════════════════════════════════════════ */
        .llc-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.25rem;
          border-top: 1px solid var(--border);
          gap: 1rem;
        }

        @media (max-width: 639px) {
          .llc-footer {
            flex-direction: column;
            gap: 0.75rem;
          }
        }

        .llc-footer-left {
          display: flex;
          align-items: baseline;
          gap: 0.75rem;
        }

        @media (max-width: 639px) {
          .llc-footer-left {
            width: 100%;
            justify-content: space-between;
          }
        }

        .llc-price {
          font-family: var(--serif);
          font-size: 1.4rem;
          font-style: italic;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .llc-price:hover {
          opacity: 0.7;
        }

        .llc-meta {
          font-family: var(--mono);
          font-size: 0.5rem;
          color: rgba(26,26,26,0.4);
          letter-spacing: 0.03em;
        }

        .llc-actions {
          display: flex;
          gap: 0.5rem;
        }

        @media (max-width: 639px) {
          .llc-actions {
            width: 100%;
          }
        }

        .llc-btn {
          padding: 0.7rem 1.1rem;
          font-family: var(--mono);
          font-size: 0.55rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          border: 1px solid var(--ink);
          cursor: pointer;
          transition: all 0.2s;
        }

        @media (max-width: 639px) {
          .llc-btn {
            flex: 1;
            padding: 0.85rem 1rem;
          }
        }

        .llc-btn-primary {
          background: var(--ink);
          color: var(--bg);
        }

        .llc-btn-secondary {
          background: transparent;
          color: var(--ink);
        }
      `}</style>

      <div className="llc" ref={containerRef}>
        <motion.div className="llc-inner" layout transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
          <AnimatePresence mode="wait">
            {/* ═══════════════════════════════════════════════════════════════
                LABEL STATE
            ═══════════════════════════════════════════════════════════════ */}
            {density === 'label' && (
              <motion.div
                key="label"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="llc-label"
                onClick={() => setDensity('sentence')}
              >
                <span className="llc-product">{product.name}</span>
                <span className="llc-summary">{labelSummary}</span>
                <span className="llc-price-small">£{totalPrice}</span>
                <button className="llc-toggle"><ChevronUp /></button>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                SENTENCE STATE
            ═══════════════════════════════════════════════════════════════ */}
            {density === 'sentence' && (
              <motion.div
                key="sentence"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="llc-sentence-view"
              >
                <div className="llc-sentence-header">
                  <ContentModeToggle />
                  <button className="llc-toggle" onClick={() => setDensity('panel')} style={{ opacity: 0.4 }}>
                    <ChevronUp />
                  </button>
                </div>

                {/* CONFIGURE MODE */}
                {contentMode === 'configure' && (
                  <div className="llc-sentence-text">
                    <span>This </span>
                    <span style={{ fontStyle: 'italic' }}>{product.name}</span>
                    <span> is </span>
                    {tokens.map((token, i) => (
                      <React.Fragment key={token.id}>
                        {token.prefix && <span className="llc-prefix"> {token.prefix} </span>}
                        <button
                          className={`llc-token ${activeToken?.id === token.id ? 'active' : ''}`}
                          onClick={() => handleTokenTap(token)}
                        >
                          {token.value}
                        </button>
                        {i < tokens.length - 1 && !tokens[i + 1].prefix && <span> </span>}
                      </React.Fragment>
                    ))}
                    <span> handles.</span>
                  </div>
                )}

                {/* INFO MODE */}
                {contentMode === 'info' && (
                  <div className="llc-info">
                    <div className="llc-specs-grid">
                      <div className="llc-spec-item">
                        <span className="llc-spec-label">Lead Time</span>
                        <span className="llc-spec-value">10–14 days</span>
                      </div>
                      <div className="llc-spec-item">
                        <span className="llc-spec-label">Shipping</span>
                        <span className="llc-spec-value">Worldwide</span>
                      </div>
                      <div className="llc-spec-item">
                        <span className="llc-spec-label">Materials</span>
                        <span className="llc-spec-value">Full-grain leather</span>
                      </div>
                      <div className="llc-spec-item">
                        <span className="llc-spec-label">Hardware</span>
                        <span className="llc-spec-value">Solid brass</span>
                      </div>
                    </div>
                    <div className="llc-info-section" style={{ marginTop: '1rem' }}>
                      <div className="llc-info-title">Care</div>
                      <p className="llc-info-text">
                        Store in dust bag. Condition quarterly. Avoid direct sunlight.
                      </p>
                    </div>
                  </div>
                )}

                {/* COMMUNITY MODE */}
                {contentMode === 'community' && (
                  <div className="llc-community">
                    <div className="llc-community-header">
                      <span className="llc-community-title">Community Designs</span>
                      <button className="llc-share-btn" onClick={onLoginRequest}>Share Yours</button>
                    </div>
                    <div className="llc-designs-scroll">
                      {communityDesigns.map(design => (
                        <div key={design.id} className="llc-design-card">
                          <div className="llc-design-preview" />
                          <div className="llc-design-meta">
                            <div className="llc-design-name">{design.name}</div>
                            <div className="llc-design-author">{design.author}</div>
                            <div className={`llc-design-likes ${design.liked ? 'liked' : ''}`}>
                              <HeartIcon filled={design.liked} />
                              <span>{design.likes}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="llc-footer" style={{ margin: '0 -1.25rem -1.5rem', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                  <div className="llc-footer-left">
                    <div className="llc-price" onClick={onOpenPrice}>£{totalPrice}</div>
                    <div className="llc-meta">Lead time 10–14 days</div>
                  </div>
                  <div className="llc-actions">
                    <button className="llc-btn llc-btn-secondary" onClick={onLoginRequest}>Save</button>
                    <button className="llc-btn llc-btn-primary">Add to Cart</button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                PANEL STATE
            ═══════════════════════════════════════════════════════════════ */}
            {density === 'panel' && (
              <motion.div
                key="panel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="llc-panel"
              >
                {/* Tabs */}
                <div className="llc-tabs">
                  {(['configure', 'info', 'community'] as ContentMode[]).map(mode => (
                    <button
                      key={mode}
                      className={`llc-tab ${contentMode === mode ? 'active' : ''}`}
                      onClick={() => setContentMode(mode)}
                    >
                      {mode === 'configure' ? 'Customize' : mode === 'info' ? 'Info' : 'Gallery'}
                    </button>
                  ))}
                </div>

                <div className="llc-panel-content">
                  {/* Collapse button */}
                  <button
                    className="llc-toggle"
                    onClick={() => setDensity('sentence')}
                    style={{ float: 'right', marginTop: '-0.25rem' }}
                  >
                    <ChevronDown />
                  </button>

                  {/* CONFIGURE */}
                  {contentMode === 'configure' && !activeAttributeNode && (
                    <>
                      {componentSections.map(section => (
                        <div key={section.id} className="llc-section">
                          <div className="llc-section-title">{section.label}</div>
                          {section.children?.filter(c => c.type === 'attribute').map(attr => (
                            <div
                              key={attr.id}
                              className="llc-row"
                              onClick={() => setActiveAttributeNode(attr)}
                            >
                              <span className="llc-row-label">{attr.label}</span>
                              <span className="llc-row-dots" />
                              <span className="llc-row-value">{getDisplayValue(attr, configuration)}</span>
                              <span className="llc-row-arrow"><ThinArrowRight /></span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </>
                  )}

                  {/* Attribute Detail */}
                  {contentMode === 'configure' && activeAttributeNode && (
                    <>
                      <div className="llc-detail-back" onClick={() => setActiveAttributeNode(null)}>
                        <ThinArrowLeft />
                        <span className="llc-detail-back-text">Back</span>
                      </div>
                      <div className="llc-detail-title">{activeAttributeNode.label}</div>
                      <div className="llc-options">
                        {activeAttributeNode.children?.filter(c => c.type === 'option').map(option => {
                          const isSelected = configuration.selections[activeAttributeNode.id]?.value === option.id ||
                            (!configuration.selections[activeAttributeNode.id] && option.default === true);
                          const swatchColor = getSwatchColor(option.label);
                          return (
                            <div
                              key={option.id}
                              className={`llc-option ${isSelected ? 'selected' : ''}`}
                              onClick={() => handleOptionSelect(activeAttributeNode.id, option.id)}
                            >
                              <div className="llc-option-swatch" style={swatchColor ? { background: swatchColor } : {}} />
                              <div className="llc-option-info">
                                <div className="llc-option-name">{option.label}</div>
                              </div>
                              {option.priceModifier !== undefined && option.priceModifier !== 0 && (
                                <div className="llc-option-price">+£{option.priceModifier}</div>
                              )}
                              <div className="llc-option-check">
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

                  {/* INFO */}
                  {contentMode === 'info' && (
                    <div className="llc-info" style={{ paddingTop: '0.5rem' }}>
                      <div className="llc-info-section">
                        <div className="llc-info-title">Materials</div>
                        <p className="llc-info-text">
                          Premium full-grain leather, solid brass hardware, hand-stitched with waxed thread.
                        </p>
                      </div>
                      <div className="llc-info-section">
                        <div className="llc-info-title">Care</div>
                        <p className="llc-info-text">
                          Store in dust bag when not in use. Condition leather quarterly. Avoid prolonged direct sunlight.
                        </p>
                      </div>
                      <div className="llc-info-section">
                        <div className="llc-info-title">Shipping</div>
                        <p className="llc-info-text">
                          Made to order. Ships within 10–14 days. Complimentary worldwide delivery.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* COMMUNITY */}
                  {contentMode === 'community' && (
                    <div className="llc-community" style={{ paddingTop: '0.5rem' }}>
                      <div className="llc-community-header">
                        <span className="llc-community-title">Community Designs</span>
                        <button className="llc-share-btn" onClick={onLoginRequest}>Share Yours</button>
                      </div>
                      <div className="llc-designs-scroll" style={{ marginLeft: '-1.25rem', marginRight: '-1.25rem', paddingLeft: '1.25rem', paddingRight: '1.25rem' }}>
                        {communityDesigns.map(design => (
                          <div key={design.id} className="llc-design-card">
                            <div className="llc-design-preview" />
                            <div className="llc-design-meta">
                              <div className="llc-design-name">{design.name}</div>
                              <div className="llc-design-author">{design.author}</div>
                              <div className={`llc-design-likes ${design.liked ? 'liked' : ''}`}>
                                <HeartIcon filled={design.liked} />
                                <span>{design.likes}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="llc-footer">
                  <div className="llc-footer-left">
                    <div className="llc-price" onClick={onOpenPrice}>£{totalPrice}</div>
                    <div className="llc-meta">Lead time 10–14 days</div>
                  </div>
                  <div className="llc-actions">
                    <button className="llc-btn llc-btn-secondary" onClick={onLoginRequest}>Save</button>
                    <button className="llc-btn llc-btn-primary">Add to Cart</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════════
            FLOATING OPTION TRAY
        ═══════════════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {activeToken && activeNode && density !== 'panel' && contentMode === 'configure' && (
            <motion.div
              ref={trayRef}
              className={`llc-tray ${isMobile ? 'mobile' : 'desktop'}`}
              initial={{ opacity: 0, y: isMobile ? 100 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: isMobile ? 100 : 10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={!isMobile ? { bottom: containerRef.current ? containerRef.current.offsetHeight + 16 : 200 } : undefined}
            >
              {isMobile && <div className="llc-tray-handle" />}
              <div className="llc-tray-header">
                <span className="llc-tray-title">{activeToken.label}</span>
                <button className="llc-tray-close" onClick={() => { setActiveToken(null); setActiveNode(null); }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <div className="llc-tray-options">
                {activeNode.children?.filter(c => c.type === 'option').map(option => {
                  const isSelected = configuration.selections[activeNode.id]?.value === option.id ||
                    (!configuration.selections[activeNode.id] && option.default === true);
                  const swatchColor = getSwatchColor(option.label);
                  return (
                    <button
                      key={option.id}
                      className={`llc-chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleOptionSelect(activeNode.id, option.id)}
                    >
                      {swatchColor && <span className="llc-chip-swatch" style={{ background: swatchColor }} />}
                      <span>{option.label}</span>
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

export default LivingLabelComplete;


