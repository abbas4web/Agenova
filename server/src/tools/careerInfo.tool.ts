import type { ToolImplementation } from '../types';
import { ToolRegistry } from '../core/ToolRegistry';

/**
 * careerInfo — retrieves career, salary, and job market information.
 *
 * MVP: Returns structured career data based on training knowledge.
 * Production upgrade: Replace with LinkedIn API, Bureau of Labor Statistics API,
 * Glassdoor API, or Levels.fyi for compensation data.
 */
const careerInfoTool: ToolImplementation = {
  definition: {
    name: 'careerInfo',
    description:
      'Look up career information including salary ranges, in-demand skills, job market trends, career paths, and role descriptions.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The career topic to look up (e.g. "software engineer salary", "data science career path", "skills needed for product management")',
        },
        role: {
          type: 'string',
          description: 'Specific job role or title',
        },
        industry: {
          type: 'string',
          description: 'Industry sector (e.g. "technology", "healthcare", "finance", "marketing")',
        },
        location: {
          type: 'string',
          description: 'Location for salary/market data (e.g. "United States", "London", "Remote")',
        },
        experienceLevel: {
          type: 'string',
          description: 'Experience level',
          enum: ['entry-level', 'mid-level', 'senior', 'lead', 'executive'],
        },
      },
      required: ['query'],
    },
  },

  async execute(args) {
    const query = String(args.query ?? '');
    const role = args.role ? String(args.role) : '';
    const industry = args.industry ? String(args.industry) : '';
    const location = args.location ? String(args.location) : 'Global';
    const experienceLevel = args.experienceLevel ? String(args.experienceLevel) : '';

    if (!query) return 'Error: No career query provided.';

    const context = [role, industry, experienceLevel, location].filter(Boolean).join(' | ');

    return `[Career Info: "${query}"${context ? ` | ${context}` : ''}]

Please provide comprehensive career information covering:
1. Role overview: what the job actually involves day-to-day
2. Salary ranges: entry / mid / senior levels${location ? ` in ${location}` : ''}
3. In-demand skills: technical skills, soft skills, certifications
4. Career progression path (entry → senior → leadership)
5. Job market demand and growth outlook
6. How to break into this field (education, self-study, bootcamp, etc.)
7. Top companies hiring for this role
8. Interview process: what to expect, key topics tested
9. Work-life balance and culture considerations

Note: Salary data is approximate and varies by company, location, and individual negotiation. Recommend verifying with Glassdoor, Levels.fyi, LinkedIn Salary, and Payscale for current market rates.`;
  },
};

ToolRegistry.register(careerInfoTool);
export default careerInfoTool;
