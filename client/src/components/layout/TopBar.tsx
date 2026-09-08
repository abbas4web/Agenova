import { Menu, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useAgentsStore } from '../../store/agentsStore';
import Avatar from '../common/Avatar';
import { cn } from '../../utils/cn';

interface TopBarProps {
  onMenuClick: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const { user, logout } = useAuthStore();
  const { activeAgentId, getAgent } = useAgentsStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeAgent = activeAgentId ? getAgent(activeAgentId) : null;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleLogout() {
    logout();
    navigate('/auth');
  }

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-surface-800/60 bg-surface-950/80 backdrop-blur-sm flex-shrink-0">
      {/* Left: hamburger + current agent */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Toggle sidebar"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surface-800 transition-colors lg:hidden"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-2">
          {activeAgent ? (
            <>
              <span className="text-xl leading-none" aria-hidden="true">
                {activeAgent.icon}
              </span>
              <span className="font-semibold text-sm text-white hidden sm:block">
                {activeAgent.name}
              </span>
            </>
          ) : (
            <span className="font-bold text-base bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">
              Agentora
            </span>
          )}
        </div>
      </div>

      {/* Right: user menu */}
      {user && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-surface-800 transition-colors"
          >
            <Avatar name={user.displayName} size="sm" />
            <span className="text-sm text-slate-300 hidden sm:block max-w-[120px] truncate">
              {user.displayName}
            </span>
            <ChevronDown
              size={14}
              className={cn(
                'text-slate-500 transition-transform duration-150',
                dropdownOpen && 'rotate-180'
              )}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 glass rounded-xl shadow-xl shadow-black/40 z-50 py-1 animate-fade-in">
              <div className="px-3 py-2 border-b border-surface-700/60">
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>

              <button
                onClick={() => { navigate('/settings'); setDropdownOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-surface-700/50 transition-colors"
              >
                <Settings size={14} className="text-slate-500" />
                Settings
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
