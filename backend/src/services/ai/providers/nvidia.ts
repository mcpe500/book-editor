import { Message, ChatOptions, ChatResponse } from '../../../types/index.js';

export class NvidiaProvider {
  readonly id = 'nvidia';
  readonly name = 'nvidia';
  readonly displayName = 'NVIDIA';
  readonly supportsTools = false;
  readonly supportsVision = false;
  readonly maxContextWindow = 8192;

  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model ?? 'minimaxai/minimax-m2.7';
  }

  async chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse> {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: options?.temperature ?? 1,
        max_tokens: options?.maxTokens ?? 8192,
        top_p: options?.topP ?? 0.95,
      }),
    });

    if (!response.ok) {
      throw new Error(`NVIDIA API error: ${response.status}`);
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    return {
      content: data.choices?.[0]?.message?.content ?? '',
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
    const controller = new AbortController();

    try {
      const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: true,
          temperature: options?.temperature ?? 1,
          max_tokens: options?.maxTokens ?? 8192,
          top_p: options?.topP ?? 0.95,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`NVIDIA API error: ${response.status}`);
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
