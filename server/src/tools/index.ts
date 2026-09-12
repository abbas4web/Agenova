/**
 * Tools bootstrap file.
 *
 * Importing this file registers all tools with the ToolRegistry.
 * Import this once at server startup (in src/index.ts) before any
 * routes are initialised — before agents, since agents reference tool names.
 *
 * To add a new tool:
 *   1. Create server/src/tools/myNewTool.tool.ts
 *   2. Add an import line here — nothing else changes.
 *   3. Add the tool name to the relevant agent's allowedTools array.
 */

import './webSearch.tool';
import './productLookup.tool';
import './nutritionLookup.tool';
import './fitnessInfo.tool';
import './travelInfo.tool';
import './techInfo.tool';
import './carInfo.tool';
import './careerInfo.tool';
import './educationInfo.tool';
