import { AgentConfig, AgentRun, AgentTask, ToolCallExecution, Message, ChatOptions } from '../types/index.js';
import { providerManager } from './ai/providerManager.js';
import { toolExecutor } from './mcp/executor.js';
import { updateRun, getRun } from './agentService.js';
import { bookTools } from './mcp/servers/book-tools.js';

export class AgentEngine {
  private activeLoops: Map<string, NodeJS.Timeout> = new Map();

  async startRun(runId: string): Promise<void> {
    const run = await getRun(runId);
    if (!run) throw new Error('Run not found');

    const config = await this.getConfig(run.agentConfigId);
    if (!config) throw new Error('Agent config not found');

    run.state = 'running';
    run.startedAt = new Date().toISOString();
    await updateRun(run);

    await this.runLoop(run, config);
  }

  private async runLoop(run: AgentRun, config: AgentConfig): Promise<void> {
    const provider = providerManager.getProvider(config.providerId);
    if (!provider) {
      run.state = 'failed';
      run.tasks.push({
        id: crypto.randomUUID(),
        type: 'thinking',
        description: 'Provider not available',
        status: 'failed',
        error: `Provider ${config.providerId} not found`,
        toolCalls: [],
      });
      await updateRun(run);
      return;
    }

    while (run.state === 'running' && run.tasks.length > 0) {
      const currentTask = run.tasks[0];

      if (currentTask.status === 'pending') {
        currentTask.status = 'in_progress';
        currentTask.startedAt = new Date().toISOString();
        await updateRun(run);
      }

      const messages = this.buildMessages(config, run, currentTask);
      const tools = this.getAvailableTools(config.mcpServerIds);

      try {
        const response = await provider.chat(messages, {
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          tools,
          toolChoice: tools.length > 0 ? 'auto' : undefined,
        });

        run.conversation.push({ role: 'assistant', content: response.content });
        currentTask.result = response.content;

        if (response.toolCalls && response.toolCalls.length > 0) {
          for (const tc of response.toolCalls) {
            const execution: ToolCallExecution = {
              id: crypto.randomUUID(),
              toolName: tc.name,
              arguments: tc.arguments,
              status: 'pending',
            };

            if (config.autoApproveTools.includes(tc.name)) {
              execution.status = 'approved';
              execution.approvedAt = new Date().toISOString();
            } else {
              currentTask.toolCalls.push(execution);
              currentTask.status = 'awaiting_approval';
              await updateRun(run);
              await this.waitForDecision(run.id, execution.id);
            }

            if (execution.status === 'approved') {
              await this.executeTool(execution, run);
            }
          }
        }

        if (currentTask.status === 'in_progress') {
          currentTask.status = 'completed';
          currentTask.completedAt = new Date().toISOString();
          run.tasks.shift();
        }
      } catch (error: any) {
        currentTask.status = 'failed';
        currentTask.error = error.message;
        run.state = 'failed';
      }

      await updateRun(run);
    }

    if (run.state === 'running') {
      run.state = 'completed';
    }
    run.completedAt = new Date().toISOString();
    await updateRun(run);
  }

  private buildMessages(config: AgentConfig, run: AgentRun, task: AgentTask): Message[] {
    const messages: Message[] = [];

    messages.push({ role: 'system', content: config.systemPrompt });

    messages.push(...run.conversation.filter(m => m.role !== 'system'));

    messages.push({
      role: 'user',
      content: task.description,
    });

    return messages;
  }

  private getAvailableTools(mcpServerIds: string[]) {
    const tools: any[] = [];

    for (const serverId of mcpServerIds) {
      if (serverId === 'book-tools') {
        for (const tool of bookTools) {
          tools.push({
            name: `book-tools.${tool.name}`,
            description: tool.description,
            parameters: tool.inputSchema,
          });
        }
      }
    }

    return tools;
  }

  private async executeTool(execution: ToolCallExecution, run: AgentRun): Promise<void> {
    execution.status = 'executing';

    try {
      const [serverName, toolName] = execution.toolName.split('.');
      const result = await toolExecutor.execute(
        serverName,
        toolName,
        execution.arguments as any,
        { bookId: run.bookId, chapterId: run.chapterId }
      );

      execution.result = result;
      execution.status = 'completed';

      run.conversation.push({
        role: 'user',
        content: `Tool result: ${JSON.stringify(result)}`,
      });
    } catch (error: any) {
      execution.error = error.message;
      execution.status = 'failed';
    }
  }

  private async waitForDecision(runId: string, toolCallId: string): Promise<void> {
    return new Promise((resolve) => {
      const interval = setInterval(async () => {
        const run = await getRun(runId);
        if (!run) {
          clearInterval(interval);
          resolve();
          return;
        }

        for (const task of run.tasks) {
          const tc = task.toolCalls.find(t => t.id === toolCallId);
          if (tc && (tc.status === 'approved' || tc.status === 'rejected')) {
            clearInterval(interval);
            resolve();
            return;
          }
        }

        if (run.state !== 'running') {
          clearInterval(interval);
          resolve();
        }
      }, 1000);

      this.activeLoops.set(`${runId}-${toolCallId}`, interval);
    });
  }

  async pauseRun(runId: string): Promise<boolean> {
    const run = await getRun(runId);
    if (!run) return false;
    run.state = 'paused';
    return updateRun(run);
  }

  async resumeRun(runId: string): Promise<void> {
    const run = await getRun(runId);
    if (!run || run.state !== 'paused') return;
    run.state = 'running';
    await updateRun(run);
    const config = await this.getConfig(run.agentConfigId);
    if (config) {
      await this.runLoop(run, config);
    }
  }

  async stopRun(runId: string): Promise<boolean> {
    const interval = this.activeLoops.get(runId);
    if (interval) {
      clearInterval(interval);
      this.activeLoops.delete(runId);
    }

    const run = await getRun(runId);
    if (!run) return false;
    run.state = 'stopped';
    run.completedAt = new Date().toISOString();
    return updateRun(run);
  }

  private async getConfig(configId: string) {
    const configs = await import('./agentService.js');
    return configs.getAgentConfig(configId);
  }
}

export const agentEngine = new AgentEngine();