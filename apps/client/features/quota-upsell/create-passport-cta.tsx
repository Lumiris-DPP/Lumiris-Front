'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '@lumiris/ui/components/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@lumiris/ui/components/dialog';
import { useSubscription } from '@/lib/use-subscription';

interface CreatePassportCtaProps {
    children: ReactNode;
    className?: string;
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'sm' | 'default' | 'lg' | 'icon';
}

// Gates passport creation on the live quota; when blocked, opens an upsell dialog.
export function CreatePassportCta({ children, className, variant, size }: CreatePassportCtaProps) {
    const router = useRouter();
    const { quota, isRealMode, isLoading } = useSubscription();
    const [open, setOpen] = useState(false);

    const canCreate = !isRealMode || isLoading || quota?.canCreate === true;

    if (canCreate) {
        return (
            <Button asChild className={className} variant={variant} size={size}>
                <Link href="/create">{children}</Link>
            </Button>
        );
    }

    const quotaExceeded = quota?.reason === 'QUOTA_EXCEEDED';
    const title = quotaExceeded ? 'Quota de passeports atteint' : 'Abonnement ATELIER requis';
    const description = quotaExceeded
        ? `${quota?.used} / ${quota?.limit} passeports actifs. Passez au palier supérieur pour en créer davantage.`
        : 'Souscrivez un palier ATELIER pour créer et publier vos passeports produit.';

    return (
        <>
            <Button type="button" onClick={() => setOpen(true)} className={className} variant={variant} size={size}>
                {children}
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>{description}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Plus tard
                        </Button>
                        <Button
                            onClick={() => {
                                setOpen(false);
                                router.push('/subscription');
                            }}
                            className="bg-lumiris-cyan hover:bg-lumiris-cyan/90 text-white"
                        >
                            Voir les offres
                            <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
