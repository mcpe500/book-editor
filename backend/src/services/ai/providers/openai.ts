import { Message, ChatOptions, ChatResponse, Tool } from '../../../types/index.js';

export class OpenAIProvider {
  readonly id = 'openai';
  readonly name = 'openai';
  readonly displayName = 'OpenAI';
  readonly supportsTools = true;
  readonly supportsVision = true;
  readonly maxContextWindow = 128000;

  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model ?? 'gpt-4-turbo';
  }

  private getModel(): string {
    return this.model;
  }

  async chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse> {
    const body: Record<string, unknown> = {
      model: this.getModel(),
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4096,
      top_p: options?.topP ?? 1,
    };

    if (options?.tools) {
      body.tools = options.tools.map((t: Tool) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: {
            type: 'object',
            properties: Object.fromEntries(
              Object.entries(t.parameters).map(([k, v]) => [k, { ...v as object }])
            ),
          },
        },
      }));
      body.tool_choice = options.toolChoice ?? 'auto';
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json() as { choices: Array<{ message: { content?: string; tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }> } }> };
    const choice = data.choices[0];

    if (choice.message.tool_calls) {
      return {
        content: choice.message.content ?? '',
        toolCalls: choice.message.tool_calls.map((tc: any) => ({
          id: tc.id,
          name: tc.function.name,
          arguments: JSON.parse(tc.function.arguments),
        })),
        finishReason: 'tool_calls',
      };
    }

    return {
      content: choice.message.content ?? '',
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
    const body: Record<string, unknown> = {
      model: this.getModel(),
      messages,
      stream: true,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4096,
      top_p: options?.topP ?? 1,
    };

    if (options?.tools) {
      body.tools = options.tools.map((t: Tool) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: {
            type: 'object',
            properties: Object.fromEntries(
              Object.entries(t.parameters).map(([k, v]) => [k, { ...v as object }])
            ),
          },
        },
      }));
      body.tool_choice = options.toolChoice ?? 'auto';
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
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
              const dataStr = line.slice(6);
              if (dataStr === '[DONE]') {
                onComplete();
                return;
              }
              try {
                const data = JSON.parse(dataStr);
                if (data.choices?.[0]?.delta?.content) {
                  onChunk(data.choices[0].delta.content);
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
