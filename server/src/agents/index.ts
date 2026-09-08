/**
 * Agent bootstrap file.
 *
 * Importing this file registers all agents with the AgentRegistry.
 * Import this once at server startup (in src/index.ts) before any
 * routes are initialised.
 *
 * To add a new agent:
 *   1. Create server/src/agents/myNewAgent.agent.ts
 *   2. Add an import line here — nothing else changes.
 */

import './askAnything.agent';
import './shopping.agent';
import './skincare.agent';
import './fitness.agent';
import './travel.agent';
import './technology.agent';
import './automobile.agent';
import './career.agent';
import './education.agent';
import './food.agent';
