import type { ToolImplementation } from '../types';
import { ToolRegistry } from '../core/ToolRegistry';

/**
 * educationInfo — retrieves educational resources and learning guidance.
 *
 * MVP: Returns structured educational data based on training knowledge.
 * Production upgrade: Replace with Coursera API, edX API, Khan Academy API,
 * or a curated learning resource database.
 */
const educationInfoTool: ToolImplementation = {
  definition: {
    name: 'educationInfo',
    description:
      'Look up educational resources, course recommendations, learning roadmaps, or academic information for any subject or skill.',
    parameters: {
      type: 'object',
      properties: {
        subject: {
          type: 'string',
          description: 'The subject or skill to find resources for (e.g. "machine learning", "calculus", "Spanish", "web development")',
        },
        learningLevel: {
          type: 'string',
          description: 'Current knowledge level',
          enum: ['complete beginner', 'beginner', 'intermediate', 'advanced'],
        },
        format: {
          type: 'string',
          description: 'Preferred learning format',
          enum: ['online course', 'book', 'video', 'interactive', 'university degree', 'any'],
        },
        budget: {
          type: 'string',
          description: 'Budget for learning resources',
          enum: ['free', 'low-cost', 'paid', 'any'],
        },
      },
      required: ['subject'],
    },
  },

  async execute(args) {
    const subject = String(args.subject ?? '');
    const learningLevel = args.learningLevel ? String(args.learningLevel) : 'beginner';
    const format = args.format ? String(args.format) : 'any';
    const budget = args.budget ? String(args.budget) : 'any';

    if (!subject) return 'Error: No subject provided.';

    return `[Education Info: "${subject}" | Level: ${learningLevel} | Format: ${format} | Budget: ${budget}]

Please provide comprehensive educational guidance covering:
1. Subject overview: what it is and why it's worth learning
2. Prerequisites: what to know before starting
3. Learning roadmap: the logical sequence of topics to master
4. Top resources by format:
   - Free resources (YouTube channels, free courses, documentation, websites)
   - Paid courses (Coursera, Udemy, edX, Pluralsight — with brief descriptions)
   - Books (classic textbooks and accessible reads)
5. Estimated time to reach different levels (beginner → job-ready → expert)
6. Practice projects or exercises to solidify learning
7. Community and support (forums, Discord servers, subreddits)
8. How to know you're making progress — milestones and checkpoints

Tailor all recommendations for a ${learningLevel} with ${budget} budget preferring ${format} format.`;
  },
};

ToolRegistry.register(educationInfoTool);
export default educationInfoTool;
