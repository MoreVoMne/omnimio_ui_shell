// FullStoryLabel.tsx - Everything visible, nothing hidden
// Vertical flow: Sentence → Specs Bar → Community Peek → CTA
// Info and Gallery are ALWAYS visible - no tabs, no icons

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfigurationStateV2, Product, TreeNode } from '../types-tree';
import { findNodeById, getDisplayValue } from '../utils/treeHelpers';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type Density = 'compact' | 'full';

interface Token {
  id: string;
  nodeId: string;
  label: string;
  value: string;
  prefix?: string;
  linkedPart?: string;
}

interface FullStoryLabelProps {
  configuration: ConfigurationStateV2;
  product: Product;
  onNodeClick: (nodeIdOrSelection: string) => void;
  totalPrice: number;
  onOpenPrice: () => void;
  onLoginRequest: () => void;
  onPartHighlight?: (partId: string | null) => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════════

const ChevronUp = () => (
  <svg width="12" height="7" viewBox="0 0 12 7" fill="none">
    <path d="M1 6L6 1L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronDown = () => (
  <svg width="12" height="7" viewBox="0 0 12 7" fill="none">
    <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const HeartIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill={filled ? "currentColor" : "none"}>
    <path d="M8 14S1 9.5 1 5.5C1 3 3 1 5.5 1C7 1 8 2 8 2S9 1 10.5 1C13 1 15 3 15 5.5C15 9.5 8 14 8 14Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
  </svg>
);

const ArrowRight = () => (
  <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
    <path d="M1 5H13M9 1L13 5L9 9" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
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

  const bodyNode = tree.find(n => n.id === 'node-body');
  if (bodyNode) {
    const materialNode = bodyNode.children?.find(c => c.id === 'node-body-material');
    const colorNode = materialNode?.children?.find(c => c.id === 'node-body-color');

    if (colorNode) {
      tokens.push({
        id: 'token-color', nodeId: colorNode.id, label: 'Color',
        value: getSelectedValue(colorNode, config).toLowerCase() || 'natural',
        prefix: 'in', linkedPart: 'mesh-body',
      });
    }
    if (materialNode) {
      tokens.push({
        id: 'token-material', nodeId: materialNode.id, label: 'Material',
        value: getSelectedValue(materialNode, config).toLowerCase() || 'leather',
        linkedPart: 'mesh-body',
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
        prefix: 'with', linkedPart: 'mesh-clasp',
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
        prefix: 'and', linkedPart: 'mesh-handle',
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
  { id: 1, name: 'Midnight Luxe', author: '@elena.v', likes: 234, liked: false, img: null },
  { id: 2, name: 'Coastal Breeze', author: '@marcus.d', likes: 189, liked: true, img: null },
  { id: 3, name: 'Urban Charcoal', author: '@sophie.k', likes: 156, liked: false, img: null },
  { id: 4, name: 'Rose Garden', author: '@amy.l', likes: 142, liked: false, img: null },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const FullStoryLabel: React.FC<FullStoryLabelProps> = ({
  configuration,
  product,
  onNodeClick,
  totalPrice,
  onOpenPrice,
  onLoginRequest,
  onPartHighlight,
}) => {
  const [density, setDensity] = useState<Density>('full');
  const [activeToken, setActiveToken] = useState<Token | null>(null);
  const [activeNode, setActiveNode] = useState<TreeNode | null>(null);
  const [showGalleryFull, setShowGalleryFull] = useState(false);
  
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

  const totalCommunityMakers = communityDesigns.reduce((acc, d) => acc + d.likes, 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=JetBrains+Mono:wght@300;400;500&display=swap');

        .fsl {
          --bg: #F8F5F0;
          --ink: #1a1a1a;
          --accent: #C20000;
          --border: rgba(0, 0, 0, 0.1);
          --serif: 'PP Editorial Old', serif;
          --mono: 'JetBrains Mono', monospace;
          
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 50;
          pointer-events: none;
        }

        .fsl-inner {
          pointer-events: auto;
          background: var(--bg);
          border: 1px solid var(--ink);
          border-bottom: none;
          border-radius: 28px 28px 0 0;
          overflow: hidden;
        }

        @media (min-width: 640px) {
          .fsl {
            left: 50%;
            right: auto;
            transform: translateX(-50%);
            bottom: 1.5rem;
            max-width: 520px;
            width: calc(100% - 3rem);
          }
          
          .fsl-inner {
            border: 1px solid var(--ink);
            border-radius: 28px;
          }
        }

        /* ═══════════════════════════════════════════════════════════════════
           COMPACT STATE
        ═══════════════════════════════════════════════════════════════════ */
        .fsl-compact {
          padding: 1rem 1.25rem;
          cursor: pointer;
        }

        .fsl-compact:hover {
          background: rgba(0,0,0,0.01);
        }

        .fsl-compact-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .fsl-compact-left {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          flex: 1;
          min-width: 0;
        }

        .fsl-compact-name {
          font-family: var(--serif);
          font-size: 1rem;
          font-style: italic;
          white-space: nowrap;
        }

        .fsl-compact-spec {
          font-family: var(--mono);
          font-size: 0.55rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          opacity: 0.4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .fsl-compact-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .fsl-compact-price {
          font-family: var(--serif);
          font-size: 1.1rem;
          font-style: italic;
        }

        .fsl-compact-toggle {
          background: none;
          border: none;
          padding: 0.4rem;
          cursor: pointer;
          opacity: 0.4;
          transition: opacity 0.2s;
        }

        .fsl-compact-toggle:hover {
          opacity: 1;
        }

        /* ═══════════════════════════════════════════════════════════════════
           FULL STATE - SCROLLABLE SECTIONS
        ═══════════════════════════════════════════════════════════════════ */
        .fsl-full {
          max-height: 75vh;
          overflow-y: auto;
          scrollbar-width: thin;
        }

        .fsl-full::-webkit-scrollbar {
          width: 4px;
        }

        .fsl-full::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.15);
          border-radius: 2px;
        }

        /* Section 1: Configuration Sentence */
        .fsl-section-config {
          padding: 1.5rem 1.5rem 1.25rem;
        }

        .fsl-config-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .fsl-config-label {
          font-family: var(--mono);
          font-size: 0.55rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          opacity: 0.4;
        }

        .fsl-collapse-btn {
          background: none;
          border: none;
          padding: 0.4rem;
          cursor: pointer;
          opacity: 0.4;
          transition: opacity 0.2s;
        }

        .fsl-collapse-btn:hover {
          opacity: 1;
        }

        .fsl-sentence {
          font-family: var(--serif);
          font-size: 1.15rem;
          font-weight: 300;
          line-height: 1.9;
          color: var(--ink);
        }

        @media (min-width: 640px) {
          .fsl-sentence {
            font-size: 1.25rem;
          }
        }

        .fsl-token {
          display: inline;
          background: transparent;
          border: none;
          padding: 0 0.08em;
          cursor: pointer;
          font-family: inherit;
          font-size: inherit;
          font-weight: 400;
          color: var(--ink);
          border-bottom: 1.5px solid rgba(194, 0, 0, 0.3);
          transition: all 0.2s;
        }

        .fsl-token:hover, .fsl-token.active {
          border-bottom-color: var(--accent);
          background: rgba(194, 0, 0, 0.04);
        }

        .fsl-prefix {
          color: rgba(26, 26, 26, 0.4);
        }

        /* Section 2: Specs Bar - ALWAYS VISIBLE */
        .fsl-section-specs {
          padding: 0.85rem 1.5rem;
          background: rgba(0, 0, 0, 0.025);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }

        .fsl-specs-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem 1.25rem;
          justify-content: center;
        }

        .fsl-spec {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-family: var(--mono);
          font-size: 0.58rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--ink);
        }

        .fsl-spec-dot {
          width: 3px;
          height: 3px;
          background: var(--accent);
          border-radius: 50%;
        }

        .fsl-spec-label {
          opacity: 0.5;
        }

        .fsl-spec-value {
          font-weight: 500;
        }

        /* Section 3: Community - ALWAYS VISIBLE */
        .fsl-section-community {
          padding: 1rem 1.5rem;
        }

        .fsl-community-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .fsl-community-left {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
        }

        .fsl-community-count {
          font-family: var(--serif);
          font-size: 1rem;
          font-style: italic;
        }

        .fsl-community-label {
          font-family: var(--mono);
          font-size: 0.55rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          opacity: 0.4;
        }

        .fsl-community-see-all {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          background: none;
          border: none;
          font-family: var(--mono);
          font-size: 0.55rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--ink);
          cursor: pointer;
          opacity: 0.6;
          transition: all 0.2s;
          padding: 0.35rem 0;
        }

        .fsl-community-see-all:hover {
          opacity: 1;
        }

        .fsl-community-scroll {
          display: flex;
          gap: 0.6rem;
          overflow-x: auto;
          margin: 0 -1.5rem;
          padding: 0 1.5rem 0.5rem;
          scrollbar-width: none;
        }

        .fsl-community-scroll::-webkit-scrollbar {
          display: none;
        }

        .fsl-design-card {
          flex-shrink: 0;
          width: 100px;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .fsl-design-card:hover {
          transform: translateY(-2px);
        }

        .fsl-design-thumb {
          width: 100px;
          height: 100px;
          background: rgba(0,0,0,0.04);
          border: 1px solid var(--border);
          border-radius: 8px;
          margin-bottom: 0.4rem;
          position: relative;
          overflow: hidden;
        }

        .fsl-design-thumb::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent 60%, rgba(0,0,0,0.03) 100%);
        }

        .fsl-design-name {
          font-family: var(--serif);
          font-size: 0.75rem;
          margin-bottom: 1px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .fsl-design-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .fsl-design-author {
          font-family: var(--mono);
          font-size: 0.5rem;
          opacity: 0.4;
        }

        .fsl-design-likes {
          display: flex;
          align-items: center;
          gap: 0.2rem;
          font-family: var(--mono);
          font-size: 0.5rem;
          opacity: 0.5;
        }

        .fsl-design-likes.liked {
          color: var(--accent);
          opacity: 1;
        }

        .fsl-share-cta {
          flex-shrink: 0;
          width: 100px;
          height: 100px;
          border: 1px dashed rgba(0,0,0,0.2);
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          cursor: pointer;
          transition: all 0.2s;
          background: transparent;
        }

        .fsl-share-cta:hover {
          border-color: var(--ink);
          background: rgba(0,0,0,0.02);
        }

        .fsl-share-cta-text {
          font-family: var(--mono);
          font-size: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          text-align: center;
          opacity: 0.6;
        }

        .fsl-share-cta-plus {
          font-family: var(--serif);
          font-size: 1.5rem;
          font-weight: 300;
          opacity: 0.3;
        }

        /* Section 4: CTA Footer */
        .fsl-section-cta {
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        @media (max-width: 639px) {
          .fsl-section-cta {
            flex-direction: column;
            gap: 0.75rem;
          }
        }

        .fsl-cta-left {
          display: flex;
          align-items: baseline;
          gap: 0.6rem;
        }

        @media (max-width: 639px) {
          .fsl-cta-left {
            width: 100%;
            justify-content: space-between;
          }
        }

        .fsl-price {
          font-family: var(--serif);
          font-size: 1.5rem;
          font-style: italic;
          cursor: pointer;
        }

        .fsl-price:hover {
          opacity: 0.7;
        }

        .fsl-lead-time {
          font-family: var(--mono);
          font-size: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          opacity: 0.4;
        }

        .fsl-cta-right {
          display: flex;
          gap: 0.5rem;
        }

        @media (max-width: 639px) {
          .fsl-cta-right {
            width: 100%;
          }
        }

        .fsl-btn {
          padding: 0.75rem 1.25rem;
          font-family: var(--mono);
          font-size: 0.58rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          border: 1px solid var(--ink);
          cursor: pointer;
          transition: all 0.2s;
        }

        @media (max-width: 639px) {
          .fsl-btn {
            flex: 1;
          }
        }

        .fsl-btn-primary {
          background: var(--ink);
          color: var(--bg);
        }

        .fsl-btn-secondary {
          background: transparent;
          color: var(--ink);
        }

        /* ═══════════════════════════════════════════════════════════════════
           OPTION TRAY
        ═══════════════════════════════════════════════════════════════════ */
        .fsl-tray {
          position: fixed;
          z-index: 100;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 1rem 1.25rem;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          pointer-events: auto;
          max-width: 380px;
          width: calc(100vw - 2rem);
        }

        .fsl-tray.desktop {
          left: 50%;
          transform: translateX(-50%);
        }

        .fsl-tray.mobile {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          width: 100%;
          max-width: 100%;
          border-radius: 20px 20px 0 0;
          padding-bottom: 2rem;
        }

        .fsl-tray-handle {
          width: 36px;
          height: 4px;
          background: rgba(0,0,0,0.15);
          border-radius: 2px;
          margin: 0 auto 0.75rem;
        }

        .fsl-tray-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border);
        }

        .fsl-tray-title {
          font-family: var(--mono);
          font-size: 0.55rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          opacity: 0.5;
        }

        .fsl-tray-close {
          background: none;
          border: none;
          padding: 0.5rem;
          margin: -0.5rem;
          cursor: pointer;
          opacity: 0.4;
        }

        .fsl-tray-close:hover {
          opacity: 1;
        }

        .fsl-tray-options {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .fsl-chip {
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

        .fsl-chip:hover {
          border-color: rgba(0,0,0,0.4);
        }

        .fsl-chip.selected {
          background: var(--ink);
          border-color: var(--ink);
          color: var(--bg);
        }

        .fsl-chip-swatch {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 1px solid rgba(0,0,0,0.1);
        }

        .fsl-chip.selected .fsl-chip-swatch {
          border-color: rgba(255,255,255,0.3);
        }

        /* ═══════════════════════════════════════════════════════════════════
           GALLERY FULL VIEW (Overlay)
        ═══════════════════════════════════════════════════════════════════ */
        .fsl-gallery-overlay {
          position: fixed;
          inset: 0;
          z-index: 200;
          background: var(--bg);
          overflow-y: auto;
        }

        .fsl-gallery-header {
          position: sticky;
          top: 0;
          background: var(--bg);
          border-bottom: 1px solid var(--border);
          padding: 1rem 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 10;
        }

        .fsl-gallery-title {
          font-family: var(--serif);
          font-size: 1.25rem;
          font-style: italic;
        }

        .fsl-gallery-close {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          background: none;
          border: none;
          font-family: var(--mono);
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          cursor: pointer;
          opacity: 0.6;
          transition: opacity 0.2s;
        }

        .fsl-gallery-close:hover {
          opacity: 1;
        }

        .fsl-gallery-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          padding: 1.5rem;
        }

        @media (min-width: 640px) {
          .fsl-gallery-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .fsl-gallery-card {
          cursor: pointer;
          transition: transform 0.2s;
        }

        .fsl-gallery-card:hover {
          transform: translateY(-4px);
        }

        .fsl-gallery-thumb {
          aspect-ratio: 1;
          background: rgba(0,0,0,0.04);
          border: 1px solid var(--border);
          border-radius: 12px;
          margin-bottom: 0.5rem;
        }

        .fsl-gallery-name {
          font-family: var(--serif);
          font-size: 1rem;
          margin-bottom: 2px;
        }

        .fsl-gallery-author {
          font-family: var(--mono);
          font-size: 0.6rem;
          opacity: 0.5;
          margin-bottom: 0.25rem;
        }

        .fsl-gallery-likes {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-family: var(--mono);
          font-size: 0.6rem;
          opacity: 0.5;
        }

        .fsl-gallery-likes.liked {
          color: var(--accent);
          opacity: 1;
        }
      `}</style>

      <div className="fsl" ref={containerRef}>
        <motion.div className="fsl-inner" layout transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
          
          {/* ═══════════════════════════════════════════════════════════════
              COMPACT STATE
          ═══════════════════════════════════════════════════════════════ */}
          {density === 'compact' && (
            <div className="fsl-compact" onClick={() => setDensity('full')}>
              <div className="fsl-compact-row">
                <div className="fsl-compact-left">
                  <span className="fsl-compact-name">{product.name}</span>
                  <span className="fsl-compact-spec">
                    {tokens.map(t => t.value).join(' · ')}
                  </span>
                </div>
                <div className="fsl-compact-right">
                  <span className="fsl-compact-price">£{totalPrice}</span>
                  <button className="fsl-compact-toggle" onClick={(e) => { e.stopPropagation(); setDensity('full'); }}>
                    <ChevronUp />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              FULL STATE - ALL SECTIONS VISIBLE
          ═══════════════════════════════════════════════════════════════ */}
          {density === 'full' && (
            <div className="fsl-full">
              
              {/* SECTION 1: Configuration Sentence */}
              <div className="fsl-section-config">
                <div className="fsl-config-header">
                  <span className="fsl-config-label">Your Configuration</span>
                  <button className="fsl-collapse-btn" onClick={() => setDensity('compact')}>
                    <ChevronDown />
                  </button>
                </div>
                
                <div className="fsl-sentence">
                  <span>This </span>
                  <span style={{ fontStyle: 'italic' }}>{product.name}</span>
                  <span> is </span>
                  {tokens.map((token, i) => (
                    <React.Fragment key={token.id}>
                      {token.prefix && <span className="fsl-prefix"> {token.prefix} </span>}
                      <button
                        className={`fsl-token ${activeToken?.id === token.id ? 'active' : ''}`}
                        onClick={() => handleTokenTap(token)}
                      >
                        {token.value}
                      </button>
                      {i < tokens.length - 1 && !tokens[i + 1].prefix && <span> </span>}
                    </React.Fragment>
                  ))}
                  <span> handles.</span>
                </div>
              </div>

              {/* SECTION 2: Specs Bar - ALWAYS VISIBLE */}
              <div className="fsl-section-specs">
                <div className="fsl-specs-row">
                  <div className="fsl-spec">
                    <span className="fsl-spec-dot" />
                    <span className="fsl-spec-value">Full-grain leather</span>
                  </div>
                  <div className="fsl-spec">
                    <span className="fsl-spec-dot" />
                    <span className="fsl-spec-value">Solid brass</span>
                  </div>
                  <div className="fsl-spec">
                    <span className="fsl-spec-dot" />
                    <span className="fsl-spec-value">Hand-stitched</span>
                  </div>
                  <div className="fsl-spec">
                    <span className="fsl-spec-dot" />
                    <span className="fsl-spec-value">10–14 day lead</span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Community - ALWAYS VISIBLE */}
              <div className="fsl-section-community">
                <div className="fsl-community-header">
                  <div className="fsl-community-left">
                    <span className="fsl-community-count">{totalCommunityMakers}+</span>
                    <span className="fsl-community-label">makers have customized this</span>
                  </div>
                  <button className="fsl-community-see-all" onClick={() => setShowGalleryFull(true)}>
                    See all <ArrowRight />
                  </button>
                </div>
                
                <div className="fsl-community-scroll">
                  {communityDesigns.map(design => (
                    <div key={design.id} className="fsl-design-card" onClick={() => setShowGalleryFull(true)}>
                      <div className="fsl-design-thumb" />
                      <div className="fsl-design-name">{design.name}</div>
                      <div className="fsl-design-meta">
                        <span className="fsl-design-author">{design.author}</span>
                        <span className={`fsl-design-likes ${design.liked ? 'liked' : ''}`}>
                          <HeartIcon filled={design.liked} />
                          {design.likes}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {/* Share CTA */}
                  <button className="fsl-share-cta" onClick={onLoginRequest}>
                    <span className="fsl-share-cta-plus">+</span>
                    <span className="fsl-share-cta-text">Share<br/>yours</span>
                  </button>
                </div>
              </div>

              {/* SECTION 4: CTA Footer */}
              <div className="fsl-section-cta">
                <div className="fsl-cta-left">
                  <span className="fsl-price" onClick={onOpenPrice}>£{totalPrice}</span>
                  <span className="fsl-lead-time">Ships in 10–14 days</span>
                </div>
                <div className="fsl-cta-right">
                  <button className="fsl-btn fsl-btn-secondary" onClick={onLoginRequest}>Save</button>
                  <button className="fsl-btn fsl-btn-primary">Add to Cart</button>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════════
            OPTION TRAY
        ═══════════════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {activeToken && activeNode && (
            <motion.div
              ref={trayRef}
              className={`fsl-tray ${isMobile ? 'mobile' : 'desktop'}`}
              initial={{ opacity: 0, y: isMobile ? 100 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: isMobile ? 100 : 10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={!isMobile ? { bottom: containerRef.current ? containerRef.current.offsetHeight + 16 : 200 } : undefined}
            >
              {isMobile && <div className="fsl-tray-handle" />}
              <div className="fsl-tray-header">
                <span className="fsl-tray-title">{activeToken.label}</span>
                <button className="fsl-tray-close" onClick={() => { setActiveToken(null); setActiveNode(null); }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <div className="fsl-tray-options">
                {activeNode.children?.filter(c => c.type === 'option').map(option => {
                  const isSelected = configuration.selections[activeNode.id]?.value === option.id ||
                    (!configuration.selections[activeNode.id] && option.default === true);
                  const swatchColor = getSwatchColor(option.label);
                  return (
                    <button
                      key={option.id}
                      className={`fsl-chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleOptionSelect(activeNode.id, option.id)}
                    >
                      {swatchColor && <span className="fsl-chip-swatch" style={{ background: swatchColor }} />}
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════════════════════════════════════════════════════════════
            GALLERY FULL VIEW
        ═══════════════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {showGalleryFull && (
            <motion.div
              className="fsl-gallery-overlay"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.3 }}
            >
              <div className="fsl-gallery-header">
                <span className="fsl-gallery-title">Community Gallery</span>
                <button className="fsl-gallery-close" onClick={() => setShowGalleryFull(false)}>
                  <ThinArrowLeft /> Back
                </button>
              </div>
              
              <div className="fsl-gallery-grid">
                {communityDesigns.map(design => (
                  <div key={design.id} className="fsl-gallery-card">
                    <div className="fsl-gallery-thumb" />
                    <div className="fsl-gallery-name">{design.name}</div>
                    <div className="fsl-gallery-author">{design.author}</div>
                    <div className={`fsl-gallery-likes ${design.liked ? 'liked' : ''}`}>
                      <HeartIcon filled={design.liked} />
                      <span>{design.likes} likes</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default FullStoryLabel;


