import { Router } from 'express';
import fs from 'fs/promises';
import { providerManager } from '../services/ai/providerManager.js';
import {
  buildMergedMarkdown,
  createNode,
  createProject,
  deleteNode,
  exportProject,
  getNodeDocument,
  listProjects,
  moveNode,
  readManifest,
  renameNode,
  saveNodeContent,
  updateProjectRules,
} from '../services/projectService.js';
import { ExportFormat, ProjectRuleSet, ReviseProjectRequest } from '../types/project.js';
import { Message } from '../types/index.js';

const router = Router();

function normalizeLines(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split('\n').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

router.get('/', async (_req, res, next) => {
  try {
    res.json(await listProjects());
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const title = String(req.body?.title ?? '').trim();
    if (!title) {
      res.status(400).json({ error: 'title is required' });
      return;
    }

    res.status(201).json(await createProject({ title }));
  } catch (error) {
    next(error);
  }
});

router.get('/:projectId/tree', async (req, res, next) => {
  try {
    const manifest = await readManifest(req.params.projectId);
    if (!manifest) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json({ manifest });
  } catch (error) {
    next(error);
  }
});

router.get('/:projectId/nodes/:nodeId', async (req, res, next) => {
  try {
    const document = await getNodeDocument(req.params.projectId, req.params.nodeId);
    if (!document) {
      res.status(404).json({ error: 'Node not found' });
      return;
    }
    res.json(document);
  } catch (error) {
    next(error);
  }
});

router.put('/:projectId/nodes/:nodeId/content', async (req, res, next) => {
  try {
    const content = typeof req.body?.content === 'string' ? req.body.content : '';
    const document = await saveNodeContent(req.params.projectId, req.params.nodeId, content);
    if (!document) {
      res.status(404).json({ error: 'Node not found' });
      return;
    }
    res.json(document);
  } catch (error) {
    next(error);
  }
});

router.post('/:projectId/nodes', async (req, res, next) => {
  try {
    const title = String(req.body?.title ?? '').trim();
    if (!title) {
      res.status(400).json({ error: 'title is required' });
      return;
    }

    const manifest = await createNode(req.params.projectId, {
      title,
      parentId: req.body?.parentId ?? null,
      afterNodeId: req.body?.afterNodeId ?? null,
    });
    if (!manifest) {
      res.status(404).json({ error: 'Project or parent node not found' });
      return;
    }
    res.status(201).json({ manifest });
  } catch (error) {
    next(error);
  }
});

router.patch('/:projectId/nodes/:nodeId/move', async (req, res, next) => {
  try {
    const manifest = await moveNode(req.params.projectId, req.params.nodeId, {
      targetParentId: req.body?.targetParentId ?? null,
      targetIndex: Number(req.body?.targetIndex ?? 0),
    });
    if (!manifest) {
      res.status(404).json({ error: 'Project or node not found' });
      return;
    }
    res.json({ manifest });
  } catch (error) {
    next(error);
  }
});

router.patch('/:projectId/nodes/:nodeId', async (req, res, next) => {
  try {
    const title = String(req.body?.title ?? '').trim();
    if (!title) {
      res.status(400).json({ error: 'title is required' });
      return;
    }

    const manifest = await renameNode(req.params.projectId, req.params.nodeId, title);
    if (!manifest) {
      res.status(404).json({ error: 'Project or node not found' });
      return;
    }
    res.json({ manifest });
  } catch (error) {
    next(error);
  }
});

router.delete('/:projectId/nodes/:nodeId', async (req, res, next) => {
  try {
    const manifest = await deleteNode(req.params.projectId, req.params.nodeId);
    if (!manifest) {
      res.status(404).json({ error: 'Project or node not found' });
      return;
    }
    res.json({ manifest });
  } catch (error) {
    next(error);
  }
});

router.patch('/:projectId/rules', async (req, res, next) => {
  try {
    const rules: Partial<ProjectRuleSet> = {
      mustFollow: normalizeLines(req.body?.mustFollow),
      mustNotFollow: normalizeLines(req.body?.mustNotFollow),
      terminology: normalizeLines(req.body?.terminology),
      memoryNotes: normalizeLines(req.body?.memoryNotes),
      styleProfile: typeof req.body?.styleProfile === 'string' ? req.body.styleProfile : undefined,
    };
    const manifest = await updateProjectRules(req.params.projectId, rules);
    if (!manifest) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json({ manifest });
  } catch (error) {
    next(error);
  }
});

router.post('/:projectId/ai/revise', async (req, res, next) => {
  try {
    const body = req.body as ReviseProjectRequest;
    if (!body?.nodeId || !body?.instruction) {
      res.status(400).json({ error: 'nodeId and instruction are required' });
      return;
    }

    const manifest = await readManifest(req.params.projectId);
    const document = await getNodeDocument(req.params.projectId, body.nodeId);
    if (!manifest || !document) {
      res.status(404).json({ error: 'Project or node not found' });
      return;
    }

    const provider = await providerManager.getDefaultProvider();
    if (!provider) {
      res.status(503).json({ error: 'No AI provider available. Configure one in backend/providers first.' });
      return;
    }

    const ruleBlock = [
      `Style profile: ${manifest.rules.styleProfile}`,
      manifest.rules.mustFollow.length ? `Must follow:\n- ${manifest.rules.mustFollow.join('\n- ')}` : '',
      manifest.rules.mustNotFollow.length ? `Must avoid:\n- ${manifest.rules.mustNotFollow.join('\n- ')}` : '',
      manifest.rules.terminology.length ? `Terminology:\n- ${manifest.rules.terminology.join('\n- ')}` : '',
      manifest.rules.memoryNotes.length ? `Memory notes:\n- ${manifest.rules.memoryNotes.join('\n- ')}` : '',
    ].filter(Boolean).join('\n\n');

    const messages: Message[] = [
      {
        role: 'system',
        content: [
          'You are an academic writing assistant for a modular markdown thesis editor.',
          'Return only the revised content requested by the user. Do not add explanations.',
          'Preserve markdown structure unless the instruction explicitly asks to change it.',
        ].join('\n'),
      },
      {
        role: 'user',
        content: [
          `Project title: ${manifest.title}`,
          `Current node: ${document.node.title}`,
          document.ancestry.length ? `Ancestry: ${document.ancestry.map((item) => item.title).join(' > ')}` : '',
          ruleBlock,
          `Instruction: ${body.instruction}`,
          body.selectedText ? `Selected text:\n${body.selectedText}` : `Current node content:\n${document.content}`,
        ].filter(Boolean).join('\n\n'),
      },
    ];

    const response = await provider.chat(messages, { temperature: 0.4, maxTokens: 4096 });
    res.json({ content: response.content.trim(), providerId: provider.id });
  } catch (error) {
    next(error);
  }
});

router.get('/:projectId/markdown', async (req, res, next) => {
  try {
    const merged = await buildMergedMarkdown(req.params.projectId);
    if (!merged) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.type('text/markdown').send(merged.content);
  } catch (error) {
    next(error);
  }
});

router.post('/:projectId/export/:format', async (req, res, next) => {
  try {
    const format = req.params.format as ExportFormat;
    if (!['markdown', 'zip', 'docx', 'pdf'].includes(format)) {
      res.status(400).json({ error: 'Unsupported export format' });
      return;
    }

    const result = await exportProject(req.params.projectId, format);
    if (!result) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const buffer = await fs.readFile(result.outputPath);
    res.setHeader('Content-Disposition', `attachment; filename="${result.downloadName}"`);
    if (format === 'markdown') res.type('text/markdown');
    if (format === 'zip') res.type('application/zip');
    if (format === 'docx') res.type('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    if (format === 'pdf') res.type('application/pdf');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

export default router;
