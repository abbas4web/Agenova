import { cn } from '../../utils/cn';
import Spinner from './Spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
}

const variantMap = {
  primary:
    'bg-brand-600 hover:bg-brand-500 text-white border border-brand-500/30 shadow-sm shadow-brand-900/50',
  secondary:
    'bg-surface-800 hover:bg-surface-700 text-slate-200 border border-surface-700/60',
  ghost:
    'bg-transparent hover:bg-surface-800 text-slate-300 hover:text-white border border-transparent',
  danger:
    'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30',
};

const sizeMap = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-xl gap-2',
  lg: 'px-5 py-2.5 text-base rounded-xl gap-2',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading,
  leftIcon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-950',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantMap[variant],
        sizeMap[size],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <Spinner size="sm" />
      ) : leftIcon ? (
        <span className="flex-shrink-0">{leftIcon}</span>
      ) : null}
      {children}
    </button>
  );
}
