'use client';

import type { ReactNode } from 'react';
import { LockKeyhole } from 'lucide-react';
import type { AdminAction } from '@lumiris/types';
import { usePermission } from './permissions';

interface RequirePermissionProps {
    action: AdminAction;
    children: ReactNode;
    fallback?: ReactNode;
}

export function RequirePermission({ action, children, fallback }: RequirePermissionProps) {
    const allowed = usePermission(action);
    if (allowed) return <>{children}</>;
    if (fallback !== undefined) return <>{fallback}</>;

    return (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
            <LockKeyhole className="h-4 w-4 shrink-0" aria-hidden />
            <div>
                <p className="font-medium text-foreground">Accès restreint</p>
                <p className="mt-0.5 text-xs">
                    Permission requise : <code className="font-mono text-[11px]">{action}</code>
                </p>
            </div>
        </div>
    );
}
