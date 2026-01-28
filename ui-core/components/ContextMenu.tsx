// ContextMenu Component - Shows all options for a clicked node
// Appears as a dropdown below the clicked row

import React, { useEffect, useRef } from 'react';
import { TreeNode, ConfigurationStateV2 } from '../types-tree';
import { findNodeById } from '../utils/treeHelpers';

interface ContextMenuProps {
  node: TreeNode;
  config: ConfigurationStateV2;
  onSelect: (nodeId: string, optionId: string) => void;
  onClose: () => void;
  position?: { x: number; y: number };
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  node,
  config,
  onSelect,
  onClose,
  position
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Get current selection
  const currentSelection = config.selections[node.id];

  // Get options (children of type 'option')
  const options = node.children?.filter(child => child.type === 'option') || [];

  if (options.length === 0) {
    return null;
  }

  return (
    <>
      <style>{`
        .context-menu-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: transparent;
        }

        .context-menu {
          position: fixed;
          background: var(--bg-color, #F8F5F0);
          border: 1px solid var(--border-color, #000);
          border-radius: 4px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          min-width: 200px;
          max-width: 300px;
          max-height: 400px;
          overflow-y: auto;
          z-index: 101;
        }

        .context-menu-header {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--border-color, #000);
          font-family: var(--sans-serif-font, 'JetBrains Mono', monospace);
          font-size: 0.7rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--accent-color, #C20000);
        }

        .context-menu-option {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: var(--sans-serif-font, 'JetBrains Mono', monospace);
          font-size: 0.75rem;
        }

        .context-menu-option:last-child {
          border-bottom: none;
        }

        .context-menu-option:hover {
          background: rgba(0, 0, 0, 0.03);
        }

        .context-menu-option.selected {
          background: rgba(194, 0, 0, 0.05);
          font-weight: 500;
        }

        .context-menu-option-label {
          flex: 1;
        }

        .context-menu-option-price {
          font-size: 0.7rem;
          opacity: 0.6;
          margin-left: 1rem;
        }

        .context-menu-option-checkmark {
          margin-left: 0.5rem;
          color: var(--accent-color, #C20000);
          font-size: 0.9rem;
        }
      `}</style>

      <div className="context-menu-overlay" onClick={onClose} />

      <div
        ref={menuRef}
        className="context-menu"
        style={{
          left: position?.x || '50%',
          top: position?.y || '50%',
          transform: !position ? 'translate(-50%, -50%)' : undefined
        }}
      >
        <div className="context-menu-header">
          {node.label}
        </div>

        {options.map(option => {
          const isSelected = currentSelection?.value === option.id ||
                           (!currentSelection && option.default === true);

          return (
            <div
              key={option.id}
              className={`context-menu-option ${isSelected ? 'selected' : ''}`}
              onClick={() => {
                onSelect(node.id, option.id);
                onClose();
              }}
            >
              <span className="context-menu-option-label">
                {option.label}
              </span>

              {option.priceModifier !== undefined && option.priceModifier !== 0 && (
                <span className="context-menu-option-price">
                  {option.priceModifier > 0 ? '+' : ''}£{option.priceModifier}
                </span>
              )}

              {isSelected && (
                <span className="context-menu-option-checkmark">✓</span>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

export default ContextMenu;
