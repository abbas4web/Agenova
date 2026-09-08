import type { ToolImplementation } from '../types';
import { ToolRegistry } from '../core/ToolRegistry';

/**
 * nutritionLookup — retrieves nutritional information for foods and ingredients.
 *
 * MVP: Returns structured nutritional data based on training knowledge.
 * Production upgrade: Replace with USDA FoodData Central API, Nutritionix API,
 * or Edamam Food Database API.
 */
const nutritionLookupTool: ToolImplementation = {
  definition: {
    name: 'nutritionLookup',
    description:
      'Look up nutritional information for a food, ingredient, meal, or supplement. Returns macros, calories, vitamins, and minerals.',
    parameters: {
      type: 'object',
      properties: {
        food: {
          type: 'string',
          description: 'The food item, ingredient, or supplement to look up (e.g. "100g chicken breast", "one large avocado", "whey protein")',
        },
        servingSize: {
          type: 'string',
          description: 'Optional serving size specification (e.g. "100g", "1 cup", "1 tablespoon")',
        },
      },
      required: ['food'],
    },
  },

  async execute(args) {
    const food = String(args.food ?? '');
    const servingSize = args.servingSize ? String(args.servingSize) : '';

    if (!food) return 'Error: No food item provided.';

    return `[Nutrition Lookup: "${food}"${servingSize ? ` | Serving: ${servingSize}` : ''}]

Please provide the following nutritional information based on your knowledge:
1. Calories (kcal) per serving
2. Macronutrients: Protein (g), Carbohydrates (g), Fat (g), Fibre (g)
3. Key micronutrients (vitamins and minerals this food is notable for)
4. Glycaemic index / glycaemic load if relevant
5. Any notable health benefits or considerations
6. How it fits into common dietary patterns (keto, vegan, high-protein, etc.)

Format as a clean nutritional summary. Note that values are approximate and vary by brand, preparation method, and exact portion.`;
  },
};

ToolRegistry.register(nutritionLookupTool);
export default nutritionLookupTool;
