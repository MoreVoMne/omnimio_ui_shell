export type PartRole = 'main' | 'swappable' | 'add-on' | 'optional' | 'decorative';

export interface PartGroup {
  id: string;
  name: string;
  partIds: string[];
  createdAt: number;
}

export interface Part {
  id: string;
  name: string;
  meshIndex: number;
  role: PartRole;
  parentId: string | null;
  groupId?: string;
  createdAt: number;
}

export interface PartWithCapabilities extends Part {
  capabilities: string[]; // capability IDs
}

