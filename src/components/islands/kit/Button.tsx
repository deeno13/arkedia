import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'paper';
export type ButtonSize = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'border-2 border-ink bg-ink text-paper hover:bg-game hover:text-on-game',
  secondary: 'border-2 border-ink bg-transparent text-ink hover:bg-paper-deep',
  quiet: 'border-2 border-transparent text-ink-soft underline decoration-rule hover:text-ink hover:decoration-ink',
  /** For actions placed on a solid ink or game-ink strip (e.g. the result strip). */
  paper: 'border-2 border-paper bg-paper text-ink hover:border-paper-deep hover:bg-paper-deep',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 text-sm pointer-coarse:min-h-11',
  md: 'min-h-11 px-4 text-base pointer-coarse:min-h-12',
};

/** Arkedia's game control button. Use `primary` for the one main action (New game). */
export function Button({ variant = 'secondary', size = 'md', className = '', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        'inline-flex select-none items-center justify-center gap-2 rounded-die font-semibold font-stretch-semi-expanded transition-colors duration-150',
        'disabled:cursor-not-allowed disabled:opacity-45',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      ].join(' ')}
      {...props}
    />
  );
}
