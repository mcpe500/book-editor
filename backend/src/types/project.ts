export type ExportFormat = 'markdown' | 'zip' | 'docx' | 'pdf';

export interface ProjectRuleSet {
  mustFollow: string[];
  mustNotFollow: string[];
  terminology: string[];
  memoryNotes: string[];
  styleProfile: string;
}

export interface ProjectNode {
  id: string;
  title: string;
  slug: string;
  parentId: string | null;
  children: string[];
  contentFile: string;
  collapsed: boolean;
  localRules?: Partial<ProjectRuleSet>;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectManifest {
  id: string;
  title: string;
  slug: string;
  rootNodeIds: string[];
  nodes: Record<string, ProjectNode>;
  rules: ProjectRuleSet;
  exportProfiles: {
    defaultDocxTemplate?: string;
    defaultPdfEngine?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSummary {
  id: string;
  title: string;
  slug: string;
  nodeCount: number;
  updatedAt: string;
}

export interface ProjectTreeResponse {
  manifest: ProjectManifest;
}

export interface ProjectNodeDocument {
  node: ProjectNode;
  content: string;
  ancestry: ProjectNode[];
}

export interface CreateProjectInput {
  title: string;
}

export interface CreateNodeInput {
  title: string;
  parentId?: string | null;
  afterNodeId?: string | null;
}

export interface MoveNodeInput {
  targetParentId?: string | null;
  targetIndex: number;
}

export interface ReviseProjectRequest {
  nodeId: string;
  selectedText?: string;
  instruction: string;
  mode?: 'replace' | 'insert_below' | 'suggest';
}

export interface ReviseProjectResponse {
  content: string;
  providerId: string;
}
