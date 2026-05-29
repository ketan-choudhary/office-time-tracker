import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

export function Card({ children, className = '', title, subtitle }: CardProps) {
  return (
    <div className={`card animate-fade-in ${className}`}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-base font-semibold text-text-primary">{title}</h3>}
          {subtitle && <p className="mt-0.5 text-sm text-text-secondary">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
