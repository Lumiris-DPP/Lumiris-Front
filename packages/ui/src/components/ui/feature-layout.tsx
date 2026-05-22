import * as React from 'react';

import { cn } from '../../lib/cn';

interface FeatureLayoutProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
    tabs?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

function FeatureLayout({ title, description, actions, tabs, children, className }: FeatureLayoutProps) {
    return (
        <div data-slot="feature-layout" className={cn('flex flex-col gap-6', className)}>
            <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-foreground text-2xl font-medium tracking-tight">{title}</h1>
                    {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
                </div>
                {actions ? <div className="flex flex-wrap items-center gap-2 md:shrink-0">{actions}</div> : null}
            </header>
            {tabs ? <div>{tabs}</div> : null}
            <div>{children}</div>
        </div>
    );
}

export { FeatureLayout };
export type { FeatureLayoutProps };
