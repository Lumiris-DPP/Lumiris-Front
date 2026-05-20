'use client';

import { ShieldCheck } from 'lucide-react';
import { cn } from '@lumiris/ui/lib/cn';

interface GovernanceBannerProps {
    onOpenAuditLog?: () => void;
    className?: string;
}

export function GovernanceBanner({ onOpenAuditLog, className }: GovernanceBannerProps) {
    return (
        <div
            role="note"
            aria-label="Charte d'indépendance LUMIRIS"
            className={cn(
                'border-lumiris-emerald/30 bg-lumiris-emerald/5 text-lumiris-emerald flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs leading-relaxed',
                className,
            )}
        >
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <p className="flex-1">
                <strong className="font-semibold">Charte d&apos;indépendance.</strong> Les commissions
                n&apos;influencent jamais le tri Iris. ATELIER+ donne une visibilité prioritaire{' '}
                <strong>uniquement à score équivalent</strong>. Aucun acteur ne peut payer pour modifier son score.{' '}
                {onOpenAuditLog ? (
                    <button
                        type="button"
                        onClick={onOpenAuditLog}
                        className="hover:text-lumiris-emerald/80 underline underline-offset-2"
                    >
                        Voir le journal des overrides →
                    </button>
                ) : null}
            </p>
        </div>
    );
}
