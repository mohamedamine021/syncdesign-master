import { ReactNode } from 'react';

interface StepLayoutProps {
  title: string;
  stepNumber: number;
  description?: string;
  children: ReactNode;
}

export function StepLayout({ title, stepNumber, description, children }: StepLayoutProps) {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-1">
          <span className="step-badge-active">{stepNumber}</span>
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground mb-6 ml-10">{description}</p>
        )}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
