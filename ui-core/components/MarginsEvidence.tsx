// MarginsEvidence.tsx - "Evidence in the Margins"
// Sentence stays clean and frameless in the center
// Info lives in the left margin, Community in the right margin
// Like marginalia in a fine book - always present, never intrusive

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfigurationStateV2, Product, TreeNode } from '../types-tree';
import { findNodeById } from '../utils/treeHelpers';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

interface Token {
  id: string;
  nodeId: string;
  label: string;
  value: string;
  prefix?: string;
  linkedPart?: string;
}

interface MarginsEvidenceProps {
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
    const finishNode = typeNode?.children?.find(c => c.id === 'node-clasp-finish');
    if (typeNode) {
      tokens.push({
        id: 'token-clasp', nodeId: typeNode.id, label: 'Clasp',
        value: getSelectedValue(typeNode, config).toLowerCase() || 'magnetic',
        prefix: 'and', linkedPart: 'mesh-clasp',
      });
    }
    if (finishNode) {
      tokens.push({
        id: 'token-finish', nodeId: finishNode.id, label: 'Finish',
        value: getSelectedValue(finishNode, config).toLowerCase() || 'polished',
        linkedPart: 'mesh-clasp',
      });
    }
  }

  const handleNode = tree.find(n => n.id === 'node-handle');
  if (handleNode) {
    const styleNode = handleNode.children?.find(c => c.id === 'node-handle-style');
    const lengthNode = styleNode?.children?.find(c => c.id === 'node-handle-length');
    const configNode = styleNode?.children?.find(c => c.id === 'node-handle-config');
    
    if (styleNode) {
      tokens.push({
        id: 'token-handle', nodeId: styleNode.id, label: 'Handle',
        value: getSelectedValue(styleNode, config).toLowerCase().replace('match body', 'leather') || 'leather',
        prefix: 'and', linkedPart: 'mesh-handle',
      });
    }
    if (lengthNode) {
      tokens.push({
        id: 'token-length', nodeId: lengthNode.id, label: 'Length',
        value: getSelectedValue(lengthNode, config).toLowerCase() || 'standard',
        linkedPart: 'mesh-handle',
      });
    }
    if (configNode) {
      tokens.push({
        id: 'token-config', nodeId: configNode.id, label: 'Config',
        value: `${getSelectedValue(configNode, config).toLowerCase() || 'single'} strap`,
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
  if (l.includes('gold') || l.includes('brass')) return '#D4AF37';
  if (l.includes('natural')) return '#E8DFD0';
  if (l.includes('pebbled')) return '#E2D8CC';
  return null;
}

// Community data
const communityDesigns = [
  { id: 1, name: 'Midnight Luxe', author: '@elena.v', likes: 234, liked: false },
  { id: 2, name: 'Coastal Breeze', author: '@marcus.d', likes: 189, liked: true },
  { id: 3, name: 'Urban Edge', author: '@sophie.k', likes: 156, liked: false },
];

// ═══════════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════════

const HeartIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg width="11" height="11" viewBox="0 0 16 16" fill={filled ? "currentColor" : "none"}>
    <path d="M8 14S1 9.5 1 5.5C1 3 3 1 5.5 1C7 1 8 2 8 2S9 1 10.5 1C13 1 15 3 15 5.5C15 9.5 8 14 8 14Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const MarginsEvidence: React.FC<MarginsEvidenceProps> = ({
  configuration,
  product,
  onNodeClick,
  totalPrice,
  onOpenPrice,
  onLoginRequest,
  onPartHighlight,
}) => {
  const [activeToken, setActiveToken] = useState<Token | null>(null);
  const [activeNode, setActiveNode] = useState<TreeNode | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [marginsVisible, setMarginsVisible] = useState(true);
  const [showFullGallery, setShowFullGallery] = useState(false);
  
  const trayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
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
      if (trayRef.current && !trayRef.current.contains(e.target as Node)) {
        setActiveToken(null);
        setActiveNode(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=JetBrains+Mono:wght@300;400;500&display=swap');

        .me-container {
          --bg: #F8F5F0;
          --ink: #1a1a1a;
          --accent: #C20000;
          --serif: 'PP Editorial Old', serif;
          --mono: 'JetBrains Mono', monospace;
          
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 40;
        }

        /* ═══════════════════════════════════════════════════════════════════
           LEFT MARGIN - INFO
        ═══════════════════════════════════════════════════════════════════ */
        .me-left-margin {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 200px;
          padding: 2rem 1.5rem 2rem 2rem;
          pointer-events: auto;
          max-height: 70vh;
          overflow-y: auto;
          scrollbar-width: none;
        }

        .me-left-margin::-webkit-scrollbar {
          display: none;
        }

        @media (max-width: 1280px) {
          .me-left-margin {
            width: 180px;
            padding: 1.5rem 1rem 1.5rem 1.5rem;
          }
        }

        .me-info-section {
          margin-bottom: 2rem;
        }

        .me-info-section:last-child {
          margin-bottom: 0;
        }

        .me-info-label {
          font-family: var(--mono);
          font-size: 0.5rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: var(--ink);
          opacity: 0.35;
          margin-bottom: 0.5rem;
          display: block;
        }

        .me-info-text {
          font-family: var(--serif);
          font-size: 0.85rem;
          line-height: 1.5;
          color: var(--ink);
          opacity: 0.7;
        }

        .me-info-highlight {
          font-weight: 500;
          opacity: 1;
        }

        /* ═══════════════════════════════════════════════════════════════════
           RIGHT MARGIN - COMMUNITY
        ═══════════════════════════════════════════════════════════════════ */
        .me-right-margin {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 180px;
          padding: 2rem 2rem 2rem 1.5rem;
          pointer-events: auto;
          max-height: 70vh;
          overflow-y: auto;
          scrollbar-width: none;
        }

        .me-right-margin::-webkit-scrollbar {
          display: none;
        }

        @media (max-width: 1280px) {
          .me-right-margin {
            width: 160px;
            padding: 1.5rem 1.5rem 1.5rem 1rem;
          }
        }

        .me-community-header {
          margin-bottom: 1rem;
        }

        .me-community-count {
          font-family: var(--serif);
          font-size: 1.5rem;
          font-style: italic;
          font-weight: 300;
          color: var(--ink);
          line-height: 1;
        }

        .me-community-label {
          font-family: var(--mono);
          font-size: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--ink);
          opacity: 0.35;
          margin-top: 0.25rem;
          display: block;
        }

        .me-design-card {
          margin-bottom: 1rem;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .me-design-card:hover {
          opacity: 0.8;
        }

        .me-design-thumb {
          width: 100%;
          aspect-ratio: 1;
          background: rgba(0,0,0,0.04);
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 6px;
          margin-bottom: 0.4rem;
        }

        .me-design-name {
          font-family: var(--serif);
          font-size: 0.8rem;
          color: var(--ink);
          margin-bottom: 1px;
        }

        .me-design-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .me-design-author {
          font-family: var(--mono);
          font-size: 0.5rem;
          color: var(--ink);
          opacity: 0.4;
        }

        .me-design-likes {
          display: flex;
          align-items: center;
          gap: 0.2rem;
          font-family: var(--mono);
          font-size: 0.5rem;
          color: var(--ink);
          opacity: 0.4;
        }

        .me-design-likes.liked {
          color: var(--accent);
          opacity: 1;
        }

        .me-see-all {
          font-family: var(--mono);
          font-size: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--ink);
          opacity: 0.4;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem 0;
          transition: opacity 0.2s;
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        .me-see-all:hover {
          opacity: 1;
        }

        /* ═══════════════════════════════════════════════════════════════════
           CENTER - CLEAN SENTENCE (NO FRAMES)
        ═══════════════════════════════════════════════════════════════════ */
        .me-center {
          position: absolute;
          bottom: 0;
          left: 200px;
          right: 180px;
          padding: 3rem 2rem 2rem;
          pointer-events: auto;
          background: linear-gradient(
            to top,
            var(--bg) 0%,
            var(--bg) 50%,
            rgba(248, 245, 240, 0.95) 70%,
            rgba(248, 245, 240, 0.5) 85%,
            rgba(248, 245, 240, 0) 100%
          );
        }

        @media (max-width: 1280px) {
          .me-center {
            left: 180px;
            right: 160px;
          }
        }

        .me-sentence {
          font-family: var(--serif);
          font-size: 1.35rem;
          font-weight: 300;
          line-height: 2;
          color: var(--ink);
          text-align: center;
          max-width: 700px;
          margin: 0 auto;
          text-wrap: balance;
          hanging-punctuation: first last;
        }

        .me-token {
          display: inline;
          background: transparent;
          border: none;
          padding: 0 0.08em;
          cursor: pointer;
          font-family: inherit;
          font-size: inherit;
          font-weight: 400;
          color: var(--ink);
          border-bottom: 1.5px solid rgba(194, 0, 0, 0.25);
          transition: all 0.2s;
        }

        .me-token:hover, .me-token.active {
          border-bottom-color: var(--accent);
          background: rgba(194, 0, 0, 0.03);
        }

        .me-prefix {
          color: rgba(26, 26, 26, 0.35);
        }

        .me-footer {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 2rem;
          margin-top: 1.5rem;
        }

        .me-price {
          font-family: var(--serif);
          font-size: 1.5rem;
          font-style: italic;
          color: var(--ink);
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .me-price:hover {
          opacity: 0.7;
        }

        .me-cta-group {
          display: flex;
          gap: 0.5rem;
        }

        .me-btn {
          padding: 0.7rem 1.25rem;
          font-family: var(--mono);
          font-size: 0.55rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border: 1px solid var(--ink);
          cursor: pointer;
          transition: all 0.2s;
        }

        .me-btn-primary {
          background: var(--ink);
          color: var(--bg);
        }

        .me-btn-secondary {
          background: transparent;
          color: var(--ink);
        }

        /* ═══════════════════════════════════════════════════════════════════
           MOBILE LAYOUT
        ═══════════════════════════════════════════════════════════════════ */
        @media (max-width: 1023px) {
          .me-left-margin,
          .me-right-margin {
            display: none;
          }

          .me-center {
            left: 0;
            right: 0;
            padding: 3rem 1.5rem 1.5rem;
          }

          .me-sentence {
            font-size: 1.15rem;
          }

          .me-footer {
            flex-direction: column;
            gap: 1rem;
          }

          .me-cta-group {
            width: 100%;
          }

          .me-btn {
            flex: 1;
          }

          /* Mobile: Show margins as bottom sections */
          .me-mobile-evidence {
            display: block;
            padding: 1.5rem;
            border-top: 1px solid rgba(0,0,0,0.08);
            margin-top: 1rem;
          }

          .me-mobile-section {
            margin-bottom: 1.5rem;
          }

          .me-mobile-section:last-child {
            margin-bottom: 0;
          }

          .me-mobile-section-title {
            font-family: var(--mono);
            font-size: 0.55rem;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            opacity: 0.4;
            margin-bottom: 0.5rem;
          }

          .me-mobile-info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }

          .me-mobile-info-item {
            font-family: var(--serif);
            font-size: 0.85rem;
            line-height: 1.4;
          }

          .me-mobile-community-scroll {
            display: flex;
            gap: 0.75rem;
            overflow-x: auto;
            margin: 0 -1.5rem;
            padding: 0 1.5rem;
            scrollbar-width: none;
          }

          .me-mobile-community-scroll::-webkit-scrollbar {
            display: none;
          }

          .me-mobile-design {
            flex-shrink: 0;
            width: 100px;
          }

          .me-mobile-design-thumb {
            width: 100px;
            height: 100px;
            background: rgba(0,0,0,0.04);
            border: 1px solid rgba(0,0,0,0.08);
            border-radius: 6px;
            margin-bottom: 0.35rem;
          }

          .me-mobile-design-name {
            font-family: var(--serif);
            font-size: 0.75rem;
          }

          .me-mobile-design-author {
            font-family: var(--mono);
            font-size: 0.5rem;
            opacity: 0.4;
          }
        }

        @media (min-width: 1024px) {
          .me-mobile-evidence {
            display: none;
          }
        }

        /* ═══════════════════════════════════════════════════════════════════
           OPTION TRAY
        ═══════════════════════════════════════════════════════════════════ */
        .me-tray {
          position: fixed;
          z-index: 100;
          background: var(--bg);
          border: 1px solid rgba(0,0,0,0.12);
          border-radius: 16px;
          padding: 1rem 1.25rem;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          pointer-events: auto;
          max-width: 360px;
          width: calc(100vw - 2rem);
          left: 50%;
          transform: translateX(-50%);
        }

        .me-tray.mobile {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          width: 100%;
          max-width: 100%;
          transform: none;
          border-radius: 20px 20px 0 0;
          padding-bottom: 2rem;
        }

        .me-tray-handle {
          width: 36px;
          height: 4px;
          background: rgba(0,0,0,0.15);
          border-radius: 2px;
          margin: 0 auto 0.75rem;
        }

        .me-tray-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(0,0,0,0.08);
        }

        .me-tray-title {
          font-family: var(--mono);
          font-size: 0.55rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          opacity: 0.5;
        }

        .me-tray-close {
          background: none;
          border: none;
          padding: 0.5rem;
          margin: -0.5rem;
          cursor: pointer;
          opacity: 0.4;
        }

        .me-tray-close:hover {
          opacity: 1;
        }

        .me-tray-options {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .me-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 0.8rem;
          background: transparent;
          border: 1px solid rgba(0,0,0,0.12);
          border-radius: 100px;
          cursor: pointer;
          transition: all 0.15s;
          font-family: var(--mono);
          font-size: 0.65rem;
          color: var(--ink);
        }

        .me-chip:hover {
          border-color: rgba(0,0,0,0.4);
        }

        .me-chip.selected {
          background: var(--ink);
          border-color: var(--ink);
          color: var(--bg);
        }

        .me-chip-swatch {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 1px solid rgba(0,0,0,0.1);
        }

        .me-chip.selected .me-chip-swatch {
          border-color: rgba(255,255,255,0.3);
        }

        /* ═══════════════════════════════════════════════════════════════════
           MARGIN TOGGLE (for clean view)
        ═══════════════════════════════════════════════════════════════════ */
        .me-margin-toggle {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          font-family: var(--mono);
          font-size: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--ink);
          opacity: 0.3;
          cursor: pointer;
          padding: 0.5rem;
          pointer-events: auto;
          transition: opacity 0.2s;
          z-index: 10;
        }

        .me-margin-toggle:hover {
          opacity: 0.7;
        }

        @media (max-width: 1023px) {
          .me-margin-toggle {
            display: none;
          }
        }
      `}</style>

      {/* Full gallery overlay (preview cards intentionally empty for now) */}
      <AnimatePresence>
        {showFullGallery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setShowFullGallery(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(20, 20, 20, 0.25)',
              zIndex: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
              pointerEvents: 'auto',
            }}
          >
            <motion.div
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 8, opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: 'min(920px, 100%)',
                maxHeight: 'min(720px, 100%)',
                overflow: 'auto',
                background: '#F8F5F0',
                border: '1px solid rgba(26,26,26,0.25)',
                padding: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.6 }}>
                    Community Gallery
                  </div>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontStyle: 'italic', marginTop: 6 }}>
                    Maker designs
                  </div>
                </div>
                <button
                  onClick={() => setShowFullGallery(false)}
                  style={{
                    border: '1px solid rgba(26,26,26,0.25)',
                    background: 'transparent',
                    padding: '8px 10px',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 10,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>

              <div style={{ height: 1, background: 'rgba(26,26,26,0.12)', margin: '16px 0' }} />

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 12,
                }}
              >
                {communityDesigns.map((design) => (
                  <button
                    key={design.id}
                    style={{
                      textAlign: 'left',
                      border: '1px solid rgba(26,26,26,0.18)',
                      background: 'rgba(255,255,255,0.4)',
                      padding: 12,
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      // future: load design configuration
                      setShowFullGallery(false);
                    }}
                  >
                    <div
                      style={{
                        aspectRatio: '1 / 1',
                        border: '1px solid rgba(26,26,26,0.12)',
                        background: 'rgba(26,26,26,0.04)',
                        marginBottom: 10,
                      }}
                    />
                    <div style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 18 }}>{design.name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, gap: 10 }}>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.7 }}>
                        {design.author}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, opacity: 0.7 }}>
                        <HeartIcon filled={design.liked} />
                        {design.likes}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="me-container">
        {/* Margin toggle */}
        {!isMobile && (
          <button 
            className="me-margin-toggle"
            onClick={() => setMarginsVisible(!marginsVisible)}
          >
            {marginsVisible ? 'Hide details' : 'Show details'}
          </button>
        )}

        {/* LEFT MARGIN - INFO */}
        {!isMobile && marginsVisible && (
          <motion.div 
            className="me-left-margin"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="me-info-section">
              <span className="me-info-label">Materials</span>
              <p className="me-info-text">
                <span className="me-info-highlight">Full-grain leather</span> sourced from Tuscany. 
                Hand-stitched with waxed linen thread. 
                Edges hand-painted and burnished.
              </p>
            </div>

            <div className="me-info-section">
              <span className="me-info-label">Hardware</span>
              <p className="me-info-text">
                <span className="me-info-highlight">Solid brass</span>, 
                not plated. Anti-tarnish finish. 
                Will develop a natural patina over time.
              </p>
            </div>

            <div className="me-info-section">
              <span className="me-info-label">Care</span>
              <p className="me-info-text">
                Store in the included dust bag. 
                Condition with leather balm quarterly. 
                Avoid prolonged sunlight.
              </p>
            </div>

            <div className="me-info-section">
              <span className="me-info-label">Shipping</span>
              <p className="me-info-text">
                Made to order. Ships in <span className="me-info-highlight">10–14 days</span>. 
                Complimentary worldwide delivery. 
                Signature required.
              </p>
            </div>
          </motion.div>
        )}

        {/* RIGHT MARGIN - COMMUNITY */}
        {!isMobile && marginsVisible && (
          <motion.div 
            className="me-right-margin"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="me-community-header">
              <div className="me-community-count">721</div>
              <span className="me-community-label">makers have customized this</span>
            </div>

            {communityDesigns.slice(0, 3).map(design => (
              <div key={design.id} className="me-design-card" onClick={() => setShowFullGallery(true)}>
                <div className="me-design-thumb" />
                <div className="me-design-name">{design.name}</div>
                <div className="me-design-meta">
                  <span className="me-design-author">{design.author}</span>
                  <span className={`me-design-likes ${design.liked ? 'liked' : ''}`}>
                    <HeartIcon filled={design.liked} />
                    {design.likes}
                  </span>
                </div>
              </div>
            ))}

            <button className="me-see-all" onClick={() => setShowFullGallery(true)}>
              See all designs →
            </button>
          </motion.div>
        )}

        {/* CENTER - CLEAN SENTENCE */}
        <div className="me-center" style={!isMobile && marginsVisible ? {} : { left: 0, right: 0 }}>
          <div className="me-sentence">
            <span>This </span>
            <span style={{ fontStyle: 'italic' }}>{product.name}</span>
            <span> is </span>
            {tokens.map((token, i) => (
              <React.Fragment key={token.id}>
                <span className="sentence-glue">
                  {token.prefix ? <span className="me-prefix">{token.prefix}{'\u00A0'}</span> : null}
                  <button
                    className={`me-token ${activeToken?.id === token.id ? 'active' : ''}`}
                    onClick={() => handleTokenTap(token)}
                  >
                    {token.value}
                  </button>
                </span>
                {i < tokens.length - 1 && <span> </span>}
              </React.Fragment>
            ))}
            <span>&nbsp;handles.</span>
          </div>

          <div className="me-footer">
            <span className="me-price" onClick={onOpenPrice}>£{totalPrice}</span>
            <div className="me-cta-group">
              <button className="me-btn me-btn-secondary" onClick={onLoginRequest}>Save</button>
              <button className="me-btn me-btn-primary">Add to Cart</button>
            </div>
          </div>

          {/* Mobile: Evidence sections below */}
          {isMobile && (
            <div className="me-mobile-evidence">
              <div className="me-mobile-section">
                <div className="me-mobile-section-title">About This Product</div>
                <div className="me-mobile-info-grid">
                  <div className="me-mobile-info-item">
                    <strong>Materials:</strong> Full-grain Tuscan leather, hand-stitched
                  </div>
                  <div className="me-mobile-info-item">
                    <strong>Hardware:</strong> Solid brass, anti-tarnish
                  </div>
                  <div className="me-mobile-info-item">
                    <strong>Lead Time:</strong> 10–14 days
                  </div>
                  <div className="me-mobile-info-item">
                    <strong>Shipping:</strong> Worldwide, free
                  </div>
                </div>
              </div>

              <div className="me-mobile-section">
                <div className="me-mobile-section-title">721 makers have customized this</div>
                <div className="me-mobile-community-scroll">
                  {communityDesigns.map(design => (
                    <div key={design.id} className="me-mobile-design" onClick={() => setShowFullGallery(true)}>
                      <div className="me-mobile-design-thumb" />
                      <div className="me-mobile-design-name">{design.name}</div>
                      <div className="me-mobile-design-author">{design.author}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* OPTION TRAY */}
        <AnimatePresence>
          {activeToken && activeNode && (
            <motion.div
              ref={trayRef}
              className={`me-tray ${isMobile ? 'mobile' : ''}`}
              initial={{ opacity: 0, y: isMobile ? 100 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: isMobile ? 100 : 10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={!isMobile ? { bottom: 200 } : undefined}
            >
              {isMobile && <div className="me-tray-handle" />}
              <div className="me-tray-header">
                <span className="me-tray-title">{activeToken.label}</span>
                <button className="me-tray-close" onClick={() => { setActiveToken(null); setActiveNode(null); }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <div className="me-tray-options">
                {activeNode.children?.filter(c => c.type === 'option').map(option => {
                  const isSelected = configuration.selections[activeNode.id]?.value === option.id ||
                    (!configuration.selections[activeNode.id] && option.default === true);
                  const swatchColor = getSwatchColor(option.label);
                  return (
                    <button
                      key={option.id}
                      className={`me-chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleOptionSelect(activeNode.id, option.id)}
                    >
                      {swatchColor && <span className="me-chip-swatch" style={{ background: swatchColor }} />}
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

export default MarginsEvidence;


