import { AgentRegistry } from './AgentRegistry';
import { getAIProvider } from './AIProvider';
import { logger } from '../config/logger';

const FALLBACK_AGENT_ID = 'askAnything';

/**
 * Orchestrator — classifies a user message and returns the most
 * appropriate agent ID.
 *
 * If an agentId is already supplied by the client (user manually
 * selected an agent from the sidebar), this is a no-op.
 *
 * Otherwise, a lightweight classification prompt is sent to the AI
 * to pick the best agent from the registry.
 */
export class Orchestrator {
  /**
   * Resolve the correct agent for a given message.
   *
   * @param message     The user's raw message
   * @param agentId     Optional: if the user already picked an agent
   * @returns           Resolved agent ID (guaranteed to be in the registry)
   */
  async resolve(message: string, agentId?: string): Promise<string> {
    // ── User already chose an agent — trust it ───────────────────────────────
    if (agentId && AgentRegistry.has(agentId)) {
      logger.debug({ agentId }, 'Orchestrator: user-supplied agent ID used');
      return agentId;
    }

    // ── Classify via AI ──────────────────────────────────────────────────────
    const summaries = AgentRegistry.getSummaries();
    const agentList = summaries
      .map((a) => `- ${a.id}: ${a.description}`)
      .join('\n');

    const classificationPrompt = `You are a routing assistant for an AI platform called Agentora.
Your only job is to pick the single best agent ID from the list below to handle the user's message.

AVAILABLE AGENTS:
${agentList}

USER MESSAGE:
"${message}"

Rules:
- Reply with ONLY the agent ID (e.g. "shopping") — nothing else.
- No punctuation, no explanation, no quotes.
- If no specialised agent fits, reply with "askAnything".`;

    try {
      const provider = getAIProvider();
      const response = await provider.chat([
        { role: 'user', content: classificationPrompt },
      ]);

      const raw = response.content?.trim().toLowerCase() ?? '';
      // Strip any accidental punctuation the model might add
      const resolved = raw.replace(/[^a-z0-9]/g, '');

      if (AgentRegistry.has(resolved)) {
        logger.info(
          { resolvedAgentId: resolved, message: message.slice(0, 80) },
          'Orchestrator: agent resolved via classification'
        );
        return resolved;
      }

      logger.warn(
        { raw, resolved, message: message.slice(0, 80) },
        'Orchestrator: unrecognised agent from classification, using fallback'
      );
      return FALLBACK_AGENT_ID;
    } catch (err) {
      logger.error({ err }, 'Orchestrator: classification failed, using fallback');
      return FALLBACK_AGENT_ID;
    }
  }
}

// Export a singleton instance
export const orchestrator = new Orchestrator();
