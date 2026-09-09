import {
  Sparkles,
  ShoppingBag,
  Flower2,
  Dumbbell,
  Plane,
  Cpu,
  Car,
  BriefcaseBusiness,
  GraduationCap,
  ChefHat,
  Bot,
  type LucideProps,
} from 'lucide-react';
import type { FC } from 'react';

/**
 * Maps agent icon keys (stored in agent configs) to Lucide icon components.
 * Add new entries here when new agents are created.
 */
export const AGENT_ICON_MAP: Record<string, FC<LucideProps>> = {
  Sparkles,
  ShoppingBag,
  Flower2,
  Dumbbell,
  Plane,
  Cpu,
  Car,
  BriefcaseBusiness,
  GraduationCap,
  ChefHat,
  Bot,
};

interface AgentIconProps extends LucideProps {
  iconKey: string;
}

/**
 * Renders the correct Lucide icon for an agent.
 * Falls back to <Bot> if the key is unknown.
 */
export default function AgentIcon({ iconKey, ...props }: AgentIconProps) {
  const Icon = AGENT_ICON_MAP[iconKey] ?? Bot;
  return <Icon {...props} />;
}
