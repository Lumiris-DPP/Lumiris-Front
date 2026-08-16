'use client';

import { Ruler } from 'lucide-react';
import type { SizeMeasurement } from '@lumiris/api-client';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@lumiris/ui/components/sheet';
import { formatMillimeters, pivotSizeGuide } from '@lumiris/utils';

interface SizeGuideSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    measurements: readonly SizeMeasurement[];
}

export function SizeGuideSheet({ open, onOpenChange, measurements }: SizeGuideSheetProps) {
    const grid = pivotSizeGuide(measurements);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                className="mx-auto max-h-[80vh] max-w-md overflow-y-auto rounded-t-3xl px-6 pt-6 pb-[max(env(safe-area-inset-bottom),1.5rem)]"
            >
                <SheetHeader className="px-0 text-left">
                    <SheetTitle className="flex items-center gap-2 text-base">
                        <Ruler className="h-4 w-4 text-primary" strokeWidth={1.5} aria-hidden />
                        Guide des tailles
                    </SheetTitle>
                    <SheetDescription className="text-xs">
                        Mesures relevées à plat par l&apos;atelier. Aucun standard industriel ne s&apos;applique à une
                        pièce faite main — compare-les à un vêtement que tu portes déjà.
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/60 text-left">
                                <th scope="col" className="py-2 pr-3 text-xs font-semibold text-muted-foreground">
                                    Taille
                                </th>
                                {grid.labels.map((label) => (
                                    <th
                                        key={label}
                                        scope="col"
                                        className="py-2 pr-3 text-xs font-semibold text-muted-foreground"
                                    >
                                        {label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {grid.rows.map((row) => (
                                <tr key={row.sizeLabel} className="border-b border-border/40 last:border-b-0">
                                    <th scope="row" className="py-2 pr-3 text-left font-semibold text-foreground">
                                        {row.sizeLabel}
                                    </th>
                                    {row.values.map((value, index) => (
                                        <td key={index} className="py-2 pr-3 text-foreground tabular-nums">
                                            {value == null ? '—' : formatMillimeters(value)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </SheetContent>
        </Sheet>
    );
}
