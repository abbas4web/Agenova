import type { ToolImplementation } from '../types';
import { ToolRegistry } from '../core/ToolRegistry';

/**
 * carInfo — retrieves vehicle specifications and automotive information.
 *
 * MVP: Returns structured automotive data based on training knowledge.
 * Production upgrade: Replace with NHTSA API, CarQuery API, Edmunds API,
 * or similar automotive data providers.
 */
const carInfoTool: ToolImplementation = {
  definition: {
    name: 'carInfo',
    description:
      'Look up vehicle specifications, reliability data, ownership costs, or automotive comparisons. Use for specific make/model details or car category guidance.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The vehicle or automotive topic to look up (e.g. "2023 Toyota Camry specs", "best family SUVs under $40000", "Tesla Model 3 vs Model Y")',
        },
        make: {
          type: 'string',
          description: 'Vehicle manufacturer (e.g. "Toyota", "Ford", "BMW")',
        },
        model: {
          type: 'string',
          description: 'Vehicle model (e.g. "Camry", "F-150", "3 Series")',
        },
        year: {
          type: 'string',
          description: 'Model year (e.g. "2023")',
        },
      },
      required: ['query'],
    },
  },

  async execute(args) {
    const query = String(args.query ?? '');
    const make = args.make ? String(args.make) : '';
    const model = args.model ? String(args.model) : '';
    const year = args.year ? String(args.year) : '';

    if (!query) return 'Error: No vehicle query provided.';

    const vehicleId = [year, make, model].filter(Boolean).join(' ');

    return `[Car Info: "${query}"${vehicleId ? ` | Vehicle: ${vehicleId}` : ''}]

Please provide comprehensive automotive information covering:
1. Overview and market positioning
2. Key specifications: engine options, power output, fuel economy, drivetrain
3. Trim levels and key differences between them
4. Reliability history and common issues to watch for
5. Total cost of ownership: insurance tier, maintenance costs, fuel costs
6. Interior space, cargo capacity, and practicality
7. Safety ratings (NHTSA/IIHS if known)
8. Competitors and how this vehicle compares
9. Typical pricing: MSRP, average transaction price, used market value
10. Verdict: who should buy this and why

Note: Pricing and availability are approximate. Recommend checking Edmunds, KBB, or local dealers for current market pricing.`;
  },
};

ToolRegistry.register(carInfoTool);
export default carInfoTool;
