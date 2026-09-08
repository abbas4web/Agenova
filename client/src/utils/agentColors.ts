import type { AgentColor } from '../types';

/**
 * Maps an agent color name to Tailwind utility classes.
 * All variants are spelled out explicitly so Tailwind's JIT
 * scanner includes them in the build.
 */
export const agentColorMap: Record<
  AgentColor,
  { bg: string; bgLight: string; text: string; border: string; ring: string; gradient: string }
> = {
  indigo: {
    bg: 'bg-indigo-600',
    bgLight: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/40',
    ring: 'ring-indigo-500',
    gradient: 'from-indigo-600 to-indigo-800',
  },
  pink: {
    bg: 'bg-pink-600',
    bgLight: 'bg-pink-500/10',
    text: 'text-pink-400',
    border: 'border-pink-500/40',
    ring: 'ring-pink-500',
    gradient: 'from-pink-600 to-pink-800',
  },
  rose: {
    bg: 'bg-rose-600',
    bgLight: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/40',
    ring: 'ring-rose-500',
    gradient: 'from-rose-600 to-rose-800',
  },
  green: {
    bg: 'bg-green-600',
    bgLight: 'bg-green-500/10',
    text: 'text-green-400',
    border: 'border-green-500/40',
    ring: 'ring-green-500',
    gradient: 'from-green-600 to-green-800',
  },
  sky: {
    bg: 'bg-sky-600',
    bgLight: 'bg-sky-500/10',
    text: 'text-sky-400',
    border: 'border-sky-500/40',
    ring: 'ring-sky-500',
    gradient: 'from-sky-600 to-sky-800',
  },
  blue: {
    bg: 'bg-blue-600',
    bgLight: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/40',
    ring: 'ring-blue-500',
    gradient: 'from-blue-600 to-blue-800',
  },
  orange: {
    bg: 'bg-orange-600',
    bgLight: 'bg-orange-500/10',
    text: 'text-orange-400',
    border: 'border-orange-500/40',
    ring: 'ring-orange-500',
    gradient: 'from-orange-600 to-orange-800',
  },
  violet: {
    bg: 'bg-violet-600',
    bgLight: 'bg-violet-500/10',
    text: 'text-violet-400',
    border: 'border-violet-500/40',
    ring: 'ring-violet-500',
    gradient: 'from-violet-600 to-violet-800',
  },
  amber: {
    bg: 'bg-amber-600',
    bgLight: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/40',
    ring: 'ring-amber-500',
    gradient: 'from-amber-600 to-amber-800',
  },
  yellow: {
    bg: 'bg-yellow-600',
    bgLight: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    border: 'border-yellow-500/40',
    ring: 'ring-yellow-500',
    gradient: 'from-yellow-600 to-yellow-800',
  },
};

export function getAgentColors(color: AgentColor) {
  return agentColorMap[color] ?? agentColorMap.indigo;
}
