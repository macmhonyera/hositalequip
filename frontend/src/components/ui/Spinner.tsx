import { cn } from '@/lib/utils';

type Size = 'sm' | 'md' | 'lg' | 'xl';

interface SpinnerProps {
  size?: Size;
  className?: string;
}

const sizeMap: Record<Size, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-[3px]',
  xl: 'w-12 h-12 border-4',
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      className={cn(
        'rounded-full border-current border-r-transparent animate-spin',
        sizeMap[size],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
}
