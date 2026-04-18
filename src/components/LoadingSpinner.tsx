'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export default function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-4',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex flex-col items-center gap-4" role="status" aria-label={text || 'Loading'}>
      <div
        className={`${sizeClasses[size]} border-ink border-t-transparent rounded-full animate-spin`}
        aria-hidden="true"
      />
      {text && <p className="font-mono font-bold text-sm">{text}</p>}
    </div>
  );
}
