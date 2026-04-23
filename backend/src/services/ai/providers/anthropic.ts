import { Message, ChatOptions, ChatResponse, Tool } from '../../../types/index.js';

export class AnthropicProvider {
  readonly id = 'anthropic';
  readonly name = 'anthropic';
  readonly displayName = 'Anthropic Claude';
  readonly supportsTools = true;
  readonly supportsVision = true;
  readonly maxContextWindow = 200000;

  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model ?? 'claude-opus-4-5';
  }

  private getModel(): string {
    return this.model;
  }

  async chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse> {
    const systemMessage = messages.find((m) => m.role === 'system');
    const nonSystemMessages = messages.filter((m) => m.role !== 'system');

    const body: Record<string, unknown> = {
      model: this.getModel(),
      messages: nonSystemMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options?.temperature ?? 1,
      max_tokens: options?.maxTokens ?? 4096,
    };

    if (systemMessage) {
      body.system = systemMessage.content;
    }

    if (options?.tools) {
      body.tools = options.tools.map((t: Tool) => ({
        name: t.name,
        description: t.description,
        input_schema: {
          type: 'object',
          properties: Object.fromEntries(
            Object.entries(t.parameters).map(([k, v]) => [k, { ...v as object }])
          ),
        },
      }));
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json() as { content?: Array<{ type?: string; id?: string; name?: string; input?: Record<string, unknown>; text?: string }> };
    const firstContent = data.content?.[0];

    if (firstContent?.type === 'tool_use') {
      return {
        content: '',
        toolCalls: [
          {
            id: firstContent.id ?? crypto.randomUUID(),
            name: firstContent.name ?? '',
            arguments: firstContent.input ?? {},
          },
        ],
        finishReason: 'tool_calls',
      };
    }

    return {
      content: firstContent?.text ?? '',
      finishReason: 'stop',
    };
  }

  async streamChat(
    messages: Message[],
    options: ChatOptions,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    const systemMessage = messages.find((m) => m.role === 'system');
    const nonSystemMessages = messages.filter((m) => m.role !== 'system');

    const body: Record<string, unknown> = {
      model: this.getModel(),
      messages: nonSystemMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      stream: true,
      temperature: options?.temperature ?? 1,
      max_tokens: options?.maxTokens ?? 4096,
    };

    if (systemMessage) {
      body.system = systemMessage.content;
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();

      const processStream = async () => {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            onComplete();
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content?.[0]?.type === 'text' && data.content[0].text) {
                  onChunk(data.content[0].text);
                }
                if (data.type === 'message_stop') {
                  onComplete();
                  return;
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      };

      await processStream();
    } catch (error) {
      onError(error as Error);
    }
  }
}
