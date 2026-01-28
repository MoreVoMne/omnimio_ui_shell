// TreeLine Component - Graph Tree Renderer
// Renders a proper visual tree with connecting lines at each level
// Structure: ├── for items, └── for last item, │ for continuing lines

import React from 'react';
import { TreeNode, ConfigurationStateV2 } from '../types-tree';
import { getDisplayValue, getNodeOpacity } from '../utils/treeHelpers';

// Thin right arrow - indicates "go to" not "dropdown"
const ThinArrowRight = () => (
  <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 1L6 4L2 7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Tree line characters rendered as SVG for precise control
const INDENT_WIDTH = 20; // pixels per indent level
const LINE_COLOR = '#1a1a1a';

interface TreeLineProps {
  node: TreeNode;
  config: ConfigurationStateV2;
  onNodeClick: (nodeId: string) => void;
  isLast?: boolean;
  depth?: number;
  ancestors?: boolean[]; // true = ancestor is last (no line), false = ancestor continues (draw line)
}

export const TreeLine: React.FC<TreeLineProps> = ({
  node,
  config,
  onNodeClick,
  isLast = false,
  depth = 0,
  ancestors = []
}) => {
  // Skip option nodes - they should only appear in context menus
  if (node.type === 'option') {
    return null;
  }

  // For component nodes, just render their attribute children
  // (the heading itself is rendered by TreeSection)
  if (node.type === 'component') {
    return (
      <>
        {node.children?.filter(child => child.type !== 'option').map((child, index) => {
          const filteredChildren = node.children?.filter(c => c.type !== 'option') || [];
          return (
            <TreeLine
              key={child.id}
              node={child}
              config={config}
              onNodeClick={onNodeClick}
              isLast={index === filteredChildren.length - 1}
              depth={depth}
              ancestors={ancestors}
            />
          );
        })}
      </>
    );
  }

  // For attribute nodes, render the row showing current selection
  const displayValue = getDisplayValue(node, config);
  const opacity = getNodeOpacity(node, config);

  // Check if node has been modified
  const selection = config.selections[node.id];
  const isModified = selection !== undefined && selection.value !== node.default;

  // Get nested attributes (children that are type 'attribute', not 'option')
  const nestedAttributes = node.children?.filter(child => child.type === 'attribute') || [];

  // Build the tree prefix (the │ ├ └ characters)
  const renderTreePrefix = () => {
    const elements: React.ReactNode[] = [];
    
    // Render ancestor lines (│ or space)
    for (let i = 0; i < ancestors.length; i++) {
      const ancestorIsLast = ancestors[i];
      elements.push(
        <span
          key={`ancestor-${i}`}
          style={{
            display: 'inline-block',
            width: `${INDENT_WIDTH}px`,
            height: '100%',
            position: 'relative'
          }}
        >
          {/* Vertical continuation line if ancestor is not last */}
          {!ancestorIsLast && (
            <span style={{
              position: 'absolute',
              left: '8px',
              top: 0,
              bottom: 0,
              width: '1px',
              background: LINE_COLOR
            }} />
          )}
        </span>
      );
    }
    
    // Render current node connector (├── or └──)
    if (depth > 0) {
      elements.push(
        <span
          key="connector"
          style={{
            display: 'inline-block',
            width: `${INDENT_WIDTH}px`,
            height: '100%',
            position: 'relative'
          }}
        >
          {/* Vertical line - full height for ├, half for └ */}
          <span style={{
            position: 'absolute',
            left: '8px',
            top: 0,
            height: isLast ? '50%' : '100%',
            width: '1px',
            background: LINE_COLOR
          }} />
          {/* Horizontal line */}
          <span style={{
            position: 'absolute',
            left: '8px',
            top: '50%',
            width: '10px',
            height: '1px',
            background: LINE_COLOR
          }} />
        </span>
      );
    }
    
    return elements;
  };

  return (
    <>
      <div
        className="cw-row"
        style={{
          opacity,
          display: 'flex',
          alignItems: 'stretch',
          position: 'relative',
          minHeight: '28px'
        }}
        onClick={() => node.clickable ? onNodeClick(node.id) : null}
      >
        {/* Tree structure prefix */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'stretch',
          flexShrink: 0
        }}>
          {renderTreePrefix()}
        </div>
        
        {/* Content */}
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          flex: 1,
          paddingLeft: '4px'
        }}>
          <span className="cw-label">{node.label}</span>
          <span className="cw-dots"></span>
          <span className="cw-value" style={{
            fontWeight: isModified ? '500' : '400'
          }}>
            {displayValue}
          </span>
          {node.clickable && (
            <span className="cw-caret" style={{ opacity: 0.4 }}>
              <ThinArrowRight />
            </span>
          )}
        </div>
      </div>
      
      {/* Render nested attributes */}
      {nestedAttributes.map((child, index) => (
        <TreeLine
          key={child.id}
          node={child}
          config={config}
          onNodeClick={onNodeClick}
          isLast={index === nestedAttributes.length - 1}
          depth={depth + 1}
          ancestors={[...ancestors, isLast]}
        />
      ))}
    </>
  );
};

interface TreeSectionProps {
  title: string;
  nodes: TreeNode[];
  config: ConfigurationStateV2;
  onNodeClick: (nodeId: string) => void;
  onSectionClick?: (node: TreeNode) => void;
}

export const TreeSection: React.FC<TreeSectionProps> = ({
  title,
  nodes,
  config,
  onNodeClick,
  onSectionClick
}) => {
  // Get the component node (first node in the section)
  const componentNode = nodes[0];

  return (
    <div className="cw-section">
      <h4
        className="cw-section-title"
        style={{
          cursor: onSectionClick ? 'pointer' : 'default',
          transition: 'opacity 0.2s'
        }}
        onClick={() => onSectionClick && componentNode && onSectionClick(componentNode)}
        onMouseEnter={(e) => onSectionClick && (e.currentTarget.style.opacity = '0.7')}
        onMouseLeave={(e) => onSectionClick && (e.currentTarget.style.opacity = '1')}
      >
        {title}
      </h4>
      <div className="cw-config-tree">
        {nodes.map((node, index) => (
          <TreeLine
            key={node.id}
            node={node}
            config={config}
            onNodeClick={onNodeClick}
            isLast={index === nodes.length - 1}
          />
        ))}
      </div>
    </div>
  );
};

export default TreeLine;
