import type { ToolImplementation } from '../types';
import { ToolRegistry } from '../core/ToolRegistry';

/**
 * webSearch — simulates a web search by generating a structured summary.
 *
 * MVP: Uses the AI's training knowledge to produce a well-formatted search result.
 * Production upgrade path: Replace execute() with a real search API call
 * (e.g. Google Custom Search, Brave Search, Serper) without touching any other file.
 */
const webSearchTool: ToolImplementation = {
  definition: {
    name: 'webSearch',
    description:
      'Search the web for current information on any topic. Use this when the user asks about recent events, current prices, latest news, or any information that may have changed recently.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query to look up',
        },
      },
      required: ['query'],
    },
  },

  async execute(args) {
    const query = String(args.query ?? '');
    if (!query) return 'Error: No search query provided.';

    // MVP: return a structured note that the agent can use in its response
    return `[Web Search Result for: "${query}"]
Note: This is a knowledge-based response. For the most current information, users should verify with live sources such as Google, official websites, or news outlets.

Based on available knowledge: The agent will synthesise an answer using its training data about "${query}". For time-sensitive queries (prices, current events, live data), please advise the user to check current sources directly.`;
  },
};

ToolRegistry.register(webSearchTool);
export default webSearchTool;
