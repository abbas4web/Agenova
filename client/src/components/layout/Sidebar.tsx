import { useEffect } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { Plus, Sparkles, X, Settings } from 'lucide-react';
import { useAgentsStore } from '../../store/agentsStore';
import { useChatStore } from '../../store/chatStore';
import { getAgentColors } from '../../utils/agentColors';
import type { AgentColor } from '../../types';
import { cn } from '../../utils/cn';
import Spinner from '../common/Spinner';
import AgentIcon from '../common/AgentIcon';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { agents, isLoading: agentsLoading, fetchAgents, setActiveAgent } = useAgentsStore();
  const { startNewConversation } = useChatStore();
  const navigate = useNavigate();
  const { agentId } = useParams<{ agentId?: string }>();

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  function handleNewChat(selectedAgentId: string) {
    startNewConversation();
    setActiveAgent(selectedAgentId);
    navigate(`/agent/${selectedAgentId}`);
    onClose();
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        aria-label="Navigation sidebar"
        className={cn(
          'fixed top-0 left-0 h-full w-64 bg-surface-900 border-r border-surface-800/60 z-40',
          'flex flex-col transition-transform duration-300 ease-in-out',
          'lg:relative lg:translate-x-0 lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo + close */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-surface-800/60 flex-shrink-0">
          <NavLink to="/" onClick={onClose} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Sparkles size={14} className="text-white" />
            </div>
            <span className="font-bold text-white text-sm">Agentora</span>
          </NavLink>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-surface-800 transition-colors lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Agent list — scrollable */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-3">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2">
            Agents
          </p>

          {agentsLoading ? (
            <div className="flex justify-center py-4">
              <Spinner size="sm" />
            </div>
          ) : (
            <nav aria-label="Agent list">
              {agents.map((agent) => {
                const colors = getAgentColors(agent.color as AgentColor);
                const isActive = agentId === agent.id;

                return (
                  <button
                    key={agent.id}
                    onClick={() => handleNewChat(agent.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group',
                      isActive
                        ? `${colors.bgLight} ${colors.text} ${colors.border} border`
                        : 'text-slate-400 hover:text-white hover:bg-surface-800/60'
                    )}
                  >
                    <div
                      className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                        isActive ? colors.bgLight : 'bg-surface-800/60',
                        isActive ? colors.text : 'text-slate-500 group-hover:text-slate-300'
                      )}
                      aria-hidden="true"
                    >
                      <AgentIcon iconKey={agent.icon} size={14} strokeWidth={1.75} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-sm font-medium truncate',
                          isActive ? colors.text : 'text-slate-300 group-hover:text-white'
                        )}
                      >
                        {agent.name}
                      </p>
                    </div>

                    <Plus
                      size={14}
                      className={cn(
                        'flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity',
                        isActive ? colors.text : 'text-slate-500'
                      )}
                    />
                  </button>
                );
              })}
            </nav>
          )}
        </div>

        {/* Bottom: Settings only */}
        <div className="border-t border-surface-800/40 flex-shrink-0 p-3">
          <button
            onClick={() => { navigate('/settings'); onClose(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-slate-400 hover:text-white hover:bg-surface-800/60 transition-all group"
          >
            <div className="w-7 h-7 rounded-lg bg-surface-800/60 flex items-center justify-center flex-shrink-0 text-slate-500 group-hover:text-slate-300">
              <Settings size={14} />
            </div>
            <span className="text-sm font-medium">Settings</span>
          </button>
        </div>
      </aside>
    </>
  );
}
