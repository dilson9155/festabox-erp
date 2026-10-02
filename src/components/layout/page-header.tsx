import * as React from 'react';
import { cn } from '@/lib/utils';

export function PageHeader({ title, description, actions, children, className }: { title: string; description?: string; actions?: React.ReactNode; children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-3 mb-6 md:flex-row md:items-center md:justify-between', className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {(actions || children) && <div className="flex items-center gap-2">{actions}{children}</div>}
    </div>
  );
}