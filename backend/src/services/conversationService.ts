import { AIConversation, AIMessage, CursorRule } from '../types/index.js';
import { readJSON, writeJSON, ensureDir } from '../utils/jsonFile.js';
import { generateId } from '../utils/uuid.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const conversationsDir = path.join(__dirname, '../../../data/conversations');

async function getConversationDir(bookId: string): Promise<string> {
  const dir = path.join(conversationsDir, bookId);
  await ensureDir(dir);
  return dir;
}

export async function getConversations(bookId: string): Promise<AIConversation[]> {
  try {
    const dir = await getConversationDir(bookId);
    const files = await fs.readdir(dir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    const conversations: AIConversation[] = [];
    for (const file of jsonFiles) {
      try {
        const filepath = path.join(dir, file);
        const conv = await readJSON<AIConversation>(filepath);
        conversations.push(conv);
      } catch {
        // Skip invalid files
      }
    }

    return conversations.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch {
    return [];
  }
}

export async function getConversation(bookId: string, conversationId: string): Promise<AIConversation | null> {
  try {
    const dir = await getConversationDir(bookId);
    const filepath = path.join(dir, `${conversationId}.json`);
    return await readJSON<AIConversation>(filepath);
  } catch {
    return null;
  }
}

export async function getConversationByChapter(bookId: string, chapterId: string): Promise<AIConversation | null> {
  const conversations = await getConversations(bookId);
  return conversations.find(c => c.chapterId === chapterId) || null;
}

export async function createConversation(bookId: string, chapterId: string): Promise<AIConversation> {
  const now = new Date().toISOString();
  const conversation: AIConversation = {
    id: generateId(),
    bookId,
    chapterId,
    messages: [],
    cursorRules: [],
    createdAt: now,
    updatedAt: now,
  };

  const dir = await getConversationDir(bookId);
  const filepath = path.join(dir, `${conversation.id}.json`);
  await writeJSON(filepath, conversation);

  return conversation;
}

export async function addMessage(
  bookId: string,
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  options?: { label: 'A' | 'B' | 'C'; content: string; selected: boolean }[]
): Promise<AIMessage | null> {
  const conversation = await getConversation(bookId, conversationId);
  if (!conversation) return null;

  const message: AIMessage = {
    id: generateId(),
    role,
    content,
    timestamp: new Date().toISOString(),
    options: options?.map(o => ({ ...o, id: crypto.randomUUID() })),
  };

  conversation.messages.push(message);
  conversation.updatedAt = new Date().toISOString();

  const dir = await getConversationDir(bookId);
  const filepath = path.join(dir, `${conversationId}.json`);
  await writeJSON(filepath, conversation);

  return message;
}

export async function addCursorRule(
  bookId: string,
  conversationId: string,
  content: string
): Promise<CursorRule | null> {
  const conversation = await getConversation(bookId, conversationId);
  if (!conversation) return null;

  const rule: CursorRule = {
    id: generateId(),
    content,
    enabled: true,
    createdAt: new Date().toISOString(),
  };

  conversation.cursorRules.push(rule);
  conversation.updatedAt = new Date().toISOString();

  const dir = await getConversationDir(bookId);
  const filepath = path.join(dir, `${conversationId}.json`);
  await writeJSON(filepath, conversation);

  return rule;
}

export async function toggleCursorRule(
  bookId: string,
  conversationId: string,
  ruleId: string
): Promise<boolean> {
  const conversation = await getConversation(bookId, conversationId);
  if (!conversation) return false;

  const rule = conversation.cursorRules.find(r => r.id === ruleId);
  if (!rule) return false;

  rule.enabled = !rule.enabled;
  conversation.updatedAt = new Date().toISOString();

  const dir = await getConversationDir(bookId);
  const filepath = path.join(dir, `${conversationId}.json`);
  await writeJSON(filepath, conversation);

  return true;
}

export async function deleteCursorRule(
  bookId: string,
  conversationId: string,
  ruleId: string
): Promise<boolean> {
  const conversation = await getConversation(bookId, conversationId);
  if (!conversation) return false;

  const index = conversation.cursorRules.findIndex(r => r.id === ruleId);
  if (index === -1) return false;

  conversation.cursorRules.splice(index, 1);
  conversation.updatedAt = new Date().toISOString();

  const dir = await getConversationDir(bookId);
  const filepath = path.join(dir, `${conversationId}.json`);
  await writeJSON(filepath, conversation);

  return true;
}

export async function selectOption(
  bookId: string,
  conversationId: string,
  messageId: string,
  optionLabel: 'A' | 'B' | 'C'
): Promise<boolean> {
  const conversation = await getConversation(bookId, conversationId);
  if (!conversation) return false;

  const message = conversation.messages.find(m => m.id === messageId);
  if (!message || !message.options) return false;

  message.options.forEach(opt => {
    opt.selected = opt.label === optionLabel;
  });
  conversation.updatedAt = new Date().toISOString();

  const dir = await getConversationDir(bookId);
  const filepath = path.join(dir, `${conversationId}.json`);
  await writeJSON(filepath, conversation);

  return true;
}

export async function deleteConversation(bookId: string, conversationId: string): Promise<boolean> {
  try {
    const dir = await getConversationDir(bookId);
    const filepath = path.join(dir, `${conversationId}.json`);
    await fs.unlink(filepath);
    return true;
  } catch {
    return false;
  }
}
