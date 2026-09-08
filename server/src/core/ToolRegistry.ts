import type { ToolImplementation, ToolDefinition } from '../types';
import { logger } from '../config/logger';

/**
 * ToolRegistry — central store for all tool implementations.
 *
 * Tools register themselves at startup.
 * AgentRunner resolves tool calls against this registry.
 */
class ToolRegistryClass {
  private tools = new Map<string, ToolImplementation>();

  /** Register a tool implementation. */
  register(tool: ToolImplementation): void {
    if (this.tools.has(tool.definition.name)) {
      throw new Error(`ToolRegistry: duplicate tool name "${tool.definition.name}"`);
    }
    this.tools.set(tool.definition.name, tool);
    logger.debug({ toolName: tool.definition.name }, 'Tool registered');
  }

  /**
   * Execute a tool by name with the provided arguments.
   * Returns a plain string result that is fed back to the AI as a tool message.
   */
  async execute(toolName: string, args: Record<string, unknown>): Promise<string> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      logger.warn({ toolName }, 'Tool not found in registry');
      return `Error: Tool "${toolName}" is not available.`;
    }

    try {
      logger.debug({ toolName, args }, 'Executing tool');
      const result = await tool.execute(args);
      logger.debug({ toolName, resultLength: result.length }, 'Tool execution complete');
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error({ toolName, args, err }, 'Tool execution failed');
      return `Error executing tool "${toolName}": ${message}`;
    }
  }

  /**
   * Get tool definitions for a specific list of tool names.
   * Used by AgentRunner to pass only the agent's allowed tools to the AI.
   */
  getDefinitions(toolNames: string[]): ToolDefinition[] {
    return toolNames
      .filter((name) => {
        const exists = this.tools.has(name);
        if (!exists) logger.warn({ toolName: name }, 'Agent references unregistered tool');
        return exists;
      })
      .map((name) => this.tools.get(name)!.definition);
  }

  /** All registered tool names — for diagnostics. */
  getRegisteredNames(): string[] {
    return Array.from(this.tools.keys());
  }
}

// Singleton exported for the whole application
export const ToolRegistry = new ToolRegistryClass();
