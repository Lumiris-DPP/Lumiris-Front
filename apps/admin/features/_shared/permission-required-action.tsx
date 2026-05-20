'use client';

import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import type { AdminAction } from '@lumiris/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@lumiris/ui/components/tooltip';
import { usePermission } from '@/lib/auth';

interface PermissionRequiredActionProps {
    requires: AdminAction;
    children: ReactNode;
    deniedMessage?: string;
}

interface ChildProps {
    disabled?: boolean;
    'aria-disabled'?: boolean | 'true' | 'false';
    'aria-label'?: string;
}

export function PermissionRequiredAction({ requires, children, deniedMessage }: PermissionRequiredActionProps) {
    const allowed = usePermission(requires);

    if (!isValidElement(children)) {
        return <>{children}</>;
    }

    const element = children as ReactElement<ChildProps>;

    if (allowed) {
        return element;
    }

    const message = deniedMessage ?? `Permission requise : ${requires}`;
    const merged = cloneElement<ChildProps>(element, {
        disabled: true,
        'aria-disabled': true,
        'aria-label': element.props['aria-label'] ?? message,
    });

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="inline-flex">{merged}</span>
                </TooltipTrigger>
                <TooltipContent side="top">{message}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
