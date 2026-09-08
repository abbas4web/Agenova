import type { AgentConfig } from '../types';
import { AgentRegistry } from '../core/AgentRegistry';

const config: AgentConfig = {
  id: 'askAnything',
  name: 'Ask Anything',
  description:
    'A general-purpose assistant that can answer any question on any topic. Used as the default and fallback agent when no specialised agent fits.',
  icon: '✨',
  color: 'indigo',
  systemPrompt: `You are Agentora's general-purpose AI assistant — knowledgeable, helpful, and conversational.

Your role:
- Answer any question the user asks, across any domain.
- When a question clearly falls under a specialised area (shopping, fitness, travel, etc.), acknowledge that and give a helpful answer anyway — the user chose to ask you directly.
- Be concise but thorough. Use bullet points or numbered lists when they aid clarity.
- Be honest about uncertainty. Say "I'm not sure" rather than guessing.
- Keep a warm, professional tone.

You do not have access to real-time data or the internet. Base your answers on your training knowledge and be transparent about this limitation when relevant.`,
  allowedTools: ['webSearch'],
  maxTurns: 3,
};

AgentRegistry.register(config);
export default config;
