import { Router } from 'express';
import { readJSON, writeJSON, ensureDir } from '../utils/jsonFile.js';
import { generateId } from '../utils/uuid.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataDir = path.join(__dirname, '../../../data');
const mcpServersPath = path.join(dataDir, 'mcp-servers.json');

export interface MCPServerConfig {
  id: string;
  name: string;
  description?: string;
  transport: 'stdio' | 'http';
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

async function getServers(): Promise<MCPServerConfig[]> {
  try {
    return await readJSON<MCPServerConfig[]>(mcpServersPath);
  } catch {
    return [];
  }
}

async function saveServers(servers: MCPServerConfig[]): Promise<void> {
  await ensureDir(dataDir);
  await writeJSON(mcpServersPath, servers);
}

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const servers = await getServers();
    res.json(servers);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, description, transport, command, args, url, env } = req.body;

    if (!name || !transport) {
      res.status(400).json({ error: 'name and transport are required' });
      return;
    }

    if (transport === 'stdio' && !command) {
      res.status(400).json({ error: 'command is required for stdio transport' });
      return;
    }

    if (transport === 'http' && !url) {
      res.status(400).json({ error: 'url is required for http transport' });
      return;
    }

    const server: MCPServerConfig = {
      id: generateId(),
      name,
      description,
      transport,
      command,
      args,
      url,
      env,
      enabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const servers = await getServers();
    servers.push(server);
    await saveServers(servers);

    res.status(201).json(server);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const servers = await getServers();
    const server = servers.find(s => s.id === req.params.id);

    if (!server) {
      res.status(404).json({ error: 'Server not found' });
      return;
    }

    res.json(server);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name, description, transport, command, args, url, env, enabled } = req.body;

    const servers = await getServers();
    const index = servers.findIndex(s => s.id === req.params.id);

    if (index === -1) {
      res.status(404).json({ error: 'Server not found' });
      return;
    }

    const updated: MCPServerConfig = {
      ...servers[index],
      name: name ?? servers[index].name,
      description: description ?? servers[index].description,
      transport: transport ?? servers[index].transport,
      command: command ?? servers[index].command,
      args: args ?? servers[index].args,
      url: url ?? servers[index].url,
      env: env ?? servers[index].env,
      enabled: enabled ?? servers[index].enabled,
      updatedAt: new Date().toISOString(),
    };

    servers[index] = updated;
    await saveServers(servers);

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const servers = await getServers();
    const index = servers.findIndex(s => s.id === req.params.id);

    if (index === -1) {
      res.status(404).json({ error: 'Server not found' });
      return;
    }

    servers.splice(index, 1);
    await saveServers(servers);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get('/:id/tools', async (req, res, next) => {
  try {
    const servers = await getServers();
    const server = servers.find(s => s.id === req.params.id);

    if (!server) {
      res.status(404).json({ error: 'Server not found' });
      return;
    }

    if (server.name === 'book-tools') {
      const { bookTools } = await import('../services/mcp/servers/book-tools.js');
      res.json(bookTools);
    } else if (server.name === 'web-tools') {
      const { webTools } = await import('../services/mcp/servers/web-tools.js');
      res.json(webTools);
    } else {
      res.json([]);
    }
  } catch (error) {
    next(error);
  }
});

export default router;
