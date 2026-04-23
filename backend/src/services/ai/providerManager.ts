import { AIProvider, AIProviderConfig, Message, ChatOptions, ChatResponse } from '../../types/index.js';
import { NvidiaProvider } from './providers/nvidia.js';
import { GeminiProvider } from './providers/gemini.js';
import { OpenAIProvider } from './providers/openai.js';
import { AnthropicProvider } from './providers/anthropic.js';
import { OllamaProvider } from './providers/ollama.js';
import { readJSON, writeJSON, ensureDir } from '../../utils/jsonFile.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataDir = path.join(__dirname, '../../../data');
const providersConfigPath = path.join(dataDir, 'ai-providers.json');

export class AIProviderManager {
  private providers: Map<string, AIProvider> = new Map();
  private configs: Map<string, AIProviderConfig> = new Map();

  async initialize(): Promise<void> {
    try {
      await ensureDir(dataDir);
      let configs: AIProviderConfig[] = [];

      try {
        configs = await readJSON<AIProviderConfig[]>(providersConfigPath);
      } catch {
        // File doesn't exist yet, create with defaults
        configs = this.getDefaultConfigs();
        await writeJSON(providersConfigPath, configs);
      }

      for (const config of configs) {
        if (!config.enabled) continue;

        const provider = this.createProvider(config);
        if (provider) {
          this.providers.set(config.id, provider);
          this.configs.set(config.id, config);
        }
      }
    } catch (error) {
      console.error('Failed to initialize AI providers:', error);
    }
  }

  private getDefaultConfigs(): AIProviderConfig[] {
    return [
      {
        id: 'nvidia',
        provider: 'nvidia',
        name: 'NVIDIA',
        model: 'minimaxai/minimax-m2.7',
        enabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'gemini',
        provider: 'gemini',
        name: 'Google Gemini',
        model: 'gemini-2.0-flash',
        enabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'openai',
        provider: 'openai',
        name: 'OpenAI',
        model: 'gpt-4-turbo',
        enabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'anthropic',
        provider: 'anthropic',
        name: 'Anthropic Claude',
        model: 'claude-opus-4-5',
        enabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'ollama',
        provider: 'ollama',
        name: 'Ollama (Local)',
        model: 'llama3',
        baseUrl: 'http://localhost:11434',
        enabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  private createProvider(config: AIProviderConfig): AIProvider | null {
    if (!config.apiKey && config.provider !== 'ollama') {
      console.warn(`No API key for provider ${config.provider}`);
      return null;
    }

    switch (config.provider) {
      case 'nvidia':
        return new NvidiaProvider(config.apiKey ?? '', config.model);
      case 'gemini':
        return new GeminiProvider(config.apiKey ?? '', config.model);
      case 'openai':
        return new OpenAIProvider(config.apiKey ?? '', config.model);
      case 'anthropic':
        return new AnthropicProvider(config.apiKey ?? '', config.model);
      case 'ollama':
        return new OllamaProvider(config.baseUrl ?? 'http://localhost:11434', config.model);
      default:
        return null;
    }
  }

  getProvider(id: string): AIProvider | null {
    return this.providers.get(id) ?? null;
  }

  getProviders(): AIProviderConfig[] {
    return Array.from(this.configs.values());
  }

  async saveProvider(config: AIProviderConfig): Promise<AIProviderConfig> {
    const configs = await readJSON<AIProviderConfig[]>(providersConfigPath);
    const index = configs.findIndex(c => c.id === config.id);

    config.updatedAt = new Date().toISOString();

    if (index >= 0) {
      configs[index] = config;
    } else {
      config.createdAt = new Date().toISOString();
      configs.push(config);
    }

    await writeJSON(providersConfigPath, configs);
    this.configs.set(config.id, config);

    const provider = this.createProvider(config);
    if (provider) {
      this.providers.set(config.id, provider);
    } else {
      this.providers.delete(config.id);
    }

    return config;
  }

  async deleteProvider(id: string): Promise<boolean> {
    const configs = await readJSON<AIProviderConfig[]>(providersConfigPath);
    const index = configs.findIndex(c => c.id === id);

    if (index === -1) return false;

    configs.splice(index, 1);
    await writeJSON(providersConfigPath, configs);
    this.configs.delete(id);
    this.providers.delete(id);

    return true;
  }

  async getDefaultProvider(): Promise<AIProvider | null> {
    const defaultId = process.env.DEFAULT_AI_PROVIDER ?? 'nvidia';
    const provider = this.getProvider(defaultId);
    if (provider) return provider;

    // Return first available enabled provider
    for (const [id, p] of this.providers) {
      const config = this.configs.get(id);
      if (config?.enabled) return p;
    }

    return null;
  }
}

export const providerManager = new AIProviderManager();
