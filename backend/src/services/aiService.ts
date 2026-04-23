import { Message, ChatOptions, ChatResponse } from '../types/index.js';

export async function chat(
  messages: Message[],
  options: ChatOptions
): Promise<ChatResponse> {
  // TODO: Implement chat with default provider
  return {
    content: '',
    finishReason: 'stop',
  };
}

export async function streamChat(
  messages: Message[],
  options: ChatOptions,
  onChunk: (chunk: string) => void
): Promise<void> {
  // TODO: Implement streaming chat
}

export function buildSystemPrompt(cursorRules: string[], chapterContext?: string): string {
  // TODO: Implement system prompt builder
  let prompt = 'You are an AI writing assistant for a book editor.';
  if (cursorRules.length > 0) {
    prompt += '\n\nCURSOR RULES:\n' + cursorRules.map((r, i) => `${i + 1}. ${r}`).join('\n');
  }
  if (chapterContext) {
    prompt += `\n\nCURRENT CHAPTER:\n${chapterContext}`;
  }
  return prompt;
}