import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Zap } from 'lucide-react';
import { useAgentsStore } from '../store/agentsStore';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import AgentCard from '../components/chat/AgentCard';
import Spinner from '../components/common/Spinner';
import { cn } from '../utils/cn';

const SUGGESTED_PROMPTS = [
  { text: 'Plan a 7-day trip to Japan', agentId: 'travel' },
  { text: 'Build me a beginner workout plan', agentId: 'fitness' },
  { text: 'Recommend a laptop under $1000', agentId: 'technology' },
  { text: 'Help me rewrite my resume', agentId: 'career' },
  { text: 'Best skincare routine for oily skin', agentId: 'skincare' },
  { text: 'Learn Python from scratch', agentId: 'education' },
  { text: 'What are the best EVs in 2024?', agentId: 'automobile' },
  { text: 'Give me a high-protein meal plan', agentId: 'food' },
];

export default function Home() {
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { agents, isLoading, fetchAgents, setActiveAgent } = useAgentsStore();
  const { user } = useAuthStore();
  const { sendMessage, startNewConversation } = useChatStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAgents();
    setActiveAgent(null);
  }, [fetchAgents, setActiveAgent]);

  async function handleSend(message: string, agentId?: string) {
    if (!message.trim() || isSending) return;
    setIsSending(true);
    startNewConversation();

    try {
      // Use askAnything agent when sending from the home "Ask Anything" bar
      const targetAgentId = agentId ?? 'askAnything';
      setActiveAgent(targetAgentId);

      const result = await sendMessage(message, targetAgentId, undefined);
      navigate(`/agent/${result.agentId}/conversation/${result.conversationId}`);
    } catch {
      setIsSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSend(inputValue);
  }

  const greeting = user
    ? `Welcome back, ${user.displayName.split(' ')[0]}`
    : 'Welcome to Agentora';

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div
            aria-hidden="true"
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center mx-auto mb-5 shadow-xl shadow-brand-900/40"
          >
            <Sparkles size={28} className="text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">{greeting}</h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto">
            Ask anything or pick a specialised agent below. The right expert is always one click away.
          </p>
        </div>

        {/* Global ask-anything input */}
        <div className="mb-10">
          <div
            className={cn(
              'flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-all duration-200',
              'bg-surface-900 border-surface-700/60',
              'focus-within:border-brand-500/60 focus-within:shadow-lg focus-within:shadow-brand-900/20'
            )}
          >
            <Zap size={18} className="text-brand-500 flex-shrink-0" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything — the right agent will answer…"
              disabled={isSending}
              aria-label="Ask anything input"
              className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-600 outline-none disabled:opacity-50"
            />
            <button
              onClick={() => handleSend(inputValue)}
              disabled={!inputValue.trim() || isSending}
              aria-label="Send"
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
                inputValue.trim() && !isSending
                  ? 'bg-brand-600 hover:bg-brand-500 text-white'
                  : 'bg-surface-800 text-slate-600 cursor-not-allowed'
              )}
            >
              {isSending ? (
                <Spinner size="sm" />
              ) : (
                <>
                  Ask <ArrowRight size={12} />
                </>
              )}
            </button>
          </div>

          {/* Suggested prompts */}
          <div className="flex flex-wrap gap-2 mt-3">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt.text}
                onClick={() => handleSend(prompt.text, prompt.agentId)}
                disabled={isSending}
                className="text-xs px-3 py-1.5 rounded-lg bg-surface-800/60 border border-surface-700/40 text-slate-400 hover:text-white hover:border-surface-600 transition-all disabled:opacity-50"
              >
                {prompt.text}
              </button>
            ))}
          </div>
        </div>

        {/* Agent grid */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Choose an Agent
          </h2>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} size="md" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
