/**
 * Simple class name utility — merges conditional class strings.
 * Avoids adding a full clsx/classnames dependency for the MVP.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
