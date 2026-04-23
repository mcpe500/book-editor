import { Router } from 'express';
import { AgentConfig, AgentRun } from '../types/index.js';
import { readJSON, writeJSON, ensureDir } from '../utils/jsonFile.js';
import { generateId } from '../utils/uuid.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const agentsDir = path.join(__dirname, '../../../data/agents');

async function getAgentConfigsPath(bookId?: string): Promise<string> {
  const dir = bookId ? path.join(agentsDir, bookId) : path.join(agentsDir, '_global');
  await ensureDir(dir);
  return path.join(dir, 'configs.json');
}

async function getAgentRunsPath(bookId: string): Promise<string> {
  const dir = path.join(agentsDir, bookId, 'runs');
  await ensureDir(dir);
  return dir;
}

const defaultAgentTemplates: AgentConfig[] = [
  {
    id: 'research-agent',
    name: 'Research Agent',
    description: 'Research topics and find references from the web',
    providerId: 'gemini',
    mcpServerIds: ['web-tools', 'book-tools'],
    systemPrompt: `You are a research assistant for academic writing.
Your tasks:
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
Your tasks:
1. Write content based on the user's instructions
2. Follow the book's style and structure
3. Use proper academic language
4. Include LaTeX for mathematical equations when needed
5. Add proper section headings and formatting

Write complete, publication-ready content.
If you need to reference other chapters, use book-tools to read them first.`,
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
Your tasks:
1. Review content for grammar and spelling errors
2. Check for consistency in terminology
3. Suggest improvements for clarity and flow
4. Verify citations and references are proper
5. Check for logical coherence

Provide specific, actionable feedback.
Format suggestions as: original text → suggested improvement → reason.`,
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
Your tasks:
1. Ensure consistent heading levels (#, ##, ###)
2. Fix LaTeX equation formatting
3. Ensure tables are properly formatted
4. Standardize terminology across chapters
5. Add or fix cross-references (Gambar X.Y, Tabel X.Y)

Make minimal changes that only affect formatting, not content.
Before making changes, read the full chapter to understand context.`,
    temperature: 0.3,
    maxTokens: 4096,
    autoApproveTools: ['book-tools.getBookOutline', 'book-tools.getChapterContent'],
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { bookId } = req.query;

    if (bookId) {
      const configsPath = await getAgentConfigsPath(bookId as string);
      let configs: AgentConfig[] = [];
      try {
        configs = await readJSON<AgentConfig[]>(configsPath);
      } catch {
        // File doesn't exist
      }
      res.json([...defaultAgentTemplates, ...configs]);
    } else {
      res.json(defaultAgentTemplates);
    }
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { bookId, name, description, providerId, mcpServerIds, systemPrompt, temperature, maxTokens, autoApproveTools } = req.body;

    if (!name || !providerId) {
      res.status(400).json({ error: 'name and providerId are required' });
      return;
    }

    const config: AgentConfig = {
      id: generateId(),
      bookId: bookId || null,
      name,
      description: description || '',
      providerId,
      mcpServerIds: mcpServerIds || [],
      systemPrompt: systemPrompt || '',
      temperature: temperature ?? 0.7,
      maxTokens: maxTokens ?? 4096,
      autoApproveTools: autoApproveTools || [],
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const configsPath = await getAgentConfigsPath(bookId);
    const configs: AgentConfig[] = await readJSON<AgentConfig[]>(configsPath).catch(() => []);
    configs.push(config);
    await writeJSON(configsPath, configs);

    res.status(201).json(config);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const template = defaultAgentTemplates.find(a => a.id === req.params.id);
    if (template) {
      res.json(template);
      return;
    }

    for (const bookId of await getAllBookIds()) {
      const configsPath = await getAgentConfigsPath(bookId);
      try {
        const configs = await readJSON<AgentConfig[]>(configsPath);
        const config = configs.find(c => c.id === req.params.id);
        if (config) {
          res.json(config);
          return;
        }
      } catch {
        // Continue
      }
    }

    res.status(404).json({ error: 'Agent not found' });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name, description, providerId, mcpServerIds, systemPrompt, temperature, maxTokens, autoApproveTools, enabled } = req.body;

    for (const bookId of await getAllBookIds()) {
      const configsPath = await getAgentConfigsPath(bookId);
      try {
        const configs = await readJSON<AgentConfig[]>(configsPath);
        const index = configs.findIndex(c => c.id === req.params.id);
        if (index !== -1) {
          configs[index] = {
            ...configs[index],
            name: name ?? configs[index].name,
            description: description ?? configs[index].description,
            providerId: providerId ?? configs[index].providerId,
            mcpServerIds: mcpServerIds ?? configs[index].mcpServerIds,
            systemPrompt: systemPrompt ?? configs[index].systemPrompt,
            temperature: temperature ?? configs[index].temperature,
            maxTokens: maxTokens ?? configs[index].maxTokens,
            autoApproveTools: autoApproveTools ?? configs[index].autoApproveTools,
            enabled: enabled ?? configs[index].enabled,
            updatedAt: new Date().toISOString(),
          };
          await writeJSON(configsPath, configs);
          res.json(configs[index]);
          return;
        }
      } catch {
        // Continue
      }
    }

    res.status(404).json({ error: 'Agent not found' });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    for (const bookId of await getAllBookIds()) {
      const configsPath = await getAgentConfigsPath(bookId);
      try {
        const configs = await readJSON<AgentConfig[]>(configsPath);
        const index = configs.findIndex(c => c.id === req.params.id);
        if (index !== -1) {
          configs.splice(index, 1);
          await writeJSON(configsPath, configs);
          res.status(204).send();
          return;
        }
      } catch {
        // Continue
      }
    }

    res.status(404).json({ error: 'Agent not found' });
  } catch (error) {
    next(error);
  }
});

async function getAllBookIds(): Promise<string[]> {
  const booksDir = path.join(__dirname, '../../../data/books');
  try {
    const files = await fs.readdir(booksDir);
    return files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
  } catch {
    return [];
  }
}

import fs from 'fs/promises';

export default router;
