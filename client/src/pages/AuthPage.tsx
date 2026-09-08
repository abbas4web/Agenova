import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import Button from '../components/common/Button';
import { cn } from '../utils/cn';

type Mode = 'login' | 'register';

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  const { login, register, isLoading, isAuthenticated, clearError } = useAuthStore();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  function switchMode(m: Mode) {
    setMode(m);
    setFormError('');
    clearError();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    // Basic client-side validation
    if (!email || !password) {
      setFormError('Email and password are required.');
      return;
    }
    if (mode === 'register' && !displayName.trim()) {
      setFormError('Display name is required.');
      return;
    }
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, displayName);
      }
      navigate('/', { replace: true });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
      {/* Background glow */}
      <div
        aria-hidden="true"
        className="fixed inset-0 overflow-hidden pointer-events-none"
      >
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-900/50">
            <Sparkles size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Agentora</h1>
          <p className="text-sm text-slate-500 mt-1">One Platform. Many AI Agents.</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-6 shadow-2xl shadow-black/50">
          {/* Tab toggle */}
          <div className="flex bg-surface-800/60 rounded-xl p-1 mb-6">
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={cn(
                  'flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-150',
                  mode === m
                    ? 'bg-surface-700 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                )}
              >
                {m === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Display name (register only) */}
            {mode === 'register' && (
              <div>
                <label htmlFor="displayName" className="block text-xs font-medium text-slate-400 mb-1.5">
                  Display name
                </label>
                <input
                  id="displayName"
                  type="text"
                  autoComplete="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className={inputClass}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-400 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={cn(inputClass, 'pr-10')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {formError && (
              <p role="alert" className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {formError}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-2"
            >
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
            className="text-brand-400 hover:text-brand-300 transition-colors font-medium"
          >
            {mode === 'login' ? 'Create one' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}

const inputClass =
  'w-full bg-surface-800/60 border border-surface-700/60 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition-all focus:border-brand-500/60 focus:bg-surface-800';
