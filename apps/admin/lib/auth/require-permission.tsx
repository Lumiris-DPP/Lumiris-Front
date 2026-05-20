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
        <div className="border-border bg-muted/30 text-muted-foreground flex items-center gap-3 rounded-xl border border-dashed p-6 text-sm">
            <LockKeyhole className="h-4 w-4 shrink-0" aria-hidden />
            <div>
                <p className="text-foreground font-medium">Accès restreint</p>
                <p className="mt-0.5 text-xs">
                    Permission requise : <code className="font-mono text-[11px]">{action}</code>
                </p>
            </div>
        </div>
    );
}
