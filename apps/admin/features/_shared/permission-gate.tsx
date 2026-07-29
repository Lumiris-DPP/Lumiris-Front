'use client';

import type { ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';
import type { AdminAction } from '@lumiris/types';
import { usePermission } from '@/lib/auth';

interface PermissionGateProps {
    requires: AdminAction;
    children: ReactNode;
}

export function PermissionGate({ requires, children }: PermissionGateProps) {
    const allowed = usePermission(requires);
    if (allowed) return <>{children}</>;

    return (
        <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
            <ShieldAlert className="h-8 w-8 text-muted-foreground" aria-hidden />
            <div>
                <h2 className="text-base font-semibold text-foreground">Accès non autorisé</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Votre rôle ne permet pas d&apos;accéder à ce module.
                </p>
                <p className="mt-3 font-mono text-[11px] text-muted-foreground/70">
                    Permission requise : <span className="text-foreground">{requires}</span>
                </p>
            </div>
        </div>
    );
}
