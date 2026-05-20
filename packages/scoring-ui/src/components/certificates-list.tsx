'use client';

import type { HTMLAttributes } from 'react';
import { ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import { getEffectiveStatus } from '@lumiris/types';
import type { Certificate } from '@lumiris/types';
import { cn } from '@lumiris/ui/lib/cn';

export interface CertificatesListProps extends HTMLAttributes<HTMLDivElement> {
    certificates: readonly Certificate[];
    now: Date;
}

export function CertificatesList({ certificates, now, className, ...rest }: CertificatesListProps) {
    if (certificates.length === 0) {
        return (
            <p className={cn('text-muted-foreground text-sm', className as string)} {...rest}>
                Aucune certification renseignée.
            </p>
        );
    }
    return (
        <div className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2', className)} {...rest}>
            {certificates.map((cert) => {
                const status = getEffectiveStatus(cert, now);
                const expired = status === 'Expired';
                const unverified = status === 'Unverified';
                const Icon = expired ? ShieldX : unverified ? ShieldAlert : ShieldCheck;
                const tone = expired
                    ? 'border-lumiris-rose/30 bg-lumiris-rose/5 text-foreground/80 grayscale-[40%]'
                    : unverified
                      ? 'border-lumiris-amber/30 bg-lumiris-amber/5'
                      : 'border-lumiris-emerald/30 bg-lumiris-emerald/5';
                const iconTone = expired
                    ? 'text-lumiris-rose'
                    : unverified
                      ? 'text-lumiris-amber'
                      : 'text-lumiris-emerald';
                return (
                    <article
                        key={cert.id}
                        className={cn('flex flex-col gap-2 rounded-2xl border p-4 transition', tone)}
                    >
                        <header className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="text-foreground truncate text-sm font-semibold">
                                    {cert.kind === 'CUSTOM' && cert.customName ? cert.customName : cert.kind}
                                </p>
                                <p className="text-muted-foreground truncate text-xs">{cert.issuer}</p>
                            </div>
                            <Icon className={cn('h-5 w-5 shrink-0', iconTone)} aria-hidden />
                        </header>
                        <p className="text-muted-foreground/90 text-[11px]">
                            Délivrée le {formatDate(cert.issuedAt)} · {expired ? 'Expirée le ' : "Valide jusqu'au "}
                            {formatDate(cert.expiresAt)}
                        </p>
                        {cert.scope ? <p className="text-foreground/80 text-xs leading-relaxed">{cert.scope}</p> : null}
                        {cert.fileUrl ? (
                            <a
                                href={cert.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-foreground/70 hover:text-foreground inline-flex items-center font-mono text-[10px] underline underline-offset-2"
                            >
                                Document officiel ↗
                            </a>
                        ) : null}
                    </article>
                );
            })}
        </div>
    );
}

function formatDate(iso: string): string {
    const date = new Date(iso);
    if (!Number.isFinite(date.getTime())) return iso;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}
