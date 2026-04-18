import type { ButtonHTMLAttributes } from 'react';

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
}

export default function PrimaryButton({
  children,
  fullWidth = false,
  className = '',
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      {...props}
      className={`
        bg-brand-600
        hover:bg-brand-500
        text-white
        font-bold
        rounded-xl
        py-3
        px-8
        shadow-lg shadow-brand-500/25
        transition-all
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {children}
    </button>
  );
}
