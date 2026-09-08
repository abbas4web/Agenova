import type { ToolImplementation } from '../types';
import { ToolRegistry } from '../core/ToolRegistry';

/**
 * techInfo — retrieves technology product specs and comparisons.
 *
 * MVP: Returns structured tech information based on training knowledge.
 * Production upgrade: Replace with GSMArena API, CNET API, Newegg API,
 * or a tech specs database.
 */
const techInfoTool: ToolImplementation = {
  definition: {
    name: 'techInfo',
    description:
      'Look up technology product specifications, comparisons, or technical information. Use for detailed specs on devices, software, or tech concepts.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The tech product, specification, or concept to look up (e.g. "iPhone 15 Pro specs", "RTX 4070 vs RTX 4080", "SSD vs HDD")',
        },
        category: {
          type: 'string',
          description: 'Product category',
          enum: ['smartphone', 'laptop', 'desktop', 'GPU', 'CPU', 'storage', 'audio', 'TV', 'camera', 'smart home', 'software', 'general'],
        },
      },
      required: ['query'],
    },
  },

  async execute(args) {
    const query = String(args.query ?? '');
    const category = args.category ? String(args.category) : 'general';

    if (!query) return 'Error: No tech query provided.';

    return `[Tech Info: "${query}" | Category: ${category}]

Please provide detailed technical information covering:
1. Overview of the product/technology
2. Key specifications and what they mean in practical terms
3. Performance benchmarks or real-world performance expectations
4. Comparison with closest alternatives (if applicable)
5. Who it's best suited for and use-case scenarios
6. Value proposition — is it worth the price?
7. Known issues, limitations, or things to watch out for
8. Typical price range and where to buy

Note: Specs and pricing reflect knowledge from training data. Recommend verifying with manufacturer websites and current retailers for the latest models and prices.`;
  },
};

ToolRegistry.register(techInfoTool);
export default techInfoTool;
