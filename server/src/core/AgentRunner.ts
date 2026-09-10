import type { AgentRunInput, AgentRunOutput, ChatMessage } from '../types';
import { AgentRegistry } from './AgentRegistry';
import { ToolRegistry } from './ToolRegistry';
import { getProviderForAgent } from './AIProvider';
import { logger } from '../config/logger';

const DEFAULT_MAX_TURNS = 5;

/**
 * AgentRunner — the core execution loop.
 *
 * Supports text-only and vision (image + text) turns.
 * Vision agents (e.g. skincare/Derma) are routed to the vision-capable
 * provider automatically via getProviderForAgent().
 *
 * Flow:
 *   1. Load agent config
 *   2. Route to correct provider (vision vs default)
 *   3. Build message array — attaches inline image on the user turn if present
 *   4. Call provider in a loop until no tool calls or maxTurns reached
 *   5. Return final text reply
 */
export class AgentRunner {
  async run(input: AgentRunInput): Promise<AgentRunOutput> {
    const { agentId, message, conversationHistory, userId, imageBase64, imageMimeType } = input;

    // ── 1. Load agent config ─────────────────────────────────────────────────
    const agent = AgentRegistry.get(agentId);
    const maxTurns = agent.maxTurns ?? DEFAULT_MAX_TURNS;

    // ── 2. Route to the correct provider ─────────────────────────────────────
    // Vision agents get the vision provider (Gemini direct or OpenRouter vision model)
    const provider = getProviderForAgent(agentId);

    logger.info(
      {
        agentId,
        userId,
        provider: provider.providerName,
        model: provider.modelName,
        hasImage: !!imageBase64,
      },
      'AgentRunner: starting run'
    );

    // ── 3. Build initial message array ───────────────────────────────────────
    const effectiveMessage = message || (imageBase64 ? 'Please analyse this image.' : '');

    const userMessage: ChatMessage = {
      role: 'user',
      content: effectiveMessage,
      // Attach image data to the user turn if provided
      ...(imageBase64 && imageMimeType ? { imageBase64, imageMimeType } : {}),
    };

    const messages: ChatMessage[] = [
      { role: 'system', content: agent.systemPrompt },
      ...conversationHistory,
      userMessage,
    ];

    // ── 4. Tool definitions ──────────────────────────────────────────────────
    const toolDefinitions = ToolRegistry.getDefinitions(agent.allowedTools);

    // ── 5. Tool-call loop ────────────────────────────────────────────────────
    let turns = 0;
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;

    while (turns < maxTurns) {
      turns++;

      const aiResponse = await provider.chat(messages, toolDefinitions);

      totalPromptTokens += aiResponse.usage.promptTokens;
      totalCompletionTokens += aiResponse.usage.completionTokens;

      // ── No tool calls → final answer ──────────────────────────────────────
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
          usage: { promptTokens: totalPromptTokens, completionTokens: totalCompletionTokens },
        };
      }

      // ── Execute tool calls ────────────────────────────────────────────────
      if (aiResponse.content) {
        messages.push({ role: 'assistant', content: aiResponse.content });
      }

      for (const toolCall of aiResponse.toolCalls) {
        logger.debug({ toolName: toolCall.name, args: toolCall.args }, 'AgentRunner: tool call');
        const toolResult = await ToolRegistry.execute(toolCall.name, toolCall.args);
        messages.push({ role: 'assistant', content: `Calling tool: ${toolCall.name}` });
        messages.push({ role: 'tool', content: toolResult, toolName: toolCall.name });
      }
    }

    // ── 6. Max turns reached ─────────────────────────────────────────────────
    logger.warn({ agentId, maxTurns }, 'AgentRunner: max turns reached');

    return {
      reply: "I've reached the limit of my reasoning steps. Please try rephrasing or breaking it into smaller questions.",
      agentId,
      usage: { promptTokens: totalPromptTokens, completionTokens: totalCompletionTokens },
    };
  }
}

export const agentRunner = new AgentRunner();
