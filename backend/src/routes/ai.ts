import { Router } from 'express';
import { providerManager } from '../services/ai/providerManager.js';
import * as conversationService from '../services/conversationService.js';
import * as bookService from '../services/bookService.js';
import { Message } from '../types/index.js';

const router = Router();

function buildSystemPrompt(cursorRules: { content: string; enabled: boolean }[], chapterContext?: string): string {
  const enabledRules = cursorRules.filter((r) => r.enabled);

  let prompt = `You are an AI writing assistant for a book editor.
Help with writing, editing, formatting (Markdown, LaTeX), and following structure guidelines.
When providing suggestions, provide 2-3 options labeled A, B, C.`;

  if (enabledRules.length > 0) {
    prompt += '\n\nCURSOR RULES:\n';
    enabledRules.forEach((rule, i) => {
      prompt += `${i + 1}. ${rule.content}\n`;
    });
  }

  if (chapterContext) {
    prompt += `\n\nCURRENT CHAPTER:\n${chapterContext}\n`;
  }

  return prompt;
}

// POST /api/ai/chat - Chat with AI (streaming)
router.post('/chat', async (req, res, next) => {
  try {
    const { messages, providerId, bookId, chapterId, cursorRules } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'messages is required' });
      return;
    }

    const chapter = bookId && chapterId ? await bookService.getChapter(bookId, chapterId) : null;
    const chapterContext = chapter ? `Title: ${chapter.title}\n\n${chapter.content}` : undefined;
    const systemPrompt = buildSystemPrompt(
      Array.isArray(cursorRules) ? cursorRules : [],
      chapterContext
    );

    const provider = providerId
      ? providerManager.getProvider(providerId)
      : await providerManager.getDefaultProvider();

    if (!provider) {
      res.status(400).json({ error: 'No AI provider available. Please configure a provider.' });
      return;
    }

    // Set up SSE headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullContent = '';

    const outgoingMessages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...(messages as Message[]),
    ];

    await provider.streamChat(
      outgoingMessages,
      { temperature: 0.7, maxTokens: 4096 },
      (chunk) => {
        fullContent += chunk;
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
      },
      () => {
        res.write(`data: ${JSON.stringify({ type: 'done', content: fullContent })}\n\n`);
        res.end();
      },
      (error) => {
        res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
        res.end();
      }
    );

    // Keep connection alive
    req.on('close', () => {
      res.end();
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/chat-with-tools - Chat with AI and tool calling
router.post('/chat-with-tools', async (req, res, next) => {
  try {
    const { messages, providerId, bookId, chapterId, tools } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'messages is required' });
      return;
    }

    const provider = providerId
      ? providerManager.getProvider(providerId)
      : await providerManager.getDefaultProvider();

    if (!provider) {
      res.status(400).json({ error: 'No AI provider available' });
      return;
    }

    if (!provider.supportsTools) {
      res.status(400).json({ error: 'Provider does not support tool calling' });
      return;
    }

    const response = await provider.chat(messages as Message[], {
      temperature: 0.7,
      maxTokens: 4096,
      tools,
    });

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/ai/providers - List configured providers
router.get('/providers', (_req, res) => {
  const providers = providerManager.getProviders();
  res.json(providers);
});

// GET /api/ai/books/:id/ai-conversations - List conversations for book
router.get('/books/:id/ai-conversations', async (req, res, next) => {
  try {
    const conversations = await conversationService.getConversations(req.params.id);
    res.json(conversations);
  } catch (error) {
    next(error);
  }
});

// GET /api/ai/books/:id/chapters/:cid/ai - Get or create conversation for chapter
router.get('/books/:id/chapters/:cid/ai', async (req, res, next) => {
  try {
    let conversation = await conversationService.getConversationByChapter(req.params.id, req.params.cid);

    if (!conversation) {
      conversation = await conversationService.createConversation(req.params.id, req.params.cid);
    }

    res.json(conversation);
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/books/:id/chapters/:cid/messages - Add message to conversation
router.post('/books/:id/chapters/:cid/messages', async (req, res, next) => {
  try {
    const { role, content } = req.body;

    if (!role || !content) {
      res.status(400).json({ error: 'role and content are required' });
      return;
    }

    if (role !== 'user' && role !== 'assistant') {
      res.status(400).json({ error: 'role must be user or assistant' });
      return;
    }

    let conversation = await conversationService.getConversationByChapter(req.params.id, req.params.cid);

    if (!conversation) {
      conversation = await conversationService.createConversation(req.params.id, req.params.cid);
    }

    const message = await conversationService.addMessage(req.params.id, conversation.id, role, content);
    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/books/:id/conversations/:cvid/cursor-rules - Add cursor rule
router.post('/books/:id/conversations/:cvid/cursor-rules', async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content) {
      res.status(400).json({ error: 'content is required' });
      return;
    }

    const rule = await conversationService.addCursorRule(req.params.id, req.params.cvid, content);
    res.status(201).json(rule);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/ai/books/:id/conversations/:cvid/cursor-rules/:ruleid - Toggle cursor rule
router.patch('/books/:id/conversations/:cvid/cursor-rules/:ruleid', async (req, res, next) => {
  try {
    const success = await conversationService.toggleCursorRule(req.params.id, req.params.cvid, req.params.ruleid);
    if (!success) {
      res.status(404).json({ error: 'Rule not found' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/ai/books/:id/conversations/:cvid/cursor-rules/:ruleid - Delete cursor rule
router.delete('/books/:id/conversations/:cvid/cursor-rules/:ruleid', async (req, res, next) => {
  try {
    const success = await conversationService.deleteCursorRule(req.params.id, req.params.cvid, req.params.ruleid);
    if (!success) {
      res.status(404).json({ error: 'Rule not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/books/:id/conversations/:cvid/select-option - Select AI response option
router.post('/books/:id/conversations/:cvid/select-option', async (req, res, next) => {
  try {
    const { messageId, optionLabel } = req.body;

    if (!messageId || !optionLabel) {
      res.status(400).json({ error: 'messageId and optionLabel are required' });
      return;
    }

    const success = await conversationService.selectOption(req.params.id, req.params.cvid, messageId, optionLabel);
    if (!success) {
      res.status(404).json({ error: 'Message or option not found' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
