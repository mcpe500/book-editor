import { Message, ChatOptions, ChatResponse, Tool } from '../../../types/index.js';

export class GeminiProvider {
  readonly id = 'gemini';
  readonly name = 'gemini';
  readonly displayName = 'Google Gemini';
  readonly supportsTools = true;
  readonly supportsVision = true;
  readonly maxContextWindow = 1000000;

  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model ?? 'gemini-2.0-flash';
  }

  private getModel(): string {
    return this.model;
  }

  async chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse> {
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const requestBody: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: options?.temperature ?? 0.9,
        maxOutputTokens: options?.maxTokens ?? 8192,
        topP: options?.topP ?? 1,
      },
    };

    if (options?.tools) {
      requestBody.tools = {
        functionDeclarations: options.tools.map((t: Tool) => ({
          name: t.name,
          description: t.description,
          parameters: {
            type: 'object',
            properties: Object.fromEntries(
              Object.entries(t.parameters).map(([k, v]) => [k, { ...v as object }])
            ),
          },
        })),
      };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.getModel()}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ functionCall?: { name: string; args: Record<string, unknown> }; text?: string }> } }> };
    const candidate = data.candidates?.[0];
    const content = candidate?.content?.parts?.[0];

    if (content?.functionCall) {
      return {
        content: '',
        toolCalls: [
          {
            id: crypto.randomUUID(),
            name: content.functionCall.name,
            arguments: content.functionCall.args as Record<string, unknown>,
          },
        ],
        finishReason: 'tool_calls',
      };
    }

    return {
      content: content?.text ?? '',
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
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const requestBody: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: options?.temperature ?? 0.9,
        maxOutputTokens: options?.maxTokens ?? 8192,
        topP: options?.topP ?? 1,
      },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.getModel()}:streamGenerateContent?key=${this.apiKey}&alt=sse`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
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
                if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                  onChunk(data.candidates[0].content.parts[0].text);
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
