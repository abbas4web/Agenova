import { useState } from 'react';
import { Flower2, ChevronRight, X } from 'lucide-react';
import { cn } from '../../utils/cn';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SkinProfile {
  skinType: string;
  routine: string;
  diet: string;
}

interface SkinProfileFormProps {
  onSubmit: (profile: SkinProfile) => void;
  onSkip: () => void;
  isLoading?: boolean;
}

// ── Skin type options ─────────────────────────────────────────────────────────

const SKIN_TYPES = [
  { value: 'oily', label: 'Oily', emoji: '💧' },
  { value: 'dry', label: 'Dry', emoji: '🏜️' },
  { value: 'combination', label: 'Combination', emoji: '☯️' },
  { value: 'normal', label: 'Normal', emoji: '✨' },
  { value: 'sensitive', label: 'Sensitive', emoji: '🌸' },
  { value: 'not_sure', label: "Not sure", emoji: '🤷' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function SkinProfileForm({
  onSubmit,
  onSkip,
  isLoading,
}: SkinProfileFormProps) {
  const [skinType, setSkinType] = useState('');
  const [routine, setRoutine] = useState('');
  const [diet, setDiet] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!skinType) return;
    onSubmit({ skinType, routine, diet });
  }

  const canSubmit = !!skinType && !isLoading;

  return (
    <div className="px-4 pb-2">
      <div
        className={cn(
          'rounded-2xl border border-rose-500/25 bg-rose-950/20 overflow-hidden',
          'shadow-lg shadow-rose-950/20 animate-slide-up'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-rose-500/15">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center">
              <Flower2 size={14} className="text-rose-400" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100 leading-tight">
                Quick skin profile
              </p>
              <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                Helps Derma give you personalised advice
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onSkip}
            disabled={isLoading}
            aria-label="Skip skin profile"
            className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-400 hover:bg-surface-800 transition-colors"
          >
            <X size={13} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 pt-3 pb-4 space-y-4">
          {/* Skin type */}
          <fieldset>
            <legend className="text-xs font-medium text-slate-400 mb-2">
              What's your skin type?
              <span className="text-rose-400 ml-0.5">*</span>
            </legend>
            <div className="grid grid-cols-3 gap-1.5">
              {SKIN_TYPES.map(({ value, label, emoji }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSkinType(value)}
                  disabled={isLoading}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-medium transition-all duration-150',
                    skinType === value
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                      : 'bg-surface-800/60 border-surface-700/50 text-slate-400 hover:border-rose-500/30 hover:text-slate-300'
                  )}
                >
                  <span aria-hidden="true">{emoji}</span>
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Daily routine */}
          <div>
            <label
              htmlFor="derma-routine"
              className="block text-xs font-medium text-slate-400 mb-1.5"
            >
              Daily skincare routine / products used
              <span className="text-slate-600 font-normal ml-1">(optional)</span>
            </label>
            <textarea
              id="derma-routine"
              value={routine}
              onChange={(e) => setRoutine(e.target.value)}
              disabled={isLoading}
              rows={2}
              placeholder="e.g. CeraVe cleanser morning + evening, SPF 50 daily, tretinoin 0.025% at night…"
              className={cn(
                'w-full resize-none rounded-xl border bg-surface-800/60 px-3 py-2.5',
                'text-xs text-slate-200 placeholder-slate-600 leading-relaxed',
                'border-surface-700/50 focus:border-rose-500/40 focus:bg-surface-800',
                'outline-none transition-colors duration-150',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            />
          </div>

          {/* Diet */}
          <div>
            <label
              htmlFor="derma-diet"
              className="block text-xs font-medium text-slate-400 mb-1.5"
            >
              Diet / what you typically eat
              <span className="text-slate-600 font-normal ml-1">(optional)</span>
            </label>
            <textarea
              id="derma-diet"
              value={diet}
              onChange={(e) => setDiet(e.target.value)}
              disabled={isLoading}
              rows={2}
              placeholder="e.g. mostly plant-based, drink lots of water, occasional dairy and sugar…"
              className={cn(
                'w-full resize-none rounded-xl border bg-surface-800/60 px-3 py-2.5',
                'text-xs text-slate-200 placeholder-slate-600 leading-relaxed',
                'border-surface-700/50 focus:border-rose-500/40 focus:bg-surface-800',
                'outline-none transition-colors duration-150',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={onSkip}
              disabled={isLoading}
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
            >
              Skip for now
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-150',
                canSubmit
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm shadow-rose-900/40'
                  : 'bg-surface-800 text-slate-600 cursor-not-allowed'
              )}
            >
              Send to Derma
              <ChevronRight size={12} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
