// IdentityTagV2 - Tree-based version of IdentityTag
// Uses TreeNode structure with ConfigurationStateV2

import React, { useState, useEffect } from 'react';
import { ConfigurationStateV2, Product, TreeNode } from '../types-tree';
import { TreeSection } from './TreeLine';
import { findNodeById, getDisplayValue } from '../utils/treeHelpers';

// Thin Arrow Icons (Pattern-Cutting Style)
const ChevronDown = () => (
  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronUp = () => (
  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 5L5 1L1 5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DoubleChevronDown = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 1L5 4L9 1" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M1 6L5 9L9 6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DoubleChevronUp = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 9L5 6L1 9" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 4L5 1L1 4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Thin Arrow for navigation
const ThinArrowLeft = () => (
  <svg width="8" height="10" viewBox="0 0 8 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 1L2 5L7 9" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ThinArrowRight = () => (
  <svg width="8" height="10" viewBox="0 0 8 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 1L6 5L1 9" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const InfoIcon = () => (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7" cy="7" r="7" fill="currentColor"/>
    <text x="7" y="11" textAnchor="middle" fontSize="10" fontStyle="italic" fontFamily="serif" fill="#1a1a1a">i</text>
  </svg>
);

interface IdentityTagV2Props {
  expanded: boolean;
  onToggle: () => void;
  /** Optional: force the initially-selected tab (used when embedding this widget elsewhere) */
  initialTab?: 'CUSTOMIZE' | 'INFO' | 'GALLERY';
  /** Optional: hide the tab navigation bar if the widget is controlled externally */
  hideTabBar?: boolean;
  /** Optional: remove frame/borders for seamless embedding */
  embedded?: boolean;
  configuration: ConfigurationStateV2;
  product: Product;
  onNodeClick: (nodeId: string) => void;
  onPresetSelect?: (presetName: string) => void;
  totalPrice: number;
  onOpenPrice: () => void;
  onLoginRequest: () => void;
  availablePresets?: string[];
  currentPresetName?: string;
}

export const IdentityTagV2: React.FC<IdentityTagV2Props> = ({
  expanded,
  onToggle,
  initialTab,
  hideTabBar,
  embedded,
  configuration,
  product,
  onNodeClick,
  onPresetSelect,
  totalPrice,
  onOpenPrice,
  onLoginRequest,
  availablePresets = ['Studio Noir', 'Minimal Latte', 'Urban Charcoal'],
  currentPresetName = 'Custom'
}) => {
  const [activeTabLocal, setActiveTabLocal] = useState<'CUSTOMIZE' | 'INFO' | 'GALLERY'>(initialTab ?? 'CUSTOMIZE');
  const [activePreset, setActivePreset] = useState(currentPresetName);
  const [isPresetOpen, setIsPresetOpen] = useState(false);

  useEffect(() => {
    if (initialTab && initialTab !== activeTabLocal) {
      setActiveTabLocal(initialTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTab]);

  const configTitle = embedded ? 'Your Build' : 'Configuration';
  const infoTitle = embedded ? 'Info & Care' : 'Specification';
  const communityTitle = embedded ? 'Explore & Remix' : 'Community';

  // Context menu state - which node's options are being shown
  const [activeContextNode, setActiveContextNode] = useState<TreeNode | null>(null);

  // Component view state - showing all attributes of a component
  const [activeComponentNode, setActiveComponentNode] = useState<TreeNode | null>(null);

  const handlePresetSelect = (presetName: string) => {
    setActivePreset(presetName);
    setIsPresetOpen(false);
    if (onPresetSelect) {
      onPresetSelect(presetName);
    }
  };

  // Handle node click - show options panel instead of calling parent
  const handleNodeClickInternal = (nodeId: string) => {
    const node = findNodeById(product.customizationTree, nodeId);
    if (node && node.children && node.children.some(child => child.type === 'option')) {
      setActiveContextNode(node);
    } else {
      onNodeClick(nodeId);
    }
  };

  // Handle option selection
  const handleOptionSelect = (nodeId: string, optionId: string) => {
    // Call parent's onNodeClick with special format to indicate selection
    onNodeClick(`${nodeId}:${optionId}`);
    // Close the options panel
    setActiveContextNode(null);
  };

  // Group tree nodes by top-level components
  const componentSections: { [key: string]: TreeNode[] } = {};

  product.customizationTree.forEach(node => {
    if (node.type === 'component') {
      componentSections[node.label] = [node];
    }
  });

  return (
    <>
      <style>{`
        :root {
          --bg-color: #F8F5F0;
          --text-color: #000;
          --border-color: #000;
          --accent-color: #C20000;
          --frame-radius: 24px;
          --serif-font: 'PP Editorial Old', serif;
          --sans-serif-font: 'JetBrains Mono', monospace;
          --mono-font: 'JetBrains Mono', monospace;
          --fs-xs: 0.7rem;
          --fs-sm: 0.875rem;
        }

        .customizer-widget {
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          border-radius: var(--frame-radius);
          width: min(360px, 100%);
          min-width: 280px;
          max-width: 360px;
          flex: 0 0 auto;
          margin: 0;
          position: relative;
          z-index: 40;
          display: flex;
          flex-direction: column;
          overflow: visible;
          box-shadow: none;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          font-family: var(--sans-serif-font);
        }

        .customizer-widget.embedded {
            border: none;
            border-radius: 0;
            width: 100%;
            max-width: 100%;
            min-width: 0;
            background: transparent;
        }

        .cw-toggle-button {
          background: transparent;
          border: none;
          color: var(--text-color);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s;
          flex-shrink: 0;
          padding: 0.25rem;
        }
        .cw-toggle-button:hover {
          transform: scale(1.1);
        }
        .cw-toggle-button svg {
          width: 14px;
          height: 14px;
        }
        .cw-toggle-button--sticky {
          position: sticky;
          top: 0;
          z-index: 10;
          background: var(--bg-color);
          float: right;
          margin-top: 0.5rem;
          margin-bottom: -1.5rem;
        }

        @media (min-width: 768px) {
          .customizer-widget {
            position: relative;
            margin: 0;
            width: 360px;
            max-height: 90vh;
          }
        }

        /* TABS */
        .cw-tabs {
          display: flex;
          border-bottom: 1px solid var(--border-color);
          position: relative;
        }
        .cw-tab {
          flex: 1;
          background: transparent;
          border: none;
          border-right: 1px solid var(--border-color);
          border-bottom: 1px solid var(--border-color);
          margin-bottom: -1px;
          padding: 0.75rem 0.25rem;
          font-family: var(--sans-serif-font);
          font-size: var(--fs-xs);
          font-weight: 300;
          letter-spacing: 0.1em;
          cursor: pointer;
          text-transform: uppercase;
          transition: color 0.2s, background-color 0.2s;
          color: var(--text-color);
          position: relative;
        }
        .cw-tab:first-child {
          border-top-left-radius: calc(var(--frame-radius) - 1px);
        }
        .cw-tab:last-child {
          border-right: none;
          border-top-right-radius: calc(var(--frame-radius) - 1px);
        }
        .cw-tab.active {
          background: var(--bg-color);
          z-index: 2;
        }
        /* Red accent line on active tab */
        .cw-tab.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--accent-color);
        }
        .cw-tab:not(.active) {
          background: transparent;
          color: rgba(0,0,0,0.6);
        }

        /* VIEWPORT & CONTENT */
        .cw-viewport {
          background: var(--bg-color);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .customizer-widget.embedded .cw-content-expanded {
            height: auto;
            max-height: none;
            overflow-y: visible;
            padding-bottom: 4rem;
        }

        .cw-content-expanded {
          padding: 1rem;
          overflow-y: auto;
          height: 540px;
        }

        .cw-content-collapsed {
          padding: 1rem;
          cursor: pointer;
          background: var(--bg-color);
          border-bottom: 1px solid var(--border-color);
        }

        /* PRESET DROPDOWN */
        .cw-preset-dropdown {
          margin-bottom: 0;
          position: relative;
        }

        .cw-preset-trigger {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border: 1px solid var(--border-color);
          padding: 0.5rem 0.8rem;
          font-family: var(--serif-font);
          font-size: 1.1rem;
          font-weight: 200;
          font-style: normal;
          background: transparent;
          cursor: pointer;
          text-align: left;
          transition: background-color 0.2s;
          border-radius: 4px;
          line-height: 1;
          overflow: hidden;
        }
        .cw-preset-trigger span {
          display: block;
          transform: translateY(1px);
        }
        .cw-preset-trigger:hover {
          background: transparent;
        }

        .cw-preset-options {
          border: 1px solid var(--border-color);
          border-top: none;
          margin-top: -1px;
          background: var(--bg-color);
          display: flex;
          flex-direction: column;
          border-bottom-left-radius: 4px;
          border-bottom-right-radius: 4px;
          overflow: hidden;
          position: absolute;
          left: 0;
          right: 0;
          z-index: 10;
        }

        .cw-preset-option {
          padding: 0.8rem 1rem;
          font-family: var(--serif-font);
          background: transparent;
          border: none;
          border-bottom: 1px solid var(--border-color);
          cursor: pointer;
          text-align: left;
          font-size: 1rem;
          transition: background 0.2s;
        }
        .cw-preset-option:last-child {
          border-bottom: none;
        }
        .cw-preset-option:hover {
          background: #fff;
        }
        .cw-preset-option.selected {
          background: transparent;
          font-weight: 500;
        }

        /* CONFIG LIST */
        .cw-config-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .cw-section {
          display: flex;
          flex-direction: column;
        }
        /* Section title with thin accent underline */
        .cw-section-title {
          font-family: var(--sans-serif-font);
          font-weight: 500;
          letter-spacing: 0.15em;
          font-size: 0.65rem;
          border-bottom: 1px solid var(--accent-color);
          display: inline-block;
          width: fit-content;
          padding-bottom: 2px;
          margin-bottom: 0.5rem;
          color: var(--text-color);
          line-height: 1.2;
        }

        /* TREE ROWS - Graph Tree Structure */
        .cw-config-tree {
          position: relative;
        }

        .cw-row {
          font-family: var(--mono-font);
          font-size: 0.75rem;
          white-space: nowrap;
          cursor: pointer;
          transition: background 0.15s;
          color: var(--text-color);
        }

        .cw-row:hover {
          background: rgba(0,0,0,0.03);
        }

        /* Labels - Monospace, Pure Black, Normal weight */
        .cw-label {
          margin-right: 4px;
          font-family: var(--mono-font);
          font-weight: 400;
          color: var(--text-color);
        }
        /* Leader Lines - Dotted, Pure Black, 1px */
        .cw-dots {
          flex-grow: 1;
          border-bottom: 1px dotted var(--text-color);
          margin: 0 8px;
          position: relative;
          top: -4px;
        }
        /* Values - Monospace, Pure Black, Normal weight */
        .cw-value {
          margin-right: 4px;
          font-family: var(--mono-font);
          font-weight: 400;
          color: var(--text-color);
        }
        .cw-caret {
          font-size: 0.6em;
          margin-left: 2px;
          opacity: 0.7;
        }
        .cw-caret svg { display: block; }

        /* INLINE ACTIONS */
        .cw-inline-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(0,0,0,0.1);
        }
        .cw-btn-outline {
          border: 1px solid var(--border-color);
          background: transparent;
          padding: 0.6rem 1.5rem;
          font-family: var(--sans-serif-font);
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.2s;
          border-radius: 2px;
          color: var(--text-color);
          width: 100%;
        }
        .cw-btn-outline:hover { 
          background: #fff; 
        }

        /* COLLAPSED HEADER */
        .cw-collapsed-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .cw-serif-title {
          font-family: var(--serif-font);
          font-size: 1.75rem;
          font-weight: 300;
          line-height: 1;
          white-space: nowrap;
        }
        .cw-serif-title em {
          font-family: var(--serif-font);
          font-size: 0.8em;
          margin: 0 0.2em;
          font-weight: 300;
        }
        .cw-serif-title .underline {
          text-decoration: underline;
          text-decoration-color: var(--accent-color);
          text-decoration-thickness: 1px;
          text-underline-offset: 4px;
          cursor: pointer;
        }
        .cw-signin-link {
          font-weight: 300;
        }

        /* MAIN CTA */
        .cw-main-cta {
          margin: 0 -1px -1px -1px;
          overflow: hidden;
          border-bottom-left-radius: var(--frame-radius);
          border-bottom-right-radius: var(--frame-radius);
        }
        .cw-add-to-cart-btn {
          width: 100%;
          background: var(--text-color);
          color: var(--bg-color);
          border: none;
          padding: 0.75rem 1.5rem;
          font-family: var(--sans-serif-font);
          font-size: var(--fs-xs);
          font-weight: 300;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: background 0.2s;
          border-radius: 0;
          line-height: 1;
        }
        .cw-add-to-cart-btn:hover {
          background: rgba(0,0,0,0.9);
        }
        .cw-price {
          font-family: var(--serif-font);
          font-size: 1.75rem;
          font-style: italic;
          font-weight: 300;
          line-height: 1;
        }

        /* INFO TAB STYLES */
        .cw-customize-content,
        .cw-info-content {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .cw-info-title {
          font-family: var(--serif-font);
          font-size: 1.75rem;
          font-style: italic;
          margin-bottom: 0.5rem;
          margin-top: 0.5rem;
        }
        .cw-info-text {
          font-family: var(--sans-serif-font);
          font-size: 0.75rem;
          line-height: 1.6;
          color: var(--text-color);
          opacity: 0.8;
        }
        .cw-info-subtitle {
          font-family: var(--serif-font);
          font-size: 1rem;
          font-weight: 300;
          line-height: 1.4;
          color: var(--text-color);
          opacity: 0.8;
          margin-top: 0.25rem;
        }
        .cw-info-section {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        /* COMMUNITY TAB STYLES */
        .cw-community-content {
          display: flex;
          flex-direction: column;
        }
        .cw-community-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
        .cw-community-card {
          border: 1px solid var(--border-color);
          border-radius: 4px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s;
        }
        .cw-community-card:hover {
          border-color: var(--text-color);
          transform: translateY(-2px);
        }
        .cw-community-preview {
          height: 80px;
          background: transparent;
          border: 1px solid var(--border-color);
        }
        .cw-community-meta {
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .cw-community-name {
          font-family: var(--serif-font);
          font-size: 0.85rem;
        }
        .cw-community-author {
          font-family: var(--sans-serif-font);
          font-size: 0.65rem;
          opacity: 0.5;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .cw-community-likes {
          padding: 0.25rem 0.5rem;
          font-size: 0.7rem;
          opacity: 0.6;
          border-top: 1px solid var(--border-color);
        }
      `}</style>

      <div className={`customizer-widget ${expanded ? 'expanded' : 'collapsed'} ${embedded ? 'embedded' : ''}`}>
        {/* Tabs Header */}
        {!hideTabBar && (
          <div className="cw-tabs">
            {(['CUSTOMIZE', 'INFO', 'GALLERY'] as const).map(tab => (
              <button
                key={tab}
                className={`cw-tab ${activeTabLocal === tab ? 'active' : ''}`}
                onClick={() => {
                  setActiveTabLocal(tab);
                  if (!expanded) onToggle();
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {/* Dynamic Content Area */}
        <div className="cw-viewport">
          {expanded ? (
            <div className="cw-content-expanded">
              {!embedded && (
                <button
                  className="cw-toggle-button cw-toggle-button--sticky"
                  onClick={onToggle}
                  aria-label="Collapse panel"
                >
                  <DoubleChevronDown />
                </button>
              )}

              {/* CUSTOMIZE TAB */}
              {activeTabLocal === 'CUSTOMIZE' && !activeContextNode && !activeComponentNode && (
                <div className="cw-customize-content">
                  <div style={{ marginBottom: '1rem' }}>
                    <h3 className="cw-info-title">{configTitle}</h3>
                    <p className="cw-info-subtitle">
                      Everything customizable, clearly organized.
                    </p>
                    {/* Divider line under subtitle */}
                    <div style={{ width: '100%', height: '1px', background: 'var(--border-color)', marginTop: '1.5rem' }} />
                  </div>

                  {/* Preset Dropdown Selector */}
                  <div className="cw-preset-dropdown" style={{ marginBottom: '0.5rem' }}>
                    <button
                      className="cw-preset-trigger"
                      onClick={() => setIsPresetOpen(!isPresetOpen)}
                    >
                      <span>{activePreset}</span>
                      {isPresetOpen ? <ChevronUp /> : <ChevronDown />}
                    </button>

                    {isPresetOpen && (
                      <div className="cw-preset-options">
                        {availablePresets.map(preset => (
                          <button
                            key={preset}
                            className={`cw-preset-option ${activePreset === preset ? 'selected' : ''}`}
                            onClick={() => handlePresetSelect(preset)}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tree-based Configuration Sections */}
                  <div className="cw-config-list">
                    {Object.entries(componentSections).map(([sectionLabel, nodes]) => (
                      <TreeSection
                        key={sectionLabel}
                        title={sectionLabel.toUpperCase()}
                        nodes={nodes}
                        config={configuration}
                        onNodeClick={handleNodeClickInternal}
                        onSectionClick={(node) => setActiveComponentNode(node)}
                      />
                    ))}
                  </div>

                  {/* Inline Actions (Save) - Hidden when embedded */}
                  {!embedded && (
                    <div className="cw-inline-actions">
                      <button className="cw-btn-outline">SAVE</button>
                    </div>
                  )}
                </div>
              )}

              {/* OPTIONS SELECTION PANEL - Shown when a node is clicked */}
              {activeTabLocal === 'CUSTOMIZE' && activeContextNode && (() => {
                // Find the parent component of this attribute node
                const parentComponent = product.customizationTree.find(comp =>
                  comp.children?.some(child => child.id === activeContextNode.id)
                );

                return (
                  <div className="cw-customize-content">
                    {/* Back button with thin arrow */}
                    <div
                      style={{
                        marginBottom: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        cursor: 'pointer',
                        padding: '0.25rem 0',
                        color: 'rgba(0,0,0,0.5)'
                      }}
                      onClick={() => setActiveContextNode(null)}
                    >
                      <ThinArrowLeft />
                      <span style={{
                        fontFamily: 'var(--sans-serif-font)',
                        fontSize: '9px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.2em'
                      }}>
                        Back
                      </span>
                    </div>

                    {/* Breadcrumb */}
                    <div style={{
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontFamily: 'var(--sans-serif-font)',
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      <span
                        style={{
                          opacity: 0.5,
                          cursor: 'pointer',
                          transition: 'opacity 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
                        onClick={() => {
                          setActiveContextNode(null);
                          setActiveComponentNode(null);
                        }}
                      >
                        {configTitle}
                      </span>
                      <span style={{ opacity: 0.3 }}>/</span>
                      <span
                        style={{
                          opacity: 0.5,
                          cursor: 'pointer',
                          transition: 'opacity 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveContextNode(null);
                          setTimeout(() => {
                            if (parentComponent) {
                              setActiveComponentNode(parentComponent);
                            }
                          }, 0);
                        }}
                      >
                        {parentComponent?.label || 'Component'}
                      </span>
                      <span style={{ opacity: 0.3 }}>/</span>
                      <span style={{
                        fontWeight: 600
                      }}>
                        {activeContextNode.label}
                      </span>
                    </div>

                    {/* Title and description */}
                    <div style={{ marginBottom: '1rem' }}>
                      <h3 className="cw-info-title">{activeContextNode.label}</h3>
                      {activeContextNode.description && (
                        <p className="cw-info-subtitle">{activeContextNode.description}</p>
                      )}
                    </div>

                    {/* Options Grid */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {activeContextNode.children?.filter(child => child.type === 'option').map(option => {
                      const isSelected = configuration.selections[activeContextNode.id]?.value === option.id ||
                                       (!configuration.selections[activeContextNode.id] && option.default === true);

                      return (
                        <div
                          key={option.id}
                          onClick={() => handleOptionSelect(activeContextNode.id, option.id)}
                          style={{
                            border: isSelected ? '2px solid var(--text-color)' : '1px solid rgba(0,0,0,0.15)',
                            borderRadius: '4px',
                            padding: '0.75rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease-out',
                            background: isSelected ? 'rgba(0,0,0,0.01)' : 'transparent',
                            minHeight: '80px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                          }}
                          className="option-card"
                        >
                          {/* Visual Preview Area */}
                          <div style={{
                            flex: 1,
                            marginBottom: '0.5rem',
                            background: 'rgba(0,0,0,0.02)',
                            borderRadius: '2px',
                            minHeight: '60px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.65rem',
                            color: 'rgba(0,0,0,0.3)'
                          }}>
                            {option.metadata?.thumbnail ? (
                              <img src={option.metadata.thumbnail} alt={option.label} style={{ maxWidth: '100%', maxHeight: '100%' }} />
                            ) : (
                              <span>Preview</span>
                            )}
                          </div>

                          {/* Option Info */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div>
                              <div style={{
                                fontFamily: 'var(--sans-serif-font)',
                                fontSize: '0.75rem',
                                fontWeight: isSelected ? 500 : 400,
                                marginBottom: '0.25rem'
                              }}>
                                {option.label}
                                {isSelected && <span style={{ marginLeft: '0.5rem' }}>✓</span>}
                              </div>
                              {option.description && (
                                <div style={{
                                  fontFamily: 'var(--serif-font)',
                                  fontSize: '0.65rem',
                                  opacity: 0.5,
                                  fontStyle: 'italic'
                                }}>
                                  {option.description}
                                </div>
                              )}
                            </div>

                            {option.priceModifier !== undefined && option.priceModifier !== 0 && (
                              <div style={{
                                fontFamily: 'var(--sans-serif-font)',
                                fontSize: '0.7rem',
                                opacity: 0.6
                              }}>
                                {option.priceModifier > 0 ? '+' : ''}£{option.priceModifier}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </div>
                );
              })()}

              {/* COMPONENT VIEW PANEL - Showing all attributes of a component */}
              {activeTabLocal === 'CUSTOMIZE' && activeComponentNode && !activeContextNode && (
                <div className="cw-customize-content">
                  {/* Back button */}
                  <div
                    style={{
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      cursor: 'pointer',
                      padding: '0.25rem 0',
                      color: 'rgba(0,0,0,0.5)'
                    }}
                    onClick={() => setActiveComponentNode(null)}
                  >
                    <ThinArrowLeft />
                    <span style={{
                      fontFamily: 'var(--sans-serif-font)',
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em'
                    }}>
                      Back
                    </span>
                  </div>

                  {/* Breadcrumb */}
                  <div style={{
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontFamily: 'var(--sans-serif-font)',
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    <span
                      style={{
                        opacity: 0.5,
                        cursor: 'pointer',
                        transition: 'opacity 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
                      onClick={() => setActiveComponentNode(null)}
                    >
                      {configTitle}
                    </span>
                    <span style={{ opacity: 0.3 }}>/</span>
                    <span style={{
                      fontWeight: 600
                    }}>
                      {activeComponentNode.label}
                    </span>
                  </div>

                  {/* Title */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 className="cw-info-title">{activeComponentNode.label}</h3>
                    {activeComponentNode.description && (
                      <p className="cw-info-subtitle">{activeComponentNode.description}</p>
                    )}
                  </div>

                  {/* All attributes of this component */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {activeComponentNode.children?.filter(child => child.type === 'attribute').map(attribute => (
                      <div key={attribute.id}>
                        {/* Attribute header - clickable to drill into options */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '0.75rem',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            borderBottom: '1px dashed rgba(0,0,0,0.2)',
                            borderRadius: '0'
                          }}
                          onClick={() => setActiveContextNode(attribute)}
                        >
                          <div>
                            <div style={{
                              fontFamily: 'var(--sans-serif-font)',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              marginBottom: '0.25rem'
                            }}>
                              {attribute.label}
                            </div>
                            <div style={{
                              fontFamily: 'var(--serif-font)',
                              fontSize: '0.85rem',
                              fontStyle: 'italic',
                              opacity: 0.7
                            }}>
                              {getDisplayValue(attribute, configuration)}
                            </div>
                          </div>
                          <span style={{ opacity: 0.4 }}><ThinArrowRight /></span>
                        </div>

                        {/* Quick preview of first 3 options */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '0.5rem'
                        }}>
                          {attribute.children?.filter(child => child.type === 'option').slice(0, 3).map(option => {
                            const isSelected = configuration.selections[attribute.id]?.value === option.id ||
                                             (!configuration.selections[attribute.id] && option.default === true);

                            return (
                              <div
                                key={option.id}
                                onClick={() => handleOptionSelect(attribute.id, option.id)}
                                style={{
                                  border: isSelected ? '2px solid var(--text-color)' : '1px solid var(--border-color)',
                                  borderRadius: '4px',
                                  padding: '0.5rem',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  background: 'transparent',
                                  minHeight: '60px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'space-between'
                                }}
                              >
                                {/* Preview area */}
                                <div style={{
                                  flex: 1,
                                  background: 'rgba(0,0,0,0.02)',
                                  borderRadius: '2px',
                                  minHeight: '40px',
                                  marginBottom: '0.25rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.6rem',
                                  opacity: 0.3,
                                  border: '1px dashed rgba(0,0,0,0.1)'
                                }}>
                                  {option.metadata?.thumbnail ? (
                                    <img src={option.metadata.thumbnail} alt={option.label} style={{ maxWidth: '100%', maxHeight: '100%' }} />
                                  ) : (
                                    <span>•</span>
                                  )}
                                </div>

                                {/* Option name */}
                                <div style={{
                                  fontFamily: 'var(--sans-serif-font)',
                                  fontSize: '0.65rem',
                                  fontWeight: isSelected ? 500 : 400,
                                  textAlign: 'center'
                                }}>
                                  {option.label}
                                  {isSelected && <span style={{ marginLeft: '0.25rem' }}>✓</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* "See all" link if there are more than 3 options */}
                        {attribute.children && attribute.children.filter(c => c.type === 'option').length > 3 && (
                          <div
                            style={{
                              marginTop: '0.5rem',
                              textAlign: 'center',
                              cursor: 'pointer',
                              fontSize: '0.7rem',
                              opacity: 0.6,
                              textDecoration: 'underline'
                            }}
                            onClick={() => setActiveContextNode(attribute)}
                          >
                            See all {attribute.children.filter(c => c.type === 'option').length} options
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* INFO TAB */}
              {activeTabLocal === 'INFO' && (
                <div className="cw-info-content">
                  <div style={{ marginBottom: '0.75rem' }}>
                    <h3 className="cw-info-title">{infoTitle}</h3>
                    <p className="cw-info-subtitle">
                      All the practical stuff, in one place.
                    </p>
                    {/* Divider line under subtitle */}
                    <div style={{ width: '100%', height: '1px', background: 'var(--border-color)', marginTop: '1.5rem' }} />
                  </div>

                  <div className="cw-info-section">
                    <h4 className="cw-section-title" style={{ marginTop: '0' }}>MATERIALS</h4>
                    <p className="cw-info-text">
                      Premium full-grain leather, solid brass hardware, hand-stitched detailing with waxed thread.
                    </p>
                  </div>

                  <div className="cw-info-section">
                    <h4 className="cw-section-title">CARE</h4>
                    <p className="cw-info-text">
                      Store in dust bag when not in use. Condition leather quarterly. Avoid prolonged exposure to direct sunlight.
                    </p>
                  </div>

                  <div className="cw-info-section">
                    <h4 className="cw-section-title">SHIPPING</h4>
                    <p className="cw-info-text">
                      Made to order. Ships within 2-3 weeks. Complimentary worldwide delivery.
                    </p>
                  </div>
                </div>
              )}

              {/* GALLERY TAB */}
              {activeTabLocal === 'GALLERY' && (
                <div className="cw-community-content">
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 className="cw-info-title">{communityTitle}</h3>
                    <p className="cw-info-subtitle">
                      Great starting points, ready to edit.
                    </p>
                    {/* Divider line under subtitle */}
                    <div style={{ width: '100%', height: '1px', background: 'var(--border-color)', marginTop: '1.5rem' }} />
                  </div>

                  <div className="cw-inline-actions" style={{ marginTop: '0', paddingTop: '0', borderTop: 'none', marginBottom: '1rem' }}>
                    <button className="cw-btn-outline" onClick={onLoginRequest}>SHARE YOURS</button>
                  </div>

                  <div className="cw-carousel-container" style={{ position: 'relative', marginBottom: '1rem' }}>
                    <div className="cw-community-card" style={{ height: '300px', position: 'relative', border: '1px solid var(--border-color)' }}>
                      <div className="cw-community-preview" style={{ height: '100%', border: 'none' }}></div>
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '1rem',
                          left: '1rem',
                          right: '1rem',
                          color: 'var(--text-color)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-end',
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline', gap: '0.3rem' }}>
                          <span className="cw-info-text">Midnight Luxe</span>
                          <span className="cw-info-text" style={{ opacity: 0.6 }}>by</span>
                          <span className="cw-info-text" style={{ fontWeight: 'bold' }}>@elena.v</span>
                        </div>
                        <div style={{ fontSize: '0.9rem' }}>♡ 234</div>
                      </div>
                    </div>

                    {/* Navigation with thin arrows */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', padding: '0 0.5rem' }}>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'rgba(0,0,0,0.5)', fontFamily: 'var(--sans-serif-font)', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                        <ThinArrowLeft /> PREV
                      </button>
                      <span style={{ fontFamily: 'var(--sans-serif-font)', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '2px' }}>VIEW ALL</span>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'rgba(0,0,0,0.5)', fontFamily: 'var(--sans-serif-font)', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                        NEXT <ThinArrowRight />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="cw-content-collapsed" onClick={onToggle}>
              <div className="cw-collapsed-header">
                <span className="cw-serif-title">
                  {product.name} <em>by</em>{' '}
                  <span
                    className="underline cw-signin-link"
                    onClick={(e) => { e.stopPropagation(); onLoginRequest(); }}
                  >
                    {configuration.user.username || 'Guest'}
                  </span>
                </span>
                <button
                  className="cw-toggle-button"
                  onClick={(e) => { e.stopPropagation(); onToggle(); }}
                  aria-label="Expand panel"
                >
                  <DoubleChevronUp />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main CTA - Always Visible unless embedded */}
        {!embedded && (
          <div className="cw-main-cta">
            <button className="cw-add-to-cart-btn">
              <span className="cw-add-label">ADD TO CART</span>
              <span className="cw-price" style={{ position: 'relative' }}>
                £{totalPrice}
                <span
                  onClick={(e) => { e.stopPropagation(); onOpenPrice(); }}
                  style={{
                    cursor: 'pointer',
                    position: 'absolute',
                    top: '-4px',
                    right: '-14px'
                  }}
                  title="Price breakdown"
                >
                  <InfoIcon />
                </span>
              </span>
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default IdentityTagV2;
