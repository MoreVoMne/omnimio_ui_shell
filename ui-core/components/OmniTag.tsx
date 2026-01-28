// OmniTag.tsx - The Technical Specification View
// Structured, hierarchical, exhaustive view of the configuration

import React, { useState } from 'react';
import { ConfigurationStateV2, Product, TreeNode } from '../types-tree';
import { findNodeById } from '../utils/treeHelpers';
import { motion, AnimatePresence } from 'framer-motion';

interface OmniTagProps {
  configuration: ConfigurationStateV2;
  product: Product;
  onNodeClick: (nodeIdOrSelection: string) => void;
}

export const OmniTag: React.FC<OmniTagProps> = ({
  configuration,
  product,
  onNodeClick,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleNode = (nodeId: string) => {
    const next = new Set(expandedNodes);
    if (next.has(nodeId)) {
      next.delete(nodeId);
    } else {
      next.add(nodeId);
    }
    setExpandedNodes(next);
  };

  const handleOptionSelect = (nodeId: string, optionId: string) => {
    onNodeClick(`${nodeId}:${optionId}`);
  };

  const getSelectedOption = (node: TreeNode) => {
    const selection = configuration.selections[node.id];
    if (selection) {
      return node.children?.find(c => c.id === selection.value);
    }
    return node.children?.find(c => c.default === true);
  };

  const renderOption = (node: TreeNode, option: TreeNode) => {
    const isSelected = getSelectedOption(node)?.id === option.id;
    return (
      <div 
        key={option.id}
        className={`omni-tag-option ${isSelected ? 'selected' : ''}`}
        onClick={() => handleOptionSelect(node.id, option.id)}
      >
        <div className="omni-tag-option-label">
            {isSelected && <span className="check-mark">✓</span>}
            {option.label}
        </div>
        {option.priceModifier ? (
          <div className="omni-tag-price">
            {option.priceModifier > 0 ? '+' : ''}£{option.priceModifier}
          </div>
        ) : null}
      </div>
    );
  };

  const renderNode = (node: TreeNode, depth = 0) => {
    // Only render components and attributes
    if (node.type === 'option') return null;

    const isExpanded = expandedNodes.has(node.id) || depth < 1; // Auto-expand top level
    const selectedOption = node.type === 'attribute' ? getSelectedOption(node) : null;
    const hasOptions = node.children?.some(c => c.type === 'option');

    return (
      <div key={node.id} className={`omni-tag-node depth-${depth}`}>
        <div 
            className="omni-tag-row"
            onClick={() => hasOptions ? toggleNode(node.id) : null}
        >
          <div className="omni-tag-label">
            {node.label}
          </div>
          
          {selectedOption && (
            <div className="omni-tag-value">
              {selectedOption.label}
            </div>
          )}
        </div>

        <AnimatePresence>
            {isExpanded && hasOptions && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="omni-tag-options-container"
                >
                    {node.children?.filter(c => c.type === 'option').map(opt => renderOption(node, opt))}
                </motion.div>
            )}
        </AnimatePresence>

        {/* Recursive render for non-option children */}
        {node.children?.filter(c => c.type !== 'option').map(child => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <>
      <style>{`
        .omni-tag-container {
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.8rem;
            color: #1a1a1a;
        }

        .omni-tag-node {
            border-bottom: 1px solid rgba(0,0,0,0.06);
        }
        
        .omni-tag-node.depth-0 {
            margin-bottom: 1.5rem;
            border-bottom: none;
        }
        
        .omni-tag-node.depth-0 > .omni-tag-row {
            font-family: 'PP Editorial Old', serif;
            font-feature-settings: "liga" 1, "dlig" 1, "calt" 1, "swsh" 1, "salt" 1;
            font-size: 1.1rem;
            font-weight: 500;
            padding: 0.5rem 0;
            border-bottom: 2px solid #1a1a1a;
            margin-bottom: 0.5rem;
        }

        .omni-tag-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem 0;
            cursor: pointer;
        }
        
        .omni-tag-label {
            text-transform: uppercase;
            letter-spacing: 0.05em;
            opacity: 0.7;
        }
        
        .omni-tag-value {
            font-weight: 500;
        }

        .omni-tag-options-container {
            overflow: hidden;
            background: rgba(0,0,0,0.02);
            border-radius: 4px;
            margin-bottom: 0.5rem;
        }

        .omni-tag-option {
            padding: 0.6rem 1rem;
            display: flex;
            justify-content: space-between;
            cursor: pointer;
            transition: background 0.2s;
            border-bottom: 1px solid rgba(0,0,0,0.03);
        }
        
        .omni-tag-option:last-child {
            border-bottom: none;
        }

        .omni-tag-option:hover {
            background: rgba(0,0,0,0.05);
        }
        
        .omni-tag-option.selected {
            background: #1a1a1a;
            color: #fff;
        }

        .omni-tag-option.selected .omni-tag-price {
            opacity: 0.7;
            color: #fff;
        }
        
        .check-mark {
            margin-right: 0.5rem;
        }
        
        .omni-tag-price {
            opacity: 0.5;
            font-size: 0.75rem;
        }
      `}</style>

      <div className="omni-tag-container">
        {product.customizationTree.map(node => renderNode(node))}
      </div>
    </>
  );
};

