'use client';

import { Loader2 } from 'lucide-react';
import { useStartDraft } from '@/lib/use-start-draft';

export default function CreateEntryPage() {
    useStartDraft();

    return (
        <div className="text-muted-foreground flex items-center gap-2 p-12 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Création d&apos;un nouveau brouillon…
        </div>
    );
}
