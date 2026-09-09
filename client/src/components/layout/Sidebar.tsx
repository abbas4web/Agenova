import { useEffect } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { Plus, Sparkles, MessageSquare, Trash2, X, Settings } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAgentsStore } from '../../store/agentsStore';
import { useChatStore } from '../../store/chatStore';
import { getAgentColors } from '../../utils/agentColors';
import type { AgentColor } from '../../types';
import { cn } from '../../utils/cn';
import Spinner from '../common/Spinner';
import AgentIcon from '../common/AgentIcon';
import Avatar from '../common/Avatar';
import { formatDistanceToNow } from 'date-fns';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { agents, isLoading: agentsLoading, fetchAgents, setActiveAgent } = useAgentsStore();
  const { conversations, fetchConversations, deleteConversation, startNewConversation } =
    useChatStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { agentId } = useParams<{ agentId?: string }>();

  useEffect(() => {
    fetchAgents();
    fetchConversations();
  }, [fetchAgents, fetchConversations]);

  function handleNewChat(selectedAgentId: string) {
    startNewConversation();
    setActiveAgent(selectedAgentId);
    navigate(`/agent/${selectedAgentId}`);
    onClose();
  }

  function handleConversationClick(convAgentId: string, conversationId: string) {
    setActiveAgent(convAgentId);
    navigate(`/agent/${convAgentId}/conversation/${conversationId}`);
    onClose();
  }

  async function handleDelete(e: React.MouseEvent, conversationId: string) {
    e.preventDefault();
    e.stopPropagation();
    await deleteConversation(conversationId);
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
          'fixed top-0 left-0 h-full w-72 bg-surface-900 border-r border-surface-800/60 z-40',
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

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {/* Agents section */}
          <div className="p-3">
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
                      {/* Agent icon */}
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

          {/* Recent conversations */}
          {conversations.length > 0 && (
            <div className="p-3 border-t border-surface-800/40">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2">
                Recent
              </p>

              <nav aria-label="Recent conversations">
                {conversations.slice(0, 20).map((conv) => {
                  const agent = agents.find((a) => a.id === conv.agentId);
                  const colors = agent ? getAgentColors(agent.color as AgentColor) : null;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleConversationClick(conv.agentId, conv.id)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left group hover:bg-surface-800/60 transition-colors"
                    >
                      {/* Small agent icon instead of emoji */}
                      <div
                        className={cn(
                          'w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0',
                          colors?.bgLight ?? 'bg-surface-800',
                          colors?.text ?? 'text-slate-500'
                        )}
                        aria-hidden="true"
                      >
                        {agent ? (
                          <AgentIcon iconKey={agent.icon} size={11} strokeWidth={2} />
                        ) : (
                          <MessageSquare size={11} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-400 group-hover:text-slate-200 truncate transition-colors">
                          {conv.title}
                        </p>
                        <p className="text-[10px] text-slate-600 mt-0.5">
                          {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true })}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDelete(e, conv.id)}
                        aria-label={`Delete conversation: ${conv.title}`}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </button>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        {/* Bottom: Settings + user info */}
        <div className="border-t border-surface-800/40 flex-shrink-0">
          {/* Settings link */}
          <div className="p-3">
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

          {/* User info */}
          {user && (
            <div className="px-4 pb-4 pt-1">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-800/40 border border-surface-700/30">
                <Avatar name={user.displayName} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{user.displayName}</p>
                  <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
