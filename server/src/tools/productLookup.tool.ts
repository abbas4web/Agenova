import type { ToolImplementation } from '../types';
import { ToolRegistry } from '../core/ToolRegistry';

/**
 * productLookup — retrieves product information for the Shopping Agent.
 *
 * MVP: Returns structured product guidance based on training knowledge.
 * Production upgrade: Replace with Amazon Product API, Google Shopping API,
 * or a scraping service.
 */
const productLookupTool: ToolImplementation = {
  definition: {
    name: 'productLookup',
    description:
      'Look up product information including typical price ranges, key features, pros and cons, and top brands for a given product category or specific item.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The product name, category, or search query (e.g. "wireless headphones under $100")',
        },
        category: {
          type: 'string',
          description: 'Optional product category to narrow results (e.g. "electronics", "clothing", "home appliances")',
        },
        budget: {
          type: 'string',
          description: 'Optional budget range (e.g. "under $50", "$100-$300", "luxury")',
        },
      },
      required: ['query'],
    },
  },

  async execute(args) {
    const query = String(args.query ?? '');
    const category = args.category ? String(args.category) : '';
    const budget = args.budget ? String(args.budget) : '';

    if (!query) return 'Error: No product query provided.';

    const context = [
      category ? `Category: ${category}` : '',
      budget ? `Budget: ${budget}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    return `[Product Lookup: "${query}"${context ? ` | ${context}` : ''}]

Please provide the user with:
1. A brief overview of this product/category
2. Key features to look for when buying
3. Typical price ranges (budget / mid-range / premium tiers)
4. Top recommended brands or specific models with brief reasons
5. What to avoid or common pitfalls
6. Where to buy (major retailers, online platforms)

Note: Actual current prices and availability vary — recommend the user check current listings on Amazon, Best Buy, or relevant retailers for up-to-date pricing.`;
  },
};

ToolRegistry.register(productLookupTool);
export default productLookupTool;
