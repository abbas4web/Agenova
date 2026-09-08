import { cn } from '../../utils/cn';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

// Deterministic colour from name
const COLOURS = [
  'from-indigo-500 to-purple-600',
  'from-pink-500 to-rose-600',
  'from-green-500 to-teal-600',
  'from-sky-500 to-blue-600',
  'from-orange-500 to-amber-600',
  'from-violet-500 to-purple-600',
];

function getColour(name: string): string {
  const idx =
    name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % COLOURS.length;
  return COLOURS[idx] ?? COLOURS[0]!;
}

export default function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <div
      aria-label={name}
      className={cn(
        'rounded-full bg-gradient-to-br flex items-center justify-center font-semibold text-white flex-shrink-0 select-none',
        getColour(name),
        sizeMap[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}
