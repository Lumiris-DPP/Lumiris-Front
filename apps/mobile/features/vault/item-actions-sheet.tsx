'use client';

import { useRouter } from 'next/navigation';
import {
    Armchair,
    BatteryCharging,
    Puzzle,
    Refrigerator,
    ScanQrCode,
    Scissors,
    Shirt,
    Smartphone,
    Trash2,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@lumiris/ui/components/sheet';
import { removeFromWardrobe, type WardrobeSector } from '@/lib/wardrobe-storage';

interface VaultActionTarget {
    kind: 'scored' | 'manual';
    key: string;
    label: string;
    sublabel: string;
    sector: WardrobeSector;
    passport?: { id: string };
}

interface ItemActionsSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    target: VaultActionTarget | null;
}

const SECTOR_ICON: Record<WardrobeSector, typeof Shirt> = {
    textile: Shirt,
    electronics: Smartphone,
    appliance: Refrigerator,
    furniture: Armchair,
    toy: Puzzle,
    battery: BatteryCharging,
};

export function ItemActionsSheet({ open, onOpenChange, target }: ItemActionsSheetProps) {
    const router = useRouter();

    if (!target) return null;

    const close = () => onOpenChange(false);

    const onRescan = () => {
        close();
        router.push('/');
    };

    const onRemove = () => {
        removeFromWardrobe(target.key);
        close();
    };

    const onFindRetoucheur = () => {
        if (!target.passport) return;
        close();
        router.push(`/local?for=${encodeURIComponent(target.passport.id)}`);
    };

    const Icon = SECTOR_ICON[target.sector];
    const isScored = target.kind === 'scored';

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="mx-auto max-h-[85vh] max-w-md overflow-y-auto rounded-t-2xl pb-8">
                <SheetHeader className="pb-3 pt-5">
                    <SheetTitle className="text-foreground text-base">Que veux-tu faire ?</SheetTitle>
                </SheetHeader>

                <div className="flex flex-col gap-4 px-4">
                    <header className="border-border bg-card flex items-center gap-3 rounded-2xl border p-3">
                        <span className="bg-secondary/60 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
                            <Icon className="text-muted-foreground/60 h-5 w-5" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-foreground truncate text-sm font-semibold">{target.label}</p>
                            <p className="text-muted-foreground truncate text-xs">{target.sublabel}</p>
                        </div>
                    </header>

                    <ul className="flex flex-col gap-2">
                        {isScored ? <ActionRow Icon={ScanQrCode} label="Re-scanner" onClick={onRescan} /> : null}
                        {isScored ? (
                            <ActionRow Icon={Scissors} label="Trouver un retoucheur" onClick={onFindRetoucheur} />
                        ) : null}
                        <ActionRow Icon={Trash2} label="Retirer de l'inventaire" onClick={onRemove} tone="danger" />
                    </ul>
                </div>
            </SheetContent>
        </Sheet>
    );
}

interface ActionRowProps {
    Icon: typeof ScanQrCode;
    label: string;
    onClick: () => void;
    tone?: 'default' | 'danger';
}

function ActionRow({ Icon, label, onClick, tone = 'default' }: ActionRowProps) {
    const danger = tone === 'danger';
    return (
        <li>
            <button
                type="button"
                onClick={onClick}
                className={
                    danger
                        ? 'border-lumiris-rose/30 bg-lumiris-rose/5 hover:bg-lumiris-rose/10 text-lumiris-rose flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors'
                        : 'border-border bg-card hover:bg-muted/40 text-foreground flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors'
                }
            >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
            </button>
        </li>
    );
}
