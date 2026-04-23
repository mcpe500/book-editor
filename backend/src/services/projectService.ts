import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { generateId } from '../utils/uuid.js';
import { ensureDir, readJSON, writeJSON, fileExists } from '../utils/jsonFile.js';
import {
  CreateNodeInput,
  CreateProjectInput,
  ExportFormat,
  MoveNodeInput,
  ProjectManifest,
  ProjectNode,
  ProjectNodeDocument,
  ProjectRuleSet,
  ProjectSummary,
} from '../types/project.js';

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectsRoot = path.join(__dirname, '../../../data/projects');

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || `project-${Date.now()}`;
}

function defaultRules(): ProjectRuleSet {
  return {
    mustFollow: [],
    mustNotFollow: [],
    terminology: [],
    memoryNotes: [],
    styleProfile: 'academic-thesis',
  };
}

function defaultNodeTitle(order: number): string {
  return `Untitled Section ${order}`;
}

async function getProjectDir(projectId: string): Promise<string> {
  await ensureDir(projectsRoot);
  return path.join(projectsRoot, projectId);
}

async function getManifestPath(projectId: string): Promise<string> {
  return path.join(await getProjectDir(projectId), 'book-editor.manifest.json');
}

async function getContentDir(projectId: string): Promise<string> {
  const dir = path.join(await getProjectDir(projectId), 'content');
  await ensureDir(dir);
  return dir;
}

async function getInternalDir(projectId: string): Promise<string> {
  const dir = path.join(await getProjectDir(projectId), '.book-editor');
  await ensureDir(dir);
  await ensureDir(path.join(dir, 'versions'));
  await ensureDir(path.join(dir, 'exports'));
  await ensureDir(path.join(dir, 'ai'));
  return dir;
}

function buildManifestTitleHeading(title: string, depth: number): string {
  const level = Math.min(depth + 1, 6);
  return `${'#'.repeat(level)} ${title}`;
}

async function writeVersionSnapshot(manifest: ProjectManifest): Promise<void> {
  const internalDir = await getInternalDir(manifest.id);
  const versionPath = path.join(internalDir, 'versions', `${Date.now()}-manifest.json`);
  await writeJSON(versionPath, manifest);
}

async function readNodeContent(projectId: string, node: ProjectNode): Promise<string> {
  const filePath = path.join(await getProjectDir(projectId), node.contentFile);
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return '';
  }
}

async function writeNodeContent(projectId: string, node: ProjectNode, content: string): Promise<void> {
  const filePath = path.join(await getProjectDir(projectId), node.contentFile);
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf-8');
}

function collectDescendants(manifest: ProjectManifest, nodeId: string, acc: string[]): void {
  const node = manifest.nodes[nodeId];
  if (!node) return;
  acc.push(nodeId);
  node.children.forEach((childId) => collectDescendants(manifest, childId, acc));
}

function removeChildId(list: string[], nodeId: string): string[] {
  return list.filter((id) => id !== nodeId);
}

function insertAt<T>(list: T[], index: number, item: T): T[] {
  const next = [...list];
  const safeIndex = Math.max(0, Math.min(index, next.length));
  next.splice(safeIndex, 0, item);
  return next;
}

export async function listProjects(): Promise<ProjectSummary[]> {
  await ensureDir(projectsRoot);
  const entries = await fs.readdir(projectsRoot, { withFileTypes: true });
  const summaries: ProjectSummary[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const manifestPath = path.join(projectsRoot, entry.name, 'book-editor.manifest.json');
    if (!(await fileExists(manifestPath))) continue;
    try {
      const manifest = await readJSON<ProjectManifest>(manifestPath);
      summaries.push({
        id: manifest.id,
        title: manifest.title,
        slug: manifest.slug,
        nodeCount: Object.keys(manifest.nodes).length,
        updatedAt: manifest.updatedAt,
      });
    } catch {
      // Skip malformed projects.
    }
  }

  return summaries.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function readManifest(projectId: string): Promise<ProjectManifest | null> {
  try {
    return await readJSON<ProjectManifest>(await getManifestPath(projectId));
  } catch {
    return null;
  }
}

export async function createProject(input: CreateProjectInput): Promise<ProjectManifest> {
  const projectId = generateId();
  const slug = slugify(input.title);
  const now = new Date().toISOString();
  const rootNodeId = generateId();

  const manifest: ProjectManifest = {
    id: projectId,
    title: input.title,
    slug,
    rootNodeIds: [rootNodeId],
    nodes: {
      [rootNodeId]: {
        id: rootNodeId,
        title: defaultNodeTitle(1),
        slug: slugify(defaultNodeTitle(1)),
        parentId: null,
        children: [],
        contentFile: path.join('content', `${rootNodeId}.md`),
        collapsed: false,
        createdAt: now,
        updatedAt: now,
      },
    },
    rules: defaultRules(),
    exportProfiles: {},
    createdAt: now,
    updatedAt: now,
  };

  const projectDir = await getProjectDir(projectId);
  await ensureDir(projectDir);
  await ensureDir(await getContentDir(projectId));
  await ensureDir(path.join(projectDir, 'assets'));
  await getInternalDir(projectId);
  await writeJSON(await getManifestPath(projectId), manifest);
  await writeNodeContent(projectId, manifest.nodes[rootNodeId], `# ${manifest.nodes[rootNodeId].title}\n\n`);

  return manifest;
}

export async function getNodeDocument(projectId: string, nodeId: string): Promise<ProjectNodeDocument | null> {
  const manifest = await readManifest(projectId);
  if (!manifest) return null;
  const node = manifest.nodes[nodeId];
  if (!node) return null;

  const ancestry: ProjectNode[] = [];
  let currentParentId = node.parentId;
  while (currentParentId) {
    const parent = manifest.nodes[currentParentId];
    if (!parent) break;
    ancestry.unshift(parent);
    currentParentId = parent.parentId;
  }

  return {
    node,
    content: await readNodeContent(projectId, node),
    ancestry,
  };
}

export async function saveNodeContent(projectId: string, nodeId: string, content: string): Promise<ProjectNodeDocument | null> {
  const manifest = await readManifest(projectId);
  if (!manifest) return null;
  const node = manifest.nodes[nodeId];
  if (!node) return null;

  const now = new Date().toISOString();
  node.updatedAt = now;
  manifest.updatedAt = now;

  await writeNodeContent(projectId, node, content);
  await writeJSON(await getManifestPath(projectId), manifest);
  await writeVersionSnapshot(manifest);

  return getNodeDocument(projectId, nodeId);
}

export async function createNode(projectId: string, input: CreateNodeInput): Promise<ProjectManifest | null> {
  const manifest = await readManifest(projectId);
  if (!manifest) return null;

  const now = new Date().toISOString();
  const nodeId = generateId();
  const parentId = input.parentId ?? null;

  if (parentId && !manifest.nodes[parentId]) {
    return null;
  }

  const node: ProjectNode = {
    id: nodeId,
    title: input.title,
    slug: slugify(input.title),
    parentId,
    children: [],
    contentFile: path.join('content', `${nodeId}.md`),
    collapsed: false,
    createdAt: now,
    updatedAt: now,
  };

  manifest.nodes[nodeId] = node;
  if (parentId) {
    const siblings = manifest.nodes[parentId].children;
    const afterIndex = input.afterNodeId ? siblings.indexOf(input.afterNodeId) + 1 : siblings.length;
    manifest.nodes[parentId].children = insertAt(siblings, afterIndex, nodeId);
  } else {
    const afterIndex = input.afterNodeId ? manifest.rootNodeIds.indexOf(input.afterNodeId) + 1 : manifest.rootNodeIds.length;
    manifest.rootNodeIds = insertAt(manifest.rootNodeIds, afterIndex, nodeId);
  }

  manifest.updatedAt = now;
  await writeNodeContent(projectId, node, `${buildManifestTitleHeading(node.title, 1)}\n\n`);
  await writeJSON(await getManifestPath(projectId), manifest);
  return manifest;
}

export async function moveNode(projectId: string, nodeId: string, input: MoveNodeInput): Promise<ProjectManifest | null> {
  const manifest = await readManifest(projectId);
  if (!manifest) return null;
  const node = manifest.nodes[nodeId];
  if (!node) return null;

  const descendantIds: string[] = [];
  collectDescendants(manifest, nodeId, descendantIds);
  const targetParentId = input.targetParentId ?? null;
  if (targetParentId && descendantIds.includes(targetParentId)) {
    throw new Error('Cannot move a node into its own descendant');
  }
  if (targetParentId && !manifest.nodes[targetParentId]) {
    return null;
  }

  if (node.parentId) {
    manifest.nodes[node.parentId].children = removeChildId(manifest.nodes[node.parentId].children, nodeId);
  } else {
    manifest.rootNodeIds = removeChildId(manifest.rootNodeIds, nodeId);
  }

  node.parentId = targetParentId;
  if (targetParentId) {
    manifest.nodes[targetParentId].children = insertAt(
      manifest.nodes[targetParentId].children,
      input.targetIndex,
      nodeId
    );
  } else {
    manifest.rootNodeIds = insertAt(manifest.rootNodeIds, input.targetIndex, nodeId);
  }

  manifest.updatedAt = new Date().toISOString();
  await writeJSON(await getManifestPath(projectId), manifest);
  return manifest;
}

export async function renameNode(projectId: string, nodeId: string, title: string): Promise<ProjectManifest | null> {
  const manifest = await readManifest(projectId);
  if (!manifest) return null;
  const node = manifest.nodes[nodeId];
  if (!node) return null;

  node.title = title;
  node.slug = slugify(title);
  node.updatedAt = new Date().toISOString();
  manifest.updatedAt = node.updatedAt;
  await writeJSON(await getManifestPath(projectId), manifest);
  return manifest;
}

export async function deleteNode(projectId: string, nodeId: string): Promise<ProjectManifest | null> {
  const manifest = await readManifest(projectId);
  if (!manifest) return null;
  const node = manifest.nodes[nodeId];
  if (!node) return null;

  const idsToDelete: string[] = [];
  collectDescendants(manifest, nodeId, idsToDelete);

  if (node.parentId) {
    manifest.nodes[node.parentId].children = removeChildId(manifest.nodes[node.parentId].children, nodeId);
  } else {
    manifest.rootNodeIds = removeChildId(manifest.rootNodeIds, nodeId);
  }

  await Promise.all(idsToDelete.map(async (id) => {
    const current = manifest.nodes[id];
    if (!current) return;
    const filePath = path.join(await getProjectDir(projectId), current.contentFile);
    delete manifest.nodes[id];
    try {
      await fs.unlink(filePath);
    } catch {
      // Ignore missing content files.
    }
  }));

  manifest.updatedAt = new Date().toISOString();
  await writeJSON(await getManifestPath(projectId), manifest);
  return manifest;
}

export async function updateProjectRules(projectId: string, rules: Partial<ProjectRuleSet>): Promise<ProjectManifest | null> {
  const manifest = await readManifest(projectId);
  if (!manifest) return null;

  manifest.rules = {
    ...manifest.rules,
    ...rules,
    mustFollow: rules.mustFollow ?? manifest.rules.mustFollow,
    mustNotFollow: rules.mustNotFollow ?? manifest.rules.mustNotFollow,
    terminology: rules.terminology ?? manifest.rules.terminology,
    memoryNotes: rules.memoryNotes ?? manifest.rules.memoryNotes,
    styleProfile: rules.styleProfile ?? manifest.rules.styleProfile,
  };
  manifest.updatedAt = new Date().toISOString();
  await writeJSON(await getManifestPath(projectId), manifest);
  return manifest;
}

async function flattenNodeContent(manifest: ProjectManifest, projectId: string, nodeId: string, depth: number): Promise<string[]> {
  const node = manifest.nodes[nodeId];
  if (!node) return [];
  const content = await readNodeContent(projectId, node);
  const parts = [buildManifestTitleHeading(node.title, depth), '', content.trim(), ''];

  for (const childId of node.children) {
    parts.push(...await flattenNodeContent(manifest, projectId, childId, depth + 1));
  }

  return parts;
}

export async function buildMergedMarkdown(projectId: string): Promise<{ manifest: ProjectManifest; content: string } | null> {
  const manifest = await readManifest(projectId);
  if (!manifest) return null;

  const sections: string[] = [`# ${manifest.title}`, ''];
  for (const nodeId of manifest.rootNodeIds) {
    sections.push(...await flattenNodeContent(manifest, projectId, nodeId, 1));
  }

  return {
    manifest,
    content: sections.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n',
  };
}

async function writeExportFile(projectId: string, format: ExportFormat, content?: string): Promise<string> {
  const internalDir = await getInternalDir(projectId);
  const exportDir = path.join(internalDir, 'exports');
  await ensureDir(exportDir);

  const filename = `${Date.now()}.${format === 'markdown' ? 'md' : format}`;
  const exportPath = path.join(exportDir, filename);
  if (content !== undefined) {
    await fs.writeFile(exportPath, content, 'utf-8');
  }
  return exportPath;
}

export async function exportProject(projectId: string, format: ExportFormat): Promise<{ outputPath: string; downloadName: string } | null> {
  const merged = await buildMergedMarkdown(projectId);
  if (!merged) return null;

  const { manifest, content } = merged;
  const safeBaseName = slugify(manifest.title) || manifest.id;

  if (format === 'markdown') {
    const outputPath = await writeExportFile(projectId, 'markdown', content);
    return { outputPath, downloadName: `${safeBaseName}.md` };
  }

  if (format === 'zip') {
    const projectDir = await getProjectDir(projectId);
    const outputPath = await writeExportFile(projectId, 'zip');
    await execFileAsync('powershell.exe', [
      '-NoProfile',
      '-Command',
      `Compress-Archive -Path '${projectDir}\\*' -DestinationPath '${outputPath}' -Force`,
    ]);
    return { outputPath, downloadName: `${safeBaseName}.zip` };
  }

  const markdownPath = await writeExportFile(projectId, 'markdown', content);
  const outputPath = await writeExportFile(projectId, format);
  const args = [markdownPath, '-o', outputPath];

  if (format === 'pdf' && merged.manifest.exportProfiles.defaultPdfEngine) {
    args.push('--pdf-engine', merged.manifest.exportProfiles.defaultPdfEngine);
  }

  if (format === 'docx' && merged.manifest.exportProfiles.defaultDocxTemplate) {
    args.push('--reference-doc', merged.manifest.exportProfiles.defaultDocxTemplate);
  }

  await execFileAsync('pandoc', args);
  return { outputPath, downloadName: `${safeBaseName}.${format === 'docx' ? 'docx' : 'pdf'}` };
}
