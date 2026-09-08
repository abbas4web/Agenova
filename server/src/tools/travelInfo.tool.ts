import type { ToolImplementation } from '../types';
import { ToolRegistry } from '../core/ToolRegistry';

/**
 * travelInfo — retrieves destination and travel planning information.
 *
 * MVP: Returns structured travel data based on training knowledge.
 * Production upgrade: Replace with Amadeus API, Skyscanner API,
 * or a travel content API.
 */
const travelInfoTool: ToolImplementation = {
  definition: {
    name: 'travelInfo',
    description:
      'Look up travel information for a destination including attractions, best time to visit, local culture, safety, transport, and practical tips.',
    parameters: {
      type: 'object',
      properties: {
        destination: {
          type: 'string',
          description: 'The destination to look up (city, country, or region)',
        },
        travelType: {
          type: 'string',
          description: 'Type of travel',
          enum: ['cultural', 'adventure', 'beach', 'city break', 'family', 'honeymoon', 'backpacking', 'luxury'],
        },
        duration: {
          type: 'string',
          description: 'Trip duration (e.g. "3 days", "1 week", "2 weeks")',
        },
      },
      required: ['destination'],
    },
  },

  async execute(args) {
    const destination = String(args.destination ?? '');
    const travelType = args.travelType ? String(args.travelType) : 'general';
    const duration = args.duration ? String(args.duration) : '';

    if (!destination) return 'Error: No destination provided.';

    return `[Travel Info: "${destination}" | Type: ${travelType}${duration ? ` | Duration: ${duration}` : ''}]

Please provide detailed travel information covering:
1. Overview and why visit — what makes this destination special
2. Best time to visit (weather, crowds, costs, festivals)
3. Top attractions and experiences (must-sees and hidden gems)
4. Local culture, customs, and etiquette
5. Practical info: currency, language, transport within destination
6. Safety considerations and areas to be aware of
7. Budget guidance (budget / mid-range / luxury daily costs)
8. ${duration ? `Suggested ${duration} itinerary` : 'Sample itinerary outline'}
9. Getting there — typical flight hubs and transport options

Important: Always advise the user to verify current visa requirements and travel advisories from their government's official travel portal.`;
  },
};

ToolRegistry.register(travelInfoTool);
export default travelInfoTool;
