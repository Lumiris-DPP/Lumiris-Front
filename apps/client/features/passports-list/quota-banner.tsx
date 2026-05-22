'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

interface QuotaBannerProps {
    used: number;
    total: number;
    reached: boolean;
}

export function QuotaBanner({ used, total, reached }: QuotaBannerProps) {
    return (
        <div className="border-lumiris-amber/40 bg-lumiris-amber/10 text-foreground flex items-start gap-3 rounded-xl border p-4">
            <AlertTriangle className="text-lumiris-amber mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <div className="text-sm">
                <p className="font-medium">
                    {reached
                        ? `Quota atteint — ${used} / ${total} passeports.`
                        : `Quota presque atteint — ${used} / ${total} passeports.`}
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                    {reached
                        ? 'Vous ne pouvez plus publier de nouveau passeport. '
                        : 'Pensez à passer au palier supérieur depuis votre '}
                    <Link href="/subscription" className="text-foreground underline underline-offset-2">
                        abonnement
                    </Link>
                    {reached ? ' ou supprimez des passeports inactifs.' : '.'}
                </p>
            </div>
        </div>
    );
}
