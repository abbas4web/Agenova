import type { AgentConfig } from '../types';
import { logger } from '../config/logger';

/**
 * AgentRegistry — central store for all agent configurations.
 *
 * Agents register themselves by calling AgentRegistry.register().
 * The registry is populated at startup by importing all agent files.
 */
class AgentRegistryClass {
  private agents = new Map<string, AgentConfig>();

  /**
   * Register an agent configuration.
   * Throws if an agent with the same ID is already registered (catches typos).
   */
  register(config: AgentConfig): void {
    if (this.agents.has(config.id)) {
      throw new Error(`AgentRegistry: duplicate agent ID "${config.id}"`);
    }
    this.agents.set(config.id, config);
    logger.debug({ agentId: config.id, name: config.name }, 'Agent registered');
  }

  /**
   * Retrieve a registered agent config by ID.
   * Throws if not found so callers never receive undefined silently.
   */
  get(agentId: string): AgentConfig {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`AgentRegistry: unknown agent ID "${agentId}"`);
    }
    return agent;
  }

  /** Returns true if the agent ID is registered. */
  has(agentId: string): boolean {
    return this.agents.has(agentId);
  }

  /** All registered agents as an array — used by the API and Orchestrator. */
  getAll(): AgentConfig[] {
    return Array.from(this.agents.values());
  }

  /** IDs and descriptions only — lightweight payload for the Orchestrator prompt. */
  getSummaries(): Array<{ id: string; name: string; description: string }> {
    return this.getAll().map(({ id, name, description }) => ({ id, name, description }));
  }
}

// Singleton exported for the whole application
export const AgentRegistry = new AgentRegistryClass();
