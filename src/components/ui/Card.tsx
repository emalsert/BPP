import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/15 bg-white/10 shadow-lg shadow-black/10 backdrop-blur-xl',
        className,
      )}
      {...props}
    />
  );
}
