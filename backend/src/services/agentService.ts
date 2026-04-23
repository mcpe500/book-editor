import { AgentConfig, AgentRun, ToolCallExecution } from '../types/index.js';
import { readJSON, writeJSON, ensureDir } from '../utils/jsonFile.js';
import { generateId } from '../utils/uuid.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataDir = path.join(__dirname, '../../data');

function getAgentDir(bookId: string): string {
  return path.join(dataDir, 'agents', bookId);
}

function getConfigsPath(bookId: string): string {
  return path.join(getAgentDir(bookId), 'configs.json');
}

function getRunsDir(bookId: string): string {
  return path.join(getAgentDir(bookId), 'runs');
}

function getRunPath(bookId: string, runId: string): string {
  return path.join(getRunsDir(bookId), `${runId}.json`);
}

export async function getAgentConfigs(bookId?: string): Promise<AgentConfig[]> {
  if (!bookId) {
    const allConfigs: AgentConfig[] = [];
    const agentsDir = path.join(dataDir, 'agents');
    try {
      const entries = await readJSON<string[]>('data/agent-books.json').catch(() => []);
      for (const bid of entries) {
        const configs = await readJSON<AgentConfig[]>(getConfigsPath(bid)).catch(() => []);
        allConfigs.push(...configs);
      }
    } catch { }
    return allConfigs;
  }
  return readJSON<AgentConfig[]>(getConfigsPath(bookId)).catch(() => []);
}

export async function getAgentConfig(configId: string): Promise<AgentConfig | null> {
  const agentsDir = path.join(dataDir, 'agents');
  try {
    const entries = await readJSON<string[]>('data/agent-books.json').catch(() => []);
    for (const bookId of entries) {
      const configs = await readJSON<AgentConfig[]>(getConfigsPath(bookId)).catch(() => []);
      const found = configs.find(c => c.id === configId);
      if (found) return found;
    }
  } catch { }
  return null;
}

export async function saveAgentConfig(config: AgentConfig, bookId: string): Promise<AgentConfig> {
  await ensureDir(getAgentDir(bookId));
  const configs: AgentConfig[] = await readJSON<AgentConfig[]>(getConfigsPath(bookId)).catch(() => [] as AgentConfig[]);
  const index = configs.findIndex(c => c.id === config.id);
  if (index >= 0) {
    configs[index] = { ...config, updatedAt: new Date().toISOString() };
  } else {
    config.createdAt = new Date().toISOString();
    config.updatedAt = config.createdAt;
    configs.push(config);
  }
  await writeJSON(getConfigsPath(bookId), configs);
  const books: string[] = await readJSON<string[]>('data/agent-books.json').catch(() => [] as string[]);
  if (!books.includes(bookId)) {
    books.push(bookId);
    await writeJSON('data/agent-books.json', books);
  }
  return config;
}

export async function deleteAgentConfig(configId: string): Promise<boolean> {
  const agentsDir = path.join(dataDir, 'agents');
  try {
    const entries = await readJSON<string[]>('data/agent-books.json').catch(() => []);
    for (const bookId of entries) {
      const configs = await readJSON<AgentConfig[]>(getConfigsPath(bookId)).catch(() => []);
      const filtered = configs.filter(c => c.id !== configId);
      if (filtered.length !== configs.length) {
        await writeJSON(getConfigsPath(bookId), filtered);
        return true;
      }
    }
  } catch { }
  return false;
}

export async function getRuns(bookId: string): Promise<AgentRun[]> {
  await ensureDir(getRunsDir(bookId));
  const runs: AgentRun[] = [];
  const runFiles = await readJSON<string[]>('data/agent-runs-index.json').catch(() => []);
  for (const runId of runFiles) {
    if (runId.startsWith(bookId)) {
      const run = await readJSON<AgentRun>(path.join(dataDir, 'agents', runId)).catch(() => null);
      if (run) runs.push(run);
    }
  }
  return runs;
}

export async function getRun(runId: string): Promise<AgentRun | null> {
  try {
    const runsIndex = await readJSON<Record<string, string>>('data/agent-runs-index.json').catch(() => ({} as Record<string, string>));
    const filePath = runsIndex[runId];
    if (filePath) {
      return readJSON<AgentRun>(path.join(dataDir, 'agents', filePath));
    }
  } catch { }
  return null;
}

export async function createRun(bookId: string, configId: string, chapterId?: string): Promise<AgentRun> {
  const config = await getAgentConfig(configId);
  if (!config) throw new Error('Agent config not found');

  const run: AgentRun = {
    id: generateId(),
    agentConfigId: configId,
    bookId,
    chapterId,
    state: 'pending',
    createdAt: new Date().toISOString(),
    tasks: [],
    conversation: [],
    context: {},
  };

  await ensureDir(getRunsDir(bookId));
  await ensureDir(path.join(dataDir, 'agents'));

  const runPath = `runs/${bookId}/${run.id}.json`;
  await writeJSON(path.join(dataDir, 'agents', runPath), run);

  const index = await readJSON<Record<string, string>>('data/agent-runs-index.json').catch(() => ({} as Record<string, string>));
  index[run.id] = `runs/${bookId}/${run.id}.json`;
  await writeJSON('data/agent-runs-index.json', index);

  return run;
}

export async function updateRun(run: AgentRun): Promise<boolean> {
  try {
    const index = await readJSON<Record<string, string>>('data/agent-runs-index.json').catch(() => ({} as Record<string, string>));
    const filePath = index[run.id];
    if (!filePath) return false;
    await writeJSON(path.join(dataDir, 'agents', filePath), run);
    return true;
  } catch { }
  return false;
}

export async function approveToolCall(runId: string, toolCallId: string): Promise<boolean> {
  const run = await getRun(runId);
  if (!run) return false;
  for (const task of run.tasks) {
    const tc = task.toolCalls.find(t => t.id === toolCallId);
    if (tc) {
      tc.status = 'approved';
      tc.approvedAt = new Date().toISOString();
      return updateRun(run);
    }
  }
  return false;
}

export async function rejectToolCall(runId: string, toolCallId: string): Promise<boolean> {
  const run = await getRun(runId);
  if (!run) return false;
  for (const task of run.tasks) {
    const tc = task.toolCalls.find(t => t.id === toolCallId);
    if (tc) {
      tc.status = 'rejected';
      return updateRun(run);
    }
  }
  return false;
}

export async function stopRun(runId: string): Promise<boolean> {
  const run = await getRun(runId);
  if (!run) return false;
  run.state = 'stopped';
  run.completedAt = new Date().toISOString();
  return updateRun(run);
}

export async function getDefaultTemplates(): Promise<AgentConfig[]> {
  return [
    {
      id: 'research-agent',
      name: 'Research Agent',
      description: 'Research topics and find references from the web',
      providerId: 'gemini',
      mcpServerIds: ['web-tools', 'book-tools'],
      systemPrompt: `You are a research assistant for academic writing.
1. Search the web for relevant information on the given topic
2. Find credible sources (academic papers, books, articles)
3. Summarize findings in a structured format
4. Suggest where to add references in the book

Always cite sources with URLs when possible.
Format your output with clear headings and bullet points.`,
      temperature: 0.7,
      maxTokens: 4096,
      autoApproveTools: ['web-tools.searchWeb', 'web-tools.fetchUrl'],
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'writing-agent',
      name: 'Writing Agent',
      description: 'Write new content for chapters',
      providerId: 'openai',
      mcpServerIds: ['book-tools'],
      systemPrompt: `You are a professional academic writer.
1. Write content based on the user's instructions
2. Follow the book's style and structure
3. Use proper academic language
4. Include LaTeX for mathematical equations when needed
5. Add proper section headings and formatting

Write complete, publication-ready content.`,
      temperature: 0.7,
      maxTokens: 8192,
      autoApproveTools: ['book-tools.getBookOutline', 'book-tools.getChapterContent'],
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'review-agent',
      name: 'Review Agent',
      description: 'Review and suggest improvements for content',
      providerId: 'anthropic',
      mcpServerIds: ['book-tools'],
      systemPrompt: `You are a critical reviewer for academic writing.
1. Review content for grammar and spelling errors
2. Check for consistency in terminology
3. Suggest improvements for clarity and flow
4. Verify citations and references are proper

Provide specific, actionable feedback.`,
      temperature: 0.5,
      maxTokens: 4096,
      autoApproveTools: ['book-tools.getBookOutline', 'book-tools.getChapterContent', 'book-tools.searchBook'],
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'format-agent',
      name: 'Format Agent',
      description: 'Apply formatting and consistency to the book',
      providerId: 'openai',
      mcpServerIds: ['book-tools'],
      systemPrompt: `You are a formatting specialist for academic documents.
1. Ensure consistent heading levels (#, ##, ###)
2. Fix LaTeX equation formatting
3. Ensure tables are properly formatted
4. Standardize terminology across chapters

Make minimal changes that only affect formatting, not content.`,
      temperature: 0.3,
      maxTokens: 4096,
      autoApproveTools: ['book-tools.getBookOutline', 'book-tools.getChapterContent'],
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}