import type { AgentRunInput, AgentRunOutput, ChatMessage } from '../types';
import { AgentRegistry } from './AgentRegistry';
import { ToolRegistry } from './ToolRegistry';
import { getAIProvider } from './AIProvider';
import { logger } from '../config/logger';

const DEFAULT_MAX_TURNS = 5;

/**
 * AgentRunner — the core execution loop.
 *
 * Flow:
 *   1. Load agent config from registry
 *   2. Build message array (system prompt + history + user message)
 *   3. Call the AI provider
 *   4. If the model wants to call a tool → execute it, append result, loop
 *   5. Return the final text response
 */
export class AgentRunner {
  async run(input: AgentRunInput): Promise<AgentRunOutput> {
    const { agentId, message, conversationHistory, userId } = input;

    // ── 1. Load agent config ─────────────────────────────────────────────────
    const agent = AgentRegistry.get(agentId);
    const maxTurns = agent.maxTurns ?? DEFAULT_MAX_TURNS;
    const provider = getAIProvider();

    logger.info(
      { agentId, userId, provider: provider.providerName, model: provider.modelName },
      'AgentRunner: starting run'
    );

    // ── 2. Build initial message array ───────────────────────────────────────
    const messages: ChatMessage[] = [
      { role: 'system', content: agent.systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message },
    ];

    // ── 3. Get tool definitions the agent is allowed to use ──────────────────
    const toolDefinitions = ToolRegistry.getDefinitions(agent.allowedTools);

    // ── 4. Tool-call loop ────────────────────────────────────────────────────
    let turns = 0;
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;

    while (turns < maxTurns) {
      turns++;

      const aiResponse = await provider.chat(messages, toolDefinitions);

      totalPromptTokens += aiResponse.usage.promptTokens;
      totalCompletionTokens += aiResponse.usage.completionTokens;

      // ── No tool calls → we have the final answer ─────────────────────────
      if (aiResponse.toolCalls.length === 0) {
        const reply = aiResponse.content ?? "I'm sorry, I couldn't generate a response.";

        logger.info(
          {
            agentId,
            turns,
            promptTokens: totalPromptTokens,
            completionTokens: totalCompletionTokens,
          },
          'AgentRunner: run complete'
        );

        return {
          reply,
          agentId,
          usage: {
            promptTokens: totalPromptTokens,
            completionTokens: totalCompletionTokens,
          },
        };
      }

      // ── There are tool calls — if the model also returned text, keep it ───
      if (aiResponse.content) {
        messages.push({ role: 'assistant', content: aiResponse.content });
      }

      // ── Execute each tool call and append results ─────────────────────────
      for (const toolCall of aiResponse.toolCalls) {
        logger.debug({ toolName: toolCall.name, args: toolCall.args }, 'AgentRunner: tool call');

        const toolResult = await ToolRegistry.execute(toolCall.name, toolCall.args);

        // Append the assistant's tool call intent as an assistant message
        messages.push({
          role: 'assistant',
          content: `Calling tool: ${toolCall.name}`,
        });

        // Append the tool result
        messages.push({
          role: 'tool',
          content: toolResult,
          toolName: toolCall.name,
        });
      }
    }

    // ── 5. Safety: max turns reached ────────────────────────────────────────
    logger.warn({ agentId, maxTurns }, 'AgentRunner: max turns reached');

    return {
      reply:
        "I've reached the limit of my reasoning steps for this request. Please try rephrasing or breaking it into smaller questions.",
      agentId,
      usage: {
        promptTokens: totalPromptTokens,
        completionTokens: totalCompletionTokens,
      },
    };
  }
}

// Export a singleton instance
export const agentRunner = new AgentRunner();
