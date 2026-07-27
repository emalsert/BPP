import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const fieldClasses =
  'min-h-11 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/50 outline-none focus:border-white/50';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClasses, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldClasses, 'min-h-20 resize-y', className)} {...props} />;
}
