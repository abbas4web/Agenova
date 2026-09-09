import { useNavigate } from 'react-router-dom';
import type { Agent } from '../../types';
import { getAgentColors } from '../../utils/agentColors';
import type { AgentColor } from '../../types';
import { cn } from '../../utils/cn';
import { useAgentsStore } from '../../store/agentsStore';
import { useChatStore } from '../../store/chatStore';
import AgentIcon from '../common/AgentIcon';

interface AgentCardProps {
  agent: Agent;
  size?: 'sm' | 'md' | 'lg';
}

export default function AgentCard({ agent, size = 'md' }: AgentCardProps) {
  const navigate = useNavigate();
  const { setActiveAgent } = useAgentsStore();
  const { startNewConversation } = useChatStore();
  const colors = getAgentColors(agent.color as AgentColor);

  function handleClick() {
    startNewConversation();
    setActiveAgent(agent.id);
    navigate(`/agent/${agent.id}`);
  }

  const iconSize = size === 'sm' ? 18 : size === 'md' ? 22 : 26;

  return (
    <button
      onClick={handleClick}
      className={cn(
        'group text-left rounded-2xl border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        'bg-surface-900/80 hover:bg-surface-800/80',
        colors.border,
        size === 'sm' && 'p-3',
        size === 'md' && 'p-4',
        size === 'lg' && 'p-5'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            'rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110',
            colors.bgLight,
            colors.text,
            size === 'sm' && 'w-9 h-9',
            size === 'md' && 'w-11 h-11',
            size === 'lg' && 'w-12 h-12'
          )}
          aria-hidden="true"
        >
          <AgentIcon iconKey={agent.icon} size={iconSize} strokeWidth={1.75} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              'font-semibold text-white truncate',
              size === 'sm' && 'text-sm',
              size === 'md' && 'text-sm',
              size === 'lg' && 'text-base'
            )}
          >
            {agent.name}
          </h3>
          {size !== 'sm' && (
            <p
              className={cn(
                'text-slate-500 leading-snug line-clamp-2 mt-0.5',
                size === 'md' && 'text-xs',
                size === 'lg' && 'text-sm'
              )}
            >
              {agent.description}
            </p>
          )}
        </div>
      </div>

      {/* Start chat indicator */}
      <div
        className={cn(
          'mt-3 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity',
          colors.text
        )}
      >
        Start chat →
      </div>
    </button>
  );
}
