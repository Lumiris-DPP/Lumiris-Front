'use client';

import Link from 'next/link';
import { ExternalLink, History } from 'lucide-react';
import type { AdminAuditLogEntry } from '@lumiris/types';
import { DetailDrawer } from '@lumiris/ui/components/detail-drawer';
import { cn } from '@lumiris/ui/lib/cn';
import { ROLE_TONE } from '@/features/_shared/action-status';

interface DetailSheetProps {
    entry: AdminAuditLogEntry | null;
    onClose: () => void;
}

const TARGET_ROUTE: Record<string, { path: string; label: string }> = {
    passport: { path: '/passeports', label: 'Voir le passeport' },
    artisan: { path: '/artisans', label: "Voir l'artisan" },
    retoucheur: { path: '/reseau?tab=retoucheurs', label: 'Voir le retoucheur' },
    vision_user: { path: '/reseau?tab=users', label: 'Voir l’utilisateur VISION' },
    anomaly: { path: '/signaux', label: "Voir l'anomalie" },
};

export function DetailSheet({ entry, onClose }: DetailSheetProps) {
    return (
        <DetailDrawer
            open={entry !== null}
            onOpenChange={(open) => !open && onClose()}
            title={entry?.action ?? ''}
            subtitle={entry ? new Date(entry.ts).toLocaleString('fr-FR') : ''}
            width="md"
            tabs={
                entry
                    ? [
                          { value: 'detail', label: 'Détail', content: <DetailSection entry={entry} /> },
                          { value: 'payload', label: 'Payload brut', content: <PayloadSection entry={entry} /> },
                      ]
                    : []
            }
        />
    );
}

function DetailSection({ entry }: { entry: AdminAuditLogEntry }) {
    const target = TARGET_ROUTE[entry.targetType];
    return (
        <div className="space-y-3 text-xs">
            <Field label="Acteur">
                <p className="text-foreground">
                    {entry.actorId}{' '}
                    <span className={cn('font-mono', ROLE_TONE[entry.actorRole])}>({entry.actorRole})</span>
                </p>
            </Field>
            <Field label="Cible">
                <p className="text-foreground font-mono">
                    {entry.targetType} / {entry.targetId}
                </p>
            </Field>
            <Field label="IP (mock)">
                <p className="text-foreground font-mono">{entry.ipMock ?? '-'}</p>
            </Field>
            {target ? (
                <Link
                    href={`${target.path}?focus=${entry.targetId}`}
                    className="text-lumiris-cyan hover:text-lumiris-cyan/80 inline-flex items-center gap-1 text-xs"
                >
                    <ExternalLink className="h-3 w-3" aria-hidden /> {target.label}
                </Link>
            ) : null}
            <p className="text-muted-foreground/70 inline-flex items-center gap-1 font-mono text-[10px]">
                <History className="h-3 w-3" /> id {entry.id}
            </p>
        </div>
    );
}

function PayloadSection({ entry }: { entry: AdminAuditLogEntry }) {
    return (
        <pre className="text-foreground bg-muted/40 overflow-auto whitespace-pre rounded-lg p-3 font-mono text-[11px]">
            {JSON.stringify(entry.payload, null, 2)}
        </pre>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wider">{label}</p>
            <div className="text-foreground mt-1">{children}</div>
        </div>
    );
}
