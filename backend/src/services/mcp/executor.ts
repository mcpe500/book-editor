import { MCPToolResult } from '../../types/index.js';
import { MCPClient, mcpClient } from './client.js';
import { bookToolsHandlers } from './servers/book-tools.js';
import { webToolsHandlers } from './servers/web-tools.js';

export class MCPToolExecutor {
  private builtInHandlers: Record<string, Record<string, Function>> = {
    'book-tools': bookToolsHandlers,
    'web-tools': webToolsHandlers,
  };

  private externalClients: Map<string, MCPClient> = new Map();

  async execute(
    serverName: string,
    toolName: string,
    args: unknown,
    context: { bookId: string; chapterId?: string }
  ): Promise<MCPToolResult> {
    const builtIn = this.builtInHandlers[serverName];
    if (builtIn && builtIn[toolName]) {
      return await (builtIn[toolName] as Function)(
        context.bookId,
        context.chapterId,
        ...Object.values(args as Record<string, unknown>)
      );
    }

    const client = this.externalClients.get(serverName);
    if (client) {
      return await client.executeTool(serverName, toolName, args);
    }

    throw new Error(`Tool ${toolName} not found on server ${serverName}`);
  }

  registerExternalServer(serverId: string, client: MCPClient): void {
    this.externalClients.set(serverId, client);
  }

  getBuiltInServers(): string[] {
    return Object.keys(this.builtInHandlers);
  }

  getBuiltInTools(serverName: string): string[] {
    const handlers = this.builtInHandlers[serverName];
    return handlers ? Object.keys(handlers) : [];
  }
}

export const toolExecutor = new MCPToolExecutor();