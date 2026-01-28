// Tree Helper Utilities
// Functions for traversing and manipulating the TreeNode hierarchy

import { TreeNode, ConfigurationStateV2, NodeState } from '../types-tree';

/**
 * Find a node by ID (recursive search)
 */
export const findNodeById = (
  tree: TreeNode[],
  nodeId: string
): TreeNode | null => {
  for (const node of tree) {
    if (node.id === nodeId) return node;

    if (node.children) {
      const found = findNodeById(node.children, nodeId);
      if (found) return found;
    }
  }
  return null;
};

/**
 * Get path from root to node (breadcrumb trail)
 * Returns array of node IDs
 */
export const getNodePath = (
  tree: TreeNode[],
  nodeId: string,
  path: string[] = []
): string[] | null => {
  for (const node of tree) {
    const currentPath = [...path, node.id];

    if (node.id === nodeId) return currentPath;

    if (node.children) {
      const found = getNodePath(node.children, nodeId, currentPath);
      if (found) return found;
    }
  }
  return null;
};

/**
 * Get all nodes that have been modified from default
 */
export const getModifiedNodes = (
  tree: TreeNode[],
  config: ConfigurationStateV2
): TreeNode[] => {
  const modified: TreeNode[] = [];

  const traverse = (nodes: TreeNode[]) => {
    nodes.forEach((node) => {
      // Check if this node has a selection that differs from default
      const selection = config.selections[node.id];
      if (selection && selection.value !== node.default) {
        modified.push(node);
      }

      if (node.children) traverse(node.children);
    });
  };

  traverse(tree);
  return modified;
};

/**
 * Get all nodes that are still at default value
 */
export const getDefaultNodes = (
  tree: TreeNode[],
  config: ConfigurationStateV2
): TreeNode[] => {
  const defaults: TreeNode[] = [];

  const traverse = (nodes: TreeNode[]) => {
    nodes.forEach((node) => {
      const selection = config.selections[node.id];

      // Node is at default if no selection OR selection equals default
      if (!selection || selection.value === node.default) {
        defaults.push(node);
      }

      if (node.children) traverse(node.children);
    });
  };

  traverse(tree);
  return defaults;
};

/**
 * Calculate maximum depth of tree
 */
export const getMaxDepth = (tree: TreeNode[]): number => {
  let maxDepth = 0;

  const traverse = (nodes: TreeNode[], depth: number) => {
    nodes.forEach((node) => {
      maxDepth = Math.max(maxDepth, depth);
      if (node.children) traverse(node.children, depth + 1);
    });
  };

  traverse(tree, 1);
  return maxDepth;
};

/**
 * Flatten tree to array (useful for search)
 */
export const flattenTree = (tree: TreeNode[]): TreeNode[] => {
  const flat: TreeNode[] = [];

  const traverse = (nodes: TreeNode[]) => {
    nodes.forEach((node) => {
      flat.push(node);
      if (node.children) traverse(node.children);
    });
  };

  traverse(tree);
  return flat;
};

/**
 * Get all child nodes of a specific node
 */
export const getChildNodes = (
  tree: TreeNode[],
  nodeId: string
): TreeNode[] => {
  const node = findNodeById(tree, nodeId);
  return node?.children || [];
};

/**
 * Get parent node of a specific node
 */
export const getParentNode = (
  tree: TreeNode[],
  nodeId: string
): TreeNode | null => {
  const path = getNodePath(tree, nodeId);
  if (!path || path.length < 2) return null;

  const parentId = path[path.length - 2];
  return findNodeById(tree, parentId);
};

/**
 * Get all sibling nodes (nodes with same parent)
 */
export const getSiblingNodes = (
  tree: TreeNode[],
  nodeId: string
): TreeNode[] => {
  const parent = getParentNode(tree, nodeId);
  if (!parent) {
    // Node is at root level, return root siblings
    return tree.filter((n) => n.id !== nodeId);
  }

  return parent.children?.filter((n) => n.id !== nodeId) || [];
};

/**
 * Get all ancestor nodes (from root to node)
 */
export const getAncestorNodes = (
  tree: TreeNode[],
  nodeId: string
): TreeNode[] => {
  const path = getNodePath(tree, nodeId);
  if (!path) return [];

  return path.map((id) => findNodeById(tree, id)).filter(Boolean) as TreeNode[];
};

/**
 * Get all descendant nodes (all children recursively)
 */
export const getDescendantNodes = (
  tree: TreeNode[],
  nodeId: string
): TreeNode[] => {
  const node = findNodeById(tree, nodeId);
  if (!node || !node.children) return [];

  return flattenTree(node.children);
};

/**
 * Check if node is a leaf (has no children)
 */
export const isLeafNode = (node: TreeNode): boolean => {
  return !node.children || node.children.length === 0;
};

/**
 * Check if node is a root (has no parent)
 */
export const isRootNode = (tree: TreeNode[], nodeId: string): boolean => {
  return tree.some((n) => n.id === nodeId);
};

/**
 * Get all nodes of a specific type
 */
export const getNodesByType = (
  tree: TreeNode[],
  type: TreeNode['type']
): TreeNode[] => {
  return flattenTree(tree).filter((n) => n.type === type);
};

/**
 * Get all ACTION nodes (+ Add Print, + Add Text, etc.)
 */
export const getActionNodes = (tree: TreeNode[]): TreeNode[] => {
  return getNodesByType(tree, 'action');
};

/**
 * Get all COMPONENT nodes (BODY, HANDLE, etc.)
 */
export const getComponentNodes = (tree: TreeNode[]): TreeNode[] => {
  return getNodesByType(tree, 'component');
};

/**
 * Get current value for a node from configuration
 */
export const getCurrentValue = (
  nodeId: string,
  config: ConfigurationStateV2
): any => {
  return config.selections[nodeId]?.value || null;
};

/**
 * Get node state (default, modified, available, disabled, added)
 */
export const getNodeState = (
  node: TreeNode,
  config: ConfigurationStateV2
): NodeState => {
  // Check if node has a selection
  const selection = config.selections[node.id];

  // ACTION nodes
  if (node.type === 'action') {
    // Check if something has been added via this action
    const hasCustomization = checkCustomizationExists(node.id, config);
    return hasCustomization ? 'added' : 'available';
  }

  // ATTRIBUTE/OPTION nodes
  if (!selection) {
    return node.required ? 'default' : 'available';
  }

  // Compare with default
  if (selection.value === node.default) {
    return 'default';
  }

  return 'modified';
};

/**
 * Check if a customization exists for an action node
 */
const checkCustomizationExists = (
  actionNodeId: string,
  config: ConfigurationStateV2
): boolean => {
  // Check text customizations
  if (config.customizations.text) {
    const hasText = config.customizations.text.some(
      (t) => t.nodeId === actionNodeId
    );
    if (hasText) return true;
  }

  // Check image customizations
  if (config.customizations.images) {
    const hasImage = config.customizations.images.some(
      (i) => i.nodeId === actionNodeId
    );
    if (hasImage) return true;
  }

  // Check pattern customizations
  if (config.customizations.patterns) {
    const hasPattern = config.customizations.patterns.some(
      (p) => p.nodeId === actionNodeId
    );
    if (hasPattern) return true;
  }

  return false;
};

/**
 * Get opacity for node based on state
 */
export const getNodeOpacity = (
  node: TreeNode,
  config: ConfigurationStateV2
): number => {
  const state = getNodeState(node, config);

  switch (state) {
    case 'modified':
    case 'added':
      return 1.0; // Full opacity for modified/added
    case 'default':
      return 0.5; // Reduced opacity for default
    case 'available':
      return 0.6; // Slightly visible for available actions
    case 'disabled':
      return 0.3; // Very faded for disabled
    default:
      return 1.0;
  }
};

/**
 * Get display value for a node
 */
export const getDisplayValue = (
  node: TreeNode,
  config: ConfigurationStateV2
): string => {
  // For ACTION nodes
  if (node.type === 'action') {
    return ''; // Actions don't have values, just labels
  }

  // Get selection
  const selection = config.selections[node.id];
  if (!selection) {
    // Return default if available
    if (node.default && node.children) {
      const defaultChild = node.children.find((c) => c.id === node.default);
      return defaultChild?.label || 'None';
    }
    return 'None';
  }

  // Find the selected child node
  if (node.children) {
    const selectedChild = node.children.find((c) => c.id === selection.value);
    return selectedChild?.label || selection.value;
  }

  return selection.value;
};

/**
 * Get tree character for rendering (├─, └─, etc.)
 */
export const getTreeCharacter = (
  node: TreeNode,
  siblings: TreeNode[]
): string => {
  const isLast = siblings.indexOf(node) === siblings.length - 1;

  if (node.depth === 1) {
    return ''; // Root components don't need tree characters
  }

  if (node.depth === 2) {
    return isLast ? '└─ ' : '├─ ';
  }

  // For deeper nesting, add indentation
  const indent = '   '.repeat(node.depth - 2);
  return indent + (isLast ? '└─ ' : '├─ ');
};

/**
 * Search nodes by label (fuzzy search)
 */
export const searchNodes = (
  tree: TreeNode[],
  query: string
): TreeNode[] => {
  const lowerQuery = query.toLowerCase();
  return flattenTree(tree).filter((node) =>
    node.label.toLowerCase().includes(lowerQuery)
  );
};

/**
 * Get all nodes with price modifiers
 */
export const getNodesWithPrice = (tree: TreeNode[]): TreeNode[] => {
  return flattenTree(tree).filter(
    (node) => node.priceModifier !== undefined && node.priceModifier !== 0
  );
};

/**
 * Calculate total price modifiers from selections
 */
export const calculatePriceModifiers = (
  tree: TreeNode[],
  config: ConfigurationStateV2
): number => {
  let total = 0;

  Object.entries(config.selections).forEach(([nodeId, selection]) => {
    const node = findNodeById(tree, selection.value);
    if (node?.priceModifier) {
      total += node.priceModifier;
    }
  });

  return total;
};

/**
 * Validate that all required nodes have selections
 */
export const validateRequiredNodes = (
  tree: TreeNode[],
  config: ConfigurationStateV2
): { isValid: boolean; missingNodes: TreeNode[] } => {
  const requiredNodes = flattenTree(tree).filter(
    (node) => node.required && node.type !== 'component'
  );

  const missingNodes = requiredNodes.filter((node) => {
    const selection = config.selections[node.id];
    return !selection || !selection.value;
  });

  return {
    isValid: missingNodes.length === 0,
    missingNodes,
  };
};

/**
 * Get all nodes that are incompatible with a given node
 */
export const getIncompatibleNodes = (
  tree: TreeNode[],
  nodeId: string
): TreeNode[] => {
  const node = findNodeById(tree, nodeId);
  if (!node?.constraints?.incompatibleWith) return [];

  return node.constraints.incompatibleWith
    .map((id) => findNodeById(tree, id))
    .filter(Boolean) as TreeNode[];
};

/**
 * Check if two nodes are compatible
 */
export const areNodesCompatible = (
  tree: TreeNode[],
  nodeId1: string,
  nodeId2: string
): boolean => {
  const node1 = findNodeById(tree, nodeId1);
  const node2 = findNodeById(tree, nodeId2);

  if (!node1 || !node2) return false;

  // Check if node1 lists node2 as incompatible
  if (node1.constraints?.incompatibleWith?.includes(nodeId2)) {
    return false;
  }

  // Check if node2 lists node1 as incompatible
  if (node2.constraints?.incompatibleWith?.includes(nodeId1)) {
    return false;
  }

  return true;
};

/**
 * Clone a tree node (deep copy)
 */
export const cloneNode = (node: TreeNode): TreeNode => {
  return {
    ...node,
    children: node.children?.map(cloneNode),
  };
};

/**
 * Clone entire tree
 */
export const cloneTree = (tree: TreeNode[]): TreeNode[] => {
  return tree.map(cloneNode);
};

export default {
  findNodeById,
  getNodePath,
  getModifiedNodes,
  getDefaultNodes,
  getMaxDepth,
  flattenTree,
  getChildNodes,
  getParentNode,
  getSiblingNodes,
  getAncestorNodes,
  getDescendantNodes,
  isLeafNode,
  isRootNode,
  getNodesByType,
  getActionNodes,
  getComponentNodes,
  getCurrentValue,
  getNodeState,
  getNodeOpacity,
  getDisplayValue,
  getTreeCharacter,
  searchNodes,
  getNodesWithPrice,
  calculatePriceModifiers,
  validateRequiredNodes,
  getIncompatibleNodes,
  areNodesCompatible,
  cloneNode,
  cloneTree,
};
