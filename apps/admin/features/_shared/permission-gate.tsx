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
        <div className="border-border bg-muted/30 mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-12 text-center">
            <ShieldAlert className="text-muted-foreground h-8 w-8" aria-hidden />
            <div>
                <h2 className="text-foreground text-base font-semibold">Accès non autorisé</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                    Votre rôle ne permet pas d&apos;accéder à ce module.
                </p>
                <p className="text-muted-foreground/70 mt-3 font-mono text-[11px]">
                    Permission requise : <span className="text-foreground">{requires}</span>
                </p>
            </div>
        </div>
    );
}
