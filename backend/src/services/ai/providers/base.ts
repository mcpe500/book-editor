import { AIProvider, Message, ChatOptions, ChatResponse, AIProviderConfig } from '../../../types/index.js';

export abstract class BaseProvider implements AIProvider {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly displayName: string;
  abstract readonly supportsTools: boolean;
  abstract readonly supportsVision: boolean;
  abstract readonly maxContextWindow: number;

  protected apiKey: string;
  protected model?: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  abstract chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse>;
  abstract streamChat(
    messages: Message[],
    options: ChatOptions,
    onChunk: (chunk: string) => void
  ): Promise<void>;

  protected abstract getApiUrl(): string;
  protected abstract buildRequestBody(
    messages: Message[],
    options?: ChatOptions
  ): Record<string, unknown>;
  protected abstract parseResponse(data: unknown): ChatResponse;
}