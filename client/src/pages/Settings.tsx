import { useState } from 'react';
import { User, Palette, Lock, ChevronRight, Check } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { usersApi } from '../services/api';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import { cn } from '../utils/cn';

type Section = 'profile' | 'appearance' | 'security';

const THEMES = [
  { id: 'dark', label: 'Dark', description: 'Easy on the eyes' },
  { id: 'light', label: 'Light', description: 'Clean and bright' },
  { id: 'system', label: 'System', description: 'Follow OS preference' },
] as const;

export default function Settings() {
  const { user, setUser } = useAuthStore();
  const [section, setSection] = useState<Section>('profile');

  // Profile form state
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Theme
  const currentTheme = user?.preferences?.theme ?? 'dark';
  const [themeSaving, setThemeSaving] = useState(false);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) return;
    setProfileSaving(true);
    setProfileError('');
    setProfileSuccess(false);
    try {
      const updated = await usersApi.updateDisplayName(displayName.trim());
      setUser(updated);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    setPasswordSaving(true);
    try {
      await usersApi.updatePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to update password.');
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleThemeChange(theme: 'light' | 'dark' | 'system') {
    setThemeSaving(true);
    try {
      const updated = await usersApi.updatePreferences({ theme });
      setUser(updated);
    } catch {
      // silent
    } finally {
      setThemeSaving(false);
    }
  }

  const navItems: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Profile', icon: <User size={15} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={15} /> },
    { id: 'security', label: 'Security', icon: <Lock size={15} /> },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-white mb-8">Settings</h1>

        <div className="flex flex-col sm:flex-row gap-6">
          {/* Nav */}
          <nav aria-label="Settings sections" className="sm:w-48 flex-shrink-0">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setSection(item.id)}
                    aria-current={section === item.id ? 'page' : undefined}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                      section === item.id
                        ? 'bg-surface-800 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-surface-800/50'
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className={section === item.id ? 'text-brand-400' : 'text-slate-600'}>
                        {item.icon}
                      </span>
                      {item.label}
                    </span>
                    <ChevronRight
                      size={13}
                      className={cn(
                        'transition-opacity',
                        section === item.id ? 'opacity-100 text-slate-500' : 'opacity-0'
                      )}
                    />
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* ── Profile ─────────────────────────────────────────── */}
            {section === 'profile' && (
              <div className="glass rounded-2xl p-6">
                <h2 className="text-base font-semibold text-white mb-6">Profile</h2>

                {user && (
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-surface-700/40">
                    <Avatar name={user.displayName} size="lg" />
                    <div>
                      <p className="font-semibold text-white">{user.displayName}</p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label htmlFor="displayName" className="block text-xs font-medium text-slate-400 mb-1.5">
                      Display name
                    </label>
                    <input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  {profileError && <p className="text-xs text-red-400">{profileError}</p>}

                  <div className="flex items-center gap-3">
                    <Button type="submit" isLoading={profileSaving} size="sm">
                      Save changes
                    </Button>
                    {profileSuccess && (
                      <span className="flex items-center gap-1 text-xs text-green-400">
                        <Check size={13} /> Saved
                      </span>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* ── Appearance ──────────────────────────────────────── */}
            {section === 'appearance' && (
              <div className="glass rounded-2xl p-6">
                <h2 className="text-base font-semibold text-white mb-6">Appearance</h2>

                <div>
                  <p className="text-xs font-medium text-slate-400 mb-3">Theme</p>
                  <div className="grid grid-cols-3 gap-3">
                    {THEMES.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => handleThemeChange(theme.id)}
                        disabled={themeSaving}
                        aria-pressed={currentTheme === theme.id}
                        className={cn(
                          'relative p-3 rounded-xl border text-left transition-all',
                          currentTheme === theme.id
                            ? 'border-brand-500/60 bg-brand-500/10'
                            : 'border-surface-700/60 bg-surface-800/40 hover:border-surface-600'
                        )}
                      >
                        {currentTheme === theme.id && (
                          <span className="absolute top-2 right-2">
                            <Check size={12} className="text-brand-400" />
                          </span>
                        )}
                        <p className="text-sm font-medium text-white">{theme.label}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{theme.description}</p>
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-3">
                    Theme preference is saved to your account.
                  </p>
                </div>
              </div>
            )}

            {/* ── Security ────────────────────────────────────────── */}
            {section === 'security' && (
              <div className="glass rounded-2xl p-6">
                <h2 className="text-base font-semibold text-white mb-6">Change password</h2>

                <form onSubmit={handleSavePassword} className="space-y-4">
                  <div>
                    <label htmlFor="currentPassword" className="block text-xs font-medium text-slate-400 mb-1.5">
                      Current password
                    </label>
                    <input
                      id="currentPassword"
                      type="password"
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="block text-xs font-medium text-slate-400 mb-1.5">
                      New password
                    </label>
                    <input
                      id="newPassword"
                      type="password"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-xs font-medium text-slate-400 mb-1.5">
                      Confirm new password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  {passwordError && <p className="text-xs text-red-400">{passwordError}</p>}

                  <div className="flex items-center gap-3">
                    <Button type="submit" isLoading={passwordSaving} size="sm">
                      Update password
                    </Button>
                    {passwordSuccess && (
                      <span className="flex items-center gap-1 text-xs text-green-400">
                        <Check size={13} /> Updated
                      </span>
                    )}
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  'w-full bg-surface-800/60 border border-surface-700/60 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition-all focus:border-brand-500/60';
