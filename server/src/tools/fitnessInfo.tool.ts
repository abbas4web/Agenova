import type { ToolImplementation } from '../types';
import { ToolRegistry } from '../core/ToolRegistry';

/**
 * fitnessInfo — retrieves exercise and workout information for the Fitness Agent.
 *
 * MVP: Returns structured fitness data based on training knowledge.
 * Production upgrade: Replace with ExerciseDB API, Wger API, or similar.
 */
const fitnessInfoTool: ToolImplementation = {
  definition: {
    name: 'fitnessInfo',
    description:
      'Look up exercise information, workout plans, training techniques, or fitness metrics. Use for specific exercise form guidance, muscle group targeting, or training programme details.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The exercise, workout type, or fitness topic to look up (e.g. "barbell squat form", "beginner 5-day workout plan", "VO2 max training")',
        },
        fitnessLevel: {
          type: 'string',
          description: 'User fitness level',
          enum: ['beginner', 'intermediate', 'advanced'],
        },
        goal: {
          type: 'string',
          description: 'Training goal',
          enum: ['muscle gain', 'fat loss', 'endurance', 'strength', 'flexibility', 'general fitness'],
        },
      },
      required: ['query'],
    },
  },

  async execute(args) {
    const query = String(args.query ?? '');
    const fitnessLevel = args.fitnessLevel ? String(args.fitnessLevel) : 'intermediate';
    const goal = args.goal ? String(args.goal) : 'general fitness';

    if (!query) return 'Error: No fitness query provided.';

    return `[Fitness Info: "${query}" | Level: ${fitnessLevel} | Goal: ${goal}]

Please provide comprehensive fitness information covering:
1. Exercise description and primary/secondary muscles targeted
2. Proper form and technique cues (step-by-step)
3. Common mistakes to avoid
4. Recommended sets, reps, and rest periods for the stated goal
5. Progression strategies (how to make it harder over time)
6. Suitable alternatives or modifications for different equipment/ability levels
7. Safety considerations and contraindications

Tailor the response to a ${fitnessLevel} with a goal of ${goal}.`;
  },
};

ToolRegistry.register(fitnessInfoTool);
export default fitnessInfoTool;
